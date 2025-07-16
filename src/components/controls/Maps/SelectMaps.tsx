import { useState } from "react";
import { ChevronRight, ChevronDown } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";

interface Props {
  isVisible: boolean;
  onGoToToolPanel: () => void;
  onSelectedMapsChange: (maps: string[]) => void;
}

export default function SelectMaps({
  isVisible,
  onGoToToolPanel,
  onSelectedMapsChange,
}: Props) {
  const [selected, setSelected] = useState<string[]>([]);

  if (!isVisible) return null;

  const mapOptions = [
    "Hazard Maps",
    "Exposure Maps",
    "Vulnerability Maps",
    "Critical Facility Maps",
  ];

  const handleToggle = (label: string) => {
    const updated = selected.includes(label)
      ? selected.filter((item) => item !== label)
      : [...selected, label];
    setSelected(updated);
    onSelectedMapsChange(updated); // notify parent
  };

  return (
    <div
      className="mt-[18px] w-full bg-[#2E2E2E] rounded-xl shadow-md text-[#C7C7C7] flex flex-col pb-[25px]"
      style={{ height: "calc(100vh - 91px - 18px)" }}
    >
      <div className="flex items-center justify-between px-4 pt-4 pb-3 z-10">
        <span className="text-[15px] font-medium text-[#C7C7C7]">
          Select maps to include:
        </span>
        <button
          onClick={onGoToToolPanel}
          className="text-sm text-[#8183e5] hover:text-[#a7a9fa] flex items-center gap-1 transition"
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
              checked={selected.includes(label)}
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
