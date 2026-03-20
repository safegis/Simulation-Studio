"use client";

import {
  useRef,
  useState,
  useEffect,
  useLayoutEffect,
  useCallback,
  forwardRef,
  useImperativeHandle,
} from "react";
import ReactDOM from "react-dom";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  MapPin,
  Route,
  Car,
  Bike,
  Footprints,
  ChevronDown,
  ChevronUp,
  X,
} from "lucide-react";
import TwoWheelerIcon from "@mui/icons-material/TwoWheeler";
import { sortRoutesFastest } from "./SortRoutes-Fastest";
import { sortRoutesSafest } from "./SortRoutes-Safest";
import { sortRoutesBestBalance } from "./SortRoutes-BestBalance";

// ✅ helper function (place this at the top of your component or in a utils file)
const getOrdinal = (n: number) => {
  const s = ["th", "st", "nd", "rd"];
  const v = n % 100;
  return n + (s[(v - 20) % 10] || s[v] || s[0]);
};

/**
 * Backend /api/traffic/route-incidents expects a single [lng, lat][] line.
 * Mapbox routes may be LineString or MultiLineString.
 */
function getCoordinatesForTrafficApi(feature: {
  geometry?: { type?: string; coordinates?: unknown };
} | null | undefined): number[][] | null {
  const g = feature?.geometry;
  if (!g?.coordinates) return null;
  if (g.type === "LineString") {
    const c = g.coordinates as number[][];
    return Array.isArray(c) ? c : null;
  }
  if (g.type === "MultiLineString") {
    const lines = g.coordinates as number[][][];
    if (!Array.isArray(lines) || lines.length === 0) return null;
    return lines.flat();
  }
  return null;
}

/** Serializable slice of Pathfinder state for undo/redo with parent map history. */
export type PathfinderUndoSnapshot = {
  startText: string;
  destinationText: string;
  startCoords: { lat: number; lon: number } | null;
  destinationCoords: { lat: number; lon: number } | null;
  startSuggestions: any[];
  destinationSuggestions: any[];
  startHighlightedIndex: number;
  destinationHighlightedIndex: number;
  selectedMode: string;
  isLoadingRoutes: boolean;
  /** @deprecated use routesLoadingPhase; kept true only when phase is "filtering" (undo compat). */
  isFilteringMode: boolean;
  /** When loading: why the spinner is shown (newer snapshots). */
  routesLoadingPhase?: "finding" | "filtering" | "sorting" | null;
  routesData: any[];
  showStepsMap: Record<string, boolean>;
  selectedRouteKey: string | null;
  routeKeyToFeatureIndex: Record<string, number>;
  routesCache: Record<string, { routesWithTraffic: any[]; geojson: any }>;
  selectedSort: string;
  showSortDropdown: boolean;
  /** Custom evac facility picker (matches sort dropdown pattern). */
  showEvacDropdown?: boolean;
  showModal: boolean;
  /** Pathfinder sub-mode (older snapshots may omit; defaults to evacuation). */
  pathfinderTab?: "destination" | "evacuation";
  evacRadiusKm?: number;
  selectedEvacId?: string;
};

export const EMPTY_PATHFINDER_UNDO_SNAPSHOT: PathfinderUndoSnapshot = {
  startText: "",
  destinationText: "",
  startCoords: null,
  destinationCoords: null,
  startSuggestions: [],
  destinationSuggestions: [],
  startHighlightedIndex: -1,
  destinationHighlightedIndex: -1,
  selectedMode: "all",
  isLoadingRoutes: false,
  isFilteringMode: false,
  routesLoadingPhase: null,
  routesData: [],
  showStepsMap: {},
  selectedRouteKey: null,
  routeKeyToFeatureIndex: {},
  routesCache: {},
  selectedSort: "Best balance",
  showSortDropdown: false,
  showEvacDropdown: false,
  showModal: false,
  pathfinderTab: "evacuation",
  evacRadiusKm: 1,
  selectedEvacId: "",
};

export interface PathfinderControlsRef {
  setStartLocation: (
    location: string,
    coords: { lat: number; lon: number }
  ) => void;
  setDestinationLocation: (
    location: string,
    coords: { lat: number; lon: number }
  ) => void;
  /** Switch Pathfinder UI: point-to-point vs shelter / evacuation (OSM). */
  setPathfinderTab: (tab: "destination" | "evacuation") => void;
  /** Snapshot of OSM shelters/schools in evacuation mode (for Atlas chat listing). */
  getEvacuationSheltersSnapshot: () => {
    pathfinderTab: "destination" | "evacuation";
    startName: string;
    radiusKm: number;
    places: { id: string; name: string; kind?: string }[];
    loading: boolean;
    error: string | null;
  };
  /** Match a loaded OSM evacuation row by name and recalculate routes (Atlas / chat). */
  selectEvacuationPlaceByName: (query: string) => {
    ok: boolean;
    matched?: string;
    error?: string;
  };
  setMode: (mode: string) => void;
  setSort: (sort: string) => void;
  /** Same as in-panel “Clear Routes”: map polylines, markers, pathfinder trip state. */
  clearDisplayedRoutesFromMap: () => void;
  /** Clear inputs, routes, and polling (parent clears map routes/markers). */
  resetMapLinkedUi: () => void;
  getUndoSnapshot: () => PathfinderUndoSnapshot;
  applyUndoSnapshot: (snap: PathfinderUndoSnapshot) => void;
}

const PathfinderControls = forwardRef<
  PathfinderControlsRef,
  {
    mapRef: React.RefObject<any>;
    /** Debounced into parent undo checkpoint (map + UI history). */
    onStateChangeForUndo?: () => void;
  }
