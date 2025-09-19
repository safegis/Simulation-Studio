/// Toggle-Congestion.tsx
"use client";
import type { RefObject } from "react";

/* -------- Types -------- */
type MapRefLike = {
  current: any | null;
};

type CongestionControlCallbacks = {
  enableCongestion: () => void;
  disableCongestion: () => void;
  isCongestionEnabled: () => boolean;
  stopCongestionPolling?: () => void;
  getCongestionSharedRefs?: () => {
    intervalId: NodeJS.Timeout | null;
    timerId: number | null;
    boundsCallback: ((bbox: [number, number, number, number]) => void) | null;
  };
};

/* -------- Intent Detection -------- */
function detectCongestionIntent(
  prompt: string
): "enable" | "disable" | "toggle" | null {
  const text = prompt.toLowerCase().trim();

  // Disable patterns - check these FIRST to prioritize disable commands
  const disablePatterns = [
    /disable\s+congestion/i,
    /hide\s+congestion/i,
    /turn\s+off\s+congestion/i,
    /remove\s+congestion/i,
    /deactivate\s+congestion/i,
    /clear\s+congestion/i,
    /turn\s+congestion\s+off/i,
    /congestion.*off/i,
    /congestion.*hide/i,
    /congestion.*disable/i,
  ];

  // Enable patterns
  const enablePatterns = [
    /enable\s+congestion/i,
    /show\s+congestion/i,
    /display\s+congestion/i,
    /turn\s+on\s+congestion/i,
    /activate\s+congestion/i,
    /add\s+congestion/i,
    /congestion\s+on\s+map/i,
    /congestion\s+in\s+the\s+map/i,
    /congestion\s+layer/i,
    /congestion\s+data/i,
    /see\s+congestion/i,
    /view\s+congestion/i,
    /traffic\s+congestion/i,
    /traffic\s+jam/i,
    /i\s+want\s+to\s+see\s+congestion/i,
  ];

  // Toggle patterns
  const togglePatterns = [/toggle\s+congestion/i, /switch\s+congestion/i];

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

  console.log("No congestion intent detected for:", text); // Debug log
  return null;
}

/* -------- Helper to map TomTom congestion description into severity level -------- */
function mapCongestionSeverity(desc: string): number {
  switch (desc.toLowerCase()) {
    case "free traffic":
      return 1;
    case "heavy traffic":
      return 2;
    case "slow traffic":
      return 3;
    case "queuing traffic":
      return 4;
    case "stationary traffic":
      return 5;
    default:
      return 0;
  }
}

/* -------- Helper function to limit bbox area -------- */
const clamp = (v: number, a: number, b: number) => Math.max(a, Math.min(b, v));

function limitBBoxToMaxArea(
  bbox: [number, number, number, number],
  maxKm2 = 10000
): [number, number, number, number] {
  const [minLon, minLat, maxLon, maxLat] = bbox;
  const centerLon = (minLon + maxLon) / 2;
  const centerLat = (minLat + maxLat) / 2;

  const halfWidthDeg = (maxLon - minLon) / 2;
  const halfHeightDeg = (maxLat - minLat) / 2;

  const kmPerDegLat = 111.32;
  const kmPerDegLon = 111.32 * Math.cos((centerLat * Math.PI) / 180);

  const widthKm = halfWidthDeg * 2 * kmPerDegLon;
  const heightKm = halfHeightDeg * 2 * kmPerDegLat;
  const areaKm2 = Math.abs(widthKm * heightKm);

  if (areaKm2 <= maxKm2) {
    return [minLon, minLat, maxLon, maxLat];
  }

  const scale = Math.sqrt(maxKm2 / areaKm2);
  const newHalfWidthDeg = halfWidthDeg * scale;
  const newHalfHeightDeg = halfHeightDeg * scale;

  let newMinLon = centerLon - newHalfWidthDeg;
  let newMaxLon = centerLon + newHalfWidthDeg;
  let newMinLat = centerLat - newHalfHeightDeg;
  let newMaxLat = centerLat + newHalfHeightDeg;

  newMinLat = clamp(newMinLat, -90, 90);
  newMaxLat = clamp(newMaxLat, -90, 90);
  newMinLon = clamp(newMinLon, -180, 180);
  newMaxLon = clamp(newMaxLon, -180, 180);

  return [newMinLon, newMinLat, newMaxLon, newMaxLat];
}

