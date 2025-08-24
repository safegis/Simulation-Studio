"use client";

import { useState, useRef, useEffect } from "react";
import {
  ChevronDown,
  Droplet,
  Mountain,
  TrafficCone,
  Wind,
  Flame,
  PersonStanding,
  Sprout,
  Building2,
  BriefcaseMedical,
  LandPlot,
  ShoppingCart,
  BusFront,
  Siren,
  Bug,
} from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { healthFacilities } from "./HealthFacilities";

interface Props {
  isVisible: boolean;
  selectedMaps: string[];
  selectedPlanningTools: string[];
  mapRef: React.RefObject<any>;
}

const displayNameMap: Record<string, string> = {
  "Hazard Map": "Hazard Map",
  "Exposure Map": "Exposure Map",
  "Vulnerability Map": "Vulnerability Map",
  "Critical Facility Map": "Critical Facility Map",
};

const displayNamePlanningTools: Record<string, string> = {
  "Evacuation Planner": "Evacuation Planner",
  "Resource Planner": "Resource Planner",
  "Recovery Planner": "Recovery Planner",
  "Medical Response Planner": "Medical Response Planner",
  "Communication & Alert Planner": "Communication & Alert Planner",
};

const populationCheckboxItems = ["Urban", "Rural", "Vulnerable Population"];
const biologicalCheckboxItems = [
  "Forest Cover",
  "Agro-Ecosystem",
  "Mangrove Areas",
  "National Parks",
  "Critical Habitats",
  "Wetlands / Water Bodies",
];
const nonBiologicalCheckboxItems = [
  "Road Networks",
  "Bridges",
  "Schools / Universities",
  "Active Evacuation Areas",
  "National / Local Gov’t Offices",
  "Power / Energy Plants",
  "Telecommunication Towers",
  "Water Supply Infrastructure",
  "Residential Buildings",
];
const hydroMeteorologicalCheckboxItems = [
  "Weather",
  "Storm Surge",
  "Flood",
  "Tsunami",
  "Landslide (Rain-induced)",
];
const geologicalCheckboxItems = [
  "Earthquake",
  "Volcano List",
  "Landslide (Earthquake-triggered)",
  "Active Faults",
];

const trafficCheckboxItems = [
  "Congestion",
  "Road Closures",
  "Lane Closures",
  "Obstructions",
];

const countries = [
  "Afghanistan",
  "Angola",
  "Albania",
  "Andorra",
  "Argentina",
  "Armenia",
  "Austria",
  "Azerbaijan",
  "Benin",
  "Bangladesh",
  "Bahrain",
  "Canada",
  "Chile",
  "China",
  "Cameroon",
  "Congo",
];

// Helper to parse datetime string from scraper "10 August 2024 - 06:03 AM"
function parseCustomDatetime(datetimeStr: string): string {
  // Remove " - " and replace with space, e.g. "10 August 2024 06:03 AM"
  const cleaned = datetimeStr.replace(" - ", " ");
  const dt = new Date(cleaned);

  if (!isNaN(dt.getTime())) {
    return dt.toLocaleString(); // local readable string
  }
  // Fallback to original string if invalid date
  return datetimeStr;
}

