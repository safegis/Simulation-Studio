// SafeGIS\Simulation-Studio\frontend\src\components\controls\SafeGIS AI\Agent Functions\Control Hazard Layers\Toggle-VolcanoList.tsx
"use client";
import type { RefObject } from "react";

/* -------- Types -------- */
type MapRefLike = {
  current: any | null;
};

type VolcanoControlCallbacks = {
  enableVolcanoList: () => void;
  disableVolcanoList: () => void;
  isVolcanoListEnabled: () => boolean;
};

/* -------- Intent Detection -------- */
function detectVolcanoListIntent(
  prompt: string
): "enable" | "disable" | "toggle" | null {
  const text = prompt.toLowerCase().trim();

  // Disable patterns - check these FIRST to prioritize disable commands
  const disablePatterns = [
    /disable\s+volcano/i,
    /hide\s+volcano/i,
    /turn\s+off\s+volcano/i,
    /remove\s+volcano/i,
    /deactivate\s+volcano/i,
    /clear\s+volcano/i,
    /turn\s+volcano\s+off/i,
    /volcano.*off/i,
    /volcano.*hide/i,
    /volcano.*disable/i,
    /volcano\s+list.*off/i,
    /volcano\s+list.*hide/i,
    /volcano\s+list.*disable/i,
  ];

  // Enable patterns
  const enablePatterns = [
    /enable\s+volcano/i,
    /show\s+volcano/i,
    /display\s+volcano/i,
    /turn\s+on\s+volcano/i,
    /activate\s+volcano/i,
    /add\s+volcano/i,
    /see\s+volcano/i,
    /view\s+volcano/i,
    /volcano\s+on\s+map/i,
    /volcano\s+in\s+the\s+map/i,
    /volcano\s+layer/i,
    /volcano\s+data/i,
    /volcano\s+list/i,
    /volcanic\s+activity/i,
  ];

  // Toggle patterns
  const togglePatterns = [/toggle\s+volcano/i, /switch\s+volcano/i];

  // Check for disable patterns FIRST
  if (disablePatterns.some((pattern) => pattern.test(text))) {
    console.log("Detected disable intent for volcano list:", text); // Debug log
    return "disable";
  }

  // Check for enable patterns
  if (enablePatterns.some((pattern) => pattern.test(text))) {
    console.log("Detected enable intent for volcano list:", text); // Debug log
    return "enable";
  }

  // Check for toggle patterns
  if (togglePatterns.some((pattern) => pattern.test(text))) {
    console.log("Detected toggle intent for volcano list:", text); // Debug log
    return "toggle";
  }

  console.log("No volcano list intent detected for:", text); // Debug log
  return null;
}

/* -------- Fetch volcano data -------- */
const fetchVolcanoData = async () => {
  try {
    const res = await fetch("http://localhost:8000/hazards/volcanoes");
    if (!res.ok) {
      throw new Error(`Failed to fetch volcano data: ${res.status}`);
    }
    const data = await res.json();
    return data;
  } catch (err) {
    console.error("Error fetching volcano data:", err);
    throw err;
  }
};

/* -------- Main Agent Function -------- */
export async function runVolcanoListAgent(
  prompt: string,
  mapRef: MapRefLike,
  callbacks: VolcanoControlCallbacks,
  pushMessage: (role: "assistant" | "user", content: string) => void
): Promise<boolean> {
  try {
    const intent = detectVolcanoListIntent(prompt);
    if (!intent) {
      return false; // Not a volcano list request
    }

    let action: "enable" | "disable";
    if (intent === "toggle") {
      action = callbacks.isVolcanoListEnabled() ? "disable" : "enable";
    } else {
      action = intent;
    }

    // Check if already in requested state
    const isCurrentlyEnabled = callbacks.isVolcanoListEnabled();
    console.log("Volcano List Agent Debug:", {
      intent,
      action,
      isCurrentlyEnabled,
    }); // Debug log

    if (action === "enable" && isCurrentlyEnabled) {
      pushMessage("assistant", "Volcano list is already enabled.");
      return true;
    }

    if (action === "disable" && !isCurrentlyEnabled) {
      pushMessage("assistant", "Volcano list is already disabled.");
      return true;
    }

    if (action === "enable") {
      pushMessage("assistant", "Enabling volcano list...");
      try {
        // Fetch and display volcano data
        const volcanoData = await fetchVolcanoData();
        mapRef.current?.drawVolcanoDots(volcanoData);

        // Update UI state
        callbacks.enableVolcanoList();

        pushMessage(
          "assistant",
          `✅ **Volcano list enabled**\n\nShowing ${
            volcanoData.length || 0
          } volcanoes on the map. The volcano locations are now visible with detailed information about each volcanic site.`
        );
      } catch (err) {
        pushMessage(
          "assistant",
          "❌ Failed to enable volcano list. Please check your connection and try again."
        );
        console.error("Error enabling volcano list:", err);
      }
    } else {
      pushMessage("assistant", "Disabling volcano list...");

      // Clear volcano data from map
      mapRef.current?.drawVolcanoDots([]);

      // Update UI state
      callbacks.disableVolcanoList();

      pushMessage(
        "assistant",
        "✅ **Volcano list disabled**\n\nVolcano markers have been removed from the map."
      );
    }

    return true; // Successfully handled
  } catch (err: any) {
    console.error("runVolcanoListAgent error:", err);
    pushMessage(
      "assistant",
      `Error managing volcano list: ${err?.message || String(err)}`
    );
    return true; // Still handled, even if failed
  }
}

/* -------- Export default object -------- */
export default {
  runVolcanoListAgent,
  detectVolcanoListIntent,
};
