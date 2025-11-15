"use client";

import { forwardRef } from "react";
import { Search } from "lucide-react";

interface LocationSearchBarProps {
  searchText: string;
  setSearchText: (text: string) => void;
  suggestions: any[];
  highlightedIndex: number;
  handleKeyDown: (e: React.KeyboardEvent<HTMLInputElement>) => void;
  handleSuggestionSelect: (place: any) => void;
  searchContainerRef: React.RefObject<HTMLDivElement | null>;
  inputRef: React.RefObject<HTMLInputElement | null>;
  suggestionsRef: React.RefObject<HTMLUListElement | null>;
}

const LocationSearchBar = forwardRef<HTMLDivElement, LocationSearchBarProps>(
  (
    {
      searchText,
      setSearchText,
      suggestions,
      highlightedIndex,
      handleKeyDown,
      handleSuggestionSelect,
      searchContainerRef,
      inputRef,
      suggestionsRef,
    },
    ref
  ) => {
    return (
      <div
        ref={searchContainerRef}
        className="absolute top-[15px] left-[70px] z-50 w-[280px]"
      >
        <div className="bg-[#2E2E2E] h-[40px] flex items-center gap-2 px-2.5 rounded-md shadow-md text-[#C7C7C7]">
          <Search width={15} height={15} className="flex-shrink-0" />
          <input
            ref={inputRef}
            type="text"
            placeholder="Enter location..."
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            onKeyDown={handleKeyDown}
            className="bg-transparent outline-none text-[11px] leading-[40px] text-[#C7C7C7] placeholder-[#999] w-full"
          />
        </div>

        {suggestions.length > 0 && (
          <ul
            ref={suggestionsRef}
            className="scrollbar-rounded absolute top-full left-0 mt-1 w-full bg-[#2E2E2E] rounded-md shadow-lg max-h-40 overflow-y-auto z-50"
          >
            {suggestions.map((place, index) => (
              <li
                key={index}
                onClick={() => handleSuggestionSelect(place)}
                className={`px-2.5 py-1.5 text-[11px] cursor-pointer ${
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
    );
  }
);

LocationSearchBar.displayName = "LocationSearchBar";
export default LocationSearchBar;
