"use client";

import { ChevronRight } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";

interface Props {
  isVisible: boolean;
  selectedPlanningTools: string[];
  onGoToToolPanel: () => void;
  onSelectedPlanningToolsChange: (tools: string[]) => void;
}

export default function SelectPlanningTools({
  isVisible,
  selectedPlanningTools,
  onGoToToolPanel,
  onSelectedPlanningToolsChange,
}: Props) {
  if (!isVisible) return null;

  const toolOptions = [
    "Resource Planner",
    "Evacuation Planner",
    "Recovery Planner",
  ];

  const handleToggle = (label: string) => {
    const updated = selectedPlanningTools.includes(label)
      ? selectedPlanningTools.filter((item) => item !== label)
      : [...selectedPlanningTools, label];
    onSelectedPlanningToolsChange(updated);
  };

  return (
    <div
      className="w-full bg-[#2E2E2E] rounded-lg shadow-md text-[#C7C7C7] flex flex-col pb-4"
      style={{
        maxHeight: "calc(100vh - 91px)",
      }}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-3 pt-3 pb-2 z-10">
        <span className="text-[10px] font-medium text-[#C7C7C7]">
          Select planners to use:
        </span>
        <button
          onClick={
            selectedPlanningTools.length === 0 ? undefined : onGoToToolPanel
          }
          disabled={selectedPlanningTools.length === 0}
          className={`text-[10px] flex items-center gap-0.5 transition ${
            selectedPlanningTools.length === 0
              ? "text-[#555] cursor-not-allowed"
              : "text-[#8183e5] hover:text-[#a7a9fa]"
          }`}
        >
          Go to tool panel
          <ChevronRight size={12} />
        </button>
      </div>

      {/* Scrollable Tool List */}
      <div className="scrollbar-rounded overflow-y-auto px-3 pb-3 flex-1 space-y-2">
        {toolOptions.map((label, i) => {
          const isComingSoon =
            label === "Evacuation Planner" || label === "Recovery Planner";

          return (
            <div
              key={i}
              className={`bg-[#3a3a3a] h-[110px] px-3 py-2 rounded-md transition flex items-center ${
                isComingSoon
                  ? "opacity-60 cursor-not-allowed"
                  : "hover:bg-[#4a4a4a]"
              }`}
            >
              <Checkbox
                checked={selectedPlanningTools.includes(label)}
                onCheckedChange={() => !isComingSoon && handleToggle(label)}
                disabled={isComingSoon}
                className="mr-3"
                style={{
                  width: "14px",
                  height: "14px",
                  minWidth: "14px",
                  minHeight: "14px",
                }}
              />
              <div className="flex flex-col">
                <div
                  className={`text-[12px] font-medium ${
                    isComingSoon ? "text-gray-400" : ""
                  }`}
                >
                  {label}
                </div>
                {isComingSoon && (
                  <div className="text-[10px] text-[#8183e5] mt-1">
                    Coming Soon...
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
