// \SafeGIS\Simulation-Studio\frontend\src\components\controls\Main\CenterRightControls.tsx
"use client";

import {
  ZoomIn,
  ZoomOut,
  Layers2,
  X,
  ChevronDown,
  Upload,
  Check,
  RotateCcw,
  Undo2,
  Redo2,
} from "lucide-react";
import {
  RefObject,
  useRef,
  useState,
  useEffect,
  forwardRef,
  useImperativeHandle,
} from "react";
import type { FeatureCollection, Geometry, GeoJsonProperties } from "geojson";
import { createPortal } from "react-dom";
import geoBoundariesData from "./Boundary Options/geoBoundaries.json";

// Ref interface for AI control
export interface CenterRightControlsRef {
  openBoundariesPanel: (
    source?: string,
    country?: string,
    adminLevel?: number
  ) => void;
  clearBoundaries: () => void;
  openImportFilesPanel: () => void;
  /** Close import / boundary panels and dropdowns. */
  closeAllPanels: () => void;
}

// Type for boundary data
interface BoundaryLevel {
  label: string;
  adminLevel: string;
}

interface CountryBoundary {
  name: string;
  code: string;
  levels: BoundaryLevel[];
}

type CountryBoundaries = Record<string, CountryBoundary>;

// Cast the imported JSON to the correct type
const countryBoundaries: CountryBoundaries =
  geoBoundariesData as CountryBoundaries;

// Derive boundary options from countryBoundaries keys (sorted alphabetically)
const boundaryOptions = Object.keys(countryBoundaries).sort();

interface RightSideControlsProps {
  show3DControls: boolean;
  viewMode: "2d" | "3d";
  switchTo2D: () => void;
  switchTo3D: () => void;
  handleZoom: (inc: number) => void;
  mapRef: RefObject<any>;
  uploadedFiles?: { name: string; layerName: string }[];
  setUploadedFiles?: React.Dispatch<
    React.SetStateAction<{ name: string; layerName: string }[]>
  >;
  isBoundaryLoading?: boolean;
  setIsBoundaryLoading?: React.Dispatch<React.SetStateAction<boolean>>;
  setBoundaryLoadingStage?: React.Dispatch<React.SetStateAction<string>>;
  isFileLoading?: boolean;
  setIsFileLoading?: React.Dispatch<React.SetStateAction<boolean>>;
  setFileLoadingStage?: React.Dispatch<React.SetStateAction<string>>;
  /** Reset map + all UI to defaults (from parent). */
  onGlobalReset?: () => void;
  canUndo?: boolean;
  canRedo?: boolean;
  onUndo?: () => void;
  onRedo?: () => void;
}

const RightSideControls = forwardRef<
  CenterRightControlsRef,
  RightSideControlsProps
