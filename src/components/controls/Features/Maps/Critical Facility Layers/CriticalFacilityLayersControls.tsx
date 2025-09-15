"use client";
import { useState, useRef } from "react";
import {
  ChevronDown,
  LandPlot,
  BriefcaseMedical,
  ShoppingCart,
  BusFront,
  Siren,
} from "lucide-react";
import { healthFacilities } from "./HealthFacilities";

interface CriticalFacilityMapControlsProps {
  mapRef: React.RefObject<any>;
}

function TransparentButton({
  label,
  icon,
}: {
  label: string;
  icon?: React.ReactNode;
}) {
  return (
    <button className="flex justify-between items-center w-full bg-transparent text-white px-2 py-2 rounded hover:bg-[#3a3a3a] transition">
      <div className="flex items-center gap-2">
        {icon}
        <span className="text-base font-medium">{label}</span>
      </div>
      <ChevronDown size={18} className="text-white" />
    </button>
  );
}

export default function CriticalFacilityMapControls({
  mapRef,
}: CriticalFacilityMapControlsProps) {
  const [medicalExpanded, setMedicalExpanded] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [selectedCountry, setSelectedCountry] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const listRef = useRef<HTMLUListElement>(null);
  const [hasScrollbar, setHasScrollbar] = useState(false);

  const countries = [
    "Afghanistan",
    "Angola",
    "Albania",
    "Andorra",
    "Argentina",
    "Armenia",
    "Austria",
    "Azerbaijan",
    "Benin",
    "Bangladesh",
    "Bahrain",
    "Canada",
    "Chile",
    "China",
    "Cameroon",
    "Congo",
  ];

  return (
    <>
      <TransparentButton
        label="Active Evacuation Area"
        icon={<LandPlot size={20} />}
      />

      {/* Medical / Health */}
      <button
        onClick={() => setMedicalExpanded((prev) => !prev)}
        className="flex justify-between items-center w-full bg-transparent text-white px-2 py-2 rounded hover:bg-[#3a3a3a] transition"
      >
        <div className="flex items-center gap-2">
          <BriefcaseMedical size={20} />
          <span className="text-base font-medium">Medical / Health</span>
        </div>
        <ChevronDown
          size={18}
          className={`text-white transition-transform duration-200 ${
            medicalExpanded ? "rotate-180" : ""
          }`}
        />
      </button>

      {medicalExpanded && (
        <div className="pl-8 pr-6 pt-2 pb-2 space-y-2 w-full">
          <div className="relative w-full">
            <button
              onClick={() => setDropdownOpen((prev) => !prev)}
              className="flex justify-between items-center w-full bg-[#3a3a3a] text-white p-2 px-3 rounded-md"
            >
              <span>{selectedCountry || "Select a Country"}</span>
              <ChevronDown
                size={16}
                className={`ml-2 transition-transform duration-200 ${
                  dropdownOpen ? "rotate-180" : ""
                }`}
              />
            </button>

            {dropdownOpen && (
              <div className="absolute left-0 right-0 z-10 mt-1 bg-[#3a3a3a] rounded-md shadow-lg">
                {/* Search Box */}
                <div className="p-2">
                  <input
                    type="text"
                    placeholder="Search country..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full p-2 rounded-md text-white outline-none focus:ring-0 focus:outline-none hover:outline-none"
                  />
                </div>

                {/* Filtered country list */}
                <ul ref={listRef} className="max-h-35 overflow-y-auto">
                  {countries
                    .filter((c) =>
                      c.toLowerCase().includes(searchTerm.toLowerCase())
                    )
                    .map((country, index, arr) => (
                      <li
                        key={index}
                        onClick={async () => {
                          setSelectedCountry(country);
                          setDropdownOpen(false);
                          setSearchTerm("");
                          const config = healthFacilities[country];
                          if (config && mapRef.current) {
                            mapRef.current.flyTo({
                              center: config.center,
                              zoom: config.zoom,
                              essential: true,
                            });
                            try {
                              const res = await fetch(config.geojsonUrl);
                              const data = await res.json();
                              mapRef.current.drawHealthFacilities?.(data);
                            } catch (err) {
                              console.error(
                                "Failed to fetch health facilities for",
                                country,
                                err
                              );
                            }
                          }
                        }}
                        className={`px-3 py-2 hover:bg-[#505050] cursor-pointer
                          ${index === arr.length - 1 ? "rounded-bl-md" : ""}
                          ${
                            index === arr.length - 1 && !hasScrollbar
                              ? "rounded-br-md"
                              : ""
                          }`}
                      >
                        {country}
                      </li>
                    ))}
                </ul>
              </div>
            )}
          </div>

          {/* Clear Map button */}
          <button
            onClick={() => {
              if (!selectedCountry) return; // do nothing if disabled
              mapRef.current?.clearHealthFacilities?.();
              setSelectedCountry(""); // reset dropdown label
            }}
            disabled={!selectedCountry}
            className={`w-full py-2 rounded-md mt-2
              ${
                selectedCountry
                  ? "bg-[#5A5C99] text-white hover:opacity-90 shadow-md"
                  : "bg-[#4c4c4c] text-[#a1a1a1] cursor-not-allowed"
              }`}
          >
            Clear Map
          </button>
        </div>
      )}

      <TransparentButton
        label="Supply Hub / Store"
        icon={<ShoppingCart size={20} />}
      />

      <TransparentButton
        label="Public Transport"
        icon={<BusFront size={20} />}
      />

      <TransparentButton
        label="Command & Response"
        icon={<Siren size={20} />}
      />
    </>
  );
}
