export interface TsunamiDataConfig {
  name: string;
  scope: string;
  source: string;
}

/** If you add sources, update Atlas `LIVE_TSUNAMI_FEED_OPTIONS` for vague-tsunami AI clarification. */
export const tsunamiData: TsunamiDataConfig[] = [
  {
    name: "PHIVOLCS Tsunami Information",
    scope: "Global / Pacific (PHIVOLCS bulletins)",
    source: "Philippine Institute of Volcanology and Seismology (PHIVOLCS)",
  },
];

const PH_TSUNAMI_SOURCE = tsunamiData[0]!.name;

function hazardsBackendBase(): string {
  const b =
    (typeof window !== "undefined" && process.env.NEXT_PUBLIC_BACKEND_ENDPOINT) ||
    "http://localhost:8000";
  return String(b).replace(/\/$/, "");
}

/** Abbreviated + full month names as on PHIVOLCS tsunami site */
const SHORT_MONTHS: Record<string, number> = {
  Jan: 0,
  Feb: 1,
  Mar: 2,
  Apr: 3,
  May: 4,
  Jun: 5,
  Jul: 6,
  Aug: 7,
  Sep: 8,
  Oct: 9,
  Nov: 10,
  Dec: 11,
};

const FULL_MONTHS: Record<string, number> = {
  January: 0,
  February: 1,
  March: 2,
  April: 3,
  May: 4,
  June: 5,
  July: 6,
  August: 7,
  September: 8,
  October: 9,
  November: 10,
  December: 11,
};

/**
 * Parse PHIVOLCS tsunami datetime: "05 Mar 2026 - 01:55 AM" (Philippine Standard Time).
 */
function parsePhilippinesTsunamiDateTime(dateTimeStr: string): number {
  try {
    const parts = dateTimeStr.split(" - ");
    if (parts.length !== 2) return Date.now();

    const datePart = parts[0]!.trim();
    const timePart = parts[1]!.trim();
    const dateComponents = datePart.split(/\s+/);
    if (dateComponents.length !== 3) return Date.now();

    const day = parseInt(dateComponents[0]!, 10);
    const monthToken = dateComponents[1]!;
    const year = parseInt(dateComponents[2]!, 10);

    const month =
      SHORT_MONTHS[monthToken] ?? FULL_MONTHS[monthToken] ?? undefined;
    if (month === undefined || Number.isNaN(day) || Number.isNaN(year)) {
      return Date.now();
    }

    const timeMatch = timePart.match(/(\d+):(\d+)\s*(AM|PM)/i);
    if (!timeMatch) return Date.now();

    let hours = parseInt(timeMatch[1]!, 10);
    const minutes = parseInt(timeMatch[2]!, 10);
    const period = timeMatch[3]!.toUpperCase();

    if (period === "PM" && hours !== 12) hours += 12;
    else if (period === "AM" && hours === 12) hours = 0;

    const date = new Date(year, month, day, hours, minutes, 0, 0);
    return date.getTime();
  } catch {
    return Date.now();
  }
}

function parseCoordLabel(s: string): number | null {
  const m = String(s).match(/([\d.]+)\s*°?\s*([NSEW])/i);
  if (!m) return null;
  let v = parseFloat(m[1]!);
  if (Number.isNaN(v)) return null;
  const hemi = m[2]!.toUpperCase();
  if (hemi === "S" || hemi === "W") v = -v;
  return v;
}

/** Match backend: past 60 days in Philippine time (client-side guard). */
const TSUNAMI_LOOKBACK_MS = 60 * 24 * 60 * 60 * 1000;

function withinTsunamiLookback(ts: number): boolean {
  const now = Date.now();
  return ts >= now - TSUNAMI_LOOKBACK_MS && ts <= now + 5 * 60 * 1000;
}

function processPhivolcsTsunamiPayload(data: {
  events?: Record<string, string>[];
}): GeoJSON.Feature[] {
  const events = data.events;
  if (!events || !Array.isArray(events)) return [];

  return events
    .map((ev) => {
      const dateStr = ev["Date and Time (PST)"] ?? "";
      const ts = parsePhilippinesTsunamiDateTime(dateStr);
      if (!withinTsunamiLookback(ts)) return null;

      const lat = parseCoordLabel(ev["Latitude"] ?? "");
      const lon = parseCoordLabel(ev["Longitude"] ?? "");
      if (lat === null || lon === null) return null;

      const mag = parseFloat(String(ev["Magnitude"] ?? "").replace(/[^\d.-]/g, "")) || 0;
      const depthRaw = String(ev["Depth (km)"] ?? "").replace(/\D/g, "");
      const depth = depthRaw ? parseInt(depthRaw, 10) : 0;

      const advisory = (ev["Advisory"] ?? "").trim();
      const advisoryUrl = (ev["Advisory URL"] ?? "").trim();

      return {
        type: "Feature" as const,
        properties: {
          mag,
          place: (ev["Location"] ?? "Unknown").trim() || "Unknown",
          time: ts,
          depth: Number.isFinite(depth) ? depth : 0,
          advisory,
          advisoryUrl,
          source: "PHIVOLCS-Tsunami",
          sourceFullName:
            "PHIVOLCS Tsunami Information (tsunami.phivolcs.dost.gov.ph)",
          dateTimeOriginal: dateStr,
        },
        geometry: {
          type: "Point" as const,
          coordinates: [lon, lat, Number.isFinite(depth) ? depth : 0],
        },
      };
    })
    .filter(Boolean) as GeoJSON.Feature[];
}

/**
 * Fetch tsunami monitor rows from backend (scraped PHIVOLCS site, 60 days server-side;
 * client also filters by parsed time).
 */
export async function fetchTsunamiData(sourceName: string): Promise<GeoJSON.Feature[]> {
  if (sourceName !== PH_TSUNAMI_SOURCE) {
    console.error(`Unknown tsunami source: ${sourceName}`);
    return [];
  }

  const url = `${hazardsBackendBase()}/tsunami/latest`;
  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }
    const data = await response.json();
    return processPhivolcsTsunamiPayload(data);
  } catch (e) {
    console.error("Error fetching tsunami data:", e);
    return [];
  }
}

export async function fetchMultipleTsunamiSources(
  sourceNames: string[]
): Promise<GeoJSON.Feature[]> {
  if (sourceNames.length === 0) return [];
  const lists = await Promise.all(
    sourceNames.map((name) => fetchTsunamiData(name))
  );
  return lists.flat();
}