>(
  (
    {
      show3DControls,
      viewMode,
      switchTo2D,
      switchTo3D,
      handleZoom,
      mapRef,
      uploadedFiles = [],
      setUploadedFiles = () => {},
      isBoundaryLoading: externalIsBoundaryLoading,
      setIsBoundaryLoading: externalSetIsBoundaryLoading,
      setBoundaryLoadingStage: externalSetBoundaryLoadingStage,
      isFileLoading: externalIsFileLoading,
      setIsFileLoading: externalSetIsFileLoading,
      setFileLoadingStage: externalSetFileLoadingStage,
      onGlobalReset,
      canUndo = false,
      canRedo = false,
      onUndo,
      onRedo,
    },
    ref
  ) => {
    const [showGeoJSONPanel, setShowGeoJSONPanel] = useState(false);
    const [isDragging, setIsDragging] = useState(false);
    const [showBoundariesPanel, setShowBoundariesPanel] = useState(false);
    const [sessionId] = useState(
      () => `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    );
    const [selectedBoundary, setSelectedBoundary] = useState<string | null>(
      null
    );
    const [boundarySearchTerm, setBoundarySearchTerm] = useState("");
    const boundaryButtonRef = useRef<HTMLButtonElement>(null);
    const [showBoundaryDropdown, setShowBoundaryDropdown] = useState(false);
    const [hoveredButton, setHoveredButton] = useState<string | null>(null);

    const fileInputRef = useRef<HTMLInputElement | null>(null);

    const [showBoundaryLevelDropdown, setShowBoundaryLevelDropdown] =
      useState(false);
    const [selectedBoundaryLevel, setSelectedBoundaryLevel] = useState<
      string | null
    >(null);
    const boundaryLevelButtonRef = useRef<HTMLButtonElement>(null);

    // Boundary source dropdown state
    const [selectedBoundarySource, setSelectedBoundarySource] = useState<
      string | null
    >(null);
    const [showBoundarySourceDropdown, setShowBoundarySourceDropdown] =
      useState(false);
    const boundarySourceButtonRef = useRef<HTMLButtonElement>(null);
    const boundarySourceOptions = ["geoBoundaries"];

    // Use external loading state if provided, otherwise use local state
    const [localIsBoundaryLoading, setLocalIsBoundaryLoading] = useState(false);
    const isBoundaryLoading =
      externalIsBoundaryLoading ?? localIsBoundaryLoading;
    const setIsBoundaryLoading =
      externalSetIsBoundaryLoading ?? setLocalIsBoundaryLoading;
    const setBoundaryLoadingStage =
      externalSetBoundaryLoadingStage ?? (() => {});

    // Use external file loading state if provided, otherwise use local state
    const [localIsFileLoading, setLocalIsFileLoading] = useState(false);
    const isFileLoading = externalIsFileLoading ?? localIsFileLoading;
    const setIsFileLoading = externalSetIsFileLoading ?? setLocalIsFileLoading;
    const setFileLoadingStage = externalSetFileLoadingStage ?? (() => {});

    // Expose methods for AI control via ref
    useImperativeHandle(ref, () => ({
      openBoundariesPanel: (
        source?: string,
        country?: string,
        adminLevel?: number
      ) => {
        console.log("🔵 AI opening boundaries panel:", {
          source,
          country,
          adminLevel,
        });

        // Open the panel
        setShowBoundariesPanel(true);

        // Set source if provided
        if (source) {
          setSelectedBoundarySource(source);
        }

        // Delay setting country and admin level to ensure panel is mounted
        setTimeout(() => {
          // Set country if provided
          if (country) {
            // Find the country in boundaryOptions (case-insensitive)
            // Match against both the full key (e.g., "Philippines (PH)") and the country name
            const matchedCountry = boundaryOptions.find((opt) => {
              const optLower = opt.toLowerCase();
              const countryLower = country.toLowerCase();
              // Check if the option starts with the country name
              return (
                optLower === countryLower ||
                optLower.startsWith(countryLower + " (")
              );
            });
            if (matchedCountry) {
              console.log("🔵 Setting country to:", matchedCountry);
              setSelectedBoundary(matchedCountry);

              // Set admin level if provided
              if (adminLevel !== undefined) {
                setTimeout(() => {
                  const countryData = countryBoundaries[matchedCountry];
                  if (countryData) {
                    // Find the level that matches the admin level
                    // Format is "admin0", "admin1", etc.
                    const level = countryData.levels.find(
                      (l) => l.adminLevel === `admin${adminLevel}`
                    );
                    if (level) {
                      console.log("🔵 Setting admin level to:", level.label);
                      setSelectedBoundaryLevel(level.label);
                    } else {
                      console.warn(
                        `🔵 Admin level admin${adminLevel} not found for ${matchedCountry}. Available levels:`,
                        countryData.levels.map((l) => l.adminLevel)
                      );
                    }
                  }
                }, 100);
              }
            } else {
              console.warn(
                `🔵 Country "${country}" not found in boundary options`
              );
            }
          }
        }, 100);
      },
      clearBoundaries: () => {
        console.log("🔵 AI clearing boundaries");
        // Clear all boundary selections
        setSelectedBoundarySource(null);
        setSelectedBoundary(null);
        setSelectedBoundaryLevel(null);
        // Close the panel
        setShowBoundariesPanel(false);
        // Clear boundaries from the map by calling the map's clear function
        if (mapRef?.current?.clearBoundaries) {
          mapRef.current.clearBoundaries();
        }
      },
      openImportFilesPanel: () => {
        setShowGeoJSONPanel(true);
        setShowBoundariesPanel(false);
      },
      closeAllPanels: () => {
        setShowGeoJSONPanel(false);
        setShowBoundariesPanel(false);
        setShowBoundaryDropdown(false);
        setShowBoundaryLevelDropdown(false);
        setShowBoundarySourceDropdown(false);
      },
    }));

    // ✅ File handling inside component
    const handleFiles = async (files: FileList) => {
      setIsFileLoading(true);
      setFileLoadingStage("Reading file...");
      try {
        for (const file of Array.from(files)) {
          const ext = file.name.split(".").pop()?.toLowerCase();
          try {
            let geojson:
              | FeatureCollection<Geometry, GeoJsonProperties>
              | FeatureCollection<Geometry, GeoJsonProperties>[]
              | null = null;

            if (ext === "geojson" || ext === "json") {
              setFileLoadingStage("Parsing GeoJSON...");
              const text = await file.text();
              geojson = JSON.parse(text);
            } else if (ext === "kml") {
              setFileLoadingStage("Parsing KML...");
              const text = await file.text();
              const dom = new DOMParser().parseFromString(text, "text/xml");
              const toGeoJSON = await import("@mapbox/togeojson");
              geojson = toGeoJSON.kml(dom) as FeatureCollection<
                Geometry,
                GeoJsonProperties
              >;
            } else if (ext === "zip" || ext === "shp") {
              try {
                setFileLoadingStage("Extracting shapefile...");
                const arrayBuffer = await file.arrayBuffer();
                const shp = (await import("shpjs")).default;
                setFileLoadingStage("Parsing shapefile...");
                let result: any = await shp(arrayBuffer);

                // Convert to JSON and back to remove circular references
                try {
                  const jsonStr = JSON.stringify(result);
                  result = JSON.parse(jsonStr);
                  console.log("Shapefile parsed and sanitized");
                } catch (jsonError) {
                  console.error(
                    "Could not serialize shapefile result, using as-is"
                  );
                }

                // shpjs typically returns a FeatureCollection directly
                if (result && result.type === "FeatureCollection") {
                  console.log(
                    "Direct FeatureCollection, features:",
                    result.features?.length
                  );
                  geojson = result;
                } else if (Array.isArray(result)) {
                  console.log("Array of FeatureCollections");
                  geojson = result;
                } else {
                  console.warn(
                    "Unexpected shapefile format, attempting to use as-is"
                  );
                  geojson = result;
                }
              } catch (shpError) {
                const errorMsg =
                  shpError instanceof Error
                    ? shpError.message
                    : "Unknown error";
                console.error("Error parsing shapefile:", errorMsg);
                throw new Error(`Shapefile parsing failed: ${errorMsg}`);
              }
            }

            if (geojson) {
              setFileLoadingStage("Processing geometry...");
              if (Array.isArray(geojson)) {
                // Handle multiple feature collections
                for (let i = 0; i < geojson.length; i++) {
                  const fc = geojson[i];
                  if (fc && fc.type === "FeatureCollection") {
                    setFileLoadingStage(`Rendering layer ${i + 1}...`);
                    const layerName = `${file.name}-layer${i + 1}`;
                    await mapRef.current?.addGeoJSONLayer(fc, layerName);
                    if (setUploadedFiles) {
                      setUploadedFiles((prev) => [
                        ...prev,
                        { name: `${file.name} (Layer ${i + 1})`, layerName },
                      ]);
                    }
                  }
                }
              } else if (geojson.type === "FeatureCollection") {
                setFileLoadingStage("Rendering on map...");
                await mapRef.current?.addGeoJSONLayer(geojson, file.name);
                if (setUploadedFiles) {
                  setUploadedFiles((prev) => [
                    ...prev,
                    { name: file.name, layerName: file.name },
                  ]);
                }
              }
            }
          } catch (err) {
            // Avoid logging circular references that cause stack overflow
            const errorMessage =
              err instanceof Error ? err.message : String(err);
            console.error(
              `Error processing file: "${file.name}"`,
              errorMessage
            );
            alert(`Failed to load ${file.name}: ${errorMessage}`);
          }
        }
      } finally {
        setIsFileLoading(false);
      }
    };

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

      const safeName = layerName.replace(/[^a-zA-Z0-9_-]/g, "");
      const sourceId = `upload-${safeName}`;
      const baseId = `${sourceId}-layer`;

      const map = mapRef.current.getMap();
      if (map) {
        ["fill", "line", "circle"].forEach((type) => {
          const layerId = `${baseId}-${type}`;
          if (map.getLayer(layerId)) map.removeLayer(layerId);
        });

        if (map.getSource(sourceId)) map.removeSource(sourceId);
      }

      if (setUploadedFiles) {
        setUploadedFiles((prev) =>
          prev.filter((f) => f.layerName !== layerName)
        );
      }

      if (fileInputRef.current) fileInputRef.current.value = "";
    };

    const getBoundaryLevelOptions = (selectedCountry: string | null) => {
      if (!selectedCountry) return [];
      return countryBoundaries[selectedCountry]?.levels || [];
    };

    // Effect to render boundary on map when selection changes
    useEffect(() => {
      if (!mapRef.current) return;

      // If no boundary level selected, remove any existing boundary layer
      if (!selectedBoundary || !selectedBoundaryLevel) {
        mapRef.current.removeBoundaryLayer?.();
        setIsBoundaryLoading(false);
        return;
      }

      // Get the country code and admin level
      const countryData = countryBoundaries[selectedBoundary];
      if (!countryData) return;

      const countryCode = countryData.code;
      const levelData = countryData.levels.find(
        (l) => l.label === selectedBoundaryLevel
      );
      if (!levelData) return;

      // Set loading state and add the boundary layer
      const loadBoundary = async () => {
        setIsBoundaryLoading(true);
        setBoundaryLoadingStage("Fetching boundary metadata...");
        try {
          setBoundaryLoadingStage("Downloading boundary data...");
          await mapRef.current.addBoundaryLayer?.(
            countryCode,
            levelData.adminLevel,
            levelData.label
          );
          setBoundaryLoadingStage("Rendering boundary...");
        } catch (error) {
          console.error("Error loading boundary:", error);
        } finally {
          setIsBoundaryLoading(false);
          setBoundaryLoadingStage("");
        }
      };

      loadBoundary();
    }, [selectedBoundary, selectedBoundaryLevel, mapRef]);

    return (
      <div className="absolute right-[15px] top-1/2 -translate-y-1/2 z-50 flex flex-col items-center gap-2">
        {/* 2D/3D Toggle */}
        {show3DControls && (
          <div className="relative bg-[#2E2E2E] p-1 rounded-md shadow-md w-[40px] overflow-hidden">
            <div
              className="absolute w-[32px] h-[32px] left-1 rounded bg-gradient-to-b from-[#9699FF] to-white transition-all duration-300 ease-in-out"
              style={{ top: viewMode === "2d" ? "4px" : "40px" }}
            />
            <div className="relative z-10 flex flex-col gap-1 items-center">
              <button
                onClick={switchTo2D}
                className={`w-[32px] h-[32px] inline-flex items-center justify-center rounded ${
                  viewMode === "2d" ? "text-[#2E2E2E]" : "text-[#C7C7C7]"
                }`}
              >
                <span className="font-semibold text-xs leading-none">2D</span>
              </button>
              <button
                onClick={switchTo3D}
                className={`w-[32px] h-[32px] inline-flex items-center justify-center rounded ${
                  viewMode === "3d" ? "text-[#2E2E2E]" : "text-[#C7C7C7]"
                }`}
              >
                <span className="font-semibold text-xs leading-none">3D</span>
              </button>
            </div>
          </div>
        )}

        {/* Zoom buttons */}
        <div className="bg-[#2E2E2E] p-1 rounded-md shadow-md w-[40px] flex flex-col gap-1">
          <button
            onClick={() => handleZoom(1)}
            className="w-[32px] h-[32px] hover:bg-[#3a3a3a] text-[#C7C7C7] inline-flex items-center justify-center rounded transition"
          >
            <ZoomIn size={18} className="shrink-0" />
          </button>
          <button
            onClick={() => handleZoom(-1)}
            className="w-[32px] h-[32px] hover:bg-[#3a3a3a] text-[#C7C7C7] inline-flex items-center justify-center rounded transition"
          >
            <ZoomOut size={18} className="shrink-0" />
          </button>
        </div>

        {/* GeoJSON Upload */}
        <div className="relative bg-[#2E2E2E] p-1 rounded-md shadow-md w-[40px] h-[40px] flex justify-center items-center">
          <button
            onClick={() => {
              setShowGeoJSONPanel((prev) => !prev);
              setShowBoundariesPanel(false); // Close boundaries panel
            }}
            onMouseEnter={() => setHoveredButton("importFiles")}
            onMouseLeave={() => setHoveredButton(null)}
            className={`w-[32px] h-[32px] inline-flex items-center justify-center rounded transition ${
              showGeoJSONPanel
                ? "bg-gradient-to-b from-[#9699FF] to-white"
                : "hover:bg-[#3a3a3a] text-[#C7C7C7]"
            }`}
          >
            <Layers2
              size={18}
              color={showGeoJSONPanel ? "#2E2E2E" : "#C7C7C7"}
              className="shrink-0"
            />
          </button>
          {hoveredButton === "importFiles" && !showGeoJSONPanel && (
            <div className="absolute right-[50px] top-1/2 -translate-y-1/2 bg-white text-black text-[11px] px-2 py-1 rounded shadow-lg whitespace-nowrap z-[9999]">
              Import Map Files
            </div>
          )}

          {showGeoJSONPanel && (
            <div className="absolute right-full mr-2 top-1/2 -translate-y-1/2 w-64 bg-[#2E2E2E] rounded-md shadow-md p-3 z-40 flex flex-col items-center">
              <h3 className="text-[11px] font-semibold text-white mb-2">
                Import Geospatial Data
              </h3>

              <div className="flex flex-col gap-1 w-full">
                {uploadedFiles.map((file, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between bg-[#3a3a3a] text-white px-2 py-1 rounded-sm w-full"
                  >
                    <span className="truncate text-[10px]">{file.name}</span>
                    <button
                      onClick={() => handleRemoveFile(file.layerName)}
                      className="text-red-400 hover:text-red-600 ml-1.5"
                    >
                      <X size={14} />
                    </button>
                  </div>
                ))}

                <div
                  onClick={() =>
                    !isFileLoading && fileInputRef.current?.click()
                  }
                  onDragOver={(e) => !isFileLoading && handleDragOver(e)}
                  onDragLeave={() => !isFileLoading && handleDragLeave()}
                  onDrop={(e) => !isFileLoading && handleDrop(e)}
                  className={`px-3 py-2 rounded-sm shadow-md text-center w-full transition flex flex-col items-center justify-center ${
                    isFileLoading
                      ? "bg-[#5A5C99] opacity-50 cursor-not-allowed"
                      : isDragging
                      ? "bg-transparent border-2 border-dashed border-[#9699FF] text-[#9699FF] cursor-pointer"
                      : "bg-[#5A5C99] text-white hover:opacity-90 cursor-pointer"
                  }`}
                >
                  <Upload size={20} className="mb-2" />
                  <span className="font-medium text-[11px] leading-tight">
                    Choose or drop a file
                  </span>
                  <span className="block text-[10px] mt-0.5 text-[#E0E0E0] leading-tight">
                    Supports: .geojson, .shp (zip), .kml
                  </span>
                </div>

                <input
                  ref={fileInputRef}
                  type="file"
                  multiple
                  hidden
                  disabled={isFileLoading}
                  accept=".geojson,.json,.kml,.shp,.zip"
                  onChange={(e) =>
                    e.target.files && handleFiles(e.target.files)
                  }
                />
              </div>
            </div>
          )}
        </div>

        {/* Boundaries Button & Panel */}
        <div className="relative bg-[#2E2E2E] p-1 rounded-md shadow-md w-[40px] h-[40px] flex justify-center items-center">
          <button
            onClick={() => {
              setShowBoundariesPanel((prev) => !prev);
              setShowGeoJSONPanel(false); // Close GeoJSON panel
            }}
            onMouseEnter={() => setHoveredButton("boundaries")}
            onMouseLeave={() => setHoveredButton(null)}
            className={`w-[32px] h-[32px] text-base font-semibold inline-flex items-center justify-center rounded transition ${
              showBoundariesPanel
                ? "bg-gradient-to-b from-[#9699FF] to-white text-[#2E2E2E]"
                : "hover:bg-[#3a3a3a] text-[#C7C7C7]"
            }`}
          >
            B
          </button>
          {hoveredButton === "boundaries" && !showBoundariesPanel && (
            <div className="absolute right-[50px] top-1/2 -translate-y-1/2 bg-white text-black text-[11px] px-2 py-1 rounded shadow-lg whitespace-nowrap z-[9999]">
              Add Boundaries
            </div>
          )}

          {showBoundariesPanel && (
            <div className="absolute right-full mr-2 top-1/2 -translate-y-1/2 w-[300px] bg-[#2E2E2E] rounded-md shadow-md p-3 z-40 flex flex-col items-center">
              <h3 className="text-[11px] font-semibold text-white mb-3">
                Add Boundaries to Map
              </h3>

              <div className="flex flex-col gap-1 w-full">
                {/* Source Dropdown */}
                <div
                  className={`flex gap-2 w-full items-center ${
                    selectedBoundarySource ? "mb-1.5" : ""
                  }`}
                >
                  <span className="text-white text-[10px] whitespace-nowrap">
                    Source:
                  </span>
                  <div className="relative flex-1 min-w-0">
                    <button
                      ref={boundarySourceButtonRef}
                      onClick={() =>
                        !isBoundaryLoading &&
                        setShowBoundarySourceDropdown((prev) => !prev)
                      }
                      disabled={isBoundaryLoading}
                      className={`flex justify-between items-center w-full bg-[#3a3a3a] text-white p-1.5 px-2 rounded-sm text-[10px] min-w-0 ${
                        isBoundaryLoading ? "opacity-50 cursor-not-allowed" : ""
                      }`}
                    >
                      <span
                        className={`truncate ${
                          selectedBoundarySource
                            ? "text-white"
                            : "text-gray-400"
                        }`}
                      >
                        {selectedBoundarySource || "Select Source"}
                      </span>
                      <ChevronDown
                        size={12}
                        className={`ml-1 flex-shrink-0 transition-transform duration-200 ${
                          showBoundarySourceDropdown ? "rotate-180" : ""
                        }`}
                      />
                    </button>
                    {showBoundarySourceDropdown &&
                      boundarySourceButtonRef.current &&
                      createPortal(
                        <div
                          className="fixed bg-[#3a3a3a] rounded-md shadow-lg z-[9999] text-[10px] text-white overflow-hidden"
                          style={{
                            top:
                              boundarySourceButtonRef.current.getBoundingClientRect()
                                .bottom + 4,
                            left: boundarySourceButtonRef.current.getBoundingClientRect()
                              .left,
                            width:
                              boundarySourceButtonRef.current.getBoundingClientRect()
                                .width,
                          }}
                        >
                          <div
                            className="overflow-y-auto"
                            style={{ maxHeight: "120px" }}
                          >
                            {boundarySourceOptions.map((option, index) => (
                              <div
                                key={index}
                                onClick={() => {
                                  setSelectedBoundarySource(option);
                                  setShowBoundarySourceDropdown(false);
                                  // Reset country and boundary level when source changes
                                  setSelectedBoundary(null);
                                  setSelectedBoundaryLevel(null);
                                }}
                                className="px-3 py-2 hover:bg-[#505050] cursor-pointer text-[10px]"
                              >
                                {option}
                              </div>
                            ))}
                          </div>
                        </div>,
                        document.body
                      )}
                  </div>
                  <button
                    onClick={() => {
                      if (!isBoundaryLoading) {
                        setSelectedBoundarySource(null);
                        setSelectedBoundary(null);
                        setSelectedBoundaryLevel(null);
                      }
                    }}
                    disabled={isBoundaryLoading}
                    className={`px-2 py-1.5 rounded-sm shadow-md text-center bg-[#5A5C99] text-white whitespace-nowrap text-[10px] ${
                      isBoundaryLoading
                        ? "opacity-50 cursor-not-allowed"
                        : "cursor-pointer hover:opacity-90"
                    }`}
                  >
                    Clear
                  </button>
                </div>

                {/* Country Dropdown - only show when source is selected */}
                {selectedBoundarySource && (
                  <>
                    <div
                      className={`flex gap-2 w-full items-center ${
                        selectedBoundary ? "mb-1.5" : ""
                      }`}
                    >
                      <span className="text-white text-[10px] whitespace-nowrap">
                        Country:
                      </span>
                      <div className="relative flex-1 min-w-0">
                        <button
                          ref={boundaryButtonRef}
                          onClick={() =>
                            !isBoundaryLoading &&
                            setShowBoundaryDropdown((prev) => !prev)
                          }
                          disabled={isBoundaryLoading}
                          className={`flex justify-between items-center w-full bg-[#3a3a3a] text-white p-1.5 px-2 rounded-sm text-[10px] min-w-0 ${
                            isBoundaryLoading
                              ? "opacity-50 cursor-not-allowed"
                              : ""
                          }`}
                        >
                          <span
                            className={`truncate ${
                              selectedBoundary ? "text-white" : "text-gray-400"
                            }`}
                          >
                            {selectedBoundary || "Select Country"}
                          </span>
                          <ChevronDown
                            size={12}
                            className={`ml-1 flex-shrink-0 transition-transform duration-200 ${
                              showBoundaryDropdown ? "rotate-180" : ""
                            }`}
                          />
                        </button>
                        {showBoundaryDropdown &&
                          boundaryButtonRef.current &&
                          createPortal(
                            <div
                              className="fixed bg-[#3a3a3a] rounded-md shadow-lg z-[9999] text-[10px] text-white overflow-hidden"
                              style={{
                                top:
                                  boundaryButtonRef.current.getBoundingClientRect()
                                    .bottom + 4,
                                left: boundaryButtonRef.current.getBoundingClientRect()
                                  .left,
                                width:
                                  boundaryButtonRef.current.getBoundingClientRect()
                                    .width,
                              }}
                            >
                              {/* Search Box */}
                              <div className="p-2">
                                <input
                                  type="text"
                                  placeholder="Search coverage..."
                                  value={boundarySearchTerm}
                                  onChange={(e) =>
                                    setBoundarySearchTerm(e.target.value)
                                  }
                                  className="w-full p-2 rounded-md text-white outline-none focus:ring-0 focus:outline-none hover:outline-none"
                                />
                              </div>

                              {/* Filtered options list */}
                              <div
                                className="overflow-y-auto"
                                style={{
                                  maxHeight: "120px", // Changed from 200px to 150px
                                  scrollbarWidth: "thin",
                                  scrollbarColor: "#5a5a5a transparent",
                                }}
                                onScroll={(e) => e.stopPropagation()}
                              >
                                {boundaryOptions
                                  .filter((option) =>
                                    option
                                      .toLowerCase()
                                      .includes(
                                        boundarySearchTerm.toLowerCase()
                                      )
                                  )
                                  .map((option, index) => (
                                    <div
                                      key={index}
                                      onClick={() => {
                                        setSelectedBoundary(option);
                                        setShowBoundaryDropdown(false);
                                        setBoundarySearchTerm("");
                                        setSelectedBoundaryLevel(null); // Add this line to reset boundary level
                                      }}
                                      className="px-3 py-2 hover:bg-[#505050] cursor-pointer text-[10px]"
                                    >
                                      {option}
                                    </div>
                                  ))}
                              </div>
                            </div>,
                            document.body
                          )}
                      </div>
                      {/* New Clear button */}
                      <button
                        onClick={() => {
                          if (!isBoundaryLoading) {
                            setSelectedBoundary(null);
                            setBoundarySearchTerm("");
                            setSelectedBoundaryLevel(null);
                          }
                        }}
                        disabled={isBoundaryLoading}
                        className={`px-2 py-1.5 rounded-sm shadow-md text-center bg-[#5A5C99] text-white whitespace-nowrap text-[10px] ${
                          isBoundaryLoading
                            ? "opacity-50 cursor-not-allowed"
                            : "cursor-pointer hover:opacity-90"
                        }`}
                      >
                        Clear
                      </button>
                    </div>
                  </>
                )}

                {/* Boundary Level dropdown - only show when source and country are selected */}
                {selectedBoundarySource && selectedBoundary && (
                  <>
                    <div className="flex gap-2 w-full items-center">
                      <span className="text-white text-[10px] whitespace-nowrap">
                        Boundary:
                      </span>
                      <div className="relative flex-1 min-w-0">
                        <button
                          ref={boundaryLevelButtonRef}
                          onClick={() =>
                            !isBoundaryLoading &&
                            setShowBoundaryLevelDropdown((prev) => !prev)
                          }
                          disabled={isBoundaryLoading}
                          className={`flex justify-between items-center w-full bg-[#3a3a3a] text-white p-1.5 px-2 rounded-sm text-[10px] min-w-0 ${
                            isBoundaryLoading
                              ? "opacity-50 cursor-not-allowed"
                              : ""
                          }`}
                        >
                          <span
                            className={`truncate ${
                              selectedBoundaryLevel
                                ? "text-white"
                                : "text-gray-400"
                            }`}
                          >
                            {selectedBoundaryLevel || "Options"}
                          </span>
                          <ChevronDown
                            size={12}
                            className={`ml-1 flex-shrink-0 transition-transform duration-200 ${
                              showBoundaryLevelDropdown ? "rotate-180" : ""
                            }`}
                          />
                        </button>

                        {showBoundaryLevelDropdown &&
                          boundaryLevelButtonRef.current &&
                          createPortal(
                            <div
                              className="fixed bg-[#3a3a3a] rounded-md shadow-lg z-[9999] text-[10px] text-white overflow-hidden"
                              style={{
                                top:
                                  boundaryLevelButtonRef.current.getBoundingClientRect()
                                    .bottom + 4,
                                left: boundaryLevelButtonRef.current.getBoundingClientRect()
                                  .left,
                                width:
                                  boundaryLevelButtonRef.current.getBoundingClientRect()
                                    .width,
                              }}
                            >
                              <div
                                className="overflow-y-auto"
                                style={{
                                  maxHeight: "120px",
                                  scrollbarWidth: "thin",
                                  scrollbarColor: "#5a5a5a transparent",
                                }}
                                onScroll={(e) => e.stopPropagation()}
                              >
                                {getBoundaryLevelOptions(selectedBoundary).map(
                                  (option, index) => (
                                    <div
                                      key={index}
                                      onClick={() => {
                                        setSelectedBoundaryLevel(option.label);
                                        setShowBoundaryLevelDropdown(false);
                                      }}
                                      className="px-3 py-2 hover:bg-[#505050] cursor-pointer text-[10px]"
                                    >
                                      {option.label}
                                    </div>
                                  )
                                )}
                              </div>
                            </div>,
                            document.body
                          )}
                      </div>

                      <button
                        onClick={() => {
                          if (!isBoundaryLoading) {
                            setSelectedBoundaryLevel(null);
                          }
                        }}
                        disabled={isBoundaryLoading}
                        className={`px-2 py-1.5 rounded-sm shadow-md text-center bg-[#5A5C99] text-white whitespace-nowrap text-[10px] ${
                          isBoundaryLoading
                            ? "opacity-50 cursor-not-allowed"
                            : "cursor-pointer hover:opacity-90"
                        }`}
                      >
                        Clear
                      </button>
                    </div>
                  </>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Undo / Redo / Global reset */}
        {(onUndo || onRedo || onGlobalReset) && (
          <div className="flex flex-col gap-1">
            {(onUndo || onRedo) && (
              <div className="flex flex-col gap-1">
                {onUndo && (
                  <div className="relative bg-[#2E2E2E] p-1 rounded-md shadow-md w-[40px] h-[40px] flex justify-center items-center">
                    <button
                      type="button"
                      disabled={!canUndo}
                      onClick={() => onUndo()}
                      onMouseEnter={() => setHoveredButton("undo")}
                      onMouseLeave={() => setHoveredButton(null)}
                      className={`w-[32px] h-[32px] inline-flex items-center justify-center rounded transition text-[#C7C7C7] ${
                        canUndo
                          ? "hover:bg-[#3a3a3a] cursor-pointer"
                          : "opacity-40 cursor-not-allowed"
                      }`}
                      title="Undo"
                    >
                      <Undo2 size={18} className="shrink-0" />
                    </button>
                    {hoveredButton === "undo" && (
                      <div className="absolute right-[50px] top-1/2 -translate-y-1/2 bg-white text-black text-[11px] px-2 py-1 rounded shadow-lg whitespace-nowrap z-[9999]">
                        Undo
                      </div>
                    )}
                  </div>
                )}
                {onRedo && (
                  <div className="relative bg-[#2E2E2E] p-1 rounded-md shadow-md w-[40px] h-[40px] flex justify-center items-center">
                    <button
                      type="button"
                      disabled={!canRedo}
                      onClick={() => onRedo()}
                      onMouseEnter={() => setHoveredButton("redo")}
                      onMouseLeave={() => setHoveredButton(null)}
                      className={`w-[32px] h-[32px] inline-flex items-center justify-center rounded transition text-[#C7C7C7] ${
                        canRedo
                          ? "hover:bg-[#3a3a3a] cursor-pointer"
                          : "opacity-40 cursor-not-allowed"
                      }`}
                      title="Redo (reapply last undone change)"
                    >
                      <Redo2 size={18} className="shrink-0" />
                    </button>
                    {hoveredButton === "redo" && (
                      <div className="absolute right-[50px] top-1/2 -translate-y-1/2 bg-white text-black text-[11px] px-2 py-1 rounded shadow-lg whitespace-nowrap z-[9999]">
                        Redo
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
            {onGlobalReset && (
              <div className="relative bg-[#2E2E2E] p-1 rounded-md shadow-md w-[40px] h-[40px] flex justify-center items-center">
                <button
                  type="button"
                  onClick={() => onGlobalReset()}
                  onMouseEnter={() => setHoveredButton("resetAll")}
                  onMouseLeave={() => setHoveredButton(null)}
                  className="w-[32px] h-[32px] inline-flex items-center justify-center rounded transition hover:bg-[#3a3a3a] text-[#C7C7C7]"
                  title="Reset map (clear layers & drawings)"
                >
                  <RotateCcw size={18} className="shrink-0" />
                </button>
                {hoveredButton === "resetAll" && (
                  <div className="absolute right-[50px] top-1/2 -translate-y-1/2 bg-white text-black text-[11px] px-2 py-1 rounded shadow-lg whitespace-nowrap z-[9999]">
                    Reset all
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    );
  }
);

RightSideControls.displayName = "RightSideControls";

export default RightSideControls;
