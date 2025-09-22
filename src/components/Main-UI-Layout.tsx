// Main-UI-Layout.tsx
"use client";

import { useEffect, useRef, useState, useCallback } from "react";

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

export default function MainUILayout() {
  const [searchText, setSearchText] = useState("");
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [highlightedIndex, setHighlightedIndex] = useState<number>(-1);
  const [isDesktop, setIsDesktop] = useState(true);
  const [viewMode, setViewMode] = useState<"2d" | "3d">("2d");
  const [showChat, setShowChat] = useState(false);
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

  const squareRatio = 1; // 1:1 square
  const rectangleRatio = 16 / 9; // rectangle ratio (can change to 4/3 etc.)

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
      if (!(isDrawingBox || isDrawingRectangle)) return;
      boxCoordsRef.current.start = [e.lngLat.lng, e.lngLat.lat];
      boxCoordsRef.current.end = null;
    }

    function onMouseMove(e: any) {
      if (!(isDrawingBox || isDrawingRectangle) || !boxCoordsRef.current.start)
        return;

      const map = mapRef.current.getMap();

      // Start and current mouse positions in pixels
      const startPixel = map.project(boxCoordsRef.current.start);
      const currentPixel = map.project([e.lngLat.lng, e.lngLat.lat]);

      let dx = currentPixel.x - startPixel.x;
      let dy = currentPixel.y - startPixel.y;

      // --- FIXED RATIO LOGIC (in pixels) ---
      let aspectRatio = 1; // square
      if (isDrawingRectangle) aspectRatio = rectangleRatio; // e.g. 16/9

      if (Math.abs(dx) / Math.abs(dy || 1) > aspectRatio) {
        // too wide → adjust height
        dy = (Math.sign(dy || 1) * Math.abs(dx)) / aspectRatio;
      } else {
        // too tall → adjust width
        dx = Math.sign(dx || 1) * Math.abs(dy) * aspectRatio;
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
      if (!(isDrawingBox || isDrawingRectangle)) return;
      setIsDrawingBox(false);
      setIsDrawingRectangle(false);

      const map = mapRef.current.getMap();
      map.getCanvas().style.cursor = "";
      map.dragPan.enable();

      setShapeDrawn(true);
      setScopeConfirmed(false);
    }

    map.on("mousedown", onMouseDown);
    map.on("mousemove", onMouseMove);
    map.on("mouseup", onMouseUp);

    return () => {
      map.off("mousedown", onMouseDown);
      map.off("mousemove", onMouseMove);
      map.off("mouseup", onMouseUp);
    };
  }, [isDrawingBox, isDrawingRectangle]);

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
  };

  const switchTo3D = () => {
    setViewMode("3d");
    handleTimeOfDayChange("Auto");
    mapRef.current?.switchTo3D?.(selectedMapStyle);
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

  return (
    <div className="relative w-screen h-screen overflow-hidden">
      {!isDesktop ? (
        <div className="flex items-center justify-center w-screen h-screen bg-[#1a1a1a] text-white text-center px-4">
          <div className="max-w-sm text-lg">
            🚫 This app is best viewed on a desktop or laptop.
          </div>
        </div>
      ) : (
        <>
          <MapComponent ref={mapRef} />

          {/* Center Top Controls */}
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

          {/* Center Left Controls */}
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

          {/* Location Search Bar or Pathfinder Controls*/}
          {!showPathfinder ? (
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
          )}

          {/* Panels */}
          {showSelectMaps && (
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

          {showPlanningTools && (
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

          {showAssessmentTools && (
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

          {showToolPanel && (
            <div className="absolute left-[96px] top-[73px] w-96 z-40">
              <ToolPanel
                isVisible={true}
                selectedMaps={selectedMaps}
                selectedPlanningTools={selectedPlanningTools}
                selectedAssessmentTools={selectedAssessmentTools}
                mapRef={mapRef}
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
              />
            </div>
          )}

          {/* User Settings Button at Bottom Left */}
          <UserSettings />

          {/* Right Side Controls */}
          <RightSideControls
            show3DControls={show3DControls}
            viewMode={viewMode}
            switchTo2D={switchTo2D}
            switchTo3D={switchTo3D}
            handleZoom={handleZoom}
            mapRef={mapRef}
          />

          {/* SafeGIS AI Chat Button */}
          <SafeGISAIChat
            isVisible={showChat}
            mapRef={mapRef}
            toggleChat={() => setShowChat((prev) => !prev)}
            viewMode={viewMode}
            switchTo2D={switchTo2D}
            switchTo3D={switchTo3D}
            setViewMode={setViewMode}
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
            }}
            volcanoListControlCallbacks={{
              enableVolcanoList,
              disableVolcanoList,
              isVolcanoListEnabled,
            }}
            activeFaultsControlCallbacks={{
              enableActiveFaults,
              disableActiveFaults,
              isActiveFaultsEnabled,
            }}
            congestionControlCallbacks={{
              enableCongestion,
              disableCongestion,
              isCongestionEnabled,
              stopCongestionPolling,
              getCongestionSharedRefs,
            }}
          />

          {/* Center Bottom Clock */}
          <CenterBottomClock />
        </>
      )}
    </div>
  );
}
