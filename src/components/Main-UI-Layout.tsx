// \SafeGIS\Simulation-Studio\frontend\src\components\Main-UI-Layout.tsx
"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { ChevronDown } from "lucide-react";
import { PieChart, Pie, Cell, ResponsiveContainer, Sector } from "recharts";

import MapComponent from "./Map/MainCanvas";
import SafeGISAIChat from "./controls/SafeGIS AI/SafeGIS-AI-Chat";
import SelectMaps from "./controls/Features/Maps/SelectMaps";
import PathfinderControls from "./controls/Features/Pathfinder/PathfinderControls";
import LocationSearchBar from "./controls/Main/LocationSearchBar";
import SelectPlanningTools from "./controls/Features/Planning Suite/SelectPlanningTools";
import SelectAssessment from "./controls/Features/Assessment Tools/SelectAssessment";
import RightSideControls from "./controls/Main/CenterRightControls";
import CenterLeftControls from "./controls/Main/CenterLeftControls";

import UserSettings from "./controls/Main/UserSettings";
import CenterTopControls from "./controls/Main/CenterTopControls";
import CenterBottomClock from "./controls/Main/CenterBottomClock";
import ToolPanel from "./controls/Features/ToolPanel";
import CropDinIcon from "@mui/icons-material/CropDin";
import CropLandscapeIcon from "@mui/icons-material/CropLandscape";
import CropPortraitIcon from "@mui/icons-material/CropPortrait";
import Crop169Icon from "@mui/icons-material/Crop169";
import Crop32Icon from "@mui/icons-material/Crop32";
import Crop54Icon from "@mui/icons-material/Crop54";
import Crop75Icon from "@mui/icons-material/Crop75";
import CropFreeIcon from "@mui/icons-material/CropFree";

