// SafeGIS\Simulation-Studio\frontend\src\components\controls\SafeGIS AI\Agent Functions\EarthquakeHazardAgent.tsx
"use client";
import type { RefObject } from "react";

/* -------- Types -------- */
type MapRefLike = {
  current: any | null;
};

type EarthquakeControlCallbacks = {
  enableEarthquakeHazard: () => void;
  disableEarthquakeHazard: () => void;
  isEarthquakeEnabled: () => boolean;
  stopEarthquakePolling?: () => void;
};

/* -------- Intent Detection -------- */
function detectEarthquakeHazardIntent(
  prompt: string
): "enable" | "disable" | "toggle" | null {
  const text = prompt.toLowerCase().trim();

  // Disable patterns - check these FIRST to prioritize disable commands
  const disablePatterns = [
    /disable\s+earthquake/i,
    /hide\s+earthquake/i,
    /turn\s+off\s+earthquake/i,
    /remove\s+earthquake/i,
    /deactivate\s+earthquake/i,
    /clear\s+earthquake/i,
    /turn\s+earthquake\s+off/i,
    /earthquake.*off/i,
    /earthquake.*hide/i,
    /earthquake.*disable/i,
  ];

  // Enable patterns
  const enablePatterns = [
    /enable\s+earthquake/i,
    /show\s+earthquake/i,
    /display\s+earthquake/i,
    /turn\s+on\s+earthquake/i,
    /activate\s+earthquake/i,
    /add\s+earthquake/i,
    /earthquake\s+hazard/i,
    /see\s+earthquake/i,
    /view\s+earthquake/i,
    /earthquake\s+on\s+map/i,
    /earthquake\s+in\s+the\s+map/i,
    /earthquake\s+layer/i,
    /earthquake\s+data/i,
    /seismic\s+activity/i,
    /quake\s+data/i,
  ];

  // Toggle patterns
  const togglePatterns = [/toggle\s+earthquake/i, /switch\s+earthquake/i];

  // Check for disable patterns FIRST
  if (disablePatterns.some((pattern) => pattern.test(text))) {
    console.log("Detected disable intent for:", text); // Debug log
    return "disable";
  }

  // Check for enable patterns
  if (enablePatterns.some((pattern) => pattern.test(text))) {
    console.log("Detected enable intent for:", text); // Debug log
    return "enable";
  }

  // Check for toggle patterns
  if (togglePatterns.some((pattern) => pattern.test(text))) {
    console.log("Detected toggle intent for:", text); // Debug log
    return "toggle";
  }

  console.log("No earthquake intent detected for:", text); // Debug log
  return null;
}

/* -------- Combined fetch function for earthquake data -------- */
const fetchCombinedEarthquakeData = async () => {
  try {
    const baseUrl = process.env.NEXT_PUBLIC_BACKEND_ENDPOINT;
    if (!baseUrl) {
      throw new Error(
        "Backend endpoint is not configured in environment variables."
      );
    }

    // Fetch USGS data
    const resUSGS = await fetch(`${baseUrl}/hazards/earthquakes`);
    const dataUSGS = await resUSGS.json();

    // Fetch scraper data
    const resScraper = await fetch(`${baseUrl}/earthquakes/latest`);
    const dataScraper = await resScraper.json();

    // Convert scraper's earthquakes to GeoJSON-like features with fixed parsing
    const scraperFeatures = (dataScraper.earthquakes || []).map(
      (quake: any) => {
        const mag = parseFloat(quake.Magnitude);
        const depth = parseFloat(quake["Depth (km)"]);
        // Parse datetime string "10 August 2024 - 06:03 AM" to timestamp (ms)
        let time = Date.parse(quake["Date & Time (PHT)"].replace(" - ", " "));
        if (isNaN(time)) {
          time = Date.now();
        }

        return {
          type: "Feature",
          properties: {
            mag: isNaN(mag) ? null : mag,
            time: time,
            place: quake.Location || "Unknown location",
          },
          geometry: {
            type: "Point",
            coordinates: [
              parseFloat(quake["Longitude (°E)"]) || 0,
              parseFloat(quake["Latitude (°N)"]) || 0,
              isNaN(depth) ? null : depth,
            ],
          },
        };
      }
    );

    // Combine features arrays
    const combinedFeatures = [...(dataUSGS.features || []), ...scraperFeatures];

    return combinedFeatures;
  } catch (err) {
    console.error("Error fetching combined earthquake data:", err);
    return [];
  }
};

