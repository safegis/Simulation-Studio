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
    );
  }
);

LocationSearchBar.displayName = "LocationSearchBar";
export default LocationSearchBar;