export default function ToolPanel({
  isVisible,
  selectedMaps,
  selectedPlanningTools,
  mapRef,
}: Props) {
  const [expandedPanels, setExpandedPanels] = useState<Record<string, boolean>>(
    {}
  );
  const [populationExpanded, setPopulationExpanded] = useState(false);
  const [populationCheckedItems, setPopulationCheckedItems] = useState<
    string[]
  >([]);
  const [biologicalExpanded, setBiologicalExpanded] = useState(false);
  const [nonBiologicalExpanded, setNonBiologicalExpanded] = useState(false);
  const [biologicalCheckedItems, setBiologicalCheckedItems] = useState<
    string[]
  >([]);
  const [nonBiologicalCheckedItems, setNonBiologicalCheckedItems] = useState<
    string[]
  >([]);
  const [hydroExpanded, setHydroExpanded] = useState(false);
  const [hydroCheckedItems, setHydroCheckedItems] = useState<string[]>([]);
  const [geologicalExpanded, setGeologicalExpanded] = useState(false);
  const [geologicalCheckedItems, setGeologicalCheckedItems] = useState<
    string[]
  >([]);

  const [trafficExpanded, setTrafficExpanded] = useState(false);
  const [trafficCheckedItems, setTrafficCheckedItems] = useState<string[]>([]);

  const earthquakeInterval = useRef<NodeJS.Timeout | null>(null);

  const [medicalExpanded, setMedicalExpanded] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [selectedCountry, setSelectedCountry] = useState("");

  const [searchTerm, setSearchTerm] = useState("");

  // debounce timer for bounds updates
  const roadClosureTimerRef = useRef<number | null>(null);
  // store the registered callback so we can unregister later
  const registeredBoundsCallbackRef = useRef<
    ((bbox: [number, number, number, number]) => void) | null
  >(null);

  const laneClosureTimerRef = useRef<number | null>(null);
  const registeredLaneCallbackRef = useRef<
    ((bbox: [number, number, number, number]) => void) | null
  >(null);

  const obstructionIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const obstructionTimerRef = useRef<number | null>(null);
  const registeredObstructionCallbackRef = useRef<
    ((bbox: [number, number, number, number]) => void) | null
  >(null);

  const listRef = useRef<HTMLUListElement>(null);
  const [hasScrollbar, setHasScrollbar] = useState(false);

  useEffect(() => {
    if (listRef.current) {
      const el = listRef.current;
      setHasScrollbar(el.scrollHeight > el.clientHeight);
    }
  }, [countries, searchTerm]); // recalc when list changes

  if (!isVisible) return null;

  const togglePanel = (key: string) => {
    setExpandedPanels((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  const togglePopulationItem = (item: string) => {
    setPopulationCheckedItems((prev) =>
      prev.includes(item) ? prev.filter((i) => i !== item) : [...prev, item]
    );
  };

  const toggleBiologicalItem = (item: string) => {
    setBiologicalCheckedItems((prev) =>
      prev.includes(item) ? prev.filter((i) => i !== item) : [...prev, item]
    );
  };

  const toggleNonBiologicalItem = (item: string) => {
    setNonBiologicalCheckedItems((prev) =>
      prev.includes(item) ? prev.filter((i) => i !== item) : [...prev, item]
    );
  };

  const toggleHydroItem = (item: string) => {
    setHydroCheckedItems((prev) =>
      prev.includes(item) ? prev.filter((i) => i !== item) : [...prev, item]
    );
  };

  // --- helpers: place near other helpers in ToolPanel.tsx ---

  /** clamp value between min and max */
  const clamp = (v: number, a: number, b: number) =>
    Math.max(a, Math.min(b, v));

  /**
   * Limit a bbox so its approximate surface area <= maxKm2.
   * bbox: [minLon,minLat,maxLon,maxLat]
   * returns a new bbox of same aspect ratio (centered on original center).
   */
  function limitBBoxToMaxArea(
    bbox: [number, number, number, number],
    maxKm2 = 10000
  ): [number, number, number, number] {
    const [minLon, minLat, maxLon, maxLat] = bbox;
    const centerLon = (minLon + maxLon) / 2;
    const centerLat = (minLat + maxLat) / 2;

    // degrees span
    const halfWidthDeg = (maxLon - minLon) / 2;
    const halfHeightDeg = (maxLat - minLat) / 2;

    // approximate km per degree
    const kmPerDegLat = 111.32; // ~111.32 km per degree latitude
    const kmPerDegLon = 111.32 * Math.cos((centerLat * Math.PI) / 180); // varies with lat

    const widthKm = halfWidthDeg * 2 * kmPerDegLon;
    const heightKm = halfHeightDeg * 2 * kmPerDegLat;
    const areaKm2 = Math.abs(widthKm * heightKm);

    if (areaKm2 <= maxKm2) {
      // current bbox is OK
      return [minLon, minLat, maxLon, maxLat];
    }

    // scale down preserving center and aspect ratio
    const scale = Math.sqrt(maxKm2 / areaKm2);

    const newHalfWidthDeg = halfWidthDeg * scale;
    const newHalfHeightDeg = halfHeightDeg * scale;

    let newMinLon = centerLon - newHalfWidthDeg;
    let newMaxLon = centerLon + newHalfWidthDeg;
    let newMinLat = centerLat - newHalfHeightDeg;
    let newMaxLat = centerLat + newHalfHeightDeg;

    // clamp lat to valid range
    newMinLat = clamp(newMinLat, -90, 90);
    newMaxLat = clamp(newMaxLat, -90, 90);

    // normalize lon to -180..180 (simple clamp; adjust as needed for antimeridian)
    newMinLon = clamp(newMinLon, -180, 180);
    newMaxLon = clamp(newMaxLon, -180, 180);

    return [newMinLon, newMinLat, newMaxLon, newMaxLat];
  }

  /** Fetch TomTom incidentDetails and only keep iconCategory === 8 (RoadClosed) */
  async function fetchTomTomRoadClosures(
    bboxArray?: [number, number, number, number]
  ): Promise<GeoJSON.FeatureCollection | null> {
    try {
      const key = process.env.NEXT_PUBLIC_TOMTOM_API_KEY;
      if (!key) {
        console.error("TomTom API key missing (NEXT_PUBLIC_TOMTOM_API_KEY).");
        return null;
      }

      if (!bboxArray) {
        console.warn(
          "No bbox provided to fetchTomTomRoadClosures; skipping request."
        );
        return null;
      }

      // clamp area to TomTom's 10k km^2 limit (use your existing limiter)
      const clamped = limitBBoxToMaxArea(bboxArray, 10000);
      const bboxStr = clamped.join(",");

      // --- IMPORTANT: description lives under properties.events[].description ---
      // Request: incidents{ type, geometry{...}, properties{ iconCategory, startTime, endTime, from, to, length, events{ description, code, iconCategory } } }
      const fieldsRaw =
        "{incidents{type,geometry{type,coordinates},properties{iconCategory,startTime,endTime,from,to,length,events{description,code,iconCategory}}}}";
      const fields = encodeURIComponent(fieldsRaw);

      const url = `https://api.tomtom.com/traffic/services/5/incidentDetails?key=${key}&bbox=${bboxStr}&fields=${fields}&language=en-GB`;

      const res = await fetch(url);
      if (!res.ok) {
        const text = await res.text().catch(() => "");
        console.error("TomTom incidentDetails error", res.status, text);
        return null;
      }
      const data = await res.json();

      const incidents = (data.incidents || []).filter((inc: any) => {
        const ic = inc.properties?.iconCategory ?? inc.ic ?? null;
        return Number(ic) === 8; // 8 == Road Closed
      });

      const features = incidents.map((inc: any, idx: number) => {
        const geom = inc.geometry || {};
        const desc =
          inc.properties?.events?.[0]?.description ??
          inc.properties?.description ??
          "";

        // ensure style-evaluated fields exist and have the expected types
        const safeLayer =
          Number(
            // try incident-provided value first (if any), otherwise 0
            inc.properties?.layer ?? inc.properties?.level ?? 0
          ) || 0;

        const safeClass = inc.properties?.class ?? ""; // string
        const safeStructure = inc.properties?.structure ?? ""; // string

        return {
          type: "Feature",
          id: inc.id ?? `tt-rc-${idx}`,
          properties: {
            description: desc,
            startTime: inc.properties?.startTime ?? null,
            endTime: inc.properties?.endTime ?? null,
            iconCategory: inc.properties?.iconCategory ?? null,
            // ADDED safe properties to avoid Mapbox expression errors:
            layer: safeLayer,
            class: safeClass,
            structure: safeStructure,
            raw: inc,
          },
          geometry: {
            type: geom.type || "Point",
            coordinates: geom.coordinates || [],
          },
        };
      });

      return {
        type: "FeatureCollection",
        features,
      } as GeoJSON.FeatureCollection;
    } catch (err) {
      console.error("fetchTomTomRoadClosures error", err);
      return null;
    }
  }

  async function fetchTomTomLaneClosures(
    bboxArray?: [number, number, number, number]
  ): Promise<GeoJSON.FeatureCollection | null> {
    try {
      const key = process.env.NEXT_PUBLIC_TOMTOM_API_KEY;
      if (!key) {
        console.error("TomTom API key missing (NEXT_PUBLIC_TOMTOM_API_KEY).");
        return null;
      }

      if (!bboxArray) {
        console.warn(
          "No bbox provided to fetchTomTomRoadClosures; skipping request."
        );
        return null;
      }

      // clamp area to TomTom's 10k km^2 limit (use your existing limiter)
      const clamped = limitBBoxToMaxArea(bboxArray, 10000);
      const bboxStr = clamped.join(",");

      // --- IMPORTANT: description lives under properties.events[].description ---
      // Request: incidents{ type, geometry{...}, properties{ iconCategory, startTime, endTime, from, to, length, events{ description, code, iconCategory } } }
      const fieldsRaw =
        "{incidents{type,geometry{type,coordinates},properties{iconCategory,startTime,endTime,from,to,length,events{description,code,iconCategory}}}}";
      const fields = encodeURIComponent(fieldsRaw);

      const url = `https://api.tomtom.com/traffic/services/5/incidentDetails?key=${key}&bbox=${bboxStr}&fields=${fields}&language=en-GB`;

      const res = await fetch(url);
      if (!res.ok) {
        const text = await res.text().catch(() => "");
        console.error("TomTom incidentDetails error", res.status, text);
        return null;
      }
      const data = await res.json();

      const incidents = (data.incidents || []).filter((inc: any) => {
        const ic = inc.properties?.iconCategory ?? inc.ic ?? null;
        return Number(ic) === 9; // 8 == Road Closed
      });

      const features = incidents.map((inc: any, idx: number) => {
        const geom = inc.geometry || {};
        const desc =
          inc.properties?.events?.[0]?.description ??
          inc.properties?.description ??
          "";

        // ensure style-evaluated fields exist and have the expected types
        const safeLayer =
          Number(
            // try incident-provided value first (if any), otherwise 0
            inc.properties?.layer ?? inc.properties?.level ?? 0
          ) || 0;

        const safeClass = inc.properties?.class ?? ""; // string
        const safeStructure = inc.properties?.structure ?? ""; // string

        return {
          type: "Feature",
          id: inc.id ?? `tt-rc-${idx}`,
          properties: {
            description: desc,
            startTime: inc.properties?.startTime ?? null,
            endTime: inc.properties?.endTime ?? null,
            iconCategory: inc.properties?.iconCategory ?? null,
            // ADDED safe properties to avoid Mapbox expression errors:
            layer: safeLayer,
            class: safeClass,
            structure: safeStructure,
            raw: inc,
          },
          geometry: {
            type: geom.type || "Point",
            coordinates: geom.coordinates || [],
          },
        };
      });

      return {
        type: "FeatureCollection",
        features,
      } as GeoJSON.FeatureCollection;
    } catch (err) {
      console.error("fetchTomTomRoadClosures error", err);
      return null;
    }
  }

  // --- Helper to map TomTom congestion description into severity level ---
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

  /** Fetch TomTom incidentDetails and only keep iconCategory === 6 (Congestion/Jam) */
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

  async function fetchTomTomRoadObstructions(
    bboxArray?: [number, number, number, number]
  ): Promise<GeoJSON.FeatureCollection | null> {
    try {
      const key = process.env.NEXT_PUBLIC_TOMTOM_API_KEY;
      if (!key || !bboxArray) return null;

      const clamped = limitBBoxToMaxArea(bboxArray, 10000);
      const bboxStr = clamped.join(",");

      const fieldsRaw =
        "{incidents{type,geometry{type,coordinates},properties{iconCategory,startTime,endTime,from,to,length,events{description,code,iconCategory}}}}";
      const fields = encodeURIComponent(fieldsRaw);

      const url = `https://api.tomtom.com/traffic/services/5/incidentDetails?key=${key}&bbox=${bboxStr}&fields=${fields}&language=en-GB`;
      const res = await fetch(url);
      if (!res.ok) return null;
      const data = await res.json();

      const allowed = [1, 3, 5, 9, 11, 14];
      const incidents = (data.incidents || []).filter((inc: any) =>
        allowed.includes(Number(inc.properties?.iconCategory ?? inc.ic ?? -1))
      );

      const features = incidents.map((inc: any, idx: number) => {
        const geom = inc.geometry || {};
        const desc =
          inc.properties?.events?.[0]?.description ??
          inc.properties?.description ??
          "";
        return {
          type: "Feature",
          id: inc.id ?? `tt-obs-${idx}`,
          properties: {
            description: desc,
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
      console.error("fetchTomTomRoadObstructions error", err);
      return null;
    }
  }

  // --- refs at the top of ToolPanel.tsx ---
  const roadClosureIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const laneClosureIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const congestionIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const congestionTimerRef = useRef<number | null>(null);
  const registeredCongestionCallbackRef = useRef<
    ((bbox: [number, number, number, number]) => void) | null
  >(null);

  // --- Updated toggleTrafficItem ---
  const toggleTrafficItem = async (item: string) => {
    const isAlreadyChecked = trafficCheckedItems.includes(item);
    const newItems = isAlreadyChecked
      ? trafficCheckedItems.filter((i) => i !== item)
      : [...trafficCheckedItems, item];

    setTrafficCheckedItems(newItems);

    const fetchAndDrawRoads = async () => {
      const currentBbox = mapRef.current?.getBounds?.();
      if (!currentBbox) return;

      const geojson = await fetchTomTomRoadClosures(currentBbox);
      // Always overwrite data, even if empty
      mapRef.current?.drawRoadClosures?.(
        geojson ?? { type: "FeatureCollection", features: [] }
      );
    };

    const fetchAndDrawLanes = async () => {
      const currentBbox = mapRef.current?.getBounds?.();
      if (!currentBbox) return;

      const laneGeo = await fetchTomTomLaneClosures(currentBbox);
      mapRef.current?.drawLaneClosures?.(
        laneGeo ?? { type: "FeatureCollection", features: [] }
      );
    };

    // ----- ROAD CLOSURE -----
    if (item === "Road Closures") {
      if (!isAlreadyChecked) {
        // Initial draw
        fetchAndDrawRoads();

        if (roadClosureIntervalRef.current)
          clearInterval(roadClosureIntervalRef.current);
        roadClosureIntervalRef.current = setInterval(fetchAndDrawRoads, 60_000);

        // Debounced bounds callback for roads
        const boundsCallback = (newBbox: [number, number, number, number]) => {
          if (roadClosureTimerRef.current)
            window.clearTimeout(roadClosureTimerRef.current);
          roadClosureTimerRef.current = window.setTimeout(async () => {
            const refreshed = await fetchTomTomRoadClosures(newBbox);
            mapRef.current?.drawRoadClosures?.(
              refreshed ?? { type: "FeatureCollection", features: [] }
            );
          }, 350) as unknown as number;
        };

        // Register this callback (does NOT override lane closures anymore)
        registeredBoundsCallbackRef.current = boundsCallback;
        mapRef.current?.registerBoundsListener?.(boundsCallback);
      } else {
        // Clear features (lines + markers)
        mapRef.current?.drawRoadClosures?.({
          type: "FeatureCollection",
          features: [],
        });
        // 🔑 Clear markers explicitly
        if (mapRef.current?.roadClosureMarkersRef) {
          mapRef.current.roadClosureMarkersRef.current.forEach((m: any) =>
            m.remove()
          );
          mapRef.current.roadClosureMarkersRef.current = [];
        }

        if (roadClosureIntervalRef.current) {
          clearInterval(roadClosureIntervalRef.current);
          roadClosureIntervalRef.current = null;
        }

        if (registeredBoundsCallbackRef.current) {
          mapRef.current?.unregisterBoundsListener?.(
            registeredBoundsCallbackRef.current
          );
          registeredBoundsCallbackRef.current = null;
        }

        if (roadClosureTimerRef.current) {
          window.clearTimeout(roadClosureTimerRef.current);
          roadClosureTimerRef.current = null;
        }
      }
    }

    // ----- LANE CLOSURE -----
    if (item === "Lane Closures") {
      if (!isAlreadyChecked) {
        // Initial draw
        fetchAndDrawLanes();

        if (laneClosureIntervalRef.current)
          clearInterval(laneClosureIntervalRef.current);
        laneClosureIntervalRef.current = setInterval(fetchAndDrawLanes, 60_000);

        // Debounced bounds callback for lanes
        const laneCallback = (newBbox: [number, number, number, number]) => {
          if (laneClosureTimerRef.current)
            window.clearTimeout(laneClosureTimerRef.current);

          laneClosureTimerRef.current = window.setTimeout(async () => {
            const refreshed = await fetchTomTomLaneClosures(newBbox);
            mapRef.current?.drawLaneClosures?.(
              refreshed ?? { type: "FeatureCollection", features: [] }
            );
          }, 350) as unknown as number;
        };

        // Register this callback (coexists with road closures)
        registeredLaneCallbackRef.current = laneCallback;
        mapRef.current?.registerBoundsListener?.(laneCallback);
      } else {
        // Clear features (lines + markers)
        mapRef.current?.drawLaneClosures?.({
          type: "FeatureCollection",
          features: [],
        });
        // 🔑 Clear markers explicitly
        if (mapRef.current?.laneClosureMarkersRef) {
          mapRef.current.laneClosureMarkersRef.current.forEach((m: any) =>
            m.remove()
          );
          mapRef.current.laneClosureMarkersRef.current = [];
        }

        if (laneClosureIntervalRef.current) {
          clearInterval(laneClosureIntervalRef.current);
          laneClosureIntervalRef.current = null;
        }

        if (registeredLaneCallbackRef.current) {
          mapRef.current?.unregisterBoundsListener?.(
            registeredLaneCallbackRef.current
          );
          registeredLaneCallbackRef.current = null;
        }

        if (laneClosureTimerRef.current) {
          window.clearTimeout(laneClosureTimerRef.current);
          laneClosureTimerRef.current = null;
        }
      }
    }

    // ----- CONGESTION -----
    if (item === "Congestion") {
      if (!isAlreadyChecked) {
        const fetchAndDrawCongestion = async () => {
          const currentBbox = mapRef.current?.getBounds?.();
          if (!currentBbox) return;
          const jamGeo = await fetchTomTomCongestion(currentBbox);
          mapRef.current?.drawCongestion?.(
            jamGeo ?? { type: "FeatureCollection", features: [] }
          );
        };

        // initial draw
        fetchAndDrawCongestion();
        // poll every 60s
        congestionIntervalRef.current = setInterval(
          fetchAndDrawCongestion,
          60_000
        );

        // register bounds listener
        const congestionCallback = (
          newBbox: [number, number, number, number]
        ) => {
          if (congestionTimerRef.current)
            window.clearTimeout(congestionTimerRef.current);

          congestionTimerRef.current = window.setTimeout(async () => {
            const refreshed = await fetchTomTomCongestion(newBbox);
            mapRef.current?.drawCongestion?.(
              refreshed ?? { type: "FeatureCollection", features: [] }
            );
          }, 350) as unknown as number;
        };

        registeredCongestionCallbackRef.current = congestionCallback;
        mapRef.current?.registerBoundsListener?.(congestionCallback);
      } else {
        // clear map when unchecked
        mapRef.current?.drawCongestion?.({
          type: "FeatureCollection",
          features: [],
        });
        if (mapRef.current?.congestionMarkersRef) {
          mapRef.current.congestionMarkersRef.current.forEach((m: any) =>
            m.remove()
          );
          mapRef.current.congestionMarkersRef.current = [];
        }
        if (congestionIntervalRef.current) {
          clearInterval(congestionIntervalRef.current);
          congestionIntervalRef.current = null;
        }
        if (registeredCongestionCallbackRef.current) {
          mapRef.current?.unregisterBoundsListener?.(
            registeredCongestionCallbackRef.current
          );
          registeredCongestionCallbackRef.current = null;
        }
        if (congestionTimerRef.current) {
          window.clearTimeout(congestionTimerRef.current);
          congestionTimerRef.current = null;
        }
      }
    }
    // ----- ROAD OBSTRUCTION -----
    if (item === "Obstructions") {
      if (!isAlreadyChecked) {
        const fetchAndDrawObstructions = async () => {
          const currentBbox = mapRef.current?.getBounds?.();
          if (!currentBbox) return;
          const obsGeo = await fetchTomTomRoadObstructions(currentBbox);
          mapRef.current?.drawRoadObstructions?.(
            obsGeo ?? { type: "FeatureCollection", features: [] }
          );
        };

        // initial draw
        fetchAndDrawObstructions();
        obstructionIntervalRef.current = setInterval(
          fetchAndDrawObstructions,
          60_000
        );

        // bounds listener
        const obstructionCallback = (
          newBbox: [number, number, number, number]
        ) => {
          if (obstructionTimerRef.current)
            window.clearTimeout(obstructionTimerRef.current);

          obstructionTimerRef.current = window.setTimeout(async () => {
            const refreshed = await fetchTomTomRoadObstructions(newBbox);
            mapRef.current?.drawRoadObstructions?.(
              refreshed ?? { type: "FeatureCollection", features: [] }
            );
          }, 350) as unknown as number;
        };

        registeredObstructionCallbackRef.current = obstructionCallback;
        mapRef.current?.registerBoundsListener?.(obstructionCallback);
      } else {
        // clear map when unchecked
        mapRef.current?.drawRoadObstructions?.({
          type: "FeatureCollection",
          features: [],
        });
        if (mapRef.current?.obstructionMarkersRef) {
          mapRef.current.obstructionMarkersRef.current.forEach((m: any) =>
            m.remove()
          );
          mapRef.current.obstructionMarkersRef.current = [];
        }
        if (obstructionIntervalRef.current) {
          clearInterval(obstructionIntervalRef.current);
          obstructionIntervalRef.current = null;
        }
        if (registeredObstructionCallbackRef.current) {
          mapRef.current?.unregisterBoundsListener?.(
            registeredObstructionCallbackRef.current
          );
          registeredObstructionCallbackRef.current = null;
        }
        if (obstructionTimerRef.current) {
          window.clearTimeout(obstructionTimerRef.current);
          obstructionTimerRef.current = null;
        }
      }
    }
  };

  // --- ON UNMOUNT: clear intervals + listeners ---
  useEffect(() => {
    return () => {
      if (roadClosureIntervalRef.current)
        clearInterval(roadClosureIntervalRef.current);
      if (laneClosureIntervalRef.current)
        clearInterval(laneClosureIntervalRef.current);
      if (congestionIntervalRef.current)
        clearInterval(congestionIntervalRef.current);
      if (obstructionIntervalRef.current)
        clearInterval(obstructionIntervalRef.current);

      if (registeredBoundsCallbackRef.current) {
        mapRef.current?.unregisterBoundsListener?.(
          registeredBoundsCallbackRef.current
        );
      }
      if (registeredLaneCallbackRef.current) {
        mapRef.current?.unregisterBoundsListener?.(
          registeredLaneCallbackRef.current
        );
      }
      if (registeredCongestionCallbackRef.current) {
        mapRef.current?.unregisterBoundsListener?.(
          registeredCongestionCallbackRef.current
        );
      }
      if (registeredObstructionCallbackRef.current) {
        mapRef.current?.unregisterBoundsListener?.(
          registeredObstructionCallbackRef.current
        );
      }
    };
  }, []);

  useEffect(() => {
    return () => {
      // component unmount: ensure unregister and clear timer
      if (registeredBoundsCallbackRef.current) {
        mapRef.current?.unregisterBoundsListener?.();
        registeredBoundsCallbackRef.current = null;
      }
      if (roadClosureTimerRef.current) {
        window.clearTimeout(roadClosureTimerRef.current);
        roadClosureTimerRef.current = null;
      }
    };
  }, []);

  // Combined fetch function to get and merge earthquake data from both APIs
  const fetchCombinedEarthquakeData = async () => {
    try {
      // Fetch USGS data
      const resUSGS = await fetch("http://localhost:8000/hazards/earthquakes");
      const dataUSGS = await resUSGS.json();

      // Fetch scraper data
      const resScraper = await fetch(
        "http://localhost:8001/earthquakes/latest"
      );
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
      const combinedFeatures = [
        ...(dataUSGS.features || []),
        ...scraperFeatures,
      ];

      return combinedFeatures;
    } catch (err) {
      console.error("Error fetching combined earthquake data:", err);
      return [];
    }
  };

  const startEarthquakePolling = () => {
    if (earthquakeInterval.current) return;
    earthquakeInterval.current = setInterval(async () => {
      const combinedFeatures = await fetchCombinedEarthquakeData();
      mapRef.current?.drawEarthquakeDots(combinedFeatures);
    }, 60000);
  };

  const stopEarthquakePolling = () => {
    if (earthquakeInterval.current) {
      clearInterval(earthquakeInterval.current);
      earthquakeInterval.current = null;
    }
  };

  const toggleGeologicalItem = async (item: string) => {
    const isAlreadyChecked = geologicalCheckedItems.includes(item);
    const newItems = isAlreadyChecked
      ? geologicalCheckedItems.filter((i) => i !== item)
      : [...geologicalCheckedItems, item];

    setGeologicalCheckedItems(newItems);

    if (item === "Earthquake") {
      if (!isAlreadyChecked) {
        const combinedFeatures = await fetchCombinedEarthquakeData();
        mapRef.current?.drawEarthquakeDots(combinedFeatures);
        startEarthquakePolling();
      } else {
        mapRef.current?.drawEarthquakeDots([]);
        stopEarthquakePolling();
      }
    }

    if (item === "Volcano List") {
      if (!isAlreadyChecked) {
        try {
          const res = await fetch("http://localhost:8000/hazards/volcanoes");
          const data = await res.json();
          mapRef.current?.drawVolcanoDots(data);
        } catch (err) {
          console.error("Failed to fetch volcano data:", err);
        }
      } else {
        mapRef.current?.drawVolcanoDots([]); // remove volcano dots when unchecked
      }
    }

    if (item === "Active Faults") {
      if (!isAlreadyChecked) {
        try {
          const res = await fetch(
            "http://localhost:8000/hazards/active-faults"
          );
          const data = await res.json();
          mapRef.current?.drawActiveFaults(data);
        } catch (err) {
          console.error("Failed to fetch Active Faults data:", err);
        }
      } else {
        mapRef.current?.drawActiveFaults(null); // remove faults when unchecked
      }
    }
  };

  useEffect(() => {
    return () => {
      stopEarthquakePolling(); // Cleanup on unmount
    };
  }, []);

  return (
    <div
      className="mt-[18px] w-full bg-transparent rounded-xl shadow-md text-[#C7C7C7] flex flex-col overflow-y-auto scrollbar-rounded"
      style={{ maxHeight: "calc(100vh - 91px - 18px)", padding: "0px" }}
    >
      {[...selectedMaps, ...selectedPlanningTools].map((label, index, arr) => {
        const isMap = label in displayNameMap;
        const displayName = isMap
          ? displayNameMap[label]
          : displayNamePlanningTools[label] || label;
        const key = `${isMap ? "map" : "tool"}-${label}`;
        const isExpanded = expandedPanels[key];

        return (
          <div key={key} className={index !== arr.length - 1 ? "mb-3" : ""}>
            <button
              onClick={() => togglePanel(key)}
              className="flex justify-between items-center px-4 w-full rounded-xl"
              style={{ height: "50px", backgroundColor: "#454545" }}
            >
              <span className="text-base font-medium text-white">
                {displayName}
              </span>
              <ChevronDown
                size={20}
                className={`text-white transform transition-transform duration-200 ${
                  isExpanded ? "rotate-180" : ""
                }`}
              />
            </button>

            {isExpanded && (
              <div className="bg-[#2E2E2E] text-sm text-white p-4 rounded-b-xl mt-2 space-y-2">
                {label === "Hazard Map" && (
                  <>
                    {/* Hydro */}
                    <button
                      onClick={() => setHydroExpanded((prev) => !prev)}
                      className="flex justify-between items-center w-full bg-transparent text-white px-2 py-2 rounded hover:bg-[#3a3a3a] transition"
                    >
                      <div className="flex items-center gap-2">
                        <Droplet size={20} />
                        <span className="text-base font-medium">
                          Hydro-Meteorological
                        </span>
                      </div>
                      <ChevronDown
                        size={18}
                        className={`text-white transition-transform duration-200 ${
                          hydroExpanded ? "rotate-180" : ""
                        }`}
                      />
                    </button>
                    {hydroExpanded && (
                      <div className="pl-7 pt-2 pb-2 space-y-2">
                        {hydroMeteorologicalCheckboxItems.map((item) => (
                          <div key={item} className="flex items-center">
                            <Checkbox
                              className="mr-3 w-[18px] h-[18px]"
                              checked={hydroCheckedItems.includes(item)}
                              onCheckedChange={() => toggleHydroItem(item)}
                            />
                            <span className="text-base">{item}</span>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Geological */}
                    <button
                      onClick={() => setGeologicalExpanded((prev) => !prev)}
                      className="flex justify-between items-center w-full bg-transparent text-white px-2 py-2 rounded hover:bg-[#3a3a3a] transition"
                    >
                      <div className="flex items-center gap-2">
                        <Mountain size={20} />
                        <span className="text-base font-medium">
                          Geological
                        </span>
                      </div>
                      <ChevronDown
                        size={18}
                        className={`text-white transition-transform duration-200 ${
                          geologicalExpanded ? "rotate-180" : ""
                        }`}
                      />
                    </button>
                    {geologicalExpanded && (
                      <div className="pl-7 pt-2 pb-2 space-y-2">
                        {geologicalCheckboxItems.map((item) => (
                          <div key={item} className="flex items-center">
                            <Checkbox
                              className="mr-3 w-[18px] h-[18px]"
                              checked={geologicalCheckedItems.includes(item)}
                              onCheckedChange={() => toggleGeologicalItem(item)}
                            />
                            <span className="text-base">{item}</span>
                          </div>
                        ))}
                      </div>
                    )}

                    <PanelToggle
                      title="Traffic Incidents"
                      icon={<TrafficCone size={20} />}
                      expanded={trafficExpanded}
                      onToggle={() => setTrafficExpanded((prev) => !prev)}
                      items={trafficCheckboxItems}
                      checkedItems={trafficCheckedItems}
                      onCheck={toggleTrafficItem}
                    />

                    <TransparentButton
                      label="Air Quality Index (AQI)"
                      icon={<Wind size={20} />}
                    />
                    <TransparentButton
                      label="Active Fire"
                      icon={<Flame size={20} />}
                    />
                    <TransparentButton
                      label="Infectious Disease"
                      icon={<Bug size={20} />}
                    />
                  </>
                )}

                {label === "Exposure Map" && (
                  <>
                    <PanelToggle
                      title="Population"
                      icon={<PersonStanding size={20} />}
                      expanded={populationExpanded}
                      onToggle={() => setPopulationExpanded((prev) => !prev)}
                      items={populationCheckboxItems}
                      checkedItems={populationCheckedItems}
                      onCheck={togglePopulationItem}
                    />
                    <PanelToggle
                      title="Biological"
                      icon={<Sprout size={20} />}
                      expanded={biologicalExpanded}
                      onToggle={() => setBiologicalExpanded((prev) => !prev)}
                      items={biologicalCheckboxItems}
                      checkedItems={biologicalCheckedItems}
                      onCheck={toggleBiologicalItem}
                    />
                    <PanelToggle
                      title="Non-Biological"
                      icon={<Building2 size={20} />}
                      expanded={nonBiologicalExpanded}
                      onToggle={() => setNonBiologicalExpanded((prev) => !prev)}
                      items={nonBiologicalCheckboxItems}
                      checkedItems={nonBiologicalCheckedItems}
                      onCheck={toggleNonBiologicalItem}
                    />
                  </>
                )}

                {label === "Vulnerability Map" && (
                  <>
                    <TransparentButton
                      label="Population"
                      icon={<PersonStanding size={20} />}
                    />
                    <TransparentButton
                      label="Biological"
                      icon={<Sprout size={20} />}
                    />
                    <TransparentButton
                      label="Non-Biological"
                      icon={<Building2 size={20} />}
                    />
                  </>
                )}

                {label === "Critical Facility Map" && (
                  <>
                    <TransparentButton
                      label="Active Evacuation Area"
                      icon={<LandPlot size={20} />}
                    />
                    {/* Medical / Health */}
                    {/* Medical / Health */}
                    <button
                      onClick={() => setMedicalExpanded((prev) => !prev)}
                      className="flex justify-between items-center w-full bg-transparent text-white px-2 py-2 rounded hover:bg-[#3a3a3a] transition"
                    >
                      <div className="flex items-center gap-2">
                        <BriefcaseMedical size={20} />
                        <span className="text-base font-medium">
                          Medical / Health
                        </span>
                      </div>
                      <ChevronDown
                        size={18}
                        className={`text-white transition-transform duration-200 ${
                          medicalExpanded ? "rotate-180" : ""
                        }`}
                      />
                    </button>

                    {medicalExpanded && (
                      <div className="pl-8 pr-6 pt-2 pb-2 space-y-2 w-full">
                        <div className="relative w-full">
                          <button
                            onClick={() => setDropdownOpen((prev) => !prev)}
                            className="flex justify-between items-center w-full bg-[#3a3a3a] text-white p-2 px-3 rounded-md"
                          >
                            <span>{selectedCountry || "Select a Country"}</span>
                            <ChevronDown
                              size={16}
                              className={`ml-2 transition-transform duration-200 ${
                                dropdownOpen ? "rotate-180" : ""
                              }`}
                            />
                          </button>

                          {dropdownOpen && (
                            <div className="absolute left-0 right-0 z-10 mt-1 bg-[#3a3a3a] rounded-md shadow-lg">
                              {/* Search Box */}
                              <div className="p-2">
                                <input
                                  type="text"
                                  placeholder="Search country..."
                                  value={searchTerm}
                                  onChange={(e) =>
                                    setSearchTerm(e.target.value)
                                  }
                                  className="w-full p-2 rounded-md text-white outline-none focus:ring-0 focus:outline-none hover:outline-none"
                                />
                              </div>

                              {/* Filtered country list */}
                              <ul
                                ref={listRef}
                                className="max-h-35 overflow-y-auto"
                              >
                                {countries
                                  .filter((c) =>
                                    c
                                      .toLowerCase()
                                      .includes(searchTerm.toLowerCase())
                                  )
                                  .map((country, index, arr) => (
                                    <li
                                      key={index}
                                      onClick={async () => {
                                        setSelectedCountry(country);
                                        setDropdownOpen(false);
                                        setSearchTerm("");

                                        const config =
                                          healthFacilities[country];
                                        if (config && mapRef.current) {
                                          mapRef.current.flyTo({
                                            center: config.center,
                                            zoom: config.zoom,
                                            essential: true,
                                          });

                                          try {
                                            const res = await fetch(
                                              config.geojsonUrl
                                            );
                                            const data = await res.json();
                                            mapRef.current.drawHealthFacilities?.(
                                              data
                                            );
                                          } catch (err) {
                                            console.error(
                                              "Failed to fetch health facilities for",
                                              country,
                                              err
                                            );
                                          }
                                        }
                                      }}
                                      className={`px-3 py-2 hover:bg-[#505050] cursor-pointer
                                        ${
                                          index === arr.length - 1
                                            ? "rounded-bl-md"
                                            : ""
                                        }
                                        ${
                                          index === arr.length - 1 &&
                                          !hasScrollbar
                                            ? "rounded-br-md"
                                            : ""
                                        }`}
                                    >
                                      {country}
                                    </li>
                                  ))}
                              </ul>
                            </div>
                          )}
                        </div>
                        {/* --- NEW "Clear Map" button --- */}
                        <button
                          onClick={() => {
                            mapRef.current?.clearHealthFacilities?.();
                            setSelectedCountry(""); // reset dropdown label
                          }}
                          className="w-full py-2 rounded-md mt-2 bg-[#5A5C99] text-white hover:opacity-90 shadow-md"
                        >
                          Clear Map
                        </button>
                      </div>
                    )}

                    <TransparentButton
                      label="Supply Hub / Store"
                      icon={<ShoppingCart size={20} />}
                    />
                    <TransparentButton
                      label="Public Transport"
                      icon={<BusFront size={20} />}
                    />
                    <TransparentButton
                      label="Command & Response"
                      icon={<Siren size={20} />}
                    />
                  </>
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

function TransparentButton({
  label,
  icon,
}: {
  label: string;
  icon?: React.ReactNode;
}) {
  return (
    <button className="flex justify-between items-center w-full bg-transparent text-white px-2 py-2 rounded hover:bg-[#3a3a3a] transition">
      <div className="flex items-center gap-2">
        {icon}
        <span className="text-base font-medium">{label}</span>
      </div>
      <ChevronDown size={18} className="text-white" />
    </button>
  );
}

function PanelToggle({
  title,
  icon,
  expanded,
  onToggle,
  items,
  checkedItems,
  onCheck,
}: {
  title: string;
  icon: React.ReactNode;
  expanded: boolean;
  onToggle: () => void;
  items: string[];
  checkedItems: string[];
  onCheck: (item: string) => void;
}) {
  return (
    <>
      <button
        onClick={onToggle}
        className="flex justify-between items-center w-full bg-transparent text-white px-2 py-2 rounded hover:bg-[#3a3a3a] transition"
      >
        <div className="flex items-center gap-2">
          {icon}
          <span className="text-base font-medium">{title}</span>
        </div>
        <ChevronDown
          size={18}
          className={`text-white transition-transform duration-200 ${
            expanded ? "rotate-180" : ""
          }`}
        />
      </button>
      {expanded && (
        <div className="pl-7 pt-2 pb-2 space-y-2">
          {items.map((item) => (
            <div key={item} className="flex items-center">
              <Checkbox
                className="mr-3 w-[18px] h-[18px]"
                checked={checkedItems.includes(item)}
                onCheckedChange={() => onCheck(item)}
              />
              <span className="text-base">{item}</span>
            </div>
          ))}
        </div>
      )}
    </>
  );
}
