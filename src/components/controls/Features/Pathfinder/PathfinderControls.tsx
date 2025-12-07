"use client";

import {
  useRef,
  useState,
  useEffect,
  forwardRef,
  useImperativeHandle,
} from "react";
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
import { sortRoutesSafest } from "./SortRoutes-Safest";
import { sortRoutesBestBalance } from "./SortRoutes-BestBalance";

// ✅ helper function (place this at the top of your component or in a utils file)
const getOrdinal = (n: number) => {
  const s = ["th", "st", "nd", "rd"];
  const v = n % 100;
  return n + (s[(v - 20) % 10] || s[v] || s[0]);
};

export interface PathfinderControlsRef {
  setStartLocation: (
    location: string,
    coords: { lat: number; lon: number }
  ) => void;
  setDestinationLocation: (
    location: string,
    coords: { lat: number; lon: number }
  ) => void;
  setMode: (mode: string) => void;
  setSort: (sort: string) => void;
}

const PathfinderControls = forwardRef<
  PathfinderControlsRef,
  {
    mapRef: React.RefObject<any>;
  }
>(({ mapRef }, ref) => {
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

  // Track if location was just selected to prevent re-fetching suggestions
  const startJustSelectedRef = useRef(false);
  const destinationJustSelectedRef = useRef(false);

  const [selectedMode, setSelectedMode] = useState<string>("all");
  const [isLoadingRoutes, setIsLoadingRoutes] = useState(false);
  const [isFilteringMode, setIsFilteringMode] = useState(false);

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

  // Cache for routes by mode to avoid redundant API calls
  const routesCacheRef = useRef<Record<string, any>>({});

  // Ref to store the polling interval
  const trafficPollingIntervalRef = useRef<NodeJS.Timeout | null>(null);

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

  // Expose methods to parent via ref
  useImperativeHandle(ref, () => ({
    setStartLocation: (
      location: string,
      coords: { lat: number; lon: number }
    ) => {
      setStartText(location);
      setStartCoords(coords);
      setStartSuggestions([]);
      mapRef.current?.addStartMarker(coords.lon, coords.lat);
    },
    setDestinationLocation: (
      location: string,
      coords: { lat: number; lon: number }
    ) => {
      setDestinationText(location);
      setDestinationCoords(coords);
      setDestinationSuggestions([]);
      mapRef.current?.addDestinationMarker(coords.lon, coords.lat);
    },
    setMode: (mode: string) => {
      setSelectedMode(mode);
    },
    setSort: (sort: string) => {
      const sortMap: Record<string, string> = {
        fastest: "Fastest",
        safest: "Safest",
        best_balance: "Best balance",
      };
      setSelectedSort(sortMap[sort] || "Best balance");
    },
  }));

  // Auto-fetch routes when both start and destination coords are set
  useEffect(() => {
    if (startCoords && destinationCoords) {
      console.log(
        "🔵 Both coords set, fetching routes:",
        startCoords,
        destinationCoords
      );
      fetchAndDrawRoutes(
        startCoords,
        destinationCoords,
        selectedMode as "all" | "driving" | "walking" | "cycling" | "motorcycle"
      );
    }
  }, [startCoords, destinationCoords]);

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

    // Don't fetch if location was just selected
    if (startJustSelectedRef.current) {
      startJustSelectedRef.current = false;
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

    // Don't fetch if location was just selected
    if (destinationJustSelectedRef.current) {
      destinationJustSelectedRef.current = false;
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
      const target = e.target as Node;

      // Check if click is outside both input containers AND suggestion lists
      const isOutsideStart =
        startContainerRef.current &&
        !startContainerRef.current.contains(target) &&
        startSuggestionsRef.current &&
        !startSuggestionsRef.current.contains(target);

      const isOutsideDestination =
        destinationContainerRef.current &&
        !destinationContainerRef.current.contains(target) &&
        destinationSuggestionsRef.current &&
        !destinationSuggestionsRef.current.contains(target);

      if (isOutsideStart) {
        setStartSuggestions([]);
      }

      if (isOutsideDestination) {
        setDestinationSuggestions([]);
      }
    };
    document.addEventListener("click", handler);
    return () => document.removeEventListener("click", handler);
  }, []);

  // Function to update traffic data for existing routes
  const updateTrafficData = async () => {
    if (routesData.length === 0) return;

    console.log("🔄 Updating traffic data...");

    try {
      const updatedRoutes = await Promise.all(
        routesData.map(async (route: any) => {
          // Skip walking routes
          if (route.profile === "walking") {
            return route;
          }

          try {
            // Get the cached geojson for this route
            const cacheKey = Object.keys(routesCacheRef.current).find((key) =>
              key.includes(route.profile)
            );

            if (!cacheKey) return route;

            const cached = routesCacheRef.current[cacheKey];
            const routeIndex = cached.routesWithTraffic.findIndex(
              (r: any) => r.profile === route.profile && r.index === route.index
            );

            if (routeIndex === -1) return route;

            const feature = cached.geojson?.features?.[routeIndex];

            if (feature?.geometry?.coordinates) {
              const trafficRes = await fetch(
                `${
                  process.env.NEXT_PUBLIC_BACKEND_ENDPOINT ||
                  "http://localhost:8000"
                }/api/traffic/route-incidents`,
                {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({
                    coordinates: feature.geometry.coordinates,
                  }),
                }
              );

              if (trafficRes.ok) {
                const trafficData = await trafficRes.json();
                return { ...route, trafficData };
              }
            }
          } catch (error) {
            console.error("Error updating traffic data for route:", error);
          }

          return route;
        })
      );

      setRoutesData(updatedRoutes);

      // Update cache with new traffic data
      Object.keys(routesCacheRef.current).forEach((key) => {
        const cached = routesCacheRef.current[key];
        const updatedCachedRoutes = cached.routesWithTraffic.map(
          (cachedRoute: any) => {
            const updated = updatedRoutes.find(
              (r: any) =>
                r.profile === cachedRoute.profile &&
                r.index === cachedRoute.index
            );
            return updated || cachedRoute;
          }
        );

        routesCacheRef.current[key] = {
          ...cached,
          routesWithTraffic: updatedCachedRoutes,
        };
      });

      // Redraw incident segments with updated data
      const routesWithIncidentsForMap = updatedRoutes.map(
        (route: any, index: number) => ({
          featureIndex: index,
          trafficData: route.trafficData,
        })
      );
      mapRef.current?.drawIncidentSegments(routesWithIncidentsForMap);

      console.log("✅ Traffic data updated");
    } catch (error) {
      console.error("Error updating traffic data:", error);
    }
  };

  const fetchAndDrawRoutes = async (
    start: { lat: number; lon: number },
    destination: { lat: number; lon: number },
    mode: "driving" | "walking" | "cycling" | "motorcycle" | "all" = "all",
    isModeSwitch: boolean = false
  ) => {
    // Create cache key based on start, destination, and mode
    const cacheKey = `${start.lat},${start.lon}-${destination.lat},${destination.lon}-${mode}`;

    // Check if we have cached data for this mode
    if (routesCacheRef.current[cacheKey]) {
      console.log(`✅ Using cached routes for mode: ${mode}`);
      const cachedData = routesCacheRef.current[cacheKey];
      setRoutesData(cachedData.routesWithTraffic);

      // Draw routes on map
      if (cachedData.geojson?.features?.length) {
        mapRef.current?.drawRoutes(cachedData.geojson);

        // Build the routeKey => featureIndex mapping
        const mapObj: Record<string, number> = {};
        for (let i = 0; i < (cachedData.routesWithTraffic || []).length; i++) {
          const r = cachedData.routesWithTraffic[i];
          const key = `${r.profile}-${r.source}-${r.index}`;
          mapObj[key] = i;
        }
        setRouteKeyToFeatureIndex(mapObj);

        mapRef.current?.drawIncidentSegments(
          cachedData.routesWithTraffic.map((route: any, index: number) => ({
            featureIndex: index,
            trafficData: route.trafficData,
          }))
        );

        // Select first route
        const firstRoute = cachedData.routesWithTraffic[0];
        if (firstRoute) {
          const firstKey = `${firstRoute.profile}-${firstRoute.source}-${firstRoute.index}`;
          setSelectedRouteKey(firstKey);
          const featureIdx = mapObj[firstKey];
          mapRef.current?.highlightRouteByFeatureIndex(
            typeof featureIdx === "number" ? featureIdx : null
          );
        }
      }
      return;
    }

    setIsLoadingRoutes(true);
    setIsFilteringMode(isModeSwitch);
    console.log(
      isModeSwitch ? "🔄 Filtering routes..." : "🔄 Loading routes started"
    );

    try {
      const res = await fetch(
        `http://localhost:8000/routes?start_lat=${start.lat}&start_lon=${start.lon}&dest_lat=${destination.lat}&dest_lon=${destination.lon}&mode=${mode}`
      );
      const data = await res.json();

      // Fetch traffic data for each route (skip for walking routes)
      const routesWithTraffic = await Promise.all(
        data.routesData.map(async (route: any) => {
          // Skip traffic data for walking routes
          if (route.profile === "walking") {
            return {
              ...route,
              trafficData: {
                incident_count: 0,
                total_severity_score: 0,
                incidents: [],
              },
            };
          }

          try {
            // Get route coordinates from the corresponding GeoJSON feature
            const featureIndex = data.routesData.indexOf(route);
            const feature = data.geojson?.features?.[featureIndex];

            if (feature?.geometry?.coordinates) {
              const trafficRes = await fetch(
                `${
                  process.env.NEXT_PUBLIC_BACKEND_ENDPOINT ||
                  "http://localhost:8000"
                }/api/traffic/route-incidents`,
                {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({
                    coordinates: feature.geometry.coordinates,
                  }),
                }
              );

              if (trafficRes.ok) {
                const trafficData = await trafficRes.json();
                console.log(
                  `[Traffic Data] Route ${route.profile}:`,
                  trafficData
                );
                return { ...route, trafficData };
              }
            }
          } catch (error) {
            console.error("Error fetching traffic data for route:", error);
          }

          // Return route without traffic data if fetch fails
          return {
            ...route,
            trafficData: {
              incident_count: 0,
              total_severity_score: 0,
              incidents: [],
            },
          };
        })
      );

      setRoutesData(routesWithTraffic);

      // Store in cache for future use
      routesCacheRef.current[cacheKey] = {
        routesWithTraffic,
        geojson: data.geojson,
      };
      console.log(`💾 Cached routes for mode: ${mode}`);

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

        // Draw traffic incident segments on routes
        const routesWithIncidentsForMap = routesWithTraffic.map(
          (route: any, index: number) => ({
            featureIndex: index,
            trafficData: route.trafficData,
          })
        );
        mapRef.current?.drawIncidentSegments(routesWithIncidentsForMap);

        // choose the first visible route (respecting selectedMode & selectedSort)
        let visibleList = routesWithTraffic;
        if (selectedSort === "Fastest") {
          visibleList = sortRoutesFastest(routesWithTraffic);
        } else if (selectedSort === "Safest") {
          visibleList = sortRoutesSafest(routesWithTraffic);
        } else if (selectedSort === "Best balance") {
          visibleList = sortRoutesBestBalance(routesWithTraffic);
        }

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
    } finally {
      setIsLoadingRoutes(false);
      console.log("✅ Loading routes completed");
    }
  };

  // Start/stop traffic polling when routes are loaded
  useEffect(() => {
    // Clear any existing interval
    if (trafficPollingIntervalRef.current) {
      clearInterval(trafficPollingIntervalRef.current);
      trafficPollingIntervalRef.current = null;
    }

    // Start polling if we have routes
    if (routesData.length > 0) {
      console.log("🔁 Starting traffic polling (60s interval)");
      trafficPollingIntervalRef.current = setInterval(() => {
        updateTrafficData();
      }, 60000); // 60 seconds
    }

    // Cleanup on unmount or when routes change
    return () => {
      if (trafficPollingIntervalRef.current) {
        clearInterval(trafficPollingIntervalRef.current);
        trafficPollingIntervalRef.current = null;
        console.log("⏹️ Stopped traffic polling");
      }
    };
  }, [routesData.length]); // Only restart when routes are added/removed

  // ensure the first visible route becomes selected when routesData, mode or sort change
  useEffect(() => {
    if (!routesData || routesData.length === 0) {
      setSelectedRouteKey(null);
      mapRef.current?.highlightRouteByFeatureIndex(null);
      return;
    }

    let visibleList = routesData;
    if (selectedSort === "Fastest") {
      visibleList = sortRoutesFastest(routesData);
    } else if (selectedSort === "Safest") {
      visibleList = sortRoutesSafest(routesData);
    } else if (selectedSort === "Best balance") {
      visibleList = sortRoutesBestBalance(routesData);
    }

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
    startJustSelectedRef.current = true;
    setStartText(place.properties.formatted);
    setStartSuggestions([]);
    const coords = { lat: place.properties.lat, lon: place.properties.lon };
    setStartCoords(coords);
    mapRef.current?.addStartMarker(coords.lon, coords.lat);

    // Clear cache and stop polling when start location changes
    routesCacheRef.current = {};
    if (trafficPollingIntervalRef.current) {
      clearInterval(trafficPollingIntervalRef.current);
      trafficPollingIntervalRef.current = null;
    }
    console.log("🗑️ Cache cleared - new start location");

    if (destinationCoords) {
      fetchAndDrawRoutes(coords, destinationCoords, "all");
      mapRef.current?.fitBoundsToMarkers();
    } else {
      mapRef.current?.flyTo({ center: [coords.lon, coords.lat], zoom: 14 });
    }
  };

  const handleDestinationSelect = (place: any) => {
    destinationJustSelectedRef.current = true;
    setDestinationText(place.properties.formatted);
    setDestinationSuggestions([]);
    const coords = { lat: place.properties.lat, lon: place.properties.lon };
    setDestinationCoords(coords);
    mapRef.current?.addDestinationMarker(coords.lon, coords.lat);

    // Clear cache and stop polling when destination changes
    routesCacheRef.current = {};
    if (trafficPollingIntervalRef.current) {
      clearInterval(trafficPollingIntervalRef.current);
      trafficPollingIntervalRef.current = null;
    }
    console.log("🗑️ Cache cleared - new destination");

    if (startCoords) {
      fetchAndDrawRoutes(startCoords, coords, "all");
      mapRef.current?.fitBoundsToMarkers();
    } else {
      mapRef.current?.flyTo({ center: [coords.lon, coords.lat], zoom: 14 });
    }
  };

  const buttonClass = (mode: string) =>
    `w-9 h-9 flex items-center justify-center rounded-lg transition ${
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
      className="w-full bg-[#2E2E2E] rounded-lg shadow-md text-[#C7C7C7] flex flex-col p-3 scrollbar-rounded relative"
      style={{ maxHeight: "calc(100vh - 36px)", overflowY: "auto" }}
    >
      <Tabs defaultValue="destination" className="w-full flex flex-col gap-2.5">
        <TabsList className="bg-[#5A5A5A] rounded-md w-full grid grid-cols-2 p-1 h-auto items-center">
          <TabsTrigger
            value="destination"
            className="data-[state=active]:bg-[#FFFFFF] data-[state=active]:text-[#2E2E2E] data-[state=active]:shadow-none text-[#FFFFFF] text-[10px] font-medium rounded-sm flex items-center justify-center h-[24px] px-2 border-0"
            style={{ lineHeight: "24px", padding: "0 0.5rem" }}
          >
            Set Destination
          </TabsTrigger>
          <TabsTrigger
            value="evacuation"
            className="data-[state=active]:bg-[#FFFFFF] data-[state=active]:text-[#2E2E2E] data-[state=active]:shadow-none text-[#FFFFFF] text-[10px] font-medium rounded-sm flex items-center justify-center h-[24px] px-2 border-0"
            style={{ lineHeight: "24px", padding: "0 0.5rem" }}
          >
            Find Evacuation Area
          </TabsTrigger>
        </TabsList>

        <div className="flex flex-col gap-2">
          {/* Inputs */}
          <div className="relative" ref={startContainerRef}>
            <div className="bg-[#5A5A5A] h-[30px] flex items-center gap-1.5 px-2 rounded-md shadow-md">
              <MapPin width={15} height={15} color="#75F7A9" />
              <input
                ref={startRef}
                type="text"
                placeholder="Enter starting point..."
                value={startText}
                onChange={(e) => setStartText(e.target.value)}
                onBlur={() => {
                  // Clear suggestions after a short delay to allow click events to fire
                  setTimeout(() => setStartSuggestions([]), 200);
                }}
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
                className="bg-transparent outline-none text-[10px] text-[#C7C7C7] placeholder-[#999] w-full h-full"
              />
            </div>
            {startSuggestions.length > 0 &&
              ReactDOM.createPortal(
                <ul
                  ref={startSuggestionsRef}
                  className="absolute z-[999] mt-1.5 bg-white rounded-md shadow-lg max-h-48 overflow-y-auto text-[#2E2E2E] scrollbar-rounded"
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
                      className={`px-2.5 py-1.5 text-[10px] cursor-pointer ${
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
            <div className="bg-[#5A5A5A] h-[30px] flex items-center gap-1.5 px-2 rounded-md shadow-md">
              <MapPin width={15} height={15} color="#FF9494" />
              <input
                ref={destinationRef}
                type="text"
                placeholder="Enter destination..."
                value={destinationText}
                onChange={(e) => setDestinationText(e.target.value)}
                onBlur={() => {
                  // Clear suggestions after a short delay to allow click events to fire
                  setTimeout(() => setDestinationSuggestions([]), 200);
                }}
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
                className="bg-transparent outline-none text-[10px] text-[#C7C7C7] placeholder-[#999] w-full h-full"
              />
            </div>
            {destinationSuggestions.length > 0 &&
              ReactDOM.createPortal(
                <ul
                  ref={destinationSuggestionsRef}
                  className="absolute z-[999] mt-1.5 bg-white rounded-md shadow-lg max-h-48 overflow-y-auto text-[#2E2E2E] scrollbar-rounded"
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
                      className={`px-2.5 py-1.5 text-[10px] cursor-pointer ${
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
                    fetchAndDrawRoutes(
                      startCoords,
                      destinationCoords,
                      "all",
                      true
                    );
                    setSelectedMode("all");
                  }
                }}
              >
                <Route size={20} />
              </button>

              <button
                className={buttonClass("driving")}
                onClick={() => {
                  if (startCoords && destinationCoords) {
                    fetchAndDrawRoutes(
                      startCoords,
                      destinationCoords,
                      "driving",
                      true
                    );
                    setSelectedMode("driving");
                  }
                }}
              >
                <Car size={20} />
              </button>

              <button
                className={buttonClass("motorcycle")}
                onClick={() => {
                  if (startCoords && destinationCoords) {
                    fetchAndDrawRoutes(
                      startCoords,
                      destinationCoords,
                      "motorcycle",
                      true
                    );
                    setSelectedMode("motorcycle");
                  }
                }}
              >
                <TwoWheelerIcon
                  style={{
                    fontSize: 20,
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
                      "cycling",
                      true
                    );
                    setSelectedMode("cycling");
                  }
                }}
              >
                <Bike size={20} />
              </button>

              <button
                className={buttonClass("walking")}
                onClick={() => {
                  if (startCoords && destinationCoords) {
                    fetchAndDrawRoutes(
                      startCoords,
                      destinationCoords,
                      "walking",
                      true
                    );
                    setSelectedMode("walking");
                    // Auto-switch to "Fastest" for walking mode (no traffic data)
                    setSelectedSort("Fastest");
                  }
                }}
              >
                <Footprints size={20} />
              </button>
            </div>
          )}

          {/* Routes & Steps */}
          {(routesData.length > 0 || isLoadingRoutes) && (
            <>
              {!isLoadingRoutes && (
                <div className="flex items-center gap-1.5 mt-1">
                  <p className="text-white text-[9px] font-semibold">
                    Available Routes
                  </p>
                  <div className="bg-[#5A5A5A] text-[#00FF7B] text-[9px] font-semibold w-5 h-5 rounded-sm shadow-md flex items-center justify-center">
                    {
                      routesData.filter((r) =>
                        selectedMode === "all"
                          ? true
                          : r.profile === selectedMode
                      ).length
                    }
                  </div>

                  {/* Sorting Dropdown */}
                  <div className="relative ml-auto" ref={sortDropdownRef}>
                    <button
                      onClick={() => setShowSortDropdown((prev) => !prev)}
                      className="flex items-center justify-between gap-0.5 bg-[#5A5A5A] text-white text-[9px] px-2 py-0.5 rounded-sm hover:bg-[#6A6A6A] transition w-[95px]"
                    >
                      {selectedSort}
                      {showSortDropdown ? (
                        <ChevronUp size={12} />
                      ) : (
                        <ChevronDown size={12} />
                      )}
                    </button>

                    {showSortDropdown && (
                      <div className="absolute right-0 mt-0.5 w-[95px] bg-[#5A5A5A] rounded-sm shadow-lg text-[9px] text-white z-50">
                        {/* Only show "Fastest" for walking mode, all options for others */}
                        {(selectedMode === "walking"
                          ? ["Fastest"]
                          : ["Best balance", "Safest", "Fastest"]
                        ).map((option, index, array) => (
                          <div
                            key={option}
                            onClick={() => {
                              setSelectedSort(option);
                              setShowSortDropdown(false);
                            }}
                            className={`px-2 py-0.5 cursor-pointer hover:bg-[#6A6A6A] 
            ${
              selectedSort === option
                ? "bg-gradient-to-r from-[#9699FF] to-white text-black"
                : ""
            }
            ${index === 0 ? "rounded-t-sm" : ""}
            ${index === array.length - 1 ? "rounded-b-sm" : ""}
          `}
                          >
                            {option}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Loading State */}
              {isLoadingRoutes && (
                <div
                  className={`flex flex-col items-center justify-center bg-[#1E1E1E] px-8 rounded-md ${
                    isFilteringMode
                      ? "py-8 min-h-[150px]"
                      : "py-12 min-h-[200px]"
                  }`}
                >
                  <div className="relative w-10 h-10 mb-6">
                    {/* Spinning circle animation */}
                    <div className="absolute inset-0 border-3 border-[#3A3A3A] rounded-full"></div>
                    <div className="absolute inset-0 border-3 border-transparent border-t-[#9699FF] rounded-full animate-spin"></div>
                  </div>
                  <p className="text-white text-[11px] font-semibold">
                    {isFilteringMode
                      ? "Filtering Routes..."
                      : "Finding Routes..."}
                  </p>
                  {!isFilteringMode && (
                    <p className="text-[#AAAAAA] text-[9px] text-center mt-2">
                      Analyzing traffic and calculating best paths
                    </p>
                  )}
                </div>
              )}

              {/* Routes List */}
              {!isLoadingRoutes && routesData.length > 0 && (
                <div className="scrollbar-rounded max-h-160 overflow-y-auto bg-[#1E1E1E] p-2 rounded-md space-y-2">
                  {(selectedSort === "Fastest"
                    ? sortRoutesFastest(routesData)
                    : selectedSort === "Safest"
                    ? sortRoutesSafest(routesData)
                    : selectedSort === "Best balance"
                    ? sortRoutesBestBalance(routesData)
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
                        className={`border rounded-sm p-2 text-[10px] text-[#C7C7C7] cursor-pointer transition
                          ${
                            isSelected
                              ? "border-[#9699FF] shadow-lg"
                              : "border-[#3A3A3A]"
                          }`}
                      >
                        <div className="flex items-center">
                          {/* Left: Icon and Time */}
                          <div className="flex flex-col items-center justify-center px-0.5">
                            {route.profile === "driving" && (
                              <Car className="text-white" size={16} />
                            )}
                            {route.profile === "cycling" && (
                              <Bike className="text-white" size={16} />
                            )}
                            {route.profile === "walking" && (
                              <Footprints className="text-white" size={16} />
                            )}
                            {route.profile === "motorcycle" && (
                              <TwoWheelerIcon
                                style={{ fontSize: 16, color: "white" }}
                              />
                            )}
                            <span className="w-[40px] text-center text-[9px] text-[#AAAAAA] mt-1 inline-block">
                              {formatDuration(route.duration)}
                            </span>
                          </div>

                          {/* Divider */}
                          <div className="w-px h-[45px] bg-[#555] mx-1" />

                          {/* Right: Title, Distance, Button */}
                          <div className="flex flex-col justify-center pl-1 flex-1">
                            <p className="font-semibold capitalize text-white text-[10px]">
                              {selectedSort === "Fastest" ? (
                                <>
                                  {idx === 0 &&
                                    `Fastest - ${route.profile} Route`}
                                  {idx === 1 &&
                                    `2nd Fastest - ${route.profile} Route`}
                                  {idx === 2 &&
                                    `3rd Fastest - ${route.profile} Route`}
                                  {idx > 2 &&
                                    `${getOrdinal(idx + 1)} - ${
                                      route.profile
                                    } Route`}
                                </>
                              ) : selectedSort === "Safest" ? (
                                <>
                                  {idx === 0 &&
                                    `Safest - ${route.profile} Route`}
                                  {idx === 1 &&
                                    `2nd Safest - ${route.profile} Route`}
                                  {idx === 2 &&
                                    `3rd Safest - ${route.profile} Route`}
                                  {idx > 2 &&
                                    `${getOrdinal(idx + 1)} - ${
                                      route.profile
                                    } Route`}
                                </>
                              ) : selectedSort === "Best balance" ? (
                                <>
                                  {idx === 0 &&
                                    `Best Balance - ${route.profile} Route`}
                                  {idx === 1 &&
                                    `2nd Best Balance - ${route.profile} Route`}
                                  {idx === 2 &&
                                    `3rd Best Balance - ${route.profile} Route`}
                                  {idx > 2 &&
                                    `${getOrdinal(idx + 1)} - ${
                                      route.profile
                                    } Route`}
                                </>
                              ) : (
                                `${route.profile} Route`
                              )}
                            </p>

                            <p className="text-[10px] mt-0.5">
                              {(route.distance / 1000).toFixed(2)} km
                            </p>

                            <button
                              onClick={() =>
                                setShowStepsMap((prev) => ({
                                  ...prev,
                                  [routeKey]: !prev[routeKey],
                                }))
                              }
                              className="flex items-center gap-0.5 text-[9px] text-transparent bg-gradient-to-r from-[#9699FF] to-white bg-clip-text hover:underline transition mt-1.5 w-fit"
                            >
                              <ChevronDown
                                className={`transition-transform duration-300 text-[#9699FF] ${
                                  showStepsMap[routeKey] ? "rotate-180" : ""
                                }`}
                                size={10}
                              />
                              {showStepsMap[routeKey] ? "Hide" : "Show"}{" "}
                              Directions
                            </button>
                          </div>
                        </div>

                        {/* Steps */}
                        {showStepsMap[routeKey] && (
                          <ol className="list-decimal text-[9px] text-[#AAAAAA] pl-4 space-y-0.5 mt-2">
                            {route.steps.map((step: any, i: number) => (
                              <li key={i}>{step.maneuver.instruction}</li>
                            ))}
                          </ol>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </>
          )}
        </div>
      </Tabs>

      {/* Floating top-right summary box */}
      {routesData.length > 0 && (
        <div className="fixed top-[15px] right-[15px] bg-[#2E2E2E] rounded-xl shadow-md text-white p-3.5 z-[1000] w-[210px]">
          <p className="text-center text-[13px] font-semibold">Route Hazards</p>
          <hr className="border-gray-500 my-2" />

          <div className="mt-3 space-y-2">
            <div className="flex justify-between items-center text-[10px]">
              <span className="flex-1">Obstructions</span>
              <span className="text-right min-w-[40px]">3</span>
            </div>
            <div className="flex justify-between items-center text-[10px]">
              <span className="flex-1">Congestion</span>
              <span className="text-right min-w-[40px]">5</span>
            </div>
            <div className="flex justify-between items-center text-[10px]">
              <span className="flex-1">Road Closure</span>
              <span className="text-right min-w-[40px]">1</span>
            </div>
            <div className="flex justify-between items-center text-[10px]">
              <span className="flex-1">Lane Closure</span>
              <span className="text-right min-w-[40px]">2</span>
            </div>
            <div className="flex justify-between items-center text-[10px]">
              <span className="flex-1">Flooded Points</span>
              <span className="text-right min-w-[40px]">4</span>
            </div>

            {/* More info button */}
            <div className="text-center">
              <button
                onClick={() => setShowModal(true)}
                className="text-[10px] text-[#8183e5] hover:text-[#a7a9fa]"
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
              <div className="flex items-center gap-x-4 text-[10px]">
                <span className="w-32">Obstructions</span>
                <span className="bg-gradient-to-r from-[#9699FF] to-white bg-clip-text text-transparent">
                  3
                </span>
              </div>
              <div className="flex items-center gap-x-4 text-[10px]">
                <span className="w-32">Congestion</span>
                <span className="bg-gradient-to-r from-[#9699FF] to-white bg-clip-text text-transparent">
                  5
                </span>
              </div>
              <div className="flex items-center gap-x-4 text-[10px]">
                <span className="w-32">Road Closure</span>
                <span className="bg-gradient-to-r from-[#9699FF] to-white bg-clip-text text-transparent">
                  1
                </span>
              </div>
              <div className="flex items-center gap-x-4 text-[10px]">
                <span className="w-32">Lane Closure</span>
                <span className="bg-gradient-to-r from-[#9699FF] to-white bg-clip-text text-transparent">
                  2
                </span>
              </div>

              {/* Flooded Points */}
              <div className="flex items-start gap-x-4 text-[10px]">
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
});

PathfinderControls.displayName = "PathfinderControls";
export default PathfinderControls;
