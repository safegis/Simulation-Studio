import { useState } from "react";
import { ChevronRight } from "lucide-react";
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
    "Hazard Map",
    "Critical Facility Map",
    "Exposure Assessment",
  ];

  // Map each option to its background image
  const bgImages: Record<string, string> = {
    "Hazard Map": "/Images/Background/HazardMap.png",
    "Critical Facility Map": "/Images/Background/CriticalFacilityMap.png",
    "Exposure Assessment": "/Images/Background/ExposureAssessment.png",
  };

  const handleToggle = (label: string) => {
    const updated = selectedMaps.includes(label)
      ? selectedMaps.filter((item) => item !== label)
      : [...selectedMaps, label];
    onSelectedMapsChange(updated);
  };

  return (
    <div
      className="mt-[18px] w-full bg-[#2E2E2E] rounded-xl shadow-md text-[#C7C7C7] flex flex-col pb-[25px]"
      style={{ maxHeight: "calc(100vh - 91px - 18px)" }}
    >
      {/* Header */}
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

      {/* Options */}
      <div className="scrollbar-rounded overflow-y-auto px-4 pb-4 flex-1 space-y-3">
        {mapOptions.map((label, i) => {
          const bgImage = bgImages[label];

          return (
            <div
              key={i}
              className={`option-card group h-[147px] px-4 py-3 rounded-lg transition flex items-center relative overflow-hidden
    ${
      bgImage
        ? "bg-cover bg-center text-white hover:brightness-110"
        : "bg-[#3a3a3a] hover:bg-[#4a4a4a]"
    }`}
              style={bgImage ? { backgroundImage: `url('${bgImage}')` } : {}}
            >
              {/* Dark overlay */}
              {bgImage && (
                <div className="absolute inset-0 bg-black/65 rounded-lg"></div>
              )}

              {/* Animated border overlay */}
              <svg
                className="absolute inset-0 w-full h-full pointer-events-none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <rect
                  x="2"
                  y="2"
                  width="calc(100% - 4px)"
                  height="calc(100% - 4px)"
                  rx="8" /* match rounded-lg */
                  ry="8"
                  className="animated-border"
                  fill="none"
                  stroke="#9699FF" // <-- your color here
                  strokeWidth="3"
                />
                <rect
                  x="2"
                  y="2"
                  width="calc(100% - 4px)"
                  height="calc(100% - 4px)"
                  rx="8" /* match rounded-lg */
                  ry="8"
                  className="animated-border"
                  fill="none"
                  stroke="#9699FF" // <-- your color here
                  strokeWidth="1"
                />
              </svg>

              <div className="relative flex items-center z-10">
                <Checkbox
                  checked={selectedMaps.includes(label)}
                  onCheckedChange={() => handleToggle(label)}
                  className="mr-4 w-[18px] h-[18px]"
                />
                <div className="text-[17px] font-medium drop-shadow-md">
                  {label}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
