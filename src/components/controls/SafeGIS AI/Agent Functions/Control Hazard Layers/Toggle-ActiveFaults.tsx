// SafeGIS\Simulation-Studio\frontend\src\components\controls\SafeGIS AI\Agent Functions\Control Hazard Layers\Toggle-ActiveFaults.tsx
"use client";
import type { RefObject } from "react";

/* -------- Types -------- */
type MapRefLike = {
  current: any | null;
};

type ActiveFaultsControlCallbacks = {
  enableActiveFaults: () => void;
  disableActiveFaults: () => void;
  isActiveFaultsEnabled: () => boolean;
  openToolPanel?: () => void;
  selectHazardLayers?: () => void;
  expandHazardLayersDropdown?: () => void;
  expandGeologicalDropdown?: () => void;
};

/* -------- Intent Detection -------- */
function detectActiveFaultsIntent(
  prompt: string
): "enable" | "disable" | "toggle" | null {
  const text = prompt.toLowerCase().trim();

  // Disable patterns - check these FIRST to prioritize disable commands
  const disablePatterns = [
    /disable\s+active\s+faults?/i,
    /hide\s+active\s+faults?/i,
    /turn\s+off\s+active\s+faults?/i,
    /remove\s+active\s+faults?/i,
    /deactivate\s+active\s+faults?/i,
    /clear\s+active\s+faults?/i,
    /turn\s+active\s+faults?\s+off/i,
    /active\s+faults?.*off/i,
    /active\s+faults?.*hide/i,
    /active\s+faults?.*disable/i,
    /fault\s+lines?.*off/i,
    /fault\s+lines?.*hide/i,
    /fault\s+lines?.*disable/i,
  ];

  // Enable patterns
  const enablePatterns = [
    /enable\s+active\s+faults?/i,
    /show\s+active\s+faults?/i,
    /display\s+active\s+faults?/i,
    /turn\s+on\s+active\s+faults?/i,
    /activate\s+active\s+faults?/i,
    /add\s+active\s+faults?/i,
    /see\s+active\s+faults?/i,
    /view\s+active\s+faults?/i,
    /active\s+faults?\s+on\s+map/i,
    /active\s+faults?\s+in\s+the\s+map/i,
    /active\s+faults?\s+layer/i,
    /active\s+faults?\s+data/i,
    /fault\s+lines?\s+on\s+map/i,
    /fault\s+lines?\s+in\s+the\s+map/i,
    /fault\s+lines?\s+layer/i,
    /fault\s+lines?\s+data/i,
    /geological\s+faults?/i,
    /seismic\s+faults?/i,
  ];

  // Toggle patterns
  const togglePatterns = [
    /toggle\s+active\s+faults?/i,
    /switch\s+active\s+faults?/i,
  ];

  // Check for disable patterns FIRST
  if (disablePatterns.some((pattern) => pattern.test(text))) {
    console.log("Detected disable intent for active faults:", text); // Debug log
    return "disable";
  }

  // Check for enable patterns
  if (enablePatterns.some((pattern) => pattern.test(text))) {
    console.log("Detected enable intent for active faults:", text); // Debug log
    return "enable";
  }

  // Check for toggle patterns
  if (togglePatterns.some((pattern) => pattern.test(text))) {
    console.log("Detected toggle intent for active faults:", text); // Debug log
    return "toggle";
  }

  console.log("No active faults intent detected for:", text); // Debug log
  return null;
}

/* -------- Fetch active faults data -------- */
const fetchActiveFaultsData = async () => {
  try {
    const res = await fetch("http://localhost:8000/hazards/active-faults");
    if (!res.ok) {
      throw new Error(`Failed to fetch active faults data: ${res.status}`);
    }
    const data = await res.json();
    return data;
  } catch (err) {
    console.error("Error fetching active faults data:", err);
    throw err;
  }
};

/* -------- Main Agent Function -------- */
export async function runActiveFaultsAgent(
  prompt: string,
  mapRef: MapRefLike,
  callbacks: ActiveFaultsControlCallbacks,
  pushMessage: (role: "assistant" | "user", content: string) => void
): Promise<boolean> {
  try {
    const intent = detectActiveFaultsIntent(prompt);
    if (!intent) {
      return false; // Not an active faults request
    }

    let action: "enable" | "disable";
    if (intent === "toggle") {
      action = callbacks.isActiveFaultsEnabled() ? "disable" : "enable";
    } else {
      action = intent;
    }

    // Check if already in requested state
    const isCurrentlyEnabled = callbacks.isActiveFaultsEnabled();
    console.log("Active Faults Agent Debug:", {
      intent,
      action,
      isCurrentlyEnabled,
    }); // Debug log

    if (action === "enable" && isCurrentlyEnabled) {
      pushMessage("assistant", "Active faults layer is already enabled.");
      return true;
    }

    if (action === "disable" && !isCurrentlyEnabled) {
      pushMessage("assistant", "Active faults layer is already disabled.");
      return true;
    }

    if (action === "enable") {
      pushMessage("assistant", "Enabling active faults layer...");
      try {
        // First, ensure geological section is expanded
        callbacks.expandGeologicalDropdown?.();

        // Small delay to ensure state updates
        await new Promise((resolve) => setTimeout(resolve, 100));

        // Then open tool panel and expand other dropdowns
        callbacks.openToolPanel?.();
        callbacks.selectHazardLayers?.();
        callbacks.expandHazardLayersDropdown?.();

        // Fetch and display active faults data
        const activeFaultsData = await fetchActiveFaultsData();
        mapRef.current?.drawActiveFaults(activeFaultsData);

        // Update UI state
        callbacks.enableActiveFaults();

        pushMessage(
          "assistant",
          `✅ **Active faults layer enabled**\n\nActive fault lines are now visible on the map. These represent known geological fault systems that have shown recent activity and pose potential seismic hazards.`
        );
      } catch (err) {
        pushMessage(
          "assistant",
          "❌ Failed to enable active faults layer. Please check your connection and try again."
        );
        console.error("Error enabling active faults:", err);
      }
    } else {
      pushMessage("assistant", "Disabling active faults layer...");

      // Clear active faults data from map
      mapRef.current?.drawActiveFaults(null);

      // Update UI state
      callbacks.disableActiveFaults();

      pushMessage(
        "assistant",
        "✅ **Active faults layer disabled**\n\nActive fault lines have been removed from the map."
      );
    }

    return true; // Successfully handled
  } catch (err: any) {
    console.error("runActiveFaultsAgent error:", err);
    pushMessage(
      "assistant",
      `Error managing active faults layer: ${err?.message || String(err)}`
    );
    return true; // Still handled, even if failed
  }
}

/* -------- Export default object -------- */
export default {
  runActiveFaultsAgent,
  detectActiveFaultsIntent,
};
