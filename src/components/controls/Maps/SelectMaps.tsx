"use client";

import { ChevronRight } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";

interface Props {
  isVisible: boolean;
}

export default function SelectMaps({ isVisible }: Props) {
  if (!isVisible) return null;

  const mapOptions = [
    "Hazard Maps",
    "Exposure Maps",
    "Vulnerability Maps",
    "Critical Facility Maps",
  ];

  return (
    <div
      className="mt-[18px] w-full bg-[#2E2E2E] rounded-xl shadow-md text-[#C7C7C7] flex flex-col"
      style={{
        height: "calc(100vh - 91px - 18px)", // 55px search + 18px gap + 18px bottom
      }}
    >
      {/* Fixed Header */}
      <div className="flex items-center justify-between px-4 pt-4 pb-3 z-10">
        <span className="text-[15px] font-medium text-[#C7C7C7]">
          Select maps to include:
        </span>
        <button className="text-sm text-[#6B6DCC] hover:underline flex items-center gap-1 transition">
          Go to controls
          <ChevronRight size={16} />
        </button>
      </div>

      {/* Scrollable area */}
      <div className="scrollbar-rounded overflow-y-auto px-4 pb-4 flex-1 space-y-3">
        {mapOptions.map((label, i) => (
          <div
            key={i}
            className="bg-[#3a3a3a] h-[192.1px] px-4 py-3 rounded-lg hover:bg-[#4a4a4a] transition flex items-center"
          >
            <Checkbox className="mr-4 w-[18px] h-[18px]" />
            <div className="text-[17px] font-medium">{label}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
