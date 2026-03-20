// \SafeGIS\Simulation-Studio\frontend\src\components\controls\Features\Maps\Critical Facility Layers\CriticalFacilityLayersControls.tsx
"use client";
import { useState } from "react";
import { ListFilter, ArrowDownAZ, ArrowDownZA } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { criticalFacilitiesData } from "./CriticalFacilityLayersConfig";

interface CriticalFacilityMapControlsProps {
  mapRef: React.RefObject<any>;
}

export default function CriticalFacilityMapControls({
  mapRef,
}: CriticalFacilityMapControlsProps) {
  const [checkedItems, setCheckedItems] = useState<string[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [sortAsc, setSortAsc] = useState(true);

  const toggleItem = (name: string) => {
    setCheckedItems((prev) =>
      prev.includes(name)
        ? prev.filter((item) => item !== name)
        : [...prev, name]
    );
  };

  // Filter and sort all data
  const filteredAndSortedData = criticalFacilitiesData
    .filter(
      (item) =>
        item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.scope?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.source?.toLowerCase().includes(searchTerm.toLowerCase())
    )
    .sort((a, b) =>
      sortAsc ? a.name.localeCompare(b.name) : b.name.localeCompare(a.name)
    );

  return (
    <div className="space-y-2">
      {/* Search and Sort Controls */}
      <div className="flex justify-between items-center mb-2">
        <input
          type="text"
          placeholder="Search..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="flex-1 bg-[#3a3a3a] text-white text-[10px] px-2 py-1 rounded outline-none mr-2"
        />
        <div className="flex items-center">
          <button className="flex items-center gap-1.5 px-1 py-1 bg-transparent transition group">
            <ListFilter
              size={12}
              className="text-gray-400 group-hover:text-white transition"
            />
            <span className="text-[10px] text-gray-400 group-hover:text-white transition">
              Filter
            </span>
          </button>
          <button
            onClick={() => setSortAsc(!sortAsc)}
            className="flex items-center px-1 py-1 bg-transparent transition group"
          >
            {sortAsc ? (
              <ArrowDownAZ
                size={12}
                className="text-gray-400 group-hover:text-white transition"
              />
            ) : (
              <ArrowDownZA
                size={12}
                className="text-gray-400 group-hover:text-white transition"
              />
            )}
          </button>
        </div>
      </div>

      {/* Scrollable Checkbox Container */}
      <div
        className="space-y-2 max-h-[400px] overflow-y-auto pr-2"
        style={{
          scrollbarWidth: "thin",
          scrollbarColor: "#706f6f transparent",
        }}
      >
        {filteredAndSortedData.map((item, index) => (
          <div
            key={index}
            onClick={() => toggleItem(item.name)}
            className={`p-3 rounded-md cursor-pointer transition flex items-center gap-3 ${
              checkedItems.includes(item.name)
                ? "bg-[#3d3e69] border-2 border-[#9699FF]"
                : "bg-[#2a2a2a] hover:bg-[#353535]"
            }`}
          >
            <Checkbox
              checked={checkedItems.includes(item.name)}
              className="pointer-events-none"
              style={{
                width: "14px",
                height: "14px",
                minWidth: "14px",
                minHeight: "14px",
              }}
            />
            <div className="flex-1">
              <div className="text-white text-[10px] font-medium mb-1">
                {item.name}
              </div>
              <div className="text-gray-400 text-[9px] mb-0.5">
                Category: {item.category}
              </div>
              {item.scope && (
                <div className="text-gray-400 text-[9px] mb-0.5">
                  Scope: {item.scope}
                </div>
              )}
              {item.source && (
                <div className="text-gray-400 text-[9px]">
                  Source: {item.source}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
