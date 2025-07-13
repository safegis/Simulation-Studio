"use client";

import {
  Earth,
  MapPinned,
  ListTodo,
  OctagonAlert,
  Search,
  ZoomIn,
  ZoomOut,
  Square,
  Box,
} from "lucide-react";
import MapComponent from "./Map";
import { useEffect, useRef, useState } from "react";

export default function MainUILayout() {
  const [searchText, setSearchText] = useState("");
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [highlightedIndex, setHighlightedIndex] = useState<number>(-1);
  const [isDesktop, setIsDesktop] = useState(true);
  const [viewMode, setViewMode] = useState<"2d" | "3d">("2d");
  const mapRef = useRef<any>(null);
  const searchContainerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const suggestionsRef = useRef<HTMLUListElement>(null);

  useEffect(() => {
    const checkSize = () => setIsDesktop(window.innerWidth >= 768);
    checkSize();
    window.addEventListener("resize", checkSize);
    return () => window.removeEventListener("resize", checkSize);
  }, []);

  useEffect(() => {
    if (!searchText.trim()) {
      setSuggestions([]);
      return;
    }

    const delayDebounce = setTimeout(async () => {
      const url = `https://api.geoapify.com/v1/geocode/autocomplete?text=${encodeURIComponent(
        searchText
      )}&apiKey=${process.env.NEXT_PUBLIC_GEOAPIFY_API_KEY}`;
      const res = await fetch(url);
      const data = await res.json();
      setSuggestions(data.features || []);
      setHighlightedIndex(-1);
    }, 300);

    return () => clearTimeout(delayDebounce);
  }, [searchText]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        searchContainerRef.current &&
        !searchContainerRef.current.contains(event.target as Node)
      ) {
        setSuggestions([]);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSuggestionSelect = (place: any) => {
    setSearchText(place.properties.formatted);
    setSuggestions([]);
    const { lat, lon } = place.properties;
    mapRef.current?.flyTo({ center: [lon, lat], zoom: 14 });
  };

  const handleZoom = (increment: number) => {
    const currentZoom = mapRef.current?.getZoom();
    mapRef.current?.flyTo({ zoom: currentZoom + increment });
  };

  const switchTo2D = () => {
    mapRef.current?.switchTo2D?.();
    setViewMode("2d");
  };

  const switchTo3D = () => {
    mapRef.current?.switchTo3D?.();
    setViewMode("3d");
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setHighlightedIndex((prev) => Math.min(prev + 1, suggestions.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setHighlightedIndex((prev) => Math.max(prev - 1, 0));
    } else if (e.key === "Enter" && highlightedIndex >= 0) {
      handleSuggestionSelect(suggestions[highlightedIndex]);
    }
  };

  useEffect(() => {
    const container = suggestionsRef.current;
    const item = container?.children[highlightedIndex] as HTMLElement;
    if (item && container) {
      item.scrollIntoView({ block: "nearest" });
    }
  }, [highlightedIndex]);

  if (!isDesktop) {
    return (
      <div className="flex items-center justify-center w-screen h-screen bg-[#1a1a1a] text-white text-center px-4">
        <div className="max-w-sm text-lg">
          🚫 This app is best viewed on a desktop or laptop.
          <br />
          Please switch to a larger screen for the best experience.
        </div>
      </div>
    );
  }

  return (
    <div className="relative w-screen h-screen">
      <MapComponent ref={mapRef} />

      {/* Left Menu */}
      <div className="absolute top-1/2 left-[18px] -translate-y-1/2 z-50 flex flex-col gap-4 bg-[#2E2E2E] p-2 rounded-xl shadow-md w-[60px]">
        {[Earth, MapPinned, ListTodo, OctagonAlert].map((Icon, i) => (
          <button
            key={i}
            className="hover:bg-[#3a3a3a] text-[#C7C7C7] p-2 rounded-lg transition"
          >
            <Icon width={28} height={28} />
          </button>
        ))}
      </div>

      {/* Search Bar */}
      <div
        ref={searchContainerRef}
        className="absolute top-[18px] left-[90px] z-50 w-96"
      >
        <div className="bg-[#2E2E2E] h-[55px] flex items-center gap-3 px-4 py-2 rounded-xl shadow-md text-[#C7C7C7]">
          <Search width={26} height={26} />
          <input
            ref={inputRef}
            type="text"
            placeholder="Enter location..."
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            onKeyDown={handleKeyDown}
            className="bg-transparent outline-none text-lg text-[#C7C7C7] placeholder-[#999] w-full"
          />
        </div>

        {suggestions.length > 0 && (
          <ul
            ref={suggestionsRef}
            className="scrollbar-rounded absolute top-full left-0 mt-2 w-full bg-[#2E2E2E] rounded-xl shadow-lg max-h-60 overflow-y-auto z-50"
          >
            {suggestions.map((place, index) => (
              <li
                key={index}
                onClick={() => handleSuggestionSelect(place)}
                className={`px-4 py-3 text-base cursor-pointer ${
                  highlightedIndex === index
                    ? "bg-[#3a3a3a] text-[#C7C7C7]"
                    : "text-[#C7C7C7] hover:bg-[#3a3a3a]"
                }`}
              >
                {place.properties.formatted}
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Right Controls: 2D/3D + Zoom */}
      <div className="absolute right-[18px] top-1/2 -translate-y-1/2 z-50 flex flex-col items-center gap-[15px]">
        {/* 2D/3D Switch */}
        <div className="relative bg-[#2E2E2E] p-2 rounded-xl shadow-md w-[60px] h-[112px] overflow-hidden">
          <div
            className="absolute w-[44px] h-[44px] left-2 rounded-lg bg-gradient-to-b from-[#9699FF] to-white transition-all duration-300 ease-in-out"
            style={{ top: viewMode === "2d" ? "8px" : "60px" }}
          />
          <div className="relative z-10 flex flex-col gap-2 items-center">
            <button
              onClick={switchTo2D}
              className={`w-[44px] h-[44px] flex items-center justify-center rounded-lg transition-colors duration-300 ${
                viewMode === "2d" ? "text-[#2E2E2E]" : "text-[#C7C7C7]"
              }`}
            >
              <Square width={26} height={26} />
            </button>
            <button
              onClick={switchTo3D}
              className={`w-[44px] h-[44px] flex items-center justify-center rounded-lg transition-colors duration-300 ${
                viewMode === "3d" ? "text-[#2E2E2E]" : "text-[#C7C7C7]"
              }`}
            >
              <Box width={26} height={26} />
            </button>
          </div>
        </div>

        {/* Zoom Controls */}
        <div className="bg-[#2E2E2E] p-2 rounded-xl shadow-md w-[60px] flex flex-col gap-2">
          <button
            onClick={() => handleZoom(1)}
            className="hover:bg-[#3a3a3a] text-[#C7C7C7] p-2 rounded-lg transition"
          >
            <ZoomIn width={28} height={28} />
          </button>
          <button
            onClick={() => handleZoom(-1)}
            className="hover:bg-[#3a3a3a] text-[#C7C7C7] p-2 rounded-lg transition"
          >
            <ZoomOut width={28} height={28} />
          </button>
        </div>
      </div>

      {/* SafeGIS AI Logo Button */}
      <button
        className="absolute bottom-[18px] right-[18px] w-18 h-18 rounded-[15px] z-50 shadow-md flex items-center justify-center"
        style={{ background: "linear-gradient(to bottom, #5A5C99, #232323)" }}
      >
        <img
          src="/Images/Button-Images/SafeGIS-AI-Logo.png"
          alt="SafeGIS AI Logo"
          className="w-12 h-12 -mt-[2.5px]"
        />
      </button>
    </div>
  );
}
