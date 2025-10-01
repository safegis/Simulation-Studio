// \SafeGIS\Simulation-Studio\frontend\src\components\controls\Main\CenterRightControls.tsx
"use client";

import { ZoomIn, ZoomOut, Layers2, X, ChevronDown } from "lucide-react";
import { RefObject, useRef, useState } from "react";
import type { FeatureCollection, Geometry, GeoJsonProperties } from "geojson";
import { createPortal } from "react-dom";
import { boundaryOptions, countryBoundaries } from "./BoundaryOptions";

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
}

export default function RightSideControls({
  show3DControls,
  viewMode,
  switchTo2D,
  switchTo3D,
  handleZoom,
  mapRef,
  uploadedFiles = [],
  setUploadedFiles = () => {},
}: RightSideControlsProps) {
  const [showGeoJSONPanel, setShowGeoJSONPanel] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [showBoundariesPanel, setShowBoundariesPanel] = useState(false);
  const [selectedBoundary, setSelectedBoundary] = useState<string | null>(null);
  const [boundarySearchTerm, setBoundarySearchTerm] = useState("");
  const boundaryButtonRef = useRef<HTMLButtonElement>(null);
  const [showBoundaryDropdown, setShowBoundaryDropdown] = useState(false);

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const [showBoundaryLevelDropdown, setShowBoundaryLevelDropdown] =
    useState(false);
  const [selectedBoundaryLevel, setSelectedBoundaryLevel] = useState<
    string | null
  >(null);
  const boundaryLevelButtonRef = useRef<HTMLButtonElement>(null);

  // ✅ File handling inside component
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
            if (setUploadedFiles) {
              setUploadedFiles((prev) => [
                ...prev,
                { name: file.name, layerName: file.name },
              ]);
            }
          }
        }
      } catch (err) {
        console.error("Error processing file:", file.name, err);
      }
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
      setUploadedFiles((prev) => prev.filter((f) => f.layerName !== layerName));
    }

    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const getBoundaryLevelOptions = (selectedCountry: string | null) => {
    if (!selectedCountry) return [];
    return countryBoundaries[selectedCountry]?.levels || [];
  };

  return (
    <div className="absolute right-[18px] top-1/2 -translate-y-1/2 z-50 flex flex-col items-center gap-[18px]">
      {/* 2D/3D Toggle */}
      {show3DControls && (
        <div className="relative bg-[#2E2E2E] p-2 rounded-xl shadow-md w-[60px] h-[112px] overflow-hidden">
          <div
            className="absolute w-[44px] h-[44px] left-2 rounded-lg bg-gradient-to-b from-[#9699FF] to-white transition-all duration-300 ease-in-out"
            style={{ top: viewMode === "2d" ? "8px" : "60px" }}
          />
          <div className="relative z-10 flex flex-col gap-2 items-center">
            <button
              onClick={switchTo2D}
              className={`w-[44px] h-[44px] flex items-center justify-center rounded-lg ${
                viewMode === "2d" ? "text-[#2E2E2E]" : "text-[#C7C7C7]"
              }`}
            >
              <span className="font-semibold text-lg">2D</span>
            </button>
            <button
              onClick={switchTo3D}
              className={`w-[44px] h-[44px] flex items-center justify-center rounded-lg ${
                viewMode === "3d" ? "text-[#2E2E2E]" : "text-[#C7C7C7]"
              }`}
            >
              <span className="font-semibold text-lg">3D</span>
            </button>
          </div>
        </div>
      )}

      {/* Zoom buttons */}
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

      {/* GeoJSON Upload */}
      <div className="relative bg-[#2E2E2E] p-2 rounded-xl shadow-md w-[60px] flex justify-center">
        <button
          onClick={() => {
            setShowGeoJSONPanel((prev) => !prev);
            setShowBoundariesPanel(false); // Close boundaries panel
          }}
          className={`w-[44px] h-[44px] flex items-center justify-center rounded-lg ${
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
            <h3 className="text-lg font-semibold text-white mb-4">
              Import Geospatial Data
            </h3>
            <div className="flex flex-col gap-2 w-full">
              {uploadedFiles.map((file, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between bg-[#3a3a3a] text-white px-3 py-2 rounded-lg w-full"
                >
                  <span className="truncate">{file.name}</span>
                  <button
                    onClick={() => handleRemoveFile(file.layerName)}
                    className="text-red-400 hover:text-red-600 ml-2"
                  >
                    <X size={18} />
                  </button>
                </div>
              ))}

              <div
                onClick={() => fileInputRef.current?.click()}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                className={`px-6 py-3 rounded-lg shadow-md cursor-pointer text-center w-full transition ${
                  isDragging
                    ? "bg-transparent border-4 border-dashed border-[#9699FF] text-[#9699FF]"
                    : "bg-[#5A5C99] text-white hover:opacity-90"
                }`}
              >
                <span className="font-medium">Choose or drop a file</span>
                <span className="block text-sm mt-1 text-[#E0E0E0]">
                  Supports: .geojson, .shp (zip), .kml
                </span>
              </div>

              <input
                ref={fileInputRef}
                type="file"
                multiple
                hidden
                accept=".geojson,.json,.kml,.shp,.zip"
                onChange={(e) => e.target.files && handleFiles(e.target.files)}
              />
            </div>
          </div>
        )}
      </div>

      {/* Boundaries Button & Panel */}
      <div className="relative bg-[#2E2E2E] p-2 rounded-xl shadow-md w-[60px] flex justify-center">
        <button
          onClick={() => {
            setShowBoundariesPanel((prev) => !prev);
            setShowGeoJSONPanel(false); // Close GeoJSON panel
          }}
          className={`w-[44px] h-[44px] text-[27px] font-semibold flex items-center justify-center rounded-lg ${
            showBoundariesPanel
              ? "bg-gradient-to-b from-[#9699FF] to-white text-[#2E2E2E]"
              : "hover:bg-[#3a3a3a] text-[#C7C7C7]"
          } transition`}
        >
          B
        </button>

        {showBoundariesPanel && (
          <div className="absolute right-full mr-[18px] top-1/2 -translate-y-1/2 w-[420px] bg-[#2E2E2E] rounded-xl shadow-md p-6 z-40 flex flex-col items-center">
            <h3 className="text-lg font-semibold text-white mb-4">
              Add Boundaries to Map
            </h3>

            <div className="flex flex-col gap-2 w-full">
              <div className="flex gap-2 w-full">
                {/* Added flex container */}
                <div className="relative flex-1">
                  {" "}
                  {/* Added flex-1 to make dropdown take remaining space */}
                  <button
                    ref={boundaryButtonRef}
                    onClick={() => setShowBoundaryDropdown((prev) => !prev)}
                    className="flex justify-between items-center w-full bg-[#3a3a3a] text-white p-2.5 px-4 rounded-md text-sm"
                  >
                    <span
                      className={
                        selectedBoundary ? "text-white" : "text-gray-400"
                      }
                    >
                      {selectedBoundary || "Select Country"}{" "}
                      {/* Changed "Options" to "Select Country" */}
                    </span>
                    <ChevronDown
                      size={16}
                      className={`ml-2 transition-transform duration-200 ${
                        showBoundaryDropdown ? "rotate-180" : ""
                      }`}
                    />
                  </button>
                  {showBoundaryDropdown &&
                    boundaryButtonRef.current &&
                    createPortal(
                      <div
                        className="fixed bg-[#3a3a3a] rounded-md shadow-lg z-[9999] text-sm text-white overflow-hidden"
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
                                .includes(boundarySearchTerm.toLowerCase())
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
                                className="px-3 py-2 hover:bg-[#505050] cursor-pointer text-sm"
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
                    setSelectedBoundary(null);
                    setBoundarySearchTerm("");
                    setSelectedBoundaryLevel(null);
                  }}
                  className="px-4 py-2.5 rounded-lg shadow-md cursor-pointer text-center bg-[#5A5C99] text-white hover:opacity-90 whitespace-nowrap text-sm"
                >
                  Clear
                </button>
              </div>

              {/* New conditional second dropdown */}
              {selectedBoundary && (
                <>
                  <span className="text-white text-sm mt-2">Boundary:</span>
                  <div className="flex gap-2 w-full">
                    <div className="relative flex-1">
                      <button
                        ref={boundaryLevelButtonRef}
                        onClick={() =>
                          setShowBoundaryLevelDropdown((prev) => !prev)
                        }
                        className="flex justify-between items-center w-full bg-[#3a3a3a] text-white p-2.5 px-4 rounded-md text-sm"
                      >
                        <span
                          className={
                            selectedBoundaryLevel
                              ? "text-white"
                              : "text-gray-400"
                          }
                        >
                          {selectedBoundaryLevel || "Options"}
                        </span>
                        <ChevronDown
                          size={16}
                          className={`ml-2 transition-transform duration-200 ${
                            showBoundaryLevelDropdown ? "rotate-180" : ""
                          }`}
                        />
                      </button>

                      {showBoundaryLevelDropdown &&
                        boundaryLevelButtonRef.current &&
                        createPortal(
                          <div
                            className="fixed bg-[#3a3a3a] rounded-md shadow-lg z-[9999] text-sm text-white overflow-hidden"
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
                                    className="px-3 py-2 hover:bg-[#505050] cursor-pointer text-sm"
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
                        setSelectedBoundaryLevel(null);
                      }}
                      className="px-4 py-2.5 rounded-lg shadow-md cursor-pointer text-center bg-[#5A5C99] text-white hover:opacity-90 whitespace-nowrap text-sm"
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
    </div>
  );
}
