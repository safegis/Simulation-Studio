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
      className="mt-[18px] w-full bg-[#2E2E2E] rounded-xl shadow-md text-[#C7C7C7] flex flex-col overflow-y-auto scrollbar-rounded"
      style={{
        maxHeight: "calc(100vh - 91px - 18px)",
        padding: "8px", // equal top, bottom, left, and right padding
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
          <div
            key={key}
            className={index !== arr.length - 1 ? "mb-3" : ""} // remove margin from last item
          >
            <button
              onClick={() => togglePanel(key)}
              className="flex justify-between items-center px-4 w-full"
              style={{
                height: "50px",
                backgroundColor: "#454545",
                border: "2.5px solid #999999",
                borderRadius: "8px",
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
                className="bg-[#3A3A3A] text-sm text-white p-4 rounded-b-xl mt-2"
                style={{
                  border: "2.5px solid #999999",
                  borderTop: "none",
                  borderRadius: "0 0 8px 8px",
                }}
              >
                <p>
                  This is the panel for <strong>{displayName}</strong>.
                </p>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
