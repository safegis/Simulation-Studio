"use client";

import { ChevronDown } from "lucide-react";

interface Props {
  isVisible: boolean;
  selectedMaps: string[];
}

const displayNameMap: Record<string, string> = {
  "Hazard Maps": "Hazards",
  "Exposure Maps": "Exposure Assessment",
  "Vulnerability Maps": "Vulnerability Assessment",
  "Critical Facility Maps": "Critical Facilities",
};

export default function ToolPanel({ isVisible, selectedMaps }: Props) {
  if (!isVisible) return null;

  return (
    <div
      className="mt-[18px] w-full bg-[#2E2E2E] rounded-xl shadow-md text-[#C7C7C7] flex flex-col"
      style={{ height: "calc(100vh - 91px - 18px)" }}
    >
      {selectedMaps.map((label, i) => (
        <div
          key={i}
          className="flex justify-between items-center px-4"
          style={{
            height: "50px",
            backgroundColor: "#454545",
            border: "2.5px solid #999999",
            borderRadius: "12px",
          }}
        >
          <span className="text-base font-medium text-white">
            {displayNameMap[label] || label}
          </span>
          <ChevronDown size={20} className="text-white" />
        </div>
      ))}
    </div>
  );
}