/* -------- Main Agent Function -------- */
type ExtendedCallbacks = EarthquakeControlCallbacks & {
  openToolPanel?: () => void;
  selectHazardLayers?: () => void;
  expandHazardLayersDropdown?: () => void;
  expandGeologicalDropdown?: () => void;
};

export async function runEarthquakeHazardAgent(
  prompt: string,
  mapRef: MapRefLike,
  callbacks: ExtendedCallbacks,
  pushMessage: (role: "assistant" | "user", content: string) => void
): Promise<boolean> {
  try {
    const intent = detectEarthquakeHazardIntent(prompt);
    if (!intent) {
      return false; // Not an earthquake hazard request
    }

    let action: "enable" | "disable";
    if (intent === "toggle") {
      action = callbacks.isEarthquakeEnabled() ? "disable" : "enable";
    } else {
      action = intent;
    }

    // Check if already in requested state
    const isCurrentlyEnabled = callbacks.isEarthquakeEnabled();
    console.log("Earthquake Agent Debug:", {
      intent,
      action,
      isCurrentlyEnabled,
    }); // Debug log

    if (action === "enable" && isCurrentlyEnabled) {
      pushMessage("assistant", "Earthquake hazard layer is already enabled.");
      return true;
    }

    if (action === "disable" && !isCurrentlyEnabled) {
      pushMessage("assistant", "Earthquake hazard layer is already disabled.");
      return true;
    }

    if (action === "enable") {
      pushMessage("assistant", "Enabling earthquake hazard layer...");

      try {
        // Important: Set the geological expanded state first
        callbacks.expandGeologicalDropdown?.();
        // Then open tool panel and expand other dropdowns
        callbacks.openToolPanel?.();
        callbacks.selectHazardLayers?.();
        callbacks.expandHazardLayersDropdown?.();

        const combinedFeatures = await fetchCombinedEarthquakeData();
        mapRef.current?.drawEarthquakeDots(combinedFeatures);
        callbacks.enableEarthquakeHazard();
        pushMessage(
          "assistant",
          `✅ **Earthquake hazard layer enabled**\n\nShowing ${combinedFeatures.length} earthquake events on the map. The layer will automatically update with new seismic data every minute.`
        );
      } catch (err) {
        pushMessage(
          "assistant",
          "❌ Failed to enable earthquake hazard layer. Please check your connection and try again."
        );
        console.error("Error enabling earthquake hazards:", err);
      }
    } else {
      pushMessage("assistant", "Disabling earthquake hazard layer...");

      // Clear earthquake data from map
      mapRef.current?.drawEarthquakeDots([]);

      // Stop polling if available
      callbacks.stopEarthquakePolling?.();

      // Update UI state
      callbacks.disableEarthquakeHazard();

      pushMessage(
        "assistant",
        "**Earthquake hazard layer disabled**\n\nEarthquake events have been cleared from the map and automatic refresh has been stopped."
      );
    }

    return true; // Successfully handled
  } catch (err: any) {
    console.error("runEarthquakeHazardAgent error:", err);
    pushMessage(
      "assistant",
      `Error managing earthquake hazard layer: ${err?.message || String(err)}`
    );
    return true; // Still handled, even if failed
  }
}

/* -------- Export default object -------- */
export default {
  runEarthquakeHazardAgent,
  detectEarthquakeHazardIntent,
};
