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
  ChevronDown,
  Sunrise,
  Sun,
  Sunset,
  Moon,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";

import MapComponent from "./Map";
import SafeGISAIChat from "./SafeGIS-AI-Chat";
import SelectMaps from "./controls/Maps/SelectMaps";
import PathfinderControls from "./controls/Pathfinder/PathfinderControls";
import SelectPlanningTools from "./controls/Planning Suite/SelectPlanningTools";
import SyncIcon from "@mui/icons-material/Sync";

export default function MainUILayout() {
  const [searchText, setSearchText] = useState("");
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [highlightedIndex, setHighlightedIndex] = useState<number>(-1);
  const [isDesktop, setIsDesktop] = useState(true);
  const [viewMode, setViewMode] = useState<"2d" | "3d">("2d");
  const [showChat, setShowChat] = useState(false);
  const [showSelectMaps, setShowSelectMaps] = useState(false);
  const [showPathfinder, setShowPathfinder] = useState(false);
  const [showPlanningTools, setShowPlanningTools] = useState(false);
  const [currentTimeFormatted, setCurrentTimeFormatted] = useState("");
  const [showTimeOfDayDropdown, setShowTimeOfDayDropdown] = useState(false);
  const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;

  const mapRef = useRef<any>(null);
  const searchContainerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const suggestionsRef = useRef<HTMLUListElement>(null);
  const timeOfDayRef = useRef<HTMLDivElement>(null); // <-- new ref

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

  useEffect(() => {
    function handleClickOutsideTimeDropdown(event: MouseEvent) {
      if (
        timeOfDayRef.current &&
        !timeOfDayRef.current.contains(event.target as Node)
      ) {
        setShowTimeOfDayDropdown(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutsideTimeDropdown);
    return () =>
      document.removeEventListener("mousedown", handleClickOutsideTimeDropdown);
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

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      const timeStr = now.toLocaleTimeString(undefined, {
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
        hour12: true,
      });
      const dayStr = now.toLocaleDateString(undefined, { weekday: "short" });
      const dateStr = now.toLocaleDateString(undefined, {
        month: "long",
        day: "numeric",
        year: "numeric",
      });
      setCurrentTimeFormatted(`${timeStr} - ${dayStr} | ${dateStr}`);
    };

    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  if (!isDesktop) {
    return (
      <div className="flex items-center justify-center w-screen h-screen bg-[#1a1a1a] text-white text-center px-4">
        <div className="max-w-sm text-lg">
          🚫 This app is best viewed on a desktop or laptop.
        </div>
      </div>
    );
  }

  return (
    <div className="relative w-screen h-screen overflow-hidden">
      <MapComponent ref={mapRef} />

      {/* Time of Day + Map Style */}
      <div className="absolute top-[18px] left-1/2 transform -translate-x-1/2 z-50">
        <div className="flex gap-[18px] relative">
          <div ref={timeOfDayRef} className="relative w-[170px]">
            <button
              onClick={() => setShowTimeOfDayDropdown((prev) => !prev)}
              className="h-[55px] w-full px-5 flex items-center justify-center gap-2 bg-[#2E2E2E] text-[#C7C7C7] rounded-xl shadow-md hover:bg-[#3a3a3a] transition text-base font-medium"
            >
              <span className="leading-none">Time of Day</span>
              <ChevronDown size={22} />
            </button>
            {showTimeOfDayDropdown && (
              <div className="absolute top-[60px] w-full bg-[#2E2E2E] rounded-xl shadow-md text-[#C7C7C7] p-3 z-50">
                {["Auto", "Morning", "Daytime", "Evening", "Nighttime"].map(
                  (label, idx) => (
                    <div
                      key={idx}
                      className="hover:bg-[#3a3a3a] p-2 rounded-md cursor-pointer flex items-center gap-2"
                    >
                      {label === "Morning" ? (
                        <Sunrise size={18} color="#C7C7C7" />
                      ) : label === "Daytime" ? (
                        <Sun size={18} color="#C7C7C7" />
                      ) : label === "Evening" ? (
                        <Sunset size={18} color="#C7C7C7" />
                      ) : label === "Nighttime" ? (
                        <Moon size={18} color="#C7C7C7" />
                      ) : (
                        <SyncIcon
                          fontSize="small"
                          style={{ color: "#C7C7C7" }}
                        />
                      )}
                      {label}
                    </div>
                  )
                )}
              </div>
            )}
          </div>

          <button className="h-[55px] px-5 flex items-center justify-center gap-2 bg-[#2E2E2E] text-[#C7C7C7] rounded-xl shadow-md hover:bg-[#3a3a3a] transition text-base font-medium">
            <span className="leading-none">Map Style</span>
            <ChevronDown size={22} />
          </button>
        </div>
      </div>

      {/* Left Menu */}
      <div className="absolute top-1/2 left-[18px] -translate-y-1/2 z-50 flex flex-col gap-4 bg-[#2E2E2E] p-2 rounded-xl shadow-md w-[60px]">
        <button
          onClick={() => {
            setShowSelectMaps((prev) => {
              const newState = !prev;
              if (newState) {
                setShowPathfinder(false);
                setShowPlanningTools(false);
              }
              return newState;
            });
          }}
          className={`p-2 rounded-lg transition ${
            showSelectMaps
              ? "bg-gradient-to-b from-[#9699FF] to-white text-[#2E2E2E] hover:opacity-90"
              : "hover:bg-[#3a3a3a] text-[#C7C7C7]"
          }`}
        >
          <Earth width={28} height={28} />
        </button>

        <button
          onClick={() => {
            setShowPathfinder((prev) => {
              const newState = !prev;
              if (newState) {
                setShowSelectMaps(false);
                setShowPlanningTools(false);
              }
              return newState;
            });
          }}
          className={`p-2 rounded-lg transition ${
            showPathfinder
              ? "bg-gradient-to-b from-[#9699FF] to-white text-[#2E2E2E] hover:opacity-90"
              : "hover:bg-[#3a3a3a] text-[#C7C7C7]"
          }`}
        >
          <MapPinned width={28} height={28} />
        </button>

        <button
          onClick={() => {
            setShowPlanningTools((prev) => {
              const newState = !prev;
              if (newState) {
                setShowSelectMaps(false);
                setShowPathfinder(false);
              }
              return newState;
            });
          }}
          className={`p-2 rounded-lg transition ${
            showPlanningTools
              ? "bg-gradient-to-b from-[#9699FF] to-white text-[#2E2E2E] hover:opacity-90"
              : "hover:bg-[#3a3a3a] text-[#C7C7C7]"
          }`}
        >
          <ListTodo width={28} height={28} />
        </button>

        <button className="hover:bg-[#3a3a3a] text-[#C7C7C7] p-2 rounded-lg transition">
          <OctagonAlert width={28} height={28} />
        </button>
      </div>

      {/* Search or Pathfinder */}
      {!showPathfinder ? (
        <div
          ref={searchContainerRef}
          className="absolute top-[18px] left-[96px] z-50 w-96"
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
              className="bg-transparent outline-none text-md text-[#C7C7C7] placeholder-[#999] w-full"
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
      ) : (
        <div className="absolute top-[18px] left-[96px] z-50">
          <PathfinderControls />
        </div>
      )}

      {/* Panels */}
      {showSelectMaps && (
        <div className="absolute left-[96px] top-[73px] w-96 z-40">
          <SelectMaps isVisible={true} />
        </div>
      )}
      {showPlanningTools && (
        <div className="absolute left-[96px] top-[73px] w-96 z-40">
          <SelectPlanningTools isVisible={true} />
        </div>
      )}

      {/* Right Side Controls */}
      <div className="absolute right-[18px] top-1/2 -translate-y-1/2 z-50 flex flex-col items-center gap-[18px]">
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

        <div className="bg-[#2E2E2E] p-2 rounded-xl shadow-md w-[60px] flex justify-center">
          <button className="w-[44px] h-[44px] text-[#C7C7C7] text-[27px] font-semibold flex items-center justify-center hover:bg-[#3a3a3a] rounded-lg transition">
            ?
          </button>
        </div>
      </div>

      <SafeGISAIChat isVisible={showChat} />

      <button
        onClick={() => setShowChat((prev) => !prev)}
        className="absolute bottom-[18px] right-[18px] w-18 h-18 rounded-[15px] z-50 shadow-md flex items-center justify-center transition-all duration-300"
        style={{
          background: showChat
            ? "linear-gradient(to bottom, #6B6DCC, #2E2E2E)"
            : "linear-gradient(to bottom, #5A5C99, #232323)",
        }}
      >
        <img
          src="/Images/SafeGIS-AI-Logo.png"
          alt="SafeGIS AI Logo"
          className="w-12 h-12 -mt-[2.5px]"
        />
      </button>

      <div className="absolute bottom-[18px] left-1/2 transform -translate-x-1/2 z-50">
        <div
          className="w-[470px] h-[73px] px-5 py-3 text-[#ffffff] flex flex-col items-center justify-center text-center"
          style={{
            background:
              "radial-gradient(circle, rgba(46,46,46,0.95) 0%, rgba(46,46,46,0.85) 30%, rgba(46,46,46,0.6) 55%, rgba(46,46,46,0.15) 88%, rgba(46,46,46,0.01) 100%)",
          }}
        >
          <div className="text-[17px] font-medium tracking-wide">
            {currentTimeFormatted}
          </div>
          <div className="text-[14px] mt-1 font-[600] bg-gradient-to-r from-[#9699FF] to-[#FFFFFF] bg-clip-text text-transparent">
            ({timeZone})
          </div>
        </div>
      </div>
    </div>
  );
}
