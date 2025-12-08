// \frontend\src\components\controls\Features\ToolPanel.tsx
"use client";

import { useState, useRef, useEffect } from "react";
import { ChevronDown } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import CriticalFacilityMapControls from "./Maps/Critical Facility Layers/CriticalFacilityLayersControls";
import ResourcePlannerControls from "./Planning Suite/Resource Planner/ResourcePlannerControls";
import HazardMapControls from "./Maps/Hazard Layers/HazardLayersControls";
import ExposureAssessmentControls, {
  ExposureAssessmentControlsRef,
} from "./Assessment Tools/Exposure Assessment/ExposureAssessmentControls";
import VulnerabilityAssessmentControls from "./Assessment Tools/Vulnerability Assessment/VulnerabilityAssessmentControls";

interface Props {
  isVisible: boolean;
  selectedMaps: string[];
  selectedPlanningTools: string[];
  selectedAssessmentTools: string[];
  mapRef: React.RefObject<any>;
  uploadedFiles?: { name: string; layerName: string }[];
  onShowAspectRatioSelector?: (show: boolean) => void;
  expandedPanels: Record<string, boolean>;
  setExpandedPanels: React.Dispatch<
    React.SetStateAction<Record<string, boolean>>
  >;
  onPlanSelect?: (plan: { name: string; date: string }) => void;
  activePlan?: { name: string; date: string } | null;
  // Traffic expanded state
  trafficExpanded: boolean;
  setTrafficExpanded: React.Dispatch<React.SetStateAction<boolean>>;
  // Earthquake state synchronization
  earthquakeEnabled?: boolean;
  onEarthquakeToggle?: (enabled: boolean) => void;
  // Volcano list state synchronization
  volcanoListEnabled?: boolean;
  onVolcanoListToggle?: (enabled: boolean) => void;
  // Active faults state synchronization
  activeFaultsEnabled?: boolean;
  onActiveFaultsToggle?: (enabled: boolean) => void;
  // Congestion state synchronization
  congestionEnabled?: boolean;
  onCongestionToggle?: (enabled: boolean) => void;
  onStartExposureAnalysis?: () => void;
  // Exposure assessment
  onRunExposureAnalysis?: (
    data: any,
    affectedAreas?: GeoJSON.FeatureCollection
  ) => void;
  exposureAssessmentRef?: React.RefObject<ExposureAssessmentControlsRef | null>;
  // Geological section expanded state (for AI control)
  geologicalExpanded?: boolean;
  setGeologicalExpanded?: React.Dispatch<React.SetStateAction<boolean>>;
}

const displayNameMap: Record<string, string> = {
  "Hazard Layers": "Hazard Layers",
  "Critical Facility Layers": "Critical Facility Layers",
};

const displayNamePlanningTools: Record<string, string> = {
  "Resource Planner": "Resource Planner",
  "Evacuation Planner": "Evacuation Planner",
  "Recovery Planner": "Recovery Planner",
};

const displayNameAssessmentTools: Record<string, string> = {
  "Exposure Assessment": "Exposure Assessment",
  "Vulnerability Assessment": "Vulnerability Assessment",
};

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