/* -------- Fetch TomTom congestion data -------- */
async function fetchTomTomCongestion(
  bboxArray?: [number, number, number, number]
): Promise<GeoJSON.FeatureCollection | null> {
  try {
    const key = process.env.NEXT_PUBLIC_TOMTOM_API_KEY;
    if (!key) {
      console.error("TomTom API key missing (NEXT_PUBLIC_TOMTOM_API_KEY).");
      return null;
    }

    if (!bboxArray) return null;

    const clamped = limitBBoxToMaxArea(bboxArray, 10000);
    const bboxStr = clamped.join(",");

    const fieldsRaw =
      "{incidents{type,geometry{type,coordinates},properties{iconCategory,startTime,endTime,from,to,length,events{description,code,iconCategory}}}}";
    const fields = encodeURIComponent(fieldsRaw);

    const url = `https://api.tomtom.com/traffic/services/5/incidentDetails?key=${key}&bbox=${bboxStr}&fields=${fields}&language=en-GB`;

    const res = await fetch(url);
    if (!res.ok) {
      console.error("TomTom incidentDetails error", res.status);
      return null;
    }

    const data = await res.json();
    const incidents = (data.incidents || []).filter((inc: any) => {
      const ic = inc.properties?.iconCategory ?? inc.ic ?? null;
      return Number(ic) === 6; // 6 = Congestion/Jam
    });

    const features = incidents.map((inc: any, idx: number) => {
      const geom = inc.geometry || {};
      const desc =
        inc.properties?.events?.[0]?.description ??
        inc.properties?.description ??
        "";
      const severity = mapCongestionSeverity(desc);

      return {
        type: "Feature",
        id: inc.id ?? `tt-jam-${idx}`,
        properties: {
          description: desc,
          severity,
          startTime: inc.properties?.startTime ?? null,
          endTime: inc.properties?.endTime ?? null,
          iconCategory: inc.properties?.iconCategory ?? null,
          raw: inc,
        },
        geometry: {
          type: geom.type || "Point",
          coordinates: geom.coordinates || [],
        },
      };
    });

    return { type: "FeatureCollection", features };
  } catch (err) {
    console.error("fetchTomTomCongestion error", err);
    return null;
  }
}

/* -------- Main Agent Function -------- */

export async function runCongestionAgent(
  prompt: string,
  mapRef: MapRefLike,
  callbacks: CongestionControlCallbacks,
  pushMessage: (role: "assistant" | "user", content: string) => void
): Promise<boolean> {
  try {
    const intent = detectCongestionIntent(prompt);
    if (!intent) {
      return false; // Not a congestion request
    }

    let action: "enable" | "disable";
    if (intent === "toggle") {
      action = callbacks.isCongestionEnabled() ? "disable" : "enable";
    } else {
      action = intent;
    }

    // Check if already in requested state
    const isCurrentlyEnabled = callbacks.isCongestionEnabled();
    console.log("Congestion Agent Debug:", {
      intent,
      action,
      isCurrentlyEnabled,
    });

    if (action === "enable" && isCurrentlyEnabled) {
      pushMessage("assistant", "Congestion layer is already enabled.");
      return true;
    }

    if (action === "disable" && !isCurrentlyEnabled) {
      pushMessage("assistant", "Congestion layer is already disabled.");
      return true;
    }

    if (action === "enable") {
      pushMessage("assistant", "Enabling congestion layer...");

      // BEFORE: Agent directly managed intervals and listeners
      // AFTER: Use parent's enableCongestion function which handles all setup
      try {
        callbacks.enableCongestion();

        pushMessage(
          "assistant",
          "✅ **Congestion layer enabled**\n\nShowing traffic congestion data on the map. The layer will automatically update with real-time traffic information every minute and when you move the map."
        );
      } catch (err) {
        pushMessage(
          "assistant",
          "❌ Failed to enable congestion layer. Please check your connection and try again."
        );
        console.error("Error enabling congestion:", err);
      }
    } else {
      pushMessage("assistant", "Disabling congestion layer...");

      // BEFORE: Agent had its own cleanup logic
      // AFTER: Use the shared disable function which handles all cleanup
      callbacks.disableCongestion();

      pushMessage(
        "assistant",
        "✅ **Congestion layer disabled**\n\nTraffic congestion data has been cleared from the map and automatic refresh has been stopped."
      );
    }

    return true; // Successfully handled
  } catch (err: any) {
    console.error("runCongestionAgent error:", err);
    pushMessage(
      "assistant",
      `❌ Error managing congestion layer: ${err?.message || String(err)}`
    );
    return true; // Still handled, even if failed
  }
}

/* -------- Export default object -------- */
export default {
  runCongestionAgent,
  detectCongestionIntent,
};
