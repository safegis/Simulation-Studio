// \SafeGIS\Simulation-Studio\frontend\src\components\controls\Features\Assessment Tools\Exposure Assessment\ExposureAssessmentControls.tsx
"use client";

import React, { useState, useEffect } from "react";
import { ChevronDown } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";

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
}

const ExposureAssessmentControls: React.FC<Props> = ({
  PanelToggle,
  mapRef,
}) => {
  const [hazardCategory, setHazardCategory] = useState<string>("");
  const [hazardCategoryDropdownOpen, setHazardCategoryDropdownOpen] =
    useState(false);
  const [selectedHazard, setSelectedHazard] = useState<string>("");
  const [hazardDropdownOpen, setHazardDropdownOpen] = useState(false);
  const [hazardDataSource, setHazardDataSource] = useState<string>("");
  const [hazardDataDropdownOpen, setHazardDataDropdownOpen] = useState(false);
  const [analysisScope, setAnalysisScope] = useState<string>("");
  const [scopeDropdownOpen, setScopeDropdownOpen] = useState(false);
  const [selectedElements, setSelectedElements] = useState<string[]>([]);
  const [elementDataSource, setElementDataSource] = useState<string>("");
  const [elementDataDropdownOpen, setElementDataDropdownOpen] = useState(false);

  const hazardCategoryOptions = ["Hydro-Meteorological", "Geological"];

  const getHazardOptions = () => {
    if (hazardCategory === "Hydro-Meteorological") {
      return ["Flood", "Storm Surge", "Tsunami", "Landslide (Rain-induced)"];
    } else if (hazardCategory === "Geological") {
      return ["Earthquake", "Landslide (Earthquake-triggered)"];
    }
    return [];
  };

  const hazardDataOptions = ["Use existing hazard layer", "Use imported data"];

  const scopeOptions = ["Current map view", "Draw custom area"];

  const exposureElements = [
    "Population Density",
    "Areas (e.g. Regions, Cities)",
    "Land Cover",
    "Critical Facilities",
    "Transportation Networks",
  ];

  const elementDataOptions = ["Use existing data", "Use imported data"];

  const handleElementToggle = (item: string) => {
    setSelectedElements((prev) =>
      prev.includes(item) ? prev.filter((i) => i !== item) : [...prev, item]
    );
  };

  const handleClearSteps = () => {
    setHazardCategory("");
    setSelectedHazard("");
    setHazardDataSource("");
    setAnalysisScope("");
    setSelectedElements([]);
    setElementDataSource("");
    // Close all dropdowns
    setHazardCategoryDropdownOpen(false);
    setHazardDropdownOpen(false);
    setHazardDataDropdownOpen(false);
    setScopeDropdownOpen(false);
    setElementDataDropdownOpen(false);
  };

  // Reset selectedHazard when hazardCategory changes
  useEffect(() => {
    setSelectedHazard("");
  }, [hazardCategory]);

  const isComplete =
    hazardCategory &&
    selectedHazard &&
    hazardDataSource &&
    analysisScope &&
    selectedElements.length > 0 &&
    elementDataSource;

  const hasAnySelection =
    hazardCategory ||
    selectedHazard ||
    hazardDataSource ||
    analysisScope ||
    selectedElements.length > 0 ||
    elementDataSource;

  return (
    <div className="space-y-4">
      {/* Instructions */}
      <div className="text-gray-300 text-sm">
        Analyze exposed population and assets within hazard zones
      </div>

      {/* Step 1: Select Hazard Category */}
      <div className="relative">
        <label className="block text-white text-sm font-medium mb-2">
          1. Select Hazard Category
        </label>
        <button
          onClick={() => setHazardCategoryDropdownOpen((prev) => !prev)}
          className="flex justify-between items-center w-full bg-[#3a3a3a] text-white px-3 py-2 rounded-md shadow-md hover:bg-[#454545] transition"
        >
          <span className="text-sm">
            {hazardCategory || "Choose category..."}
          </span>
          <ChevronDown
            size={16}
            className={`transition-transform duration-200 ${
              hazardCategoryDropdownOpen ? "rotate-180" : ""
            }`}
          />
        </button>

        {hazardCategoryDropdownOpen && (
          <div className="absolute z-50 mt-1 w-full bg-[#3a3a3a] rounded-md shadow-lg overflow-hidden">
            {hazardCategoryOptions.map((option, index) => (
              <div
                key={index}
                onClick={() => {
                  setHazardCategory(option);
                  setHazardCategoryDropdownOpen(false);
                }}
                className="px-3 py-2 text-sm text-white hover:bg-[#505050] cursor-pointer"
              >
                {option}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Step 2: Select Specific Hazard */}
      <div className="relative">
        <label className="block text-white text-sm font-medium mb-2">
          2. Select Specific Hazard
        </label>
        <button
          onClick={() => setHazardDropdownOpen((prev) => !prev)}
          disabled={!hazardCategory}
          className={`flex justify-between items-center w-full px-3 py-2 rounded-md shadow-md transition
            ${
              hazardCategory
                ? "bg-[#3a3a3a] text-white hover:bg-[#454545] cursor-pointer"
                : "bg-[#2a2a2a] text-gray-500 cursor-not-allowed"
            }`}
        >
          <span className="text-sm">
            {selectedHazard || "Choose hazard..."}
          </span>
          <ChevronDown
            size={16}
            className={`transition-transform duration-200 ${
              hazardDropdownOpen ? "rotate-180" : ""
            }`}
          />
        </button>

        {hazardDropdownOpen && hazardCategory && (
          <div className="absolute z-50 mt-1 w-full bg-[#3a3a3a] rounded-md shadow-lg overflow-hidden">
            {getHazardOptions().map((option, index) => (
              <div
                key={index}
                onClick={() => {
                  setSelectedHazard(option);
                  setHazardDropdownOpen(false);
                }}
                className="px-3 py-2 text-sm text-white hover:bg-[#505050] cursor-pointer"
              >
                {option}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Step 3: Add Hazard Data */}
      <div className="relative">
        <label className="block text-white text-sm font-medium mb-2">
          3. Add Hazard Data
        </label>
        <button
          onClick={() => setHazardDataDropdownOpen((prev) => !prev)}
          disabled={!selectedHazard}
          className={`flex justify-between items-center w-full px-3 py-2 rounded-md shadow-md transition
            ${
              selectedHazard
                ? "bg-[#3a3a3a] text-white hover:bg-[#454545] cursor-pointer"
                : "bg-[#2a2a2a] text-gray-500 cursor-not-allowed"
            }`}
        >
          <span className="text-sm">
            {hazardDataSource || "Choose data source..."}
          </span>
          <ChevronDown
            size={16}
            className={`transition-transform duration-200 ${
              hazardDataDropdownOpen ? "rotate-180" : ""
            }`}
          />
        </button>

        {hazardDataDropdownOpen && selectedHazard && (
          <div className="absolute z-50 mt-1 w-full bg-[#3a3a3a] rounded-md shadow-lg overflow-hidden">
            {hazardDataOptions.map((option, index) => (
              <div
                key={index}
                onClick={() => {
                  setHazardDataSource(option);
                  setHazardDataDropdownOpen(false);
                }}
                className="px-3 py-2 text-sm text-white hover:bg-[#505050] cursor-pointer"
              >
                {option}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Step 4: Define Analysis Scope */}
      <div className="relative">
        <label className="block text-white text-sm font-medium mb-2">
          4. Define Analysis Scope
        </label>
        <button
          onClick={() => setScopeDropdownOpen((prev) => !prev)}
          disabled={!hazardDataSource}
          className={`flex justify-between items-center w-full px-3 py-2 rounded-md shadow-md transition
            ${
              hazardDataSource
                ? "bg-[#3a3a3a] text-white hover:bg-[#454545] cursor-pointer"
                : "bg-[#2a2a2a] text-gray-500 cursor-not-allowed"
            }`}
        >
          <span className="text-sm">{analysisScope || "Choose scope..."}</span>
          <ChevronDown
            size={16}
            className={`transition-transform duration-200 ${
              scopeDropdownOpen ? "rotate-180" : ""
            }`}
          />
        </button>

        {scopeDropdownOpen && hazardDataSource && (
          <div className="absolute z-50 mt-1 w-full bg-[#3a3a3a] rounded-md shadow-lg overflow-hidden">
            {scopeOptions.map((option, index) => (
              <div
                key={index}
                onClick={() => {
                  setAnalysisScope(option);
                  setScopeDropdownOpen(false);
                }}
                className="px-3 py-2 text-sm text-white hover:bg-[#505050] cursor-pointer"
              >
                {option}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Step 5: Select Exposure Elements */}
      <div>
        <label className="block text-white text-sm font-medium mb-2">
          5. Select Exposure Elements
        </label>
        <div className="space-y-2 bg-[#3a3a3a] p-3 rounded-md shadow-md">
          {exposureElements.map((item, index) => (
            <div key={index} className="flex items-center">
              <Checkbox
                className="mr-2.5 w-[16px] h-[16px]"
                disabled={!analysisScope}
                checked={selectedElements.includes(item)}
                onCheckedChange={() => handleElementToggle(item)}
              />
              <span
                className={`text-sm ${
                  !analysisScope ? "text-gray-500" : "text-white"
                }`}
              >
                {item}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Step 6: Add Exposure Element Data */}
      <div className="relative">
        <label className="block text-white text-sm font-medium mb-2">
          6. Add Exposure Element Data
        </label>
        <button
          onClick={() => setElementDataDropdownOpen((prev) => !prev)}
          disabled={selectedElements.length === 0}
          className={`flex justify-between items-center w-full px-3 py-2 rounded-md shadow-md transition
            ${
              selectedElements.length > 0
                ? "bg-[#3a3a3a] text-white hover:bg-[#454545] cursor-pointer"
                : "bg-[#2a2a2a] text-gray-500 cursor-not-allowed"
            }`}
        >
          <span className="text-sm">
            {elementDataSource || "Choose data source..."}
          </span>
          <ChevronDown
            size={16}
            className={`transition-transform duration-200 ${
              elementDataDropdownOpen ? "rotate-180" : ""
            }`}
          />
        </button>

        {elementDataDropdownOpen && selectedElements.length > 0 && (
          <div className="absolute z-50 mt-1 w-full bg-[#3a3a3a] rounded-md shadow-lg overflow-hidden">
            {elementDataOptions.map((option, index) => (
              <div
                key={index}
                onClick={() => {
                  setElementDataSource(option);
                  setElementDataDropdownOpen(false);
                }}
                className="px-3 py-2 text-sm text-white hover:bg-[#505050] cursor-pointer"
              >
                {option}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Run Analysis Button */}
      <button
        disabled={!isComplete}
        className={`w-full py-2.5 rounded-md shadow-md font-medium transition
          ${
            isComplete
              ? "bg-[#5A5C99] text-white hover:opacity-90"
              : "bg-[#3a3a3a] text-gray-500 cursor-not-allowed"
          }`}
      >
        Run Exposure Analysis
      </button>

      {/* Clear Steps Button */}
      <div className="-mt-2">
        <button
          onClick={handleClearSteps}
          disabled={!hasAnySelection}
          className={`w-full py-2.5 rounded-md shadow-md font-medium transition
            ${
              hasAnySelection
                ? "bg-[#5A5C99] text-white hover:opacity-90"
                : "bg-[#3a3a3a] text-gray-500 cursor-not-allowed"
            }`}
        >
          Clear Steps
        </button>
      </div>

      {/* Results Container - Always Visible */}
      <div
        className={`mt-7 p-3 rounded-md shadow-md transition-colors ${
          isComplete ? "bg-[#3a3a3a]" : "bg-[#2a2a2a]"
        }`}
      >
        <div
          className={`text-sm font-medium mb-2 ${
            isComplete ? "text-white" : "text-gray-500"
          }`}
        >
          Analysis Results
        </div>
        <div
          className={`text-xs ${
            isComplete ? "text-gray-400" : "text-gray-600"
          }`}
        >
          {isComplete
            ? "Results will appear here after running the analysis"
            : "Complete all steps above to run the analysis"}
        </div>
      </div>
    </div>
  );
};

export default ExposureAssessmentControls;