>(({ mapRef, onStateChangeForUndo }, ref) => {
  const [startText, setStartText] = useState("");
  const [destinationText, setDestinationText] = useState("");
  const [startCoords, setStartCoords] = useState<{
    lat: number;
    lon: number;
  } | null>(null);
  const [destinationCoords, setDestinationCoords] = useState<{
    lat: number;
    lon: number;
  } | null>(null);

  // Track if location was just selected to prevent re-fetching suggestions
  const startJustSelectedRef = useRef(false);
  const destinationJustSelectedRef = useRef(false);

  const [selectedMode, setSelectedMode] = useState<string>("all");
  const [isLoadingRoutes, setIsLoadingRoutes] = useState(false);
  const [routesLoadingPhase, setRoutesLoadingPhase] = useState<
    "finding" | "filtering" | "sorting" | null
  >(null);

  const startRef = useRef<HTMLInputElement>(null);
  const destinationRef = useRef<HTMLInputElement>(null);
  const startContainerRef = useRef<HTMLDivElement>(null);
  const destinationContainerRef = useRef<HTMLDivElement>(null);
  const startSuggestionsRef = useRef<HTMLUListElement>(null);
  const destinationSuggestionsRef = useRef<HTMLUListElement>(null);

  const [startSuggestions, setStartSuggestions] = useState<any[]>([]);
  const [destinationSuggestions, setDestinationSuggestions] = useState<any[]>(
    []
  );
  const [startHighlightedIndex, setStartHighlightedIndex] =
    useState<number>(-1);
  const [destinationHighlightedIndex, setDestinationHighlightedIndex] =
    useState<number>(-1);

  const [routesData, setRoutesData] = useState<any[]>([]);
  const [showStepsMap, setShowStepsMap] = useState<{ [key: string]: boolean }>(
    {}
  );

  // Cache for routes by mode to avoid redundant API calls
  const routesCacheRef = useRef<Record<string, any>>({});

  // Ref to store the polling interval
  const trafficPollingIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // REPLACE selectedRouteIndex with a stable string key that you already compute in the UI.
  // routeKey -> e.g. "driving-src-3" (matches how you build it in render)
  const [selectedRouteKey, setSelectedRouteKey] = useState<string | null>(null);

  // map routeKey => geojson feature index (the number used by Map.tsx when it names layers `route-<featureIndex>`)
  const [routeKeyToFeatureIndex, setRouteKeyToFeatureIndex] = useState<
    Record<string, number>
  >({});

  const [showModal, setShowModal] = useState(false);

  const [selectedSort, setSelectedSort] = useState<string>("Best balance");
  const [showSortDropdown, setShowSortDropdown] = useState<boolean>(false);
  const sortDropdownRef = useRef<HTMLDivElement>(null);
  const [showEvacDropdown, setShowEvacDropdown] = useState(false);
  /** Trigger button wrapper — portaled menu is positioned from this rect. */
  const evacDropdownTriggerRef = useRef<HTMLDivElement>(null);
  /** Portaled dropdown panel (for click-outside; not inside trigger DOM). */
  const evacDropdownMenuRef = useRef<HTMLDivElement>(null);
  /** Pathfinder root scrolls — reposition menu so it tracks the trigger. */
  const pathfinderPanelScrollRef = useRef<HTMLDivElement>(null);
  const [evacMenuLayout, setEvacMenuLayout] = useState({
    top: 0,
    left: 0,
    width: 0,
    maxHeight: 160,
  });

  const updateEvacMenuPosition = useCallback(() => {
    const el = evacDropdownTriggerRef.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    const gap = 4;
    const preferredMax = 160;
    const available = window.innerHeight - r.bottom - gap - 8;
    const maxHeight = Math.max(80, Math.min(preferredMax, available));
    setEvacMenuLayout({
      top: r.bottom + gap,
      left: r.left,
      width: r.width,
      maxHeight,
    });
  }, []);

  const backendBase =
    process.env.NEXT_PUBLIC_BACKEND_ENDPOINT || "http://localhost:8000";

  const [pathfinderTab, setPathfinderTab] = useState<"destination" | "evacuation">(
    "evacuation"
  );
  const [evacRadiusKm, setEvacRadiusKm] = useState(1);
  const [evacPlaces, setEvacPlaces] = useState<
    { id: string; name: string; lat: number; lon: number; kind?: string }[]
  >([]);
  const [evacLoading, setEvacLoading] = useState(false);
  const [evacError, setEvacError] = useState<string | null>(null);
  const [selectedEvacId, setSelectedEvacId] = useState("");

  const startItemRefs = useRef<(HTMLLIElement | null)[]>([]);
  const destinationItemRefs = useRef<(HTMLLIElement | null)[]>([]);

  /** Skip auto fetch when restoring from undo (cache redrawn in applyUndoSnapshot). */
  const suppressCoordsRouteFetchRef = useRef(false);
  /** Skip “pick first route” effect while restoring selection from snapshot. */
  const suppressAutoRouteSelectionRef = useRef(false);
  /** Clears brief “Sorting routes…” overlay timer if still pending. */
  const sortOverlayTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(
    null
  );
  /** True while /routes fetch + traffic merge is in flight (sync, before awaits). */
  const routeRequestInFlightRef = useRef(false);
  /** Previous start/dest used to tell mode-only changes (filtering overlay vs full find). */
  const lastRouteFetchCoordsRef = useRef<{
    s: { lat: number; lon: number } | null;
    d: { lat: number; lon: number } | null;
  }>({ s: null, d: null });
  /** Latest select-by-name impl (defined after applyEvacPlaceAsDestination; ref set each render). */
  const selectEvacByNameImplRef = useRef<
    ((query: string) => { ok: boolean; matched?: string; error?: string }) | null
  >(null);

  const clearSortOverlayTimeout = useCallback(() => {
    if (sortOverlayTimeoutRef.current !== null) {
      clearTimeout(sortOverlayTimeoutRef.current);
      sortOverlayTimeoutRef.current = null;
    }
  }, []);

  /** User changed sort (dropdown or AI): show “Sorting Routes…” briefly unless a route fetch is in flight. */
  const applySelectedSort = useCallback(
    (option: string) => {
      clearSortOverlayTimeout();
      if (!routeRequestInFlightRef.current) {
        setRoutesLoadingPhase("sorting");
        setIsLoadingRoutes(true);
        sortOverlayTimeoutRef.current = setTimeout(() => {
          setIsLoadingRoutes(false);
          setRoutesLoadingPhase(null);
          sortOverlayTimeoutRef.current = null;
        }, 220);
      }
      setSelectedSort(option);
      setShowSortDropdown(false);
    },
    [clearSortOverlayTimeout]
  );

  /** Atlas / Clear Routes button: remove routes from map and reset pathfinder trip fields. */
  const clearDisplayedRoutesFromMap = useCallback(() => {
    setStartText("");
    setDestinationText("");
    setStartCoords(null);
    setDestinationCoords(null);
    setRoutesData([]);
    setSelectedRouteKey(null);
    setSelectedMode("all");
    routesCacheRef.current = {};
    setSelectedEvacId("");
    setShowEvacDropdown(false);
    setEvacPlaces([]);
    setEvacError(null);
    if (trafficPollingIntervalRef.current) {
      clearInterval(trafficPollingIntervalRef.current);
      trafficPollingIntervalRef.current = null;
      console.log("⏹️ Stopped traffic polling");
    }
    mapRef.current?.clearRoutes?.();
    mapRef.current?.clearStartMarker?.();
    mapRef.current?.clearDestinationMarker?.();
    lastRouteFetchCoordsRef.current = { s: null, d: null };
    routeRequestInFlightRef.current = false;
    clearSortOverlayTimeout();
    setIsLoadingRoutes(false);
    setRoutesLoadingPhase(null);
  }, [clearSortOverlayTimeout, mapRef]);

  // Expose methods to parent via ref
  useImperativeHandle(ref, () => ({
    setStartLocation: (
      location: string,
      coords: { lat: number; lon: number }
    ) => {
      setStartText(location);
      setStartCoords(coords);
      setStartSuggestions([]);
      mapRef.current?.addStartMarker(coords.lon, coords.lat);
    },
    setDestinationLocation: (
      location: string,
      coords: { lat: number; lon: number }
    ) => {
      setDestinationText(location);
      setDestinationCoords(coords);
      setDestinationSuggestions([]);
      mapRef.current?.addDestinationMarker(coords.lon, coords.lat);
    },
    setPathfinderTab: (tab: "destination" | "evacuation") => {
      setPathfinderTab(tab);
    },
    getEvacuationSheltersSnapshot: () => ({
      pathfinderTab,
      startName: startText,
      radiusKm: evacRadiusKm,
      places: evacPlaces.map((p) => ({
        id: p.id,
        name: p.name,
        kind: p.kind,
      })),
      loading: evacLoading,
      error: evacError,
    }),
    selectEvacuationPlaceByName: (query: string) => {
      const fn = selectEvacByNameImplRef.current;
      if (!fn) return { ok: false, error: "unavailable" };
      return fn(query);
    },
    setMode: (mode: string) => {
      setSelectedMode(mode);
    },
    setSort: (sort: string) => {
      const sortMap: Record<string, string> = {
        fastest: "Fastest",
        safest: "Safest",
        best_balance: "Best balance",
      };
      applySelectedSort(sortMap[sort] || "Best balance");
    },
    clearDisplayedRoutesFromMap: () => {
      clearDisplayedRoutesFromMap();
    },
    resetMapLinkedUi: () => {
      if (trafficPollingIntervalRef.current) {
        clearInterval(trafficPollingIntervalRef.current);
        trafficPollingIntervalRef.current = null;
      }
      setStartText("");
      setDestinationText("");
      setStartCoords(null);
      setDestinationCoords(null);
      setStartSuggestions([]);
      setDestinationSuggestions([]);
      setStartHighlightedIndex(-1);
      setDestinationHighlightedIndex(-1);
      setRoutesData([]);
      setSelectedRouteKey(null);
      setRouteKeyToFeatureIndex({});
      setShowStepsMap({});
      routesCacheRef.current = {};
      setIsLoadingRoutes(false);
      setRoutesLoadingPhase(null);
      routeRequestInFlightRef.current = false;
      clearSortOverlayTimeout();
      setSelectedMode("all");
      setPathfinderTab("evacuation");
      setEvacRadiusKm(1);
      setEvacPlaces([]);
      setEvacError(null);
      setSelectedEvacId("");
      setEvacLoading(false);
      setShowEvacDropdown(false);
    },
    getUndoSnapshot: (): PathfinderUndoSnapshot => ({
      startText,
      destinationText,
      startCoords: startCoords ? { ...startCoords } : null,
      destinationCoords: destinationCoords ? { ...destinationCoords } : null,
      startSuggestions: JSON.parse(JSON.stringify(startSuggestions)),
      destinationSuggestions: JSON.parse(JSON.stringify(destinationSuggestions)),
      startHighlightedIndex,
      destinationHighlightedIndex,
      selectedMode,
      isLoadingRoutes,
      isFilteringMode: routesLoadingPhase === "filtering",
      routesLoadingPhase,
      routesData: JSON.parse(JSON.stringify(routesData)),
      showStepsMap: { ...showStepsMap },
      selectedRouteKey,
      routeKeyToFeatureIndex: { ...routeKeyToFeatureIndex },
      routesCache: JSON.parse(JSON.stringify(routesCacheRef.current)),
      selectedSort,
      showSortDropdown,
      showEvacDropdown,
      showModal,
      pathfinderTab,
      evacRadiusKm,
      selectedEvacId,
    }),
    applyUndoSnapshot: (snap: PathfinderUndoSnapshot) => {
      if (trafficPollingIntervalRef.current) {
        clearInterval(trafficPollingIntervalRef.current);
        trafficPollingIntervalRef.current = null;
      }
      suppressCoordsRouteFetchRef.current = true;
      suppressAutoRouteSelectionRef.current = true;
      routesCacheRef.current = snap.routesCache
        ? JSON.parse(JSON.stringify(snap.routesCache))
        : {};
      startJustSelectedRef.current = false;
      destinationJustSelectedRef.current = false;

      setStartText(snap.startText ?? "");
      setDestinationText(snap.destinationText ?? "");
      setStartCoords(snap.startCoords ?? null);
      setDestinationCoords(snap.destinationCoords ?? null);
      setStartSuggestions(snap.startSuggestions ?? []);
      setDestinationSuggestions(snap.destinationSuggestions ?? []);
      setStartHighlightedIndex(snap.startHighlightedIndex ?? -1);
      setDestinationHighlightedIndex(snap.destinationHighlightedIndex ?? -1);
      setSelectedMode(snap.selectedMode ?? "all");
      setIsLoadingRoutes(snap.isLoadingRoutes ?? false);
      {
        const phase =
          snap.routesLoadingPhase !== undefined
            ? snap.routesLoadingPhase
            : snap.isLoadingRoutes
              ? snap.isFilteringMode
                ? "filtering"
                : "finding"
              : null;
        setRoutesLoadingPhase(phase);
      }
      setRoutesData(snap.routesData ?? []);
      setShowStepsMap(snap.showStepsMap ?? {});
      setSelectedRouteKey(snap.selectedRouteKey ?? null);
      setRouteKeyToFeatureIndex(snap.routeKeyToFeatureIndex ?? {});
      setSelectedSort(snap.selectedSort ?? "Best balance");
      setShowSortDropdown(snap.showSortDropdown ?? false);
      setShowEvacDropdown(snap.showEvacDropdown ?? false);
      setShowModal(snap.showModal ?? false);
      setPathfinderTab(snap.pathfinderTab ?? "evacuation");
      setEvacRadiusKm(snap.evacRadiusKm ?? 1);
      setSelectedEvacId(snap.selectedEvacId ?? "");
      setEvacPlaces([]);
      setEvacError(null);

      if (snap.startCoords) {
        mapRef.current?.addStartMarker?.(
          snap.startCoords.lon,
          snap.startCoords.lat
        );
      } else {
        mapRef.current?.clearStartMarker?.();
      }
      if (snap.destinationCoords) {
        mapRef.current?.addDestinationMarker?.(
          snap.destinationCoords.lon,
          snap.destinationCoords.lat
        );
      } else {
        mapRef.current?.clearDestinationMarker?.();
      }

      const mode = (snap.selectedMode ?? "all") as
        | "all"
        | "driving"
        | "walking"
        | "cycling"
        | "motorcycle";
      const sc = snap.startCoords;
      const dc = snap.destinationCoords;

      window.setTimeout(() => {
        if (sc && dc && snap.routesData?.length) {
          const cacheKey = `${sc.lat},${sc.lon}-${dc.lat},${dc.lon}-${mode}`;
          let cached = routesCacheRef.current[cacheKey];
          if (!cached && mode !== "all") {
            const allKey = `${sc.lat},${sc.lon}-${dc.lat},${dc.lon}-all`;
            cached = routesCacheRef.current[allKey];
          }
          if (cached?.geojson?.features?.length) {
            mapRef.current?.drawRoutes?.(cached.geojson);
            const rtw = cached.routesWithTraffic || [];
            mapRef.current?.drawIncidentSegments?.(
              rtw.map((route: any, index: number) => ({
                featureIndex: index,
                trafficData: route.trafficData,
              }))
            );
          }
          const key = snap.selectedRouteKey;
          if (key) {
            const idx = snap.routeKeyToFeatureIndex?.[key];
            setSelectedRouteKey(key);
            mapRef.current?.highlightRouteByFeatureIndex?.(
              typeof idx === "number" ? idx : null
            );
          } else {
            setSelectedRouteKey(null);
            mapRef.current?.highlightRouteByFeatureIndex?.(null);
          }
        } else {
          mapRef.current?.clearRoutes?.();
          mapRef.current?.clearIncidentSegments?.();
          setSelectedRouteKey(null);
          mapRef.current?.highlightRouteByFeatureIndex?.(null);
        }
        suppressAutoRouteSelectionRef.current = false;
      }, 0);
    },
  }), [
    startText,
    destinationText,
    startCoords,
    destinationCoords,
    startSuggestions,
    destinationSuggestions,
    startHighlightedIndex,
    destinationHighlightedIndex,
    selectedMode,
    isLoadingRoutes,
    routesLoadingPhase,
    routesData,
    showStepsMap,
    selectedRouteKey,
    routeKeyToFeatureIndex,
    selectedSort,
    showSortDropdown,
    showEvacDropdown,
    showModal,
    pathfinderTab,
    evacRadiusKm,
    selectedEvacId,
    evacPlaces,
    evacLoading,
    evacError,
    mapRef,
    applySelectedSort,
    clearSortOverlayTimeout,
    clearDisplayedRoutesFromMap,
  ]);

  // Auto-fetch routes when start, destination, or transport mode changes (includes Atlas setMode)
  useEffect(() => {
    if (!startCoords || !destinationCoords) {
      lastRouteFetchCoordsRef.current = { s: null, d: null };
      return;
    }
    if (suppressCoordsRouteFetchRef.current) {
      suppressCoordsRouteFetchRef.current = false;
      // Keep ref aligned with real pins so the next mode-only change uses isModeSwitch
      lastRouteFetchCoordsRef.current = {
        s: startCoords,
        d: destinationCoords,
      };
      return;
    }
    const prev = lastRouteFetchCoordsRef.current;
    const coordsUnchanged =
      prev.s &&
      prev.d &&
      prev.s.lat === startCoords.lat &&
      prev.s.lon === startCoords.lon &&
      prev.d.lat === destinationCoords.lat &&
      prev.d.lon === destinationCoords.lon;
    lastRouteFetchCoordsRef.current = {
      s: startCoords,
      d: destinationCoords,
    };
    console.log(
      "🔵 Fetch routes (coords or mode):",
      startCoords,
      destinationCoords,
      "mode=",
      selectedMode,
      "modeOnly=",
      coordsUnchanged
    );
    void fetchAndDrawRoutes(
      startCoords,
      destinationCoords,
      selectedMode as "all" | "driving" | "walking" | "cycling" | "motorcycle",
      coordsUnchanged
    );
    // fetchAndDrawRoutes is stable enough per render; suppress ref handles evac overlap
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [startCoords, destinationCoords, selectedMode]);

  // Walking has no traffic merge — keep sort dropdown consistent with mode buttons
  useEffect(() => {
    if (selectedMode === "walking") {
      setSelectedSort("Fastest");
    }
  }, [selectedMode]);

  // Parent undo stack: debounce checkpoint when pathfinder-driven map content changes
  useEffect(() => {
    if (!onStateChangeForUndo) return;
    const id = window.setTimeout(() => onStateChangeForUndo(), 500);
    return () => clearTimeout(id);
  }, [
    onStateChangeForUndo,
    startCoords,
    destinationCoords,
    routesData,
    selectedMode,
    selectedSort,
    startText,
    destinationText,
  ]);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      const t = e.target as Node;
      if (
        sortDropdownRef.current &&
        !sortDropdownRef.current.contains(t)
      ) {
        setShowSortDropdown(false);
      }
      const inEvacTrigger =
        evacDropdownTriggerRef.current?.contains(t) ?? false;
      const inEvacMenu = evacDropdownMenuRef.current?.contains(t) ?? false;
      if (!inEvacTrigger && !inEvacMenu) {
        setShowEvacDropdown(false);
      }
    };

    document.addEventListener("click", handler);
    return () => document.removeEventListener("click", handler);
  }, []);

  useLayoutEffect(() => {
    if (!showEvacDropdown || evacPlaces.length === 0) return;
    updateEvacMenuPosition();
  }, [
    showEvacDropdown,
    evacPlaces.length,
    evacRadiusKm,
    pathfinderTab,
    startText,
    updateEvacMenuPosition,
  ]);

  useEffect(() => {
    if (!showEvacDropdown) return;
    const update = () => updateEvacMenuPosition();
    const panel = pathfinderPanelScrollRef.current;
    panel?.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", update);
    const vv = window.visualViewport;
    vv?.addEventListener("resize", update);
    vv?.addEventListener("scroll", update);
    const ro =
      panel && typeof ResizeObserver !== "undefined"
        ? new ResizeObserver(() => update())
        : null;
    if (panel && ro) ro.observe(panel);
    return () => {
      panel?.removeEventListener("scroll", update);
      window.removeEventListener("resize", update);
      vv?.removeEventListener("resize", update);
      vv?.removeEventListener("scroll", update);
      ro?.disconnect();
    };
  }, [showEvacDropdown, updateEvacMenuPosition]);

  useEffect(() => {
    if (!startText.trim()) {
      setStartSuggestions([]);
      return;
    }

    // Don't fetch if location was just selected
    if (startJustSelectedRef.current) {
      startJustSelectedRef.current = false;
      return;
    }

    const delay = setTimeout(async () => {
      const res = await fetch(
        `${backendBase}/geocode/autocomplete?text=${encodeURIComponent(
          startText
        )}`
      );

      const data = await res.json();
      setStartSuggestions(data.features || []);
      setStartHighlightedIndex(-1);
    }, 300);
    return () => clearTimeout(delay);
  }, [startText]);

  useEffect(() => {
    if (!destinationText.trim()) {
      setDestinationSuggestions([]);
      return;
    }

    // Don't fetch if location was just selected
    if (destinationJustSelectedRef.current) {
      destinationJustSelectedRef.current = false;
      return;
    }

    const delay = setTimeout(async () => {
      const res = await fetch(
        `${backendBase}/geocode/autocomplete?text=${encodeURIComponent(
          destinationText
        )}`
      );
      const data = await res.json();
      setDestinationSuggestions(data.features || []);
      setDestinationHighlightedIndex(-1);
    }, 300);
    return () => clearTimeout(delay);
  }, [destinationText]);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      const target = e.target as Node;

      // Check if click is outside both input containers AND suggestion lists
      const isOutsideStart =
        startContainerRef.current &&
        !startContainerRef.current.contains(target) &&
        startSuggestionsRef.current &&
        !startSuggestionsRef.current.contains(target);

      const isOutsideDestination =
        destinationContainerRef.current &&
        !destinationContainerRef.current.contains(target) &&
        destinationSuggestionsRef.current &&
        !destinationSuggestionsRef.current.contains(target);

      if (isOutsideStart) {
        setStartSuggestions([]);
      }

      if (isOutsideDestination) {
        setDestinationSuggestions([]);
      }
    };
    document.addEventListener("click", handler);
    return () => document.removeEventListener("click", handler);
  }, []);

  // Function to update traffic data for existing routes
  const updateTrafficData = async () => {
    if (routesData.length === 0) return;
    if (!startCoords || !destinationCoords) return;

    const prefix = `${startCoords.lat},${startCoords.lon}-${destinationCoords.lat},${destinationCoords.lon}-`;
    const matchingKeys = Object.keys(routesCacheRef.current).filter((k) =>
      k.startsWith(prefix)
    );
    const cacheKey =
      matchingKeys.find((k) => k.endsWith("-all")) ?? matchingKeys[0];

    console.log("🔄 Updating traffic data...");

    try {
      const updatedRoutes = await Promise.all(
        routesData.map(async (route: any) => {
          // Skip walking routes
          if (route.profile === "walking") {
            return route;
          }

          try {
            if (!cacheKey) return route;

            const cached = routesCacheRef.current[cacheKey];
            const routeIndex = cached.routesWithTraffic.findIndex(
              (r: any) => r.profile === route.profile && r.index === route.index
            );

            if (routeIndex === -1) return route;

            const feature = cached.geojson?.features?.[routeIndex];
            const lineCoords = getCoordinatesForTrafficApi(feature);

            if (lineCoords?.length) {
              const trafficRes = await fetch(
                `${backendBase}/api/traffic/route-incidents`,
                {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({
                    coordinates: lineCoords,
                  }),
                }
              );

              if (trafficRes.ok) {
                const trafficData = await trafficRes.json();
                return { ...route, trafficData };
              }
            }
          } catch (error) {
            console.error("Error updating traffic data for route:", error);
          }

          return route;
        })
      );

      setRoutesData(updatedRoutes);

      // Update cache with new traffic data
      Object.keys(routesCacheRef.current).forEach((key) => {
        const cached = routesCacheRef.current[key];
        const updatedCachedRoutes = cached.routesWithTraffic.map(
          (cachedRoute: any) => {
            const updated = updatedRoutes.find(
              (r: any) =>
                r.profile === cachedRoute.profile &&
                r.index === cachedRoute.index
            );
            return updated || cachedRoute;
          }
        );

        routesCacheRef.current[key] = {
          ...cached,
          routesWithTraffic: updatedCachedRoutes,
        };
      });

      // Redraw incident segments with updated data
      const routesWithIncidentsForMap = updatedRoutes.map(
        (route: any, index: number) => ({
          featureIndex: index,
          trafficData: route.trafficData,
        })
      );
      mapRef.current?.drawIncidentSegments(routesWithIncidentsForMap);

      console.log("✅ Traffic data updated");
    } catch (error) {
      console.error("Error updating traffic data:", error);
    }
  };

  const fetchAndDrawRoutes = async (
    start: { lat: number; lon: number },
    destination: { lat: number; lon: number },
    mode: "driving" | "walking" | "cycling" | "motorcycle" | "all" = "all",
    isModeSwitch: boolean = false
  ) => {
    // Create cache key based on start, destination, and mode
    const cacheKey = `${start.lat},${start.lon}-${destination.lat},${destination.lon}-${mode}`;

    // Check if we have cached data for this mode
    if (routesCacheRef.current[cacheKey]) {
      console.log(`✅ Using cached routes for mode: ${mode}`);
      const cachedData = routesCacheRef.current[cacheKey];
      setRoutesData(cachedData.routesWithTraffic);

      // Draw routes on map
      if (cachedData.geojson?.features?.length) {
        mapRef.current?.drawRoutes(cachedData.geojson);

        // Build the routeKey => featureIndex mapping
        const mapObj: Record<string, number> = {};
        for (let i = 0; i < (cachedData.routesWithTraffic || []).length; i++) {
          const r = cachedData.routesWithTraffic[i];
          const key = `${r.profile}-${r.source}-${r.index}`;
          mapObj[key] = i;
        }
        setRouteKeyToFeatureIndex(mapObj);

        mapRef.current?.drawIncidentSegments(
          cachedData.routesWithTraffic.map((route: any, index: number) => ({
            featureIndex: index,
            trafficData: route.trafficData,
          }))
        );

        // Select first route
        const firstRoute = cachedData.routesWithTraffic[0];
        if (firstRoute) {
          const firstKey = `${firstRoute.profile}-${firstRoute.source}-${firstRoute.index}`;
          setSelectedRouteKey(firstKey);
          const featureIdx = mapObj[firstKey];
          mapRef.current?.highlightRouteByFeatureIndex(
            typeof featureIdx === "number" ? featureIdx : null
          );
        }
      }
      return;
    }

    clearSortOverlayTimeout();
    routeRequestInFlightRef.current = true;
    setIsLoadingRoutes(true);
    setRoutesLoadingPhase(isModeSwitch ? "filtering" : "finding");
    console.log(
      isModeSwitch ? "🔄 Filtering routes..." : "🔄 Loading routes started"
    );

    try {
      const res = await fetch(
        `${backendBase}/routes?start_lat=${start.lat}&start_lon=${start.lon}&dest_lat=${destination.lat}&dest_lon=${destination.lon}&mode=${mode}`
      );
      const data = await res.json();

      // Fetch traffic data for each route (skip for walking routes)
      const routesWithTraffic = await Promise.all(
        data.routesData.map(async (route: any) => {
          // Skip traffic data for walking routes
          if (route.profile === "walking") {
            return {
              ...route,
              trafficData: {
                incident_count: 0,
                total_severity_score: 0,
                incidents: [],
              },
            };
          }

          try {
            // Get route coordinates from the corresponding GeoJSON feature
            const featureIndex = data.routesData.indexOf(route);
            const feature = data.geojson?.features?.[featureIndex];
            const lineCoords = getCoordinatesForTrafficApi(feature);

            if (lineCoords?.length) {
              const trafficRes = await fetch(
                `${backendBase}/api/traffic/route-incidents`,
                {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({
                    coordinates: lineCoords,
                  }),
                }
              );

              if (trafficRes.ok) {
                const trafficData = await trafficRes.json();
                console.log(
                  `[Traffic Data] Route ${route.profile}:`,
                  trafficData
                );
                return { ...route, trafficData };
              }
            }
          } catch (error) {
            console.error("Error fetching traffic data for route:", error);
          }

          // Return route without traffic data if fetch fails
          return {
            ...route,
            trafficData: {
              incident_count: 0,
              total_severity_score: 0,
              incidents: [],
            },
          };
        })
      );

      setRoutesData(routesWithTraffic);

      // Store in cache for future use
      routesCacheRef.current[cacheKey] = {
        routesWithTraffic,
        geojson: data.geojson,
      };
      console.log(`💾 Cached routes for mode: ${mode}`);

      if (data.geojson?.features?.length) {
        // Draw routes on the map (layers will be named route-<featureIndex>)
        mapRef.current?.drawRoutes(data.geojson);

        // Build a mapping: routeKey => featureIndex
        const mapObj: Record<string, number> = {};
        // assume data.routesData and data.geojson.features are in the same order
        for (let i = 0; i < (data.routesData || []).length; i++) {
          const r = data.routesData[i];
          const key = `${r.profile}-${r.source}-${r.index}`;
          mapObj[key] = i; // feature index used in drawRoutes
        }
        setRouteKeyToFeatureIndex(mapObj);

        // Draw traffic incident segments on routes
        const routesWithIncidentsForMap = routesWithTraffic.map(
          (route: any, index: number) => ({
            featureIndex: index,
            trafficData: route.trafficData,
          })
        );
        mapRef.current?.drawIncidentSegments(routesWithIncidentsForMap);

        // choose the first visible route (respecting selectedMode & selectedSort)
        let visibleList = routesWithTraffic;
        if (selectedSort === "Fastest") {
          visibleList = sortRoutesFastest(routesWithTraffic);
        } else if (selectedSort === "Safest") {
          visibleList = sortRoutesSafest(routesWithTraffic);
        } else if (selectedSort === "Best balance") {
          visibleList = sortRoutesBestBalance(routesWithTraffic);
        }

        const filteredVisible = visibleList.filter((r: any) =>
          selectedMode === "all" ? true : r.profile === selectedMode
        );

        if (filteredVisible.length > 0) {
          const first = filteredVisible[0];
          const firstKey = `${first.profile}-${first.source}-${first.index}`;
          setSelectedRouteKey(firstKey);
          const featureIdx = mapObj[firstKey];
          mapRef.current?.highlightRouteByFeatureIndex(
            typeof featureIdx === "number" ? featureIdx : null
          );
        } else {
          setSelectedRouteKey(null);
          mapRef.current?.highlightRouteByFeatureIndex(null);
        }
      }
    } finally {
      routeRequestInFlightRef.current = false;
      setIsLoadingRoutes(false);
      setRoutesLoadingPhase(null);
      console.log("✅ Loading routes completed");
    }
  };

  // Start/stop traffic polling when routes are loaded
  useEffect(() => {
    // Clear any existing interval
    if (trafficPollingIntervalRef.current) {
      clearInterval(trafficPollingIntervalRef.current);
      trafficPollingIntervalRef.current = null;
    }

    // Start polling if we have routes
    if (routesData.length > 0) {
      console.log("🔁 Starting traffic polling (60s interval)");
      trafficPollingIntervalRef.current = setInterval(() => {
        updateTrafficData();
      }, 60000); // 60 seconds
    }

    // Cleanup on unmount or when routes change
    return () => {
      if (trafficPollingIntervalRef.current) {
        clearInterval(trafficPollingIntervalRef.current);
        trafficPollingIntervalRef.current = null;
        console.log("⏹️ Stopped traffic polling");
      }
    };
  }, [routesData.length]); // Only restart when routes are added/removed

  // ensure the first visible route becomes selected when routesData, mode or sort change
  useEffect(() => {
    if (suppressAutoRouteSelectionRef.current) return;

    if (!routesData || routesData.length === 0) {
      setSelectedRouteKey(null);
      mapRef.current?.highlightRouteByFeatureIndex(null);
      return;
    }

    let visibleList = routesData;
    if (selectedSort === "Fastest") {
      visibleList = sortRoutesFastest(routesData);
    } else if (selectedSort === "Safest") {
      visibleList = sortRoutesSafest(routesData);
    } else if (selectedSort === "Best balance") {
      visibleList = sortRoutesBestBalance(routesData);
    }

    const filteredVisible = visibleList.filter((r: any) =>
      selectedMode === "all" ? true : r.profile === selectedMode
    );

    if (filteredVisible.length === 0) {
      setSelectedRouteKey(null);
      mapRef.current?.highlightRouteByFeatureIndex(null);
      return;
    }

    const first = filteredVisible[0];
    const firstKey = `${first.profile}-${first.source}-${first.index}`;

    // If new selection is same as current, do nothing
    if (firstKey === selectedRouteKey) return;

    setSelectedRouteKey(firstKey);

    // lookup feature index and call map method
    const featureIdx = routeKeyToFeatureIndex[firstKey];
    mapRef.current?.highlightRouteByFeatureIndex(
      typeof featureIdx === "number" ? featureIdx : null
    );
    // we intentionally do not include routeKeyToFeatureIndex in deps to avoid loop;
    // it is set alongside routesData in fetchAndDrawRoutes
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [routesData, selectedMode, selectedSort]);

  type EvacPlaceRow = {
    id: string;
    name: string;
    lat: number;
    lon: number;
    kind?: string;
  };

  /** Set destination + routes from one OSM facility (evacuation mode). */
  const applyEvacPlaceAsDestination = async (
    p: EvacPlaceRow,
    start: { lat: number; lon: number }
  ) => {
    setSelectedEvacId(p.id);
    const label = `${p.name}${p.kind ? ` (${p.kind})` : ""}`;
    suppressCoordsRouteFetchRef.current = true;
    setDestinationText(label);
    setDestinationCoords({ lat: p.lat, lon: p.lon });
    mapRef.current?.addDestinationMarker(p.lon, p.lat);
    routesCacheRef.current = {};
    if (trafficPollingIntervalRef.current) {
      clearInterval(trafficPollingIntervalRef.current);
      trafficPollingIntervalRef.current = null;
    }
    setSelectedMode("all");
    setShowEvacDropdown(false);
    await fetchAndDrawRoutes(start, { lat: p.lat, lon: p.lon }, "all");
    mapRef.current?.fitBoundsToMarkers?.();
  };

  selectEvacByNameImplRef.current = (query: string) => {
    const q = (query || "").trim();
    if (!q) return { ok: false, error: "empty_query" };
    if (pathfinderTab !== "evacuation") {
      return { ok: false, error: "not_evacuation_tab" };
    }
    if (!startCoords) {
      return { ok: false, error: "no_start" };
    }
    const normalize = (s: string) =>
      s.toLowerCase().replace(/\s+/g, " ").trim();
    const qn = normalize(q);
    const rows = evacPlaces;
    if (!rows.length) {
      return { ok: false, error: "no_shelters_loaded" };
    }
    let best =
      rows.find((p) => normalize(p.name) === qn) ||
      rows.find(
        (p) =>
          normalize(p.name).includes(qn) ||
          (qn.length >= 4 && qn.includes(normalize(p.name)))
      );
    if (!best) {
      const words = qn.split(/\s+/).filter((w) => w.length > 2);
      if (words.length) {
        best = rows.find((p) => {
          const n = normalize(p.name);
          return words.every((w) => n.includes(w));
        });
      }
    }
    if (!best) {
      return { ok: false, error: "no_match" };
    }
    void applyEvacPlaceAsDestination(best, startCoords);
    return { ok: true, matched: best.name };
  };

  /** Overpass: schools & shelters near start (evacuation mode). */
  useEffect(() => {
    if (pathfinderTab !== "evacuation" || !startCoords) {
      if (pathfinderTab !== "evacuation") {
        setEvacPlaces([]);
        setEvacError(null);
        setEvacLoading(false);
      }
      return;
    }

    const ac = new AbortController();
    const timer = window.setTimeout(async () => {
      const start = startCoords;
      setEvacLoading(true);
      setEvacError(null);
      try {
        const u = new URL(`${backendBase}/api/overpass/evacuation-destinations`);
        u.searchParams.set("lat", String(start.lat));
        u.searchParams.set("lon", String(start.lon));
        u.searchParams.set("radius_km", String(evacRadiusKm));
        const res = await fetch(u.toString(), { signal: ac.signal });
        if (ac.signal.aborted) return;
        const data = await res.json().catch(() => ({}));
        if (!res.ok) {
          setEvacPlaces([]);
          setShowEvacDropdown(false);
          setEvacError(
            typeof data.detail === "string"
              ? data.detail
              : "Could not load shelters from OSM"
          );
          return;
        }
        if (ac.signal.aborted) return;
        const raw = (data.places || []) as EvacPlaceRow[];
        const sorted =
          raw.length === 0
            ? []
            : [...raw].sort((a, b) => {
                const da =
                  (a.lat - start.lat) ** 2 + (a.lon - start.lon) ** 2;
                const db =
                  (b.lat - start.lat) ** 2 + (b.lon - start.lon) ** 2;
                return da - db;
              });
        setEvacPlaces(sorted);
        setShowEvacDropdown(false);
        if (sorted.length === 0) {
          setSelectedEvacId("");
          setDestinationText("");
          setDestinationCoords(null);
          mapRef.current?.clearDestinationMarker?.();
          setRoutesData([]);
          setSelectedRouteKey(null);
          routesCacheRef.current = {};
          mapRef.current?.clearRoutes?.();
          if (trafficPollingIntervalRef.current) {
            clearInterval(trafficPollingIntervalRef.current);
            trafficPollingIntervalRef.current = null;
          }
        } else {
          await applyEvacPlaceAsDestination(sorted[0], start);
        }
      } catch (e: unknown) {
        if (e instanceof Error && e.name === "AbortError") return;
        setEvacPlaces([]);
        setShowEvacDropdown(false);
        setEvacError(
          e instanceof Error ? e.message : "Failed to load evacuation destinations"
        );
      } finally {
        setEvacLoading(false);
      }
    }, 450);

    return () => {
      ac.abort();
      clearTimeout(timer);
    };
  }, [
    pathfinderTab,
    startCoords,
    evacRadiusKm,
    backendBase,
  ]); /* applyEvacPlaceAsDestination omitted — would retrigger debounce every render */

  const handleEvacShelterSelect = (id: string) => {
    setSelectedEvacId(id);
    const p = evacPlaces.find((x) => x.id === id);
    if (!p || !startCoords) {
      if (!id) {
        setDestinationText("");
        setDestinationCoords(null);
        mapRef.current?.clearDestinationMarker?.();
        setRoutesData([]);
        setSelectedRouteKey(null);
        routesCacheRef.current = {};
        mapRef.current?.clearRoutes?.();
        if (trafficPollingIntervalRef.current) {
          clearInterval(trafficPollingIntervalRef.current);
          trafficPollingIntervalRef.current = null;
        }
        setShowEvacDropdown(false);
      }
      return;
    }
    void applyEvacPlaceAsDestination(p, startCoords);
  };

  const handleSuggestionSelect = (place: any) => {
    startJustSelectedRef.current = true;
    setStartText(place.properties.formatted);
    setStartSuggestions([]);
    const coords = { lat: place.properties.lat, lon: place.properties.lon };
    setStartCoords(coords);
    mapRef.current?.addStartMarker(coords.lon, coords.lat);

    // Clear cache and stop polling when start location changes
    routesCacheRef.current = {};
    if (trafficPollingIntervalRef.current) {
      clearInterval(trafficPollingIntervalRef.current);
      trafficPollingIntervalRef.current = null;
    }
    console.log("🗑️ Cache cleared - new start location");

    if (pathfinderTab === "evacuation") {
      setSelectedEvacId("");
      setShowEvacDropdown(false);
      setDestinationText("");
      setDestinationCoords(null);
      mapRef.current?.clearDestinationMarker?.();
      setRoutesData([]);
      setSelectedRouteKey(null);
      mapRef.current?.clearRoutes?.();
      mapRef.current?.flyTo({ center: [coords.lon, coords.lat], zoom: 14 });
      return;
    }

    if (destinationCoords) {
      fetchAndDrawRoutes(coords, destinationCoords, "all");
      mapRef.current?.fitBoundsToMarkers();
    } else {
      mapRef.current?.flyTo({ center: [coords.lon, coords.lat], zoom: 14 });
    }
  };

  const handleDestinationSelect = (place: any) => {
    destinationJustSelectedRef.current = true;
    setDestinationText(place.properties.formatted);
    setDestinationSuggestions([]);
    const coords = { lat: place.properties.lat, lon: place.properties.lon };
    setDestinationCoords(coords);
    mapRef.current?.addDestinationMarker(coords.lon, coords.lat);

    // Clear cache and stop polling when destination changes
    routesCacheRef.current = {};
    if (trafficPollingIntervalRef.current) {
      clearInterval(trafficPollingIntervalRef.current);
      trafficPollingIntervalRef.current = null;
    }
    console.log("🗑️ Cache cleared - new destination");

    if (startCoords) {
      mapRef.current?.fitBoundsToMarkers();
    } else {
      mapRef.current?.flyTo({ center: [coords.lon, coords.lat], zoom: 14 });
    }
  };

  const buttonClass = (mode: string) =>
    `w-9 h-9 flex items-center justify-center rounded-lg transition ${
      selectedMode === mode
        ? "bg-gradient-to-r from-[#9699FF] to-white text-[#2E2E2E]"
        : "hover:bg-[#3A3A3A] text-[#C7C7C7]"
    }`;

  function formatDuration(durationSeconds: number): string {
    const hours = Math.floor(durationSeconds / 3600);
    const minutes = Math.floor((durationSeconds % 3600) / 60);
    const seconds = Math.round(durationSeconds % 60);

    const parts: string[] = [];

    if (hours > 0) parts.push(`${hours} hour${hours > 1 ? "s" : ""}`);
    if (minutes > 0) parts.push(`${minutes} min${minutes > 1 ? "s" : ""}`);
    if (hours === 0 && minutes === 0 && seconds > 0)
      parts.push(`${seconds} sec${seconds > 1 ? "s" : ""}`);
    if (hours === 0 && minutes > 0 && seconds > 0)
      parts.push(`${seconds} sec${seconds > 1 ? "s" : ""}`);

    return parts.join(", ");
  }

  useEffect(() => {
    if (
      startHighlightedIndex >= 0 &&
      startItemRefs.current[startHighlightedIndex]
    ) {
      startItemRefs.current[startHighlightedIndex]?.scrollIntoView({
        behavior: "smooth",
        block: "nearest",
      });
    }
  }, [startHighlightedIndex]);

  useEffect(() => {
    if (
      destinationHighlightedIndex >= 0 &&
      destinationItemRefs.current[destinationHighlightedIndex]
    ) {
      destinationItemRefs.current[destinationHighlightedIndex]?.scrollIntoView({
        behavior: "smooth",
        block: "nearest",
      });
    }
  }, [destinationHighlightedIndex]);

  return (
    <div
      ref={pathfinderPanelScrollRef}
      className="w-full bg-[#2E2E2E] rounded-lg shadow-md text-[#C7C7C7] flex flex-col p-3 scrollbar-rounded relative"
      style={{ maxHeight: "calc(100vh - 36px)", overflowY: "auto" }}
    >
      <Tabs
        value={pathfinderTab}
        onValueChange={(v) =>
          setPathfinderTab(v as "destination" | "evacuation")
        }
        className="w-full flex flex-col gap-2.5"
      >
        <TabsList className="bg-[#5A5A5A] rounded-md w-full grid grid-cols-2 p-1 h-auto items-center">
          <TabsTrigger
            value="evacuation"
            className="data-[state=active]:bg-[#FFFFFF] data-[state=active]:text-[#2E2E2E] data-[state=active]:shadow-none text-[#FFFFFF] text-[10px] font-medium rounded-sm flex items-center justify-center h-[24px] px-2 border-0"
            style={{ lineHeight: "24px", padding: "0 0.5rem" }}
          >
            Find Shelter/s
          </TabsTrigger>
          <TabsTrigger
            value="destination"
            className="data-[state=active]:bg-[#FFFFFF] data-[state=active]:text-[#2E2E2E] data-[state=active]:shadow-none text-[#FFFFFF] text-[10px] font-medium rounded-sm flex items-center justify-center h-[24px] px-2 border-0"
            style={{ lineHeight: "24px", padding: "0 0.5rem" }}
          >
            Set Destination
          </TabsTrigger>
        </TabsList>

        {/* Shared starting point (both modes) */}
        <div className="flex flex-col gap-2">
          <div className="relative" ref={startContainerRef}>
            <div className="bg-[#5A5A5A] h-[30px] flex items-center gap-1.5 px-2 rounded-md shadow-md">
              <MapPin
                width={15}
                height={15}
                color="#75F7A9"
                className="flex-shrink-0"
              />
              <input
                ref={startRef}
                type="text"
                placeholder="Enter starting point..."
                value={startText}
                onChange={(e) => setStartText(e.target.value)}
                onBlur={() => {
                  // Clear suggestions after a short delay to allow click events to fire
                  setTimeout(() => setStartSuggestions([]), 200);
                }}
                onKeyDown={(e) => {
                  if (e.key === "ArrowDown") {
                    e.preventDefault();
                    setStartHighlightedIndex((prev) =>
                      Math.min(prev + 1, startSuggestions.length - 1)
                    );
                  } else if (e.key === "ArrowUp") {
                    e.preventDefault();
                    setStartHighlightedIndex((prev) => Math.max(prev - 1, 0));
                  } else if (e.key === "Enter" && startHighlightedIndex >= 0) {
                    handleSuggestionSelect(
                      startSuggestions[startHighlightedIndex]
                    );
                  }
                }}
                className="bg-transparent outline-none text-[10px] text-[#C7C7C7] placeholder-[#999] w-full h-full"
              />
              {startText && (
                <button
                  onClick={() => {
                    setStartText("");
                    setStartCoords(null);
                    setStartSuggestions([]);
                    mapRef.current?.clearStartMarker?.();
                    setSelectedEvacId("");
                    setShowEvacDropdown(false);
                    setEvacPlaces([]);
                    setEvacError(null);

                    // Stop loading state if currently fetching
                    if (isLoadingRoutes) {
                      setIsLoadingRoutes(false);
                      setRoutesLoadingPhase(null);
                      routeRequestInFlightRef.current = false;
                      clearSortOverlayTimeout();
                    }

                    // Clear routes if they exist
                    if (routesData.length > 0) {
                      setRoutesData([]);
                      setSelectedRouteKey(null);
                      setSelectedMode("all");
                      routesCacheRef.current = {};

                      // Stop traffic polling
                      if (trafficPollingIntervalRef.current) {
                        clearInterval(trafficPollingIntervalRef.current);
                        trafficPollingIntervalRef.current = null;
                      }

                      // Clear routes from map
                      mapRef.current?.clearRoutes?.();
                    }
                    setDestinationText("");
                    setDestinationCoords(null);
                    mapRef.current?.clearDestinationMarker?.();
                  }}
                  className="flex-shrink-0 hover:opacity-70 transition-opacity"
                >
                  <X width={14} height={14} color="#C7C7C7" />
                </button>
              )}
            </div>
            {startSuggestions.length > 0 &&
              ReactDOM.createPortal(
                <ul
                  ref={startSuggestionsRef}
                  className="absolute z-[999] mt-1.5 bg-white rounded-md shadow-lg max-h-48 overflow-y-auto text-[#2E2E2E] scrollbar-rounded"
                  style={{
                    top: startContainerRef.current
                      ? startContainerRef.current.getBoundingClientRect()
                          .bottom +
                        window.scrollY +
                        4
                      : 0,
                    left: startContainerRef.current
                      ? startContainerRef.current.getBoundingClientRect().left
                      : 0,
                    width: startContainerRef.current
                      ? startContainerRef.current.getBoundingClientRect().width
                      : undefined,
                    position: "absolute",
                  }}
                >
                  {startSuggestions.map((place, index) => (
                    <li
                      key={index}
                      ref={(el) => {
                        startItemRefs.current[index] = el;
                      }}
                      onClick={() => handleSuggestionSelect(place)}
                      className={`px-2.5 py-1.5 text-[10px] cursor-pointer ${
                        startHighlightedIndex === index
                          ? "bg-[#5A5A5A] text-white"
                          : "hover:bg-[#eeeeee]"
                      }`}
                    >
                      {place.properties.formatted}
                    </li>
                  ))}
                </ul>,
                document.body
              )}
          </div>

          <TabsContent
            value="destination"
            className="flex flex-col gap-2 outline-none mt-0 data-[state=inactive]:hidden"
          >
          <div className="relative" ref={destinationContainerRef}>
            <div className="bg-[#5A5A5A] h-[30px] flex items-center gap-1.5 px-2 rounded-md shadow-md">
              <MapPin
                width={15}
                height={15}
                color="#FF9494"
                className="flex-shrink-0"
              />
              <input
                ref={destinationRef}
                type="text"
                placeholder="Enter destination..."
                value={destinationText}
                onChange={(e) => setDestinationText(e.target.value)}
                onBlur={() => {
                  // Clear suggestions after a short delay to allow click events to fire
                  setTimeout(() => setDestinationSuggestions([]), 200);
                }}
                onKeyDown={(e) => {
                  if (e.key === "ArrowDown") {
                    e.preventDefault();
                    setDestinationHighlightedIndex((prev) =>
                      Math.min(prev + 1, destinationSuggestions.length - 1)
                    );
                  } else if (e.key === "ArrowUp") {
                    e.preventDefault();
                    setDestinationHighlightedIndex((prev) =>
                      Math.max(prev - 1, 0)
                    );
                  } else if (
                    e.key === "Enter" &&
                    destinationHighlightedIndex >= 0
                  ) {
                    handleDestinationSelect(
                      destinationSuggestions[destinationHighlightedIndex]
                    );
                  }
                }}
                className="bg-transparent outline-none text-[10px] text-[#C7C7C7] placeholder-[#999] w-full h-full"
              />
              {destinationText && (
                <button
                  onClick={() => {
                    setDestinationText("");
                    setDestinationCoords(null);
                    setDestinationSuggestions([]);
                    mapRef.current?.clearDestinationMarker?.();

                    // Stop loading state if currently fetching
                    if (isLoadingRoutes) {
                      setIsLoadingRoutes(false);
                      setRoutesLoadingPhase(null);
                      routeRequestInFlightRef.current = false;
                      clearSortOverlayTimeout();
                    }

                    // Clear routes if they exist
                    if (routesData.length > 0) {
                      setRoutesData([]);
                      setSelectedRouteKey(null);
                      setSelectedMode("all");
                      routesCacheRef.current = {};

                      // Stop traffic polling
                      if (trafficPollingIntervalRef.current) {
                        clearInterval(trafficPollingIntervalRef.current);
                        trafficPollingIntervalRef.current = null;
                      }

                      // Clear routes from map
                      mapRef.current?.clearRoutes?.();
                    }
                  }}
                  className="flex-shrink-0 hover:opacity-70 transition-opacity"
                >
                  <X width={14} height={14} color="#C7C7C7" />
                </button>
              )}
            </div>
            {destinationSuggestions.length > 0 &&
              ReactDOM.createPortal(
                <ul
                  ref={destinationSuggestionsRef}
                  className="absolute z-[999] mt-1.5 bg-white rounded-md shadow-lg max-h-48 overflow-y-auto text-[#2E2E2E] scrollbar-rounded"
                  style={{
                    top: destinationContainerRef.current
                      ? destinationContainerRef.current.getBoundingClientRect()
                          .bottom +
                        window.scrollY +
                        4
                      : 0,
                    left: destinationContainerRef.current
                      ? destinationContainerRef.current.getBoundingClientRect()
                          .left
                      : 0,
                    width: destinationContainerRef.current
                      ? destinationContainerRef.current.getBoundingClientRect()
                          .width
                      : undefined,
                    position: "absolute",
                  }}
                >
                  {destinationSuggestions.map((place, index) => (
                    <li
                      key={index}
                      ref={(el) => {
                        destinationItemRefs.current[index] = el;
                      }}
                      onClick={() => handleDestinationSelect(place)}
                      className={`px-2.5 py-1.5 text-[10px] cursor-pointer ${
                        destinationHighlightedIndex === index
                          ? "bg-[#5A5A5A] text-white"
                          : "hover:bg-[#eeeeee]"
                      }`}
                    >
                      {place.properties.formatted}
                    </li>
                  ))}
                </ul>,
                document.body
              )}
          </div>
          </TabsContent>

          <TabsContent
            value="evacuation"
            className="flex flex-col gap-2 outline-none mt-0 data-[state=inactive]:hidden"
          >
            {!startCoords && (
              <p className="text-[9px] text-gray-500 leading-snug">
                Enter a starting location above, and nearby shelters will
                automatically appear.
              </p>
            )}
            {startCoords && (
              <>
                <div className="flex flex-col gap-1">
                  <div className="flex justify-between items-center text-[9px] text-gray-400">
                    <span>Radius near start</span>
                    <span className="text-white font-semibold">
                      {evacRadiusKm.toFixed(1)} km
                    </span>
                  </div>
                  <input
                    type="range"
                    min={0.5}
                    max={30}
                    step={0.5}
                    value={evacRadiusKm}
                    onChange={(e) =>
                      setEvacRadiusKm(parseFloat(e.target.value))
                    }
                    className="w-full h-1.5 accent-[#9699FF] cursor-pointer"
                  />
                  <p className="text-[8px] text-gray-500">
                    Minimum 0.5 km. List refreshes when you change radius.
                  </p>
                </div>
                {evacLoading && (
                  <p className="text-[9px] text-gray-400 animate-pulse">
                    Loading nearby schools & shelters from OSM…
                  </p>
                )}
                {evacError && (
                  <p className="text-[9px] text-red-400 leading-snug">
                    {evacError}
                  </p>
                )}
                {!evacLoading && !evacError && startCoords && (
                  <div className="flex flex-col gap-1 w-full min-w-0">
                    <label className="text-[9px] text-gray-400">
                      Evacuation destination (OSM)
                    </label>
                    <div className="w-full min-w-0">
                      <div
                        ref={evacDropdownTriggerRef}
                        className="bg-[#5A5A5A] min-h-[30px] flex items-center gap-1.5 px-2 rounded-md shadow-md w-full min-w-0"
                      >
                        <div className="flex-1 min-w-0">
                          <button
                            type="button"
                            disabled={evacPlaces.length === 0}
                            onClick={() =>
                              evacPlaces.length > 0 &&
                              setShowEvacDropdown((open) => !open)
                            }
                            className="flex items-center justify-between gap-1 w-full min-h-[30px] min-w-0 bg-transparent text-white text-[9px] py-1.5 rounded-sm hover:opacity-95 transition disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            <span
                              className={`truncate text-left flex-1 min-w-0 leading-snug ${
                                selectedEvacId && evacPlaces.length > 0
                                  ? "text-white"
                                  : "text-[#C7C7C7]"
                              }`}
                            >
                              {(() => {
                                const sel = evacPlaces.find(
                                  (x) => x.id === selectedEvacId
                                );
                                if (sel) {
                                  return `${sel.name}${
                                    sel.kind ? ` · ${sel.kind}` : ""
                                  }`;
                                }
                                return evacPlaces.length === 0
                                  ? "No facilities found — increase radius"
                                  : "Select shelter / school…";
                              })()}
                            </span>
                            {evacPlaces.length > 0 ? (
                              showEvacDropdown ? (
                                <ChevronUp
                                  size={12}
                                  className="flex-shrink-0"
                                />
                              ) : (
                                <ChevronDown
                                  size={12}
                                  className="flex-shrink-0"
                                />
                              )
                            ) : null}
                          </button>
                        </div>
                        <button
                          type="button"
                          disabled={
                            !selectedEvacId || evacPlaces.length === 0
                          }
                          aria-label="Clear evacuation destination"
                          title={
                            selectedEvacId && evacPlaces.length > 0
                              ? "Clear destination"
                              : "Select a destination to clear"
                          }
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            if (!selectedEvacId || evacPlaces.length === 0)
                              return;
                            handleEvacShelterSelect("");
                          }}
                          className="flex-shrink-0 p-0.5 transition-opacity enabled:hover:opacity-70 disabled:cursor-not-allowed"
                        >
                          <X
                            width={14}
                            height={14}
                            strokeWidth={2}
                            color={
                              selectedEvacId && evacPlaces.length > 0
                                ? "#C7C7C7"
                                : "#B8B8B8"
                            }
                            className={
                              selectedEvacId && evacPlaces.length > 0
                                ? ""
                                : "opacity-[0.85]"
                            }
                          />
                        </button>
                      </div>

                      {showEvacDropdown &&
                        evacPlaces.length > 0 &&
                        typeof document !== "undefined" &&
                        ReactDOM.createPortal(
                          <div
                            ref={evacDropdownMenuRef}
                            className="fixed z-[9999] rounded-sm shadow-lg bg-[#5A5A5A] border border-[#4a4a4a] overflow-hidden"
                            style={{
                              top: evacMenuLayout.top,
                              left: evacMenuLayout.left,
                              width: evacMenuLayout.width,
                            }}
                          >
                            <div
                              className="scrollbar-rounded overflow-y-auto text-[9px] text-white py-0.5"
                              style={{ maxHeight: evacMenuLayout.maxHeight }}
                            >
                              {evacPlaces.map((p) => (
                                <div
                                  key={p.id}
                                  role="button"
                                  tabIndex={0}
                                  onClick={() => handleEvacShelterSelect(p.id)}
                                  onKeyDown={(e) => {
                                    if (e.key === "Enter" || e.key === " ") {
                                      e.preventDefault();
                                      handleEvacShelterSelect(p.id);
                                    }
                                  }}
                                  className={`px-2 py-1.5 cursor-pointer hover:bg-[#6A6A6A] leading-snug break-words ${
                                    selectedEvacId === p.id
                                      ? "bg-gradient-to-r from-[#9699FF] to-white text-black font-medium"
                                      : ""
                                  }`}
                                >
                                  {p.name}
                                  {p.kind ? ` · ${p.kind}` : ""}
                                </div>
                              ))}
                            </div>
                          </div>,
                          document.body
                        )}
                    </div>
                  </div>
                )}
              </>
            )}
          </TabsContent>

          {/* Clear Routes Button */}
          {routesData.length > 0 && (
            <button
              onClick={() => {
                clearDisplayedRoutesFromMap();
                console.log("🗑️ All routes cleared");
              }}
              className="px-2 py-1.5 rounded-md shadow-md text-center bg-[#5A5C99] text-white whitespace-nowrap text-[10px] cursor-pointer hover:opacity-90 w-full mt-0.5 mb-3"
            >
              Clear Routes
            </button>
          )}

          {/* Transport Buttons */}
          {routesData.length > 0 && (
            <div className="flex justify-between items-center">
              <button
                className={buttonClass("all")}
                onClick={() => {
                  if (startCoords && destinationCoords) {
                    setSelectedMode("all");
                  }
                }}
              >
                <Route size={20} />
              </button>

              <button
                className={buttonClass("driving")}
                onClick={() => {
                  if (startCoords && destinationCoords) {
                    setSelectedMode("driving");
                  }
                }}
              >
                <Car size={20} />
              </button>

              <button
                className={buttonClass("motorcycle")}
                onClick={() => {
                  if (startCoords && destinationCoords) {
                    setSelectedMode("motorcycle");
                  }
                }}
              >
                <TwoWheelerIcon
                  style={{
                    fontSize: 20,
                    color:
                      selectedMode === "motorcycle" ? "#2E2E2E" : "#C7C7C7",
                  }}
                />
              </button>

              <button
                className={buttonClass("cycling")}
                onClick={() => {
                  if (startCoords && destinationCoords) {
                    setSelectedMode("cycling");
                  }
                }}
              >
                <Bike size={20} />
              </button>

              <button
                className={buttonClass("walking")}
                onClick={() => {
                  if (startCoords && destinationCoords) {
                    setSelectedMode("walking");
                  }
                }}
              >
                <Footprints size={20} />
              </button>
            </div>
          )}

          {/* Routes & Steps */}
          {(routesData.length > 0 || isLoadingRoutes) && (
            <>
              {!isLoadingRoutes && (
                <div className="flex items-center gap-1.5 mt-1">
                  <p className="text-white text-[9px] font-semibold">
                    Available Routes
                  </p>
                  <div className="bg-[#5A5A5A] text-[#00FF7B] text-[9px] font-semibold w-5 h-5 rounded-sm shadow-md flex items-center justify-center">
                    {
                      routesData.filter((r) =>
                        selectedMode === "all"
                          ? true
                          : r.profile === selectedMode
                      ).length
                    }
                  </div>

                  {/* Sorting Dropdown */}
                  <div className="relative ml-auto" ref={sortDropdownRef}>
                    <button
                      onClick={() => setShowSortDropdown((prev) => !prev)}
                      className="flex items-center justify-between gap-0.5 bg-[#5A5A5A] text-white text-[9px] px-2 py-0.5 rounded-sm hover:bg-[#6A6A6A] transition w-[95px]"
                    >
                      {selectedSort}
                      {showSortDropdown ? (
                        <ChevronUp size={12} />
                      ) : (
                        <ChevronDown size={12} />
                      )}
                    </button>

                    {showSortDropdown && (
                      <div className="absolute right-0 mt-0.5 w-[95px] bg-[#5A5A5A] rounded-sm shadow-lg text-[9px] text-white z-50">
                        {/* Only show "Fastest" for walking mode, all options for others */}
                        {(selectedMode === "walking"
                          ? ["Fastest"]
                          : ["Best balance", "Safest", "Fastest"]
                        ).map((option, index, array) => (
                          <div
                            key={option}
                            onClick={() => {
                              applySelectedSort(option);
                            }}
                            className={`px-2 py-0.5 cursor-pointer hover:bg-[#6A6A6A] 
            ${
              selectedSort === option
                ? "bg-gradient-to-r from-[#9699FF] to-white text-black"
                : ""
            }
            ${index === 0 ? "rounded-t-sm" : ""}
            ${index === array.length - 1 ? "rounded-b-sm" : ""}
          `}
                          >
                            {option}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Loading State */}
              {isLoadingRoutes && (
                <div
                  className={`flex flex-col items-center justify-center bg-[#1E1E1E] px-8 rounded-md ${
                    routesLoadingPhase === "finding"
                      ? "py-12 min-h-[200px]"
                      : "py-8 min-h-[150px]"
                  }`}
                >
                  <div className="relative w-10 h-10 mb-6">
                    {/* Spinning circle animation */}
                    <div className="absolute inset-0 border-3 border-[#3A3A3A] rounded-full"></div>
                    <div className="absolute inset-0 border-3 border-transparent border-t-[#9699FF] rounded-full animate-spin"></div>
                  </div>
                  <p className="text-white text-[11px] font-semibold">
                    {routesLoadingPhase === "filtering"
                      ? "Filtering Routes..."
                      : routesLoadingPhase === "sorting"
                        ? "Sorting Routes..."
                        : "Finding Routes..."}
                  </p>
                  {routesLoadingPhase === "finding" && (
                    <p className="text-[#AAAAAA] text-[9px] text-center mt-2">
                      Analyzing traffic and calculating best paths
                    </p>
                  )}
                </div>
              )}

              {/* Routes List */}
              {!isLoadingRoutes && routesData.length > 0 && (
                <div className="scrollbar-rounded max-h-160 overflow-y-auto bg-[#1E1E1E] p-2 rounded-md space-y-2">
                  {(
                    selectedSort === "Fastest"
                      ? sortRoutesFastest(routesData)
                      : selectedSort === "Safest"
                        ? sortRoutesSafest(routesData)
                        : selectedSort === "Best balance"
                          ? sortRoutesBestBalance(routesData)
                          : routesData
                  )
                    .filter((r) =>
                      selectedMode === "all" ? true : r.profile === selectedMode
                    )
                    .map((route, idx) => {
                    const routeKey = `${route.profile}-${route.source}-${route.index}`;
                    const isSelected = selectedRouteKey === routeKey;
                    const featureIdx = routeKeyToFeatureIndex[routeKey];

                    return (
                      <div
                        key={idx}
                        onClick={() => {
                          setSelectedRouteKey(routeKey);
                          // if mapping exists, ask map to highlight that feature index
                          mapRef.current?.highlightRouteByFeatureIndex(
                            typeof featureIdx === "number" ? featureIdx : null
                          );
                        }}
                        className={`border rounded-sm p-2 text-[10px] text-[#C7C7C7] cursor-pointer transition
                          ${
                            isSelected
                              ? "border-[#9699FF] shadow-lg"
                              : "border-[#3A3A3A]"
                          }`}
                      >
                        <div className="flex items-center">
                          {/* Left: Icon and Time */}
                          <div className="flex flex-col items-center justify-center px-0.5">
                            {route.profile === "driving" && (
                              <Car className="text-white" size={16} />
                            )}
                            {route.profile === "cycling" && (
                              <Bike className="text-white" size={16} />
                            )}
                            {route.profile === "walking" && (
                              <Footprints className="text-white" size={16} />
                            )}
                            {route.profile === "motorcycle" && (
                              <TwoWheelerIcon
                                style={{ fontSize: 16, color: "white" }}
                              />
                            )}
                            <span className="w-[40px] text-center text-[9px] text-[#AAAAAA] mt-1 inline-block">
                              {formatDuration(route.duration)}
                            </span>
                          </div>

                          {/* Divider */}
                          <div className="w-px h-[45px] bg-[#555] mx-1" />

                          {/* Right: Title, Distance, Button */}
                          <div className="flex flex-col justify-center pl-1 flex-1">
                            <p className="font-semibold capitalize text-white text-[10px]">
                              {selectedSort === "Fastest" ? (
                                <>
                                  {idx === 0 &&
                                    `Fastest - ${route.profile} Route`}
                                  {idx === 1 &&
                                    `2nd Fastest - ${route.profile} Route`}
                                  {idx === 2 &&
                                    `3rd Fastest - ${route.profile} Route`}
                                  {idx > 2 &&
                                    `${getOrdinal(idx + 1)} - ${
                                      route.profile
                                    } Route`}
                                </>
                              ) : selectedSort === "Safest" ? (
                                <>
                                  {idx === 0 &&
                                    `Safest - ${route.profile} Route`}
                                  {idx === 1 &&
                                    `2nd Safest - ${route.profile} Route`}
                                  {idx === 2 &&
                                    `3rd Safest - ${route.profile} Route`}
                                  {idx > 2 &&
                                    `${getOrdinal(idx + 1)} - ${
                                      route.profile
                                    } Route`}
                                </>
                              ) : selectedSort === "Best balance" ? (
                                <>
                                  {idx === 0 &&
                                    `Best Balance - ${route.profile} Route`}
                                  {idx === 1 &&
                                    `2nd Best Balance - ${route.profile} Route`}
                                  {idx === 2 &&
                                    `3rd Best Balance - ${route.profile} Route`}
                                  {idx > 2 &&
                                    `${getOrdinal(idx + 1)} - ${
                                      route.profile
                                    } Route`}
                                </>
                              ) : (
                                `${route.profile} Route`
                              )}
                            </p>

                            <p className="text-[10px] mt-0.5">
                              {(route.distance / 1000).toFixed(2)} km
                            </p>

                            <button
                              onClick={() =>
                                setShowStepsMap((prev) => ({
                                  ...prev,
                                  [routeKey]: !prev[routeKey],
                                }))
                              }
                              className="flex items-center gap-0.5 text-[9px] text-transparent bg-gradient-to-r from-[#9699FF] to-white bg-clip-text hover:underline transition mt-1.5 w-fit"
                            >
                              <ChevronDown
                                className={`transition-transform duration-300 text-[#9699FF] ${
                                  showStepsMap[routeKey] ? "rotate-180" : ""
                                }`}
                                size={10}
                              />
                              {showStepsMap[routeKey] ? "Hide" : "Show"}{" "}
                              Directions
                            </button>
                          </div>
                        </div>

                        {/* Steps */}
                        {showStepsMap[routeKey] && (
                          <ol className="list-decimal text-[9px] text-[#AAAAAA] pl-4 space-y-0.5 mt-2">
                            {route.steps.map((step: any, i: number) => (
                              <li key={i}>{step.maneuver.instruction}</li>
                            ))}
                          </ol>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </>
          )}
        </div>
      </Tabs>

      {/* Bottom-center summary: above CenterBottomClock (clock ~50px + bottom-15px + gap) */}
      {routesData.length > 0 && (
        <div
          className="fixed left-1/2 z-[1000] w-[500px] max-w-[calc(100vw-32px)] -translate-x-1/2 bg-[#2E2E2E] rounded-xl shadow-md text-white p-3.5"
          style={{
            bottom:
              "calc(15px + 50px + 14px + env(safe-area-inset-bottom, 0px))",
          }}
        >
          <p className="text-center text-[13px] font-semibold">Route Hazards</p>
          <hr className="border-gray-500 my-2" />

          <div className="mt-3 grid grid-cols-2 gap-x-5 gap-y-0 items-start">
            <div className="space-y-2 min-w-0">
              <div className="flex justify-between items-center gap-2 text-[10px]">
                <span className="flex-1 truncate">Obstructions</span>
                <span className="text-right min-w-[40px] shrink-0">3</span>
              </div>
              <div className="flex justify-between items-center gap-2 text-[10px]">
                <span className="flex-1 truncate">Congestion</span>
                <span className="text-right min-w-[40px] shrink-0">5</span>
              </div>
              <div className="flex justify-between items-center gap-2 text-[10px]">
                <span className="flex-1 truncate">Road Closure</span>
                <span className="text-right min-w-[40px] shrink-0">1</span>
              </div>
            </div>
            <div className="space-y-2 min-w-0">
              <div className="flex justify-between items-center gap-2 text-[10px]">
                <span className="flex-1 truncate">Lane Closure</span>
                <span className="text-right min-w-[40px] shrink-0">2</span>
              </div>
              <div className="flex justify-between items-center gap-2 text-[10px]">
                <span className="flex-1 truncate">Flooded Points</span>
                <span className="text-right min-w-[40px] shrink-0">4</span>
              </div>
            </div>

            {/* More info button */}
            <div className="text-center col-span-2 pt-2">
              <button
                onClick={() => setShowModal(true)}
                className="text-[10px] text-[#8183e5] hover:text-[#a7a9fa]"
              >
                More info
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/50 z-[2000]">
          <div className="bg-[#2E2E2E] rounded-xl shadow-lg p-6 max-w-md w-full relative">
            {/* Close Icon Button */}
            <button
              onClick={() => setShowModal(false)}
              className="absolute top-3 right-3 text-gray-500 hover:text-[#8183e5]"
            >
              <X size={20} />
            </button>

            {/* Heading */}
            <h2 className="text-lg font-semibold mb-2 flex items-center gap-2">
              Route Hazards →
              <span className="font-normal text-gray-300">Safest Route</span>
            </h2>
            <hr className="border-gray-500 mb-4" />

            <div className="mt-4 space-y-2">
              <div className="flex items-center gap-x-4 text-[10px]">
                <span className="w-32">Obstructions</span>
                <span className="bg-gradient-to-r from-[#9699FF] to-white bg-clip-text text-transparent">
                  3
                </span>
              </div>
              <div className="flex items-center gap-x-4 text-[10px]">
                <span className="w-32">Congestion</span>
                <span className="bg-gradient-to-r from-[#9699FF] to-white bg-clip-text text-transparent">
                  5
                </span>
              </div>
              <div className="flex items-center gap-x-4 text-[10px]">
                <span className="w-32">Road Closure</span>
                <span className="bg-gradient-to-r from-[#9699FF] to-white bg-clip-text text-transparent">
                  1
                </span>
              </div>
              <div className="flex items-center gap-x-4 text-[10px]">
                <span className="w-32">Lane Closure</span>
                <span className="bg-gradient-to-r from-[#9699FF] to-white bg-clip-text text-transparent">
                  2
                </span>
              </div>

              {/* Flooded Points */}
              <div className="flex items-start gap-x-4 text-[10px]">
                <span className="w-32">Flooded Points</span>
                <div className="flex flex-col space-y-1">
                  <span className="bg-gradient-to-r from-[#9699FF] to-white bg-clip-text text-transparent">
                    Point 3 (14.5995, 120.9842) -1.2m
                  </span>
                  <span className="bg-gradient-to-r from-[#9699FF] to-white bg-clip-text text-transparent">
                    Point 5 (14.6010, 120.9820) - 1.2m
                  </span>
                  <span className="bg-gradient-to-r from-[#9699FF] to-white bg-clip-text text-transparent">
                    Point 6 (14.6025, 120.9805) - 3.0m
                  </span>
                  <span className="bg-gradient-to-r from-[#9699FF] to-white bg-clip-text text-transparent">
                    Point 7 (14.6040, 120.9790) - 3.0m
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
});

PathfinderControls.displayName = "PathfinderControls";
export default PathfinderControls;
