// \SafeGIS\Simulation-Studio\frontend\src\components\Main-UI-Layout.tsx
"use client";

import {
  useEffect,
  useRef,
  useState,
  useCallback,
  useReducer,
  useMemo,
} from "react";
import { flushSync } from "react-dom";
import { ChevronDown } from "lucide-react";
import { PieChart, Pie, Cell, ResponsiveContainer, Sector } from "recharts";

import MapComponent, { type MapUndoSnapshot } from "./Map/MainCanvas";
import SafeGISAIChat from "./controls/SafeGIS AI/SafeGIS-AI-Chat";
import SelectMaps from "./controls/Features/Maps/SelectMaps";
import PathfinderControls, {
  EMPTY_PATHFINDER_UNDO_SNAPSHOT,
  type PathfinderUndoSnapshot,
} from "./controls/Features/Pathfinder/PathfinderControls";
import LocationSearchBar from "./controls/Main/LocationSearchBar";
import SelectPlanningTools from "./controls/Features/Planning Suite/SelectPlanningTools";
import SelectAssessment from "./controls/Features/Assessment Tools/SelectAssessment";
import RightSideControls, {
  CenterRightControlsRef,
} from "./controls/Main/CenterRightControls";
import CenterLeftControls from "./controls/Main/CenterLeftControls";

import UserSettings from "./controls/Main/UserSettings";
import CenterTopControls from "./controls/Main/CenterTopControls";
import CenterBottomClock from "./controls/Main/CenterBottomClock";
import ToolPanel from "./controls/Features/ToolPanel";
import LiveHazardMonitor from "./controls/Main/LiveHazardMonitor";
import LayersPanel from "./controls/Main/LayersPanel";
import CropDinIcon from "@mui/icons-material/CropDin";
import CropLandscapeIcon from "@mui/icons-material/CropLandscape";
import CropPortraitIcon from "@mui/icons-material/CropPortrait";
import Crop169Icon from "@mui/icons-material/Crop169";
import Crop32Icon from "@mui/icons-material/Crop32";
import Crop54Icon from "@mui/icons-material/Crop54";
import Crop75Icon from "@mui/icons-material/Crop75";
import CropFreeIcon from "@mui/icons-material/CropFree";
import {
  MAPBOX_CUSTOM_STANDARD_STYLE_URL,
  DEFAULT_STANDARD_3D_PITCH,
  DEFAULT_STANDARD_3D_BEARING,
} from "@/lib/mapboxCustomStandard";

type UiUndoSnapshot = {
  searchText: string;
  suggestions: any[];
  highlightedIndex: number;
  viewMode: "2d" | "3d";
  showSelectMaps: boolean;
  showPathfinder: boolean;
  showPlanningTools: boolean;
  showTimeOfDayDropdown: boolean;
  showMapStyleDropdown: boolean;
  selectedTimeOfDay: string | null;
  show3DControls: boolean;
  showLiveHazardMonitor: boolean;
  liveEarthquakeEnabled: boolean;
  liveWeatherEnabled: boolean;
  selectedEarthquakeSources: string[];
  selectedWeatherSources: string[];
  showToolPanel: boolean;
  selectedMaps: string[];
  showAffectedAreas: boolean;
  affectedAreasData: GeoJSON.FeatureCollection | null;
  expandedPanels: Record<string, boolean>;
  geologicalExpanded: boolean;
  trafficExpanded: boolean;
  selectedPlanningTools: string[];
  selectedPlan: { name: string; date: string } | null;
  showAssessmentTools: boolean;
  selectedAssessmentTools: string[];
  uploadedFiles: { name: string; layerName: string; sourceType?: string }[];
  isBoundaryLoading: boolean;
  boundaryLoadingStage: string;
  isFileLoading: boolean;
  fileLoadingStage: string;
  showAspectRatioSelector: boolean;
  selectedAspectRatio: string;
  tempAspectRatio: string;
  isDrawingAspectRatio: boolean;
  aspectRatioShapeDrawn: boolean;
  isDrawingBox: boolean;
  isDrawingRectangle: boolean;
  shapeDrawn: boolean;
  scopeConfirmed: boolean;
  showExposureResults: boolean;
  exposureResultsData: any;
  isAnalysisRunning: boolean;
  exposureResultsMinimized: boolean;
  exposureResultsPosition: { x: number; y: number };
  isDraggingResults: boolean;
  selectedMapStyle: string;
  earthquakeEnabled: boolean;
  volcanoListEnabled: boolean;
  activeFaultsEnabled: boolean;
  congestionEnabled: boolean;
  savedAspectRatioShape: GeoJSON.FeatureCollection | null;
  /** Pathfinder panel state (optional for snapshots taken before this existed). */
  pathfinder?: PathfinderUndoSnapshot;
};

type FullUndoSnapshot = { ui: UiUndoSnapshot; map: MapUndoSnapshot | null };

const ASSESSMENT_TOOL_LABEL_UPGRADES: Record<string, string> = {
  "Hazard & Damage Detection": "Hazard & Damage Assessment",
  "Critical Asset Detection": "Critical Asset Assessment",
};

function upgradeAssessmentToolLabels(tools: string[]): string[] {
  let changed = false;
  const next = tools.map((t) => {
    const u = ASSESSMENT_TOOL_LABEL_UPGRADES[t];
    if (u) {
      changed = true;
      return u;
    }
    return t;
  });
  if (!changed) return tools;
  return [...new Set(next)];
}

/** Older undo payloads stored imagery tools separately — merge into assessment list. */
function mergeAssessmentToolsForUndo(ui: UiUndoSnapshot): string[] {
  const removedLegacy = new Set(["Vulnerability Assessment"]);
  const fromAssessment = [...(ui.selectedAssessmentTools ?? [])].filter(
    (t) => !removedLegacy.has(t)
  );
  const legacyImagery = (
    (ui as { selectedImageryTools?: string[] }).selectedImageryTools ?? []
  ).filter((t) => !removedLegacy.has(t));
  return upgradeAssessmentToolLabels(
    [...new Set([...fromAssessment, ...legacyImagery])]
  );
}

function getMapboxStyleUrlForUndo(
  label: string,
  viewMode: "2d" | "3d"
): string {
  switch (label) {
    case "Streets (Mapbox)":
      return "mapbox://styles/mapbox/streets-v12";
    case "Default (Custom Mapbox Standard)":
      // Custom Mapbox Standard is the 3D basemap; in 2D undo snapshots use streets
      return viewMode === "3d"
        ? MAPBOX_CUSTOM_STANDARD_STYLE_URL
        : "mapbox://styles/mapbox/streets-v12";
    case "Satellite (Mapbox)":
      return "mapbox://styles/mapbox/standard-satellite";
    case "Outdoors (Mapbox)":
      return "mapbox://styles/mapbox/outdoors-v12";
    case "Light (Mapbox)":
      return "mapbox://styles/mapbox/light-v11";
    case "Dark (Mapbox)":
      return "mapbox://styles/mapbox/dark-v11";
    case "Navigation Day (Mapbox)":
      return "mapbox://styles/mapbox/navigation-day-v1";
    case "Navigation Night (Mapbox)":
      return "mapbox://styles/mapbox/navigation-night-v1";
    default:
      return "mapbox://styles/mapbox/streets-v12";
  }
}

