"use client";

import { ChevronRight } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";

interface Props {
  isVisible: boolean;
}

export default function SelectPlanningTools({ isVisible }: Props) {
  if (!isVisible) return null;

  const toolOptions = [
    "Evacuation Planner",
    "Resource Planner",
    "Recovery Planner",
    "Medical Response Planner",
    "Communication & Alert Planner", // ✅ Added this line
  ];

  return (
    <div
      className="mt-[18px] w-full bg-[#2E2E2E] rounded-xl shadow-md text-[#C7C7C7] flex flex-col pb-[25px]"
      style={{
        height: "calc(100vh - 91px - 18px)",
      }}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 pt-4 pb-3 z-10">
        <span className="text-[15px] font-medium text-[#C7C7C7]">
          Select tools to include:
        </span>
        <button className="text-sm text-[#8183e5] hover:text-[#a7a9fa] flex items-center gap-1 transition">
          Go to controls
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
            <Checkbox className="mr-4 w-[18px] h-[18px]" />
            <div className="text-[17px] font-medium">{label}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
