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
  Users,
  House,
  Tent,
  ShoppingBasket,
  Bus,
  Antenna,
  Building,
  Route,
  SquareStack,
  Trash,
} from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { healthFacilities } from "./HealthFacilities";

interface Props {
  isVisible: boolean;
  selectedMaps: string[];
  selectedPlanningTools: string[];
  mapRef: React.RefObject<any>;
  onPlanSelect?: (plan: { name: string; date: string }) => void;
  activePlan?: { name: string; date: string } | null;
}

const displayNameMap: Record<string, string> = {
  "Hazard Mapper": "Hazard Mapper",
  "Exposure Analyzer": "Exposure Analyzer",
  "Vulnerability Analyzer": "Vulnerability Analyzer",
  "Critical Facility Mapper": "Critical Facility Mapper",
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

export default function ToolPanel({
  isVisible,
  selectedMaps,
  selectedPlanningTools,
  mapRef,
  onPlanSelect,
  activePlan,
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

  const [regionOpen, setRegionOpen] = useState(false);
  const [selectedRegion, setSelectedRegion] = useState("");
  const [regionSearch, setRegionSearch] = useState("");

  const [continentOpen, setContinentOpen] = useState(false);
  const [selectedContinent, setSelectedContinent] = useState("");

  const [trafficExpanded, setTrafficExpanded] = useState(false);
  const [trafficCheckedItems, setTrafficCheckedItems] = useState<string[]>([]);

  const [sourceOpen, setSourceOpen] = useState(false);
  const [selectedSource, setSelectedSource] = useState("");

  const earthquakeInterval = useRef<NodeJS.Timeout | null>(null);

  const [scopeLevelOpen, setScopeLevelOpen] = useState(false);
  const [selectedScopeLevel, setSelectedScopeLevel] = useState("");

  const [provinceOpen, setProvinceOpen] = useState(false);
  const [selectedProvince, setSelectedProvince] = useState("");
  const [provinceSearch, setProvinceSearch] = useState("");

  // Flood scope dropdown state
  const [floodScopeOpen, setFloodScopeOpen] = useState(false);
  const [selectedScope, setSelectedScope] = useState("");

  const [medicalExpanded, setMedicalExpanded] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [selectedCountry, setSelectedCountry] = useState("");

  const [returnPeriods, setReturnPeriods] = useState({
    five: false,
    twentyFive: false,
    hundred: false,
  });

  const [floodCountryOpen, setFloodCountryOpen] = useState(false);
  const [selectedFloodCountry, setSelectedFloodCountry] = useState("");
  const [floodCountrySearch, setFloodCountrySearch] = useState("");

  const [searchTerm, setSearchTerm] = useState("");

  const [resourcesOnMap, setResourcesOnMap] = useState<
    {
      id: string;
      type: string;
      data: { name: string; description: string };
      coords: { lng: number; lat: number };
    }[]
  >([]);

  const [municipalityOpen, setMunicipalityOpen] = useState(false);
  const [selectedMunicipality, setSelectedMunicipality] = useState("");
  const [municipalitySearch, setMunicipalitySearch] = useState("");

  const [personnelExpanded, setPersonnelExpanded] = useState(false);
  const [infraExpanded, setInfraExpanded] = useState(false);
  const [suppliesExpanded, setSuppliesExpanded] = useState(false);

  const [plans, setPlans] = useState<{ name: string; date: string }[]>([]);
  const [selectedPlan, setSelectedPlan] = useState<{
    name: string;
    date: string;
  } | null>(null);

  const [isPlanModalOpen, setIsPlanModalOpen] = useState(false);
  const [newPlanName, setNewPlanName] = useState("");
  const [planToDelete, setPlanToDelete] = useState<number | null>(null);

  // function to handle creation
  const handleCreatePlan = () => {
    if (newPlanName.trim()) {
      const newPlan = {
        name: newPlanName.trim(),
        date: new Date().toLocaleString(), // e.g. "8/30/2025, 2:35 PM"
      };
      setPlans((prev) => [...prev, newPlan]);
      setNewPlanName("");
      setIsPlanModalOpen(false);
    }
  };

  useEffect(() => {
    if (mapRef.current?.onResourcesChanged) {
      mapRef.current.onResourcesChanged((resources: any[]) => {
        setResourcesOnMap(resources);
      });
    }
  }, [mapRef]);

  const resourceIcons: Record<string, React.ReactNode> = {
    personnel: <Users size={15} className="text-gray-400" />,
    shelter: <House size={15} className="text-gray-400" />,
    infra: <Tent size={15} className="text-gray-400" />,
    supply: <ShoppingBasket size={15} className="text-gray-400" />,
    transport: <Bus size={15} className="text-gray-400" />,
    comm: <Antenna size={15} className="text-gray-400" />,
  };

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
        "http://localhost:8000/earthquakes/latest"
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
                {label === "Hazard Mapper" && (
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
                          <div key={item} className="flex flex-col">
                            <div className="flex items-center">
                              <Checkbox
                                className="mr-3 w-[18px] h-[18px]"
                                checked={hydroCheckedItems.includes(item)}
                                onCheckedChange={() => toggleHydroItem(item)}
                              />
                              <span className="text-base">{item}</span>
                            </div>

                            {/* 👇 Show dropdown when Flood is checked */}
                            {item === "Flood" &&
                              hydroCheckedItems.includes("Flood") && (
                                <div className="ml-7 pt-2 pb-2 relative w-[250px]">
                                  <button
                                    onClick={() =>
                                      setFloodScopeOpen((prev) => !prev)
                                    }
                                    className="flex justify-between items-center w-full bg-[#3a3a3a] text-white p-2 px-3 rounded-md"
                                  >
                                    <span>
                                      {selectedScope || "Select Scope"}
                                    </span>
                                    <ChevronDown
                                      size={16}
                                      className={`ml-2 transition-transform duration-200 ${
                                        floodScopeOpen ? "rotate-180" : ""
                                      }`}
                                    />
                                  </button>
                                  {floodScopeOpen && (
                                    <div className="absolute left-0 z-10 mt-1 w-full bg-[#3a3a3a] rounded-md shadow-lg overflow-hidden">
                                      {[
                                        "Global",
                                        "By Continent/Region",
                                        "By Country",
                                      ].map((option, index, arr) => (
                                        <div
                                          key={option}
                                          onClick={() => {
                                            setSelectedScope(option);
                                            setFloodScopeOpen(false);
                                          }}
                                          className={`px-3 py-2 hover:bg-[#505050] cursor-pointer 
          ${index === 0 ? "rounded-t-md" : ""} 
          ${index === arr.length - 1 ? "rounded-b-md" : ""}`}
                                        >
                                          {option}
                                        </div>
                                      ))}
                                    </div>
                                  )}
                                  {/* 👇 Show continent dropdown when "By Continent/Region" is selected */}
                                  {selectedScope === "By Continent/Region" && (
                                    <div className="mt-2 relative w-[250px]">
                                      <button
                                        onClick={() =>
                                          setContinentOpen((prev) => !prev)
                                        }
                                        className="flex justify-between items-center w-full bg-[#3a3a3a] text-white p-2 px-3 rounded-md"
                                      >
                                        <span>
                                          {selectedContinent ||
                                            "Select Continent/Region"}
                                        </span>
                                        <ChevronDown
                                          size={16}
                                          className={`ml-2 transition-transform duration-200 ${
                                            continentOpen ? "rotate-180" : ""
                                          }`}
                                        />
                                      </button>

                                      {continentOpen && (
                                        <div className="absolute left-0 z-10 mt-1 w-full bg-[#3a3a3a] rounded-md shadow-lg overflow-hidden">
                                          {[
                                            "Asia",
                                            "Africa",
                                            "North America",
                                            "South America",
                                            "Antarctica",
                                            "Europe",
                                            "Australia / Oceania",
                                          ].map((continent, index, arr) => (
                                            <div
                                              key={continent}
                                              onClick={() => {
                                                setSelectedContinent(continent);
                                                setContinentOpen(false);
                                              }}
                                              className={`px-3 py-2 hover:bg-[#505050] cursor-pointer
                                                ${
                                                  index === 0
                                                    ? "rounded-t-md"
                                                    : ""
                                                }
                                                ${
                                                  index === arr.length - 1
                                                    ? "rounded-b-md"
                                                    : ""
                                                }`}
                                            >
                                              {continent}
                                            </div>
                                          ))}
                                        </div>
                                      )}
                                    </div>
                                  )}
                                  {/* 👇 Show country dropdown when "By Country" is selected */}
                                  {selectedScope === "By Country" && (
                                    <div className="mt-2 relative w-[250px]">
                                      <button
                                        onClick={() =>
                                          setFloodCountryOpen((prev) => !prev)
                                        }
                                        className="flex justify-between items-center w-full bg-[#3a3a3a] text-white p-2 px-3 rounded-md"
                                      >
                                        <span>
                                          {selectedFloodCountry ||
                                            "Select Country"}
                                        </span>
                                        <ChevronDown
                                          size={16}
                                          className={`ml-2 transition-transform duration-200 ${
                                            floodCountryOpen ? "rotate-180" : ""
                                          }`}
                                        />
                                      </button>

                                      {floodCountryOpen && (
                                        <div className="absolute left-0 z-10 mt-1 w-full bg-[#3a3a3a] rounded-md shadow-lg">
                                          {/* Search Box */}
                                          <div className="p-2">
                                            <input
                                              type="text"
                                              placeholder="Search country..."
                                              value={floodCountrySearch}
                                              onChange={(e) =>
                                                setFloodCountrySearch(
                                                  e.target.value
                                                )
                                              }
                                              className="w-full p-2 text-white placeholder-gray-400 outline-none bg-transparent"
                                            />
                                          </div>

                                          {/* Country List */}
                                          <ul className="max-h-40 overflow-y-auto">
                                            {[
                                              "Philippines",
                                              "South Africa",
                                              "United States",
                                            ]
                                              .filter((c) =>
                                                c
                                                  .toLowerCase()
                                                  .includes(
                                                    floodCountrySearch.toLowerCase()
                                                  )
                                              )
                                              .map((country, index, arr) => (
                                                <li
                                                  key={country}
                                                  onClick={() => {
                                                    setSelectedFloodCountry(
                                                      country
                                                    );
                                                    setFloodCountryOpen(false);
                                                    setFloodCountrySearch("");
                                                  }}
                                                  className={`px-3 py-2 hover:bg-[#505050] cursor-pointer
                                                    ${
                                                      index === arr.length - 1
                                                        ? "rounded-b-md"
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
                                  )}

                                  {selectedFloodCountry === "Philippines" && (
                                    <div className="mt-2 relative w-[250px]">
                                      <button
                                        onClick={() =>
                                          setScopeLevelOpen((prev) => !prev)
                                        }
                                        className="flex justify-between items-center w-full bg-[#3a3a3a] text-white p-2 px-3 rounded-md"
                                      >
                                        <span>
                                          {selectedScopeLevel ||
                                            "Select Scope Level"}
                                        </span>
                                        <ChevronDown
                                          size={16}
                                          className={`ml-2 transition-transform duration-200 ${
                                            scopeLevelOpen ? "rotate-180" : ""
                                          }`}
                                        />
                                      </button>

                                      {scopeLevelOpen && (
                                        <div className="absolute left-0 z-10 mt-1 w-full bg-[#3a3a3a] rounded-md shadow-lg overflow-hidden">
                                          {[
                                            "National",
                                            "By Region",
                                            "By Province / District",
                                            "By Municipality / City",
                                          ].map((level, index, arr) => (
                                            <div
                                              key={level}
                                              onClick={() => {
                                                setSelectedScopeLevel(level);
                                                setScopeLevelOpen(false);
                                              }}
                                              className={`px-3 py-2 hover:bg-[#505050] cursor-pointer
              ${index === arr.length - 1 ? "rounded-b-md" : ""}`}
                                            >
                                              {level}
                                            </div>
                                          ))}
                                        </div>
                                      )}
                                    </div>
                                  )}

                                  {/* 👇 Show source dropdown when "National" is selected */}
                                  {selectedScopeLevel === "National" && (
                                    <div className="mt-2 relative w-[250px]">
                                      <button
                                        onClick={() =>
                                          setSourceOpen((prev) => !prev)
                                        }
                                        className="flex justify-between items-center w-full bg-[#3a3a3a] text-white p-2 px-3 rounded-md"
                                      >
                                        <span className="truncate max-w-[200px]">
                                          {selectedSource || "Select Source"}
                                        </span>
                                        <ChevronDown
                                          size={16}
                                          className={`ml-2 transition-transform duration-200 ${
                                            sourceOpen ? "rotate-180" : ""
                                          }`}
                                        />
                                      </button>

                                      {sourceOpen && (
                                        <div className="absolute left-0 z-10 mt-1 w-full bg-[#3a3a3a] rounded-md shadow-lg overflow-hidden">
                                          {[
                                            "MGB (Mines and Geosciences Bureau)",
                                            "NOAH (Nationwide Operational Assessment of Hazards)",
                                          ].map((src, index, arr) => (
                                            <div
                                              key={src}
                                              onClick={() => {
                                                setSelectedSource(src);
                                                setSourceOpen(false);
                                              }}
                                              className={`px-3 py-2 hover:bg-[#505050] cursor-pointer
              ${index === arr.length - 1 ? "rounded-b-md" : ""}`}
                                            >
                                              {src}
                                            </div>
                                          ))}
                                        </div>
                                      )}
                                    </div>
                                  )}

                                  {/* 👇 Show region dropdown when "By region" is selected */}
                                  {selectedScopeLevel === "By Region" && (
                                    <div className="mt-2 relative w-[250px]">
                                      <button
                                        onClick={() =>
                                          setRegionOpen((prev) => !prev)
                                        }
                                        className="flex justify-between items-center w-full bg-[#3a3a3a] text-white p-2 px-3 rounded-md"
                                      >
                                        <span className="truncate max-w-[200px]">
                                          {selectedRegion || "Select Region"}
                                        </span>
                                        <ChevronDown
                                          size={16}
                                          className={`ml-2 transition-transform duration-200 ${
                                            regionOpen ? "rotate-180" : ""
                                          }`}
                                        />
                                      </button>

                                      {regionOpen && (
                                        <div className="absolute left-0 z-10 mt-1 w-full bg-[#3a3a3a] rounded-md shadow-lg">
                                          {/* Search Box */}
                                          <div className="p-2">
                                            <input
                                              type="text"
                                              placeholder="Search region..."
                                              value={regionSearch}
                                              onChange={(e) =>
                                                setRegionSearch(e.target.value)
                                              }
                                              className="w-full p-2 text-white placeholder-gray-400 outline-none bg-transparent"
                                            />
                                          </div>

                                          {/* Region List */}
                                          <ul className="max-h-40 overflow-y-auto">
                                            {[
                                              "Region I - Ilocos Region",
                                              "Region II - Cagayan Valley",
                                              "Region III - Central Luzon",
                                              "National Capital Region (NCR)",
                                            ]
                                              .filter((r) =>
                                                r
                                                  .toLowerCase()
                                                  .includes(
                                                    regionSearch.toLowerCase()
                                                  )
                                              )
                                              .map((region, index, arr) => (
                                                <li
                                                  key={region}
                                                  onClick={() => {
                                                    setSelectedRegion(region);
                                                    setRegionOpen(false);
                                                    setRegionSearch("");
                                                  }}
                                                  className={`px-3 py-2 hover:bg-[#505050] cursor-pointer
                  ${index === arr.length - 1 ? "rounded-b-md" : ""}`}
                                                >
                                                  {region}
                                                </li>
                                              ))}
                                          </ul>
                                        </div>
                                      )}
                                    </div>
                                  )}

                                  {/* 👇 Show province/district dropdown when "By Province / District" is selected */}
                                  {selectedScopeLevel ===
                                    "By Province / District" && (
                                    <div className="mt-2 relative w-[250px]">
                                      <button
                                        onClick={() =>
                                          setProvinceOpen((prev) => !prev)
                                        }
                                        className="flex justify-between items-center w-full bg-[#3a3a3a] text-white p-2 px-3 rounded-md"
                                      >
                                        <span className="truncate max-w-[200px]">
                                          {selectedProvince ||
                                            "Select Province / District"}
                                        </span>
                                        <ChevronDown
                                          size={16}
                                          className={`ml-2 transition-transform duration-200 ${
                                            provinceOpen ? "rotate-180" : ""
                                          }`}
                                        />
                                      </button>

                                      {provinceOpen && (
                                        <div className="absolute left-0 z-10 mt-1 w-full bg-[#3a3a3a] rounded-md shadow-lg">
                                          {/* Search Box */}
                                          <div className="p-2">
                                            <input
                                              type="text"
                                              placeholder="Search province..."
                                              value={provinceSearch}
                                              onChange={(e) =>
                                                setProvinceSearch(
                                                  e.target.value
                                                )
                                              }
                                              className="w-full p-2 text-white placeholder-gray-400 outline-none bg-transparent"
                                            />
                                          </div>

                                          {/* Province List */}
                                          <ul className="max-h-40 overflow-y-auto">
                                            {[
                                              "Abra",
                                              "Agusan del Norte",
                                              "Agusan del Sur",
                                              "Aklan",
                                              "Albay",
                                              "Antique",
                                              "Apayao",
                                              "Aurora",
                                              "Basilan",
                                              "Bataan",
                                              "Batanes",
                                              "Batangas",
                                              "Benguet",
                                              "Biliran",
                                              "Bohol",
                                              "Bukidnon",
                                              "Bulacan",
                                            ]
                                              .filter((p) =>
                                                p
                                                  .toLowerCase()
                                                  .includes(
                                                    provinceSearch.toLowerCase()
                                                  )
                                              )
                                              .map((province, index, arr) => (
                                                <li
                                                  key={province}
                                                  onClick={() => {
                                                    setSelectedProvince(
                                                      province
                                                    );
                                                    setProvinceOpen(false);
                                                    setProvinceSearch("");
                                                  }}
                                                  className={`px-3 py-2 hover:bg-[#505050] cursor-pointer
                  ${index === arr.length - 1 ? "rounded-b-md" : ""}`}
                                                >
                                                  {province}
                                                </li>
                                              ))}
                                          </ul>
                                        </div>
                                      )}
                                    </div>
                                  )}

                                  {/* 👇 Show source dropdown when a province/district is selected */}
                                  {selectedProvince && (
                                    <div className="mt-2 relative w-[250px]">
                                      <button
                                        onClick={() =>
                                          setSourceOpen((prev) => !prev)
                                        }
                                        className="flex justify-between items-center w-full bg-[#3a3a3a] text-white p-2 px-3 rounded-md"
                                      >
                                        <span className="truncate max-w-[200px]">
                                          {selectedSource || "Select Source"}
                                        </span>
                                        <ChevronDown
                                          size={16}
                                          className={`ml-2 transition-transform duration-200 ${
                                            sourceOpen ? "rotate-180" : ""
                                          }`}
                                        />
                                      </button>

                                      {sourceOpen && (
                                        <div className="absolute left-0 z-10 mt-1 w-full bg-[#3a3a3a] rounded-md shadow-lg overflow-hidden">
                                          {[
                                            "MGB (Mines and Geosciences Bureau)",
                                            "NOAH (Nationwide Operational Assessment of Hazards)",
                                          ].map((src, index, arr) => (
                                            <div
                                              key={src}
                                              onClick={() => {
                                                setSelectedSource(src);
                                                setSourceOpen(false);
                                              }}
                                              className={`px-3 py-2 hover:bg-[#505050] cursor-pointer
              ${index === arr.length - 1 ? "rounded-b-md" : ""}`}
                                            >
                                              {src}
                                            </div>
                                          ))}
                                        </div>
                                      )}
                                    </div>
                                  )}

                                  {/* 👇 Show NOAH return period checkboxes when NOAH is selected */}
                                  {selectedSource ===
                                    "NOAH (Nationwide Operational Assessment of Hazards)" && (
                                    <div className="mt-2 ml-1">
                                      <span className="text-white text-sm">
                                        Return Period:
                                      </span>
                                      <div className="flex flex-col gap-1 mt-2">
                                        <label className="flex items-center gap-2 text-white text-sm">
                                          <Checkbox
                                            className="w-[16px] h-[16px]"
                                            checked={returnPeriods.five}
                                            onCheckedChange={() =>
                                              setReturnPeriods((prev) => ({
                                                ...prev,
                                                five: !prev.five,
                                              }))
                                            }
                                          />
                                          <span className="min-w-[70px]">
                                            5-Year
                                          </span>
                                        </label>
                                        <label className="flex items-center gap-2 text-white text-sm">
                                          <Checkbox
                                            className="w-[16px] h-[16px]"
                                            checked={returnPeriods.twentyFive}
                                            onCheckedChange={() =>
                                              setReturnPeriods((prev) => ({
                                                ...prev,
                                                twentyFive: !prev.twentyFive,
                                              }))
                                            }
                                          />
                                          <span className="min-w-[70px]">
                                            25-Year
                                          </span>
                                        </label>
                                        <label className="flex items-center gap-2 text-white text-sm">
                                          <Checkbox
                                            className="w-[16px] h-[16px]"
                                            checked={returnPeriods.hundred}
                                            onCheckedChange={() =>
                                              setReturnPeriods((prev) => ({
                                                ...prev,
                                                hundred: !prev.hundred,
                                              }))
                                            }
                                          />
                                          <span className="min-w-[70px]">
                                            100-Year
                                          </span>
                                        </label>
                                      </div>
                                    </div>
                                  )}

                                  {/* 👇 Show municipality/city dropdown when "By Municipality / City" is selected */}
                                  {selectedScopeLevel ===
                                    "By Municipality / City" && (
                                    <div className="mt-2 relative w-[250px]">
                                      <button
                                        onClick={() =>
                                          setMunicipalityOpen((prev) => !prev)
                                        }
                                        className="flex justify-between items-center w-full bg-[#3a3a3a] text-white p-2 px-3 rounded-md"
                                      >
                                        <span className="truncate max-w-[200px]">
                                          {selectedMunicipality ||
                                            "Select Municipality / City"}
                                        </span>
                                        <ChevronDown
                                          size={16}
                                          className={`ml-2 transition-transform duration-200 ${
                                            municipalityOpen ? "rotate-180" : ""
                                          }`}
                                        />
                                      </button>

                                      {municipalityOpen && (
                                        <div className="absolute left-0 z-10 mt-1 w-full bg-[#3a3a3a] rounded-md shadow-lg">
                                          {/* Search Box */}
                                          <div className="p-2">
                                            <input
                                              type="text"
                                              placeholder="Search municipality..."
                                              value={municipalitySearch}
                                              onChange={(e) =>
                                                setMunicipalitySearch(
                                                  e.target.value
                                                )
                                              }
                                              className="w-full p-2 text-white placeholder-gray-400 outline-none bg-transparent"
                                            />
                                          </div>

                                          {/* Municipality List */}
                                          <ul className="max-h-40 overflow-y-auto">
                                            {[
                                              "City of Mandaluyong",
                                              "City of Marikina",
                                              "City of Pasig",
                                              "City of San Juan",
                                              "Quezon City",
                                            ]
                                              .filter((m) =>
                                                m
                                                  .toLowerCase()
                                                  .includes(
                                                    municipalitySearch.toLowerCase()
                                                  )
                                              )
                                              .map(
                                                (municipality, index, arr) => (
                                                  <li
                                                    key={municipality}
                                                    onClick={() => {
                                                      setSelectedMunicipality(
                                                        municipality
                                                      );
                                                      setMunicipalityOpen(
                                                        false
                                                      );
                                                      setMunicipalitySearch("");
                                                    }}
                                                    className={`px-3 py-2 hover:bg-[#505050] cursor-pointer
                  ${index === arr.length - 1 ? "rounded-b-md" : ""}`}
                                                  >
                                                    {municipality}
                                                  </li>
                                                )
                                              )}
                                          </ul>
                                        </div>
                                      )}
                                    </div>
                                  )}
                                </div>
                              )}
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

                {label === "Exposure Analyzer" && (
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
                      title="Biological Assets"
                      icon={<Sprout size={20} />}
                      expanded={biologicalExpanded}
                      onToggle={() => setBiologicalExpanded((prev) => !prev)}
                      items={biologicalCheckboxItems}
                      checkedItems={biologicalCheckedItems}
                      onCheck={toggleBiologicalItem}
                    />
                    <PanelToggle
                      title="Non-Biological Assets"
                      icon={<Building2 size={20} />}
                      expanded={nonBiologicalExpanded}
                      onToggle={() => setNonBiologicalExpanded((prev) => !prev)}
                      items={nonBiologicalCheckboxItems}
                      checkedItems={nonBiologicalCheckedItems}
                      onCheck={toggleNonBiologicalItem}
                    />
                  </>
                )}

                {label === "Vulnerability Analyzer" && (
                  <>
                    <TransparentButton
                      label="Population"
                      icon={<PersonStanding size={20} />}
                    />
                    <TransparentButton
                      label="Biological Assets"
                      icon={<Sprout size={20} />}
                    />
                    <TransparentButton
                      label="Non-Biological Assets"
                      icon={<Building2 size={20} />}
                    />
                  </>
                )}

                {label === "Critical Facility Mapper" && (
                  <>
                    <TransparentButton
                      label="Active Evacuation Area"
                      icon={<LandPlot size={20} />}
                    />
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
                            if (!selectedCountry) return; // do nothing if disabled
                            mapRef.current?.clearHealthFacilities?.();
                            setSelectedCountry(""); // reset dropdown label
                          }}
                          disabled={!selectedCountry}
                          className={`w-full py-2 rounded-md mt-2 
                            ${
                              selectedCountry
                                ? "bg-[#5A5C99] text-white hover:opacity-90 shadow-md"
                                : "bg-[#4c4c4c] text-[#a1a1a1] cursor-not-allowed"
                            }`}
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

                {label === "Evacuation Planner" && (
                  <>
                    <div className="text-left text-white font-semibold mb-2">
                      Available Plans:
                    </div>

                    {/* Wrapper */}
                    {plans.length === 0 ? (
                      // Empty state (centered)
                      <div className="border-2 border-dashed border-gray-400 rounded-lg mb-4 min-h-[120px] flex flex-col items-center justify-center text-center p-6">
                        <div className="text-md font-medium text-gray-400">
                          -- No plans yet --
                        </div>
                        <div className="text-xs text-gray-400">Create one</div>
                      </div>
                    ) : (
                      // Plans list (scrollable)
                      <div className="border-2 border-dashed border-gray-400 rounded-lg mb-4 min-h-[120px] max-h-60 overflow-y-auto px-2 py-2">
                        <ul className="space-y-2">
                          {plans.map((plan, idx) => {
                            const isActive =
                              activePlan?.name === plan.name &&
                              activePlan?.date === plan.date;

                            return (
                              <li
                                key={idx}
                                onClick={() => onPlanSelect?.(plan)}
                                className={`w-full py-2 px-3 rounded-md flex justify-between items-center cursor-pointer transition
          ${
            isActive
              ? "bg-gradient-to-r from-[#9699FF] to-[#5A5C99] text-white"
              : "bg-[#3a3a3a] text-white hover:bg-[#505050]"
          }`}
                              >
                                <div>
                                  <div className="font-semibold">
                                    {plan.name}
                                  </div>
                                  <div
                                    className={`text-xs ${
                                      isActive ? "text-black" : "text-gray-400"
                                    }`}
                                  >
                                    Created on: {plan.date}
                                  </div>
                                </div>
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setPlanToDelete(idx);
                                  }}
                                  className="p-1 transition"
                                >
                                  <Trash
                                    size={16}
                                    className="text-red-400 hover:text-red-500 transition-colors"
                                  />
                                </button>
                              </li>
                            );
                          })}
                        </ul>
                      </div>
                    )}

                    <button
                      className="w-full py-2 rounded-md bg-[#5A5C99] text-white hover:opacity-90 transition"
                      onClick={() => setIsPlanModalOpen(true)}
                    >
                      Create new plan
                    </button>

                    {/* Modal */}
                    {isPlanModalOpen && (
                      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[9999]">
                        <div className="bg-[#2E2E2E] p-6 rounded-lg w-96 shadow-2xl">
                          <h2 className="text-lg font-bold text-white mb-4">
                            Create New Plan
                          </h2>
                          <input
                            type="text"
                            value={newPlanName}
                            onChange={(e) => setNewPlanName(e.target.value)}
                            placeholder="Enter plan name"
                            className="w-full p-2 mb-4 rounded-md bg-[#3a3a3a] text-white outline-none"
                          />
                          <div className="flex justify-end gap-2">
                            <button
                              onClick={() => setIsPlanModalOpen(false)}
                              className="px-4 py-2 rounded-md bg-gray-500 text-white hover:opacity-80"
                            >
                              Cancel
                            </button>
                            <button
                              onClick={handleCreatePlan}
                              className="px-4 py-2 rounded-md bg-[#5A5C99] text-white hover:opacity-90"
                            >
                              Create
                            </button>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Delete Confirmation Modal */}
                    {planToDelete !== null && (
                      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[9999]">
                        <div className="bg-[#2E2E2E] p-6 rounded-lg w-96 shadow-2xl">
                          <h2 className="text-lg font-bold text-white mb-4">
                            Delete Plan
                          </h2>
                          <p className="text-gray-300 mb-6">
                            Are you sure you want to delete{" "}
                            <span className="font-semibold">
                              {plans[planToDelete].name}
                            </span>
                            ?
                          </p>
                          <div className="flex justify-end gap-2">
                            <button
                              onClick={() => setPlanToDelete(null)}
                              className="px-4 py-2 rounded-md bg-gray-500 text-white hover:opacity-80"
                            >
                              Cancel
                            </button>
                            <button
                              onClick={() => {
                                setPlans(
                                  plans.filter((_, i) => i !== planToDelete)
                                );
                                setPlanToDelete(null);
                              }}
                              className="px-4 py-2 rounded-md bg-red-600 text-white hover:opacity-90"
                            >
                              Delete
                            </button>
                          </div>
                        </div>
                      </div>
                    )}
                  </>
                )}

                {label === "Resource Planner" && (
                  <>
                    {/* Personnel Section */}
                    <button
                      onClick={() => setPersonnelExpanded((prev) => !prev)}
                      className="flex justify-between items-center w-full bg-transparent text-white px-2 py-2 rounded hover:bg-[#3a3a3a] transition"
                    >
                      <div className="flex items-center gap-2">
                        <Users size={18} />
                        <span className="text-base font-medium">Personnel</span>
                      </div>
                      <ChevronDown
                        size={18}
                        className={`text-white transition-transform duration-200 ${
                          personnelExpanded ? "rotate-180" : ""
                        }`}
                      />
                    </button>
                    {personnelExpanded && (
                      <div className="pt-2 pb-5 px-2">
                        <div className="text-gray-400 text-xs text-center mb-4 ">
                          Drag and drop a resource
                        </div>
                        <div className="grid grid-cols-3 gap-3">
                          {[
                            { name: "Health / Medical", type: "personnel" },
                            { name: "Response and Rescue", type: "personnel" },
                            {
                              name: "Security / Law Enforcement",
                              type: "personnel",
                            },
                            { name: "Logistics", type: "personnel" },
                            { name: "Administrative", type: "personnel" },
                            { name: "Others", type: "personnel" },
                          ].map((res, index) => (
                            <div
                              key={`${res.type}-${index}`}
                              draggable
                              onDragStart={(e) =>
                                e.dataTransfer.setData(
                                  "resource-type",
                                  res.type
                                )
                              }
                              className="flex items-center justify-center p-3 h-[100px] rounded-lg cursor-move text-white text-center bg-gradient-to-br from-[#5A5C99] to-[#232323] hover:opacity-80"
                            >
                              <span className="text-xs">{res.name}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Infrastructure Section */}
                    <button
                      onClick={() => setInfraExpanded((prev) => !prev)}
                      className="flex justify-between items-center w-full bg-transparent text-white px-2 py-2 rounded hover:bg-[#3a3a3a] transition mt-3"
                    >
                      <div className="flex items-center gap-2">
                        <Building size={18} />
                        <span className="text-base font-medium">
                          Infrastructure
                        </span>
                      </div>
                      <ChevronDown
                        size={18}
                        className={`text-white transition-transform duration-200 ${
                          infraExpanded ? "rotate-180" : ""
                        }`}
                      />
                    </button>
                    {infraExpanded && (
                      <div className="pt-2 pb-5 px-2">
                        <div className="text-gray-400 text-xs text-center mb-4 ">
                          Drag and drop a resource
                        </div>
                        <div className="grid grid-cols-3 gap-3">
                          {[
                            { name: "Health Facility", type: "infrastructure" },
                            {
                              name: "Water Distribution Hub",
                              type: "infrastructure",
                            },
                            {
                              name: "Evacuation Shelter",
                              type: "infrastructure",
                            },
                            {
                              name: "Transport Hub",
                              type: "infrastructure",
                            },
                            {
                              name: "Comm Hub",
                              type: "infrastructure",
                            },
                            {
                              name: "Power / Generator Hub",
                              type: "infrastructure",
                            },
                            {
                              name: "Supply Distribution Hub",
                              type: "infrastructure",
                            },
                            {
                              name: "Sanitation Facility",
                              type: "infrastructure",
                            },
                            {
                              name: "Field Command Post",
                              type: "infrastructure",
                            },
                            {
                              name: "Others",
                              type: "infrastructure",
                            },
                          ].map((res, index) => (
                            <div
                              key={`${res.type}-${index}`}
                              draggable
                              onDragStart={(e) =>
                                e.dataTransfer.setData(
                                  "resource-type",
                                  res.type
                                )
                              }
                              className="flex items-center justify-center p-3 h-[100px] rounded-lg cursor-move text-white text-center bg-gradient-to-br from-[#5A5C99] to-[#232323] hover:opacity-80"
                            >
                              <span className="text-xs text-center">
                                {res.name}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Supplies Section */}
                    <button
                      onClick={() => setSuppliesExpanded((prev) => !prev)}
                      className="flex justify-between items-center w-full bg-transparent text-white px-2 py-2 rounded hover:bg-[#3a3a3a] transition mt-3"
                    >
                      <div className="flex items-center gap-2">
                        <ShoppingBasket size={18} />
                        <span className="text-base font-medium">Supplies</span>
                      </div>
                      <ChevronDown
                        size={18}
                        className={`text-white transition-transform duration-200 ${
                          suppliesExpanded ? "rotate-180" : ""
                        }`}
                      />
                    </button>
                    {suppliesExpanded && (
                      <div className="pt-2 pb-5 px-2">
                        <div className="text-gray-400 text-xs text-center mb-4 ">
                          Drag and drop a resource
                        </div>
                        <div className="grid grid-cols-3 gap-3">
                          {[
                            { name: "Food Items", type: "supplies" },
                            { name: "Water and Hydration", type: "supplies" },
                            { name: "Health Supplies", type: "supplies" },
                            { name: "Non-Food Items (NFIs)", type: "supplies" },
                            { name: "Special Needs", type: "supplies" },
                            { name: "Others", type: "supplies" },
                          ].map((res, index) => (
                            <div
                              key={`${res.type}-${index}`}
                              draggable
                              onDragStart={(e) =>
                                e.dataTransfer.setData(
                                  "resource-type",
                                  res.type
                                )
                              }
                              className="flex items-center justify-center p-3 h-[100px] rounded-lg cursor-move text-white text-center bg-gradient-to-br from-[#5A5C99] to-[#232323] hover:opacity-80"
                            >
                              <span className="text-xs text-center">
                                {res.name}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Resources on Map */}
                    <div className="mt-7">
                      <div className="text-white font-semibold mb-2">
                        Resources on Map
                      </div>
                      <div className="space-y-2 max-h-40 overflow-y-auto pr-1">
                        {resourcesOnMap.length === 0 && (
                          <div className="text-gray-400 text-sm">
                            No resources placed yet
                          </div>
                        )}
                        {resourcesOnMap.map((res) => (
                          <div
                            key={res.id}
                            onClick={() =>
                              mapRef.current?.flyToResource(res.id)
                            }
                            className="flex flex-col bg-[#3a3a3a] px-3 py-2 rounded-md cursor-pointer hover:bg-[#505050]"
                          >
                            <div className="flex items-center justify-between">
                              <span>{res.data.name || res.type}</span>
                              <div className="flex items-center gap-[5px] text-gray-400 text-xs capitalize">
                                <span>{res.type}</span>
                              </div>
                            </div>
                            <div className="text-xs text-gray-400 mt-1">
                              {res.coords.lat.toFixed(4)},{" "}
                              {res.coords.lng.toFixed(4)}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {resourcesOnMap.length > 0 && (
                      <div className="flex gap-2 mt-5">
                        <button
                          onClick={exportAsGeoJSON}
                          className="flex-1 py-2 rounded-md bg-[#5A5C99] text-white hover:opacity-90 transition flex items-center justify-center"
                        >
                          Export as GeoJSON
                        </button>
                        <button
                          onClick={() => mapRef.current?.clearAllResources()}
                          className="flex-1 py-2 rounded-md bg-[#5A5C99] text-white hover:opacity-90 transition flex items-center justify-center"
                        >
                          Clear all
                        </button>
                      </div>
                    )}
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
