"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";

interface Props {
  isVisible: boolean;
  selectedMaps: string[];
  selectedPlanningTools: string[];
}

const displayNameMap: Record<string, string> = {
  "Hazard Map": "Hazard Map",
  "Exposure Map": "Exposure Map",
  "Vulnerability Map": "Vulnerability Map",
  "Critical Facility Map": "Critical Facility Map",
};

const displayNamePlanningTools: Record<string, string> = {
  "Evacuation Planner": "Evacuation Planner",
  "Resource Planner": "Resource Planner",
  "Recovery Planner": "Recovery Planner",
  "Medical Response Planner": "Medical Response Planner",
  "Communication & Alert Planner": "Communication & Alert Planner",
};

export default function ToolPanel({
  isVisible,
  selectedMaps,
  selectedPlanningTools,
}: Props) {
  const [expandedPanels, setExpandedPanels] = useState<Record<string, boolean>>(
    {}
  );

  if (!isVisible) return null;

  const togglePanel = (key: string) => {
    setExpandedPanels((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  return (
    <div
      className="mt-[18px] w-full bg-transparent rounded-xl shadow-md text-[#C7C7C7] flex flex-col overflow-y-auto scrollbar-rounded"
      style={{
        maxHeight: "calc(100vh - 91px - 18px)",
        padding: "0px",
      }}
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
              style={{
                height: "50px",
                backgroundColor: "#454545",
                border: "2.5px solid #999999",
              }}
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
              <div
                className="bg-[#2E2E2E] text-sm text-white p-4 rounded-b-xl mt-2 space-y-2"
                style={{
                  border: "2.5px solid #999999",
                  borderTop: "none",
                }}
              >
                {label === "Hazard Map" ? (
                  <>
                    <TransparentButton label="Hydro-Meteorological" />
                    <TransparentButton label="Geological" />
                    <TransparentButton label="Traffic Incidents" />
                    <TransparentButton label="Air Quality Index (AQI)" />
                    <TransparentButton label="Active Fires" />
                  </>
                ) : label === "Exposure Map" ? (
                  <>
                    <TransparentButton label="Population" />
                    <TransparentButton label="Biological" />
                    <TransparentButton label="Non-Biological" />
                  </>
                ) : label === "Vulnerability Map" ? (
                  <>
                    <TransparentButton label="Population" />
                    <TransparentButton label="Biological" />
                    <TransparentButton label="Non-Biological" />
                  </>
                ) : label === "Critical Facility Map" ? (
                  <>
                    <TransparentButton label="Active Evacuation Areas" />
                    <TransparentButton label="Medical Facilities" />
                    <TransparentButton label="Supply Hubs" />
                    <TransparentButton label="Public Transport Stations" />
                    <TransparentButton label="Police Stations" />
                    <TransparentButton label="Fire Stations" />
                    <TransparentButton label="Local Government Offices" />
                  </>
                ) : (
                  <p>
                    This is the panel for <strong>{displayName}</strong>.
                  </p>
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

function TransparentButton({ label }: { label: string }) {
  return (
    <button className="flex justify-between items-center w-full bg-transparent text-white px-2 py-2 rounded hover:bg-[#3a3a3a] transition">
      <span className="text-base font-medium">{label}</span>
      <ChevronDown size={18} className="text-white" />
    </button>
  );
}
