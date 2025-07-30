"use client";

import { useRef, useState, useEffect } from "react";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { MapPin, Route, Car, Bike, Footprints } from "lucide-react";
import TwoWheelerIcon from "@mui/icons-material/TwoWheeler";

export default function PathfinderControls({
  mapRef,
}: {
  mapRef: React.RefObject<any>;
}) {
  const [startText, setStartText] = useState("");
  const [destinationText, setDestinationText] = useState("");

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

  // Starting point suggestion fetching
  useEffect(() => {
    if (!startText.trim()) {
      setStartSuggestions([]);
      return;
    }

    const delayDebounce = setTimeout(async () => {
      const url = `https://api.geoapify.com/v1/geocode/autocomplete?text=${encodeURIComponent(
        startText
      )}&apiKey=${process.env.NEXT_PUBLIC_GEOAPIFY_API_KEY}`;
      const res = await fetch(url);
      const data = await res.json();
      setStartSuggestions(data.features || []);
      setStartHighlightedIndex(-1);
    }, 300);

    return () => clearTimeout(delayDebounce);
  }, [startText]);

  // Destination suggestion fetching
  useEffect(() => {
    if (!destinationText.trim()) {
      setDestinationSuggestions([]);
      return;
    }

    const delayDebounce = setTimeout(async () => {
      const url = `https://api.geoapify.com/v1/geocode/autocomplete?text=${encodeURIComponent(
        destinationText
      )}&apiKey=${process.env.NEXT_PUBLIC_GEOAPIFY_API_KEY}`;
      const res = await fetch(url);
      const data = await res.json();
      setDestinationSuggestions(data.features || []);
      setDestinationHighlightedIndex(-1);
    }, 300);

    return () => clearTimeout(delayDebounce);
  }, [destinationText]);

  // Close suggestions when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        startContainerRef.current &&
        !startContainerRef.current.contains(event.target as Node) &&
        destinationContainerRef.current &&
        !destinationContainerRef.current.contains(event.target as Node)
      ) {
        setStartSuggestions([]);
        setDestinationSuggestions([]);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Selecting a suggestion (START only)
  const handleSuggestionSelect = (place: any) => {
    setStartText(place.properties.formatted);
    setStartSuggestions([]);
    const { lat, lon } = place.properties;
    mapRef.current?.flyTo({ center: [lon, lat], zoom: 14 }); // <-- Only here
    mapRef.current?.addStartMarker(lon, lat);
  };

  // Selecting destination (NO flyTo here)
  const handleDestinationSelect = (place: any) => {
    setDestinationText(place.properties.formatted);
    setDestinationSuggestions([]);
    // Do NOT fly to destination
  };

  // Keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setStartHighlightedIndex((prev) =>
        Math.min(prev + 1, startSuggestions.length - 1)
      );
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setStartHighlightedIndex((prev) => Math.max(prev - 1, 0));
    } else if (e.key === "Enter" && startHighlightedIndex >= 0) {
      handleSuggestionSelect(startSuggestions[startHighlightedIndex]);
    }
  };

  const handleDestinationKeyDown = (
    e: React.KeyboardEvent<HTMLInputElement>
  ) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setDestinationHighlightedIndex((prev) =>
        Math.min(prev + 1, destinationSuggestions.length - 1)
      );
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setDestinationHighlightedIndex((prev) => Math.max(prev - 1, 0));
    } else if (e.key === "Enter" && destinationHighlightedIndex >= 0) {
      handleDestinationSelect(
        destinationSuggestions[destinationHighlightedIndex]
      );
    }
  };

  // Scroll into view for highlighted items
  useEffect(() => {
    const container = startSuggestionsRef.current;
    const item = container?.children[startHighlightedIndex] as HTMLElement;
    if (item && container) {
      item.scrollIntoView({ block: "nearest" });
    }
  }, [startHighlightedIndex]);

  useEffect(() => {
    const container = destinationSuggestionsRef.current;
    const item = container?.children[
      destinationHighlightedIndex
    ] as HTMLElement;
    if (item && container) {
      item.scrollIntoView({ block: "nearest" });
    }
  }, [destinationHighlightedIndex]);

  return (
    <div className="w-96 bg-[#2E2E2E] rounded-xl shadow-md p-4 text-[#C7C7C7] flex flex-col">
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
          {/* Starting Point */}
          <div className="relative" ref={startContainerRef}>
            <div className="bg-[#5A5A5A] h-[48px] flex items-center gap-3 px-4 rounded-xl shadow-md">
              <MapPin width={25} height={25} color="#FF9494" />
              <input
                ref={startRef}
                type="text"
                placeholder="Enter starting point..."
                value={startText}
                onChange={(e) => setStartText(e.target.value)}
                onKeyDown={handleKeyDown}
                className="bg-transparent outline-none text-md text-[#C7C7C7] placeholder-[#999] w-full h-full"
              />
            </div>
            {startSuggestions.length > 0 && (
              <ul
                ref={startSuggestionsRef}
                className="scrollbar-rounded absolute top-full left-0 right-0 mt-2 bg-[#ffffff] rounded-xl shadow-lg max-h-60 overflow-y-auto z-50"
              >
                {startSuggestions.map((place, index) => (
                  <li
                    key={index}
                    onClick={() => handleSuggestionSelect(place)}
                    className={`px-4 py-3 text-base cursor-pointer ${
                      startHighlightedIndex === index
                        ? "bg-[#5A5A5A] text-[#C7C7C7]"
                        : "text-[#2E2E2E] hover:bg-[#5A5A5A] hover:text-[#C7C7C7]"
                    }`}
                  >
                    {place.properties.formatted}
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* Destination */}
          <div className="relative" ref={destinationContainerRef}>
            <div className="bg-[#5A5A5A] h-[48px] flex items-center gap-3 px-4 rounded-xl shadow-md">
              <MapPin width={25} height={25} color="#75F7A9" />
              <input
                ref={destinationRef}
                type="text"
                placeholder="Enter destination..."
                value={destinationText}
                onChange={(e) => setDestinationText(e.target.value)}
                onKeyDown={handleDestinationKeyDown}
                className="bg-transparent outline-none text-md text-[#C7C7C7] placeholder-[#999] w-full h-full"
              />
            </div>
            {destinationSuggestions.length > 0 && (
              <ul
                ref={destinationSuggestionsRef}
                className="scrollbar-rounded absolute top-full left-0 right-0 mt-2 bg-[#ffffff] rounded-xl shadow-lg max-h-60 overflow-y-auto z-50"
              >
                {destinationSuggestions.map((place, index) => (
                  <li
                    key={index}
                    onClick={() => handleDestinationSelect(place)}
                    className={`px-4 py-3 text-base cursor-pointer ${
                      destinationHighlightedIndex === index
                        ? "bg-[#5A5A5A] text-[#C7C7C7]"
                        : "text-[#2E2E2E] hover:bg-[#5A5A5A] hover:text-[#C7C7C7]"
                    }`}
                  >
                    {place.properties.formatted}
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* Transport Modes */}
          <div className="flex justify-between items-center">
            <button className="p-3 rounded-lg hover:bg-[#3A3A3A] transition">
              <Route size={28} />
            </button>
            <button className="p-3 rounded-lg hover:bg-[#3A3A3A] transition">
              <Car size={28} />
            </button>
            <button className="p-3 rounded-lg hover:bg-[#3A3A3A] transition">
              <TwoWheelerIcon style={{ fontSize: 28, color: "#C7C7C7" }} />
            </button>
            <button className="p-3 rounded-lg hover:bg-[#3A3A3A] transition">
              <Bike size={28} />
            </button>
            <button className="p-3 rounded-lg hover:bg-[#3A3A3A] transition">
              <Footprints size={28} />
            </button>
          </div>
        </div>
      </Tabs>
    </div>
  );
}