export default function ToolPanel({
  isVisible,
  selectedMaps,
  selectedPlanningTools,
  selectedAssessmentTools,
  mapRef,
  uploadedFiles = [],
  onShowAspectRatioSelector,
  earthquakeEnabled = false,
  onEarthquakeToggle,
  volcanoListEnabled = false,
  geologicalExpanded: geologicalExpandedProp,
  setGeologicalExpanded: setGeologicalExpandedProp,
  onVolcanoListToggle,
  activeFaultsEnabled = false,
  onActiveFaultsToggle,
  congestionEnabled = false,
  onCongestionToggle,
  expandedPanels,
  setExpandedPanels,
  trafficExpanded,
  setTrafficExpanded,
  onStartExposureAnalysis,
  onRunExposureAnalysis,
  exposureAssessmentRef,
}: Props) {
  const [hydroExpanded, setHydroExpanded] = useState(false);
  const [hydroCheckedItems, setHydroCheckedItems] = useState<string[]>([]);
  // Use prop if provided, otherwise use internal state
  const [geologicalExpandedInternal, setGeologicalExpandedInternal] =
    useState(false);
  const geologicalExpanded =
    geologicalExpandedProp ?? geologicalExpandedInternal;
  const setGeologicalExpanded =
    setGeologicalExpandedProp ?? setGeologicalExpandedInternal;
  const [geologicalCheckedItems, setGeologicalCheckedItems] = useState<
    string[]
  >(() => {
    const items = [];
    if (earthquakeEnabled) items.push("Earthquake");
    if (volcanoListEnabled) items.push("Volcano List");
    if (activeFaultsEnabled) items.push("Active Faults");
    return items;
  });

  const [trafficExpandedState, setTrafficExpandedState] = useState(false);
  const [trafficCheckedItems, setTrafficCheckedItems] = useState<string[]>(
    () => {
      const items = [];
      if (congestionEnabled) items.push("Congestion");
      return items;
    }
  );

  const earthquakeInterval = useRef<NodeJS.Timeout | null>(null);

  const [resourcesOnMap, setResourcesOnMap] = useState<
    {
      id: string;
      type: string;
      data: { name: string; description: string };
      coords: { lng: number; lat: number };
    }[]
  >([]);

  useEffect(() => {
    if (mapRef.current?.onResourcesChanged) {
      mapRef.current.onResourcesChanged((resources: any[]) => {
        setResourcesOnMap(resources);
      });
    }
  }, [mapRef]);

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

  if (!isVisible) return null;

  const togglePanel = (key: string) => {
    setExpandedPanels((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  const toggleHydroItem = (item: string) => {
    setHydroCheckedItems((prev) =>
      prev.includes(item) ? prev.filter((i) => i !== item) : [...prev, item]
    );
  };

  const exportAsGeoJSON = () => {
    const geojson = {
      type: "FeatureCollection",
      features: resourcesOnMap.map((resource) => ({
        type: "Feature",
        geometry: {
          type: "Point",
          coordinates: [resource.coords.lng, resource.coords.lat], // ✅ use coords
        },
        properties: {
          id: resource.id,
          type: resource.type,
          name: resource.data.name,
          description: resource.data.description,
        },
      })),
    };

    const blob = new Blob([JSON.stringify(geojson, null, 2)], {
      type: "application/json",
    });

    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "resources.geojson";
    link.click();
    URL.revokeObjectURL(url);
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
        // Notify parent to enable (which handles all the shared state)
        onCongestionToggle?.(true);
      } else {
        // Notify parent to disable (which handles all the cleanup)
        onCongestionToggle?.(false);
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
      // Remove congestion cleanup since it's handled by parent
      // if (congestionIntervalRef.current)
      //   clearInterval(congestionIntervalRef.current);
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
      // Remove congestion bounds listener cleanup since it's handled by parent
      // if (registeredCongestionCallbackRef.current) {
      //   mapRef.current?.unregisterBoundsListener?.(
      //     registeredCongestionCallbackRef.current
      //   );
      // }
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
        // Notify parent of state change
        onEarthquakeToggle?.(true);
      } else {
        mapRef.current?.drawEarthquakeDots([]);
        stopEarthquakePolling();
        // Notify parent of state change
        onEarthquakeToggle?.(false);
      }
    }

    if (item === "Volcano List") {
      if (!isAlreadyChecked) {
        try {
          const res = await fetch("http://localhost:8000/hazards/volcanoes");
          const data = await res.json();
          mapRef.current?.drawVolcanoDots(data);
          // Notify parent of state change
          onVolcanoListToggle?.(true);
        } catch (err) {
          console.error("Failed to fetch volcano data:", err);
        }
      } else {
        mapRef.current?.drawVolcanoDots([]); // remove volcano dots when unchecked
        // Notify parent of state change
        onVolcanoListToggle?.(false);
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
          // Notify parent of state change
          onActiveFaultsToggle?.(true);
        } catch (err) {
          console.error("Failed to fetch Active Faults data:", err);
        }
      } else {
        mapRef.current?.drawActiveFaults(null); // remove faults when unchecked
        // Notify parent of state change
        onActiveFaultsToggle?.(false);
      }
    }
  };

  // Synchronize earthquake state with parent
  // AFTER (replace the previous useEffect)
  useEffect(() => {
    const shouldHaveEarthquake = earthquakeEnabled;
    const hasEarthquake = geologicalCheckedItems.includes("Earthquake");

    if (shouldHaveEarthquake === hasEarthquake) return;

    if (shouldHaveEarthquake) {
      // Ensure geological section is expanded
      setGeologicalExpanded(true);

      // add checkbox if not present
      setGeologicalCheckedItems((prev) =>
        prev.includes("Earthquake") ? prev : [...prev, "Earthquake"]
      );

      // fetch once and start child polling so the child's interval is active
      (async () => {
        try {
          const combinedFeatures = await fetchCombinedEarthquakeData();
          mapRef.current?.drawEarthquakeDots(combinedFeatures);
          // Start the ToolPanel's own polling loop
          startEarthquakePolling();
          // Also notify parent via onEarthquakeToggle if you want (parent already set earthquakeEnabled)
          // onEarthquakeToggle?.(true); // optional, avoid loop if parent already set it
        } catch (err) {
          console.error("ToolPanel: failed to sync earthquake on enable:", err);
        }
      })();
    } else {
      // parent says disable -> ensure child stops its polling and clears map
      setGeologicalCheckedItems((prev) =>
        prev.filter((item) => item !== "Earthquake")
      );

      try {
        stopEarthquakePolling();
      } catch (err) {
        console.warn("ToolPanel: stopEarthquakePolling error:", err);
      }

      // Clear earthquake dots immediately
      mapRef.current?.drawEarthquakeDots([]);
      // Also notify parent if needed: onEarthquakeToggle?.(false);
    }
  }, [earthquakeEnabled]);

  // Synchronize volcano list state with parent
  useEffect(() => {
    const shouldHaveVolcanoList = volcanoListEnabled;
    const hasVolcanoList = geologicalCheckedItems.includes("Volcano List");

    if (shouldHaveVolcanoList === hasVolcanoList) return;

    if (shouldHaveVolcanoList) {
      // Ensure geological section is expanded
      setGeologicalExpanded(true);

      // add checkbox if not present
      setGeologicalCheckedItems((prev) =>
        prev.includes("Volcano List") ? prev : [...prev, "Volcano List"]
      );

      // fetch and display volcano data
      (async () => {
        try {
          const res = await fetch("http://localhost:8000/hazards/volcanoes");
          const data = await res.json();
          mapRef.current?.drawVolcanoDots(data);
        } catch (err) {
          console.error("Failed to fetch volcano data:", err);
        }
      })();
    } else {
      // parent says disable -> ensure child removes checkbox and clears map
      setGeologicalCheckedItems((prev) =>
        prev.filter((item) => item !== "Volcano List")
      );
      // Clear volcano dots immediately
      mapRef.current?.drawVolcanoDots([]);
    }
  }, [volcanoListEnabled]);

  // Synchronize active faults state with parent
  useEffect(() => {
    const shouldHaveActiveFaults = activeFaultsEnabled;
    const hasActiveFaults = geologicalCheckedItems.includes("Active Faults");

    if (shouldHaveActiveFaults === hasActiveFaults) return;

    if (shouldHaveActiveFaults) {
      // Ensure geological section is expanded first
      setGeologicalExpanded(true);

      // add checkbox if not present
      setGeologicalCheckedItems((prev) =>
        prev.includes("Active Faults") ? prev : [...prev, "Active Faults"]
      );

      // fetch and display active faults data
      (async () => {
        try {
          const res = await fetch(
            "http://localhost:8000/hazards/active-faults"
          );
          const data = await res.json();
          mapRef.current?.drawActiveFaults(data);
        } catch (err) {
          console.error(
            "ToolPanel: failed to sync active faults on enable:",
            err
          );
        }
      })();
    } else {
      // parent says disable -> ensure child removes checkbox and clears map
      setGeologicalCheckedItems((prev) =>
        prev.filter((item) => item !== "Active Faults")
      );

      // Clear active faults data immediately
      mapRef.current?.drawActiveFaults(null);
    }
  }, [activeFaultsEnabled]);

  // Synchronize congestion state with parent
  useEffect(() => {
    const shouldHaveCongestion = congestionEnabled;
    const hasCongestion = trafficCheckedItems.includes("Congestion");

    if (shouldHaveCongestion === hasCongestion) return;

    if (shouldHaveCongestion) {
      // Ensure traffic section is expanded first
      setTrafficExpanded(true);

      // Add checkbox if not present
      setTrafficCheckedItems((prev) =>
        prev.includes("Congestion") ? prev : [...prev, "Congestion"]
      );
    } else {
      setTrafficCheckedItems((prev) =>
        prev.filter((item) => item !== "Congestion")
      );
    }
  }, [congestionEnabled]);

  useEffect(() => {
    return () => {
      stopEarthquakePolling(); // Cleanup on unmount
    };
  }, []);

  return (
    <div
      className="w-full bg-transparent rounded-md shadow-md text-[#C7C7C7] flex flex-col overflow-y-auto scrollbar-rounded"
      style={{ maxHeight: "calc(100vh - 91px)", padding: "0px" }}
    >
      {[
        ...selectedMaps,
        ...selectedPlanningTools,
        ...selectedAssessmentTools,
      ].map((label, index, arr) => {
        const isMap = label in displayNameMap;
        const isPlanningTool = label in displayNamePlanningTools;
        const isAssessmentTool = label in displayNameAssessmentTools;

        const displayName = isMap
          ? displayNameMap[label]
          : isPlanningTool
          ? displayNamePlanningTools[label]
          : isAssessmentTool
          ? displayNameAssessmentTools[label]
          : label;

        const key = `${
          isMap ? "map" : isPlanningTool ? "planning" : "assessment"
        }-${label}`;
        const isExpanded = expandedPanels[key];

        return (
          <div key={key} className={index !== arr.length - 1 ? "mb-3" : ""}>
            <button
              onClick={() => togglePanel(key)}
              className={`flex justify-between items-center px-4 w-full ${
                isExpanded ? "rounded-t-md" : "rounded-md"
              }`}
              style={{ height: "40px", backgroundColor: "#454545" }}
            >
              <span className="text-[11px] font-medium text-white">
                {displayName}
              </span>
              <ChevronDown
                size={14}
                className={`text-white transform transition-transform duration-200 ${
                  isExpanded ? "rotate-180" : ""
                }`}
              />
            </button>

            {isExpanded && (
              <div className="bg-[#2E2E2E] text-[10px] text-white p-3 rounded-b-md mt-2 space-y-2">
                {/* Hazard Layers Controls */}
                {label === "Hazard Layers" && (
                  <HazardMapControls
                    hydroExpanded={hydroExpanded}
                    setHydroExpanded={setHydroExpanded}
                    hydroMeteorologicalCheckboxItems={
                      hydroMeteorologicalCheckboxItems
                    }
                    hydroCheckedItems={hydroCheckedItems}
                    toggleHydroItem={toggleHydroItem}
                    geologicalExpanded={geologicalExpanded}
                    setGeologicalExpanded={setGeologicalExpanded}
                    geologicalCheckboxItems={geologicalCheckboxItems}
                    geologicalCheckedItems={geologicalCheckedItems}
                    toggleGeologicalItem={toggleGeologicalItem}
                    trafficExpanded={trafficExpanded}
                    setTrafficExpanded={setTrafficExpanded}
                    trafficCheckboxItems={trafficCheckboxItems}
                    trafficCheckedItems={trafficCheckedItems}
                    toggleTrafficItem={toggleTrafficItem}
                    PanelToggle={PanelToggle}
                    TransparentButton={TransparentButton}
                    mapRef={mapRef}
                  />
                )}

                {/* Critical Facility Layers Controls */}
                {label === "Critical Facility Layers" && (
                  <CriticalFacilityMapControls mapRef={mapRef} />
                )}

                {/* Resource Planner Controls */}
                {label === "Resource Planner" && (
                  <ResourcePlannerControls
                    resourcesOnMap={resourcesOnMap}
                    mapRef={mapRef}
                    exportAsGeoJSON={exportAsGeoJSON}
                  />
                )}

                {/* Exposure Assessment Controls */}
                {label === "Exposure Assessment" && (
                  <ExposureAssessmentControls
                    ref={exposureAssessmentRef}
                    PanelToggle={PanelToggle}
                    mapRef={mapRef}
                    uploadedFiles={uploadedFiles}
                    onShowAspectRatioSelector={onShowAspectRatioSelector}
                    onStartAnalysis={onStartExposureAnalysis}
                    onRunAnalysis={onRunExposureAnalysis}
                  />
                )}

                {/* Vulnerability Assessment Controls */}
                {label === "Vulnerability Assessment" && (
                  <VulnerabilityAssessmentControls PanelToggle={PanelToggle} />
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
        <span className="text-[10px] font-medium">{label}</span>
      </div>
      <ChevronDown size={14} className="text-white" />
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
          <span className="text-[10px] font-medium">{title}</span>
        </div>
        <ChevronDown
          size={14}
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
                className="mr-3 w-[14px] h-[14px]"
                checked={checkedItems.includes(item)}
                onCheckedChange={() => onCheck(item)}
              />
              <span className="text-[10px]">{item}</span>
            </div>
          ))}
        </div>
      )}
    </>
  );
}
