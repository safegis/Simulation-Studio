"use client";

import {
  Earth,
  MapPinned,
  ListTodo,
  OctagonAlert,
  Search,
  ZoomIn,
  ZoomOut,
  Square,
  Box,
  ChevronDown,
  Sunrise,
  Sun,
  Sunset,
  Moon,
  CircleUser,
  PanelLeft,
  Layers2,
  X,
  RotateCcw,
  Plus,
} from "lucide-react";
import {
  CropSquare,
  Crop32,
  Crop169,
  Crop54,
  Crop75,
} from "@mui/icons-material";
import { useEffect, useRef, useState, useCallback } from "react";

import MapComponent from "./Map";
import SafeGISAIChat from "./controls/SafeGIS AI/SafeGIS-AI-Chat";
import SelectMaps from "./controls/Maps/SelectMaps";
import PathfinderControls from "./controls/Pathfinder/PathfinderControls";
import SelectPlanningTools from "./controls/Planning Suite/SelectPlanningTools";
import ToolPanel from "./controls/ToolPanel";
import SyncIcon from "@mui/icons-material/Sync";
import type { FeatureCollection, Geometry, GeoJsonProperties } from "geojson";

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
  const [currentTimeFormatted, setCurrentTimeFormatted] = useState("");
  const [showTimeOfDayDropdown, setShowTimeOfDayDropdown] = useState(false);
  const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;
  const [showMapStyleDropdown, setShowMapStyleDropdown] = useState(false);
  const [autoLightingInterval, setAutoLightingInterval] =
    useState<NodeJS.Timeout | null>(null);
  const [selectedTimeOfDay, setSelectedTimeOfDay] = useState<string | null>(
    null
  );
  const [show3DControls, setShow3DControls] = useState(true);
  const [selectedMapStyle, setSelectedMapStyle] = useState<string>("Default");
  const [showToolPanel, setShowToolPanel] = useState(false);
  const [selectedMaps, setSelectedMaps] = useState<string[]>([]);
  const [selectedPlanningTools, setSelectedPlanningTools] = useState<string[]>(
    []
  );

  const [showGeoJSONPanel, setShowGeoJSONPanel] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<{
    name: string;
    date: string;
  } | null>(null);

  const [isDrawingBox, setIsDrawingBox] = useState(false); // Square
  const [isDrawingRectangle, setIsDrawingRectangle] = useState(false); // Rectangle

  const [shapeDrawn, setShapeDrawn] = useState(false);
  const [scopeConfirmed, setScopeConfirmed] = useState(false);

  const squareRatio = 1; // 1:1 square
  const rectangleRatio = 16 / 9; // rectangle ratio (can change to 4/3 etc.)

  // NEW: Track uploaded files
  const [uploadedFiles, setUploadedFiles] = useState<
    { name: string; layerName: string }[]
  >([]);

  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFiles = async (files: FileList) => {
    for (const file of Array.from(files)) {
      const ext = file.name.split(".").pop()?.toLowerCase();
      try {
        let geojson:
          | FeatureCollection<Geometry, GeoJsonProperties>
          | FeatureCollection<Geometry, GeoJsonProperties>[]
          | null = null;

        if (ext === "geojson" || ext === "json") {
          const text = await file.text();
          geojson = JSON.parse(text);
        } else if (ext === "kml") {
          const text = await file.text();
          const dom = new DOMParser().parseFromString(text, "text/xml");
          const toGeoJSON = await import("@mapbox/togeojson");
          geojson = toGeoJSON.kml(dom) as FeatureCollection<
            Geometry,
            GeoJsonProperties
          >;
        } else if (ext === "zip" || ext === "shp") {
          const arrayBuffer = await file.arrayBuffer();
          const shp = (await import("shpjs")).default;
          geojson = await shp(arrayBuffer);
        }

        if (geojson) {
          if (Array.isArray(geojson)) {
            geojson.forEach((fc, i) => {
              mapRef.current?.addGeoJSONLayer(fc, `${file.name}-layer${i + 1}`);
            });
          } else {
            mapRef.current?.addGeoJSONLayer(geojson, file.name);
            setUploadedFiles((prev) => [
              ...prev,
              { name: file.name, layerName: file.name },
            ]);
          }
        }
      } catch (err) {
        console.error("Error processing file:", file.name, err);
      }
    }
  };

  // --- Drag & Drop handlers ---
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFiles(e.dataTransfer.files);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => setIsDragging(false);

  const handleRemoveFile = (layerName: string) => {
    if (!mapRef.current) return;

    // Sanitize the layerName (must match how you added it on map)
    const safeName = layerName.replace(/[^a-zA-Z0-9_-]/g, "");
    const sourceId = `upload-${safeName}`;
    const baseId = `${sourceId}-layer`;

    // Remove layers and source from map
    const map = mapRef.current.getMap();
    if (map) {
      ["fill", "line", "circle"].forEach((type) => {
        const layerId = `${baseId}-${type}`;
        if (map.getLayer(layerId)) map.removeLayer(layerId);
      });

      if (map.getSource(sourceId)) map.removeSource(sourceId);
    }

    // Remove from state list
    setUploadedFiles((prev) => prev.filter((f) => f.layerName !== layerName));

    // 🔑 Reset file input so same file can be uploaded again
    const inputEl = document.getElementById("geo-upload") as HTMLInputElement;
    if (inputEl) inputEl.value = "";
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
    const updateTime = () => {
      const now = new Date();
      const timeStr = now.toLocaleTimeString(undefined, {
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
        hour12: true,
      });
      const dayStr = now.toLocaleDateString(undefined, { weekday: "short" });
      const dateStr = now.toLocaleDateString(undefined, {
        month: "long",
        day: "numeric",
        year: "numeric",
      });
      setCurrentTimeFormatted(`${timeStr} - ${dayStr} | ${dateStr}`);
    };

    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

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
      "Outdoors",
      "Light",
      "Dark",
      "Navigation (Day)",
      "Navigation (Night)",
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
      case "Default":
        map.setMapStyle(
          viewMode === "3d"
            ? "mapbox://styles/shain34/cmesokqei00z501sdedixesto"
            : "mapbox://styles/mapbox/streets-v12"
        );
        break;
      case "Satellite":
        map.setMapStyle("mapbox://styles/mapbox/standard-satellite");
        break;
      case "Outdoors":
        map.setMapStyle("mapbox://styles/mapbox/outdoors-v12");
        break;
      case "Light":
        map.setMapStyle("mapbox://styles/mapbox/light-v11");
        break;
      case "Dark":
        map.setMapStyle("mapbox://styles/mapbox/dark-v11");
        break;
      case "Navigation (Day)":
        map.setMapStyle("mapbox://styles/mapbox/navigation-day-v1");
        break;
      case "Navigation (Night)":
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

          {/* ✅ Rectangle container above the clock */}
          {selectedPlan && (!shapeDrawn || !scopeConfirmed) && (
            <div
              className="absolute bottom-[110px] left-1/2 transform -translate-x-1/2 
                  bg-[#2E2E2E] flex flex-col items-center justify-center 
                  rounded-3xl shadow-2xl text-center z-50 px-8 py-6"
            >
              <span className="text-white text-md font-medium mb-6">
                Define Scope
              </span>

              <div className="flex items-center justify-center gap-6 w-full">
                {/* Square button */}
                <button
                  onClick={() => {
                    setIsDrawingBox(true);
                    if (mapRef.current) {
                      const map = mapRef.current.getMap();
                      map.getCanvas().style.cursor = "crosshair";
                      map.dragPan.disable();
                    }
                  }}
                  className="w-[90px] flex flex-col items-center justify-center px-6 py-4 
             rounded-xl border-3 border-dashed border-[#9699FF] 
             text-[#9699FF] transition-colors duration-200 
             hover:border-[#7F81D9] hover:text-[#7F81D9]"
                >
                  <CropSquare fontSize="medium" />
                  <span className="mt-2 text-sm text-white">1 : 1</span>
                </button>

                {/* Rectangle 3:2 button */}
                <button
                  className="w-[90px] flex flex-col items-center justify-center px-6 py-4 
             rounded-xl border-3 border-dashed border-[#9699FF] 
             text-[#9699FF] transition-colors duration-200 
             hover:border-[#7F81D9] hover:text-[#7F81D9]"
                >
                  <Crop32 fontSize="medium" />
                  <span className="mt-2 text-sm text-white">4 : 3</span>
                </button>

                {/* Rectangle 5:4 button */}
                <button
                  className="w-[90px] flex flex-col items-center justify-center px-6 py-4 
             rounded-xl border-3 border-dashed border-[#9699FF] 
             text-[#9699FF] transition-colors duration-200 
             hover:border-[#7F81D9] hover:text-[#7F81D9]"
                >
                  <Crop54 fontSize="medium" />
                  <span className="mt-2 text-sm text-white">5 : 4</span>
                </button>

                {/* Rectangle 7:5 button */}
                <button
                  className="w-[90px] flex flex-col items-center justify-center px-6 py-4 
             rounded-xl border-3 border-dashed border-[#9699FF] 
             text-[#9699FF] transition-colors duration-200 
             hover:border-[#7F81D9] hover:text-[#7F81D9]"
                >
                  <Crop75 fontSize="medium" />
                  <span className="mt-2 text-sm text-white">7 : 5</span>
                </button>

                {/* Rectangle 16:9 button */}
                <button
                  onClick={() => {
                    setIsDrawingRectangle(true);
                    if (mapRef.current) {
                      const map = mapRef.current.getMap();
                      map.getCanvas().style.cursor = "crosshair";
                      map.dragPan.disable();
                    }
                  }}
                  className="w-[90px] flex flex-col items-center justify-center px-6 py-4 
             rounded-xl border-3 border-dashed border-[#9699FF] 
             text-[#9699FF] transition-colors duration-200 
             hover:border-[#7F81D9] hover:text-[#7F81D9]"
                >
                  <Crop169 fontSize="medium" />
                  <span className="mt-2 text-sm text-white">16 : 9</span>
                </button>
              </div>

              {/* Centered text under the buttons */}
              <span className="text-[#858585] text-sm font-medium mt-4">
                --- Select ratio ---
              </span>

              {/* ✅ Show Save/Cancel only if shape has been drawn */}
              {shapeDrawn && (
                <div className="flex gap-4 mt-6">
                  <button
                    onClick={() => setScopeConfirmed(true)}
                    className="px-6 py-2 rounded-lg bg-[#9699FF] text-white font-medium 
                     hover:bg-[#7F81D9] transition"
                  >
                    Save
                  </button>
                  <button
                    onClick={() => {
                      const map = mapRef.current?.getMap();
                      if (map?.getSource("drawn-box")) {
                        map.removeLayer("drawn-box-layer");
                        map.removeLayer("drawn-box-outline");
                        map.removeSource("drawn-box");
                      }
                      setShapeDrawn(false);
                      setScopeConfirmed(false);
                    }}
                    className="px-6 py-2 rounded-lg bg-[#444] text-white font-medium 
                     hover:bg-[#666] transition"
                  >
                    Cancel
                  </button>
                </div>
              )}
            </div>
          )}

          {selectedPlan && shapeDrawn && scopeConfirmed && (
            <div className="absolute bottom-[110px] left-1/2 transform -translate-x-1/2 bg-[#2E2E2E] flex flex-row items-stretch rounded-3xl shadow-2xl text-center z-50 p-6 gap-6">
              {/* Left Column: Scope Details Box */}
              <div className="flex flex-col items-start gap-4 flex-shrink-0">
                <div className="w-[260px] border-2 border-dashed border-[#9699FF] rounded-xl text-white p-3 flex flex-col justify-between h-full">
                  {/* Centered Title */}
                  <span className="text-sm font-medium text-center w-full">
                    Scope Details
                  </span>

                  {/* Left-aligned labels */}
                  <div className="flex flex-col items-start gap-1 mt-2">
                    <span className="text-xs text-gray-400">Corners:</span>
                    <span className="text-xs text-gray-400">Length:</span>
                    <span className="text-xs text-gray-400">Width:</span>
                  </div>

                  {/* Edit Scope Button under Scope Details Box */}
                  <button
                    onClick={() => setScopeConfirmed(false)}
                    className="mt-4 px-4 py-2 rounded-lg bg-[#5A5C99] text-white text-xs font-medium hover:opacity-90 transition"
                  >
                    Edit Scope
                  </button>
                </div>
              </div>

              {/* Right Column: Existing 3 Boxes */}
              <div className="flex flex-row gap-6 w-full items-stretch">
                {/* Box 1 */}
                <div className="flex-1 min-w-[600px] border-2 border-dashed border-[#9699FF] rounded-xl text-white p-3 flex flex-col items-start h-full">
                  {/* Centered Plot Routes Title */}
                  <span className="text-sm font-medium mb-2 text-center w-full">
                    Plot Routes
                  </span>

                  {/* Row container for the two button sections */}
                  <div className="flex flex-row gap-2 w-full mt-2 flex-1">
                    {/* Left: Add Starting Points */}
                    <div className="flex flex-col flex-1 items-start gap-0.5">
                      <span className="text-xs font-medium text-gray-200 mb-1">
                        Starting Points
                      </span>
                      <div className="w-full h-20 border-2 border-dashed border-[#9699FF] bg-transparent rounded-lg mb-1 flex items-center justify-center text-gray-400 text-xs">
                        No added starting points yet
                      </div>
                      <div className="w-full flex justify-end">
                        <button className="w-24 px-2 py-1 text-xs rounded-lg bg-[#5A5C99] text-white hover:opacity-90 transition">
                          Add
                        </button>
                      </div>
                    </div>

                    {/* Right: Mark Evacuation Areas */}
                    <div className="flex flex-col flex-1 items-start gap-0.5">
                      <span className="text-xs font-medium text-gray-200 mb-1">
                        Evacuation Areas
                      </span>
                      <div className="w-full h-20 border-2 border-dashed border-[#9699FF] bg-transparent rounded-lg mb-1 flex items-center justify-center text-gray-400 text-xs">
                        No marked evacuation areas yet
                      </div>
                      <div className="w-full flex justify-end">
                        <button className="w-24 px-2 py-1 text-xs rounded-lg bg-[#5A5C99] text-white hover:opacity-90 transition">
                          Add
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Time of Day + Map Style */}
          <div className="absolute top-[18px] left-1/2 transform -translate-x-1/2 z-50">
            <div className="flex gap-[18px] relative">
              {viewMode === "3d" && selectedTimeOfDay !== null && (
                <div ref={timeOfDayRef} className="relative w-[190px]">
                  <button
                    onClick={() => setShowTimeOfDayDropdown((prev) => !prev)}
                    className="h-[55px] w-full px-5 flex items-center justify-between bg-[#2E2E2E] text-[#C7C7C7] rounded-xl shadow-md hover:bg-[#3a3a3a] transition text-base font-medium"
                  >
                    <span className="leading-none">Time of Day</span>
                    <ChevronDown size={22} />
                  </button>

                  {showTimeOfDayDropdown && (
                    <div className="absolute top-[60px] w-full bg-[#2E2E2E] rounded-xl shadow-md text-[#C7C7C7] p-3 z-50">
                      {[
                        "Auto",
                        "Morning",
                        "Daytime",
                        "Evening",
                        "Nighttime",
                      ].map((label, idx) => {
                        const isSelected = selectedTimeOfDay === label;

                        return (
                          <div
                            key={idx}
                            onClick={() => handleTimeOfDayChange(label)}
                            className={`p-2 rounded-md cursor-pointer flex items-center gap-2 transition ${
                              isSelected
                                ? "bg-gradient-to-r from-[#9699FF] to-white text-[#2E2E2E] font-medium"
                                : "hover:bg-[#3a3a3a] text-[#C7C7C7]"
                            }`}
                          >
                            {label === "Morning" ? (
                              <Sunrise
                                size={18}
                                color={isSelected ? "#2E2E2E" : "#C7C7C7"}
                              />
                            ) : label === "Daytime" ? (
                              <Sun
                                size={18}
                                color={isSelected ? "#2E2E2E" : "#C7C7C7"}
                              />
                            ) : label === "Evening" ? (
                              <Sunset
                                size={18}
                                color={isSelected ? "#2E2E2E" : "#C7C7C7"}
                              />
                            ) : label === "Nighttime" ? (
                              <Moon
                                size={18}
                                color={isSelected ? "#2E2E2E" : "#C7C7C7"}
                              />
                            ) : (
                              <SyncIcon
                                fontSize="small"
                                style={{
                                  color: isSelected ? "#2E2E2E" : "#C7C7C7",
                                }}
                              />
                            )}
                            {label}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}

              <div ref={mapStyleRef} className="relative w-[190px]">
                <button
                  onClick={() => setShowMapStyleDropdown((prev) => !prev)}
                  className="h-[55px] w-full px-5 flex items-center justify-between bg-[#2E2E2E] text-[#C7C7C7] rounded-xl shadow-md hover:bg-[#3a3a3a] transition text-base font-medium"
                >
                  <span className="leading-none">Map Style</span>
                  <ChevronDown size={22} />
                </button>

                {showMapStyleDropdown && (
                  <div className="absolute top-[60px] w-full bg-[#2E2E2E] rounded-xl shadow-md text-[#C7C7C7] p-3 z-50">
                    {[
                      "Default",
                      "Satellite",
                      "Outdoors",
                      "Light",
                      "Dark",
                      "Navigation (Day)",
                      "Navigation (Night)",
                    ].map((label, idx) => {
                      const isSelected = selectedMapStyle === label;

                      return (
                        <div
                          key={idx}
                          onClick={() => handleMapStyleChange(label)}
                          className={`p-2 rounded-md cursor-pointer transition flex items-center gap-2 ${
                            isSelected
                              ? "bg-gradient-to-r from-[#9699FF] to-white text-[#2E2E2E] font-medium"
                              : "hover:bg-[#3a3a3a] text-[#C7C7C7]"
                          }`}
                        >
                          {label}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Left Menu Container */}
          <div className="absolute top-1/2 left-[18px] -translate-y-1/2 z-50 flex flex-col items-center gap-[18px]">
            {/* Top 4 Buttons Group */}
            <div className="bg-[#2E2E2E] p-2 rounded-xl shadow-md w-[60px] flex flex-col gap-4">
              <button
                onClick={() => {
                  setShowSelectMaps((prev) => {
                    const newState = !prev;
                    if (newState) {
                      setShowPathfinder(false);
                      setShowPlanningTools(false);
                      setShowToolPanel(false);
                    }
                    return newState;
                  });
                }}
                className={`p-2 rounded-lg transition ${
                  showSelectMaps
                    ? "bg-gradient-to-b from-[#9699FF] to-white text-[#2E2E2E] hover:opacity-90"
                    : "hover:bg-[#3a3a3a] text-[#C7C7C7]"
                }`}
              >
                <Earth width={28} height={28} />
              </button>

              <button
                onClick={() => {
                  setShowPathfinder((prev) => {
                    const newState = !prev;
                    if (newState) {
                      setShowSelectMaps(false);
                      setShowPlanningTools(false);
                      setShowToolPanel(false);
                    }
                    return newState;
                  });
                }}
                className={`p-2 rounded-lg transition ${
                  showPathfinder
                    ? "bg-gradient-to-b from-[#9699FF] to-white text-[#2E2E2E] hover:opacity-90"
                    : "hover:bg-[#3a3a3a] text-[#C7C7C7]"
                }`}
              >
                <MapPinned width={28} height={28} />
              </button>

              <button
                onClick={() => {
                  setShowPlanningTools((prev) => {
                    const newState = !prev;
                    if (newState) {
                      setShowSelectMaps(false);
                      setShowPathfinder(false);
                      setShowToolPanel(false);
                    }
                    return newState;
                  });
                }}
                className={`p-2 rounded-lg transition ${
                  showPlanningTools
                    ? "bg-gradient-to-b from-[#9699FF] to-white text-[#2E2E2E] hover:opacity-90"
                    : "hover:bg-[#3a3a3a] text-[#C7C7C7]"
                }`}
              >
                <ListTodo width={28} height={28} />
              </button>

              <button className="hover:bg-[#3a3a3a] text-[#C7C7C7] p-2 rounded-lg transition">
                <OctagonAlert width={28} height={28} />
              </button>
            </div>

            {/* PanelLeft Button in Separate Container */}
            {(selectedMaps.length > 0 || selectedPlanningTools.length > 0) && (
              <div className="bg-[#2E2E2E] p-2 rounded-xl shadow-md w-[60px] flex justify-center">
                <button
                  onClick={() => {
                    setShowToolPanel((prev) => {
                      const newState = !prev;
                      if (newState) {
                        setShowSelectMaps(false);
                        setShowPathfinder(false);
                        setShowPlanningTools(false);
                      }
                      return newState;
                    });
                  }}
                  className={`p-2 rounded-lg transition ${
                    showToolPanel
                      ? "bg-gradient-to-b from-[#9699FF] to-white text-[#2E2E2E] hover:opacity-90"
                      : "hover:bg-[#3a3a3a] text-[#C7C7C7]"
                  }`}
                >
                  <PanelLeft width={28} height={28} />
                </button>
              </div>
            )}
          </div>

          {/* Search or Pathfinder */}
          {!showPathfinder ? (
            <div
              ref={searchContainerRef}
              className="absolute top-[18px] left-[96px] z-50 w-96"
            >
              <div className="bg-[#2E2E2E] h-[55px] flex items-center gap-3 px-4 py-2 rounded-xl shadow-md text-[#C7C7C7]">
                <Search width={26} height={26} />
                <input
                  ref={inputRef}
                  type="text"
                  placeholder="Enter location..."
                  value={searchText}
                  onChange={(e) => setSearchText(e.target.value)}
                  onKeyDown={handleKeyDown}
                  className="bg-transparent outline-none text-md text-[#C7C7C7] placeholder-[#999] w-full"
                />
              </div>

              {suggestions.length > 0 && (
                <ul
                  ref={suggestionsRef}
                  className="scrollbar-rounded absolute top-full left-0 mt-2 w-full bg-[#2E2E2E] rounded-xl shadow-lg max-h-60 overflow-y-auto z-50"
                >
                  {suggestions.map((place, index) => (
                    <li
                      key={index}
                      onClick={() => handleSuggestionSelect(place)}
                      className={`px-4 py-3 text-base cursor-pointer ${
                        highlightedIndex === index
                          ? "bg-[#3a3a3a] text-[#C7C7C7]"
                          : "text-[#C7C7C7] hover:bg-[#3a3a3a]"
                      }`}
                    >
                      {place.properties.formatted}
                    </li>
                  ))}
                </ul>
              )}
            </div>
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
                }}
                onSelectedPlanningToolsChange={setSelectedPlanningTools}
              />
            </div>
          )}
          {showToolPanel && (
            <div className="absolute left-[96px] top-[73px] w-96 z-40">
              <ToolPanel
                isVisible={true}
                selectedMaps={selectedMaps}
                selectedPlanningTools={selectedPlanningTools}
                mapRef={mapRef}
                onPlanSelect={(plan) => {
                  // ✅ toggle selection
                  setSelectedPlan((prev) =>
                    prev?.name === plan.name && prev?.date === plan.date
                      ? null
                      : plan
                  );
                }}
                activePlan={selectedPlan}
              />
            </div>
          )}

          {/* User Settings Button at Bottom Left */}
          <div className="absolute bottom-[18px] left-[18px] z-50">
            <div className="bg-[#2E2E2E] p-2 rounded-xl shadow-md w-[60px] flex justify-center">
              <button className="w-[44px] h-[44px] text-[#C7C7C7] text-[27px] font-semibold flex items-center justify-center hover:bg-[#3a3a3a] rounded-lg transition">
                <CircleUser size={28} />
              </button>
            </div>
          </div>

          {/* Right Side Controls */}
          <div className="absolute right-[18px] top-1/2 -translate-y-1/2 z-50 flex flex-col items-center gap-[18px]">
            {show3DControls && (
              <div className="relative bg-[#2E2E2E] p-2 rounded-xl shadow-md w-[60px] h-[112px] overflow-hidden">
                <div
                  className="absolute w-[44px] h-[44px] left-2 rounded-lg bg-gradient-to-b from-[#9699FF] to-white transition-all duration-300 ease-in-out"
                  style={{ top: viewMode === "2d" ? "8px" : "60px" }}
                />
                <div className="relative z-10 flex flex-col gap-2 items-center">
                  <button
                    onClick={switchTo2D}
                    className={`w-[44px] h-[44px] flex items-center justify-center rounded-lg transition-colors duration-300 ${
                      viewMode === "2d" ? "text-[#2E2E2E]" : "text-[#C7C7C7]"
                    }`}
                  >
                    <span className="font-semibold text-lg">2D</span>
                  </button>
                  <button
                    onClick={switchTo3D}
                    className={`w-[44px] h-[44px] flex items-center justify-center rounded-lg transition-colors duration-300 ${
                      viewMode === "3d" ? "text-[#2E2E2E]" : "text-[#C7C7C7]"
                    }`}
                  >
                    <span className="font-semibold text-lg">3D</span>
                  </button>
                </div>
              </div>
            )}

            <div className="bg-[#2E2E2E] p-2 rounded-xl shadow-md w-[60px] flex flex-col gap-2">
              <button
                onClick={() => handleZoom(1)}
                className="hover:bg-[#3a3a3a] text-[#C7C7C7] p-2 rounded-lg transition"
              >
                <ZoomIn width={28} height={28} />
              </button>
              <button
                onClick={() => handleZoom(-1)}
                className="hover:bg-[#3a3a3a] text-[#C7C7C7] p-2 rounded-lg transition"
              >
                <ZoomOut width={28} height={28} />
              </button>
            </div>

            <div className="relative bg-[#2E2E2E] p-2 rounded-xl shadow-md w-[60px] flex justify-center">
              <button
                onClick={() => setShowGeoJSONPanel((prev) => !prev)}
                className={`w-[44px] h-[44px] flex items-center justify-center rounded-lg transition ${
                  showGeoJSONPanel
                    ? "bg-gradient-to-b from-[#9699FF] to-white"
                    : "hover:bg-[#3a3a3a]"
                }`}
              >
                <Layers2
                  width={28}
                  height={28}
                  color={showGeoJSONPanel ? "#2E2E2E" : "#C7C7C7"}
                />
              </button>

              {showGeoJSONPanel && (
                <div className="absolute right-full mr-[18px] top-1/2 -translate-y-1/2 w-96 bg-[#2E2E2E] rounded-xl shadow-md p-6 z-40 flex flex-col items-center">
                  {/* optional little arrow that points to the button */}

                  <h3 className="text-lg font-semibold text-white mb-4">
                    Import Geospatial Data
                  </h3>

                  <div className="flex flex-col gap-2 w-full">
                    {uploadedFiles.map((file, idx) => (
                      <div
                        key={idx}
                        className="flex items-center justify-between bg-[#3a3a3a] text-white px-3 py-2 rounded-lg w-full"
                      >
                        <span className="truncate whitespace-nowrap overflow-hidden max-w-[80%]">
                          {file.name}
                        </span>
                        <button
                          onClick={() => handleRemoveFile(file.layerName)}
                          className="text-red-400 hover:text-red-600 flex-shrink-0 ml-2"
                        >
                          <X size={18} />
                        </button>
                      </div>
                    ))}

                    {/* Styled upload button with drag & drop */}
                    <div
                      onClick={() => fileInputRef.current?.click()}
                      onDragOver={handleDragOver}
                      onDragLeave={handleDragLeave}
                      onDrop={handleDrop}
                      className={`px-6 py-3 rounded-lg shadow-md cursor-pointer text-center w-full transition
                        ${
                          isDragging
                            ? "bg-transparent border-4 border-dashed border-[#9699FF] text-[#9699FF]"
                            : "bg-[#5A5C99] text-white hover:opacity-90"
                        }
                      `}
                    >
                      <span className="font-medium">Choose or drop a file</span>
                      <span className="block text-sm font-normal mt-1 text-[#E0E0E0]">
                        Supports: .geojson, .shp (zip), .kml
                      </span>
                    </div>

                    <input
                      ref={fileInputRef}
                      id="geo-upload"
                      type="file"
                      multiple
                      hidden
                      accept=".geojson,.json,.kml,.shp,.zip,application/geo+json,application/json,application/vnd.google-earth.kml+xml"
                      onChange={(e) => {
                        if (e.target.files) handleFiles(e.target.files);
                      }}
                    />
                  </div>

                  <input
                    id="geo-upload"
                    type="file"
                    multiple
                    className="hidden"
                    accept=".geojson,.json,.kml,.shp,.zip,application/geo+json,application/json,application/vnd.google-earth.kml+xml"
                    onChange={async (e) => {
                      const files = e.target.files;
                      if (!files) return;

                      for (const file of Array.from(files)) {
                        const ext = file.name.split(".").pop()?.toLowerCase();
                        try {
                          let geojson:
                            | FeatureCollection<Geometry, GeoJsonProperties>
                            | FeatureCollection<Geometry, GeoJsonProperties>[]
                            | null = null;

                          if (ext === "geojson" || ext === "json") {
                            const text = await file.text();
                            geojson = JSON.parse(text);
                          } else if (ext === "kml") {
                            const text = await file.text();
                            const dom = new DOMParser().parseFromString(
                              text,
                              "text/xml"
                            );
                            const toGeoJSON = await import("@mapbox/togeojson");
                            geojson = toGeoJSON.kml(dom) as FeatureCollection<
                              Geometry,
                              GeoJsonProperties
                            >;
                          } else if (ext === "zip" || ext === "shp") {
                            const arrayBuffer = await file.arrayBuffer();
                            const shp = (await import("shpjs")).default;
                            geojson = await shp(arrayBuffer);
                          }

                          if (geojson) {
                            if (Array.isArray(geojson)) {
                              geojson.forEach((fc, i) => {
                                mapRef.current?.addGeoJSONLayer(
                                  fc,
                                  `${file.name}-layer${i + 1}`
                                );
                              });
                            } else {
                              mapRef.current?.addGeoJSONLayer(
                                geojson,
                                file.name
                              );
                              setUploadedFiles((prev) => [
                                ...prev,
                                { name: file.name, layerName: file.name },
                              ]);
                            }
                          } else {
                            console.warn("Unsupported file:", file.name);
                          }
                        } catch (err) {
                          console.error(
                            "Error processing file:",
                            file.name,
                            err
                          );
                        }
                      }
                    }}
                  />
                </div>
              )}
            </div>

            {/* Boundaries Button */}
            <div className="bg-[#2E2E2E] p-2 rounded-xl shadow-md w-[60px] flex justify-center">
              <button className="w-[44px] h-[44px] text-[#C7C7C7] text-[27px] font-semibold flex items-center justify-center hover:bg-[#3a3a3a] rounded-lg transition">
                B
              </button>
            </div>
          </div>

          <SafeGISAIChat isVisible={showChat} mapRef={mapRef} />

          <button
            onClick={() => setShowChat((prev) => !prev)}
            className="absolute bottom-[18px] right-[18px] w-18 h-18 rounded-[15px] z-50 shadow-md flex items-center justify-center transition-all duration-300"
            style={{
              background: showChat
                ? "linear-gradient(to bottom, #6B6DCC, #2E2E2E)"
                : "linear-gradient(to bottom, #5A5C99, #232323)",
            }}
          >
            <img
              src="/Images/SafeGIS-AI-Logo.png"
              alt="SafeGIS AI Logo"
              className="w-12 h-12 -mt-[2.5px]"
            />
          </button>

          <div className="absolute bottom-[18px] left-1/2 transform -translate-x-1/2 z-50">
            <div
              className="w-[470px] h-[73px] px-5 py-3 text-[#ffffff] flex flex-col items-center justify-center text-center"
              style={{
                background:
                  "radial-gradient(circle, rgba(46,46,46,0.95) 0%, rgba(46,46,46,0.85) 30%, rgba(46,46,46,0.6) 55%, rgba(46,46,46,0.15) 88%, rgba(46,46,46,0.01) 100%)",
              }}
            >
              <div className="text-[17px] font-medium tracking-wide">
                {currentTimeFormatted}
              </div>
              <div className="text-[14px] mt-1 font-[600] bg-gradient-to-r from-[#9699FF] to-[#FFFFFF] bg-clip-text text-transparent">
                ({timeZone})
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
