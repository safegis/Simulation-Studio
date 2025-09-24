"use client";

import {
  ChevronDown,
  Droplet,
  Mountain,
  TrafficCone,
  Wind,
  Flame,
  Bug,
} from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";

interface HazardMapControlsProps {
  hydroExpanded: boolean;
  setHydroExpanded: React.Dispatch<React.SetStateAction<boolean>>;
  hydroMeteorologicalCheckboxItems: string[];
  hydroCheckedItems: string[];
  toggleHydroItem: (item: string) => void;

  geologicalExpanded: boolean;
  setGeologicalExpanded: React.Dispatch<React.SetStateAction<boolean>>;
  geologicalCheckboxItems: string[];
  geologicalCheckedItems: string[];
  toggleGeologicalItem: (item: string) => void;

  trafficExpanded: boolean;
  setTrafficExpanded: React.Dispatch<React.SetStateAction<boolean>>;
  trafficCheckboxItems: string[];
  trafficCheckedItems: string[];
  toggleTrafficItem: (item: string) => void;

  PanelToggle: React.FC<{
    title: string;
    icon: React.ReactNode;
    expanded: boolean;
    onToggle: () => void;
    items: string[];
    checkedItems: string[];
    onCheck: (item: string) => void;
  }>;
  TransparentButton: React.FC<{ label: string; icon?: React.ReactNode }>;
}

export default function HazardMapControls({
  hydroExpanded,
  setHydroExpanded,
  hydroMeteorologicalCheckboxItems,
  hydroCheckedItems,
  toggleHydroItem,
  geologicalExpanded,
  setGeologicalExpanded,
  geologicalCheckboxItems,
  geologicalCheckedItems,
  toggleGeologicalItem,
  trafficExpanded,
  setTrafficExpanded,
  trafficCheckboxItems,
  trafficCheckedItems,
  toggleTrafficItem,
  PanelToggle,
  TransparentButton,
}: HazardMapControlsProps) {
  return (
    <>
      {/* Hydro */}
      <button
        onClick={() => setHydroExpanded((prev) => !prev)}
        className="flex justify-between items-center w-full bg-transparent text-white px-2 py-2 rounded hover:bg-[#3a3a3a] transition"
      >
        <div className="flex items-center gap-2">
          <Droplet size={20} />
          <span className="text-base font-medium">Hydro-Meteorological</span>
        </div>
        <ChevronDown
          size={18}
          className={`text-white transition-transform duration-200 ${
            hydroExpanded ? "rotate-180" : ""
          }`}
        />
      </button>
      {hydroExpanded && (
        <div className="pl-7 pt-2 pb-2 space-y-2">
          {hydroMeteorologicalCheckboxItems.map((item) => (
            <div key={item} className="flex flex-col">
              <div className="flex items-center">
                <Checkbox
                  className="mr-3 w-[18px] h-[18px]"
                  checked={hydroCheckedItems.includes(item)}
                  onCheckedChange={() => toggleHydroItem(item)}
                />
                <span className="text-base">{item}</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Geological */}
      <button
        onClick={() => setGeologicalExpanded((prev) => !prev)}
        className={`flex justify-between items-center w-full bg-transparent text-white px-2 py-2 rounded hover:bg-[#3a3a3a] transition ${
          geologicalExpanded ? "bg-[#3a3a3a]" : ""
        }`}
      >
        <div className="flex items-center gap-2">
          <Mountain size={20} />
          <span className="text-base font-medium">Geological</span>
        </div>
        <ChevronDown
          size={18}
          className={`text-white transition-transform duration-200 ${
            geologicalExpanded ? "rotate-180" : ""
          }`}
        />
      </button>
      {geologicalExpanded && (
        <div className="pl-7 pt-2 pb-2 space-y-2">
          {geologicalCheckboxItems.map((item) => (
            <div key={item} className="flex items-center">
              <Checkbox
                className="mr-3 w-[18px] h-[18px]"
                checked={geologicalCheckedItems.includes(item)}
                onCheckedChange={() => toggleGeologicalItem(item)}
              />
              <span className="text-base">{item}</span>
            </div>
          ))}
        </div>
      )}

      <PanelToggle
        title="Traffic Incidents"
        icon={<TrafficCone size={20} />}
        expanded={trafficExpanded}
        onToggle={() => setTrafficExpanded((prev) => !prev)}
        items={trafficCheckboxItems}
        checkedItems={trafficCheckedItems}
        onCheck={toggleTrafficItem}
      />

      <TransparentButton
        label="Air Quality Index (AQI)"
        icon={<Wind size={20} />}
      />
      <TransparentButton label="Active Fire" icon={<Flame size={20} />} />
      <TransparentButton label="Infectious Disease" icon={<Bug size={20} />} />
    </>
  );
}
