"use client";

import { ChevronDown, Sunrise, Sun, Sunset, Moon } from "lucide-react";
import SyncIcon from "@mui/icons-material/Sync";
import React from "react";

interface CenterTopControlsProps {
  viewMode: "2d" | "3d";
  selectedTimeOfDay: string | null;
  setShowTimeOfDayDropdown: React.Dispatch<React.SetStateAction<boolean>>;
  showTimeOfDayDropdown: boolean;
  handleTimeOfDayChange: (label: string) => void;
  selectedMapStyle: string;
  handleMapStyleChange: (label: string) => void;
  mapStyleRef: React.RefObject<HTMLDivElement | null>;
  timeOfDayRef: React.RefObject<HTMLDivElement | null>;
  showMapStyleDropdown: boolean;
  setShowMapStyleDropdown: React.Dispatch<React.SetStateAction<boolean>>; // ✅ added
}

export default function CenterTopControls({
  viewMode,
  selectedTimeOfDay,
  setShowTimeOfDayDropdown,
  showTimeOfDayDropdown,
  handleTimeOfDayChange,
  selectedMapStyle,
  handleMapStyleChange,
  mapStyleRef,
  timeOfDayRef,
  showMapStyleDropdown,
  setShowMapStyleDropdown, // ✅ added
}: CenterTopControlsProps) {
  return (
    <div className="absolute top-[18px] left-1/2 transform -translate-x-1/2 z-50">
      <div className="flex gap-2.5 relative">
        {viewMode === "3d" && selectedTimeOfDay !== null && (
          <div ref={timeOfDayRef} className="relative w-[140px]">
            <button
              onClick={() => setShowTimeOfDayDropdown((prev: boolean) => !prev)}
              className="h-[40px] w-full px-3 py-2 flex items-center justify-between bg-[#2E2E2E] text-[#C7C7C7] 
rounded-md shadow-md hover:bg-[#3a3a3a] transition text-[11px] font-medium"
            >
              <span className="leading-none">Time of Day</span>
              <ChevronDown size={15} />
            </button>
            {showTimeOfDayDropdown && (
              <div className="absolute top-[48px] w-full bg-[#2E2E2E] rounded-md shadow-md text-[#C7C7C7] p-1.5 z-50">
                {["Auto", "Morning", "Daytime", "Evening", "Nighttime"].map(
                  (label, idx) => {
                    const isSelected = selectedTimeOfDay === label;
                    return (
                      <div
                        key={idx}
                        onClick={() => handleTimeOfDayChange(label)}
                        className={`px-2 py-1.5 rounded-sm cursor-pointer flex items-center gap-1 transition text-[11px] ${
                          isSelected
                            ? "bg-gradient-to-r from-[#9699FF] to-white text-[#2E2E2E] font-medium"
                            : "hover:bg-[#3a3a3a] text-[#C7C7C7]"
                        }`}
                      >
                        {label === "Morning" ? (
                          <Sunrise
                            size={14}
                            color={isSelected ? "#2E2E2E" : "#C7C7C7"}
                          />
                        ) : label === "Daytime" ? (
                          <Sun
                            size={14}
                            color={isSelected ? "#2E2E2E" : "#C7C7C7"}
                          />
                        ) : label === "Evening" ? (
                          <Sunset
                            size={14}
                            color={isSelected ? "#2E2E2E" : "#C7C7C7"}
                          />
                        ) : label === "Nighttime" ? (
                          <Moon
                            size={14}
                            color={isSelected ? "#2E2E2E" : "#C7C7C7"}
                          />
                        ) : (
                          <SyncIcon
                            sx={{ fontSize: 14 }}
                            style={{
                              color: isSelected ? "#2E2E2E" : "#C7C7C7",
                            }}
                          />
                        )}
                        {label}
                      </div>
                    );
                  }
                )}
              </div>
            )}
          </div>
        )}

        <div ref={mapStyleRef} className="relative w-[140px]">
          <button
            onClick={() => setShowMapStyleDropdown((prev: boolean) => !prev)} // ✅ typed
            className="h-[40px] w-full px-3 py-2 flex items-center justify-between bg-[#2E2E2E] text-[#C7C7C7] 
rounded-md shadow-md hover:bg-[#3a3a3a] transition text-[11px] font-medium"
          >
            <span className="leading-none">Map Style</span>
            <ChevronDown size={15} />
          </button>
          {showMapStyleDropdown && (
            <div className="text-[11px] absolute top-[48px] w-full bg-[#2E2E2E] rounded-md shadow-md text-[#C7C7C7] p-1.5 z-50">
              {[
                "Default (Custom Mapbox Standard)",
                "Satellite (Mapbox)",
                "Outdoors (Mapbox)",
                "Light (Mapbox)",
                "Dark (Mapbox)",
                "Navigation Day (Mapbox)",
                "Navigation Night (Mapbox)",
              ].map((label, idx) => {
                const isSelected = selectedMapStyle === label;
                return (
                  <div
                    key={idx}
                    onClick={() => handleMapStyleChange(label)}
                    className={`px-2 py-1.5 rounded-sm cursor-pointer transition flex items-center gap-1 ${
                      isSelected
                        ? "bg-gradient-to-r from-[#9699FF] to-white text-[#2E2E2E] font-medium"
                        : "hover:bg-[#3a3a3a] text-[#C7C7C7]"
                    }`}
                  >
                    {label}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
