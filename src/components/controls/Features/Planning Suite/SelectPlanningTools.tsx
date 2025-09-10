"use client";

import { useState } from "react";
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
      className="mt-[18px] w-full bg-[#2E2E2E] rounded-xl shadow-md text-[#C7C7C7] flex flex-col pb-[25px]"
      style={{
        maxHeight: "calc(100vh - 91px - 18px)",
      }}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 pt-4 pb-3 z-10">
        <span className="text-[15px] font-medium text-[#C7C7C7]">
          Select tools to include:
        </span>
        <button
          onClick={
            selectedPlanningTools.length === 0 ? undefined : onGoToToolPanel
          }
          disabled={selectedPlanningTools.length === 0}
          className={`text-sm flex items-center gap-1 transition ${
            selectedPlanningTools.length === 0
              ? "text-[#555] cursor-not-allowed"
              : "text-[#8183e5] hover:text-[#a7a9fa]"
          }`}
        >
          Go to tool panel
          <ChevronRight size={16} />
        </button>
      </div>

      {/* Scrollable Tool List */}
      <div className="scrollbar-rounded overflow-y-auto px-4 pb-4 flex-1 space-y-3">
        {toolOptions.map((label, i) => (
          <div
            key={i}
            className="bg-[#3a3a3a] h-[147px] px-4 py-3 rounded-lg hover:bg-[#4a4a4a] transition flex items-center"
          >
            <Checkbox
              checked={selectedPlanningTools.includes(label)}
              onCheckedChange={() => handleToggle(label)}
              className="mr-4 w-[18px] h-[18px]"
            />
            <div className="text-[17px] font-medium">{label}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