export default function MainUILayout() {
  const [searchText, setSearchText] = useState("");
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [highlightedIndex, setHighlightedIndex] = useState<number>(-1);
  const [isDesktop, setIsDesktop] = useState(true);

  // Track if location was just selected to prevent re-fetching suggestions
  const locationJustSelectedRef = useRef(false);
  const [viewMode, setViewMode] = useState<"2d" | "3d">("3d");
  const [showChat, setShowChat] = useState(false);
  const [isChatExpanded, setIsChatExpanded] = useState(false);
  const [showResetConfirmModal, setShowResetConfirmModal] = useState(false);
  const [showSelectMaps, setShowSelectMaps] = useState(false);
  const [showPathfinder, setShowPathfinder] = useState(false);
  const [showPlanningTools, setShowPlanningTools] = useState(false);

  const [showTimeOfDayDropdown, setShowTimeOfDayDropdown] = useState(false);

  const [showMapStyleDropdown, setShowMapStyleDropdown] = useState(false);
  const [autoLightingInterval, setAutoLightingInterval] =
    useState<NodeJS.Timeout | null>(null);
  // "Auto" matches default 3D + Standard basemap so Time of Day shows immediately (not after map ref is ready).
  const [selectedTimeOfDay, setSelectedTimeOfDay] = useState<string | null>(
    "Auto"
  );
  const [show3DControls, setShow3DControls] = useState(true);
  const [selectedMapStyle, setSelectedMapStyle] = useState<string>(
    "Default (Custom Mapbox Standard)"
  );

  // Live Hazard Monitor state
  const [showLiveHazardMonitor, setShowLiveHazardMonitor] = useState(false);
  const [liveEarthquakeEnabled, setLiveEarthquakeEnabled] = useState(false);
  const [liveWeatherEnabled, setLiveWeatherEnabled] = useState(false);
  const [selectedEarthquakeSources, setSelectedEarthquakeSources] = useState<
    string[]
  >([]);
  const [selectedWeatherSources, setSelectedWeatherSources] = useState<
    string[]
  >([]);
  const [showToolPanel, setShowToolPanel] = useState(false);
  const [selectedMaps, setSelectedMaps] = useState<string[]>([]);
  const [showAffectedAreas, setShowAffectedAreas] = useState(false);
  const [affectedAreasData, setAffectedAreasData] =
    useState<GeoJSON.FeatureCollection | null>(null);

  // Add state for expanded panels
  const [expandedPanels, setExpandedPanels] = useState<Record<string, boolean>>(
    {}
  );
  const [geologicalExpanded, setGeologicalExpanded] = useState(false);
  const [trafficExpanded, setTrafficExpanded] = useState(false);
  const [selectedPlanningTools, setSelectedPlanningTools] = useState<string[]>(
    []
  );

  const [selectedPlan, setSelectedPlan] = useState<{
    name: string;
    date: string;
  } | null>(null);
  const [showAssessmentTools, setShowAssessmentTools] = useState(false);
  const [selectedAssessmentTools, setSelectedAssessmentTools] = useState<
    string[]
  >([]);

  // Migrate legacy "Detection" assessment tool labels (saved / older sessions)
  useEffect(() => {
    setSelectedAssessmentTools((prev) => upgradeAssessmentToolLabels(prev));
    setExpandedPanels((prev) => {
      const keyUpgrades: [string, string][] = [
        [
          "assessment-Hazard & Damage Detection",
          "assessment-Hazard & Damage Assessment",
        ],
        [
          "assessment-Critical Asset Detection",
          "assessment-Critical Asset Assessment",
        ],
      ];
      let changed = false;
      const next = { ...prev };
      for (const [oldK, newK] of keyUpgrades) {
        if (oldK in next) {
          next[newK] = next[oldK];
          delete next[oldK];
          changed = true;
        }
      }
      return changed ? next : prev;
    });
  }, []);

  // Uploaded files state (lifted from CenterRightControls)
  const [uploadedFiles, setUploadedFiles] = useState<
    { name: string; layerName: string; sourceType?: string }[]
  >([]);

  // Boundary loading state with stage
  const [isBoundaryLoading, setIsBoundaryLoading] = useState(false);
  const [boundaryLoadingStage, setBoundaryLoadingStage] = useState<string>("");

  // File loading state with stage
  const [isFileLoading, setIsFileLoading] = useState(false);
  const [fileLoadingStage, setFileLoadingStage] = useState<string>("");

  // Aspect ratio selector state
  const [showAspectRatioSelector, setShowAspectRatioSelector] = useState(false);
  const [selectedAspectRatio, setSelectedAspectRatio] = useState<string>("");
  const [tempAspectRatio, setTempAspectRatio] = useState<string>("");
  const [isDrawingAspectRatio, setIsDrawingAspectRatio] = useState(false);
  const [aspectRatioShapeDrawn, setAspectRatioShapeDrawn] = useState(false);
  const savedAspectRatioShapeRef = useRef<GeoJSON.FeatureCollection | null>(
    null
  );

  // Earthquake hazard control states
  const [earthquakeEnabled, setEarthquakeEnabled] = useState(false);
  const earthquakeIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Volcano list control states
  const [volcanoListEnabled, setVolcanoListEnabled] = useState(false);

  // Active faults control states
  const [activeFaultsEnabled, setActiveFaultsEnabled] = useState(false);
  // Congestion control states
  const [congestionEnabled, setCongestionEnabled] = useState(false);

  const [isDrawingBox, setIsDrawingBox] = useState(false); // Square
  const [isDrawingRectangle, setIsDrawingRectangle] = useState(false); // Rectangle

  const [shapeDrawn, setShapeDrawn] = useState(false);
  const [scopeConfirmed, setScopeConfirmed] = useState(false);

  // Exposure assessment results state
  const [showExposureResults, setShowExposureResults] = useState(false);
  const [exposureResultsData, setExposureResultsData] = useState<any>(null);
  const [isAnalysisRunning, setIsAnalysisRunning] = useState(false);
  const [exposureResultsMinimized, setExposureResultsMinimized] =
    useState(true);
  const [exposureResultsPosition, setExposureResultsPosition] = useState({
    x: 0,
    y: 0,
  });
  const [isDraggingResults, setIsDraggingResults] = useState(false);
  const dragStartPos = useRef({ x: 0, y: 0 });

  const undoPastRef = useRef<FullUndoSnapshot[]>([]);
  const undoFutureRef = useRef<FullUndoSnapshot[]>([]);
  const isApplyingHistoryRef = useRef(false);
  const historyDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(
    null
  );
  /** Previous checkpoint; we push this to the undo stack when the map/UI advances. */
  const historyBaselineRef = useRef<FullUndoSnapshot | null>(null);
  /** Ignore moveend-based history briefly after undo/redo/reset (programmatic camera). */
  const undoSuppressMoveUntilRef = useRef(0);
  const [, bumpHistoryUi] = useReducer((n: number) => n + 1, 0);
  /** Disables undo/redo buttons while apply runs (redo/undo symmetry + no double-clicks). */
  const [historyNavBusy, setHistoryNavBusy] = useState(false);

  const latestUiForUndoRef = useRef<UiUndoSnapshot | null>(null);

  /** Panel open/close & shell UI — preserved on undo/redo (same idea as reset not closing panels). */
  const panelShellPreserveRef = useRef({
    showSelectMaps: false,
    showPathfinder: false,
    showPlanningTools: false,
    showLiveHazardMonitor: false,
    showToolPanel: false,
    showAssessmentTools: false,
    showTimeOfDayDropdown: false,
    showMapStyleDropdown: false,
    expandedPanels: {} as Record<string, boolean>,
    geologicalExpanded: false,
    trafficExpanded: false,
    showExposureResults: false,
    exposureResultsMinimized: true,
    exposureResultsPosition: { x: 0, y: 0 },
    isDraggingResults: false,
  });

  latestUiForUndoRef.current = {
    searchText,
    suggestions,
    highlightedIndex,
    viewMode,
    showSelectMaps,
    showPathfinder,
    showPlanningTools,
    showTimeOfDayDropdown,
    showMapStyleDropdown,
    selectedTimeOfDay,
    show3DControls,
    showLiveHazardMonitor,
    liveEarthquakeEnabled,
    liveWeatherEnabled,
    selectedEarthquakeSources: [...selectedEarthquakeSources],
    selectedWeatherSources: [...selectedWeatherSources],
    showToolPanel,
    selectedMaps: [...selectedMaps],
    showAffectedAreas,
    affectedAreasData: affectedAreasData
      ? (JSON.parse(JSON.stringify(affectedAreasData)) as GeoJSON.FeatureCollection)
      : null,
    expandedPanels: { ...expandedPanels },
    geologicalExpanded,
    trafficExpanded,
    selectedPlanningTools: [...selectedPlanningTools],
    selectedPlan: selectedPlan ? { ...selectedPlan } : null,
    showAssessmentTools,
    selectedAssessmentTools: [...selectedAssessmentTools],
    uploadedFiles: [...uploadedFiles],
    isBoundaryLoading,
    boundaryLoadingStage,
    isFileLoading,
    fileLoadingStage,
    showAspectRatioSelector,
    selectedAspectRatio,
    tempAspectRatio,
    isDrawingAspectRatio,
    aspectRatioShapeDrawn,
    isDrawingBox,
    isDrawingRectangle,
    shapeDrawn,
    scopeConfirmed,
    showExposureResults,
    exposureResultsData: exposureResultsData
      ? JSON.parse(JSON.stringify(exposureResultsData))
      : null,
    isAnalysisRunning,
    exposureResultsMinimized,
    exposureResultsPosition: { ...exposureResultsPosition },
    isDraggingResults,
    selectedMapStyle,
    earthquakeEnabled,
    volcanoListEnabled,
    activeFaultsEnabled,
    congestionEnabled,
    savedAspectRatioShape: savedAspectRatioShapeRef.current
      ? (JSON.parse(
          JSON.stringify(savedAspectRatioShapeRef.current)
        ) as GeoJSON.FeatureCollection)
      : null,
  };

  panelShellPreserveRef.current = {
    showSelectMaps,
    showPathfinder,
    showPlanningTools,
    showLiveHazardMonitor,
    showToolPanel,
    showAssessmentTools,
    showTimeOfDayDropdown,
    showMapStyleDropdown,
    expandedPanels: { ...expandedPanels },
    geologicalExpanded,
    trafficExpanded,
    showExposureResults,
    exposureResultsMinimized,
    exposureResultsPosition: { ...exposureResultsPosition },
    isDraggingResults,
  };

  const squareRatio = 1; // 1:1 square
  const rectangleRatio = 16 / 9; // rectangle ratio (can change to 4/3 etc.)

  // Get aspect ratio value from selection
  const getAspectRatioValue = (ratio: string): number => {
    switch (ratio) {
      case "1:1":
        return 1;
      case "16:9":
        return 16 / 9;
      case "9:16":
        return 9 / 16;
      case "3:2":
        return 3 / 2;
      case "5:4":
        return 5 / 4;
      case "7:5":
        return 7 / 5;
      case "free":
        return 0; // 0 means no constraint
      default:
        return 1;
    }
  };

  const mapStyleRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<any>(null);
  const exposureAssessmentRef =
    useRef<
      import("./controls/Features/Assessment Tools/Exposure Assessment/ExposureAssessmentControls").ExposureAssessmentControlsRef
    >(null);
  const pathfinderRef =
    useRef<
      import("./controls/Features/Pathfinder/PathfinderControls").PathfinderControlsRef
    >(null);
  /** Avoid pathfinder debounced history right after applyUndoSnapshot. */
  const suppressPathfinderUndoScheduleRef = useRef(false);
  const centerRightControlsRef = useRef<CenterRightControlsRef>(null);

  // Track temporary box coordinates
  const boxCoordsRef = useRef<{
    start: [number, number] | null;
    end: [number, number] | null;
  }>({ start: null, end: null });

  useEffect(() => {
    if (!mapRef.current) return;
    const map = mapRef.current.getMap();

    function onMouseDown(e: any) {
      if (!(isDrawingBox || isDrawingRectangle || isDrawingAspectRatio)) return;
      boxCoordsRef.current.start = [e.lngLat.lng, e.lngLat.lat];
      boxCoordsRef.current.end = null;
    }

    function onMouseMove(e: any) {
      if (
        !(isDrawingBox || isDrawingRectangle || isDrawingAspectRatio) ||
        !boxCoordsRef.current.start
      )
        return;

      const map = mapRef.current.getMap();

      // Start and current mouse positions in pixels
      const startPixel = map.project(boxCoordsRef.current.start);
      const currentPixel = map.project([e.lngLat.lng, e.lngLat.lat]);

      let dx = currentPixel.x - startPixel.x;
      let dy = currentPixel.y - startPixel.y;

      // --- FIXED RATIO LOGIC (in pixels) ---
      let aspectRatio = 1; // square
      if (isDrawingRectangle) {
        aspectRatio = rectangleRatio; // e.g. 16/9
      } else if (isDrawingAspectRatio) {
        aspectRatio = getAspectRatioValue(tempAspectRatio);
      }

      // Only apply ratio constraint if not "free" (aspectRatio !== 0)
      if (aspectRatio !== 0) {
        if (Math.abs(dx) / Math.abs(dy || 1) > aspectRatio) {
          // too wide → adjust height
          dy = (Math.sign(dy || 1) * Math.abs(dx)) / aspectRatio;
        } else {
          // too tall → adjust width
          dx = Math.sign(dx || 1) * Math.abs(dy) * aspectRatio;
        }
      }

      // Apply adjusted pixel coords
      const fixedPixel = { x: startPixel.x + dx, y: startPixel.y + dy };

      // Convert back to lat/lng
      const endLngLat = map.unproject([fixedPixel.x, fixedPixel.y]);

      // Build rectangle coords
      const [lng1, lat1] = boxCoordsRef.current.start;
      const [lng2, lat2] = [endLngLat.lng, endLngLat.lat];

      const coords = [
        [lng1, lat1],
        [lng2, lat1],
        [lng2, lat2],
        [lng1, lat2],
        [lng1, lat1],
      ];

      const feature: GeoJSON.Feature = {
        type: "Feature",
        geometry: {
          type: "Polygon",
          coordinates: [coords],
        },
        properties: {},
      };

      const featureCollection: GeoJSON.FeatureCollection = {
        type: "FeatureCollection",
        features: [feature],
      };

      // Save the shape data for restoration after style changes
      if (isDrawingAspectRatio) {
        savedAspectRatioShapeRef.current = featureCollection;
      }

      if (map.getSource("drawn-box")) {
        (map.getSource("drawn-box") as mapboxgl.GeoJSONSource).setData(
          featureCollection
        );
      } else {
        map.addSource("drawn-box", {
          type: "geojson",
          data: featureCollection,
        });
        map.addLayer({
          id: "drawn-box-layer",
          type: "fill",
          source: "drawn-box",
          paint: {
            "fill-color": "#9699FF",
            "fill-opacity": 0.15,
          },
        });
        map.addLayer({
          id: "drawn-box-outline",
          type: "line",
          source: "drawn-box",
          paint: {
            "line-color": "#9699FF",
            "line-width": 2,
          },
        });
      }
    }

    function onMouseUp() {
      if (!(isDrawingBox || isDrawingRectangle || isDrawingAspectRatio)) return;

      if (isDrawingAspectRatio) {
        setIsDrawingAspectRatio(false);
        setAspectRatioShapeDrawn(true);
      } else {
        setIsDrawingBox(false);
        setIsDrawingRectangle(false);
        setShapeDrawn(true);
        setScopeConfirmed(false);
      }

      const map = mapRef.current.getMap();
      map.getCanvas().style.cursor = "";
      map.dragPan.enable();
    }

    map.on("mousedown", onMouseDown);
    map.on("mousemove", onMouseMove);
    map.on("mouseup", onMouseUp);

    return () => {
      map.off("mousedown", onMouseDown);
      map.off("mousemove", onMouseMove);
      map.off("mouseup", onMouseUp);
    };
  }, [isDrawingBox, isDrawingRectangle, isDrawingAspectRatio, tempAspectRatio]);

  const searchContainerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const suggestionsRef = useRef<HTMLUListElement>(null);
  const timeOfDayRef = useRef<HTMLDivElement>(null); // <-- new ref

  useEffect(() => {
    const checkSize = () => setIsDesktop(window.innerWidth >= 768);
    checkSize();
    window.addEventListener("resize", checkSize);
    return () => window.removeEventListener("resize", checkSize);
  }, []);

  useEffect(() => {
    if (!searchText.trim()) {
      setSuggestions([]);
      return;
    }

    // Don't fetch if location was just selected
    if (locationJustSelectedRef.current) {
      locationJustSelectedRef.current = false;
      return;
    }

    const delayDebounce = setTimeout(async () => {
      const url = `http://localhost:8000/geocode/autocomplete?text=${encodeURIComponent(
        searchText
      )}`;
      const res = await fetch(url);
      const data = await res.json();
      setSuggestions(data.features || []);
      setHighlightedIndex(-1);
    }, 300);

    return () => clearTimeout(delayDebounce);
  }, [searchText]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        searchContainerRef.current &&
        !searchContainerRef.current.contains(event.target as Node)
      ) {
        setSuggestions([]);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    function handleClickOutsideTimeDropdown(event: MouseEvent) {
      if (
        timeOfDayRef.current &&
        !timeOfDayRef.current.contains(event.target as Node)
      ) {
        setShowTimeOfDayDropdown(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutsideTimeDropdown);
    return () =>
      document.removeEventListener("mousedown", handleClickOutsideTimeDropdown);
  }, []);

  useEffect(() => {
    function handleClickOutsideMapStyle(event: MouseEvent) {
      if (
        mapStyleRef.current &&
        !mapStyleRef.current.contains(event.target as Node)
      ) {
        setShowMapStyleDropdown(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutsideMapStyle);
    return () =>
      document.removeEventListener("mousedown", handleClickOutsideMapStyle);
  }, []);

  // Trigger map resize when chat expands/collapses
  useEffect(() => {
    if (mapRef.current?.getMap) {
      const map = mapRef.current.getMap();
      // Wait for transition to complete before resizing
      const timer = setTimeout(() => {
        map?.resize();
      }, 300); // Match the transition duration
      return () => clearTimeout(timer);
    }
  }, [isChatExpanded]);

  const handleSuggestionSelect = (place: any) => {
    locationJustSelectedRef.current = true;
    setSearchText(place.properties.formatted);
    setSuggestions([]);
    const { lat, lon } = place.properties;
    mapRef.current?.flyTo({ center: [lon, lat], zoom: 14 });
    mapRef.current?.addLocationMarker(lon, lat);
  };

  const handleZoom = (increment: number) => {
    const currentZoom = mapRef.current?.getZoom();
    mapRef.current?.flyTo({ zoom: currentZoom + increment });
  };

  const switchTo2D = () => {
    if (selectedMapStyle === "Default (Custom Mapbox Standard)") return;
    mapRef.current?.switchTo2D?.(selectedMapStyle);
    setViewMode("2d");

    // Restore aspect ratio shape after view switch
    if (savedAspectRatioShapeRef.current) {
      setTimeout(() => {
        restoreAspectRatioShape();
      }, 500);
    }
  };

  const switchTo3D = () => {
    if (selectedMapStyle === "Streets (Mapbox)") return;
    setViewMode("3d");
    handleTimeOfDayChange("Auto");
    // Use selectedMapStyle state - it should be updated by now if style was changed first
    mapRef.current?.switchTo3D?.(selectedMapStyle);

    // Restore aspect ratio shape after view switch
    if (savedAspectRatioShapeRef.current) {
      setTimeout(() => {
        restoreAspectRatioShape();
      }, 500);
    }
  };

  // Helper function to restore the aspect ratio shape
  const restoreAspectRatioShape = () => {
    const map = mapRef.current?.getMap();
    if (!map || !savedAspectRatioShapeRef.current) return;

    // Wait for map to be ready
    if (!map.isStyleLoaded()) {
      setTimeout(restoreAspectRatioShape, 100);
      return;
    }

    // Remove existing layers/source if they exist
    if (map.getLayer("drawn-box-layer")) {
      map.removeLayer("drawn-box-layer");
    }
    if (map.getLayer("drawn-box-outline")) {
      map.removeLayer("drawn-box-outline");
    }
    if (map.getSource("drawn-box")) {
      map.removeSource("drawn-box");
    }

    // Re-add the shape
    map.addSource("drawn-box", {
      type: "geojson",
      data: savedAspectRatioShapeRef.current,
    });

    map.addLayer({
      id: "drawn-box-layer",
      type: "fill",
      source: "drawn-box",
      paint: {
        "fill-color": "#9699FF",
        "fill-opacity": 0.15,
      },
    });

    map.addLayer({
      id: "drawn-box-outline",
      type: "line",
      source: "drawn-box",
      paint: {
        "line-color": "#9699FF",
        "line-width": 2,
      },
    });
  };

  useEffect(() => {
    const bootDefault3D = async () => {
      let tries = 0;
      while (!mapRef.current?.switchTo3D && tries < 40) {
        await new Promise((r) => setTimeout(r, 150));
        tries++;
      }
      if (mapRef.current?.switchTo3D) {
        mapRef.current.switchTo3D("Default (Custom Mapbox Standard)");
      }
      // Lighting needs Mapbox Standard style + terrain from switchTo3D’s style.load
      window.setTimeout(() => {
        handleTimeOfDayChange("Auto");
      }, 1600);
    };

    bootDefault3D();
  }, []);

  useEffect(() => {
    if (viewMode === "3d") {
      handleTimeOfDayChange("Auto");
    }
  }, [viewMode]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setHighlightedIndex((prev) => Math.min(prev + 1, suggestions.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setHighlightedIndex((prev) => Math.max(prev - 1, 0));
    } else if (e.key === "Enter" && highlightedIndex >= 0) {
      handleSuggestionSelect(suggestions[highlightedIndex]);
    }
  };

  useEffect(() => {
    const container = suggestionsRef.current;
    const item = container?.children[highlightedIndex] as HTMLElement;
    if (item && container) {
      item.scrollIntoView({ block: "nearest" });
    }
  }, [highlightedIndex]);

  useEffect(() => {
    return () => {
      if (autoLightingInterval) {
        clearInterval(autoLightingInterval);
      }
    };
  }, [autoLightingInterval]);

  const handleMapStyleChange = (label: string) => {
    const map = mapRef.current;
    console.log("handleMapStyleChange called with:", label);
    console.log("Map ref exists:", !!map);
    if (!map) {
      console.log("Map ref is null, cannot change style");
      return;
    }

    setSelectedMapStyle(label);
    setShowMapStyleDropdown(false);

    const disableLightingPresets = [
      "Outdoors (Mapbox)",
      "Light (Mapbox)",
      "Dark (Mapbox)",
      "Navigation Day (Mapbox)",
      "Navigation Night (Mapbox)",
    ];

    // Streets is 2D-only (no 3D / no time-of-day lighting on this basemap)
    if (label === "Streets (Mapbox)") {
      setViewMode("2d");
      setSelectedTimeOfDay(null);
      setShowTimeOfDayDropdown(false);
      setShow3DControls(true);
      map.switchTo2D?.(label);
      map.setMapStyle("mapbox://styles/mapbox/streets-v12");
      if (savedAspectRatioShapeRef.current) {
        setTimeout(() => {
          restoreAspectRatioShape();
        }, 500);
      }
      return;
    }

    // Custom Mapbox Standard is 3D-only — pick it from 2D by switching to 3D
    if (label === "Default (Custom Mapbox Standard)" && viewMode === "2d") {
      setShow3DControls(true);
      setSelectedTimeOfDay("Auto");
      setShowTimeOfDayDropdown(true);
      setViewMode("3d");
      map.switchTo3D?.(label);
      window.setTimeout(() => handleTimeOfDayChange("Auto"), 0);
      if (savedAspectRatioShapeRef.current) {
        setTimeout(() => {
          restoreAspectRatioShape();
        }, 500);
      }
      return;
    }

    const supportsLighting = !disableLightingPresets.includes(label);

    if (!supportsLighting) {
      // Force to 2D and hide time-of-day & 3D controls
      setSelectedTimeOfDay(null);
      setShowTimeOfDayDropdown(false);
      setShow3DControls(false);
      setViewMode("2d");
      map.switchTo2D?.();
    } else {
      // Enable 3D controls
      setShow3DControls(true);
      setSelectedTimeOfDay("Auto"); // Update state so the dropdown shows "Auto"
      setShowTimeOfDayDropdown(true);

      // ⚠️ ACTUALLY TRIGGER TIME-OF-DAY CHANGE HERE
      if (viewMode === "3d") {
        handleTimeOfDayChange("Auto");
      }
    }

    // ✅ Apply the correct Mapbox style
    let styleUrl = "";
    switch (label) {
      case "Streets (Mapbox)":
        styleUrl = "mapbox://styles/mapbox/streets-v12";
        break;
      case "Default (Custom Mapbox Standard)":
        styleUrl = MAPBOX_CUSTOM_STANDARD_STYLE_URL;
        break;
      case "Satellite (Mapbox)":
        styleUrl = "mapbox://styles/mapbox/standard-satellite";
        break;
      case "Outdoors (Mapbox)":
        styleUrl = "mapbox://styles/mapbox/outdoors-v12";
        break;
      case "Light (Mapbox)":
        styleUrl = "mapbox://styles/mapbox/light-v11";
        break;
      case "Dark (Mapbox)":
        styleUrl = "mapbox://styles/mapbox/dark-v11";
        break;
      case "Navigation Day (Mapbox)":
        styleUrl = "mapbox://styles/mapbox/navigation-day-v1";
        break;
      case "Navigation Night (Mapbox)":
        styleUrl = "mapbox://styles/mapbox/navigation-night-v1";
        break;
    }

    if (styleUrl) {
      console.log("Applying map style:", styleUrl);
      map.setMapStyle(styleUrl);
    } else {
      console.log("No matching style found for label:", label);
    }
    // Restore aspect ratio shape after style change
    if (savedAspectRatioShapeRef.current) {
      setTimeout(() => {
        restoreAspectRatioShape();
      }, 500);
    }
  };

  const handleTimeOfDayChange = useCallback(
    (label: string) => {
      if (autoLightingInterval) {
        clearInterval(autoLightingInterval);
        setAutoLightingInterval(null);
      }

      setSelectedTimeOfDay(label);
      setShowTimeOfDayDropdown(false);

      if (!mapRef.current) return;

      let preset: "dawn" | "day" | "dusk" | "night" | null = null;

      switch (label) {
        case "Morning":
          preset = "dawn";
          break;
        case "Daytime":
          preset = "day";
          break;
        case "Evening":
          preset = "dusk";
          break;
        case "Nighttime":
          preset = "night";
          break;
        case "Auto":
          autoLightSync();
          const interval = setInterval(autoLightSync, 5000);
          setAutoLightingInterval(interval);
          break;
      }

      if (preset && mapRef.current.setLightPreset) {
        mapRef.current.setLightPreset(preset);
      }
    },
    [autoLightingInterval]
  );

  const autoLightSync = (): "dawn" | "day" | "dusk" | "night" => {
    const now = new Date();
    const hour = now.getHours();

    let preset: "dawn" | "day" | "dusk" | "night";

    if (hour >= 5 && hour < 8) {
      // 5 – 7:59 AM
      preset = "dawn";
    } else if (hour >= 8 && hour < 17) {
      // 8 AM – 4:59 PM
      preset = "day";
    } else if (hour >= 17 && hour < 19) {
      // 5 – 6:59 PM
      preset = "dusk";
    } else {
      // 7 PM – 4:59 AM
      preset = "night";
    }

    if (mapRef.current?.setLightPreset) {
      mapRef.current.setLightPreset(preset);
    }

    return preset;
  };

  // Earthquake control functions
  const enableEarthquakeHazard = () => {
    setEarthquakeEnabled(true);
  };

  const disableEarthquakeHazard = () => {
    console.log("Disabling earthquake hazard from agent");
    setEarthquakeEnabled(false);
    // Clear any existing interval
    if (earthquakeIntervalRef.current) {
      clearInterval(earthquakeIntervalRef.current);
      earthquakeIntervalRef.current = null;
    }
    // Also clear earthquake data from map immediately
    if (mapRef.current?.drawEarthquakeDots) {
      mapRef.current.drawEarthquakeDots([]);
    }
  };

  const isEarthquakeEnabled = () => {
    return earthquakeEnabled;
  };

  // Volcano list control functions
  const enableVolcanoList = () => {
    setVolcanoListEnabled(true);
  };

  const disableVolcanoList = () => {
    console.log("Disabling volcano list from agent");
    setVolcanoListEnabled(false);
    // Clear volcano data from map immediately
    if (mapRef.current?.drawVolcanoDots) {
      mapRef.current.drawVolcanoDots([]);
    }
  };

  const isVolcanoListEnabled = () => {
    return volcanoListEnabled;
  };

  // Active faults control functions
  const enableActiveFaults = () => {
    setActiveFaultsEnabled(true);
  };

  const disableActiveFaults = () => {
    console.log("Disabling active faults from agent");
    setActiveFaultsEnabled(false);

    // Clear active faults data from map immediately
    if (mapRef.current?.drawActiveFaults) {
      mapRef.current.drawActiveFaults(null);
    }
  };

  const isActiveFaultsEnabled = () => {
    return activeFaultsEnabled;
  };

  // Add shared refs to manage congestion state across UI and AI
  const congestionSharedRefs = useRef({
    intervalId: null as NodeJS.Timeout | null,
    timerId: null as number | null,
    boundsCallback: null as
      | ((bbox: [number, number, number, number]) => void)
      | null,
  });

  // Congestion control functions
  const enableCongestion = async () => {
    console.log("UI: Enabling congestion");
    setCongestionEnabled(true);

    // Set up the fetch and draw function (same logic as in the AI agent)
    const fetchAndDrawCongestion = async () => {
      const currentBbox = mapRef.current?.getBounds?.();
      if (!currentBbox) return;

      try {
        const key = process.env.NEXT_PUBLIC_TOMTOM_API_KEY;
        if (!key) return;

        const limitBBoxToMaxArea = (
          bbox: [number, number, number, number],
          maxKm2 = 10000
        ): [number, number, number, number] => {
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
          if (areaKm2 <= maxKm2) return [minLon, minLat, maxLon, maxLat];
          const scale = Math.sqrt(maxKm2 / areaKm2);
          const newHalfWidthDeg = halfWidthDeg * scale;
          const newHalfHeightDeg = halfHeightDeg * scale;
          let newMinLon = Math.max(
            -180,
            Math.min(180, centerLon - newHalfWidthDeg)
          );
          let newMaxLon = Math.max(
            -180,
            Math.min(180, centerLon + newHalfWidthDeg)
          );
          let newMinLat = Math.max(
            -90,
            Math.min(90, centerLat - newHalfHeightDeg)
          );
          let newMaxLat = Math.max(
            -90,
            Math.min(90, centerLat + newHalfHeightDeg)
          );
          return [newMinLon, newMinLat, newMaxLon, newMaxLat];
        };

        const clamped = limitBBoxToMaxArea(currentBbox, 10000);
        const bboxStr = clamped.join(",");
        const fieldsRaw =
          "{incidents{type,geometry{type,coordinates},properties{iconCategory,startTime,endTime,from,to,length,events{description,code,iconCategory}}}}";
        const fields = encodeURIComponent(fieldsRaw);
        const url = `https://api.tomtom.com/traffic/services/5/incidentDetails?key=${key}&bbox=${bboxStr}&fields=${fields}&language=en-GB`;

        const res = await fetch(url);
        if (!res.ok) return;
        const data = await res.json();

        const incidents = (data.incidents || []).filter((inc: any) => {
          const ic = inc.properties?.iconCategory ?? inc.ic ?? null;
          return Number(ic) === 6;
        });

        const mapCongestionSeverity = (desc: string): number => {
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
        };

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

        mapRef.current?.drawCongestion?.({
          type: "FeatureCollection",
          features,
        });
      } catch (err) {
        console.error("fetchTomTomCongestion error", err);
      }
    };

    // Initial draw
    await fetchAndDrawCongestion();

    // BEFORE: Could register multiple intervals without proper cleanup
    // AFTER: Always clear existing interval before setting new one
    if (congestionSharedRefs.current.intervalId) {
      clearInterval(congestionSharedRefs.current.intervalId);
      congestionSharedRefs.current.intervalId = null;
    }
    congestionSharedRefs.current.intervalId = setInterval(
      fetchAndDrawCongestion,
      60_000
    );

    // Set up bounds listener for map movement using shared ref
    const congestionCallback = (newBbox: [number, number, number, number]) => {
      if (congestionSharedRefs.current.timerId) {
        window.clearTimeout(congestionSharedRefs.current.timerId);
      }
      congestionSharedRefs.current.timerId = window.setTimeout(async () => {
        await fetchAndDrawCongestion();
      }, 350) as unknown as number;
    };

    // BEFORE: Could register multiple bounds listeners without proper cleanup
    // AFTER: Always unregister existing callback before registering new one
    if (congestionSharedRefs.current.boundsCallback) {
      console.log(
        "UI: Removing existing bounds listener before adding new one"
      );
      mapRef.current?.unregisterBoundsListener?.(
        congestionSharedRefs.current.boundsCallback
      );
    }

    // Register bounds listener using shared ref
    congestionSharedRefs.current.boundsCallback = congestionCallback;
    mapRef.current?.registerBoundsListener?.(congestionCallback);

    console.log("UI: Congestion enabled with bounds listener registered");
  };

  // BEFORE: disableCongestion had incomplete cleanup that left listeners active
  // AFTER: Comprehensive cleanup that removes all listeners and clears all timers
  const disableCongestion = () => {
    console.log("UI: Disabling congestion from agent/UI");
    console.log("UI: Shared refs before cleanup:", {
      intervalId: congestionSharedRefs.current.intervalId,
      timerId: congestionSharedRefs.current.timerId,
      boundsCallback: congestionSharedRefs.current.boundsCallback,
    });

    // Set state to disabled FIRST
    setCongestionEnabled(false);

    // BEFORE: Bounds listener cleanup was not guaranteed to work
    // AFTER: More robust bounds listener cleanup with verification
    if (congestionSharedRefs.current.boundsCallback) {
      console.log("UI: Removing bounds listener...");
      const removed = mapRef.current?.unregisterBoundsListener?.(
        congestionSharedRefs.current.boundsCallback
      );
      console.log("UI: Bounds listener removal result:", removed);
      congestionSharedRefs.current.boundsCallback = null;
    }

    // Stop shared polling interval
    if (congestionSharedRefs.current.intervalId) {
      console.log(
        "UI: Clearing interval:",
        congestionSharedRefs.current.intervalId
      );
      clearInterval(congestionSharedRefs.current.intervalId);
      congestionSharedRefs.current.intervalId = null;
    }

    // Clear shared timer
    if (congestionSharedRefs.current.timerId) {
      console.log("UI: Clearing timer:", congestionSharedRefs.current.timerId);
      window.clearTimeout(congestionSharedRefs.current.timerId);
      congestionSharedRefs.current.timerId = null;
    }

    // Clear congestion data from map
    if (mapRef.current?.drawCongestion) {
      mapRef.current.drawCongestion({
        type: "FeatureCollection",
        features: [],
      });
    }

    // Clear markers if available
    if (mapRef.current?.congestionMarkersRef) {
      mapRef.current.congestionMarkersRef.current.forEach((m: any) =>
        m.remove()
      );
      mapRef.current.congestionMarkersRef.current = [];
    }

    console.log("UI: Shared refs after cleanup:", {
      intervalId: congestionSharedRefs.current.intervalId,
      timerId: congestionSharedRefs.current.timerId,
      boundsCallback: congestionSharedRefs.current.boundsCallback,
    });
  };

  const isCongestionEnabled = () => {
    return congestionEnabled;
  };

  const stopCongestionPolling = () => {
    if (congestionSharedRefs.current.intervalId) {
      clearInterval(congestionSharedRefs.current.intervalId);
      congestionSharedRefs.current.intervalId = null;
    }
  };

  const getCongestionSharedRefs = () => {
    return congestionSharedRefs.current;
  };

  const buildFullSnapshot = useCallback((): FullUndoSnapshot => {
    const ui = latestUiForUndoRef.current;
    if (!ui) {
      throw new Error("Undo: UI snapshot ref not ready");
    }
    const uiClone = JSON.parse(JSON.stringify(ui)) as UiUndoSnapshot;
    uiClone.pathfinder =
      pathfinderRef.current?.getUndoSnapshot?.() ??
      EMPTY_PATHFINDER_UNDO_SNAPSHOT;
    return {
      ui: uiClone,
      map: mapRef.current?.captureUndoState?.(ui.uploadedFiles) ?? null,
    };
  }, []);

  const pushHistoryNow = useCallback(() => {
    if (isApplyingHistoryRef.current) return;
    try {
      const s = buildFullSnapshot();
      undoPastRef.current.push(s);
      undoFutureRef.current = [];
      while (undoPastRef.current.length > 40) undoPastRef.current.shift();
      historyBaselineRef.current = null;
      bumpHistoryUi();
    } catch {
      /* map may not be ready yet */
    }
  }, [buildFullSnapshot]);

  /** Commit prior baseline to the undo stack, then save the current state as the new baseline. */
  const flushUndoHistoryCheckpoint = useCallback(() => {
    if (isApplyingHistoryRef.current) return;
    if (Date.now() < undoSuppressMoveUntilRef.current) return;
    try {
      const now = buildFullSnapshot();
      if (historyBaselineRef.current !== null) {
        undoPastRef.current.push(historyBaselineRef.current);
        undoFutureRef.current = [];
        while (undoPastRef.current.length > 40) undoPastRef.current.shift();
        bumpHistoryUi();
      }
      historyBaselineRef.current = now;
    } catch {
      /* map not ready */
    }
  }, [buildFullSnapshot]);

  const scheduleDebouncedHistory = useCallback(() => {
    if (isApplyingHistoryRef.current) return;
    if (historyDebounceRef.current) clearTimeout(historyDebounceRef.current);
    historyDebounceRef.current = setTimeout(() => {
      historyDebounceRef.current = null;
      flushUndoHistoryCheckpoint();
    }, 500);
  }, [flushUndoHistoryCheckpoint]);

  const onUserMapTransformForUndo = useCallback(() => {
    if (isApplyingHistoryRef.current) return;
    if (Date.now() < undoSuppressMoveUntilRef.current) return;
    scheduleDebouncedHistory();
  }, [scheduleDebouncedHistory]);

  const onPathfinderUndoSchedule = useCallback(() => {
    if (suppressPathfinderUndoScheduleRef.current) return;
    scheduleDebouncedHistory();
  }, [scheduleDebouncedHistory]);

  const applyFullSnapshotRef = useRef<
    (full: FullUndoSnapshot) => Promise<void>
  >(async () => {});

  const applyFullSnapshot = async (full: FullUndoSnapshot) => {
    try {
      const { ui, map: mapSnap } = full;
      const shell = panelShellPreserveRef.current;
      flushSync(() => {
        setSearchText(ui.searchText);
        setSuggestions(ui.suggestions ?? []);
        setHighlightedIndex(ui.highlightedIndex ?? -1);
        setViewMode(ui.viewMode);
        // Keep which panels/windows are open — do not restore from history (matches reset behavior).
        setShowSelectMaps(shell.showSelectMaps);
        setShowPathfinder(shell.showPathfinder);
        setShowPlanningTools(shell.showPlanningTools);
        setShowTimeOfDayDropdown(shell.showTimeOfDayDropdown);
        setShowMapStyleDropdown(shell.showMapStyleDropdown);
        setSelectedTimeOfDay(ui.selectedTimeOfDay);
        setShow3DControls(ui.show3DControls);
        setShowLiveHazardMonitor(shell.showLiveHazardMonitor);
        setLiveEarthquakeEnabled(ui.liveEarthquakeEnabled);
        setLiveWeatherEnabled(ui.liveWeatherEnabled);
        setSelectedEarthquakeSources(ui.selectedEarthquakeSources ?? []);
        setSelectedWeatherSources(ui.selectedWeatherSources ?? []);
        setShowToolPanel(shell.showToolPanel);
        setSelectedMaps(ui.selectedMaps ?? []);
        setShowAffectedAreas(ui.showAffectedAreas);
        setAffectedAreasData(ui.affectedAreasData);
        setExpandedPanels(shell.expandedPanels ?? {});
        setGeologicalExpanded(shell.geologicalExpanded);
        setTrafficExpanded(shell.trafficExpanded);
        setSelectedPlanningTools(ui.selectedPlanningTools ?? []);
        setSelectedPlan(ui.selectedPlan);
        setShowAssessmentTools(shell.showAssessmentTools);
        setSelectedAssessmentTools(mergeAssessmentToolsForUndo(ui));
        setUploadedFiles(ui.uploadedFiles ?? []);
        setIsBoundaryLoading(ui.isBoundaryLoading);
        setBoundaryLoadingStage(ui.boundaryLoadingStage ?? "");
        setIsFileLoading(ui.isFileLoading);
        setFileLoadingStage(ui.fileLoadingStage ?? "");
        setShowAspectRatioSelector(ui.showAspectRatioSelector);
        setSelectedAspectRatio(ui.selectedAspectRatio ?? "");
        setTempAspectRatio(ui.tempAspectRatio ?? "");
        setIsDrawingAspectRatio(ui.isDrawingAspectRatio);
        setAspectRatioShapeDrawn(ui.aspectRatioShapeDrawn);
        setIsDrawingBox(ui.isDrawingBox);
        setIsDrawingRectangle(ui.isDrawingRectangle);
        setShapeDrawn(ui.shapeDrawn);
        setScopeConfirmed(ui.scopeConfirmed);
        setShowExposureResults(shell.showExposureResults);
        setExposureResultsData(ui.exposureResultsData ?? null);
        setIsAnalysisRunning(ui.isAnalysisRunning);
        setExposureResultsMinimized(shell.exposureResultsMinimized);
        setExposureResultsPosition(
          shell.exposureResultsPosition ?? { x: 0, y: 0 }
        );
        setIsDraggingResults(shell.isDraggingResults);
        setSelectedMapStyle(ui.selectedMapStyle);
        setEarthquakeEnabled(ui.earthquakeEnabled);
        setVolcanoListEnabled(ui.volcanoListEnabled);
        setActiveFaultsEnabled(ui.activeFaultsEnabled);
        setCongestionEnabled(ui.congestionEnabled);
      });
      savedAspectRatioShapeRef.current = ui.savedAspectRatioShape
        ? (JSON.parse(
            JSON.stringify(ui.savedAspectRatioShape)
          ) as GeoJSON.FeatureCollection)
        : null;

      const map = mapRef.current?.getMap?.();
      if (map && mapSnap && mapRef.current?.restoreUndoMapsLayers) {
        mapRef.current.setIs3DModeForUndo?.(ui.viewMode === "3d");
        const styleUrl = getMapboxStyleUrlForUndo(
          ui.selectedMapStyle,
          ui.viewMode
        );

        /**
         * Mapbox often does NOT fire `style.load` when setStyle URL is unchanged
         * (e.g. undo only restores camera). Without a fallback, restore never runs.
         */
        let restoreStarted = false;
        const runRestore = async () => {
          if (restoreStarted) return;
          restoreStarted = true;
          await mapRef.current!.restoreUndoMapsLayers!(mapSnap, ui.viewMode);
        };

        await new Promise<void>((resolve, reject) => {
          const onStyleLoad = () => {
            clearTimeout(fallbackTimer);
            map.off("style.load", onStyleLoad);
            runRestore().then(resolve).catch(reject);
          };

          const fallbackTimer = window.setTimeout(() => {
            map.off("style.load", onStyleLoad);
            runRestore().then(resolve).catch(reject);
          }, 300);

          map.once("style.load", onStyleLoad);
          try {
            map.setStyle(styleUrl);
          } catch (e) {
            clearTimeout(fallbackTimer);
            map.off("style.load", onStyleLoad);
            reject(e);
          }
        });
      } else if (mapSnap && mapRef.current?.restoreUndoMapsLayers) {
        mapRef.current.setIs3DModeForUndo?.(ui.viewMode === "3d");
        await mapRef.current.restoreUndoMapsLayers(mapSnap, ui.viewMode);
      }

      queueMicrotask(() => {
        if (ui.congestionEnabled) void enableCongestion();
        else disableCongestion();
      });

      window.setTimeout(() => {
        suppressPathfinderUndoScheduleRef.current = true;
        pathfinderRef.current?.applyUndoSnapshot?.(
          ui.pathfinder ?? EMPTY_PATHFINDER_UNDO_SNAPSHOT
        );
        window.setTimeout(() => {
          suppressPathfinderUndoScheduleRef.current = false;
        }, 200);
      }, 0);
    } finally {
      historyBaselineRef.current = null;
      undoSuppressMoveUntilRef.current = Date.now() + 1400;
      bumpHistoryUi();
    }
  };

  applyFullSnapshotRef.current = applyFullSnapshot;

  const handleUndo = useCallback(async () => {
    if (isApplyingHistoryRef.current) return;
    if (undoPastRef.current.length < 1) return;
    let current: FullUndoSnapshot;
    try {
      current = buildFullSnapshot();
    } catch {
      return;
    }
    const prev = undoPastRef.current.pop()!;
    undoFutureRef.current.push(current);
    bumpHistoryUi();

    setHistoryNavBusy(true);
    isApplyingHistoryRef.current = true;
    try {
      await applyFullSnapshotRef.current(prev);
    } catch (e) {
      console.error("Undo failed:", e);
      undoPastRef.current.push(prev);
      undoFutureRef.current.pop();
      bumpHistoryUi();
    } finally {
      isApplyingHistoryRef.current = false;
      setHistoryNavBusy(false);
      bumpHistoryUi();
    }
  }, [buildFullSnapshot]);

  const handleRedo = useCallback(async () => {
    if (isApplyingHistoryRef.current) return;
    if (undoFutureRef.current.length < 1) return;
    let current: FullUndoSnapshot;
    try {
      current = buildFullSnapshot();
    } catch {
      return;
    }
    const next = undoFutureRef.current.pop()!;
    undoPastRef.current.push(current);
    bumpHistoryUi();

    setHistoryNavBusy(true);
    isApplyingHistoryRef.current = true;
    try {
      await applyFullSnapshotRef.current(next);
    } catch (e) {
      console.error("Redo failed:", e);
      undoFutureRef.current.push(next);
      undoPastRef.current.pop();
      bumpHistoryUi();
    } finally {
      isApplyingHistoryRef.current = false;
      setHistoryNavBusy(false);
      bumpHistoryUi();
    }
  }, [buildFullSnapshot]);

  useEffect(() => {
    if (isApplyingHistoryRef.current) return;
    scheduleDebouncedHistory();
  }, [
    uploadedFiles,
    viewMode,
    selectedMapStyle,
    affectedAreasData,
    // Panel open/close (showPathfinder, showToolPanel, etc.) intentionally omitted —
    // opening/closing UIs does not create undo steps or change on undo/redo.
    showAffectedAreas,
    earthquakeEnabled,
    volcanoListEnabled,
    activeFaultsEnabled,
    congestionEnabled,
    selectedMaps,
    isBoundaryLoading,
    liveEarthquakeEnabled,
    liveWeatherEnabled,
    selectedEarthquakeSources,
    selectedWeatherSources,
    searchText,
    highlightedIndex,
    isDrawingBox,
    isDrawingRectangle,
    isDrawingAspectRatio,
    shapeDrawn,
    scopeConfirmed,
    showAspectRatioSelector,
    aspectRatioShapeDrawn,
    scheduleDebouncedHistory,
  ]);

  const canUndo =
    undoPastRef.current.length > 0 && !historyNavBusy;
  const canRedo =
    undoFutureRef.current.length > 0 && !historyNavBusy;

  /** Basemaps that only support one view mode hide the 2D/3D control. */
  const showViewModeToggle = useMemo(
    () =>
      show3DControls &&
      selectedMapStyle !== "Default (Custom Mapbox Standard)" &&
      selectedMapStyle !== "Streets (Mapbox)",
    [show3DControls, selectedMapStyle]
  );

  /**
   * Map reset: clears drawn content, restores the same default as a fresh session
   * (Custom Mapbox Standard + 3D + Auto lighting), and turns off map-linked toggles.
   * Keeps panels open (Live Hazard Monitor, tool panel, Atlas chat, etc.).
   */
  const performGlobalReset = () => {
    if (typeof window !== "undefined" && window.speechSynthesis) {
      window.speechSynthesis.cancel();
    }
    pushHistoryNow();

    const map = mapRef.current?.getMap?.();
    if (map) {
      uploadedFiles.forEach((f) => {
        const safeName = f.layerName.replace(/[^a-zA-Z0-9_-]/g, "");
        const sourceId = `upload-${safeName}`;
        const baseId = `${sourceId}-layer`;
        ["fill", "line", "circle"].forEach((type) => {
          const layerId = `${baseId}-${type}`;
          if (map.getLayer(layerId)) map.removeLayer(layerId);
        });
        if (map.getSource(sourceId)) map.removeSource(sourceId);
      });
      if (map.getLayer("drawn-box-layer")) map.removeLayer("drawn-box-layer");
      if (map.getLayer("drawn-box-outline")) map.removeLayer("drawn-box-outline");
      if (map.getSource("drawn-box")) map.removeSource("drawn-box");
    }
    setUploadedFiles([]);

    centerRightControlsRef.current?.clearBoundaries();
    mapRef.current?.removeBoundaryLayer?.();
    mapRef.current?.clearRoutes?.();
    mapRef.current?.clearStartMarker?.();
    mapRef.current?.clearDestinationMarker?.();
    mapRef.current?.clearLocationMarker?.();
    mapRef.current?.clearFloodHazard?.();
    mapRef.current?.clearAffectedAreas?.();
    mapRef.current?.clearIncidentSegments?.();
    mapRef.current?.clearHealthFacilities?.();
    mapRef.current?.clearEmergencyShelters?.();
    mapRef.current?.clearFireStations?.();
    mapRef.current?.clearPoliceStations?.();
    mapRef.current?.clearWeatherMarkers?.();
    mapRef.current?.drawRoadClosures?.({
      type: "FeatureCollection",
      features: [],
    });
    mapRef.current?.drawLaneClosures?.({
      type: "FeatureCollection",
      features: [],
    });
    mapRef.current?.drawRoadObstructions?.({
      type: "FeatureCollection",
      features: [],
    });
    mapRef.current?.clearAllResources?.();

    // Clear hazard / traffic visuals (disable* below also clears + stops polling).
    mapRef.current?.drawEarthquakeDots?.([]);
    mapRef.current?.drawVolcanoDots?.([]);
    mapRef.current?.drawActiveFaults?.(null);
    if (mapRef.current?.drawCongestion) {
      mapRef.current.drawCongestion({
        type: "FeatureCollection",
        features: [],
      });
    }
    if (mapRef.current?.congestionMarkersRef) {
      mapRef.current.congestionMarkersRef.current.forEach((m: any) =>
        m.remove()
      );
      mapRef.current.congestionMarkersRef.current = [];
    }

    savedAspectRatioShapeRef.current = null;

    // Stop layer / traffic polling and sync Layers panel toggles with empty map.
    disableCongestion();
    disableEarthquakeHazard();
    disableVolcanoList();
    disableActiveFaults();

    pathfinderRef.current?.resetMapLinkedUi?.();
    exposureAssessmentRef.current?.clearSteps?.();
    locationJustSelectedRef.current = false;

    if (autoLightingInterval) {
      clearInterval(autoLightingInterval);
      setAutoLightingInterval(null);
    }

    // Basemap + view + map-linked UI (panels stay open) — match initial app defaults.
    flushSync(() => {
      setViewMode("3d");
      setSelectedMapStyle("Default (Custom Mapbox Standard)");
      setShowMapStyleDropdown(false);
      setShow3DControls(true);
      setSelectedTimeOfDay("Auto");
      setShowTimeOfDayDropdown(false);
      setLiveEarthquakeEnabled(false);
      setLiveWeatherEnabled(false);
      setSelectedEarthquakeSources([]);
      setSelectedWeatherSources([]);
      setSelectedMaps([]);
      setShowAffectedAreas(false);
      setAffectedAreasData(null);
      setSearchText("");
      setSuggestions([]);
      setHighlightedIndex(-1);
      setIsDrawingBox(false);
      setIsDrawingRectangle(false);
      setIsDrawingAspectRatio(false);
      setShapeDrawn(false);
      setScopeConfirmed(false);
      setShowAspectRatioSelector(false);
      setAspectRatioShapeDrawn(false);
      setTempAspectRatio("");
      setSelectedAspectRatio("");
      setIsBoundaryLoading(false);
      setBoundaryLoadingStage("");
      setIsFileLoading(false);
      setFileLoadingStage("");
    });
    mapRef.current?.setIs3DModeForUndo?.(true);
    const defaultStyleUrl = getMapboxStyleUrlForUndo(
      "Default (Custom Mapbox Standard)",
      "3d"
    );
    if (mapRef.current?.setMapStyle) {
      mapRef.current.setMapStyle(defaultStyleUrl);
    }

    historyBaselineRef.current = null;
    undoSuppressMoveUntilRef.current = Date.now() + 2000;

    setTimeout(() => {
      mapRef.current?.flyTo?.({
        center: [0, 0],
        zoom: 1.8,
        pitch: DEFAULT_STANDARD_3D_PITCH,
        bearing: DEFAULT_STANDARD_3D_BEARING,
        duration: 1200,
      });
    }, 800);

    window.setTimeout(() => {
      handleTimeOfDayChange("Auto");
    }, 1600);
  };

  const openResetConfirmModal = () => setShowResetConfirmModal(true);

  const handleStartExposureAnalysis = () => {
    console.log("Main-UI-Layout: Starting exposure analysis");

    // Capture start time
    const startTime = new Date().toLocaleString("en-US", {
      month: "2-digit",
      day: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: true,
    });

    setIsAnalysisRunning(true);
    setShowExposureResults(true);
    setExposureResultsMinimized(false); // Start expanded to show loading
    // Store initial data with start time
    setExposureResultsData({ startTime }); // NEW: Store start time immediately
    setAffectedAreasData(null);
    setShowAffectedAreas(false);
  };

  const handleAbortExposureAnalysis = () => {
    setIsAnalysisRunning(false);
    setShowExposureResults(false);
    setExposureResultsData(null);
    setExposureResultsPosition({ x: 0, y: 0 });
  };

  const handleRunExposureAnalysis = (
    data: any,
    affectedAreas?: GeoJSON.FeatureCollection
  ) => {
    console.log("Main-UI-Layout: Received analysis data:", data);
    setIsAnalysisRunning(false);
    setExposureResultsData(data);
    setExposureResultsMinimized(true);

    if (affectedAreas && affectedAreas.features.length > 0) {
      setAffectedAreasData(affectedAreas);
      setShowAffectedAreas(true);
      mapRef.current?.drawAffectedAreas?.(affectedAreas);

      // NEW: Auto-zoom to affected areas
      setTimeout(() => {
        mapRef.current?.fitBoundsToAffectedAreas?.(affectedAreas);
      }, 500);
    }
  };

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (isDraggingResults) {
        setExposureResultsPosition({
          x: e.clientX - dragStartPos.current.x,
          y: e.clientY - dragStartPos.current.y,
        });
      }
    };

    const handleMouseUp = () => {
      if (isDraggingResults) {
        setIsDraggingResults(false);
      }
    };

    if (isDraggingResults) {
      document.addEventListener("mousemove", handleMouseMove);
      document.addEventListener("mouseup", handleMouseUp);
    }

    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
    };
  }, [isDraggingResults]);

  const handleClearAffectedAreas = () => {
    console.log("Clearing affected areas from map");
    mapRef.current?.clearAffectedAreas?.();
    setShowAffectedAreas(false);
    setAffectedAreasData(null);
  };

  // Handle earthquake data fetching based on selected sources
  const liveEarthquakeIntervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    const fetchAndDisplayEarthquakes = async () => {
      if (selectedEarthquakeSources.length === 0) {
        // Clear earthquake markers if no sources selected
        mapRef.current?.drawEarthquakeDots?.([]);
        return;
      }

      // Import the earthquake data fetching function
      const { fetchMultipleEarthquakeSources } = await import(
        "./controls/Main/EarthquakeDataConfig"
      );

      // Fetch data from all selected sources
      const allFeatures = await fetchMultipleEarthquakeSources(
        selectedEarthquakeSources
      );

      // Draw all earthquake markers on the map
      console.log(
        `Drawing ${allFeatures.length} total earthquake markers on map`
      );
      if (allFeatures.length > 0) {
        mapRef.current?.drawEarthquakeDots?.(allFeatures);
      } else {
        // Clear markers if no data
        mapRef.current?.drawEarthquakeDots?.([]);
      }
    };

    // Initial fetch
    fetchAndDisplayEarthquakes();

    // Set up polling interval (every 60 seconds)
    if (selectedEarthquakeSources.length > 0) {
      liveEarthquakeIntervalRef.current = setInterval(
        fetchAndDisplayEarthquakes,
        60000
      );
    }

    // Cleanup
    return () => {
      if (liveEarthquakeIntervalRef.current) {
        clearInterval(liveEarthquakeIntervalRef.current);
        liveEarthquakeIntervalRef.current = null;
      }
    };
  }, [selectedEarthquakeSources]);

  // Handle weather data fetching based on selected sources
  const liveWeatherIntervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    const fetchAndDisplayWeather = async () => {
      if (selectedWeatherSources.length === 0) {
        // Clear weather markers if no sources selected
        const { clearWeatherMarkers } = await import(
          "./Map/Markers/Hazard Map/WeatherMarker"
        );
        clearWeatherMarkers();
        return;
      }

      // Import the weather data fetching function
      const { fetchMultipleWeatherSources } = await import(
        "./controls/Main/WeatherDataConfig"
      );

      // Fetch data from all selected sources
      const allWeatherData = await fetchMultipleWeatherSources(
        selectedWeatherSources
      );

      // Draw weather markers on the map
      console.log(
        `Drawing ${allWeatherData.length} total weather markers on map`
      );

      if (allWeatherData.length > 0) {
        const { drawWeatherMarkers } = await import(
          "./Map/Markers/Hazard Map/WeatherMarker"
        );

        const map = mapRef.current?.getMap();
        const mapIsLoaded = map?.isStyleLoaded() || false;

        if (map && mapIsLoaded) {
          drawWeatherMarkers(map, mapIsLoaded, allWeatherData);
        }
      } else {
        // Clear markers if no data
        const { clearWeatherMarkers } = await import(
          "./Map/Markers/Hazard Map/WeatherMarker"
        );
        clearWeatherMarkers();
      }
    };

    // Initial fetch
    fetchAndDisplayWeather();

    // Set up polling interval (every 30 minutes for weather updates)
    if (selectedWeatherSources.length > 0) {
      liveWeatherIntervalRef.current = setInterval(
        fetchAndDisplayWeather,
        1800000 // 30 minutes
      );
    }

    // Cleanup
    return () => {
      if (liveWeatherIntervalRef.current) {
        clearInterval(liveWeatherIntervalRef.current);
        liveWeatherIntervalRef.current = null;
      }
    };
  }, [selectedWeatherSources]);

  return (
    <div className="relative w-screen h-screen overflow-hidden flex m-0 p-0">
      {/* Blocking overlay when loading */}
      {(isBoundaryLoading || isFileLoading) && (
        <div
          className="absolute inset-0 z-[9999]"
          style={{
            cursor: "not-allowed",
            pointerEvents: "auto",
          }}
        />
      )}

      {!isDesktop ? (
        <div className="flex items-center justify-center w-screen h-screen bg-[#1a1a1a] text-white text-center px-4">
          <div className="max-w-sm text-lg">
            🚫 This app is best viewed on a desktop or laptop.
          </div>
        </div>
      ) : (
        <>
          {/* Map Container */}
          <div
            className={`transition-all duration-300 ${
              isChatExpanded ? "w-[calc(100vw-360px)]" : "w-screen"
            } h-screen relative overflow-hidden`}
          >
            <MapComponent
              ref={mapRef}
              onUserMapTransform={onUserMapTransformForUndo}
            />
          </div>
          {/* Center Top Controls - Hide when expanded */}
          {!isChatExpanded && (
            <CenterTopControls
              viewMode={viewMode}
              selectedTimeOfDay={selectedTimeOfDay}
              setShowTimeOfDayDropdown={setShowTimeOfDayDropdown}
              showTimeOfDayDropdown={showTimeOfDayDropdown}
              handleTimeOfDayChange={handleTimeOfDayChange}
              selectedMapStyle={selectedMapStyle}
              handleMapStyleChange={handleMapStyleChange}
              mapStyleRef={mapStyleRef}
              timeOfDayRef={timeOfDayRef}
              showMapStyleDropdown={showMapStyleDropdown}
              setShowMapStyleDropdown={setShowMapStyleDropdown}
            />
          )}
          {/* Center Left Controls - Hide when expanded */}
          {!isChatExpanded && (
            <CenterLeftControls
              showSelectMaps={showSelectMaps}
              setShowSelectMaps={setShowSelectMaps}
              showPathfinder={showPathfinder}
              setShowPathfinder={setShowPathfinder}
              showPlanningTools={showPlanningTools}
              setShowPlanningTools={setShowPlanningTools}
              showAssessmentTools={showAssessmentTools}
              setShowAssessmentTools={setShowAssessmentTools}
              showToolPanel={showToolPanel}
              setShowToolPanel={setShowToolPanel}
              selectedMaps={selectedMaps}
              selectedPlanningTools={selectedPlanningTools}
              selectedAssessmentTools={selectedAssessmentTools}
              showLiveHazardMonitor={showLiveHazardMonitor}
              setShowLiveHazardMonitor={setShowLiveHazardMonitor}
            />
          )}
          {/* Location Search Bar or Pathfinder Controls - Hide when expanded */}
          {!isChatExpanded &&
            (!showPathfinder ? (
              <LocationSearchBar
                searchText={searchText}
                setSearchText={setSearchText}
                suggestions={suggestions}
                setSuggestions={setSuggestions}
                highlightedIndex={highlightedIndex}
                handleKeyDown={handleKeyDown}
                handleSuggestionSelect={handleSuggestionSelect}
                searchContainerRef={searchContainerRef}
                inputRef={inputRef}
                suggestionsRef={suggestionsRef}
                clearSearch={() => {
                  // Clear the location marker from the map
                  mapRef.current?.clearLocationMarker?.();
                }}
              />
            ) : (
              <div className="absolute top-[15px] left-[70px] z-50 w-[280px]">
                <PathfinderControls
                  ref={pathfinderRef}
                  mapRef={mapRef}
                  onStateChangeForUndo={onPathfinderUndoSchedule}
                />
              </div>
            ))}
          {/* Panels - Hide when expanded */}
          {!isChatExpanded && showLiveHazardMonitor && (
            <div className="absolute left-[70px] top-[70px] w-[280px] z-40">
              <LiveHazardMonitor
                isVisible={true}
                earthquakeEnabled={liveEarthquakeEnabled}
                weatherEnabled={liveWeatherEnabled}
                onEarthquakeToggle={setLiveEarthquakeEnabled}
                onWeatherToggle={setLiveWeatherEnabled}
                onEarthquakeSourcesChange={setSelectedEarthquakeSources}
                onWeatherSourcesChange={setSelectedWeatherSources}
                initialSelectedEarthquakes={selectedEarthquakeSources}
                initialSelectedWeather={selectedWeatherSources}
              />
            </div>
          )}
          {!isChatExpanded && showSelectMaps && (
            <div className="absolute left-[70px] top-[70px] w-[280px] z-40">
              <SelectMaps
                isVisible={true}
                selectedMaps={selectedMaps}
                onGoToToolPanel={() => {
                  setShowToolPanel(true);
                  setShowSelectMaps(false);
                  setShowPathfinder(false);
                  setShowPlanningTools(false);
                  setShowAssessmentTools(false);
                }}
                onSelectedMapsChange={setSelectedMaps}
              />
            </div>
          )}
          {!isChatExpanded && showPlanningTools && (
            <div className="absolute left-[70px] top-[70px] w-[280px] z-40">
              <SelectPlanningTools
                isVisible={true}
                selectedPlanningTools={selectedPlanningTools}
                onGoToToolPanel={() => {
                  setShowToolPanel(true);
                  setShowSelectMaps(false);
                  setShowPathfinder(false);
                  setShowPlanningTools(false);
                  setShowAssessmentTools(false);
                }}
                onSelectedPlanningToolsChange={setSelectedPlanningTools}
              />
            </div>
          )}
          {!isChatExpanded && showAssessmentTools && (
            <div className="absolute left-[70px] top-[70px] w-[280px] z-40">
              <SelectAssessment
                isVisible={true}
                selectedAssessmentTools={selectedAssessmentTools}
                onGoToToolPanel={() => {
                  setShowToolPanel(true);
                  setShowSelectMaps(false);
                  setShowPathfinder(false);
                  setShowPlanningTools(false);
                  setShowAssessmentTools(false);
                }}
                onSelectedAssessmentToolsChange={setSelectedAssessmentTools}
              />
            </div>
          )}
          {!isChatExpanded && showToolPanel && (
            <div className="absolute left-[70px] top-[70px] w-[280px] z-40">
              <ToolPanel
                isVisible={true}
                selectedMaps={selectedMaps}
                selectedPlanningTools={selectedPlanningTools}
                selectedAssessmentTools={selectedAssessmentTools}
                mapRef={mapRef}
                uploadedFiles={uploadedFiles}
                onShowAspectRatioSelector={setShowAspectRatioSelector}
                expandedPanels={expandedPanels}
                setExpandedPanels={setExpandedPanels}
                trafficExpanded={trafficExpanded}
                setTrafficExpanded={setTrafficExpanded}
                geologicalExpanded={geologicalExpanded}
                setGeologicalExpanded={setGeologicalExpanded}
                onPlanSelect={(plan) => {
                  // toggle selection
                  setSelectedPlan((prev) =>
                    prev?.name === plan.name && prev?.date === plan.date
                      ? null
                      : plan
                  );
                }}
                activePlan={selectedPlan}
                earthquakeEnabled={earthquakeEnabled}
                onEarthquakeToggle={(enabled) => {
                  setEarthquakeEnabled(enabled);
                  if (!enabled && earthquakeIntervalRef.current) {
                    clearInterval(earthquakeIntervalRef.current);
                    earthquakeIntervalRef.current = null;
                  }
                }}
                volcanoListEnabled={volcanoListEnabled}
                onVolcanoListToggle={(enabled) => {
                  setVolcanoListEnabled(enabled);
                }}
                activeFaultsEnabled={activeFaultsEnabled}
                onActiveFaultsToggle={(enabled) => {
                  setActiveFaultsEnabled(enabled);
                }}
                congestionEnabled={congestionEnabled}
                onCongestionToggle={(enabled) => {
                  if (enabled) {
                    enableCongestion();
                  } else {
                    disableCongestion();
                  }
                }}
                onStartExposureAnalysis={handleStartExposureAnalysis}
                onRunExposureAnalysis={handleRunExposureAnalysis}
                onAbortExposureAnalysis={handleAbortExposureAnalysis}
                exposureAssessmentRef={exposureAssessmentRef}
              />
            </div>
          )}
          {/* User Settings Button at Bottom Left - Hide when expanded */}
          {!isChatExpanded && <UserSettings />}
          {/* Right Side Controls - Hide when expanded */}
          {!isChatExpanded && (
            <RightSideControls
              ref={centerRightControlsRef}
              showViewModeToggle={showViewModeToggle}
              viewMode={viewMode}
              switchTo2D={switchTo2D}
              switchTo3D={switchTo3D}
              handleZoom={handleZoom}
              mapRef={mapRef}
              uploadedFiles={uploadedFiles}
              setUploadedFiles={setUploadedFiles}
              isBoundaryLoading={isBoundaryLoading}
              setIsBoundaryLoading={setIsBoundaryLoading}
              setBoundaryLoadingStage={setBoundaryLoadingStage}
              isFileLoading={isFileLoading}
              setIsFileLoading={setIsFileLoading}
              setFileLoadingStage={setFileLoadingStage}
              onGlobalReset={openResetConfirmModal}
              canUndo={canUndo}
              canRedo={canRedo}
              onUndo={() => void handleUndo()}
              onRedo={() => void handleRedo()}
            />
          )}
          {/* Layers Panel - Show when there are active layers */}
          {!isChatExpanded && !showPathfinder && (
            <LayersPanel
              uploadedFiles={uploadedFiles}
              mapRef={mapRef}
              earthquakeEnabled={earthquakeEnabled}
              volcanoListEnabled={volcanoListEnabled}
              activeFaultsEnabled={activeFaultsEnabled}
              congestionEnabled={congestionEnabled}
            />
          )}
          {/* SafeGIS AI Chat - Always render, position changes based on expanded state */}
          <SafeGISAIChat
            isVisible={showChat}
            mapRef={mapRef}
            toggleChat={() => setShowChat((prev) => !prev)}
            onExpandToggle={setIsChatExpanded}
            isExpanded={isChatExpanded}
            viewMode={viewMode}
            switchTo2D={switchTo2D}
            switchTo3D={switchTo3D}
            setViewMode={setViewMode}
            selectedMapStyle={selectedMapStyle}
            handleMapStyleChange={handleMapStyleChange}
            handleTimeOfDayChange={handleTimeOfDayChange}
            uploadedFiles={uploadedFiles.map((f) => f.name)}
            spatialContext={uploadedFiles}
            spatialDataCallbacks={{
              openImportConnectPanel: () => {
                centerRightControlsRef.current?.openImportFilesPanel?.();
              },
              fetchGeoJsonFromUrl: (payload) =>
                centerRightControlsRef.current?.fetchAndAddGeoJsonFromUrl(
                  payload
                ) ?? Promise.resolve({ ok: false, error: "Controls not ready" }),
            }}
            liveHazardMonitorCallbacks={{
              openLiveHazardMonitor: () => setShowLiveHazardMonitor(true),
              expandEarthquakeSection: () => {
                // Earthquake section is expanded by default when Live Hazard Monitor opens
              },
              expandWeatherSection: () => {
                // Weather section is expanded by default when Live Hazard Monitor opens
              },
              selectEarthquakeSource: (sourceName: string) => {
                setSelectedEarthquakeSources((prev) =>
                  prev.includes(sourceName)
                    ? prev.filter((name) => name !== sourceName)
                    : [...prev, sourceName]
                );
              },
              selectWeatherSource: (sourceName: string) => {
                setSelectedWeatherSources((prev) =>
                  prev.includes(sourceName)
                    ? prev.filter((name) => name !== sourceName)
                    : [...prev, sourceName]
                );
              },
              getSelectedEarthquakeSources: () => selectedEarthquakeSources,
              getSelectedWeatherSources: () => selectedWeatherSources,
            }}
            exposureAssessmentCallbacks={{
              openExposureAssessment: () => {
                console.log("🔵 Opening Exposure Assessment panel");
                // Select Exposure Assessment and open the tool panel
                setSelectedAssessmentTools(["Exposure Assessment"]);
                setShowToolPanel(true);
                // Hide the selection screen to show the actual tool panel
                setShowSelectMaps(false);
                setShowPathfinder(false);
                setShowPlanningTools(false);
                setShowAssessmentTools(false);
                // CRITICAL: Expand the panel so the component actually renders!
                setExpandedPanels((prev) => ({
                  ...prev,
                  "assessment-Exposure Assessment": true,
                }));
                console.log(
                  "🔵 Panel expanded: assessment-Exposure Assessment"
                );
              },
              selectHazardSource: (source: "existing" | "imported") => {
                console.log(
                  "🔵 CALLBACK: selectHazardSource called with:",
                  source
                );
                // Poll until ref is available (component mounted)
                const pollRef = (attempts = 0) => {
                  if (exposureAssessmentRef.current) {
                    console.log("🔵 CALLBACK: Calling ref.selectHazardSource");
                    exposureAssessmentRef.current.selectHazardSource(source);
                    console.log(
                      "🔵 CALLBACK: ref.selectHazardSource called successfully"
                    );
                  } else if (attempts < 20) {
                    // Retry up to 20 times (2 seconds total)
                    console.log(
                      `🔵 CALLBACK: Ref not ready, retrying... (attempt ${
                        attempts + 1
                      }/20)`
                    );
                    setTimeout(() => pollRef(attempts + 1), 100);
                  } else {
                    console.error(
                      "🔵 CALLBACK: exposureAssessmentRef.current is NULL after 2 seconds!"
                    );
                  }
                };
                setTimeout(() => pollRef(), 100);
              },
              selectHazardData: (
                data: string[],
                source?: "existing" | "imported"
              ) => {
                console.log(
                  "🔵 CALLBACK: selectHazardData called with:",
                  data,
                  "source:",
                  source
                );
                // Poll until ref is available
                const pollRef = (attempts = 0) => {
                  if (exposureAssessmentRef.current) {
                    console.log("🔵 CALLBACK: Calling ref.selectHazardData");
                    exposureAssessmentRef.current.selectHazardData(
                      data,
                      source
                    );
                    console.log(
                      "🔵 CALLBACK: ref.selectHazardData called successfully"
                    );
                  } else if (attempts < 20) {
                    console.log(
                      `🔵 CALLBACK: Ref not ready, retrying... (attempt ${
                        attempts + 1
                      }/20)`
                    );
                    setTimeout(() => pollRef(attempts + 1), 100);
                  } else {
                    console.error(
                      "🔵 CALLBACK: exposureAssessmentRef.current is NULL after 2 seconds!"
                    );
                  }
                };
                setTimeout(() => pollRef(), 200);
              },
              selectElementSource: (source: "existing" | "imported") => {
                console.log(
                  "🔵 CALLBACK: selectElementSource called with:",
                  source
                );
                // Poll until ref is available
                const pollRef = (attempts = 0) => {
                  if (exposureAssessmentRef.current) {
                    console.log("🔵 CALLBACK: Calling ref.selectElementSource");
                    exposureAssessmentRef.current.selectElementSource(source);
                    console.log(
                      "🔵 CALLBACK: ref.selectElementSource called successfully"
                    );
                  } else if (attempts < 20) {
                    console.log(
                      `🔵 CALLBACK: Ref not ready, retrying... (attempt ${
                        attempts + 1
                      }/20)`
                    );
                    setTimeout(() => pollRef(attempts + 1), 100);
                  } else {
                    console.error(
                      "🔵 CALLBACK: exposureAssessmentRef.current is NULL after 2 seconds!"
                    );
                  }
                };
                setTimeout(() => pollRef(), 100);
              },
              selectElementData: (
                data: string[],
                source?: "existing" | "imported"
              ) => {
                console.log(
                  "🔵 CALLBACK: selectElementData called with:",
                  data,
                  "source:",
                  source
                );
                // Poll until ref is available
                const pollRef = (attempts = 0) => {
                  if (exposureAssessmentRef.current) {
                    console.log("🔵 CALLBACK: Calling ref.selectElementData");
                    exposureAssessmentRef.current.selectElementData(
                      data,
                      source
                    );
                    console.log(
                      "🔵 CALLBACK: ref.selectElementData called successfully"
                    );
                  } else if (attempts < 20) {
                    console.log(
                      `🔵 CALLBACK: Ref not ready, retrying... (attempt ${
                        attempts + 1
                      }/20)`
                    );
                    setTimeout(() => pollRef(attempts + 1), 100);
                  } else {
                    console.error(
                      "🔵 CALLBACK: exposureAssessmentRef.current is NULL after 2 seconds!"
                    );
                  }
                };
                setTimeout(() => pollRef(), 200);
              },
              runAnalysis: () => {
                console.log("🔵 CALLBACK: runAnalysis called");
                // Poll until ref is available
                const pollRef = (attempts = 0) => {
                  if (exposureAssessmentRef.current) {
                    console.log("🔵 CALLBACK: Calling ref.runAnalysis");
                    exposureAssessmentRef.current.runAnalysis();
                    console.log(
                      "🔵 CALLBACK: ref.runAnalysis called successfully"
                    );
                  } else if (attempts < 20) {
                    console.log(
                      `🔵 CALLBACK: Ref not ready, retrying... (attempt ${
                        attempts + 1
                      }/20)`
                    );
                    setTimeout(() => pollRef(attempts + 1), 100);
                  } else {
                    console.error(
                      "🔵 CALLBACK: exposureAssessmentRef.current is NULL after 2 seconds!"
                    );
                  }
                };
                setTimeout(() => pollRef(), 300);
              },
              clearSteps: () => {
                console.log("🔵 CALLBACK: clearSteps called");
                exposureAssessmentRef.current?.clearSteps();
              },
            }}
            layersPanelCallbacks={{
              openLayersPanel: (layerType?: "hazard" | "critical_facility") => {
                const layerName =
                  layerType === "critical_facility"
                    ? "Critical Facility Layers"
                    : "Hazard Layers";

                console.log(`🔵 Opening Layers Panel with ${layerName}`);
                // Select the appropriate layer
                setSelectedMaps([layerName]);
                // Open the tool panel directly
                setShowToolPanel(true);
                setShowSelectMaps(false);
                setShowLiveHazardMonitor(false);
                setShowPathfinder(false);
                setShowPlanningTools(false);
                setShowAssessmentTools(false);
                // Expand the panel
                setExpandedPanels((prev) => ({
                  ...prev,
                  [`map-${layerName}`]: true,
                }));
              },
              expandGeologicalSection: () => {
                console.log("🔵 Expanding Geological section");
                // Delay expansion to ensure panel is mounted
                setTimeout(() => {
                  setGeologicalExpanded(true);
                  console.log("🔵 Geological section expanded");
                }, 100);
              },
            }}
            boundaryCallbacks={{
              addBoundary: (
                source?: string,
                country?: string,
                adminLevel?: number
              ) => {
                console.log("🔵 Adding boundary:", source, country, adminLevel);
                // Use ref to control CenterRightControls
                if (centerRightControlsRef.current) {
                  centerRightControlsRef.current.openBoundariesPanel(
                    source,
                    country,
                    adminLevel
                  );
                } else {
                  console.warn("centerRightControlsRef not available");
                }
              },
              clearBoundary: () => {
                console.log("🔵 Clearing boundaries");
                // Use ref to control CenterRightControls
                if (centerRightControlsRef.current) {
                  centerRightControlsRef.current.clearBoundaries();
                } else {
                  console.warn("centerRightControlsRef not available");
                }
              },
            }}
            pathfinderCallbacks={{
              findRoute: async (
                start: string,
                destination: string,
                mode: string
              ) => {
                console.log(
                  "🔵 CALLBACK: findRoute called with:",
                  start,
                  destination,
                  mode
                );
                // Open pathfinder panel
                setShowPathfinder(true);
                setShowToolPanel(true);
                setShowSelectMaps(false);
                setShowPlanningTools(false);
                setShowAssessmentTools(false);

                // Poll until ref is available (component mounted)
                const pollRef = async (attempts = 0) => {
                  if (pathfinderRef.current) {
                    console.log(
                      "🔵 CALLBACK: Pathfinder ref available, geocoding locations"
                    );
                    try {
                      pathfinderRef.current.setPathfinderTab("destination");
                      // Geocode start location
                      const startRes = await fetch(
                        `http://localhost:8000/geocode/search?query=${encodeURIComponent(
                          start
                        )}`
                      );
                      const startData = await startRes.json();

                      // Geocode destination location
                      const destRes = await fetch(
                        `http://localhost:8000/geocode/search?query=${encodeURIComponent(
                          destination
                        )}`
                      );
                      const destData = await destRes.json();

                      if (startData.results?.[0] && destData.results?.[0]) {
                        const startResult = startData.results[0];
                        const destResult = destData.results[0];

                        const startCoords = {
                          lat: startResult.lat,
                          lon: startResult.lon,
                        };
                        const destCoords = {
                          lat: destResult.lat,
                          lon: destResult.lon,
                        };

                        console.log(
                          "🔵 CALLBACK: Setting locations in pathfinder"
                        );
                        // Set locations in pathfinder
                        pathfinderRef.current.setStartLocation(
                          startResult.name || start,
                          startCoords
                        );
                        pathfinderRef.current.setDestinationLocation(
                          destResult.name || destination,
                          destCoords
                        );

                        // Set mode if specified
                        if (mode && mode !== "all") {
                          pathfinderRef.current.setMode(mode);
                        }

                        // Fit bounds to show both markers
                        mapRef.current?.fitBoundsToMarkers();

                        console.log("🔵 CALLBACK: Route finding initiated");
                      } else {
                        console.error(
                          "🔵 CALLBACK: Could not geocode locations"
                        );
                      }
                    } catch (error) {
                      console.error(
                        "🔵 CALLBACK: Error geocoding locations:",
                        error
                      );
                    }
                  } else if (attempts < 20) {
                    console.log(
                      `🔵 CALLBACK: Pathfinder ref not ready, retrying... (attempt ${
                        attempts + 1
                      }/20)`
                    );
                    setTimeout(() => pollRef(attempts + 1), 100);
                  } else {
                    console.error(
                      "🔵 CALLBACK: pathfinderRef.current is NULL after 2 seconds!"
                    );
                  }
                };
                setTimeout(() => pollRef(), 100);
              },
              findEvacuationFromStart: async (start: string, mode: string) => {
                setShowPathfinder(true);
                setShowToolPanel(true);
                setShowSelectMaps(false);
                setShowPlanningTools(false);
                setShowAssessmentTools(false);
                const pollRef = async (attempts = 0) => {
                  if (pathfinderRef.current) {
                    try {
                      pathfinderRef.current.setPathfinderTab("evacuation");
                      const startRes = await fetch(
                        `http://localhost:8000/geocode/search?query=${encodeURIComponent(
                          start
                        )}`
                      );
                      const startData = await startRes.json();
                      if (startData.results?.[0]) {
                        const sr = startData.results[0];
                        const startCoords = { lat: sr.lat, lon: sr.lon };
                        pathfinderRef.current.setStartLocation(
                          sr.name || start,
                          startCoords
                        );
                        if (mode && mode !== "all") {
                          pathfinderRef.current.setMode(mode);
                        }
                        mapRef.current?.flyTo?.({
                          center: [sr.lon, sr.lat],
                          zoom: 14,
                        });
                      }
                    } catch (e) {
                      console.error("findEvacuationFromStart:", e);
                    }
                  } else if (attempts < 20) {
                    setTimeout(() => pollRef(attempts + 1), 100);
                  }
                };
                setTimeout(() => pollRef(), 100);
              },
              changeRouteMode: (mode: string) => {
                console.log("🔵 CALLBACK: changeRouteMode called with:", mode);
                if (pathfinderRef.current) {
                  pathfinderRef.current.setMode(mode);
                }
              },
              changeRouteSort: (sortBy: string) => {
                console.log(
                  "🔵 CALLBACK: changeRouteSort called with:",
                  sortBy
                );
                if (pathfinderRef.current) {
                  pathfinderRef.current.setSort(sortBy);
                }
              },
              openPathfinder: () => {
                console.log("🔵 CALLBACK: openPathfinder called");
                setShowPathfinder(true);
                setShowToolPanel(true);
                setShowSelectMaps(false);
                setShowPlanningTools(false);
                setShowAssessmentTools(false);
              },
              setPathfinderTab: (tab: "destination" | "evacuation") => {
                setShowPathfinder(true);
                setShowToolPanel(true);
                setShowSelectMaps(false);
                setShowPlanningTools(false);
                setShowAssessmentTools(false);
                const trySet = (attempts = 0) => {
                  if (pathfinderRef.current?.setPathfinderTab) {
                    pathfinderRef.current.setPathfinderTab(tab);
                  } else if (attempts < 25) {
                    setTimeout(() => trySet(attempts + 1), 50);
                  }
                };
                trySet();
              },
              closePathfinder: () => {
                console.log("🔵 CALLBACK: closePathfinder called");
                setShowPathfinder(false);
              },
              clearPathfinderRoutes: () => {
                pathfinderRef.current?.clearDisplayedRoutesFromMap?.();
              },
              listPathfinderSheltersInChat: () => {
                const snap =
                  pathfinderRef.current?.getEvacuationSheltersSnapshot?.();
                if (!snap) {
                  return {
                    text: "Pathfinder isn’t available yet. Open **Pathfinder** and set a starting point in **Find Shelter/s** mode, then ask again.",
                  };
                }
                if (snap.loading) {
                  return {
                    text: "Shelters are still loading from OpenStreetMap — try again in a moment.",
                  };
                }
                if (snap.error) {
                  return {
                    text: `Could not load shelters: ${snap.error}`,
                  };
                }
                if (snap.pathfinderTab !== "evacuation") {
                  return {
                    text: "Switch Pathfinder to **Find Shelter/s**, set your **starting location**, then ask me to list shelters again.",
                  };
                }
                if (!snap.startName?.trim()) {
                  return {
                    text: "Set a **starting location** in Pathfinder (Find Shelter/s) first — then I can list loaded shelters.",
                  };
                }
                if (snap.places.length === 0) {
                  return {
                    text: `No shelters or schools were found within **${snap.radiusKm} km** of **${snap.startName}**. Try increasing **Radius near start** in Pathfinder or moving the start pin.`,
                  };
                }
                const lines = snap.places.map(
                  (p, i) =>
                    `${i + 1}. **${p.name}**${p.kind ? ` · _${p.kind}_` : ""}`
                );
                return {
                  text:
                    `Shelters / facilities within **${snap.radiusKm} km** of **${snap.startName}** (${snap.places.length}):\n\n` +
                    lines.join("\n"),
                };
              },
              selectPathfinderShelterByName: async (name: string) => {
                const q = name.trim();
                if (!q) return { ok: false, error: "empty_query" as const };
                setShowPathfinder(true);
                setShowToolPanel(true);
                setShowSelectMaps(false);
                setShowPlanningTools(false);
                setShowAssessmentTools(false);
                for (let attempt = 0; attempt < 45; attempt++) {
                  await new Promise((r) => setTimeout(r, 100));
                  const ref = pathfinderRef.current;
                  if (!ref) continue;
                  ref.setPathfinderTab("evacuation");
                  const snap = ref.getEvacuationSheltersSnapshot?.();
                  if (snap?.loading && attempt < 40) continue;
                  const r = ref.selectEvacuationPlaceByName?.(q);
                  if (r?.ok) return r;
                  if (
                    r?.error === "no_match" ||
                    r?.error === "empty_query" ||
                    r?.error === "no_start"
                  ) {
                    return r;
                  }
                }
                return { ok: false, error: "timeout" as const };
              },
            }}
            openPanel={(panel: string) => {
              const p = panel.toLowerCase().replace(/\s+/g, "_");
              if (p === "chat_expand" || p === "chat_fullscreen" || p === "expand_chat" || p === "atlas_fullscreen") {
                setShowChat(true);
                setIsChatExpanded(true);
                return;
              }
              if (p === "chat_collapse" || p === "minimize_chat" || p === "collapse_chat") {
                setIsChatExpanded(false);
                return;
              }
              if (p === "map_style_dropdown" || p === "map_style" || p === "style_dropdown") {
                setShowMapStyleDropdown(true);
                setShowTimeOfDayDropdown(false);
                return;
              }
              if (p === "time_of_day_dropdown" || p === "time_of_day" || p === "lighting_dropdown") {
                setShowTimeOfDayDropdown(true);
                setShowMapStyleDropdown(false);
                return;
              }
              if (p === "boundary_panel" || p === "add_boundary_panel" || p === "boundaries_panel") {
                centerRightControlsRef.current?.openBoundariesPanel?.();
                return;
              }
              if (p === "pathfinder_panel" || p === "pathfinder" || p === "route_panel") {
                setShowPathfinder(true);
                setShowToolPanel(true);
                setShowSelectMaps(false);
                setShowPlanningTools(false);
                setShowAssessmentTools(false);
                return;
              }
              if (p === "layers_panel" || p === "layer_panel" || p === "hazard_layers" || p === "critical_facility_layers") {
                setShowToolPanel(true);
                setShowSelectMaps(false);
                setShowPathfinder(false);
                setShowPlanningTools(false);
                setShowAssessmentTools(false);
                setExpandedPanels((prev) => ({ ...prev, "hazard-Geological Hazards": true }));
                return;
              }
              if (
                p === "import_files_panel" ||
                p === "import_panel" ||
                p === "upload_panel" ||
                p === "spatial_data_panel" ||
                p === "import_connect_spatial" ||
                p === "open_spatial_data"
              ) {
                centerRightControlsRef.current?.openImportFilesPanel?.();
                return;
              }
              if (p === "live_hazard_monitor" || p === "hazard_monitor" || p === "live_hazards") {
                setShowLiveHazardMonitor(true);
                return;
              }
              if (p === "select_maps" || p === "map_selection" || p === "maps_panel") {
                setShowSelectMaps(true);
                setShowToolPanel(true);
                setShowPathfinder(false);
                setShowPlanningTools(false);
                setShowAssessmentTools(false);
                return;
              }
              if (p === "planning_tools" || p === "planning_panel" || p === "planning") {
                setShowPlanningTools(true);
                setShowToolPanel(true);
                setShowSelectMaps(false);
                setShowPathfinder(false);
                setShowAssessmentTools(false);
                return;
              }
              if (p === "assessment_tools" || p === "assessment_panel" || p === "exposure_panel") {
                setShowAssessmentTools(true);
                setShowToolPanel(true);
                setShowSelectMaps(false);
                setShowPathfinder(false);
                setShowPlanningTools(false);
                return;
              }
              if (
                p === "imagery_intelligence" ||
                p === "imagery_intelligence_suite" ||
                p === "imagery_suite" ||
                p === "geo_ai_suite" ||
                p === "geoai_suite" ||
                p === "geo_ai"
              ) {
                setShowAssessmentTools(true);
                setShowToolPanel(true);
                setShowSelectMaps(false);
                setShowPathfinder(false);
                setShowPlanningTools(false);
                return;
              }
              if (p === "tool_panel" || p === "tools_panel" || p === "left_panel") {
                setShowToolPanel(true);
                return;
              }
            }}
            closePanel={(panel: string) => {
              const p = panel.toLowerCase().replace(/\s+/g, "_");
              if (p === "live_hazard_monitor" || p === "hazard_monitor" || p === "live_hazards") {
                setShowLiveHazardMonitor(false);
                return;
              }
              if (p === "map_style_dropdown" || p === "map_style" || p === "style_dropdown") {
                setShowMapStyleDropdown(false);
                return;
              }
              if (p === "time_of_day_dropdown" || p === "time_of_day" || p === "lighting_dropdown") {
                setShowTimeOfDayDropdown(false);
                return;
              }
            }}
            mapHistoryCallbacks={{
              undo: () => void handleUndo(),
              redo: () => void handleRedo(),
              openResetConfirm: openResetConfirmModal,
              performReset: performGlobalReset,
            }}
          />
          {/* Aspect Ratio Selector - Hide when expanded */}
          {!isChatExpanded && showAspectRatioSelector && (
            <div className="absolute bottom-[109px] left-1/2 transform -translate-x-1/2 z-50 bg-[#2E2E2E] rounded-xl shadow-lg p-6">
              <div className="text-white text-center font-medium mb-4">
                Select Aspect Ratio
              </div>
              <div className="flex gap-3 mb-4">
                <button
                  onClick={() => {
                    setTempAspectRatio("1:1");
                    if (!isDrawingAspectRatio) {
                      setIsDrawingAspectRatio(true);
                      const map = mapRef.current?.getMap();
                      if (map) {
                        map.getCanvas().style.cursor = "crosshair";
                        map.dragPan.disable();
                      }
                    }
                  }}
                  className={`w-18 h-18 rounded-lg transition flex flex-col items-center justify-center ${
                    tempAspectRatio === "1:1"
                      ? "bg-gradient-to-b from-[#9699FF] to-white"
                      : "bg-[#3a3a3a] hover:bg-[#454545]"
                  }`}
                  title="1:1 (Square)"
                >
                  <CropDinIcon
                    sx={{
                      fontSize: 28,
                      color: tempAspectRatio === "1:1" ? "#2E2E2E" : "#C7C7C7",
                    }}
                  />
                  <span
                    className={`text-sm mt-1 ${
                      tempAspectRatio === "1:1"
                        ? "text-[#2E2E2E] font-semibold"
                        : "text-white"
                    }`}
                  >
                    1 : 1
                  </span>
                </button>

                <button
                  onClick={() => {
                    setTempAspectRatio("16:9");
                    if (!isDrawingAspectRatio) {
                      setIsDrawingAspectRatio(true);
                      const map = mapRef.current?.getMap();
                      if (map) {
                        map.getCanvas().style.cursor = "crosshair";
                        map.dragPan.disable();
                      }
                    }
                  }}
                  className={`w-18 h-18 rounded-lg transition flex flex-col items-center justify-center ${
                    tempAspectRatio === "16:9"
                      ? "bg-gradient-to-b from-[#9699FF] to-white"
                      : "bg-[#3a3a3a] hover:bg-[#454545]"
                  }`}
                  title="16:9 (Landscape)"
                >
                  <CropLandscapeIcon
                    sx={{
                      fontSize: 28,
                      color: tempAspectRatio === "16:9" ? "#2E2E2E" : "#C7C7C7",
                    }}
                  />
                  <span
                    className={`text-sm mt-1 ${
                      tempAspectRatio === "16:9"
                        ? "text-[#2E2E2E] font-semibold"
                        : "text-white"
                    }`}
                  >
                    16 : 9
                  </span>
                </button>

                <button
                  onClick={() => {
                    setTempAspectRatio("9:16");
                    if (!isDrawingAspectRatio) {
                      setIsDrawingAspectRatio(true);
                      const map = mapRef.current?.getMap();
                      if (map) {
                        map.getCanvas().style.cursor = "crosshair";
                        map.dragPan.disable();
                      }
                    }
                  }}
                  className={`w-18 h-18 rounded-lg transition flex flex-col items-center justify-center ${
                    tempAspectRatio === "9:16"
                      ? "bg-gradient-to-b from-[#9699FF] to-white"
                      : "bg-[#3a3a3a] hover:bg-[#454545]"
                  }`}
                  title="9:16 (Portrait)"
                >
                  <CropPortraitIcon
                    sx={{
                      fontSize: 28,
                      color: tempAspectRatio === "9:16" ? "#2E2E2E" : "#C7C7C7",
                    }}
                  />
                  <span
                    className={`text-sm mt-1 ${
                      tempAspectRatio === "9:16"
                        ? "text-[#2E2E2E] font-semibold"
                        : "text-white"
                    }`}
                  >
                    9 : 16
                  </span>
                </button>

                <button
                  onClick={() => {
                    setTempAspectRatio("3:2");
                    if (!isDrawingAspectRatio) {
                      setIsDrawingAspectRatio(true);
                      const map = mapRef.current?.getMap();
                      if (map) {
                        map.getCanvas().style.cursor = "crosshair";
                        map.dragPan.disable();
                      }
                    }
                  }}
                  className={`w-18 h-18 rounded-lg transition flex flex-col items-center justify-center ${
                    tempAspectRatio === "3:2"
                      ? "bg-gradient-to-b from-[#9699FF] to-white"
                      : "bg-[#3a3a3a] hover:bg-[#454545]"
                  }`}
                  title="3:2"
                >
                  <Crop32Icon
                    sx={{
                      fontSize: 28,
                      color: tempAspectRatio === "3:2" ? "#2E2E2E" : "#C7C7C7",
                    }}
                  />
                  <span
                    className={`text-sm mt-1 ${
                      tempAspectRatio === "3:2"
                        ? "text-[#2E2E2E] font-semibold"
                        : "text-white"
                    }`}
                  >
                    3 : 2
                  </span>
                </button>

                <button
                  onClick={() => {
                    setTempAspectRatio("5:4");
                    if (!isDrawingAspectRatio) {
                      setIsDrawingAspectRatio(true);
                      const map = mapRef.current?.getMap();
                      if (map) {
                        map.getCanvas().style.cursor = "crosshair";
                        map.dragPan.disable();
                      }
                    }
                  }}
                  className={`w-18 h-18 rounded-lg transition flex flex-col items-center justify-center ${
                    tempAspectRatio === "5:4"
                      ? "bg-gradient-to-b from-[#9699FF] to-white"
                      : "bg-[#3a3a3a] hover:bg-[#454545]"
                  }`}
                  title="5:4"
                >
                  <Crop54Icon
                    sx={{
                      fontSize: 28,
                      color: tempAspectRatio === "5:4" ? "#2E2E2E" : "#C7C7C7",
                    }}
                  />
                  <span
                    className={`text-sm mt-1 ${
                      tempAspectRatio === "5:4"
                        ? "text-[#2E2E2E] font-semibold"
                        : "text-white"
                    }`}
                  >
                    5 : 4
                  </span>
                </button>

                <button
                  onClick={() => {
                    setTempAspectRatio("7:5");
                    if (!isDrawingAspectRatio) {
                      setIsDrawingAspectRatio(true);
                      const map = mapRef.current?.getMap();
                      if (map) {
                        map.getCanvas().style.cursor = "crosshair";
                        map.dragPan.disable();
                      }
                    }
                  }}
                  className={`w-18 h-18 rounded-lg transition flex flex-col items-center justify-center ${
                    tempAspectRatio === "7:5"
                      ? "bg-gradient-to-b from-[#9699FF] to-white"
                      : "bg-[#3a3a3a] hover:bg-[#454545]"
                  }`}
                  title="7:5"
                >
                  <Crop75Icon
                    sx={{
                      fontSize: 28,
                      color: tempAspectRatio === "7:5" ? "#2E2E2E" : "#C7C7C7",
                    }}
                  />
                  <span
                    className={`text-sm mt-1 ${
                      tempAspectRatio === "7:5"
                        ? "text-[#2E2E2E] font-semibold"
                        : "text-white"
                    }`}
                  >
                    7 : 5
                  </span>
                </button>

                <button
                  onClick={() => {
                    setTempAspectRatio("free");
                    if (!isDrawingAspectRatio) {
                      setIsDrawingAspectRatio(true);
                      const map = mapRef.current?.getMap();
                      if (map) {
                        map.getCanvas().style.cursor = "crosshair";
                        map.dragPan.disable();
                      }
                    }
                  }}
                  className={`w-18 h-18 rounded-lg transition flex flex-col items-center justify-center ${
                    tempAspectRatio === "free"
                      ? "bg-gradient-to-b from-[#9699FF] to-white"
                      : "bg-[#3a3a3a] hover:bg-[#454545]"
                  }`}
                  title="Free form"
                >
                  <CropFreeIcon
                    sx={{
                      fontSize: 28,
                      color: tempAspectRatio === "free" ? "#2E2E2E" : "#C7C7C7",
                    }}
                  />
                  <span
                    className={`text-sm mt-1 ${
                      tempAspectRatio === "free"
                        ? "text-[#2E2E2E] font-semibold"
                        : "text-white"
                    }`}
                  >
                    Free
                  </span>
                </button>
              </div>

              {/* Action Buttons - Only show when shape is drawn */}
              {aspectRatioShapeDrawn && (
                <div className="flex gap-3">
                  <button
                    onClick={() => {
                      // Remove the drawn shape
                      const map = mapRef.current?.getMap();
                      if (map) {
                        if (map.getLayer("drawn-box-layer")) {
                          map.removeLayer("drawn-box-layer");
                        }
                        if (map.getLayer("drawn-box-outline")) {
                          map.removeLayer("drawn-box-outline");
                        }
                        if (map.getSource("drawn-box")) {
                          map.removeSource("drawn-box");
                        }
                      }

                      // Clear saved shape data
                      savedAspectRatioShapeRef.current = null;

                      // Reset states
                      setTempAspectRatio("");
                      setAspectRatioShapeDrawn(false);
                      setIsDrawingAspectRatio(false);
                      boxCoordsRef.current = { start: null, end: null };
                    }}
                    className="flex-1 px-4 py-2 rounded-lg bg-[#3a3a3a] text-white hover:bg-[#454545] transition font-medium"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => {
                      setSelectedAspectRatio(tempAspectRatio);
                      setShowAspectRatioSelector(false);
                      setAspectRatioShapeDrawn(false);
                      setIsDrawingAspectRatio(false);
                      // Keep the drawn shape on the map
                      // TODO: Store the shape coordinates if needed for further processing
                    }}
                    className="flex-1 px-4 py-2 rounded-lg bg-[#5A5C99] text-white hover:opacity-90 transition font-medium"
                  >
                    Save
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Exposure Assessment Results - Hide when expanded */}
          {!isChatExpanded && showExposureResults && (
            <div
              className="absolute z-50 bg-[#2E2E2E]/75 backdrop-blur-xs rounded-md shadow-lg w-[500px] text-white"
              style={{
                bottom: `${80 - exposureResultsPosition.y}px`,
                left: `calc(50% + ${exposureResultsPosition.x}px)`,
                transform: "translateX(-50%)",
                cursor: isDraggingResults ? "grabbing" : "auto",
              }}
            >
              {/* Header */}
              <div
                className="flex justify-between items-center px-3 py-2 bg-[#3a3a3a] rounded-t-md cursor-grab active:cursor-grabbing"
                onMouseDown={(e) => {
                  setIsDraggingResults(true);
                  dragStartPos.current = {
                    x: e.clientX - exposureResultsPosition.x,
                    y: e.clientY - exposureResultsPosition.y,
                  };
                }}
              >
                <h3 className="text-[11px] font-semibold">
                  Exposure Assessment Results
                </h3>
                {!isAnalysisRunning && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setExposureResultsMinimized(!exposureResultsMinimized);
                    }}
                    className="text-white hover:text-gray-300 transition flex items-center gap-1.5 shrink-0 text-[10px] font-medium"
                    aria-label={
                      exposureResultsMinimized ? "Show more" : "Show less"
                    }
                  >
                    {exposureResultsMinimized && <span>Show more</span>}
                    <ChevronDown
                      size={16}
                      className={`transition-transform duration-200 shrink-0 ${
                        exposureResultsMinimized ? "rotate-180" : ""
                      }`}
                    />
                  </button>
                )}
              </div>
              {/* Content */}
              <div
                className={exposureResultsMinimized ? "px-3 pt-2" : "px-3 py-2"}
              >
                {isAnalysisRunning ? (
                  <div className="flex flex-col items-center justify-center py-8">
                    <div className="relative w-12 h-12 mb-3">
                      <div className="absolute inset-0 border-3 border-gray-600 rounded-full"></div>
                      <div className="absolute inset-0 border-3 border-t-[#9699FF] rounded-full animate-spin"></div>
                    </div>
                    <div className="text-white text-[11px] font-medium mb-1">
                      Running Assessment...
                    </div>
                    <div className="text-gray-400 text-[9px]">
                      Analyzing exposure data, please wait
                    </div>
                  </div>
                ) : exposureResultsData ? (
                  <>
                    {/* Analysis Overview */}
                    <div
                      className={exposureResultsMinimized ? "mb-1.5" : "mb-3"}
                    >
                      <h4
                        className={`text-[10px] font-semibold ${
                          exposureResultsMinimized ? "mb-1" : "mb-2"
                        }`}
                      >
                        Analysis Overview
                      </h4>
                      <div className="grid grid-cols-2 gap-2 text-[10px]">
                        {/* Hazard Analyzed count */}
                        <div>
                          <div className="text-gray-400 mb-0.5">
                            Hazard/s Analyzed:
                          </div>
                          <div className="text-white">
                            {exposureResultsData.hazardBreakdown?.length || 1}{" "}
                          </div>
                        </div>
                        {/* NEW: Analysis Time duration */}
                        <div>
                          <div className="text-gray-400 mb-0.5">
                            Analysis Duration:
                          </div>
                          <div className="text-white">
                            {exposureResultsData.analysisDuration ? (
                              exposureResultsData.analysisDuration
                            ) : (
                              <span className="text-gray-500">
                                Calculating...
                              </span>
                            )}
                          </div>
                        </div>
                        {!exposureResultsMinimized && (
                          <>
                            <div>
                              <div className="text-gray-400 mb-0.5">
                                Started at:
                              </div>
                              <div className="text-white">
                                {exposureResultsData.startTime ? (
                                  exposureResultsData.startTime
                                ) : (
                                  <span className="text-gray-500">
                                    Running...
                                  </span>
                                )}
                              </div>
                            </div>
                            <div>
                              <div className="text-gray-400 mb-0.5">
                                Finished at:
                              </div>
                              <div className="text-white">
                                {exposureResultsData.analysisTime ? (
                                  exposureResultsData.analysisTime
                                ) : (
                                  <span className="text-gray-500">
                                    In progress...
                                  </span>
                                )}
                              </div>
                            </div>
                          </>
                        )}
                      </div>
                    </div>

                    {/* Results grouped by hazard */}
                    <div
                      className={`max-h-[280px] overflow-y-auto ${
                        !exposureResultsMinimized ? "pr-1" : ""
                      }`}
                      style={{
                        scrollbarWidth: "thin",
                        scrollbarColor: "#706f6f transparent",
                      }}
                    >
                      {(() => {
                        const groupedResults: Record<string, any[]> = {};

                        exposureResultsData.elements.forEach((element: any) => {
                          const hazardKey = element.analysisArea
                            ? `${element.hazardType}|||${element.analysisArea}`
                            : element.hazardType ||
                              exposureResultsData.hazardType;

                          if (!groupedResults[hazardKey]) {
                            groupedResults[hazardKey] = [];
                          }
                          groupedResults[hazardKey].push(element);
                        });

                        return Object.entries(groupedResults).map(
                          ([hazardKey, elements], hazardIndex) => {
                            const [hazardType, analysisArea] =
                              hazardKey.includes("|||")
                                ? hazardKey.split("|||")
                                : [hazardKey, null];

                            return (
                              <div key={hazardIndex} className="mb-2">
                                {!exposureResultsMinimized && (
                                  <div className="mb-1.5 pb-1.5 border-b border-gray-600">
                                    <div className="text-white font-semibold text-[10px] flex items-start gap-1.5">
                                      <span className="bg-[#5A5C99] px-1.5 py-0.5 rounded text-[9px] whitespace-nowrap">
                                        Hazard Data:
                                      </span>
                                      <div className="flex flex-col">
                                        <span className="text-[9px]">
                                          {hazardType}
                                        </span>
                                        {analysisArea && (
                                          <span className="text-[9px] text-gray-400 mt-0.5">
                                            {analysisArea}
                                          </span>
                                        )}
                                      </div>
                                    </div>
                                  </div>
                                )}

                                <div className="space-y-1.5">
                                  {elements.map(
                                    (element: any, elementIndex: number) => {
                                      const total = parseFloat(
                                        element.totalSurfaceArea
                                      );
                                      const affected = parseFloat(
                                        element.affectedArea
                                      );
                                      const percentage =
                                        total > 0
                                          ? (affected / total) * 100
                                          : 0.0;

                                      // Data for donut chart
                                      const chartData = [
                                        {
                                          name: "Exposed",
                                          value: affected,
                                          fill: "#FFD700",
                                        },
                                        {
                                          name: "Not Exposed",
                                          value: total - affected,
                                          fill: "#404040",
                                        },
                                      ];

                                      return (
                                        <div
                                          key={elementIndex}
                                          className={`bg-[#3a3a3a] rounded ${
                                            exposureResultsMinimized
                                              ? "p-2"
                                              : "p-2"
                                          }`}
                                        >
                                          {/* Header */}
                                          {exposureResultsMinimized ? (
                                            <div className="flex items-center justify-between mb-0">
                                              <h5 className="text-[10px] font-medium text-left">
                                                {element.name}
                                              </h5>
                                              <span className="bg-[#FFD700] text-[#2E2E2E] px-1.5 py-0.5 rounded text-[9px] font-semibold whitespace-nowrap ml-2">
                                                {percentage.toFixed(2)}% Exposed
                                              </span>
                                            </div>
                                          ) : (
                                            <div className="mb-2">
                                              <h5 className="text-[10px] font-medium text-center">
                                                {element.name}
                                              </h5>
                                            </div>
                                          )}

                                          {!exposureResultsMinimized && (
                                            <>
                                              {/* Donut Chart */}
                                              <div className="flex justify-center mb-1">
                                                <div
                                                  style={{
                                                    width: "110px",
                                                    height: "110px",
                                                    position: "relative",
                                                  }}
                                                >
                                                  <ResponsiveContainer
                                                    width="100%"
                                                    height="100%"
                                                  >
                                                    <PieChart>
                                                      <Pie
                                                        data={chartData}
                                                        cx="50%"
                                                        cy="50%"
                                                        innerRadius={35}
                                                        outerRadius={45}
                                                        dataKey="value"
                                                        startAngle={90}
                                                        endAngle={-270}
                                                      >
                                                        {chartData.map(
                                                          (entry, index) => (
                                                            <Cell
                                                              key={`cell-${index}`}
                                                              fill={entry.fill}
                                                            />
                                                          )
                                                        )}
                                                      </Pie>
                                                      <Pie
                                                        data={[chartData[0]]}
                                                        cx="50%"
                                                        cy="50%"
                                                        innerRadius={35}
                                                        outerRadius={50}
                                                        dataKey="value"
                                                        startAngle={90}
                                                        endAngle={
                                                          90 -
                                                          (percentage / 100) *
                                                            360
                                                        }
                                                        fill="#FFD700"
                                                      />
                                                    </PieChart>
                                                  </ResponsiveContainer>
                                                  <div
                                                    style={{
                                                      position: "absolute",
                                                      top: "50%",
                                                      left: "50%",
                                                      transform:
                                                        "translate(-50%, -50%)",
                                                      textAlign: "center",
                                                    }}
                                                  >
                                                    <div className="text-white text-sm font-bold">
                                                      {percentage.toFixed(2)}%
                                                    </div>
                                                    <div className="text-gray-400 text-[9px]">
                                                      Exposed
                                                    </div>
                                                  </div>
                                                </div>
                                              </div>
                                              {/* Basic Stats */}
                                              <div className="text-[10px] space-y-0.5">
                                                <div className="flex justify-between">
                                                  <div className="text-gray-400">
                                                    {element.unit === "points"
                                                      ? "Total Count:"
                                                      : element.unit === "km"
                                                      ? "Total Length:"
                                                      : "Total Surface Area:"}
                                                  </div>
                                                  <span className="text-white">
                                                    {element.totalSurfaceArea}{" "}
                                                    {element.unit || "km²"}
                                                  </span>
                                                </div>
                                                <div className="flex justify-between">
                                                  <span className="text-gray-400">
                                                    {element.unit === "points"
                                                      ? "Affected points:"
                                                      : element.unit === "km"
                                                      ? "Affected length:"
                                                      : "Affected by hazard:"}
                                                  </span>
                                                  <span className="text-white">
                                                    {element.affectedArea}{" "}
                                                    {element.unit || "km²"}
                                                  </span>
                                                </div>
                                                <div className="flex justify-between">
                                                  <span className="text-gray-400">
                                                    {element.unit === "points"
                                                      ? "Unaffected points:"
                                                      : element.unit === "km"
                                                      ? "Unaffected length:"
                                                      : "Unaffected by hazard:"}
                                                  </span>
                                                  <span className="text-white">
                                                    {element.unaffectedArea}{" "}
                                                    {element.unit || "km²"}
                                                  </span>
                                                </div>
                                              </div>

                                              {/* NEW: Hazard Level Breakdown - Only for flood hazard data */}
                                              {element.hazardLevelBreakdown &&
                                                element.hazardLevelBreakdown
                                                  .length > 0 && (
                                                  <div className="mt-2 pt-2 border-t border-gray-600">
                                                    <h6 className="text-[9px] font-semibold text-white mb-1.5">
                                                      Affected{" "}
                                                      {element.unit === "points"
                                                        ? "Points"
                                                        : element.unit === "km"
                                                        ? "Length"
                                                        : "Area"}{" "}
                                                      by Hazard Level
                                                    </h6>
                                                    <div className="grid grid-cols-3 gap-1.5">
                                                      {element.hazardLevelBreakdown.map(
                                                        (
                                                          level: any,
                                                          idx: number
                                                        ) => {
                                                          // Determine color based on hazard level
                                                          const getColorClasses =
                                                            (
                                                              levelName: string
                                                            ) => {
                                                              if (
                                                                levelName.includes(
                                                                  "High"
                                                                )
                                                              ) {
                                                                return {
                                                                  bg: "bg-red-900/30",
                                                                  border:
                                                                    "border-red-600",
                                                                  text: "text-red-400",
                                                                };
                                                              } else if (
                                                                levelName.includes(
                                                                  "Medium"
                                                                )
                                                              ) {
                                                                return {
                                                                  bg: "bg-orange-900/30",
                                                                  border:
                                                                    "border-orange-600",
                                                                  text: "text-orange-400",
                                                                };
                                                              } else if (
                                                                levelName.includes(
                                                                  "Low"
                                                                )
                                                              ) {
                                                                return {
                                                                  bg: "bg-yellow-900/30",
                                                                  border:
                                                                    "border-yellow-600",
                                                                  text: "text-yellow-400",
                                                                };
                                                              } else {
                                                                return {
                                                                  bg: "bg-gray-700/30",
                                                                  border:
                                                                    "border-gray-600",
                                                                  text: "text-gray-400",
                                                                };
                                                              }
                                                            };

                                                          const colors =
                                                            getColorClasses(
                                                              level.hazardLevel
                                                            );

                                                          return (
                                                            <div
                                                              key={idx}
                                                              className={`${colors.bg} ${colors.border} border rounded p-1.5 flex flex-col items-center justify-center`}
                                                            >
                                                              <div
                                                                className={`${colors.text} text-sm font-bold mb-0.5`}
                                                              >
                                                                {level.measure}{" "}
                                                                {level.unit}
                                                              </div>
                                                              {level.percentage !==
                                                                undefined && (
                                                                <div className="text-gray-300 text-[8px] font-semibold mb-0.5">
                                                                  {
                                                                    level.percentage
                                                                  }
                                                                  %
                                                                </div>
                                                              )}
                                                              <div className="text-white text-[9px] text-center font-medium">
                                                                {
                                                                  level.hazardLevel
                                                                }
                                                              </div>
                                                            </div>
                                                          );
                                                        }
                                                      )}
                                                    </div>
                                                  </div>
                                                )}
                                              {/* NEW: Landuse Breakdown Table - Only for Land Cover */}
                                              {element.landuseBreakdown &&
                                                element.landuseBreakdown
                                                  .length > 0 && (
                                                  <div className="mt-2 pt-2 border-t border-gray-600">
                                                    <h6 className="text-[9px] font-semibold text-white mb-1.5">
                                                      Breakdown by Land use
                                                    </h6>
                                                    <div
                                                      className="max-h-[180px] overflow-y-auto"
                                                      style={{
                                                        scrollbarWidth: "thin",
                                                        scrollbarColor:
                                                          "#706f6f transparent",
                                                      }}
                                                    >
                                                      <table className="w-full text-[9px]">
                                                        <thead className="sticky top-0 bg-[#3a3a3a] z-10">
                                                          <tr className="text-gray-400 border-b border-gray-600">
                                                            <th className="text-left py-1 pr-2 pl-0">
                                                              Land use
                                                            </th>
                                                            <th className="text-center py-1 px-1">
                                                              Total Area (km²)
                                                            </th>
                                                            <th className="text-center py-1 px-1">
                                                              Affected Area
                                                              (km²)
                                                            </th>
                                                            <th className="text-center py-1 px-1">
                                                              Unaffected Area
                                                              (km²)
                                                            </th>
                                                            <th className="text-center py-1 pl-1 pr-0">
                                                              Percentage
                                                              Affected (%)
                                                            </th>
                                                          </tr>
                                                        </thead>
                                                        <tbody>
                                                          {element.landuseBreakdown.map(
                                                            (
                                                              row: any,
                                                              idx: number
                                                            ) => (
                                                              <tr
                                                                key={idx}
                                                                className="border-b border-gray-700 last:border-b-0 hover:bg-[#404040] transition"
                                                              >
                                                                <td
                                                                  className="py-1 pr-2 pl-0 text-white"
                                                                  title={
                                                                    row.landuse
                                                                  }
                                                                >
                                                                  {row.landuse}
                                                                </td>
                                                                <td className="py-1 px-1 text-center text-gray-300">
                                                                  {parseFloat(
                                                                    row.total_area_km2
                                                                  ).toFixed(2)}
                                                                </td>
                                                                <td className="py-1 px-1 text-center text-gray-300">
                                                                  {parseFloat(
                                                                    row.affected_area_km2
                                                                  ).toFixed(2)}
                                                                </td>
                                                                <td className="py-1 px-1 text-center text-gray-300">
                                                                  {parseFloat(
                                                                    row.unaffected_area_km2
                                                                  ).toFixed(2)}
                                                                </td>
                                                                <td className="py-1 pl-1 pr-0 text-center">
                                                                  <span
                                                                    className={`font-semibold ${
                                                                      row.percentage_affected >
                                                                      50
                                                                        ? "text-[#FFD700]"
                                                                        : row.percentage_affected >
                                                                          25
                                                                        ? "text-yellow-400"
                                                                        : "text-gray-300"
                                                                    }`}
                                                                  >
                                                                    {parseFloat(
                                                                      row.percentage_affected
                                                                    ).toFixed(
                                                                      2
                                                                    )}
                                                                  </span>
                                                                </td>
                                                              </tr>
                                                            )
                                                          )}
                                                        </tbody>
                                                      </table>
                                                    </div>
                                                  </div>
                                                )}
                                              {element.featureExposureBreakdown &&
                                                element.featureExposureBreakdown
                                                  .length > 0 && (
                                                  <div className="mt-2 pt-2 border-t border-gray-600">
                                                    <h6 className="text-[9px] font-semibold text-white mb-1.5">
                                                      Affected administrative
                                                      units
                                                    </h6>
                                                    <p className="text-[8px] text-gray-500 mb-1.5">
                                                      Each row is one boundary
                                                      polygon; % is that unit’s
                                                      area inside the hazard.
                                                    </p>
                                                    <div
                                                      className="max-h-[200px] overflow-y-auto"
                                                      style={{
                                                        scrollbarWidth: "thin",
                                                        scrollbarColor:
                                                          "#706f6f transparent",
                                                      }}
                                                    >
                                                      <table className="w-full text-[9px]">
                                                        <thead className="sticky top-0 bg-[#3a3a3a] z-10">
                                                          <tr className="text-gray-400 border-b border-gray-600">
                                                            <th className="text-left py-1 pr-2 pl-0">
                                                              Name
                                                            </th>
                                                            <th className="text-center py-1 px-1">
                                                              Total (km²)
                                                            </th>
                                                            <th className="text-center py-1 px-1">
                                                              Affected (km²)
                                                            </th>
                                                            <th className="text-center py-1 pl-1 pr-0">
                                                              % exposed
                                                            </th>
                                                          </tr>
                                                        </thead>
                                                        <tbody>
                                                          {element.featureExposureBreakdown.map(
                                                            (
                                                              row: any,
                                                              idx: number
                                                            ) => (
                                                              <tr
                                                                key={
                                                                  row.boundaryId ??
                                                                  `${row.boundaryName}-${idx}`
                                                                }
                                                                className="border-b border-gray-700 last:border-b-0 hover:bg-[#404040] transition"
                                                                title={
                                                                  row.boundaryId
                                                                    ? `ID: ${row.boundaryId}`
                                                                    : undefined
                                                                }
                                                              >
                                                                <td className="py-1 pr-2 pl-0 text-white max-w-[140px] truncate">
                                                                  {
                                                                    row.boundaryName
                                                                  }
                                                                </td>
                                                                <td className="py-1 px-1 text-center text-gray-300">
                                                                  {Number(
                                                                    row.totalAreaKm2
                                                                  ).toFixed(2)}
                                                                </td>
                                                                <td className="py-1 px-1 text-center text-gray-300">
                                                                  {Number(
                                                                    row.affectedAreaKm2
                                                                  ).toFixed(2)}
                                                                </td>
                                                                <td className="py-1 pl-1 pr-0 text-center">
                                                                  <span
                                                                    className={`font-semibold ${
                                                                      Number(
                                                                        row.percentAffected
                                                                      ) > 50
                                                                        ? "text-[#FFD700]"
                                                                        : Number(
                                                                              row.percentAffected
                                                                            ) >
                                                                          25
                                                                        ? "text-yellow-400"
                                                                        : "text-gray-300"
                                                                    }`}
                                                                  >
                                                                    {Number(
                                                                      row.percentAffected
                                                                    ).toFixed(2)}
                                                                    %
                                                                  </span>
                                                                </td>
                                                              </tr>
                                                            )
                                                          )}
                                                        </tbody>
                                                      </table>
                                                    </div>
                                                  </div>
                                                )}
                                            </>
                                          )}
                                        </div>
                                      );
                                    }
                                  )}
                                </div>
                              </div>
                            );
                          }
                        );
                      })()}
                    </div>
                  </>
                ) : null}
              </div>

              {/* Footer Buttons */}
              {!isAnalysisRunning &&
                !exposureResultsMinimized &&
                exposureResultsData && (
                  <div className="flex gap-2 px-2.5 pb-2.5">
                    <button className="flex-1 py-1.5 rounded bg-[#5A5C99] text-white hover:opacity-90 transition text-[10px] font-medium">
                      Export Report
                    </button>
                    <button
                      onClick={() => {
                        setShowExposureResults(false);
                        setExposureResultsData(null);
                        setExposureResultsPosition({ x: 0, y: 0 });
                        setIsAnalysisRunning(false);
                        handleClearAffectedAreas();
                      }}
                      className="flex-1 py-1.5 rounded bg-[#5A5C99] text-white hover:opacity-90 transition text-[10px] font-medium"
                    >
                      Close Analysis
                    </button>
                  </div>
                )}
            </div>
          )}
          {/* Center Bottom Clock - Hide when expanded */}
          {!isChatExpanded && (
            <CenterBottomClock
              isBoundaryLoading={isBoundaryLoading}
              boundaryLoadingStage={boundaryLoadingStage}
              isFileLoading={isFileLoading}
              fileLoadingStage={fileLoadingStage}
            />
          )}
        </>
      )}

      {/* Reset confirmation — replaces browser confirm() */}
      {showResetConfirmModal && (
        <div
          className="fixed inset-0 z-[10000] flex items-center justify-center bg-black/60 backdrop-blur-[2px] p-4"
          role="presentation"
          onClick={() => setShowResetConfirmModal(false)}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="reset-modal-title"
            className="bg-[#2E2E2E] rounded-xl shadow-2xl border border-white/10 p-5 max-w-[400px] w-full"
            onClick={(e) => e.stopPropagation()}
          >
            <h2
              id="reset-modal-title"
              className="text-white text-sm font-semibold mb-2"
            >
              Reset map?
            </h2>
            <p className="text-[#C7C7C7] text-[11px] leading-relaxed mb-5">
              This clears everything drawn on the map and resets zoom level,
              angle, style, orientation, and position.
            </p>
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowResetConfirmModal(false)}
                className="px-3 py-1.5 rounded-md text-[11px] font-medium text-[#C7C7C7] border border-white/20 hover:bg-white/5 transition"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowResetConfirmModal(false);
                  performGlobalReset();
                }}
                className="px-3 py-1.5 rounded-md text-[11px] font-medium text-[#2E2E2E] bg-gradient-to-b from-[#9699FF] to-white hover:opacity-90 transition"
              >
                Reset
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