export default function MainUILayout() {
  const [searchText, setSearchText] = useState("");
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [highlightedIndex, setHighlightedIndex] = useState<number>(-1);
  const [isDesktop, setIsDesktop] = useState(true);
  const [viewMode, setViewMode] = useState<"2d" | "3d">("2d");
  const [showChat, setShowChat] = useState(false);
  const [isChatExpanded, setIsChatExpanded] = useState(false);
  const [showSelectMaps, setShowSelectMaps] = useState(false);
  const [showPathfinder, setShowPathfinder] = useState(false);
  const [showPlanningTools, setShowPlanningTools] = useState(false);

  const [showTimeOfDayDropdown, setShowTimeOfDayDropdown] = useState(false);

  const [showMapStyleDropdown, setShowMapStyleDropdown] = useState(false);
  const [autoLightingInterval, setAutoLightingInterval] =
    useState<NodeJS.Timeout | null>(null);
  const [selectedTimeOfDay, setSelectedTimeOfDay] = useState<string | null>(
    null
  );
  const [show3DControls, setShow3DControls] = useState(true);
  const [selectedMapStyle, setSelectedMapStyle] = useState<string>(
    "Default (Custom Mapbox Standard)"
  );
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

  // Uploaded files state (lifted from CenterRightControls)
  const [uploadedFiles, setUploadedFiles] = useState<
    { name: string; layerName: string }[]
  >([]);

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

  const handleSuggestionSelect = (place: any) => {
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
    setViewMode("3d");
    handleTimeOfDayChange("Auto");
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
    const waitForMapAndSync = async () => {
      let tries = 0;
      while (
        (!mapRef.current || !mapRef.current.setLightPreset) &&
        tries < 10
      ) {
        await new Promise((r) => setTimeout(r, 300));
        tries++;
      }

      if (mapRef.current?.setLightPreset) {
        handleTimeOfDayChange("Auto");
      }
    };

    waitForMapAndSync();
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
    if (!map) return;

    setSelectedMapStyle(label);
    setShowMapStyleDropdown(false);

    const disableLightingPresets = [
      "Outdoors (Mapbox)",
      "Light (Mapbox)",
      "Dark (Mapbox)",
      "Navigation Day (Mapbox)",
      "Navigation Night (Mapbox)",
    ];

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
    switch (label) {
      case "Default (Custom Mapbox Standard)":
        map.setMapStyle(
          viewMode === "3d"
            ? "mapbox://styles/shain34/cmesokqei00z501sdedixesto"
            : "mapbox://styles/mapbox/streets-v12"
        );
        break;
      case "Satellite (Mapbox)":
        map.setMapStyle("mapbox://styles/mapbox/standard-satellite");
        break;
      case "Outdoors (Mapbox)":
        map.setMapStyle("mapbox://styles/mapbox/outdoors-v12");
        break;
      case "Light (Mapbox)":
        map.setMapStyle("mapbox://styles/mapbox/light-v11");
        break;
      case "Dark (Mapbox)":
        map.setMapStyle("mapbox://styles/mapbox/dark-v11");
        break;
      case "Navigation Day (Mapbox)":
        map.setMapStyle("mapbox://styles/mapbox/navigation-day-v1");
        break;
      case "Navigation Night (Mapbox)":
        map.setMapStyle("mapbox://styles/mapbox/navigation-night-v1");
        break;
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
      if (!mapRef.current) return;

      if (autoLightingInterval) {
        clearInterval(autoLightingInterval);
        setAutoLightingInterval(null);
      }

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

      setSelectedTimeOfDay(label); // <--- Add this line
      setShowTimeOfDayDropdown(false);
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

  return (
    <div className="relative w-screen h-screen overflow-hidden flex">
      {!isDesktop ? (
        <div className="flex items-center justify-center w-screen h-screen bg-[#1a1a1a] text-white text-center px-4">
          <div className="max-w-sm text-lg">
            🚫 This app is best viewed on a desktop or laptop.
          </div>
        </div>
      ) : (
        <>
          <div
            className={`transition-all duration-300 ${
              isChatExpanded ? "w-[calc(100vw-500px)]" : "w-screen"
            } h-screen`}
          >
            <MapComponent ref={mapRef} />
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
            />
          )}
          {/* Location Search Bar or Pathfinder Controls - Hide when expanded */}
          {!isChatExpanded &&
            (!showPathfinder ? (
              <LocationSearchBar
                searchText={searchText}
                setSearchText={setSearchText}
                suggestions={suggestions}
                highlightedIndex={highlightedIndex}
                handleKeyDown={handleKeyDown}
                handleSuggestionSelect={handleSuggestionSelect}
                searchContainerRef={searchContainerRef}
                inputRef={inputRef}
                suggestionsRef={suggestionsRef}
              />
            ) : (
              <div className="absolute top-[18px] left-[96px] z-50">
                <PathfinderControls mapRef={mapRef} />
              </div>
            ))}
          {/* Panels - Hide when expanded */}
          {!isChatExpanded && showSelectMaps && (
            <div className="absolute left-[96px] top-[73px] w-96 z-40">
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
            <div className="absolute left-[96px] top-[73px] w-96 z-40">
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
            <div className="absolute left-[96px] top-[73px] w-96 z-40">
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
            <div className="absolute left-[96px] top-[73px] w-96 z-40">
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
              />
            </div>
          )}
          {/* User Settings Button at Bottom Left - Hide when expanded */}
          {!isChatExpanded && <UserSettings />}
          {/* Right Side Controls - Hide when expanded */}
          {!isChatExpanded && (
            <RightSideControls
              show3DControls={show3DControls}
              viewMode={viewMode}
              switchTo2D={switchTo2D}
              switchTo3D={switchTo3D}
              handleZoom={handleZoom}
              mapRef={mapRef}
              uploadedFiles={uploadedFiles}
              setUploadedFiles={setUploadedFiles}
            />
          )}
          {/* SafeGIS AI Chat Button */}
          <SafeGISAIChat
            isVisible={showChat}
            mapRef={mapRef}
            toggleChat={() => setShowChat((prev) => !prev)}
            onExpandToggle={setIsChatExpanded}
            viewMode={viewMode}
            switchTo2D={switchTo2D}
            switchTo3D={switchTo3D}
            setViewMode={setViewMode}
            selectedMapStyle={selectedMapStyle}
            handleMapStyleChange={handleMapStyleChange}
            earthquakeControlCallbacks={{
              enableEarthquakeHazard,
              disableEarthquakeHazard,
              isEarthquakeEnabled,
              stopEarthquakePolling: () => {
                if (earthquakeIntervalRef.current) {
                  clearInterval(earthquakeIntervalRef.current);
                  earthquakeIntervalRef.current = null;
                }
              },
              openToolPanel: () => {
                setShowToolPanel(true);
                setShowSelectMaps(false);
                setShowPathfinder(false);
                setShowPlanningTools(false);
                setShowAssessmentTools(false);
              },
              selectHazardLayers: () => {
                setSelectedMaps((prev) =>
                  prev.includes("Hazard Layers")
                    ? prev
                    : [...prev, "Hazard Layers"]
                );
              },
              expandHazardLayersDropdown: () => {
                setExpandedPanels((prev) => ({
                  ...prev,
                  "map-Hazard Layers": true,
                }));
              },
              expandGeologicalDropdown: () => setGeologicalExpanded(true),
            }}
            volcanoListControlCallbacks={{
              enableVolcanoList,
              disableVolcanoList,
              isVolcanoListEnabled,
              openToolPanel: () => {
                setShowToolPanel(true);
                setShowSelectMaps(false);
                setShowPathfinder(false);
                setShowPlanningTools(false);
                setShowAssessmentTools(false);
              },
              selectHazardLayers: () => {
                setSelectedMaps((prev) =>
                  prev.includes("Hazard Layers")
                    ? prev
                    : [...prev, "Hazard Layers"]
                );
              },
              expandHazardLayersDropdown: () => {
                setExpandedPanels((prev) => ({
                  ...prev,
                  "map-Hazard Layers": true,
                }));
              },
              expandGeologicalDropdown: () => setGeologicalExpanded(true),
            }}
            activeFaultsControlCallbacks={{
              enableActiveFaults,
              disableActiveFaults,
              isActiveFaultsEnabled,
              openToolPanel: () => {
                setShowToolPanel(true);
                setShowSelectMaps(false);
                setShowPathfinder(false);
                setShowPlanningTools(false);
                setShowAssessmentTools(false);
              },
              selectHazardLayers: () => {
                setSelectedMaps((prev) =>
                  prev.includes("Hazard Layers")
                    ? prev
                    : [...prev, "Hazard Layers"]
                );
              },
              expandHazardLayersDropdown: () => {
                setExpandedPanels((prev) => ({
                  ...prev,
                  "map-Hazard Layers": true,
                }));
              },
              expandGeologicalDropdown: () => setGeologicalExpanded(true),
            }}
            congestionControlCallbacks={{
              enableCongestion,
              disableCongestion,
              isCongestionEnabled,
              stopCongestionPolling,
              getCongestionSharedRefs,
              openToolPanel: () => {
                setShowToolPanel(true);
                setShowSelectMaps(false);
                setShowPathfinder(false);
                setShowPlanningTools(false);
                setShowAssessmentTools(false);
              },
              selectHazardLayers: () => {
                setSelectedMaps((prev) =>
                  prev.includes("Hazard Layers")
                    ? prev
                    : [...prev, "Hazard Layers"]
                );
              },
              expandHazardLayersDropdown: () => {
                setExpandedPanels((prev) => ({
                  ...prev,
                  "map-Hazard Layers": true,
                }));
              },
              expandTrafficDropdown: () => setTrafficExpanded(true),
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
              className="absolute z-50 bg-[#2E2E2E]/75 backdrop-blur-xs rounded-xl shadow-lg w-[650px] text-white"
              style={{
                bottom: `${109 - exposureResultsPosition.y}px`,
                left: `calc(50% + ${exposureResultsPosition.x}px)`,
                transform: "translateX(-50%)",
                cursor: isDraggingResults ? "grabbing" : "auto",
              }}
            >
              {/* Header */}
              <div
                className="flex justify-between items-center px-4 py-3 bg-[#3a3a3a] rounded-t-xl cursor-grab active:cursor-grabbing"
                onMouseDown={(e) => {
                  setIsDraggingResults(true);
                  dragStartPos.current = {
                    x: e.clientX - exposureResultsPosition.x,
                    y: e.clientY - exposureResultsPosition.y,
                  };
                }}
              >
                <h3 className="text-[15px] font-semibold">
                  Exposure Assessment Results
                </h3>
                {!isAnalysisRunning && (
                  <button
                    onClick={() =>
                      setExposureResultsMinimized(!exposureResultsMinimized)
                    }
                    className="text-white hover:text-gray-300 transition flex items-center"
                  >
                    <ChevronDown
                      size={22}
                      className={`transition-transform duration-200 ${
                        exposureResultsMinimized ? "rotate-180" : ""
                      }`}
                    />
                  </button>
                )}
              </div>
              {/* Content */}
              <div
                className={exposureResultsMinimized ? "px-4 pt-3" : "px-5 py-3"}
              >
                {isAnalysisRunning ? (
                  <div className="flex flex-col items-center justify-center py-12">
                    <div className="relative w-16 h-16 mb-4">
                      <div className="absolute inset-0 border-4 border-gray-600 rounded-full"></div>
                      <div className="absolute inset-0 border-4 border-t-[#9699FF] rounded-full animate-spin"></div>
                    </div>
                    <div className="text-white text-lg font-medium mb-2">
                      Running Assessment...
                    </div>
                    <div className="text-gray-400 text-sm">
                      Analyzing exposure data, please wait
                    </div>
                  </div>
                ) : exposureResultsData ? (
                  <>
                    {/* Analysis Overview */}
                    <div className="mb-5">
                      <h4 className="text-sm font-semibold mb-3">
                        Analysis Overview
                      </h4>
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        {/* Hazard Analyzed count */}
                        <div>
                          <div className="text-gray-400 mb-1">
                            Hazard/s Analyzed:
                          </div>
                          <div className="text-white">
                            {exposureResultsData.hazardBreakdown?.length || 1}{" "}
                          </div>
                        </div>
                        {/* NEW: Analysis Time duration */}
                        <div>
                          <div className="text-gray-400 mb-1">
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
                        <div>
                          <div className="text-gray-400 mb-1">Started at:</div>
                          <div className="text-white">
                            {exposureResultsData.startTime ? (
                              exposureResultsData.startTime
                            ) : (
                              <span className="text-gray-500">Running...</span>
                            )}
                          </div>
                        </div>
                        <div>
                          <div className="text-gray-400 mb-1">Finished at:</div>
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
                      </div>
                    </div>

                    {/* Results grouped by hazard */}
                    <div
                      className={`max-h-[350px] overflow-y-auto ${
                        !exposureResultsMinimized ? "pr-2" : ""
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
                              <div key={hazardIndex} className="mb-4">
                                {/* CHANGED: Always show header, removed condition */}
                                <div className="mb-2 pb-2 border-b border-gray-600">
                                  <div className="text-white font-semibold text-sm flex items-start gap-2">
                                    <span className="bg-[#5A5C99] px-2 py-1 rounded text-xs whitespace-nowrap">
                                      Hazard Data:
                                    </span>
                                    <div className="flex flex-col">
                                      <span className="text-xs">
                                        {hazardType}
                                      </span>
                                      {analysisArea && (
                                        <span className="text-xs text-gray-400 mt-0.5">
                                          {analysisArea}
                                        </span>
                                      )}
                                    </div>
                                  </div>
                                </div>

                                <div className="space-y-2">
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
                                          className={`bg-[#3a3a3a] rounded-lg ${
                                            exposureResultsMinimized
                                              ? "p-2.5"
                                              : "p-3"
                                          }`}
                                        >
                                          {/* Header */}
                                          {exposureResultsMinimized ? (
                                            <div className="flex items-center justify-between mb-0">
                                              <h5 className="text-sm font-medium text-left">
                                                {element.name}
                                              </h5>
                                              <span className="bg-[#FFD700] text-[#2E2E2E] px-2.5 py-1 rounded text-xs font-semibold whitespace-nowrap ml-2">
                                                {percentage.toFixed(2)}% Exposed
                                              </span>
                                            </div>
                                          ) : (
                                            <div className="mb-3">
                                              <h5 className="text-sm font-medium text-center">
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
                                                    width: "155px",
                                                    height: "155px",
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
                                                        innerRadius={50}
                                                        outerRadius={65}
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
                                                        innerRadius={50}
                                                        outerRadius={70}
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
                                                    <div className="text-white text-lg font-bold">
                                                      {percentage.toFixed(2)}%
                                                    </div>
                                                    <div className="text-gray-400 text-xs">
                                                      Exposed
                                                    </div>
                                                  </div>
                                                </div>
                                              </div>
                                              {/* Basic Stats */}
                                              <div className="text-sm space-y-1">
                                                <div className="flex justify-between">
                                                  <span className="text-gray-400">
                                                    {element.unit === "km"
                                                      ? "Total Length:"
                                                      : "Total Surface Area:"}
                                                  </span>
                                                  <span className="text-white">
                                                    {element.totalSurfaceArea}{" "}
                                                    {element.unit || "km²"}
                                                  </span>
                                                </div>
                                                <div className="flex justify-between">
                                                  <span className="text-gray-400">
                                                    {element.unit === "km"
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
                                                    {element.unit === "km"
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
                                                  <div className="mt-4 pt-3 border-t border-gray-600">
                                                    <h6 className="text-xs font-semibold text-white mb-3">
                                                      Affected{" "}
                                                      {element.unit === "km"
                                                        ? "Length"
                                                        : "Area"}{" "}
                                                      by Hazard Level
                                                    </h6>
                                                    <div className="grid grid-cols-3 gap-2">
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
                                                              className={`${colors.bg} ${colors.border} border-2 rounded-lg p-3 flex flex-col items-center justify-center`}
                                                            >
                                                              <div
                                                                className={`${colors.text} text-lg font-bold mb-1`}
                                                              >
                                                                {level.measure}{" "}
                                                                {level.unit}
                                                              </div>
                                                              <div className="text-white text-xs text-center font-medium">
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
                                                  <div className="mt-4 pt-3 border-t border-gray-600">
                                                    <h6 className="text-xs font-semibold text-white mb-2">
                                                      Breakdown by Land use
                                                    </h6>
                                                    <div
                                                      className="max-h-[250px] overflow-y-auto"
                                                      style={{
                                                        scrollbarWidth: "thin",
                                                        scrollbarColor:
                                                          "#706f6f transparent",
                                                      }}
                                                    >
                                                      <table className="w-full text-xs">
                                                        <thead className="sticky top-0 bg-[#3a3a3a] z-10">
                                                          <tr className="text-gray-400 border-b border-gray-600">
                                                            <th className="text-left py-2 pr-3 pl-0">
                                                              Land use
                                                            </th>
                                                            <th className="text-center py-2 px-2">
                                                              Total Area (km²)
                                                            </th>
                                                            <th className="text-center py-2 px-2">
                                                              Affected Area
                                                              (km²)
                                                            </th>
                                                            <th className="text-center py-2 px-2">
                                                              Unaffected Area
                                                              (km²)
                                                            </th>
                                                            <th className="text-center py-2 pl-2 pr-0">
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
                                                                  className="py-2 pr-3 pl-0 text-white"
                                                                  title={
                                                                    row.landuse
                                                                  }
                                                                >
                                                                  {row.landuse}
                                                                </td>
                                                                <td className="py-2 px-2 text-center text-gray-300">
                                                                  {parseFloat(
                                                                    row.total_area_km2
                                                                  ).toFixed(2)}
                                                                </td>
                                                                <td className="py-2 px-2 text-center text-gray-300">
                                                                  {parseFloat(
                                                                    row.affected_area_km2
                                                                  ).toFixed(2)}
                                                                </td>
                                                                <td className="py-2 px-2 text-center text-gray-300">
                                                                  {parseFloat(
                                                                    row.unaffected_area_km2
                                                                  ).toFixed(2)}
                                                                </td>
                                                                <td className="py-2 pl-2 pr-0 text-center">
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
                  <div className="flex gap-3 px-3.5 pb-3.5">
                    <button className="flex-1 py-2 rounded-md bg-[#5A5C99] text-white hover:opacity-90 transition text-sm font-medium">
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
                      className="flex-1 py-2 rounded-md bg-[#5A5C99] text-white hover:opacity-90 transition text-sm font-medium"
                    >
                      Close Analysis
                    </button>
                  </div>
                )}
            </div>
          )}
          {/* Center Bottom Clock - Hide when expanded */}
          {!isChatExpanded && <CenterBottomClock />}
        </>
      )}
    </div>
  );
}
