"use client";

import { useRef, useState, useEffect } from "react";
import ReactDOM from "react-dom";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  MapPin,
  Route,
  Car,
  Bike,
  Footprints,
  ChevronDown,
  ChevronUp,
  X,
} from "lucide-react";
import TwoWheelerIcon from "@mui/icons-material/TwoWheeler";
import { sortRoutesFastest } from "./SortRoutes-Fastest";

export default function PathfinderControls({
  mapRef,
}: {
  mapRef: React.RefObject<any>;
}) {
  const [startText, setStartText] = useState("");
  const [destinationText, setDestinationText] = useState("");
  const [startCoords, setStartCoords] = useState<{
    lat: number;
    lon: number;
  } | null>(null);
  const [destinationCoords, setDestinationCoords] = useState<{
    lat: number;
    lon: number;
  } | null>(null);

  const [selectedMode, setSelectedMode] = useState<string>("all");

  const startRef = useRef<HTMLInputElement>(null);
  const destinationRef = useRef<HTMLInputElement>(null);
  const startContainerRef = useRef<HTMLDivElement>(null);
  const destinationContainerRef = useRef<HTMLDivElement>(null);
  const startSuggestionsRef = useRef<HTMLUListElement>(null);
  const destinationSuggestionsRef = useRef<HTMLUListElement>(null);

  const [startSuggestions, setStartSuggestions] = useState<any[]>([]);
  const [destinationSuggestions, setDestinationSuggestions] = useState<any[]>(
    []
  );
  const [startHighlightedIndex, setStartHighlightedIndex] =
    useState<number>(-1);
  const [destinationHighlightedIndex, setDestinationHighlightedIndex] =
    useState<number>(-1);

  const [routesData, setRoutesData] = useState<any[]>([]);
  const [showStepsMap, setShowStepsMap] = useState<{ [key: string]: boolean }>(
    {}
  );

  // REPLACE selectedRouteIndex with a stable string key that you already compute in the UI.
  // routeKey -> e.g. "driving-src-3" (matches how you build it in render)
  const [selectedRouteKey, setSelectedRouteKey] = useState<string | null>(null);

  // map routeKey => geojson feature index (the number used by Map.tsx when it names layers `route-<featureIndex>`)
  const [routeKeyToFeatureIndex, setRouteKeyToFeatureIndex] = useState<
    Record<string, number>
  >({});

  const [showModal, setShowModal] = useState(false);

  const [selectedSort, setSelectedSort] = useState<string>("Best balance");
  const [showSortDropdown, setShowSortDropdown] = useState<boolean>(false);
  const sortDropdownRef = useRef<HTMLDivElement>(null);

  const startItemRefs = useRef<(HTMLLIElement | null)[]>([]);
  const destinationItemRefs = useRef<(HTMLLIElement | null)[]>([]);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (
        sortDropdownRef.current &&
        !sortDropdownRef.current.contains(e.target as Node)
      ) {
        setShowSortDropdown(false);
      }
    };

    document.addEventListener("click", handler);
    return () => document.removeEventListener("click", handler);
  }, []);

  useEffect(() => {
    if (!startText.trim()) {
      setStartSuggestions([]);
      return;
    }
    const delay = setTimeout(async () => {
      const res = await fetch(
        `http://localhost:8000/geocode/autocomplete?text=${encodeURIComponent(
          startText
        )}`
      );

      const data = await res.json();
      setStartSuggestions(data.features || []);
      setStartHighlightedIndex(-1);
    }, 300);
    return () => clearTimeout(delay);
  }, [startText]);

  useEffect(() => {
    if (!destinationText.trim()) {
      setDestinationSuggestions([]);
      return;
    }
    const delay = setTimeout(async () => {
      const res = await fetch(
        `http://localhost:8000/geocode/autocomplete?text=${encodeURIComponent(
          destinationText
        )}`
      );
      const data = await res.json();
      setDestinationSuggestions(data.features || []);
      setDestinationHighlightedIndex(-1);
    }, 300);
    return () => clearTimeout(delay);
  }, [destinationText]);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (
        startContainerRef.current &&
        !startContainerRef.current.contains(e.target as Node) &&
        destinationContainerRef.current &&
        !destinationContainerRef.current.contains(e.target as Node)
      ) {
        setStartSuggestions([]);
        setDestinationSuggestions([]);
      }
    };
    document.addEventListener("click", handler);
    return () => document.removeEventListener("click", handler);
  }, []);

  const fetchAndDrawRoutes = async (
    start: { lat: number; lon: number },
    destination: { lat: number; lon: number },
    mode: "driving" | "walking" | "cycling" | "motorcycle" | "all" = "all"
  ) => {
    const res = await fetch(
      `http://localhost:8000/routes?start_lat=${start.lat}&start_lon=${start.lon}&dest_lat=${destination.lat}&dest_lon=${destination.lon}&mode=${mode}`
    );
    const data = await res.json();

    setRoutesData(data.routesData);

    if (data.geojson?.features?.length) {
      // Draw routes on the map (layers will be named route-<featureIndex>)
      mapRef.current?.drawRoutes(data.geojson);

      // Build a mapping: routeKey => featureIndex
      const mapObj: Record<string, number> = {};
      // assume data.routesData and data.geojson.features are in the same order
      for (let i = 0; i < (data.routesData || []).length; i++) {
        const r = data.routesData[i];
        const key = `${r.profile}-${r.source}-${r.index}`;
        mapObj[key] = i; // feature index used in drawRoutes
      }
      setRouteKeyToFeatureIndex(mapObj);

      // choose the first visible route (respecting selectedMode & selectedSort)
      const visibleList =
        selectedSort === "Fastest"
          ? sortRoutesFastest(data.routesData)
          : data.routesData;

      const filteredVisible = visibleList.filter((r: any) =>
        selectedMode === "all" ? true : r.profile === selectedMode
      );

      if (filteredVisible.length > 0) {
        const first = filteredVisible[0];
        const firstKey = `${first.profile}-${first.source}-${first.index}`;
        setSelectedRouteKey(firstKey);
        const featureIdx = mapObj[firstKey];
        mapRef.current?.highlightRouteByFeatureIndex(
          typeof featureIdx === "number" ? featureIdx : null
        );
      } else {
        setSelectedRouteKey(null);
        mapRef.current?.highlightRouteByFeatureIndex(null);
      }
    }
  };

  // ensure the first visible route becomes selected when routesData, mode or sort change
  useEffect(() => {
    if (!routesData || routesData.length === 0) {
      setSelectedRouteKey(null);
      mapRef.current?.highlightRouteByFeatureIndex(null);
      return;
    }

    const visibleList =
      selectedSort === "Fastest" ? sortRoutesFastest(routesData) : routesData;

    const filteredVisible = visibleList.filter((r: any) =>
      selectedMode === "all" ? true : r.profile === selectedMode
    );

    if (filteredVisible.length === 0) {
      setSelectedRouteKey(null);
      mapRef.current?.highlightRouteByFeatureIndex(null);
      return;
    }

    const first = filteredVisible[0];
    const firstKey = `${first.profile}-${first.source}-${first.index}`;

    // If new selection is same as current, do nothing
    if (firstKey === selectedRouteKey) return;

    setSelectedRouteKey(firstKey);

    // lookup feature index and call map method
    const featureIdx = routeKeyToFeatureIndex[firstKey];
    mapRef.current?.highlightRouteByFeatureIndex(
      typeof featureIdx === "number" ? featureIdx : null
    );
    // we intentionally do not include routeKeyToFeatureIndex in deps to avoid loop;
    // it is set alongside routesData in fetchAndDrawRoutes
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [routesData, selectedMode, selectedSort]);

  const handleSuggestionSelect = (place: any) => {
    setStartText(place.properties.formatted);
    setStartSuggestions([]);
    const coords = { lat: place.properties.lat, lon: place.properties.lon };
    setStartCoords(coords);
    mapRef.current?.addStartMarker(coords.lon, coords.lat);

    if (destinationCoords) {
      fetchAndDrawRoutes(coords, destinationCoords, "all");
      mapRef.current?.fitBoundsToMarkers();
    } else {
      mapRef.current?.flyTo({ center: [coords.lon, coords.lat], zoom: 14 });
    }
  };

  const handleDestinationSelect = (place: any) => {
    setDestinationText(place.properties.formatted);
    setDestinationSuggestions([]);
    const coords = { lat: place.properties.lat, lon: place.properties.lon };
    setDestinationCoords(coords);
    mapRef.current?.addDestinationMarker(coords.lon, coords.lat);

    if (startCoords) {
      fetchAndDrawRoutes(startCoords, coords, "all");
      mapRef.current?.fitBoundsToMarkers();
    } else {
      mapRef.current?.flyTo({ center: [coords.lon, coords.lat], zoom: 14 });
    }
  };

  const buttonClass = (mode: string) =>
    `p-3 rounded-lg transition ${
      selectedMode === mode
        ? "bg-gradient-to-r from-[#9699FF] to-white text-[#2E2E2E]"
        : "hover:bg-[#3A3A3A] text-[#C7C7C7]"
    }`;

  function formatDuration(durationSeconds: number): string {
    const hours = Math.floor(durationSeconds / 3600);
    const minutes = Math.floor((durationSeconds % 3600) / 60);
    const seconds = Math.round(durationSeconds % 60);

    const parts: string[] = [];

    if (hours > 0) parts.push(`${hours} hour${hours > 1 ? "s" : ""}`);
    if (minutes > 0) parts.push(`${minutes} min${minutes > 1 ? "s" : ""}`);
    if (hours === 0 && minutes === 0 && seconds > 0)
      parts.push(`${seconds} sec${seconds > 1 ? "s" : ""}`);
    if (hours === 0 && minutes > 0 && seconds > 0)
      parts.push(`${seconds} sec${seconds > 1 ? "s" : ""}`);

    return parts.join(", ");
  }

  useEffect(() => {
    if (
      startHighlightedIndex >= 0 &&
      startItemRefs.current[startHighlightedIndex]
    ) {
      startItemRefs.current[startHighlightedIndex]?.scrollIntoView({
        behavior: "smooth",
        block: "nearest",
      });
    }
  }, [startHighlightedIndex]);

  useEffect(() => {
    if (
      destinationHighlightedIndex >= 0 &&
      destinationItemRefs.current[destinationHighlightedIndex]
    ) {
      destinationItemRefs.current[destinationHighlightedIndex]?.scrollIntoView({
        behavior: "smooth",
        block: "nearest",
      });
    }
  }, [destinationHighlightedIndex]);

  return (
    <div
      className="w-96 bg-[#2E2E2E] rounded-xl shadow-md text-[#C7C7C7] flex flex-col p-4 scrollbar-rounded relative"
      style={{ maxHeight: "calc(100vh - 36px)", overflowY: "auto" }}
    >
      <Tabs defaultValue="destination" className="w-full flex flex-col gap-4">
        <TabsList className="bg-[#5A5A5A] rounded-xl w-full grid grid-cols-2 p-[6px] h-[48px]">
          <TabsTrigger
            value="destination"
            className="data-[state=active]:bg-[#FFFFFF] data-[state=active]:text-[#2E2E2E] text-[#FFFFFF] text-[14px] font-medium rounded-lg flex items-center justify-center h-full"
          >
            Set Destination
          </TabsTrigger>
          <TabsTrigger
            value="evacuation"
            className="data-[state=active]:bg-[#FFFFFF] data-[state=active]:text-[#2E2E2E] text-[#FFFFFF] text-[14px] font-medium rounded-lg flex items-center justify-center h-full"
          >
            Find Evacuation Area
          </TabsTrigger>
        </TabsList>

        <div className="flex flex-col gap-3">
          {/* Inputs */}
          <div className="relative" ref={startContainerRef}>
            <div className="bg-[#5A5A5A] h-[48px] flex items-center gap-3 px-4 rounded-xl shadow-md">
              <MapPin width={25} height={25} color="#75F7A9" />
              <input
                ref={startRef}
                type="text"
                placeholder="Enter starting point..."
                value={startText}
                onChange={(e) => setStartText(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "ArrowDown") {
                    e.preventDefault();
                    setStartHighlightedIndex((prev) =>
                      Math.min(prev + 1, startSuggestions.length - 1)
                    );
                  } else if (e.key === "ArrowUp") {
                    e.preventDefault();
                    setStartHighlightedIndex((prev) => Math.max(prev - 1, 0));
                  } else if (e.key === "Enter" && startHighlightedIndex >= 0) {
                    handleSuggestionSelect(
                      startSuggestions[startHighlightedIndex]
                    );
                  }
                }}
                className="bg-transparent outline-none text-md text-[#C7C7C7] placeholder-[#999] w-full h-full"
              />
            </div>
            {startSuggestions.length > 0 &&
              ReactDOM.createPortal(
                <ul
                  ref={startSuggestionsRef}
                  className="absolute z-[999] mt-2 w-[384px] bg-white rounded-xl shadow-lg max-h-60 overflow-y-auto text-[#2E2E2E] scrollbar-rounded"
                  style={{
                    top: startContainerRef.current
                      ? startContainerRef.current.getBoundingClientRect()
                          .bottom +
                        window.scrollY +
                        4
                      : 0,
                    left: startContainerRef.current
                      ? startContainerRef.current.getBoundingClientRect().left
                      : 0,
                    width: startContainerRef.current
                      ? startContainerRef.current.getBoundingClientRect().width
                      : undefined,
                    position: "absolute",
                  }}
                >
                  {startSuggestions.map((place, index) => (
                    <li
                      key={index}
                      ref={(el) => {
                        startItemRefs.current[index] = el;
                      }}
                      onClick={() => handleSuggestionSelect(place)}
                      className={`px-4 py-3 text-base cursor-pointer ${
                        startHighlightedIndex === index
                          ? "bg-[#5A5A5A] text-white"
                          : "hover:bg-[#eeeeee]"
                      }`}
                    >
                      {place.properties.formatted}
                    </li>
                  ))}
                </ul>,
                document.body
              )}
          </div>

          <div className="relative" ref={destinationContainerRef}>
            <div className="bg-[#5A5A5A] h-[48px] flex items-center gap-3 px-4 rounded-xl shadow-md">
              <MapPin width={25} height={25} color="#FF9494" />
              <input
                ref={destinationRef}
                type="text"
                placeholder="Enter destination..."
                value={destinationText}
                onChange={(e) => setDestinationText(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "ArrowDown") {
                    e.preventDefault();
                    setDestinationHighlightedIndex((prev) =>
                      Math.min(prev + 1, destinationSuggestions.length - 1)
                    );
                  } else if (e.key === "ArrowUp") {
                    e.preventDefault();
                    setDestinationHighlightedIndex((prev) =>
                      Math.max(prev - 1, 0)
                    );
                  } else if (
                    e.key === "Enter" &&
                    destinationHighlightedIndex >= 0
                  ) {
                    handleDestinationSelect(
                      destinationSuggestions[destinationHighlightedIndex]
                    );
                  }
                }}
                className="bg-transparent outline-none text-md text-[#C7C7C7] placeholder-[#999] w-full h-full"
              />
            </div>
            {destinationSuggestions.length > 0 &&
              ReactDOM.createPortal(
                <ul
                  ref={destinationSuggestionsRef}
                  className="absolute z-[999] mt-2 w-[384px] bg-white rounded-xl shadow-lg max-h-60 overflow-y-auto text-[#2E2E2E] scrollbar-rounded"
                  style={{
                    top: destinationContainerRef.current
                      ? destinationContainerRef.current.getBoundingClientRect()
                          .bottom +
                        window.scrollY +
                        4
                      : 0,
                    left: destinationContainerRef.current
                      ? destinationContainerRef.current.getBoundingClientRect()
                          .left
                      : 0,
                    width: destinationContainerRef.current
                      ? destinationContainerRef.current.getBoundingClientRect()
                          .width
                      : undefined,
                    position: "absolute",
                  }}
                >
                  {destinationSuggestions.map((place, index) => (
                    <li
                      key={index}
                      ref={(el) => {
                        destinationItemRefs.current[index] = el;
                      }}
                      onClick={() => handleDestinationSelect(place)}
                      className={`px-4 py-3 text-base cursor-pointer ${
                        destinationHighlightedIndex === index
                          ? "bg-[#5A5A5A] text-white"
                          : "hover:bg-[#eeeeee]"
                      }`}
                    >
                      {place.properties.formatted}
                    </li>
                  ))}
                </ul>,
                document.body
              )}
          </div>

          {/* Transport Buttons */}
          {routesData.length > 0 && (
            <div className="flex justify-between items-center">
              <button
                className={buttonClass("all")}
                onClick={() => {
                  if (startCoords && destinationCoords) {
                    fetchAndDrawRoutes(startCoords, destinationCoords, "all");
                    setSelectedMode("all");
                  }
                }}
              >
                <Route size={28} />
              </button>

              <button
                className={buttonClass("driving")}
                onClick={() => {
                  if (startCoords && destinationCoords) {
                    fetchAndDrawRoutes(
                      startCoords,
                      destinationCoords,
                      "driving"
                    );
                    setSelectedMode("driving");
                  }
                }}
              >
                <Car size={28} />
              </button>

              <button
                className={buttonClass("motorcycle")}
                onClick={() => {
                  if (startCoords && destinationCoords) {
                    fetchAndDrawRoutes(
                      startCoords,
                      destinationCoords,
                      "motorcycle" // <-- Correct mode
                    );
                    setSelectedMode("motorcycle");
                  }
                }}
              >
                <TwoWheelerIcon
                  style={{
                    fontSize: 28,
                    color:
                      selectedMode === "motorcycle" ? "#2E2E2E" : "#C7C7C7",
                  }}
                />
              </button>

              <button
                className={buttonClass("cycling")}
                onClick={() => {
                  if (startCoords && destinationCoords) {
                    fetchAndDrawRoutes(
                      startCoords,
                      destinationCoords,
                      "cycling"
                    );
                    setSelectedMode("cycling");
                  }
                }}
              >
                <Bike size={28} />
              </button>

              <button
                className={buttonClass("walking")}
                onClick={() => {
                  if (startCoords && destinationCoords) {
                    fetchAndDrawRoutes(
                      startCoords,
                      destinationCoords,
                      "walking"
                    );
                    setSelectedMode("walking");
                  }
                }}
              >
                <Footprints size={28} />
              </button>
            </div>
          )}

          {/* Routes & Steps */}
          {routesData.length > 0 && (
            <>
              <div className="flex items-center gap-2 mt-2">
                <p className="text-white text-sm font-semibold">
                  Available Routes
                </p>
                <div className="bg-[#5A5A5A] text-[#00FF7B] text-[14px] font-semibold w-6 h-7 rounded-lg shadow-md flex items-center justify-center">
                  {
                    routesData.filter((r) =>
                      selectedMode === "all" ? true : r.profile === selectedMode
                    ).length
                  }
                </div>

                {/* Sorting Dropdown */}
                <div className="relative ml-auto" ref={sortDropdownRef}>
                  <button
                    onClick={() => setShowSortDropdown((prev) => !prev)}
                    className="flex items-center justify-between gap-1 bg-[#5A5A5A] text-white text-sm px-3 py-1 rounded-lg hover:bg-[#6A6A6A] transition w-[140px]"
                  >
                    {selectedSort}
                    {showSortDropdown ? (
                      <ChevronUp size={16} />
                    ) : (
                      <ChevronDown size={16} />
                    )}
                  </button>

                  {showSortDropdown && (
                    <div className="absolute right-0 mt-1 w-[140px] bg-[#5A5A5A] rounded-lg shadow-lg text-sm text-white z-50">
                      {["Best balance", "Safest", "Fastest"].map(
                        (option, index) => (
                          <div
                            key={option}
                            onClick={() => {
                              setSelectedSort(option);
                              setShowSortDropdown(false);
                            }}
                            className={`px-4 py-1 cursor-pointer hover:bg-[#6A6A6A] 
            ${
              selectedSort === option
                ? "bg-gradient-to-r from-[#9699FF] to-white text-black"
                : ""
            }
            ${index === 0 ? "rounded-t-lg" : ""}
            ${index === 2 ? "rounded-b-lg" : ""}
          `}
                          >
                            {option}
                          </div>
                        )
                      )}
                    </div>
                  )}
                </div>
              </div>

              <div className="scrollbar-rounded max-h-160 overflow-y-auto bg-[#1E1E1E] p-3 rounded-xl space-y-4">
                {(selectedSort === "Fastest"
                  ? sortRoutesFastest(routesData)
                  : routesData
                ).map((route, idx) => {
                  const routeKey = `${route.profile}-${route.source}-${route.index}`;
                  const isSelected = selectedRouteKey === routeKey;
                  const featureIdx = routeKeyToFeatureIndex[routeKey];

                  return (
                    <div
                      key={idx}
                      onClick={() => {
                        setSelectedRouteKey(routeKey);
                        // if mapping exists, ask map to highlight that feature index
                        mapRef.current?.highlightRouteByFeatureIndex(
                          typeof featureIdx === "number" ? featureIdx : null
                        );
                      }}
                      className={`border rounded-lg p-3 text-sm text-[#C7C7C7] cursor-pointer transition
                          ${
                            isSelected
                              ? "border-[#9699FF] shadow-lg"
                              : "border-[#3A3A3A]"
                          }`}
                    >
                      <div className="flex items-center">
                        {/* Left: Icon and Time */}
                        <div className="flex flex-col items-center justify-center px-4">
                          {route.profile === "driving" && (
                            <Car className="text-white" size={30} />
                          )}
                          {route.profile === "cycling" && (
                            <Bike className="text-white" size={30} />
                          )}
                          {route.profile === "walking" && (
                            <Footprints className="text-white" size={30} />
                          )}
                          {route.profile === "motorcycle" && (
                            <TwoWheelerIcon
                              style={{ fontSize: 30, color: "white" }}
                            />
                          )}
                          <span className="w-[55px] text-center text-[13px] text-[#AAAAAA] mt-2 inline-block">
                            {formatDuration(route.duration)}
                          </span>
                        </div>

                        {/* Divider */}
                        <div className="w-px h-[70px] bg-[#555] mx-2" />

                        {/* Right: Title, Distance, Button */}
                        <div className="flex flex-col justify-center pl-4 flex-1">
                          <p className="font-semibold capitalize text-white">
                            {route.profile} route
                          </p>
                          <p className="text-sm mt-1">
                            {(route.distance / 1000).toFixed(2)} km
                          </p>

                          <button
                            onClick={() =>
                              setShowStepsMap((prev) => ({
                                ...prev,
                                [routeKey]: !prev[routeKey],
                              }))
                            }
                            className="flex items-center gap-1 text-[13px] text-transparent bg-gradient-to-r from-[#9699FF] to-white bg-clip-text hover:underline transition mt-3 w-fit"
                          >
                            <ChevronDown
                              className={`transition-transform duration-300 text-[#9699FF] ${
                                showStepsMap[routeKey] ? "rotate-180" : ""
                              }`}
                              size={14}
                            />
                            {showStepsMap[routeKey] ? "Hide" : "Show"}{" "}
                            Directions
                          </button>
                        </div>
                      </div>

                      {/* Steps */}
                      {showStepsMap[routeKey] && (
                        <ol className="list-decimal text-xs text-[#AAAAAA] pl-6 space-y-1 mt-[25px]">
                          {route.steps.map((step: any, i: number) => (
                            <li key={i}>{step.maneuver.instruction}</li>
                          ))}
                        </ol>
                      )}
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </div>
      </Tabs>

      {/* Floating top-right summary box */}
      {routesData.length > 0 && (
        <div className="fixed top-[18px] right-[18px] bg-[#2E2E2E] rounded-xl shadow-md text-white p-4 z-[1000] min-w-[230px] max-w-[290px] min-h-[230px]">
          <p className="text-center font-semibold">Route Hazards</p>
          <hr className="border-gray-500 my-2" />

          <div className="mt-4 space-y-2">
            <div className="flex justify-between text-sm">
              <span>Obstructions</span>
              <span>3</span>
            </div>
            <div className="flex justify-between text-sm">
              <span>Congestion</span>
              <span>5</span>
            </div>
            <div className="flex justify-between text-sm">
              <span>Road Closure</span>
              <span>1</span>
            </div>
            <div className="flex justify-between text-sm">
              <span>Lane Closure</span>
              <span>2</span>
            </div>
            <div className="flex justify-between text-sm">
              <span>Flooded Points</span>
              <span>4</span>
            </div>

            {/* More info button */}
            <div className="mt-2 text-center">
              <button
                onClick={() => setShowModal(true)}
                className="text-sm text-[#8183e5] hover:text-[#a7a9fa]"
              >
                More info
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/50 z-[2000]">
          <div className="bg-[#2E2E2E] rounded-xl shadow-lg p-6 max-w-md w-full relative">
            {/* Close Icon Button */}
            <button
              onClick={() => setShowModal(false)}
              className="absolute top-3 right-3 text-gray-500 hover:text-[#8183e5]"
            >
              <X size={20} />
            </button>

            {/* Heading */}
            <h2 className="text-lg font-semibold mb-2 flex items-center gap-2">
              Route Hazards →
              <span className="font-normal text-gray-300">Safest Route</span>
            </h2>
            <hr className="border-gray-500 mb-4" />

            <div className="mt-4 space-y-2">
              <div className="flex items-center gap-x-4 text-sm">
                <span className="w-32">Obstructions</span>
                <span className="bg-gradient-to-r from-[#9699FF] to-white bg-clip-text text-transparent">
                  3
                </span>
              </div>
              <div className="flex items-center gap-x-4 text-sm">
                <span className="w-32">Congestion</span>
                <span className="bg-gradient-to-r from-[#9699FF] to-white bg-clip-text text-transparent">
                  5
                </span>
              </div>
              <div className="flex items-center gap-x-4 text-sm">
                <span className="w-32">Road Closure</span>
                <span className="bg-gradient-to-r from-[#9699FF] to-white bg-clip-text text-transparent">
                  1
                </span>
              </div>
              <div className="flex items-center gap-x-4 text-sm">
                <span className="w-32">Lane Closure</span>
                <span className="bg-gradient-to-r from-[#9699FF] to-white bg-clip-text text-transparent">
                  2
                </span>
              </div>

              {/* Flooded Points */}
              <div className="flex items-start gap-x-4 text-sm">
                <span className="w-32">Flooded Points</span>
                <div className="flex flex-col space-y-1">
                  <span className="bg-gradient-to-r from-[#9699FF] to-white bg-clip-text text-transparent">
                    Point 3 (14.5995, 120.9842) -1.2m
                  </span>
                  <span className="bg-gradient-to-r from-[#9699FF] to-white bg-clip-text text-transparent">
                    Point 5 (14.6010, 120.9820) - 1.2m
                  </span>
                  <span className="bg-gradient-to-r from-[#9699FF] to-white bg-clip-text text-transparent">
                    Point 6 (14.6025, 120.9805) - 3.0m
                  </span>
                  <span className="bg-gradient-to-r from-[#9699FF] to-white bg-clip-text text-transparent">
                    Point 7 (14.6040, 120.9790) - 3.0m
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
