"use client";

import type { RefObject } from "react";

/* -------- Types -------- */
type MapRefLike = {
  current: any | null;
};

type MapStyleCallbacks = {
  handleMapStyleChange: (style: string) => void;
};

/* -------- Map Style Mappings -------- */
const MAP_STYLE_MAPPINGS: Record<string, string> = {
  default: "Default (Custom Mapbox Standard)",
  standard: "Default (Custom Mapbox Standard)",
  custom: "Default (Custom Mapbox Standard)",
  satellite: "Satellite (Mapbox)",
  outdoors: "Outdoors (Mapbox)",
  light: "Light (Mapbox)",
  dark: "Dark (Mapbox)",
  "navigation day": "Navigation Day (Mapbox)",
  "navigation night": "Navigation Night (Mapbox)",
};

/* -------- Intent Detection -------- */
function detectMapStyleIntent(prompt: string): string | null {
  const text = prompt.toLowerCase().trim();

  // Map style patterns
  const stylePatterns = [
    // Default/Standard patterns
    {
      patterns: [
        /switch.*default/i,
        /change.*default/i,
        /set.*default/i,
        /use.*default/i,
        /default.*style/i,
        /standard.*style/i,
        /custom.*style/i,
      ],
      style: "default",
    },

    // Satellite patterns
    {
      patterns: [
        /switch.*satellite/i,
        /change.*satellite/i,
        /set.*satellite/i,
        /use.*satellite/i,
        /satellite.*style/i,
        /satellite.*view/i,
        /aerial.*view/i,
      ],
      style: "satellite",
    },

    // Outdoors patterns
    {
      patterns: [
        /switch.*outdoors/i,
        /change.*outdoors/i,
        /set.*outdoors/i,
        /use.*outdoors/i,
        /outdoors.*style/i,
        /outdoor.*style/i,
      ],
      style: "outdoors",
    },

    // Light patterns
    {
      patterns: [
        /switch.*light/i,
        /change.*light/i,
        /set.*light/i,
        /use.*light/i,
        /light.*style/i,
        /bright.*style/i,
      ],
      style: "light",
    },

    // Dark patterns
    {
      patterns: [
        /switch.*dark/i,
        /change.*dark/i,
        /set.*dark/i,
        /use.*dark/i,
        /dark.*style/i,
        /night.*style/i,
      ],
      style: "dark",
    },

    // Navigation patterns
    {
      patterns: [/navigation.*day/i, /nav.*day/i, /day.*navigation/i],
      style: "navigation day",
    },
    {
      patterns: [/navigation.*night/i, /nav.*night/i, /night.*navigation/i],
      style: "navigation night",
    },
  ];

  // General map style patterns
  const generalPatterns = [
    /change.*map.*style/i,
    /switch.*map.*style/i,
    /set.*map.*style/i,
    /use.*map.*style/i,
    /map.*style/i,
    /style.*map/i,
  ];

  // Check for specific style patterns first
  for (const styleGroup of stylePatterns) {
    if (styleGroup.patterns.some((pattern) => pattern.test(text))) {
      return styleGroup.style;
    }
  }

  // If general pattern matches but no specific style found, return null for now
  if (generalPatterns.some((pattern) => pattern.test(text))) {
    return "general";
  }

  return null;
}

/* -------- Main Agent Function -------- */
export async function runMapStyleAgent(
  prompt: string,
  mapRef: MapRefLike,
  callbacks: MapStyleCallbacks,
  pushMessage: (role: "assistant" | "user", content: string) => void,
  currentMapStyle: string
): Promise<boolean> {
  try {
    const intent = detectMapStyleIntent(prompt);

    if (!intent) {
      return false; // Not a map style request
    }

    if (intent === "general") {
      pushMessage(
        "assistant",
        "I can help you change the map style! Please specify which style you'd like:" +
          "\n\n• **Default** - Custom Mapbox Standard style" +
          "\n\n• **Satellite** - Aerial satellite imagery" +
          "\n\n• **Outdoors** - Outdoor/hiking focused style" +
          "\n\n• **Light** - Light color scheme" +
          "\n\n• **Dark** - Dark color scheme" +
          "\n\n• **Navigation Day** - Navigation optimized for daytime" +
          "\n\n• **Navigation Night** - Navigation optimized for nighttime" +
          "\n\nJust say something like 'switch to satellite style' or 'use dark mode'."
      );
      return true;
    }

    const targetStyle = MAP_STYLE_MAPPINGS[intent];

    if (!targetStyle) {
      pushMessage(
        "assistant",
        `Sorry, I don't recognize the map style "${intent}". Available styles are: Default, Satellite, Outdoors, Light, Dark, Navigation Day, and Navigation Night.`
      );
      return true;
    }

    // Check if already using the requested style
    if (targetStyle === currentMapStyle) {
      pushMessage(
        "assistant",
        `The map is already using the ${targetStyle} style.`
      );
      return true;
    }

    pushMessage("assistant", `Switching map style to ${targetStyle}...`);

    // Execute the style change
    callbacks.handleMapStyleChange(targetStyle);

    // Provide appropriate feedback based on the style
    let styleDescription = "";
    switch (intent) {
      case "satellite":
        styleDescription =
          "You're now viewing high-resolution satellite imagery with detailed aerial perspectives.";
        break;
      case "dark":
        styleDescription =
          "You're now using a dark theme that's easier on the eyes and great for nighttime viewing.";
        break;
      case "light":
        styleDescription =
          "You're now using a bright, clean style that's perfect for detailed analysis.";
        break;
      case "outdoors":
        styleDescription =
          "You're now using an outdoor-focused style optimized for hiking and recreational activities.";
        break;
      case "navigation day":
        styleDescription =
          "You're now using a navigation style optimized for daytime driving and route planning.";
        break;
      case "navigation night":
        styleDescription =
          "You're now using a navigation style optimized for nighttime driving with reduced eye strain.";
        break;
      default:
        styleDescription =
          "You're now using the default custom Mapbox standard style with balanced colors and clarity.";
    }

    pushMessage(
      "assistant",
      `✅ **Map style changed to ${targetStyle}**\n\n${styleDescription}`
    );

    return true; // Successfully handled
  } catch (err: any) {
    console.error("runMapStyleAgent error:", err);
    pushMessage(
      "assistant",
      `Error changing map style: ${err?.message || String(err)}`
    );
    return true; // Still handled, even if failed
  }
}

/* -------- Export default object -------- */
export default {
  runMapStyleAgent,
  detectMapStyleIntent,
};
