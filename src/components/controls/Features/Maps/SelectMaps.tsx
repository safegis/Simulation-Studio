import { useState } from "react";
import { ChevronRight, ChevronDown } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";

interface Props {
  isVisible: boolean;
  selectedMaps: string[];
  onGoToToolPanel: () => void;
  onSelectedMapsChange: (maps: string[]) => void;
}

export default function SelectMaps({
  isVisible,
  selectedMaps,
  onGoToToolPanel,
  onSelectedMapsChange,
}: Props) {
  if (!isVisible) return null;

  const mapOptions = [
    "Hazard Mapper",
    "Exposure Analyzer",
    "Vulnerability Analyzer",
    "Critical Facility Mapper",
  ];

  const handleToggle = (label: string) => {
    const updated = selectedMaps.includes(label)
      ? selectedMaps.filter((item) => item !== label)
      : [...selectedMaps, label];
    onSelectedMapsChange(updated);
  };

  return (
    <div
      className="mt-[18px] w-full bg-[#2E2E2E] rounded-xl shadow-md text-[#C7C7C7] flex flex-col pb-[25px]"
      style={{ height: "calc(100vh - 91px - 18px)" }}
    >
      <div className="flex items-center justify-between px-4 pt-4 pb-3 z-10">
        <span className="text-[15px] font-medium text-[#C7C7C7]">
          Select tools to include:
        </span>
        <button
          onClick={selectedMaps.length === 0 ? undefined : onGoToToolPanel}
          disabled={selectedMaps.length === 0}
          className={`text-sm flex items-center gap-1 transition ${
            selectedMaps.length === 0
              ? "text-[#555] cursor-not-allowed"
              : "text-[#8183e5] hover:text-[#a7a9fa]"
          }`}
        >
          Go to tool panel
          <ChevronRight size={16} />
        </button>
      </div>

      <div className="scrollbar-rounded overflow-y-auto px-4 pb-4 flex-1 space-y-3">
        {mapOptions.map((label, i) => (
          <div
            key={i}
            className="bg-[#3a3a3a] h-[187px] px-4 py-3 rounded-lg hover:bg-[#4a4a4a] transition flex items-center"
          >
            <Checkbox
              checked={selectedMaps.includes(label)}
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
