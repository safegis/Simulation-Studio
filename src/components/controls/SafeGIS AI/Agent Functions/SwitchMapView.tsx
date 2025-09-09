"use client";

import type { RefObject } from "react";

/* -------- Types -------- */
type MapRefLike = {
  current: any | null;
};

type ViewSwitchCallbacks = {
  switchTo2D: () => void;
  switchTo3D: () => void;
  setViewMode: (mode: "2d" | "3d") => void;
};

/* -------- Intent Detection -------- */
function detectViewSwitchIntent(prompt: string): "2d" | "3d" | null {
  const text = prompt.toLowerCase().trim();

  // 2D patterns
  const patterns2D = [
    /switch\s+to\s+2d/i,
    /change\s+to\s+2d/i,
    /go\s+to\s+2d/i,
    /set\s+to\s+2d/i,
    /enable\s+2d/i,
    /use\s+2d/i,
    /show\s+2d/i,
    /2d\s+mode/i,
    /2d\s+view/i,
    /flat\s+view/i,
    /top\s+down\s+view/i,
    /bird\s+eye\s+view/i,
    /switch.*2d/i,
    /change.*2d/i,
  ];

  // 3D patterns
  const patterns3D = [
    /switch\s+to\s+3d/i,
    /change\s+to\s+3d/i,
    /go\s+to\s+3d/i,
    /set\s+to\s+3d/i,
    /enable\s+3d/i,
    /use\s+3d/i,
    /show\s+3d/i,
    /3d\s+mode/i,
    /3d\s+view/i,
    /perspective\s+view/i,
    /three\s+dimensional/i,
    /switch.*3d/i,
    /change.*3d/i,
  ];

  // Check for 2D patterns
  if (patterns2D.some((pattern) => pattern.test(text))) {
    return "2d";
  }

  // Check for 3D patterns
  if (patterns3D.some((pattern) => pattern.test(text))) {
    return "3d";
  }

  return null;
}

/* -------- Main Agent Function -------- */
export async function runViewSwitchAgent(
  prompt: string,
  mapRef: MapRefLike,
  callbacks: ViewSwitchCallbacks,
  pushMessage: (role: "assistant" | "user", content: string) => void,
  currentViewMode: "2d" | "3d"
): Promise<boolean> {
  try {
    const intent = await detectViewSwitchIntent(prompt);

    if (!intent) {
      return false; // Not a view switch request
    }

    // Check if already in requested mode
    if (intent === currentViewMode) {
      pushMessage(
        "assistant",
        `The map is already in ${intent.toUpperCase()} mode.`
      );
      return true;
    }

    pushMessage(
      "assistant",
      `Switching map to ${intent.toUpperCase()} mode...`
    );

    // Execute the switch
    if (intent === "2d") {
      // Switch to 2D
      callbacks.switchTo2D();
      callbacks.setViewMode("2d");

      // Update map if ref is available
      if (mapRef?.current?.switchTo2D) {
        mapRef.current.switchTo2D();
      }

      pushMessage(
        "assistant",
        "✅ **Map switched to 2D mode**\n\nYou're now viewing the map in top-down perspective with enhanced readability for navigation and planning."
      );
    } else {
      // Switch to 3D
      callbacks.switchTo3D();
      callbacks.setViewMode("3d");

      // Update map if ref is available
      if (mapRef?.current?.switchTo3D) {
        mapRef.current.switchTo3D();
      }

      pushMessage(
        "assistant",
        "✅ **Map switched to 3D mode**\n\nYou're now viewing the map in three-dimensional perspective with terrain elevation and realistic lighting effects."
      );
    }

    return true; // Successfully handled
  } catch (err: any) {
    console.error("runViewSwitchAgent error:", err);
    pushMessage(
      "assistant",
      `Error switching view mode: ${err?.message || String(err)}`
    );
    return true; // Still handled, even if failed
  }
}

/* -------- Export default object -------- */
export default {
  runViewSwitchAgent,
  detectViewSwitchIntent,
};
