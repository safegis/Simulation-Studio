"use client";

import {
  Earth,
  MapPinned,
  ListTodo,
  OctagonAlert,
  Search,
  ZoomIn,
  ZoomOut,
} from "lucide-react";
import MapComponent from "./Map";
import { useEffect, useRef, useState } from "react";

export default function MainUILayout() {
  const [searchText, setSearchText] = useState("");
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [isDesktop, setIsDesktop] = useState(true);
  const mapRef = useRef<any>(null);
  const searchContainerRef = useRef<HTMLDivElement>(null);

  // Detect screen size
  useEffect(() => {
    const checkSize = () => {
      setIsDesktop(window.innerWidth >= 768);
    };

    checkSize();
    window.addEventListener("resize", checkSize);
    return () => window.removeEventListener("resize", checkSize);
  }, []);

  // Fetch Geoapify suggestions
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
    }, 300);

    return () => clearTimeout(delayDebounce);
  }, [searchText]);

  // Hide suggestions on outside click
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

  function handleSuggestionSelect(place: any) {
    setSearchText(place.properties.formatted);
    setSuggestions([]);

    const { lat, lon } = place.properties;
    if (mapRef.current) {
      mapRef.current.flyTo({ center: [lon, lat], zoom: 14 });
    }
  }

  function handleZoom(increment: number) {
    if (mapRef.current) {
      const currentZoom = mapRef.current.getZoom();
      mapRef.current.flyTo({ zoom: currentZoom + increment });
    }
  }

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

      {/* Vertical Icon Menu */}
      <div className="absolute top-1/2 left-[18px] -translate-y-1/2 z-50 flex flex-col gap-4 bg-[#2E2E2E] p-2 rounded-xl shadow-md w-[60px]">
        <button className="hover:bg-[#3a3a3a] text-[#C7C7C7] p-2 rounded-lg transition">
          <Earth width={28} height={28} />
        </button>
        <button className="hover:bg-[#3a3a3a] text-[#C7C7C7] p-2 rounded-lg transition">
          <MapPinned width={28} height={28} />
        </button>
        <button className="hover:bg-[#3a3a3a] text-[#C7C7C7] p-2 rounded-lg transition">
          <ListTodo width={28} height={28} />
        </button>
        <button className="hover:bg-[#3a3a3a] text-[#C7C7C7] p-2 rounded-lg transition">
          <OctagonAlert width={28} height={28} />
        </button>
      </div>

      {/* Search Bar */}
      <div
        ref={searchContainerRef}
        className="absolute top-[18px] left-[90px] z-50 w-96"
      >
        <div className="bg-[#2E2E2E] h-[55px] flex items-center gap-3 px-4 py-2 rounded-xl shadow-md text-[#C7C7C7]">
          <Search width={26} height={26} />
          <input
            type="text"
            placeholder="Enter location..."
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            className="bg-transparent outline-none text-lg text-[#C7C7C7] placeholder-[#999] w-full"
          />
        </div>

        {suggestions.length > 0 && (
          <ul className="absolute top-full left-0 mt-2 w-full bg-[#2E2E2E] rounded-xl shadow-lg max-h-60 overflow-y-auto z-50">
            {suggestions.map((place, index) => (
              <li
                key={index}
                onClick={() => handleSuggestionSelect(place)}
                className="px-4 py-3 text-base text-[#C7C7C7] hover:bg-[#3a3a3a] cursor-pointer"
              >
                {place.properties.formatted}
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Bottom Right Logo Button */}
      <button
        className="absolute bottom-[18px] right-[18px] w-18 h-18 rounded-[15px] z-50 shadow-md flex items-center justify-center"
        style={{
          background: "linear-gradient(to bottom, #5A5C99, #232323)",
        }}
      >
        <img
          src="/Images/Button-Images/SafeGIS-AI-Logo.png"
          alt="SafeGIS AI Logo"
          className="w-12 h-12 -mt-[2.5px]"
        />
      </button>

      {/* Zoom Controls - Right Side */}
      <div className="absolute top-1/2 right-[18px] -translate-y-1/2 z-50 flex flex-col gap-4 bg-[#2E2E2E] p-2 rounded-xl shadow-md w-[60px]">
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
  );
}
