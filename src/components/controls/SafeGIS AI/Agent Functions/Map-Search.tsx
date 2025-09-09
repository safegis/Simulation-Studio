"use client";

import type { RefObject } from "react";

/* -------- Types -------- */
export type GeocodeCandidate = {
  id: string;
  formatted: string;
  lon: number;
  lat: number;
  type?: string;
  country?: string;
  confidence?: number;
  bbox?: [number, number, number, number] | null;
  raw?: any;
};

type MapRefLike = {
  current: any | null;
};

/* -------- Helpers -------- */
async function fetchGeoapify(text: string, limit = 5): Promise<any> {
  const key = process.env.NEXT_PUBLIC_GEOAPIFY_API_KEY;
  if (!key) throw new Error("Missing NEXT_PUBLIC_GEOAPIFY_API_KEY env var");
  const encoded = encodeURIComponent(text);
  const url = `https://api.geoapify.com/v1/geocode/search?text=${encoded}&limit=${limit}&format=json&apiKey=${key}`;

  const resp = await fetch(url);
  if (!resp.ok) {
    const txt = await resp.text();
    throw new Error(`Geoapify error ${resp.status}: ${txt}`);
  }
  return resp.json();
}

/* -------- Context-aware canonicalizer (refined) -------- */
async function canonicalizeLocation(
  query: string,
  context: string = ""
): Promise<string> {
  try {
    let cleaned = query
      .replace(
        /^(go to|show me|i want to see|look up|find|please show|display|fly the map to|now fly the map to)\s+/i,
        ""
      )
      .replace(/in the map$/i, "")
      .trim();

    const resp = await fetch(process.env.NEXT_PUBLIC_MODEL_ENDPOINT!, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        prompt: `
You are a geolocation cleaner. Output ONLY the canonical place name suitable for geocoding APIs.
Preserve specific landmarks (monuments, towers, walls, palaces, temples, bridges, stadiums, POIs).
Use conversation context to resolve vague references.
Do NOT include extra words or punctuation.

Context: ${context}
User: ${cleaned}
`,
        max_tokens: 64,
      }),
    });

    const data = await resp.json();
    let text = data?.response?.trim() || cleaned;

    return text;
  } catch (err) {
    console.warn("Canonicalizer failed, fallback to cleaned query", err);
    return query
      .replace(
        /^(go to|show me|i want to see|look up|find|please show|display|fly the map to|now fly the map to)\s+/i,
        ""
      )
      .replace(/in the map$/i, "")
      .trim();
  }
}

/**
 * geocodePlace
 */
export async function geocodePlace(
  query: string,
  limit = 5
): Promise<GeocodeCandidate[]> {
  const data = await fetchGeoapify(query, limit);
  const results = data?.results || [];
  if (!Array.isArray(results) || results.length === 0) return [];

  return results.map((f: any) => {
    const lon = Number(f.lon);
    const lat = Number(f.lat);

    let formatted =
      f.formatted || f.name || f.address_line1 || f.address_line2 || query;

    if (f.result_type === "amenity" || f.result_type === "poi") {
      formatted = `${f.name || formatted}, ${f.city || f.country || ""}`.trim();
    }

    return {
      id: f.place_id ?? formatted,
      formatted,
      lon,
      lat,
      country: f.country,
      confidence: f.rank?.confidence ?? null,
      bbox: f.bbox ?? null,
      raw: f,
    };
  });
}

/* Detect ambiguous results */
function isAmbiguous(candidates: GeocodeCandidate[]): boolean {
  if (!candidates || candidates.length <= 1) return false;
  const top = candidates[0];
  const second = candidates[1];
  if (!top || !second) return false;
  if (top.country && second.country && top.country !== second.country)
    return true;
  if (
    typeof top.confidence === "number" &&
    typeof second.confidence === "number" &&
    Math.abs(top.confidence - second.confidence) < 0.05
  ) {
    return true;
  }
  return false;
}

/* Zoom heuristic */
function chooseZoomFromRaw(c: GeocodeCandidate): number {
  const type = c.raw?.result_type || "";

  // Landmarks, POIs, amenities → close zoom
  if (type === "amenity" || type === "poi" || type === "street") {
    return 16;
  }

  // Country → wide zoom
  if (type === "country") {
    return 4;
  }

  // State / region → medium zoom
  if (type === "state" || type === "region") {
    return 6;
  }

  // City / town → moderate zoom
  if (type === "city" || type === "village" || type === "town") {
    return 10;
  }

  // Bounding box fallback
  if (c.bbox && Array.isArray(c.bbox) && c.bbox.length === 4) {
    const [minLon, minLat, maxLon, maxLat] = c.bbox;
    const lonDiff = Math.abs(maxLon - minLon);
    const latDiff = Math.abs(maxLat - minLat);
    const maxDiff = Math.max(lonDiff, latDiff);
    if (maxDiff > 20) return 4;
    if (maxDiff > 2) return 6;
    if (maxDiff > 0.3) return 10;
    return 12;
  }

  return 10; // default
}

/* -------- Main Agent -------- */
let lastMapLocation = ""; // Tracks last location for context

export async function runAgent(
  prompt: string,
  mapRef: MapRefLike,
  pushMessage: (role: "assistant" | "user", content: string) => void
): Promise<void> {
  try {
    pushMessage("assistant", `Searching location from: "${prompt}"...`);

    // Step 1: Use context-aware canonicalizer
    let cleanedPrompt = await canonicalizeLocation(prompt, lastMapLocation);
    console.log("Canonical query:", cleanedPrompt);

    // Step 2: Call Geoapify
    const candidates = await geocodePlace(cleanedPrompt, 6);
    console.log("Geoapify candidates:", candidates);

    if (!candidates.length) {
      pushMessage(
        "assistant",
        `I couldn't find any location matching "${prompt}". Could you give more detail (city, country, landmark)?`
      );
      return;
    }

    // Step 3: Handle ambiguous results
    let chosen = candidates[0];
    if (isAmbiguous(candidates)) {
      chosen = candidates.reduce((prev, curr) =>
        (curr.confidence ?? 0) > (prev.confidence ?? 0) ? curr : prev
      );
      pushMessage(
        "assistant",
        `Multiple candidates found, showing the most likely: ${chosen.formatted}`
      );
    }

    lastMapLocation = chosen.formatted; // Update context

    // Step 4: Adjust zoom
    let zoom = chooseZoomFromRaw(chosen);
    const type = chosen.raw?.result_type || "";
    if (type === "street" || type === "poi" || type === "amenity") {
      zoom = Math.max(zoom, 16); // closer zoom for landmarks
    }

    const lngLat: [number, number] = [chosen.lon, chosen.lat];

    // Step 5: Update map
    if (mapRef?.current?.flyTo) {
      mapRef.current.flyTo({ center: lngLat, zoom });
    }
    if (mapRef?.current?.addLocationMarker) {
      mapRef.current.addLocationMarker(chosen.lon, chosen.lat);
    }

    pushMessage(
      "assistant",
      `Showing **${
        chosen.formatted
      }** (${type}) on the map (lat: ${chosen.lat.toFixed(
        5
      )}, lon: ${chosen.lon.toFixed(5)}) at zoom ${zoom}.`
    );
  } catch (err: any) {
    console.error("runAgent error:", err);
    pushMessage("assistant", `Agent error: ${err?.message || String(err)}`);
  }
}

export default {
  geocodePlace,
  runAgent,
};
