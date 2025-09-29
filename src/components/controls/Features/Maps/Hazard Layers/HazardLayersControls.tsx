// \SafeGIS\Simulation-Studio\frontend\src\components\controls\Features\Maps\Hazard Layers\HazardLayersControls.tsx
"use client";

import { useState, useRef, useEffect } from "react";
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
import { WeatherData } from "@/components/Map/Markers/Hazard Map/WeatherMarker";

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

// Fetch weather data for multiple locations in a single API call
const fetchBatchWeatherData = async (
  locationsData: ProvinceData[]
): Promise<WeatherData[]> => {
  try {
    // Build arrays of latitudes and longitudes
    const latitudes = locationsData.map((p) => p.coordinates[1]);
    const longitudes = locationsData.map((p) => p.coordinates[0]);

    // Create batch URL with all coordinates
    const weatherUrl =
      `https://api.open-meteo.com/v1/forecast?` +
      `latitude=${latitudes.join(",")}&` +
      `longitude=${longitudes.join(",")}&` +
      `current=temperature_2m,weather_code,wind_speed_10m,relative_humidity_2m&` +
      `timezone=auto`;

    console.log(
      `Fetching weather for ${locationsData.length} locations in 1 API call`
    );

    const weatherResponse = await fetch(weatherUrl);

    if (!weatherResponse.ok) {
      console.error(`Weather API error:`, weatherResponse.status);
      return [];
    }

    const weatherData = await weatherResponse.json();

    // Process the batch response
    const weatherDataArray: WeatherData[] = [];

    for (let i = 0; i < locationsData.length; i++) {
      const province = locationsData[i];
      const currentData = Array.isArray(weatherData)
        ? weatherData[i]?.current
        : weatherData.current;

      if (!currentData) {
        console.warn(`No weather data for ${province.name}`);
        continue;
      }

      weatherDataArray.push({
        location: province.name,
        temperature: currentData.temperature_2m,
        weatherCode: currentData.weather_code,
        windSpeed: currentData.wind_speed_10m,
        humidity: currentData.relative_humidity_2m,
        coordinates: province.coordinates,
      });
    }

    console.log(
      `Successfully fetched weather data for ${weatherDataArray.length} locations`
    );
    return weatherDataArray;
  } catch (error) {
    console.error(`Error fetching batch weather data:`, error);
    return [];
  }
};

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
  const [weatherCountryOpen, setWeatherCountryOpen] = useState(false);
  const [selectedWeatherCountry, setSelectedWeatherCountry] = useState("");
  const weatherCountryButtonRef = useRef<HTMLButtonElement>(null);
  const [weatherLocationOpen, setWeatherLocationOpen] = useState(false);
  const [selectedWeatherLocation, setSelectedWeatherLocation] = useState("");
  const weatherLocationButtonRef = useRef<HTMLButtonElement>(null);

  // 🔹 Weather polling interval
  const weatherIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Weather dropdown options
  const weatherCountryOptions = ["Philippines", "United States of America"];

  // 🔹 Cleanup effect – stop weather polling on unmount
  useEffect(() => {
    return () => {
      if (weatherIntervalRef.current) {
        clearInterval(weatherIntervalRef.current);
        weatherIntervalRef.current = null;
      }
    };
  }, []);

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

              {/* Weather dropdown controls */}
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

                  {/* Location Coverage Dropdown */}
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

                      {/* Clear Weather button */}
                      {selectedWeatherLocation && (
                        <button
                          onClick={() => {
                            mapRef.current?.clearWeatherMarkers?.();
                            setSelectedWeatherLocation("");

                            // 🔹 Stop polling
                            if (weatherIntervalRef.current) {
                              clearInterval(weatherIntervalRef.current);
                              weatherIntervalRef.current = null;
                            }
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

      {/* Weather Country Dropdown Portal */}
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
                  setSelectedWeatherLocation("");
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
                          return;
                        }

                        // Fly to Philippines center immediately
                        mapRef.current?.flyTo({
                          center: [121.774, 12.879],
                          zoom: 6,
                          duration: 1000,
                          essential: true,
                        });

                        // Fetch weather data using batch API call
                        const weatherDataArray = await fetchBatchWeatherData(
                          locationsData
                        );

                        // Draw weather markers with the fetched data
                        await mapRef.current?.drawWeatherMarkers?.(
                          weatherDataArray
                        );

                        // 🔹 Start polling every 60s
                        if (weatherIntervalRef.current) {
                          clearInterval(weatherIntervalRef.current);
                        }
                        weatherIntervalRef.current = setInterval(async () => {
                          const refreshed = await fetchBatchWeatherData(
                            locationsData
                          );
                          await mapRef.current?.drawWeatherMarkers?.(refreshed);
                        }, 60_000);

                        // Fit bounds to show all markers
                        const coordinates = locationsData.map(
                          (location) => location.coordinates
                        );

                        if (coordinates.length > 0 && mapRef.current?.getMap) {
                          setTimeout(() => {
                            const map = mapRef.current.getMap();

                            const lngs = coordinates.map((coord) => coord[0]);
                            const lats = coordinates.map((coord) => coord[1]);

                            const bounds = [
                              [Math.min(...lngs), Math.min(...lats)],
                              [Math.max(...lngs), Math.max(...lats)],
                            ] as [[number, number], [number, number]];

                            map.fitBounds(bounds, {
                              padding: 80,
                              maxZoom:
                                option === "By municipality/city" ? 8 : 7.5,
                              duration: 800,
                            });
                          }, 1200);
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
