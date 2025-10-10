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
import mapboxgl from "mapbox-gl";
import { Checkbox } from "@/components/ui/checkbox";
import { getWeatherLocationOptions } from "./Weather/WeatherLocationOptions";
import {
  philippinesProvinces,
  ProvinceData,
} from "./Weather/PhilippinesProvinces";
import {
  philippinesMunicipalities,
  getProvincesWithMunicipalities,
  getMunicipalitiesForProvince,
} from "./Weather/PhilippinesMunicipalities";
import { WeatherData } from "@/components/Map/Markers/Hazard Map/WeatherMarker";
import { floodHazardMaps } from "./Flood/NOAAFloodHazardConfig";

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

  // Flood country selection states
  const [floodCountryOpen, setFloodCountryOpen] = useState(false);
  const [selectedFloodCountry, setSelectedFloodCountry] = useState("");
  const floodCountryButtonRef = useRef<HTMLButtonElement>(null);

  // Flood data source selection states
  const [floodDataSourceOpen, setFloodDataSourceOpen] = useState(false);
  const [selectedFloodDataSource, setSelectedFloodDataSource] = useState("");
  const floodDataSourceButtonRef = useRef<HTMLButtonElement>(null);

  // Flood province selection states
  const [floodProvinceOpen, setFloodProvinceOpen] = useState(false);
  const [selectedFloodProvince, setSelectedFloodProvince] = useState("");
  const floodProvinceButtonRef = useRef<HTMLButtonElement>(null);
  const [floodProvinceSearchTerm, setFloodProvinceSearchTerm] = useState("");

  // Flood return period selection states (unified for NOAH)
  const [floodReturnPeriods, setFloodReturnPeriods] = useState<string[]>([]);

  // Municipality province selection states
  const [municipalityProvinceOpen, setMunicipalityProvinceOpen] =
    useState(false);
  const [selectedMunicipalityProvince, setSelectedMunicipalityProvince] =
    useState("");
  const municipalityProvinceButtonRef = useRef<HTMLButtonElement>(null);
  const [municipalityProvinceSearchTerm, setMunicipalityProvinceSearchTerm] =
    useState("");

  // 🔹 Weather polling interval
  const weatherIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Weather dropdown options
  const weatherCountryOptions = ["Philippines", "United States of America"];

  const floodCountryOptions = [
    "India",
    "Japan",
    "Philippines",
    "United States of America",
  ];

  const floodDataSourceOptions = [
    "Mines and Geosciences Bureau (MGB)",
    "Nationwide Operational Assessment of Hazards (NOAH)",
  ];

  const floodProvinceOptions = [
    "Apayao",
    "Compostela Valley",
    "Davao Oriental",
    "Dinagat Islands",
    "Ifugao",
    "Kalinga",
    "Lanao Del Sur",
    "Marinduque",
    "Metro Manila",
    "Misamis Occidental",
    "Mountain Province",
    "Tarlac",
    "Zamboanga Sibugay",
  ];

  const floodReturnPeriodOptions = ["5 - Year", "25 - Year", "100 - Year"];

  const toggleFloodReturnPeriod = async (period: string) => {
    const isCurrentlyChecked = floodReturnPeriods.includes(period);

    if (isCurrentlyChecked) {
      setFloodReturnPeriods((prev) => prev.filter((p) => p !== period));
      mapRef.current?.clearFloodHazard?.(period, selectedFloodProvince);
    } else {
      setFloodReturnPeriods((prev) => [...prev, period]);

      const periodKey = period.replace(" - ", "-") as
        | "5-Year"
        | "25-Year"
        | "100-Year";

      const provinceConfig = floodHazardMaps[periodKey]?.find(
        (config) => config.name === selectedFloodProvince
      );

      if (!provinceConfig) {
        console.error(
          `No config found for ${selectedFloodProvince} (${period})`
        );
        return;
      }

      console.log(`Loading ${selectedFloodProvince} for ${period}...`);

      try {
        // drawFloodHazard now returns bounds directly
        const bounds = await mapRef.current?.drawFloodHazard?.(
          provinceConfig.geojsonUrl,
          provinceConfig.returnPeriod,
          provinceConfig.name
        );

        // Use the returned bounds to fit the map view
        if (bounds) {
          const map = mapRef.current?.getMap?.();
          if (map) {
            map.fitBounds(bounds, {
              padding: 50,
              maxZoom: 10,
              duration: 1500,
            });
          }
        }
      } catch (error) {
        console.error(
          `Error loading ${period} for ${selectedFloodProvince}:`,
          error
        );
      }
    }
  };

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

                      {/* NEW: Province Selection Dropdown - appears when "By municipality/city" is selected */}
                      {selectedWeatherCountry === "Philippines" &&
                        selectedWeatherLocation === "By municipality/city" && (
                          <>
                            <button
                              ref={municipalityProvinceButtonRef}
                              onClick={() =>
                                setMunicipalityProvinceOpen((prev) => !prev)
                              }
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
                                {selectedMunicipalityProvince ||
                                  "Select Province"}
                              </span>
                              <ChevronDown
                                size={16}
                                className={`ml-2 transition-transform duration-200 ${
                                  municipalityProvinceOpen ? "rotate-180" : ""
                                }`}
                                style={{
                                  display: "flex",
                                  alignItems: "center",
                                }}
                              />
                            </button>

                            {/* Clear Weather button - always visible, disabled when no province selected */}
                            <button
                              onClick={() => {
                                if (!selectedMunicipalityProvince) return; // do nothing if disabled
                                mapRef.current?.clearWeatherMarkers?.();
                                setSelectedMunicipalityProvince("");

                                // Stop polling
                                if (weatherIntervalRef.current) {
                                  clearInterval(weatherIntervalRef.current);
                                  weatherIntervalRef.current = null;
                                }
                              }}
                              disabled={!selectedMunicipalityProvince}
                              className={`w-full py-2 rounded-md mt-2
                              ${
                                selectedMunicipalityProvince
                                  ? "bg-[#5A5C99] text-white hover:opacity-90 shadow-md"
                                  : "bg-[#4c4c4c] text-[#a1a1a1] cursor-not-allowed"
                              }`}
                            >
                              Clear Weather
                            </button>
                          </>
                        )}

                      {/* Clear Weather button - for province selection, always visible when Philippines is selected */}
                      {selectedWeatherCountry === "Philippines" &&
                        selectedWeatherLocation !== "By municipality/city" && (
                          <button
                            onClick={() => {
                              if (!selectedWeatherLocation) return; // do nothing if disabled
                              mapRef.current?.clearWeatherMarkers?.();
                              setSelectedWeatherLocation("");

                              // Stop polling
                              if (weatherIntervalRef.current) {
                                clearInterval(weatherIntervalRef.current);
                                weatherIntervalRef.current = null;
                              }
                            }}
                            disabled={!selectedWeatherLocation}
                            className={`w-full py-2 rounded-md mt-2
                            ${
                              selectedWeatherLocation
                                ? "bg-[#5A5C99] text-white hover:opacity-90 shadow-md"
                                : "bg-[#4c4c4c] text-[#a1a1a1] cursor-not-allowed"
                            }`}
                          >
                            Clear Weather
                          </button>
                        )}
                    </>
                  )}
                </div>
              )}

              {/* Flood dropdown controls */}
              {item === "Flood" && hydroCheckedItems.includes("Flood") && (
                <div className="ml-6.5 mt-3 mb-3 w-[260px] space-y-2">
                  <button
                    ref={floodCountryButtonRef}
                    onClick={() => setFloodCountryOpen((prev) => !prev)}
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
                      {selectedFloodCountry || "Select Country"}
                    </span>
                    <ChevronDown
                      size={16}
                      className={`ml-2 transition-transform duration-200 ${
                        floodCountryOpen ? "rotate-180" : ""
                      }`}
                      style={{ display: "flex", alignItems: "center" }}
                    />
                  </button>

                  {/* Data Source Dropdown - shown when Philippines is selected */}
                  {selectedFloodCountry === "Philippines" && (
                    <>
                      <button
                        ref={floodDataSourceButtonRef}
                        onClick={() => setFloodDataSourceOpen((prev) => !prev)}
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
                            display: "block",
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            whiteSpace: "nowrap",
                            maxWidth: "210px",
                          }}
                        >
                          {selectedFloodDataSource || "Data Source"}
                        </span>
                        <ChevronDown
                          size={16}
                          className={`ml-2 transition-transform duration-200 ${
                            floodDataSourceOpen ? "rotate-180" : ""
                          }`}
                          style={{ display: "flex", alignItems: "center" }}
                        />
                      </button>

                      {selectedFloodDataSource ===
                        "Nationwide Operational Assessment of Hazards (NOAH)" && (
                        <>
                          {/* NEW: Province Selection Dropdown */}
                          <button
                            ref={floodProvinceButtonRef}
                            onClick={() =>
                              setFloodProvinceOpen((prev) => !prev)
                            }
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
                              {selectedFloodProvince || "Select province..."}
                            </span>
                            <ChevronDown
                              size={16}
                              className={`ml-2 transition-transform duration-200 ${
                                floodProvinceOpen ? "rotate-180" : ""
                              }`}
                              style={{ display: "flex", alignItems: "center" }}
                            />
                          </button>

                          {/* CHANGED: Return Period checkboxes now only show when province is selected */}
                          {selectedFloodProvince && (
                            <div className="mt-3 space-y-1">
                              <div className="text-white text-sm">
                                Return Period:
                              </div>
                              {floodReturnPeriodOptions.map((period) => (
                                <div key={period} className="flex items-center">
                                  <Checkbox
                                    className="mr-3 w-[16px] h-[16px]"
                                    checked={floodReturnPeriods.includes(
                                      period
                                    )}
                                    onCheckedChange={() =>
                                      toggleFloodReturnPeriod(period)
                                    }
                                  />
                                  <span className="text-sm">{period}</span>
                                </div>
                              ))}
                            </div>
                          )}
                        </>
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
                        // NEW: Only handle "By province" here
                        // "By municipality/city" now requires province selection first
                        if (option === "By province") {
                          const locationsData = philippinesProvinces;

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

                          // 🔹 Start polling every 30 minutes
                          if (weatherIntervalRef.current) {
                            clearInterval(weatherIntervalRef.current);
                          }
                          weatherIntervalRef.current = setInterval(async () => {
                            const refreshed = await fetchBatchWeatherData(
                              locationsData
                            );
                            await mapRef.current?.drawWeatherMarkers?.(
                              refreshed
                            );
                          }, 1_800_000);

                          // Fit bounds to show all markers
                          const coordinates = locationsData.map(
                            (location) => location.coordinates
                          );

                          if (
                            coordinates.length > 0 &&
                            mapRef.current?.getMap
                          ) {
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
                                maxZoom: 7.5,
                                duration: 800,
                              });
                            }, 1200);
                          }
                        }
                        // NEW: "By municipality/city" no longer triggers automatic fetch
                        // User must select province first from the new dropdown
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

      {/* NEW: Municipality Province Dropdown Portal */}
      {municipalityProvinceOpen &&
        municipalityProvinceButtonRef.current &&
        createPortal(
          <div
            className="fixed bg-[#3a3a3a] rounded-md shadow-lg z-[9999] text-sm text-white overflow-hidden"
            style={{
              top:
                municipalityProvinceButtonRef.current.getBoundingClientRect()
                  .bottom + 4,
              left: municipalityProvinceButtonRef.current.getBoundingClientRect()
                .left,
              width:
                municipalityProvinceButtonRef.current.getBoundingClientRect()
                  .width,
            }}
          >
            {/* Search Box */}
            <div className="p-2">
              <input
                type="text"
                placeholder="Search province..."
                value={municipalityProvinceSearchTerm}
                onChange={(e) =>
                  setMunicipalityProvinceSearchTerm(e.target.value)
                }
                className="w-full p-2 rounded-md text-white outline-none focus:ring-0 focus:outline-none hover:outline-none"
              />
            </div>

            {/* Filtered province list */}
            <div
              className="overflow-y-auto"
              style={{
                maxHeight: "140px",
                scrollbarWidth: "thin",
                scrollbarColor: "#5a5a5a #3a3a3a",
              }}
              onScroll={(e) => e.stopPropagation()}
            >
              {getProvincesWithMunicipalities()
                .filter((p) =>
                  p
                    .toLowerCase()
                    .includes(municipalityProvinceSearchTerm.toLowerCase())
                )
                .map((province, index, arr) => (
                  <div
                    key={index}
                    onClick={async () => {
                      setSelectedMunicipalityProvince(province);
                      setMunicipalityProvinceOpen(false);
                      setMunicipalityProvinceSearchTerm("");

                      try {
                        const municipalities =
                          getMunicipalitiesForProvince(province);

                        if (municipalities.length === 0) {
                          console.warn(
                            `No municipalities found for ${province}`
                          );
                          return;
                        }

                        // Calculate center of the province based on municipalities
                        const avgLng =
                          municipalities.reduce(
                            (sum, m) => sum + m.coordinates[0],
                            0
                          ) / municipalities.length;
                        const avgLat =
                          municipalities.reduce(
                            (sum, m) => sum + m.coordinates[1],
                            0
                          ) / municipalities.length;

                        // Fly to province center
                        mapRef.current?.flyTo({
                          center: [avgLng, avgLat],
                          zoom: 9,
                          duration: 1000,
                          essential: true,
                        });

                        // Fetch weather data using batch API call
                        const fetchBatchWeatherData = async (
                          locationsData: typeof municipalities
                        ): Promise<WeatherData[]> => {
                          try {
                            const latitudes = locationsData.map(
                              (m) => m.coordinates[1]
                            );
                            const longitudes = locationsData.map(
                              (m) => m.coordinates[0]
                            );

                            const weatherUrl =
                              `https://api.open-meteo.com/v1/forecast?` +
                              `latitude=${latitudes.join(",")}&` +
                              `longitude=${longitudes.join(",")}&` +
                              `current=temperature_2m,weather_code,wind_speed_10m,relative_humidity_2m&` +
                              `timezone=auto`;

                            console.log(
                              `Fetching weather for ${locationsData.length} municipalities in ${province}`
                            );

                            const weatherResponse = await fetch(weatherUrl);

                            if (!weatherResponse.ok) {
                              console.error(
                                `Weather API error:`,
                                weatherResponse.status
                              );
                              return [];
                            }

                            const weatherData = await weatherResponse.json();
                            const weatherDataArray: WeatherData[] = [];

                            for (let i = 0; i < locationsData.length; i++) {
                              const municipality = locationsData[i];
                              const currentData = Array.isArray(weatherData)
                                ? weatherData[i]?.current
                                : weatherData.current;

                              if (!currentData) {
                                console.warn(
                                  `No weather data for ${municipality.name}`
                                );
                                continue;
                              }

                              weatherDataArray.push({
                                location: municipality.name,
                                temperature: currentData.temperature_2m,
                                weatherCode: currentData.weather_code,
                                windSpeed: currentData.wind_speed_10m,
                                humidity: currentData.relative_humidity_2m,
                                coordinates: municipality.coordinates,
                              });
                            }

                            console.log(
                              `Successfully fetched weather data for ${weatherDataArray.length} municipalities`
                            );
                            return weatherDataArray;
                          } catch (error) {
                            console.error(
                              `Error fetching batch weather data:`,
                              error
                            );
                            return [];
                          }
                        };

                        const weatherDataArray = await fetchBatchWeatherData(
                          municipalities
                        );
                        await mapRef.current?.drawWeatherMarkers?.(
                          weatherDataArray
                        );

                        // Start polling every 30 minutes
                        if (weatherIntervalRef.current) {
                          clearInterval(weatherIntervalRef.current);
                        }
                        weatherIntervalRef.current = setInterval(async () => {
                          const refreshed = await fetchBatchWeatherData(
                            municipalities
                          );
                          await mapRef.current?.drawWeatherMarkers?.(refreshed);
                        }, 1_800_000);

                        // Fit bounds to show all municipalities
                        const coordinates = municipalities.map(
                          (m) => m.coordinates
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
                              maxZoom: 10,
                              duration: 800,
                            });
                          }, 1200);
                        }
                      } catch (err) {
                        console.error(
                          `Failed to fetch weather data for ${province}:`,
                          err
                        );
                      }
                    }}
                    className={`px-3 py-2 hover:bg-[#505050] cursor-pointer
                      ${index === arr.length - 1 ? "rounded-bl-md" : ""}`}
                  >
                    {province}
                  </div>
                ))}
            </div>
          </div>,
          document.body
        )}

      {floodDataSourceOpen &&
        floodDataSourceButtonRef.current &&
        createPortal(
          <div
            className="fixed bg-[#3a3a3a] rounded-md shadow-lg z-[9999] text-sm text-white overflow-hidden"
            style={{
              top:
                floodDataSourceButtonRef.current.getBoundingClientRect()
                  .bottom + 4,
              left: floodDataSourceButtonRef.current.getBoundingClientRect()
                .left,
              width:
                floodDataSourceButtonRef.current.getBoundingClientRect().width,
            }}
          >
            {floodDataSourceOptions.map((option, index, arr) => (
              <div
                key={index}
                onClick={() => {
                  setSelectedFloodDataSource(option);
                  setFloodDataSourceOpen(false);
                  // Reset return periods when changing data source
                  setFloodReturnPeriods([]);
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

      {/* Flood Country Dropdown Portal */}
      {floodCountryOpen &&
        floodCountryButtonRef.current &&
        createPortal(
          <div
            className="fixed bg-[#3a3a3a] rounded-md shadow-lg z-[9999] text-sm text-white overflow-hidden"
            style={{
              top:
                floodCountryButtonRef.current.getBoundingClientRect().bottom +
                4,
              left: floodCountryButtonRef.current.getBoundingClientRect().left,
              width:
                floodCountryButtonRef.current.getBoundingClientRect().width,
            }}
          >
            {floodCountryOptions.map((option, index, arr) => (
              <div
                key={index}
                onClick={() => {
                  setSelectedFloodCountry(option);
                  setFloodCountryOpen(false);
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

      {/* NEW: Flood Province Dropdown Portal */}
      {floodProvinceOpen &&
        floodProvinceButtonRef.current &&
        createPortal(
          <div
            className="fixed bg-[#3a3a3a] rounded-md shadow-lg z-[9999] text-sm text-white overflow-hidden"
            style={{
              top:
                floodProvinceButtonRef.current.getBoundingClientRect().bottom +
                4,
              left: floodProvinceButtonRef.current.getBoundingClientRect().left,
              width:
                floodProvinceButtonRef.current.getBoundingClientRect().width,
            }}
          >
            <div
              className="overflow-y-auto"
              style={{
                maxHeight: "140px",
                scrollbarWidth: "thin",
                scrollbarColor: "#5a5a5a transparent",
              }}
              onScroll={(e) => e.stopPropagation()}
            >
              {floodProvinceOptions.map((option, index, arr) => (
                <div
                  key={index}
                  onClick={async () => {
                    floodReturnPeriods.forEach((period) => {
                      mapRef.current?.clearFloodHazard?.(period);
                    });
                    setFloodReturnPeriods([]);
                    setSelectedFloodProvince(option);
                    setFloodProvinceOpen(false);
                  }}
                  className={`px-3 py-2 hover:bg-[#505050] cursor-pointer
            ${index === arr.length - 1 ? "rounded-bl-md" : ""}`}
                >
                  {option}
                </div>
              ))}
            </div>
          </div>,
          document.body
        )}
    </>
  );
}
