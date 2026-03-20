"use client";

import {
  ChevronDown,
  ListFilter,
  ArrowDownAZ,
  ArrowDownZA,
} from "lucide-react";
import { useState, useMemo, useEffect } from "react";
import { Checkbox } from "@/components/ui/checkbox";
import { earthquakeData } from "./EarthquakeDataConfig";
import { weatherData } from "./WeatherDataConfig";

interface LiveHazardMonitorProps {
  isVisible: boolean;
  earthquakeEnabled: boolean;
  weatherEnabled: boolean;
  onEarthquakeToggle: (enabled: boolean) => void;
  onWeatherToggle: (enabled: boolean) => void;
  onEarthquakeSourcesChange?: (sources: string[]) => void;
  onWeatherSourcesChange?: (sources: string[]) => void;
  initialSelectedEarthquakes?: string[];
  initialSelectedWeather?: string[];
}

export default function LiveHazardMonitor({
  isVisible,
  earthquakeEnabled,
  weatherEnabled,
  onEarthquakeToggle,
  onWeatherToggle,
  onEarthquakeSourcesChange,
  onWeatherSourcesChange,
  initialSelectedEarthquakes = [],
  initialSelectedWeather = [],
}: LiveHazardMonitorProps) {
  const [earthquakeExpanded, setEarthquakeExpanded] = useState(false);
  const [weatherExpanded, setWeatherExpanded] = useState(false);
  const [selectedEarthquakes, setSelectedEarthquakes] = useState<string[]>(
    initialSelectedEarthquakes
  );
  const [selectedWeather, setSelectedWeather] = useState<string[]>(
    initialSelectedWeather
  );
  const [earthquakeSortAsc, setEarthquakeSortAsc] = useState(true);
  const [weatherSortAsc, setWeatherSortAsc] = useState(true);
  const [earthquakeSearch, setEarthquakeSearch] = useState("");
  const [weatherSearch, setWeatherSearch] = useState("");

  const sortedEarthquakeData = useMemo(() => {
    const filtered = earthquakeData.filter((item) => {
      const searchLower = earthquakeSearch.toLowerCase();
      return (
        item.name.toLowerCase().includes(searchLower) ||
        item.scope.toLowerCase().includes(searchLower) ||
        item.source.toLowerCase().includes(searchLower)
      );
    });
    return filtered.sort((a, b) =>
      earthquakeSortAsc
        ? a.name.localeCompare(b.name)
        : b.name.localeCompare(a.name)
    );
  }, [earthquakeSortAsc, earthquakeSearch]);

  const sortedWeatherData = useMemo(() => {
    const filtered = weatherData.filter((item) => {
      const searchLower = weatherSearch.toLowerCase();
      return (
        item.name.toLowerCase().includes(searchLower) ||
        item.scope.toLowerCase().includes(searchLower) ||
        item.source.toLowerCase().includes(searchLower)
      );
    });
    return filtered.sort((a, b) =>
      weatherSortAsc
        ? a.name.localeCompare(b.name)
        : b.name.localeCompare(a.name)
    );
  }, [weatherSortAsc, weatherSearch]);

  // Sync with parent-controlled state
  useEffect(() => {
    setSelectedEarthquakes(initialSelectedEarthquakes);
  }, [initialSelectedEarthquakes]);

  useEffect(() => {
    setSelectedWeather(initialSelectedWeather);
  }, [initialSelectedWeather]);

  // Notify parent when earthquake sources change
  useEffect(() => {
    if (onEarthquakeSourcesChange) {
      onEarthquakeSourcesChange(selectedEarthquakes);
    }
  }, [selectedEarthquakes, onEarthquakeSourcesChange]);

  // Notify parent when weather sources change
  useEffect(() => {
    if (onWeatherSourcesChange) {
      onWeatherSourcesChange(selectedWeather);
    }
  }, [selectedWeather, onWeatherSourcesChange]);

  if (!isVisible) return null;

  return (
    <div
      className="w-full bg-[#2E2E2E] rounded-lg shadow-md text-[#C7C7C7] flex flex-col"
      style={{
        maxHeight: "calc(100vh - 91px)",
      }}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-3 pt-3 pb-2 z-10 border-b border-[#3a3a3a]">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse flex-shrink-0 -translate-y-[1px]"></div>
          <span className="text-[10px] font-medium text-[#9699FF]">
            Live Hazard Monitor
          </span>
        </div>
      </div>

      {/* Scrollable Content */}
      <div className="scrollbar-rounded overflow-y-auto px-3 pt-3 pb-3 flex-1">
        {/* Earthquake Alerts */}
        <div className="mb-2">
          <button
            onClick={() => setEarthquakeExpanded(!earthquakeExpanded)}
            className="w-full flex items-center justify-between p-2.5 bg-[#3a3a3a] rounded-md hover:bg-[#424242] transition"
          >
            <span className="text-[11px] font-medium">Earthquake</span>
            <ChevronDown
              size={14}
              className={`transition-transform duration-200 ${
                earthquakeExpanded ? "rotate-180" : ""
              }`}
            />
          </button>

          {earthquakeExpanded && (
            <div className="mb-3 mx-2 space-y-2 border-l border-r border-b border-[#4a4a4a] rounded-b-md p-3">
              <div className="flex justify-between items-center mb-2">
                <input
                  type="text"
                  placeholder="Search..."
                  value={earthquakeSearch}
                  onChange={(e) => setEarthquakeSearch(e.target.value)}
                  className="w-32 bg-[#3a3a3a] text-white text-[10px] px-2 py-1 rounded outline-none mr-2"
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
                    onClick={() => setEarthquakeSortAsc(!earthquakeSortAsc)}
                    className="flex items-center px-1 py-1 bg-transparent transition group"
                  >
                    {earthquakeSortAsc ? (
                      <ArrowDownAZ
                        size={14}
                        className="text-gray-400 group-hover:text-white transition"
                      />
                    ) : (
                      <ArrowDownZA
                        size={14}
                        className="text-gray-400 group-hover:text-white transition"
                      />
                    )}
                  </button>
                </div>
              </div>
              <div
                className="space-y-2 max-h-[300px] overflow-y-auto pr-2"
                style={{
                  scrollbarWidth: "thin",
                  scrollbarColor: "#706f6f transparent",
                }}
              >
                {sortedEarthquakeData.map((item, index) => (
                  <div
                    key={index}
                    onClick={() => {
                      setSelectedEarthquakes((prev) =>
                        prev.includes(item.name)
                          ? prev.filter((name) => name !== item.name)
                          : [...prev, item.name]
                      );
                    }}
                    className={`p-3 rounded-md cursor-pointer transition flex items-center gap-3 ${
                      selectedEarthquakes.includes(item.name)
                        ? "bg-[#3d3e69] border-2 border-[#9699FF]"
                        : "bg-[#2a2a2a] hover:bg-[#353535]"
                    }`}
                  >
                    <Checkbox
                      checked={selectedEarthquakes.includes(item.name)}
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
                        Scope: {item.scope}
                      </div>
                      <div className="text-gray-400 text-[9px]">
                        Source: {item.source}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Weather Alerts */}
        <div>
          <button
            onClick={() => setWeatherExpanded(!weatherExpanded)}
            className="w-full flex items-center justify-between p-2.5 bg-[#3a3a3a] rounded-md hover:bg-[#424242] transition"
          >
            <span className="text-[11px] font-medium">Weather</span>
            <ChevronDown
              size={14}
              className={`transition-transform duration-200 ${
                weatherExpanded ? "rotate-180" : ""
              }`}
            />
          </button>

          {weatherExpanded && (
            <div className="mb-3 mx-2 space-y-2 border-l border-r border-b border-[#4a4a4a] rounded-b-md p-3">
              <div className="flex justify-between items-center mb-2">
                <input
                  type="text"
                  placeholder="Search..."
                  value={weatherSearch}
                  onChange={(e) => setWeatherSearch(e.target.value)}
                  className="w-32 bg-[#3a3a3a] text-white text-[10px] px-2 py-1 rounded outline-none mr-2"
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
                    onClick={() => setWeatherSortAsc(!weatherSortAsc)}
                    className="flex items-center px-1 py-1 bg-transparent transition group"
                  >
                    {weatherSortAsc ? (
                      <ArrowDownAZ
                        size={14}
                        className="text-gray-400 group-hover:text-white transition"
                      />
                    ) : (
                      <ArrowDownZA
                        size={14}
                        className="text-gray-400 group-hover:text-white transition"
                      />
                    )}
                  </button>
                </div>
              </div>
              <div
                className="space-y-2 max-h-[300px] overflow-y-auto pr-2"
                style={{
                  scrollbarWidth: "thin",
                  scrollbarColor: "#706f6f transparent",
                }}
              >
                {sortedWeatherData.map((item, index) => (
                  <div
                    key={index}
                    onClick={() => {
                      setSelectedWeather((prev) =>
                        prev.includes(item.name)
                          ? prev.filter((name) => name !== item.name)
                          : [...prev, item.name]
                      );
                    }}
                    className={`p-3 rounded-md cursor-pointer transition flex items-center gap-3 ${
                      selectedWeather.includes(item.name)
                        ? "bg-[#3d3e69] border-2 border-[#9699FF]"
                        : "bg-[#2a2a2a] hover:bg-[#353535]"
                    }`}
                  >
                    <Checkbox
                      checked={selectedWeather.includes(item.name)}
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
                        Scope: {item.scope}
                      </div>
                      <div className="text-gray-400 text-[9px]">
                        Source: {item.source}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
