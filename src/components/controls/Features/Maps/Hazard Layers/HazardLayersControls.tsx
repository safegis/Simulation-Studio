// \SafeGIS\Simulation-Studio\frontend\src\components\controls\Features\Maps\Hazard Layers\HazardLayersControls.tsx
"use client";

import { useState, useRef } from "react";
import { createPortal } from "react-dom";
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
import { getWeatherLocationOptions } from "./Weather/WeatherLocationOptions";
import {
  philippinesProvinces,
  ProvinceData,
} from "./Weather/PhilippinesProvinces";
import { philippinesMunicipalities } from "./Weather/PhilippinesMunicipalities";

interface HazardMapControlsProps {
  hydroExpanded: boolean;
  setHydroExpanded: React.Dispatch<React.SetStateAction<boolean>>;
  hydroMeteorologicalCheckboxItems: string[];
  hydroCheckedItems: string[];
  toggleHydroItem: (item: string) => void;
  mapRef: React.RefObject<any>;

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
  mapRef,
}: HazardMapControlsProps) {
  // BEFORE: No weather dropdown state
  // AFTER: Add weather dropdown state
  const [weatherCountryOpen, setWeatherCountryOpen] = useState(false);
  const [selectedWeatherCountry, setSelectedWeatherCountry] = useState("");
  const weatherCountryButtonRef = useRef<HTMLButtonElement>(null);
  const [weatherLocationOpen, setWeatherLocationOpen] = useState(false);
  const [selectedWeatherLocation, setSelectedWeatherLocation] = useState("");
  const weatherLocationButtonRef = useRef<HTMLButtonElement>(null);

  // Weather dropdown options
  const weatherCountryOptions = ["Philippines", "United States of America"];

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

              {/* BEFORE: No weather dropdown controls */}
              {/* AFTER: Weather dropdown controls - appears when "Weather" is checked */}
              {item === "Weather" && hydroCheckedItems.includes("Weather") && (
                <div className="ml-6.5 mt-3 mb-3 w-[260px] space-y-2">
                  <button
                    ref={weatherCountryButtonRef}
                    onClick={() => setWeatherCountryOpen((prev) => !prev)}
                    className="flex justify-between items-center w-full bg-[#3a3a3a] text-white p-2 px-3 rounded-md"
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      lineHeight: 1.2,
                      fontFamily: "inherit",
                    }}
                  >
                    <span
                      style={{
                        lineHeight: 1.2,
                        display: "flex",
                        alignItems: "center",
                      }}
                    >
                      {selectedWeatherCountry || "Select Country"}
                    </span>
                    <ChevronDown
                      size={16}
                      className={`ml-2 transition-transform duration-200 ${
                        weatherCountryOpen ? "rotate-180" : ""
                      }`}
                      style={{ display: "flex", alignItems: "center" }}
                    />
                  </button>

                  {/* Location Coverage Dropdown - appears when a country is selected */}
                  {selectedWeatherCountry && (
                    <>
                      <button
                        ref={weatherLocationButtonRef}
                        onClick={() => setWeatherLocationOpen((prev) => !prev)}
                        className="flex justify-between items-center w-full bg-[#3a3a3a] text-white p-2 px-3 rounded-md"
                        style={{
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "space-between",
                          lineHeight: 1.2,
                          fontFamily: "inherit",
                        }}
                      >
                        <span
                          style={{
                            lineHeight: 1.2,
                            display: "flex",
                            alignItems: "center",
                          }}
                        >
                          {selectedWeatherLocation || "Location Coverage"}
                        </span>
                        <ChevronDown
                          size={16}
                          className={`ml-2 transition-transform duration-200 ${
                            weatherLocationOpen ? "rotate-180" : ""
                          }`}
                          style={{ display: "flex", alignItems: "center" }}
                        />
                      </button>

                      {/* Clear Weather button - appears when location is selected */}
                      {selectedWeatherLocation && (
                        <button
                          onClick={() => {
                            mapRef.current?.clearWeatherMarkers?.();
                            setSelectedWeatherLocation("");
                          }}
                          className="w-full py-2 rounded-md mt-2 bg-[#5A5C99] text-white hover:opacity-90 shadow-md"
                        >
                          Clear Weather
                        </button>
                      )}
                    </>
                  )}
                </div>
              )}
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

      {/* BEFORE: No weather dropdown portals */}
      {/* AFTER: Weather Country Dropdown Portal */}
      {weatherCountryOpen &&
        weatherCountryButtonRef.current &&
        createPortal(
          <div
            className="fixed bg-[#3a3a3a] rounded-md shadow-lg z-[9999] text-sm text-white overflow-hidden"
            style={{
              top:
                weatherCountryButtonRef.current.getBoundingClientRect().bottom +
                4,
              left: weatherCountryButtonRef.current.getBoundingClientRect()
                .left,
              width:
                weatherCountryButtonRef.current.getBoundingClientRect().width,
            }}
          >
            {weatherCountryOptions.map((option, index, arr) => (
              <div
                key={index}
                onClick={() => {
                  setSelectedWeatherCountry(option);
                  setWeatherCountryOpen(false);
                  setSelectedWeatherLocation(""); // Reset location when country changes
                }}
                className={`px-3 py-2 hover:bg-[#505050] cursor-pointer
                  ${index === 0 ? "rounded-t-md" : ""}
                  ${index === arr.length - 1 ? "rounded-b-md" : ""}`}
              >
                {option}
              </div>
            ))}
          </div>,
          document.body
        )}

      {/* Weather Location Dropdown Portal */}
      {weatherLocationOpen &&
        weatherLocationButtonRef.current &&
        createPortal(
          <div
            className="fixed bg-[#3a3a3a] rounded-md shadow-lg z-[9999] text-sm text-white overflow-hidden"
            style={{
              top:
                weatherLocationButtonRef.current.getBoundingClientRect()
                  .bottom + 4,
              left: weatherLocationButtonRef.current.getBoundingClientRect()
                .left,
              width:
                weatherLocationButtonRef.current.getBoundingClientRect().width,
            }}
          >
            {getWeatherLocationOptions(selectedWeatherCountry).map(
              (option, index, arr) => (
                <div
                  key={index}
                  onClick={async () => {
                    setSelectedWeatherLocation(option);
                    setWeatherLocationOpen(false);

                    // Handle Philippines weather data selection
                    if (selectedWeatherCountry === "Philippines") {
                      try {
                        let locationsData;

                        if (option === "By province") {
                          locationsData = philippinesProvinces;
                        } else if (option === "By municipality/city") {
                          locationsData = philippinesMunicipalities;
                        } else {
                          return; // Unknown option
                        }

                        // Immediately fly to Philippines center with reasonable zoom
                        mapRef.current?.flyTo({
                          center: [121.774, 12.879], // Philippines center coordinates
                          zoom: 6, // Good starting zoom for Philippines
                          duration: 1000,
                          essential: true,
                        });

                        // Fetch and draw weather markers
                        await mapRef.current?.drawWeatherMarkers?.(
                          locationsData
                        );

                        // After markers are placed, dynamically adjust zoom to fit all markers
                        const coordinates = locationsData.map(
                          (location) => location.coordinates
                        );

                        if (coordinates.length > 0 && mapRef.current?.getMap) {
                          setTimeout(() => {
                            const map = mapRef.current.getMap();

                            // Calculate bounds for all markers
                            const lngs = coordinates.map((coord) => coord[0]);
                            const lats = coordinates.map((coord) => coord[1]);

                            const bounds = [
                              [Math.min(...lngs), Math.min(...lats)], // Southwest corner
                              [Math.max(...lngs), Math.max(...lats)], // Northeast corner
                            ] as [[number, number], [number, number]];

                            // Fine-tune the zoom to show all markers perfectly
                            map.fitBounds(bounds, {
                              padding: 80, // Comfortable padding around markers
                              maxZoom:
                                option === "By municipality/city" ? 8 : 7.5, // Closer zoom for municipalities
                              duration: 800, // Quick adjustment after initial fly
                            });
                          }, 1200); // Wait for markers to be fully rendered
                        }
                      } catch (err) {
                        console.error(
                          `Failed to fetch weather data for Philippines ${option}:`,
                          err
                        );
                      }
                    }
                  }}
                  className={`px-3 py-2 hover:bg-[#505050] cursor-pointer
                  ${index === 0 ? "rounded-t-md" : ""}
                  ${index === arr.length - 1 ? "rounded-b-md" : ""}`}
                >
                  {option}
                </div>
              )
            )}
          </div>,
          document.body
        )}
    </>
  );
}
