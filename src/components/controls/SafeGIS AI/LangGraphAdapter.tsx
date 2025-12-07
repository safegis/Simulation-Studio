// LangGraphAdapter.tsx
// Adapter to connect LangGraph backend with frontend UI

export interface LangGraphMessage {
  role: "user" | "assistant" | "system";
  content: string;
}

export interface LangGraphResponse {
  response: {
    tool?: string;
    action?: string;
    query?: string;
    style?: string;
    mode?: string;
    preset?: string;
    direction?: string;
    amount?: number;
    is_max?: boolean;
    source?: string;
    scope?: string;
    province?: string;
    text?: string;
    type?: string;
    question?: string;
    options?: string[];
    requires_frontend?: boolean;
    requires_clarification?: boolean;
    multiple_actions?: any[];
    info_message?: string;
    also_enable?: {
      tool?: string;
      action?: string;
      source?: string;
      scope?: string;
    };
    has_citations?: boolean;
    search_results?: Array<{
      number: number;
      title: string;
      url: string;
      author?: string;
      published_date?: string;
    }>;
    // Exposure assessment fields
    hazard_source?: "existing" | "imported";
    hazard_data?: string[];
    element_source?: "existing" | "imported";
    element_data?: string[];
  };
  requires_frontend: boolean;
  requires_clarification: boolean;
  conversation_history: LangGraphMessage[];
}

export interface MapCallbacks {
  // Location search
  searchLocation: (query: string) => Promise<void>;

  // Map style
  changeMapStyle: (style: string) => void;

  // View mode
  switchViewMode: (mode: "2d" | "3d", style?: string) => void;

  // Time of day control
  controlTimeOfDay: (preset: string) => void;

  // Zoom control
  controlZoom: (
    direction: "in" | "out",
    amount: number,
    isMax: boolean
  ) => void;

  // Get current map style (for passing to view mode switches)
  getCurrentMapStyle: () => string;

  // Earthquake control
  controlEarthquake: (
    action: "enable" | "disable",
    source: "philippine" | "global"
  ) => void;

  // Weather control
  controlWeather: (
    action: "enable" | "disable",
    scope: string,
    province?: string
  ) => void;

  // Exposure assessment control
  controlExposureAssessment: (
    action: "run" | "clear" | "select_hazard" | "select_element",
    params?: {
      hazard_source?: "existing" | "imported";
      hazard_data?: string[];
      element_source?: "existing" | "imported";
      element_data?: string[];
    }
  ) => void;
}

/**
 * Map style names from backend format to frontend format
 */
const STYLE_MAP: Record<string, string> = {
  default: "Default (Custom Mapbox Standard)",
  satellite: "Satellite (Mapbox)",
  outdoors: "Outdoors (Mapbox)",
  light: "Light (Mapbox)",
  dark: "Dark (Mapbox)",
  navigation_day: "Navigation Day (Mapbox)",
  navigation_night: "Navigation Night (Mapbox)",
};

/**
 * Process LangGraph response and execute frontend actions
 */
