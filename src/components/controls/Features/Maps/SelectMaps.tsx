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

  const mapOptions = ["Hazard Layers", "Critical Facility Layers"];

  // Map each option to its background image
  const bgImages: Record<string, string> = {
    "Hazard Layers": "/Images/Background/HazardMap.png",
    "Critical Facility Layers": "/Images/Background/CriticalFacilityMap.png",
  };

  const handleToggle = (label: string) => {
    const updated = selectedMaps.includes(label)
      ? selectedMaps.filter((item) => item !== label)
      : [...selectedMaps, label];
    onSelectedMapsChange(updated);
  };

  return (
    <div
      className="w-full bg-[#2E2E2E] rounded-lg shadow-md text-[#C7C7C7] flex flex-col pb-4"
      style={{ maxHeight: "calc(100vh - 91px)" }}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-3 pt-3 pb-2 z-10">
        <span className="text-[10px] font-medium text-[#C7C7C7]">
          Select layers to include:
        </span>
        <button
          onClick={selectedMaps.length === 0 ? undefined : onGoToToolPanel}
          disabled={selectedMaps.length === 0}
          className={`text-[10px] flex items-center gap-0.5 transition ${
            selectedMaps.length === 0
              ? "text-[#555] cursor-not-allowed"
              : "text-[#8183e5] hover:text-[#a7a9fa]"
          }`}
        >
          Go to tool panel
          <ChevronRight size={12} />
        </button>
      </div>

      {/* Options */}
      <div className="scrollbar-rounded overflow-y-auto px-3 pb-3 flex-1 space-y-2">
        {mapOptions.map((label, i) => {
          const bgImage = bgImages[label];

          return (
            <div
              key={i}
              className={`option-card group h-[110px] px-3 py-2 rounded-md transition flex items-center relative overflow-hidden
              ${
                bgImage
                  ? "bg-cover bg-center text-white hover:brightness-110"
                  : "bg-[#3a3a3a] hover:bg-[#4a4a4a]"
              }`}
              style={bgImage ? { backgroundImage: `url('${bgImage}')` } : {}}
            >
              {/* Dark overlay */}
              {bgImage && (
                <div className="absolute inset-0 bg-black/65 rounded-md"></div>
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
                  rx="6"
                  ry="6"
                  className="animated-border"
                  fill="none"
                  stroke="#9699FF"
                  strokeWidth="2"
                />
                <rect
                  x="2"
                  y="2"
                  width="calc(100% - 4px)"
                  height="calc(100% - 4px)"
                  rx="6"
                  ry="6"
                  className="animated-border"
                  fill="none"
                  stroke="#9699FF"
                  strokeWidth="1"
                />
              </svg>

              <div className="relative flex items-center z-10">
                <Checkbox
                  checked={selectedMaps.includes(label)}
                  onCheckedChange={() => handleToggle(label)}
                  className="mr-3 w-[14px] h-[14px]"
                />
                <div className="text-[10px] font-medium drop-shadow-md">
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
