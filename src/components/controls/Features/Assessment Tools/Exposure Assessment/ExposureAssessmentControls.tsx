// \SafeGIS\Simulation-Studio\frontend\src\components\controls\Features\Assessment Tools\Exposure Assessment\ExposureAssessmentControls.tsx
"use client";

import React, {
  useState,
  useEffect,
  useImperativeHandle,
  forwardRef,
  useRef,
} from "react";
import { createPortal } from "react-dom";
import { ChevronDown } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { floodHazardMaps } from "../../Maps/Hazard Layers/Flood/NOAAFloodHazardConfig";
import { exposureElementsData } from "./OSMExposureElementsData";

import {
  drawAnalysisFloodHazard,
  drawAnalysisExposureElement,
  ensureAffectedAreasOnTop,
} from "../../../../Map/Markers/Assessment Tools/ExposureAssessmentMarkers";

type PanelToggleProps = {
  title: string;
  icon: React.ReactNode;
  expanded: boolean;
  onToggle: () => void;
  items: string[];
  checkedItems: string[];
  onCheck: (item: string) => void;
};

interface Props {
  PanelToggle: React.FC<PanelToggleProps>;
  mapRef?: React.RefObject<any>;
  uploadedFiles?: { name: string; layerName: string }[];
  onShowAspectRatioSelector?: (show: boolean) => void;
  onStartAnalysis?: () => void;
  onRunAnalysis?: (
    data: any,
    affectedAreas?: GeoJSON.FeatureCollection
  ) => void;
}

// Exposed methods for external control (e.g., AI agent)
export interface ExposureAssessmentControlsRef {
  selectHazardSource: (source: "existing" | "imported") => void;
  selectHazardData: (data: string[], source?: "existing" | "imported") => void;
  selectElementSource: (source: "existing" | "imported") => void;
  selectElementData: (data: string[], source?: "existing" | "imported") => void;
  runAnalysis: () => void;
  clearSteps: () => void;
}

const ExposureAssessmentControls = forwardRef<
  ExposureAssessmentControlsRef,
  Props