export async function processLangGraphResponse(
  response: LangGraphResponse,
  callbacks: MapCallbacks,
  addMessage: (
    role: "user" | "assistant",
    content: string,
    citations?: any[]
  ) => void
): Promise<boolean> {
  const {
    response: data,
    requires_frontend,
    requires_clarification,
  } = response;

  // Handle clarification requests
  if (requires_clarification || data.type === "clarification") {
    const question = data.question || "I need more information.";
    const options = data.options || [];

    addMessage(
      "assistant",
      `${question}\n\n${options.map((opt, i) => `${i + 1}. ${opt}`).join("\n")}`
    );
    return true;
  }

  // Handle options list
  if (data.type === "options_list") {
    const options = data.options || [];
    addMessage(
      "assistant",
      "Here are all available options:\n\n" +
        options.map((opt, i) => `• ${opt}`).join("\n")
    );
    return true;
  }

  // Handle text responses (Q&A)
  if (data.text && !requires_frontend) {
    addMessage("assistant", data.text, data.search_results);
    return true;
  }

  // Handle multiple actions
  if (requires_frontend && data.multiple_actions) {
    try {
      const actions = data.multiple_actions as any[];
      let lastStyleChange: string | null = null;

      for (let i = 0; i < actions.length; i++) {
        const action = actions[i];

        // Track style changes for subsequent view mode switches
        if (action.tool === "change_map_style" && action.style) {
          lastStyleChange = STYLE_MAP[action.style] || action.style;
        }

        // If switching view mode after a style change, pass the new style
        if (action.tool === "switch_view_mode" && lastStyleChange) {
          action._pendingStyle = lastStyleChange;
        }

        await processLangGraphResponse(
          {
            response: action,
            requires_frontend: true,
            requires_clarification: false,
            conversation_history: response.conversation_history,
          },
          callbacks,
          addMessage
        );

        // Add delay after map style change or view mode switch to allow map to reinitialize
        if (
          (action.tool === "change_map_style" ||
            action.tool === "switch_view_mode") &&
          i < actions.length - 1
        ) {
          // Longer delay for style changes to ensure state updates and style loads
          const delay = action.tool === "change_map_style" ? 1000 : 500;
          await new Promise((resolve) => setTimeout(resolve, delay));
        }
      }
      // Show info message if present
      if (data.info_message) {
        addMessage("assistant", `ℹ️ ${data.info_message}`);
      }
      return true;
    } catch (error) {
      console.error("Error executing multiple actions:", error);
      addMessage("assistant", `❌ Failed to execute actions: ${error}`);
      return false;
    }
  }

  // Handle frontend actions
  if (requires_frontend && data.tool) {
    try {
      switch (data.tool) {
        case "search_location":
          if (data.query) {
            await callbacks.searchLocation(data.query);
            addMessage("assistant", `✅ Searching for: **${data.query}**`);
          }
          break;

        case "change_map_style":
          if (data.style) {
            const frontendStyle = STYLE_MAP[data.style] || data.style;
            callbacks.changeMapStyle(frontendStyle);
            addMessage(
              "assistant",
              `✅ **Map style changed to ${frontendStyle}**\n\nThe map style has been updated.`
            );
          }
          break;

        case "switch_view_mode":
          if (data.mode) {
            // If there's a pending style from a previous action, use it
            const styleToUse =
              (data as any)._pendingStyle || callbacks.getCurrentMapStyle();
            callbacks.switchViewMode(data.mode as "2d" | "3d", styleToUse);
            let message = `✅ **Map switched to ${data.mode.toUpperCase()} mode**\n\nThe view mode has been updated.`;
            if (data.info_message) {
              message += `\n\nℹ️ ${data.info_message}`;
            }
            addMessage("assistant", message);
          }
          break;

        case "control_time_of_day":
          if (data.preset) {
            const presetCapitalized =
              data.preset.charAt(0).toUpperCase() + data.preset.slice(1);
            callbacks.controlTimeOfDay(presetCapitalized);
            addMessage(
              "assistant",
              `✅ **Time of day set to ${presetCapitalized}**\n\nThe lighting has been updated.`
            );
          }
          break;

        case "control_zoom":
          if (data.direction) {
            const isMax = data.is_max || false;
            const amount = data.amount || 1.0;
            callbacks.controlZoom(
              data.direction as "in" | "out",
              amount,
              isMax
            );

            if (isMax) {
              addMessage(
                "assistant",
                `✅ **Zoomed ${
                  data.direction
                } to maximum**\n\nThe map has been zoomed to the ${
                  data.direction === "in" ? "closest" : "farthest"
                } level.`
              );
            } else {
              const percentage = Math.round(amount * 100);
              addMessage(
                "assistant",
                `✅ **Zoomed ${data.direction} by ${percentage}%**\n\nThe map zoom has been adjusted.`
              );
            }
          }
          break;

        case "control_earthquake_data":
          if (data.action && data.source) {
            callbacks.controlEarthquake(
              data.action as "enable" | "disable",
              data.source as "philippine" | "global"
            );
            const sourceName =
              data.source === "philippine"
                ? "Philippine (PHIVOLCS)"
                : "Global (USGS)";

            // Check if we need to enable/disable a second source
            if (data.also_enable) {
              callbacks.controlEarthquake(
                data.also_enable.action as "enable" | "disable",
                data.also_enable.source as "philippine" | "global"
              );
              const actionText =
                data.action === "enable" ? "Enabled" : "Disabled";
              addMessage(
                "assistant",
                `✅ **${actionText} both Philippine (PHIVOLCS) and Global (USGS) earthquake data**\n\nEarthquake monitoring has been updated.`
              );
            } else {
              addMessage(
                "assistant",
                `✅ **${
                  data.action === "enable" ? "Enabled" : "Disabled"
                } ${sourceName} earthquake data**\n\nEarthquake monitoring has been updated.`
              );
            }
          }
          break;

        case "control_weather_data":
          if (data.action && data.scope) {
            callbacks.controlWeather(
              data.action as "enable" | "disable",
              data.scope as string,
              data.province as string | undefined
            );

            let scopeDescription = data.scope;
            if (data.province) {
              scopeDescription = `${data.province} city`;
            } else if (data.scope === "all") {
              scopeDescription = "all available";
            } else if (data.scope === "all_cities") {
              scopeDescription = "all city";
            }

            addMessage(
              "assistant",
              `✅ **${
                data.action === "enable" ? "Enabled" : "Disabled"
              } ${scopeDescription}-level weather data**\n\nWeather monitoring has been updated.`
            );
          }
          break;

        case "control_exposure_assessment":
        case "run_exposure_analysis":
          if (data.action) {
            callbacks.controlExposureAssessment(
              data.action as
                | "run"
                | "clear"
                | "select_hazard"
                | "select_element",
              {
                hazard_source: data.hazard_source as "existing" | "imported",
                hazard_data: data.hazard_data as string[],
                element_source: data.element_source as "existing" | "imported",
                element_data: data.element_data as string[],
              }
            );

            let message = "";
            if (data.action === "run") {
              message =
                "✅ **Running exposure assessment analysis**\n\nThe analysis is being processed...";
            } else if (data.action === "clear") {
              message =
                "✅ **Cleared exposure assessment steps**\n\nYou can start a new assessment.";
            } else if (data.action === "select_hazard") {
              message = `✅ **Selected hazard data**\n\nHazard data has been configured for the assessment.`;
            } else if (data.action === "select_element") {
              message = `✅ **Selected exposure elements**\n\nExposure elements have been configured for the assessment.`;
            }
            addMessage("assistant", message);
          }
          break;

        default:
          addMessage(
            "assistant",
            `I received an action: ${data.tool}, but I'm not sure how to execute it yet.`
          );
      }
      return true;
    } catch (error) {
      console.error("Error executing frontend action:", error);
      addMessage("assistant", `❌ Failed to execute action: ${error}`);
      return false;
    }
  }

  // Fallback
  addMessage(
    "assistant",
    "I processed your request, but I'm not sure what to do next."
  );
  return false;
}

/**
 * Send message to LangGraph backend
 */
export async function sendToLangGraph(
  message: string,
  conversationHistory: LangGraphMessage[] = [],
  mapState: Record<string, any> = {},
  webSearchEnabled: boolean = false,
  uploadedFiles: string[] = []
): Promise<LangGraphResponse> {
  const endpoint = process.env.NEXT_PUBLIC_MODEL_ENDPOINT?.replace(
    "/generate",
    "/chat"
  );

  if (!endpoint) {
    throw new Error("NEXT_PUBLIC_MODEL_ENDPOINT not configured");
  }

  const response = await fetch(endpoint, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      message,
      conversation_history: conversationHistory,
      map_state: mapState,
      web_search_enabled: webSearchEnabled,
      uploaded_files: uploadedFiles,
    }),
  });

  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }

  return await response.json();
}

export default {
  processLangGraphResponse,
  sendToLangGraph,
  STYLE_MAP,
};