>(
  (
    {
      PanelToggle,
      mapRef,
      uploadedFiles = [],
      onShowAspectRatioSelector,
      onStartAnalysis,
      onRunAnalysis,
    },
    ref
  ) => {
    // Step 1: Hazard Data
    const [hazardDataSource, setHazardDataSource] = useState<string>("");
    const [hazardDataDropdownOpen, setHazardDataDropdownOpen] = useState(false);
    const [selectedHazardData, setSelectedHazardData] = useState<string[]>([]);
    const [selectedImportedHazardFiles, setSelectedImportedHazardFiles] =
      useState<string[]>([]);
    const [importedHazardFileDropdownOpen, setImportedHazardFileDropdownOpen] =
      useState(false);
    const [hazardFileSearchTerm, setHazardFileSearchTerm] = useState("");

    // Step 2: Exposure Element Data
    const [elementDataSource, setElementDataSource] = useState<string>("");
    const [elementDataDropdownOpen, setElementDataDropdownOpen] =
      useState(false);
    const [selectedElementData, setSelectedElementData] = useState<string[]>(
      []
    );
    const [selectedImportedElementFiles, setSelectedImportedElementFiles] =
      useState<string[]>([]);
    const [
      importedElementFileDropdownOpen,
      setImportedElementFileDropdownOpen,
    ] = useState(false);
    const [elementFileSearchTerm, setElementFileSearchTerm] = useState("");
    const [isAnalyzing, setIsAnalyzing] = useState(false);

    // Refs for dropdown positioning
    const hazardFileButtonRef = useRef<HTMLButtonElement>(null);
    const elementFileButtonRef = useRef<HTMLButtonElement>(null);
    const [hazardDropdownPosition, setHazardDropdownPosition] = useState({
      top: 0,
      left: 0,
      width: 0,
    });
    const [elementDropdownPosition, setElementDropdownPosition] = useState({
      top: 0,
      left: 0,
      width: 0,
    });

    const hazardDataOptions = ["Use existing data", "Use imported data"];
    const elementDataOptions = ["Use existing data", "Use imported data"];

    // Define proper types for hazard and element data
    interface HazardDataItem {
      displayName: string;
      config: any;
      returnPeriod: string;
    }

    interface ElementDataItem {
      displayName: string;
      config: any;
    }

    // Get all available hazard data (currently only flood)
    const getAllHazardData = (): HazardDataItem[] => {
      const allData: HazardDataItem[] = [];

      Object.entries(floodHazardMaps).forEach(([returnPeriod, configs]) => {
        configs.forEach((config) => {
          allData.push({
            displayName: `${config.name} - Flood - ${returnPeriod} Return Period`,
            config: config,
            returnPeriod: returnPeriod,
          });
        });
      });

      return allData;
    };

    // Get all available exposure element data
    const getAllElementData = (): ElementDataItem[] => {
      const allData: ElementDataItem[] = [];

      // Land Cover
      if (exposureElementsData["Land Cover"]) {
        exposureElementsData["Land Cover"].forEach((config) => {
          allData.push({
            displayName: `${config.name}, ${config.country} - ${config.elementType} (${config.source})`,
            config: config,
          });
        });
      }

      // Transportation Networks
      if (exposureElementsData["Transportation Networks"]) {
        exposureElementsData["Transportation Networks"].forEach((config) => {
          allData.push({
            displayName: `${config.name}, ${config.country} - ${config.elementType} (${config.source})`,
            config: config,
          });
        });
      }

      // Point Features
      if (exposureElementsData["Point Features"]) {
        exposureElementsData["Point Features"].forEach((config) => {
          allData.push({
            displayName: `${config.name}, ${config.country} - ${config.elementType} (${config.source})`,
            config: config,
          });
        });
      }

      return allData;
    };

    const handleClearSteps = () => {
      setHazardDataSource("");
      setSelectedHazardData([]);
      setSelectedImportedHazardFiles([]);
      setHazardFileSearchTerm("");
      setElementDataSource("");
      setSelectedElementData([]);
      setSelectedImportedElementFiles([]);
      setElementFileSearchTerm("");
      setHazardDataDropdownOpen(false);
      setImportedHazardFileDropdownOpen(false);
      setElementDataDropdownOpen(false);
      setImportedElementFileDropdownOpen(false);
    };

    // Debug: Log state changes
    useEffect(() => {
      console.log("🔴 STATE CHANGE: hazardDataSource =", hazardDataSource);
    }, [hazardDataSource]);

    useEffect(() => {
      console.log(
        "🔴 STATE CHANGE: selectedImportedHazardFiles =",
        selectedImportedHazardFiles
      );
    }, [selectedImportedHazardFiles]);

    useEffect(() => {
      console.log("🔴 STATE CHANGE: elementDataSource =", elementDataSource);
    }, [elementDataSource]);

    useEffect(() => {
      console.log(
        "🔴 STATE CHANGE: selectedImportedElementFiles =",
        selectedImportedElementFiles
      );
    }, [selectedImportedElementFiles]);

    // Reset selections when data source changes (but NOT when set by AI agent)
    // DISABLED: This was causing race condition with AI agent control
    // The AI agent sets source and data together, so we don't need to clear
    // useEffect(() => {
    //   if (hazardDataSource !== "Use imported data") {
    //     setSelectedImportedHazardFiles([]);
    //     setHazardFileSearchTerm("");
    //   }
    //   if (hazardDataSource !== "Use existing data") {
    //     setSelectedHazardData([]);
    //   }
    // }, [hazardDataSource]);

    // useEffect(() => {
    //   if (elementDataSource !== "Use imported data") {
    //     setSelectedImportedElementFiles([]);
    //     setElementFileSearchTerm("");
    //   }
    //   if (elementDataSource !== "Use existing data") {
    //     setSelectedElementData([]);
    //   }
    // }, [elementDataSource]);

    const isComplete =
      hazardDataSource &&
      (hazardDataSource !== "Use imported data" ||
        selectedImportedHazardFiles.length > 0) &&
      (hazardDataSource !== "Use existing data" ||
        selectedHazardData.length > 0) &&
      elementDataSource &&
      (elementDataSource !== "Use imported data" ||
        selectedImportedElementFiles.length > 0) &&
      (elementDataSource !== "Use existing data" ||
        selectedElementData.length > 0);

    const hasAnySelection =
      hazardDataSource ||
      selectedHazardData.length > 0 ||
      selectedImportedHazardFiles.length > 0 ||
      elementDataSource ||
      selectedElementData.length > 0 ||
      selectedImportedElementFiles.length > 0;

    // BEFORE: Attempted to visualize imported files which already have markers
    // AFTER: Only visualize existing data, skip imported files

    const handleRunAnalysis = async () => {
      console.log("Running exposure analysis via backend...");
      setIsAnalyzing(true);

      const startTime = new Date().toLocaleString("en-US", {
        month: "2-digit",
        day: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
        hour12: true,
      });

      if (onStartAnalysis) {
        onStartAnalysis();
      }

      const allElements: any[] = [];
      const allAffectedFeatures: GeoJSON.Feature[] = [];

      try {
        const hazardsToProcess: Array<{
          hazardData: any;
          hazardType: string;
          analysisArea: string;
        }> = [];

        // Get helper function for layer ordering
        const getTopSymbolLayerId = (map: any) => {
          const layers = map.getStyle()?.layers || [];
          for (let i = layers.length - 1; i >= 0; i--) {
            if (layers[i].type === "symbol") {
              return layers[i].id;
            }
          }
          return undefined;
        };

        // BEFORE: Tried to visualize all hazards including imported files
        // AFTER: Only visualize existing data from database, skip imported files
        if (selectedHazardData.length > 0) {
          const allHazardData = getAllHazardData();

          for (const hazardName of selectedHazardData) {
            const selectedHazard = allHazardData.find(
              (item) => item.displayName === hazardName
            );

            if (selectedHazard) {
              console.log(`Fetching hazard data: ${hazardName}...`);
              const hazardResponse = await fetch(
                selectedHazard.config.geojsonUrl
              );

              if (!hazardResponse.ok) {
                throw new Error(
                  `Failed to fetch ${hazardName}: ${hazardResponse.status}`
                );
              }

              const hazardData = await hazardResponse.json();

              hazardsToProcess.push({
                hazardData: hazardData,
                hazardType: `Flood - ${selectedHazard.returnPeriod} Return Period`,
                analysisArea: selectedHazard.config.name,
              });

              // NEW: Visualize hazard on map (only for existing data)
              if (mapRef?.current) {
                await drawAnalysisFloodHazard(
                  mapRef.current.getMap(),
                  true,
                  selectedHazard.config.geojsonUrl,
                  selectedHazard.returnPeriod,
                  selectedHazard.config.name,
                  getTopSymbolLayerId
                );
              }

              console.log(
                `✓ Loaded and visualized ${hazardName}: ${hazardData.features?.length} features`
              );
            }
          }
        } else if (selectedImportedHazardFiles.length > 0) {
          // BEFORE: Would try to visualize imported files
          // AFTER: Just load data, don't visualize (already has markers from upload)
          for (const fileName of selectedImportedHazardFiles) {
            const hazardData =
              mapRef?.current?.getUploadedLayerData?.(fileName);

            if (!hazardData) {
              throw new Error(`Could not retrieve hazard data for ${fileName}`);
            }

            hazardsToProcess.push({
              hazardData: hazardData,
              hazardType: fileName,
              analysisArea: fileName,
            });

            console.log(
              `✓ Loaded ${fileName}: ${hazardData.features?.length} features (using existing markers)`
            );
          }
        }

        if (hazardsToProcess.length === 0) {
          throw new Error("No hazard data available");
        }

        console.log(
          `\n📊 Starting analysis: ${hazardsToProcess.length} hazard(s) × exposure elements\n`
        );

        // BEFORE: Tried to visualize all elements including imported files
        // AFTER: Only visualize existing data from database, skip imported files
        const elementsToProcess: Array<{
          elementName: string;
          elementData: any;
          elementType:
            | "Land Cover"
            | "Transportation Networks"
            | "Point Features";
        }> = [];

        if (selectedElementData.length > 0) {
          const allElementData = getAllElementData();

          for (const elementName of selectedElementData) {
            const selectedElement = allElementData.find(
              (item) => item.displayName === elementName
            );

            if (selectedElement) {
              console.log(`Fetching element data: ${elementName}...`);
              const elementResponse = await fetch(
                selectedElement.config.geojsonUrl
              );

              if (!elementResponse.ok) {
                throw new Error(
                  `Failed to fetch ${elementName}: ${elementResponse.status}`
                );
              }

              const elementData = await elementResponse.json();

              elementsToProcess.push({
                elementName: elementName,
                elementData: elementData,
                elementType: selectedElement.config.elementType,
              });

              // NEW: Visualize element on map (only for existing data)
              if (mapRef?.current) {
                await drawAnalysisExposureElement(
                  mapRef.current.getMap(),
                  true,
                  selectedElement.config.geojsonUrl,
                  elementName,
                  selectedElement.config.elementType,
                  getTopSymbolLayerId
                );
              }

              console.log(
                `✓ Loaded and visualized ${elementName}: ${elementData.features?.length} features`
              );
            }
          }
        } else if (selectedImportedElementFiles.length > 0) {
          // BEFORE: Would try to visualize imported files
          // AFTER: Just load data, don't visualize (already has markers from upload)
          for (const fileName of selectedImportedElementFiles) {
            const elementData =
              mapRef?.current?.getUploadedLayerData?.(fileName);

            if (!elementData) {
              console.error(`Could not retrieve data for ${fileName}`);
              continue;
            }

            // Determine element type from geometry
            const hasPoints = elementData.features.some(
              (f: any) =>
                f.geometry.type === "Point" || f.geometry.type === "MultiPoint"
            );
            const hasPolygons = elementData.features.some(
              (f: any) =>
                f.geometry.type === "Polygon" ||
                f.geometry.type === "MultiPolygon"
            );

            const elementType = hasPoints
              ? "Point Features"
              : hasPolygons
              ? "Land Cover"
              : "Transportation Networks";

            elementsToProcess.push({
              elementName: fileName,
              elementData: elementData,
              elementType: elementType,
            });

            console.log(
              `✓ Loaded ${fileName}: ${elementData.features?.length} features (using existing markers)`
            );
          }
        }

        if (elementsToProcess.length === 0) {
          throw new Error("No element data available");
        }

        const backendUrl =
          process.env.NEXT_PUBLIC_BACKEND_ENDPOINT || "http://localhost:8000";

        let analysisCount = 0;
        const totalAnalyses =
          hazardsToProcess.length * elementsToProcess.length;

        for (const hazard of hazardsToProcess) {
          console.log(`\n🌊 Analyzing hazard: ${hazard.hazardType}`);

          for (const element of elementsToProcess) {
            analysisCount++;
            console.log(
              `  [${analysisCount}/${totalAnalyses}] Processing ${element.elementName}...`
            );

            const response = await fetch(
              `${backendUrl}/api/exposure-assessment`,
              {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  hazard_data: hazard.hazardData,
                  element_data: element.elementData,
                  hazard_type: hazard.hazardType,
                  analysis_area: hazard.analysisArea,
                  element_type: element.elementType,
                }),
              }
            );

            if (!response.ok) {
              const errorData = await response.json().catch(() => ({}));
              console.error("Backend error:", errorData);
              throw new Error(
                errorData.detail || `Backend error: ${response.status}`
              );
            }

            const result = await response.json();

            if (result.elements && result.elements.length > 0) {
              allElements.push({
                name: `${element.elementName}`,
                hazardType: hazard.hazardType,
                analysisArea: hazard.analysisArea,
                exposedFeatures: result.elements[0].exposedFeatures,
                totalSurfaceArea: result.elements[0].totalSurfaceArea,
                affectedArea: result.elements[0].affectedArea,
                unaffectedArea: result.elements[0].unaffectedArea, // NEW
                totalFeatures: result.elements[0].totalFeatures,
                unit: result.unit || "km²",
                landuseBreakdown: result.elements[0].landuseBreakdown || null,
                hazardLevelBreakdown:
                  result.elements[0].hazardLevelBreakdown || null,
              });

              // Log landuse breakdown if available
              if (result.elements[0].landuseBreakdown) {
                console.log(
                  `    ✓ Landuse breakdown: ${result.elements[0].landuseBreakdown.length} categories`
                );
              }

              if (
                result.affectedGeometries &&
                Array.isArray(result.affectedGeometries)
              ) {
                const taggedGeometries = result.affectedGeometries.map(
                  (geom: any) => ({
                    ...geom,
                    properties: {
                      ...geom.properties,
                      hazardType: hazard.hazardType,
                    },
                  })
                );
                allAffectedFeatures.push(...taggedGeometries);
                console.log(
                  `    ✓ Found ${result.affectedGeometries.length} affected areas`
                );
              }
            }

            console.log(`    ✓ Complete`);
          }
        }

        const hazardIdentifiers = hazardsToProcess.map((h) => ({
          type: h.hazardType,
          area: h.analysisArea,
          fullName: `${h.hazardType} - ${h.analysisArea}`,
        }));

        const hazardSummary =
          hazardIdentifiers.length === 1
            ? hazardIdentifiers[0].fullName
            : `${hazardIdentifiers.length} hazard scenarios`;

        const endTime = new Date();
        const startTimeDate = new Date(startTime);
        const durationMs = endTime.getTime() - startTimeDate.getTime();

        // Calculate duration in a human-readable format
        const formatDuration = (ms: number): string => {
          const seconds = Math.floor(ms / 1000);
          const minutes = Math.floor(seconds / 60);
          const hours = Math.floor(minutes / 60);

          if (hours > 0) {
            const remainingMinutes = minutes % 60;
            const remainingSeconds = seconds % 60;
            return `${hours}h ${remainingMinutes}m ${remainingSeconds}s`;
          } else if (minutes > 0) {
            const remainingSeconds = seconds % 60;
            return `${minutes}m ${remainingSeconds}s`;
          } else {
            return `${seconds}s`;
          }
        };

        const analysisData = {
          hazardType: hazardSummary,
          analysisArea:
            hazardsToProcess.length === 1
              ? hazardsToProcess[0].analysisArea
              : "Multiple areas",
          scope: "Current map view",
          startTime: startTime,
          analysisTime: endTime.toLocaleString("en-US", {
            month: "2-digit",
            day: "2-digit",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit",
            second: "2-digit",
            hour12: true,
          }),
          analysisDuration: formatDuration(durationMs), // NEW
          elements: allElements,
          hazardBreakdown: hazardIdentifiers,
        };

        const affectedAreasGeoJSON: GeoJSON.FeatureCollection = {
          type: "FeatureCollection",
          features: allAffectedFeatures,
        };

        console.log("\n✅ Analysis complete!");
        console.log(`   Total combinations analyzed: ${allElements.length}`);
        console.log(`   Total affected areas: ${allAffectedFeatures.length}`);

        // NEW: Ensure affected areas are rendered on top
        setTimeout(() => {
          if (mapRef?.current && affectedAreasGeoJSON.features.length > 0) {
            ensureAffectedAreasOnTop(mapRef.current.getMap(), true);
          }
        }, 500);

        if (onRunAnalysis) {
          onRunAnalysis(analysisData, affectedAreasGeoJSON);
        }
      } catch (error) {
        console.error("Error during exposure analysis:", error);

        let errorMessage = "Unknown error";
        if (error instanceof Error) {
          errorMessage = error.message;
        }

        alert(`Failed to complete exposure analysis: ${errorMessage}`);
      } finally {
        setIsAnalyzing(false);
      }
    };

    // Expose methods for external control (e.g., AI agent)
    useImperativeHandle(ref, () => ({
      selectHazardSource: (source: "existing" | "imported") => {
        console.log("🟢 REF: selectHazardSource called with:", source);
        const sourceMap = {
          existing: "Use existing data",
          imported: "Use imported data",
        };
        const mappedSource = sourceMap[source];
        console.log("🟢 REF: Setting hazard source to:", mappedSource);
        setHazardDataSource(mappedSource);
        // Force a re-render by updating state in next tick
        setTimeout(() => {
          console.log(
            "🟢 REF: Hazard source state after update:",
            mappedSource
          );
        }, 0);
      },
      selectHazardData: (data: string[], source?: "existing" | "imported") => {
        console.log(
          "🟢 REF: selectHazardData called with:",
          data,
          "source:",
          source
        );
        // ALWAYS use the provided source parameter if available
        const isImported = source === "imported";
        console.log("🟢 REF: isImported:", isImported, "(from source param)");

        if (isImported) {
          console.log("🟢 REF: Setting imported hazard files:", data);
          setSelectedImportedHazardFiles(data);
          // Verify state update
          setTimeout(() => {
            console.log("🟢 REF: Imported hazard files state should be:", data);
          }, 0);
        } else {
          console.log("🟢 REF: Setting existing hazard data:", data);
          setSelectedHazardData(data);
          setTimeout(() => {
            console.log("🟢 REF: Existing hazard data state should be:", data);
          }, 0);
        }
      },
      selectElementSource: (source: "existing" | "imported") => {
        console.log("🟢 REF: selectElementSource called with:", source);
        const sourceMap = {
          existing: "Use existing data",
          imported: "Use imported data",
        };
        const mappedSource = sourceMap[source];
        console.log("🟢 REF: Setting element source to:", mappedSource);
        setElementDataSource(mappedSource);
        setTimeout(() => {
          console.log(
            "🟢 REF: Element source state after update:",
            mappedSource
          );
        }, 0);
      },
      selectElementData: (data: string[], source?: "existing" | "imported") => {
        console.log(
          "🟢 REF: selectElementData called with:",
          data,
          "source:",
          source
        );
        // ALWAYS use the provided source parameter if available
        const isImported = source === "imported";
        console.log("🟢 REF: isImported:", isImported, "(from source param)");

        if (isImported) {
          console.log("🟢 REF: Setting imported element files:", data);
          setSelectedImportedElementFiles(data);
          setTimeout(() => {
            console.log(
              "🟢 REF: Imported element files state should be:",
              data
            );
          }, 0);
        } else {
          console.log("🟢 REF: Setting existing element data:", data);
          setSelectedElementData(data);
          setTimeout(() => {
            console.log("🟢 REF: Existing element data state should be:", data);
          }, 0);
        }
      },
      runAnalysis: () => {
        console.log("🟢 REF: runAnalysis called");
        handleRunAnalysis();
      },
      clearSteps: () => {
        console.log("🟢 REF: clearSteps called");
        handleClearSteps();
      },
    }));

    return (
      <div className="space-y-2">
        {/* Instructions */}
        <div className="text-gray-300 text-[10px]">
          Analyze exposed elements and assets within hazard zones
        </div>

        {/* Step 1: Select Hazard Data */}
        <div className="relative">
          <label className="block text-white text-[10px] font-medium mb-1.5">
            1. Select Hazard Data
          </label>
          <button
            onClick={() => setHazardDataDropdownOpen((prev) => !prev)}
            className="flex justify-between items-center w-full bg-[#3a3a3a] text-white px-2.5 py-2 rounded shadow-md hover:bg-[#454545] transition"
          >
            <span className="text-[10px]">
              {hazardDataSource || "Choose data source..."}
            </span>
            <ChevronDown
              size={14}
              className={`transition-transform duration-200 ${
                hazardDataDropdownOpen ? "rotate-180" : ""
              }`}
            />
          </button>

          {hazardDataDropdownOpen && (
            <div className="absolute z-50 mt-1 w-full bg-[#3a3a3a] rounded shadow-lg overflow-hidden">
              {hazardDataOptions.map((option, index) => (
                <div
                  key={index}
                  onClick={() => {
                    setHazardDataSource(option);
                    setHazardDataDropdownOpen(false);
                  }}
                  className="px-2.5 py-2 text-[10px] text-white hover:bg-[#505050] cursor-pointer"
                >
                  {option}
                </div>
              ))}
            </div>
          )}

          {/* Show existing data cards when "Use existing data" is selected */}
          {hazardDataSource === "Use existing data" && (
            <div className="mt-2 bg-[#3a3a3a] rounded shadow-md p-3 space-y-2">
              <div className="text-white text-[10px] mb-1.5">
                Select data to use:
              </div>
              <div
                className="space-y-1.5 max-h-[300px] overflow-y-auto pr-1.5"
                style={{
                  scrollbarWidth: "thin",
                  scrollbarColor: "#706f6f transparent",
                }}
              >
                {getAllHazardData().map((item, index) => (
                  <div
                    key={index}
                    onClick={() => {
                      setSelectedHazardData((prev) =>
                        prev.includes(item.displayName)
                          ? prev.filter((name) => name !== item.displayName)
                          : [...prev, item.displayName]
                      );
                    }}
                    className={`p-2 rounded cursor-pointer transition flex items-center gap-2 ${
                      selectedHazardData.includes(item.displayName)
                        ? "bg-[#3d3e69] border-2 border-[#9699FF]"
                        : "bg-[#2a2a2a] hover:bg-[#353535]"
                    }`}
                  >
                    <Checkbox
                      checked={selectedHazardData.includes(item.displayName)}
                      className="pointer-events-none"
                      style={{
                        width: "14px",
                        height: "14px",
                        minWidth: "14px",
                        minHeight: "14px",
                      }}
                    />
                    <div className="flex-1">
                      <div className="text-white text-[10px] font-medium mb-1">
                        Flood Hazard ({item.returnPeriod.replace("-", " - ")})
                      </div>
                      <div className="text-gray-400 text-[10px] mb-0.5">
                        {item.config.name}, {item.config.country}
                      </div>
                      <div className="text-gray-400 text-[10px]">
                        Source: {item.config.source}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Show imported file dropdown when "Use imported data" is selected */}
          {hazardDataSource === "Use imported data" && (
            <div className="mt-2 relative" style={{ overflow: "visible" }}>
              <label className="block text-white text-[10px] font-medium mb-1.5">
                Select Imported Data
              </label>
              <button
                ref={hazardFileButtonRef}
                onClick={() => {
                  if (hazardFileButtonRef.current) {
                    const rect =
                      hazardFileButtonRef.current.getBoundingClientRect();
                    setHazardDropdownPosition({
                      top: rect.bottom + window.scrollY,
                      left: rect.left + window.scrollX,
                      width: rect.width,
                    });
                  }
                  setImportedHazardFileDropdownOpen((prev) => !prev);
                }}
                className="flex justify-between items-center w-full bg-[#3a3a3a] text-white px-2.5 py-2 rounded shadow-md hover:bg-[#454545] transition"
              >
                <span className="text-[10px] truncate">
                  {selectedImportedHazardFiles.length > 0
                    ? `${selectedImportedHazardFiles.length} selected`
                    : "Choose file..."}
                </span>
                <ChevronDown
                  size={14}
                  className={`transition-transform duration-200 flex-shrink-0 ml-2 ${
                    importedHazardFileDropdownOpen ? "rotate-180" : ""
                  }`}
                />
              </button>

              {importedHazardFileDropdownOpen &&
                createPortal(
                  <div
                    className="fixed z-[9999] bg-[#3a3a3a] rounded shadow-lg overflow-hidden"
                    style={{
                      top: `${hazardDropdownPosition.top + 4}px`,
                      left: `${hazardDropdownPosition.left}px`,
                      width: `${hazardDropdownPosition.width}px`,
                    }}
                  >
                    {uploadedFiles.length === 0 ? (
                      <div className="px-2.5 py-2 text-[10px] text-gray-400">
                        No file/s detected! Upload first.
                      </div>
                    ) : (
                      <>
                        {/* Search Box */}
                        <div className="p-1.5 pb-1">
                          <input
                            type="text"
                            placeholder="Search files..."
                            value={hazardFileSearchTerm}
                            onChange={(e) =>
                              setHazardFileSearchTerm(e.target.value)
                            }
                            className="w-full p-1.5 bg-transparent rounded text-white text-[10px] outline-none focus:ring-0 focus:outline-none hover:outline-none"
                            onClick={(e) => e.stopPropagation()}
                          />
                        </div>

                        {/* Filtered file list with checkboxes */}
                        <div
                          className="overflow-y-auto max-h-32 p-1.5"
                          style={{
                            scrollbarWidth: "thin",
                            scrollbarColor: "#5a5a5a transparent",
                          }}
                        >
                          {uploadedFiles
                            .filter((file) =>
                              file.name
                                .toLowerCase()
                                .includes(hazardFileSearchTerm.toLowerCase())
                            )
                            .map((file, index) => (
                              <div
                                key={index}
                                className="flex items-center py-2 px-2.5 hover:bg-[#454545] rounded cursor-pointer"
                                onClick={() => {
                                  setSelectedImportedHazardFiles((prev) =>
                                    prev.includes(file.name)
                                      ? prev.filter(
                                          (name) => name !== file.name
                                        )
                                      : [...prev, file.name]
                                  );
                                }}
                              >
                                <Checkbox
                                  className="mr-2.5 pointer-events-none"
                                  style={{
                                    width: "14px",
                                    height: "14px",
                                    minWidth: "14px",
                                    minHeight: "14px",
                                  }}
                                  checked={selectedImportedHazardFiles.includes(
                                    file.name
                                  )}
                                />
                                <span
                                  className="text-[10px] text-white truncate"
                                  title={file.name}
                                >
                                  {file.name}
                                </span>
                              </div>
                            ))}
                          {uploadedFiles.filter((file) =>
                            file.name
                              .toLowerCase()
                              .includes(hazardFileSearchTerm.toLowerCase())
                          ).length === 0 && (
                            <div className="px-2.5 py-2 text-[10px] text-gray-400 text-center">
                              No files found
                            </div>
                          )}
                        </div>
                      </>
                    )}
                  </div>,
                  document.body
                )}
            </div>
          )}
        </div>

        {/* Step 2: Select Exposed Element/s */}
        <div className="relative">
          <label className="block text-white text-[10px] font-medium mb-1.5">
            2. Select Exposed Element/s
          </label>
          <button
            onClick={() => setElementDataDropdownOpen((prev) => !prev)}
            disabled={
              !hazardDataSource ||
              (hazardDataSource === "Use imported data" &&
                selectedImportedHazardFiles.length === 0) ||
              (hazardDataSource === "Use existing data" &&
                selectedHazardData.length === 0)
            }
            className={`flex justify-between items-center w-full px-2.5 py-2 rounded shadow-md transition
            ${
              hazardDataSource &&
              ((hazardDataSource === "Use imported data" &&
                selectedImportedHazardFiles.length > 0) ||
                (hazardDataSource === "Use existing data" &&
                  selectedHazardData.length > 0))
                ? "bg-[#3a3a3a] text-white hover:bg-[#454545] cursor-pointer"
                : "bg-[#2a2a2a] text-gray-500 cursor-not-allowed"
            }`}
          >
            <span className="text-[10px]">
              {elementDataSource || "Choose data source..."}
            </span>
            <ChevronDown
              size={14}
              className={`transition-transform duration-200 ${
                elementDataDropdownOpen ? "rotate-180" : ""
              }`}
            />
          </button>

          {elementDataDropdownOpen && (
            <div className="absolute z-50 mt-1 w-full bg-[#3a3a3a] rounded shadow-lg overflow-hidden">
              {elementDataOptions.map((option, index) => (
                <div
                  key={index}
                  onClick={() => {
                    setElementDataSource(option);
                    setElementDataDropdownOpen(false);
                  }}
                  className="px-2.5 py-2 text-[10px] text-white hover:bg-[#505050] cursor-pointer"
                >
                  {option}
                </div>
              ))}
            </div>
          )}

          {/* Show existing data cards when "Use existing data" is selected */}
          {elementDataSource === "Use existing data" && (
            <div className="mt-2 bg-[#3a3a3a] rounded shadow-md p-3 space-y-2">
              <div className="text-white text-[10px] mb-1.5">
                Select data to use:
              </div>
              <div
                className="space-y-1.5 max-h-[300px] overflow-y-auto pr-1.5"
                style={{
                  scrollbarWidth: "thin",
                  scrollbarColor: "#706f6f transparent",
                }}
              >
                {getAllElementData().map((item, index) => (
                  <div
                    key={index}
                    onClick={() => {
                      setSelectedElementData((prev) =>
                        prev.includes(item.displayName)
                          ? prev.filter((name) => name !== item.displayName)
                          : [...prev, item.displayName]
                      );
                    }}
                    className={`p-2 rounded cursor-pointer transition flex items-center gap-2 ${
                      selectedElementData.includes(item.displayName)
                        ? "bg-[#3d3e69] border-2 border-[#9699FF]"
                        : "bg-[#2a2a2a] hover:bg-[#353535]"
                    }`}
                  >
                    <Checkbox
                      checked={selectedElementData.includes(item.displayName)}
                      className="pointer-events-none"
                      style={{
                        width: "14px",
                        height: "14px",
                        minWidth: "14px",
                        minHeight: "14px",
                      }}
                    />
                    <div className="flex-1">
                      <div className="text-white text-[10px] font-medium mb-1">
                        {item.config.elementType}
                      </div>
                      <div className="text-gray-400 text-[10px] mb-0.5">
                        {item.config.name}, {item.config.country}
                      </div>
                      <div className="text-gray-400 text-[10px]">
                        Source: {item.config.source}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Show imported file dropdown when "Use imported data" is selected */}
          {elementDataSource === "Use imported data" && (
            <div className="mt-2 relative" style={{ overflow: "visible" }}>
              <label className="block text-white text-[10px] font-medium mb-1.5">
                Select Imported Data
              </label>
              <button
                ref={elementFileButtonRef}
                onClick={() => {
                  if (elementFileButtonRef.current) {
                    const rect =
                      elementFileButtonRef.current.getBoundingClientRect();
                    setElementDropdownPosition({
                      top: rect.bottom + window.scrollY,
                      left: rect.left + window.scrollX,
                      width: rect.width,
                    });
                  }
                  setImportedElementFileDropdownOpen((prev) => !prev);
                }}
                className="flex justify-between items-center w-full bg-[#3a3a3a] text-white px-2.5 py-2 rounded shadow-md hover:bg-[#454545] transition"
              >
                <span className="text-[10px] truncate">
                  {selectedImportedElementFiles.length > 0
                    ? `${selectedImportedElementFiles.length} selected`
                    : "Choose file..."}
                </span>
                <ChevronDown
                  size={14}
                  className={`transition-transform duration-200 flex-shrink-0 ml-2 ${
                    importedElementFileDropdownOpen ? "rotate-180" : ""
                  }`}
                />
              </button>

              {importedElementFileDropdownOpen &&
                createPortal(
                  <div
                    className="fixed z-[9999] bg-[#3a3a3a] rounded shadow-lg overflow-hidden"
                    style={{
                      top: `${elementDropdownPosition.top + 4}px`,
                      left: `${elementDropdownPosition.left}px`,
                      width: `${elementDropdownPosition.width}px`,
                    }}
                  >
                    {uploadedFiles.length === 0 ? (
                      <div className="px-2.5 py-2 text-[10px] text-gray-400">
                        No file/s detected! Upload first.
                      </div>
                    ) : (
                      <>
                        {/* Search Box */}
                        <div className="p-1.5 pb-1">
                          <input
                            type="text"
                            placeholder="Search files..."
                            value={elementFileSearchTerm}
                            onChange={(e) =>
                              setElementFileSearchTerm(e.target.value)
                            }
                            className="w-full p-1.5 bg-transparent rounded text-white text-[10px] outline-none focus:ring-0 focus:outline-none hover:outline-none"
                            onClick={(e) => e.stopPropagation()}
                          />
                        </div>

                        {/* Filtered file list with checkboxes */}
                        <div
                          className="overflow-y-auto max-h-32 p-1.5"
                          style={{
                            scrollbarWidth: "thin",
                            scrollbarColor: "#5a5a5a transparent",
                          }}
                        >
                          {uploadedFiles
                            .filter((file) =>
                              file.name
                                .toLowerCase()
                                .includes(elementFileSearchTerm.toLowerCase())
                            )
                            .map((file, index) => (
                              <div
                                key={index}
                                className="flex items-center py-2 px-2.5 hover:bg-[#454545] rounded cursor-pointer"
                                onClick={() => {
                                  setSelectedImportedElementFiles((prev) =>
                                    prev.includes(file.name)
                                      ? prev.filter(
                                          (name) => name !== file.name
                                        )
                                      : [...prev, file.name]
                                  );
                                }}
                              >
                                <Checkbox
                                  className="mr-2.5 pointer-events-none"
                                  style={{
                                    width: "14px",
                                    height: "14px",
                                    minWidth: "14px",
                                    minHeight: "14px",
                                  }}
                                  checked={selectedImportedElementFiles.includes(
                                    file.name
                                  )}
                                />
                                <span
                                  className="text-[10px] text-white truncate"
                                  title={file.name}
                                >
                                  {file.name}
                                </span>
                              </div>
                            ))}
                          {uploadedFiles.filter((file) =>
                            file.name
                              .toLowerCase()
                              .includes(elementFileSearchTerm.toLowerCase())
                          ).length === 0 && (
                            <div className="px-2.5 py-2 text-[10px] text-gray-400 text-center">
                              No files found
                            </div>
                          )}
                        </div>
                      </>
                    )}
                  </div>,
                  document.body
                )}
            </div>
          )}
        </div>

        {/* Run Analysis Button */}
        <button
          disabled={!isComplete || isAnalyzing}
          onClick={handleRunAnalysis}
          className={`w-full px-2.5 py-2 rounded shadow-md font-medium transition mt-2
          ${
            isComplete && !isAnalyzing
              ? "bg-[#5A5C99] text-white hover:opacity-90"
              : "bg-[#3a3a3a] text-gray-500 cursor-not-allowed"
          }`}
        >
          {isAnalyzing ? "Analyzing..." : "Run Assessment"}
        </button>

        {/* Clear Steps Button */}
        <button
          onClick={handleClearSteps}
          disabled={!hasAnySelection}
          className={`w-full px-2.5 py-2 rounded shadow-md font-medium transition
          ${
            hasAnySelection
              ? "bg-[#5A5C99] text-white hover:opacity-90"
              : "bg-[#3a3a3a] text-gray-500 cursor-not-allowed"
          }`}
        >
          Clear Steps
        </button>
      </div>
    );
  }
);

ExposureAssessmentControls.displayName = "ExposureAssessmentControls";

export default ExposureAssessmentControls;
