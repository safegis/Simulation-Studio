// \SafeGIS\Simulation-Studio\frontend\src\components\controls\Features\Maps\Critical Facility Layers\CriticalFacilityLayersControls.tsx
"use client";
import { useState, useRef } from "react";
import { createPortal } from "react-dom";
import {
  ChevronDown,
  LandPlot,
  BriefcaseMedical,
  ShoppingCart,
  BusFront,
  Siren,
} from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { healthFacilities } from "./HealthFacilities";
import { emergencyShelters } from "./Emergency Shelters/ByCountry";
import { FireStationsByCountry } from "./Fire Stations/ByCountry";
import { USFireStationsByState } from "./Fire Stations/ByState";
import { PoliceStationsByCountry } from "./Police Stations/ByCountry";

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
        <span className="text-[10px] font-medium">{label}</span>
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
  const [commandResponseExpanded, setCommandResponseExpanded] = useState(false);

  // Emergency Shelters state variables
  const [emergencySheltersExpanded, setEmergencySheltersExpanded] =
    useState(false);
  const [shelterCoverageOpen, setShelterCoverageOpen] = useState(false);
  const [selectedShelterCoverage, setSelectedShelterCoverage] = useState("");
  const shelterCoverageButtonRef = useRef<HTMLButtonElement>(null);
  const [shelterCountryOpen, setShelterCountryOpen] = useState(false);
  const [selectedShelterCountry, setSelectedShelterCountry] = useState("");
  const [shelterCountrySearchTerm, setShelterCountrySearchTerm] = useState("");

  const [commandResponseCheckedItems, setCommandResponseCheckedItems] =
    useState<string[]>([]);

  const [fireStationCoverageOpen, setFireStationCoverageOpen] = useState(false);
  const [selectedFireCoverage, setSelectedFireCoverage] = useState("");
  const fireStationButtonRef = useRef<HTMLButtonElement>(null);
  const [fireStationCountryOpen, setFireStationCountryOpen] = useState(false);
  const [selectedFireStationCountry, setSelectedFireStationCountry] =
    useState("");
  const fireStationCountryButtonRef = useRef<HTMLButtonElement>(null);
  const [fireStationCountrySearchTerm, setFireStationCountrySearchTerm] =
    useState("");
  const [fireStationScopeOpen, setFireStationScopeOpen] = useState(false);
  const [selectedFireStationScope, setSelectedFireStationScope] = useState("");
  const fireStationScopeButtonRef = useRef<HTMLButtonElement>(null);
  const [fireStationStateOpen, setFireStationStateOpen] = useState(false);
  const [selectedFireStationState, setSelectedFireStationState] = useState("");
  const fireStationStateButtonRef = useRef<HTMLButtonElement>(null);
  const [fireStationStateSearchTerm, setFireStationStateSearchTerm] =
    useState("");
  const [fireStationDivisionTypeOpen, setFireStationDivisionTypeOpen] =
    useState(false);
  const [selectedFireStationDivisionType, setSelectedFireStationDivisionType] =
    useState("");
  const fireStationDivisionTypeButtonRef = useRef<HTMLButtonElement>(null);

  // Police Station state variables
  const [policeStationCoverageOpen, setPoliceStationCoverageOpen] =
    useState(false);
  const [selectedPoliceCoverage, setSelectedPoliceCoverage] = useState("");
  const policeStationButtonRef = useRef<HTMLButtonElement>(null);
  const [policeStationCountryOpen, setPoliceStationCountryOpen] =
    useState(false);
  const [selectedPoliceStationCountry, setSelectedPoliceStationCountry] =
    useState("");
  const policeStationCountryButtonRef = useRef<HTMLButtonElement>(null);
  const [policeStationCountrySearchTerm, setPoliceStationCountrySearchTerm] =
    useState("");
  const [policeStationScopeOpen, setPoliceStationScopeOpen] = useState(false);
  const [selectedPoliceStationScope, setSelectedPoliceStationScope] =
    useState("");
  const policeStationScopeButtonRef = useRef<HTMLButtonElement>(null);
  const [policeStationStateOpen, setPoliceStationStateOpen] = useState(false);
  const [selectedPoliceStationState, setSelectedPoliceStationState] =
    useState("");
  const policeStationStateButtonRef = useRef<HTMLButtonElement>(null);
  const [policeStationStateSearchTerm, setPoliceStationStateSearchTerm] =
    useState("");
  const [policeStationDivisionTypeOpen, setPoliceStationDivisionTypeOpen] =
    useState(false);
  const [
    selectedPoliceStationDivisionType,
    setSelectedPoliceStationDivisionType,
  ] = useState("");
  const policeStationDivisionTypeButtonRef = useRef<HTMLButtonElement>(null);

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

  const shelterCountries = [
    "Andorra",
    "Angola",
    "Argentina",
    "Australia",
    "Barbados",
    "Belize",
    "Bolivia",
    "Botswana",
    "Burkina Faso",
    "Burundi",
    "Cabo Verde",
    "Cayman Islands",
    "Chile",
    "Colombia",
    "Costa Rica",
    "Cuba",
    "Dominica",
    "Ecuador",
    "El Salvador",
    "Gabon",
    "Ghana",
    "Gibraltar",
    "Grenada",
    "Guadeloupe",
    "Guam",
    "Guatemala",
    "Guernsey",
    "Guyana",
    "Honduras",
    "India",
    "Isle of Man",
    "Jamaica",
    "Jersey",
    "Kenya",
    "Lesotho",
    "Liberia",
    "Liechtenstein",
    "Malawi",
    "Malaysia",
    "Mali",
    "Malta",
    "Martinique",
    "Mayotte",
    "Micronesia",
    "Moldova",
    "Monaco",
    "Montserrat",
    "Namibia",
    "Nicaragua",
    "Niger",
    "Nigeria",
    "Northern Mariana Islands",
    "Philippines",
    "Portugal",
    "Puerto Rico",
    "Rwanda",
    "Saint Kitts and Nevis",
    "Saint Lucia",
    "Saint Vincent and the Grenadines",
    "San Marino",
    "Sierra Leone",
    "Singapore",
    "Solomon Islands",
    "South Africa",
    "Sri Lanka",
    "Suriname",
    "Tanzania",
    "Timor-Leste",
    "Togo",
    "Trinidad and Tobago",
    "Turks and Caicos Islands",
    "Uganda",
    "Uruguay",
    "Venuzuela",
    "Zambia",
    "Zimbabwe",
  ];

  const commandResponseItems = ["Fire Stations", "Police Stations"];

  const fireStationCoverageOptions = [
    "By country",
    "By administrative division",
  ];

  const fireStationCountryOptions = [
    "Angola",
    "Argentina",
    "Australia",
    "Barbados",
    "Belize",
    "Bolivia",
    "Botswana",
    "Burkina Faso",
    "Cabo Verde",
    "Canada",
    "Chile",
    "Colombia",
    "Cuba",
    "Dominica",
    "Ecuador",
    "El Salvador",
    "France",
    "Gabon",
    "Ghana",
    "Grenada",
    "Guadeloupe",
    "Guam",
    "Guatemala",
    "Guyana",
    "Honduras",
    "India",
    "Indonesia",
    "Ireland",
    "Jamaica",
    "Kenya",
    "Lesotho",
    "Liberia",
    "Liechtenstein",
    "Luxembourg",
    "Malaysia",
    "Mali",
    "Malta",
    "Martinique",
    "Mayotte",
    "Moldova",
    "Monaco",
    "Montenegro",
    "Namibia",
    "Nicaragua",
    "Niger",
    "Nigeria",
    "Norfolk Island",
    "Philippines",
    "Portugal",
    "Sierra Leone",
    "Singapore",
    "South Africa",
    "Sri Lanka",
    "Suriname",
    "Tanzania",
    "Timor-Leste",
    "Togo",
    "Tonga",
    "Tuvalu",
    "Uganda",
    "United Kingdom",
    "Uruguay",
    "Vanuatu",
    "Venezuela",
    "Zambia",
    "Zimbabwe",
  ];

  const fireStationScopeOptions = ["Philippines", "United States of America"];

  const fireStationStateOptions = [
    "Alabama",
    "Alaska",
    "Arizona",
    "Arkansas",
    "California",
    "Connecticut",
    "Delaware",
    "District of Columbia",
    "Florida",
    "Georgia",
    "Hawaii",
    "Idaho",
    "Illinois",
    "Indiana",
    "Iowa",
    "Kansas",
    "Kentucky",
    "Louisiana",
    "Maine",
    "Maryland",
    "Massachusetts",
    "Michigan",
    "Minnesota",
    "Mississippi",
    "Missouri",
    "Montana",
    "Nebraska",
    "Nevada",
    "New Hampshire",
    "New Jersey",
    "New Mexico",
    "New York",
    "North Carolina",
    "North Dakota",
    "Ohio",
    "Oklahoma",
    "Oregon",
    "Pennsylvania",
    "Rhode Island",
    "South Carolina",
    "South Dakota",
    "Tennessee",
    "Texas",
    "Utah",
    "Vermont",
    "Virginia",
    "Washington",
    "West Virginia",
    "Wisconsin",
    "Wyoming",
  ];

  const fireStationDivisionTypeOptions = [
    "By region",
    "By province",
    "By municipality / city",
  ];

  const policeStationCoverageOptions = [
    "By country",
    "By administrative division",
  ];

  const policeStationCountryOptions = [
    "Andorra",
    "Angola",
    "Anguilla",
    "Argentina",
    "Australia",
    "Barbados",
    "Belize",
    "Bermuda",
    "Bolivia",
    "Botswana",
    "British Virgin Islands",
    "Burkina Faso",
    "Burundi",
    "Cabo Verde",
    "Canada",
    "Cayman Islands",
    "Chile",
    "Congo",
    "Costa Rica",
    "Cuba",
    "Dominica",
    "Ecuador",
    "El Salvador",
    "Gabon",
    "Ghana",
    "Gibraltar",
    "Grenada",
    "Guadeloupe",
    "Guam",
    "Guatemala",
    "Guernsey",
    "Guyana",
    "Honduras",
    "Indonesia",
    "Jamaica",
    "Jersey",
    "Kenya",
    "Kiribati",
    "Lesotho",
    "Liberia",
    "Liechtenstein",
    "Malawi",
    "Malaysia",
    "Mali",
    "Malta",
    "Martinique",
    "Mayotte",
    "Micronesia",
    "Moldova",
    "Monaco",
    "Namibia",
    "Niger",
    "Nigeria",
    "Philippines",
    "Portugal",
    "Puerto Rico",
    "Rwanda",
    "Saint Lucia",
    "San Marino",
    "Sierra Leone",
    "Singapore",
    "Solomon Islands",
    "South Africa",
    "Sri Lanka",
    "Suriname",
    "Tanzania",
    "Timor-Leste",
    "Togo",
    "Tonga",
    "Trinidad and Tobago",
    "Tuvalu",
    "Uganda",
    "United Kingdom",
    "United States Virgin Islands",
    "Uruguay",
    "Vanuatu",
    "Venezuela",
    "Zambia",
    "Zimbabwe",
  ];

  const policeStationScopeOptions = ["Philippines", "United States of America"];

  const policeStationStateOptions = [
    "Alabama",
    "Alaska",
    // ... same array as fireStationStateOptions
  ];

  const policeStationDivisionTypeOptions = [
    "By region",
    "By province",
    "By municipality / city",
  ];

  const shelterCoverageOptions = ["By country", "By administrative division"];

  const toggleCommandResponseItem = (item: string) => {
    setCommandResponseCheckedItems((prev) =>
      prev.includes(item) ? prev.filter((i) => i !== item) : [...prev, item]
    );
  };

  return (
    <>
      <button
        onClick={() => setEmergencySheltersExpanded((prev) => !prev)}
        className="flex justify-between items-center w-full bg-transparent text-white px-2 py-2 rounded hover:bg-[#3a3a3a] transition"
      >
        <div className="flex items-center gap-2">
          <LandPlot size={20} />
          <span className="text-[10px] font-medium">Emergency Shelters</span>
        </div>
        <ChevronDown
          size={18}
          className={`text-white transition-transform duration-200 ${
            emergencySheltersExpanded ? "rotate-180" : ""
          }`}
        />
      </button>

      {emergencySheltersExpanded && (
        <div className="pl-8 pr-6 pt-2 pb-2 space-y-2 w-full">
          <div className="relative w-full">
            <button
              ref={shelterCoverageButtonRef}
              onClick={() => setShelterCoverageOpen((prev) => !prev)}
              className="flex justify-between items-center w-full bg-[#3a3a3a] text-white p-2 px-3 rounded-md"
            >
              <span>{selectedShelterCoverage || "Select Coverage"}</span>
              <ChevronDown
                size={16}
                className={`ml-2 transition-transform duration-200 ${
                  shelterCoverageOpen ? "rotate-180" : ""
                }`}
              />
            </button>
          </div>

          {/* Country Selection Dropdown - appears when "By country" is selected */}
          {selectedShelterCoverage === "By country" && (
            <>
              <div className="relative w-full">
                <button
                  onClick={() => setShelterCountryOpen((prev) => !prev)}
                  className="flex justify-between items-center w-full bg-[#3a3a3a] text-white p-2 px-3 rounded-md"
                >
                  <span>{selectedShelterCountry || "Select a Country"}</span>
                  <ChevronDown
                    size={16}
                    className={`ml-2 transition-transform duration-200 ${
                      shelterCountryOpen ? "rotate-180" : ""
                    }`}
                  />
                </button>

                {shelterCountryOpen && (
                  <div className="absolute left-0 right-0 z-10 mt-1 bg-[#3a3a3a] rounded-md shadow-lg">
                    {/* Search Box */}
                    <div className="p-2">
                      <input
                        type="text"
                        placeholder="Search country..."
                        value={shelterCountrySearchTerm}
                        onChange={(e) =>
                          setShelterCountrySearchTerm(e.target.value)
                        }
                        className="w-full p-2 rounded-md text-white outline-none focus:ring-0 focus:outline-none hover:outline-none"
                      />
                    </div>

                    {/* Filtered country list */}
                    <ul className="max-h-35 overflow-y-auto">
                      {shelterCountries
                        .filter((c) =>
                          c
                            .toLowerCase()
                            .includes(shelterCountrySearchTerm.toLowerCase())
                        )
                        .map((country, index, arr) => (
                          <li
                            key={index}
                            onClick={async () => {
                              setSelectedShelterCountry(country);
                              setShelterCountryOpen(false);
                              setShelterCountrySearchTerm("");
                              const config = emergencyShelters[country];
                              if (config && mapRef.current) {
                                mapRef.current.flyTo({
                                  center: config.center,
                                  zoom: config.zoom,
                                  essential: true,
                                });
                                try {
                                  const res = await fetch(config.geojsonUrl);
                                  const data = await res.json();
                                  mapRef.current.drawEmergencyShelters?.(data);
                                } catch (err) {
                                  console.error(
                                    "Failed to fetch emergency shelters for",
                                    country,
                                    err
                                  );
                                }
                              }
                            }}
                            className={`px-3 py-2 hover:bg-[#505050] cursor-pointer
                    ${index === arr.length - 1 ? "rounded-bl-md" : ""}
                    ${index === arr.length - 1 ? "rounded-br-md" : ""}`}
                          >
                            {country}
                          </li>
                        ))}
                    </ul>
                  </div>
                )}
              </div>

              {/* Clear Emergency Shelters button */}
              <button
                onClick={() => {
                  if (!selectedShelterCountry) return; // do nothing if disabled
                  mapRef.current?.clearEmergencyShelters?.();
                  setSelectedShelterCountry(""); // reset dropdown label
                }}
                disabled={!selectedShelterCountry}
                className={`w-full py-2 rounded-md mt-2
        ${
          selectedShelterCountry
            ? "bg-[#5A5C99] text-white hover:opacity-90 shadow-md"
            : "bg-[#4c4c4c] text-[#a1a1a1] cursor-not-allowed"
        }`}
              >
                Clear Emergency Shelters
              </button>
            </>
          )}
        </div>
      )}

      {/* Medical / Health */}
      <button
        onClick={() => setMedicalExpanded((prev) => !prev)}
        className="flex justify-between items-center w-full bg-transparent text-white px-2 py-2 rounded hover:bg-[#3a3a3a] transition"
      >
        <div className="flex items-center gap-2">
          <BriefcaseMedical size={20} />
          <span className="text-[10px] font-medium">Medical / Health</span>
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

      <button
        onClick={() => setCommandResponseExpanded((prev) => !prev)}
        className="flex justify-between items-center w-full bg-transparent text-white px-2 py-2 rounded hover:bg-[#3a3a3a] transition"
      >
        <div className="flex items-center gap-2">
          <Siren size={20} />
          <span className="text-[10px] font-medium">Command & Response</span>
        </div>
        <ChevronDown
          size={18}
          className={`text-white transition-transform duration-200 ${
            commandResponseExpanded ? "rotate-180" : ""
          }`}
        />
      </button>
      {commandResponseExpanded && (
        <div className="pl-7 pt-2 pb-2 space-y-2">
          {commandResponseItems.map((item) => (
            <div key={item} className="flex flex-col">
              <div className="flex items-center">
                <Checkbox
                  className="mr-3 w-[18px] h-[18px]"
                  checked={commandResponseCheckedItems.includes(item)}
                  onCheckedChange={() => toggleCommandResponseItem(item)}
                />
                <span className="text-[10px]">{item}</span>
              </div>
              {/* Fire Stations Coverage Dropdown */}
              {item === "Fire Stations" &&
                commandResponseCheckedItems.includes("Fire Stations") && (
                  <div className="ml-6.5 mt-3 mb-3 w-[260px] space-y-2">
                    <button
                      ref={fireStationButtonRef}
                      onClick={() =>
                        setFireStationCoverageOpen((prev) => !prev)
                      }
                      className="flex justify-between items-center w-full bg-[#3a3a3a] text-white p-2 px-3 rounded-md"
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        lineHeight: 1.2,
                        fontFamily: "inherit",
                      }}
                    >
                      <span
                        style={{
                          lineHeight: 1.2,
                          display: "flex",
                          alignItems: "center",
                        }}
                      >
                        {selectedFireCoverage || "Select Coverage"}
                      </span>
                      <ChevronDown
                        size={16}
                        className={`ml-2 transition-transform duration-200 ${
                          fireStationCoverageOpen ? "rotate-180" : ""
                        }`}
                        style={{ display: "flex", alignItems: "center" }}
                      />
                    </button>

                    {/* Country Selection Dropdown - appears when "By country" is selected */}
                    {selectedFireCoverage === "By country" && (
                      <>
                        <button
                          ref={fireStationCountryButtonRef}
                          onClick={() =>
                            setFireStationCountryOpen((prev) => !prev)
                          }
                          className="flex justify-between items-center w-full bg-[#3a3a3a] text-white p-2 px-3 rounded-md"
                          style={{
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "space-between",
                            lineHeight: 1.2,
                            fontFamily: "inherit",
                          }}
                        >
                          <span
                            style={{
                              lineHeight: 1.2,
                              display: "flex",
                              alignItems: "center",
                            }}
                          >
                            {selectedFireStationCountry || "Select Country"}
                          </span>
                          <ChevronDown
                            size={16}
                            className={`ml-2 transition-transform duration-200 ${
                              fireStationCountryOpen ? "rotate-180" : ""
                            }`}
                            style={{ display: "flex", alignItems: "center" }}
                          />
                        </button>

                        {/* Clear Fire Stations button - always visible when "By country" is selected */}
                        <button
                          onClick={() => {
                            if (!selectedFireStationCountry) return; // do nothing if disabled
                            mapRef.current?.clearFireStations?.();
                            setSelectedFireStationCountry("");
                          }}
                          disabled={!selectedFireStationCountry}
                          className={`w-full py-2 rounded-md mt-2
                          ${
                            selectedFireStationCountry
                              ? "bg-[#5A5C99] text-white hover:opacity-90 shadow-md"
                              : "bg-[#4c4c4c] text-[#a1a1a1] cursor-not-allowed"
                          }`}
                        >
                          Clear Fire Stations
                        </button>
                      </>
                    )}

                    {/* Administrative Division Section - appears when "By administrative division" is selected */}
                    {selectedFireCoverage === "By administrative division" && (
                      <div className="space-y-2">
                        <div className="text-white text-[10px] font-medium mt-4">
                          Define Scope:
                        </div>
                        <button
                          ref={fireStationScopeButtonRef}
                          onClick={() =>
                            setFireStationScopeOpen((prev) => !prev)
                          }
                          className="flex justify-between items-center w-full bg-[#3a3a3a] text-white p-2 px-3 rounded-md"
                          style={{
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "space-between",
                            lineHeight: 1.2,
                            fontFamily: "inherit",
                          }}
                        >
                          <span
                            style={{
                              lineHeight: 1.2,
                              display: "flex",
                              alignItems: "center",
                            }}
                          >
                            {selectedFireStationScope || "Select Country"}
                          </span>
                          <ChevronDown
                            size={16}
                            className={`ml-2 transition-transform duration-200 ${
                              fireStationScopeOpen ? "rotate-180" : ""
                            }`}
                            style={{ display: "flex", alignItems: "center" }}
                          />
                        </button>

                        {/* State Selection Dropdown - appears when "United States of America" is selected */}
                        {selectedFireStationScope ===
                          "United States of America" && (
                          <>
                            <button
                              ref={fireStationStateButtonRef}
                              onClick={() =>
                                setFireStationStateOpen((prev) => !prev)
                              }
                              className="flex justify-between items-center w-full bg-[#3a3a3a] text-white p-2 px-3 rounded-md"
                              style={{
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "space-between",
                                lineHeight: 1.2,
                                fontFamily: "inherit",
                              }}
                            >
                              <span
                                style={{
                                  lineHeight: 1.2,
                                  display: "flex",
                                  alignItems: "center",
                                }}
                              >
                                {selectedFireStationState || "Select State"}
                              </span>
                              <ChevronDown
                                size={16}
                                className={`ml-2 transition-transform duration-200 ${
                                  fireStationStateOpen ? "rotate-180" : ""
                                }`}
                                style={{
                                  display: "flex",
                                  alignItems: "center",
                                }}
                              />
                            </button>

                            {/* Clear Fire Stations button - always visible when "United States of America" is selected */}
                            <button
                              onClick={() => {
                                if (!selectedFireStationState) return; // do nothing if disabled
                                mapRef.current?.clearFireStations?.();
                                setSelectedFireStationState("");
                              }}
                              disabled={!selectedFireStationState}
                              className={`w-full py-2 rounded-md mt-2
                                ${
                                  selectedFireStationState
                                    ? "bg-[#5A5C99] text-white hover:opacity-90 shadow-md"
                                    : "bg-[#4c4c4c] text-[#a1a1a1] cursor-not-allowed"
                                }`}
                            >
                              Clear Fire Stations
                            </button>
                          </>
                        )}

                        {/* Division Type Selection Dropdown - appears when "Philippines" is selected */}
                        {selectedFireStationScope === "Philippines" && (
                          <button
                            ref={fireStationDivisionTypeButtonRef}
                            onClick={() =>
                              setFireStationDivisionTypeOpen((prev) => !prev)
                            }
                            className="flex justify-between items-center w-full bg-[#3a3a3a] text-white p-2 px-3 rounded-md"
                            style={{
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "space-between",
                              lineHeight: 1.2,
                              fontFamily: "inherit",
                            }}
                          >
                            <span
                              style={{
                                lineHeight: 1.2,
                                display: "flex",
                                alignItems: "center",
                              }}
                            >
                              {selectedFireStationDivisionType ||
                                "Select division type"}
                            </span>
                            <ChevronDown
                              size={16}
                              className={`ml-2 transition-transform duration-200 ${
                                fireStationDivisionTypeOpen ? "rotate-180" : ""
                              }`}
                              style={{ display: "flex", alignItems: "center" }}
                            />
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                )}

              {/* Police Stations Coverage Dropdown */}
              {item === "Police Stations" &&
                commandResponseCheckedItems.includes("Police Stations") && (
                  <div className="ml-6.5 mt-3 mb-3 w-[260px] space-y-2">
                    <button
                      ref={policeStationButtonRef}
                      onClick={() =>
                        setPoliceStationCoverageOpen((prev) => !prev)
                      }
                      className="flex justify-between items-center w-full bg-[#3a3a3a] text-white p-2 px-3 rounded-md"
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        lineHeight: 1.2,
                        fontFamily: "inherit",
                      }}
                    >
                      <span
                        style={{
                          lineHeight: 1.2,
                          display: "flex",
                          alignItems: "center",
                        }}
                      >
                        {selectedPoliceCoverage || "Select Coverage"}
                      </span>
                      <ChevronDown
                        size={16}
                        className={`ml-2 transition-transform duration-200 ${
                          policeStationCoverageOpen ? "rotate-180" : ""
                        }`}
                        style={{ display: "flex", alignItems: "center" }}
                      />
                    </button>

                    {/* Police Country Selection Dropdown - appears when "By country" is selected */}
                    {selectedPoliceCoverage === "By country" && (
                      <>
                        <button
                          ref={policeStationCountryButtonRef}
                          onClick={() =>
                            setPoliceStationCountryOpen((prev) => !prev)
                          }
                          className="flex justify-between items-center w-full bg-[#3a3a3a] text-white p-2 px-3 rounded-md"
                          style={{
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "space-between",
                            lineHeight: 1.2,
                            fontFamily: "inherit",
                          }}
                        >
                          <span
                            style={{
                              lineHeight: 1.2,
                              display: "flex",
                              alignItems: "center",
                            }}
                          >
                            {selectedPoliceStationCountry || "Select Country"}
                          </span>
                          <ChevronDown
                            size={16}
                            className={`ml-2 transition-transform duration-200 ${
                              policeStationCountryOpen ? "rotate-180" : ""
                            }`}
                            style={{ display: "flex", alignItems: "center" }}
                          />
                        </button>

                        {/* Clear Police Stations button - always visible when "By country" is selected */}
                        <button
                          onClick={() => {
                            if (!selectedPoliceStationCountry) return;
                            mapRef.current?.clearPoliceStations?.();
                            setSelectedPoliceStationCountry("");
                          }}
                          disabled={!selectedPoliceStationCountry}
                          className={`w-full py-2 rounded-md mt-2 ${
                            selectedPoliceStationCountry
                              ? "bg-[#5A5C99] text-white hover:opacity-90 shadow-md"
                              : "bg-[#4c4c4c] text-[#a1a1a1] cursor-not-allowed"
                          }`}
                        >
                          Clear Police Stations
                        </button>
                      </>
                    )}

                    {/* Police Administrative Division Section - appears when "By administrative division" is selected */}
                    {selectedPoliceCoverage ===
                      "By administrative division" && (
                      <div className="space-y-2">
                        <div className="text-white text-[10px] font-medium mt-4">
                          Define Scope:
                        </div>
                        <button
                          ref={policeStationScopeButtonRef}
                          onClick={() =>
                            setPoliceStationScopeOpen((prev) => !prev)
                          }
                          className="flex justify-between items-center w-full bg-[#3a3a3a] text-white p-2 px-3 rounded-md"
                          style={{
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "space-between",
                            lineHeight: 1.2,
                            fontFamily: "inherit",
                          }}
                        >
                          <span
                            style={{
                              lineHeight: 1.2,
                              display: "flex",
                              alignItems: "center",
                            }}
                          >
                            {selectedPoliceStationScope || "Select Country"}
                          </span>
                          <ChevronDown
                            size={16}
                            className={`ml-2 transition-transform duration-200 ${
                              policeStationScopeOpen ? "rotate-180" : ""
                            }`}
                            style={{ display: "flex", alignItems: "center" }}
                          />
                        </button>

                        {/* Police State Selection Dropdown - appears when "United States of America" is selected */}
                        {selectedPoliceStationScope ===
                          "United States of America" && (
                          <>
                            <button
                              ref={policeStationStateButtonRef}
                              onClick={() =>
                                setPoliceStationStateOpen((prev) => !prev)
                              }
                              className="flex justify-between items-center w-full bg-[#3a3a3a] text-white p-2 px-3 rounded-md"
                              style={{
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "space-between",
                                lineHeight: 1.2,
                                fontFamily: "inherit",
                              }}
                            >
                              <span
                                style={{
                                  lineHeight: 1.2,
                                  display: "flex",
                                  alignItems: "center",
                                }}
                              >
                                {selectedPoliceStationState || "Select State"}
                              </span>
                              <ChevronDown
                                size={16}
                                className={`ml-2 transition-transform duration-200 ${
                                  policeStationStateOpen ? "rotate-180" : ""
                                }`}
                                style={{
                                  display: "flex",
                                  alignItems: "center",
                                }}
                              />
                            </button>

                            {/* Clear Police Stations button - always visible when "United States of America" is selected */}
                            <button
                              onClick={() => {
                                if (!selectedPoliceStationState) return;
                                mapRef.current?.clearPoliceStations?.();
                                setSelectedPoliceStationState("");
                              }}
                              disabled={!selectedPoliceStationState}
                              className={`w-full py-2 rounded-md mt-2 ${
                                selectedPoliceStationState
                                  ? "bg-[#5A5C99] text-white hover:opacity-90 shadow-md"
                                  : "bg-[#4c4c4c] text-[#a1a1a1] cursor-not-allowed"
                              }`}
                            >
                              Clear Police Stations
                            </button>
                          </>
                        )}

                        {/* Police Division Type Selection Dropdown - appears when "Philippines" is selected */}
                        {selectedPoliceStationScope === "Philippines" && (
                          <button
                            ref={policeStationDivisionTypeButtonRef}
                            onClick={() =>
                              setPoliceStationDivisionTypeOpen((prev) => !prev)
                            }
                            className="flex justify-between items-center w-full bg-[#3a3a3a] text-white p-2 px-3 rounded-md"
                            style={{
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "space-between",
                              lineHeight: 1.2,
                              fontFamily: "inherit",
                            }}
                          >
                            <span
                              style={{
                                lineHeight: 1.2,
                                display: "flex",
                                alignItems: "center",
                              }}
                            >
                              {selectedPoliceStationDivisionType ||
                                "Select division type"}
                            </span>
                            <ChevronDown
                              size={16}
                              className={`ml-2 transition-transform duration-200 ${
                                policeStationDivisionTypeOpen
                                  ? "rotate-180"
                                  : ""
                              }`}
                              style={{ display: "flex", alignItems: "center" }}
                            />
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                )}
            </div>
          ))}
        </div>
      )}
      {/* Fire Station Coverage Dropdown - Rendered as portal */}
      {fireStationCoverageOpen &&
        fireStationButtonRef.current &&
        createPortal(
          <div
            className="fixed bg-[#3a3a3a] rounded-md shadow-lg z-[9999] text-[10px] text-white overflow-hidden"
            style={{
              top:
                fireStationButtonRef.current.getBoundingClientRect().bottom + 4,
              left: fireStationButtonRef.current.getBoundingClientRect().left,
              width: fireStationButtonRef.current.getBoundingClientRect().width,
            }}
          >
            {fireStationCoverageOptions.map((option, index, arr) => (
              <div
                key={index}
                onClick={() => {
                  setSelectedFireCoverage(option);
                  setFireStationCoverageOpen(false);
                }}
                className={`px-3 py-2 hover:bg-[#505050] cursor-pointer
          ${index === 0 ? "rounded-t-md" : ""}
          ${index === arr.length - 1 ? "rounded-b-md" : ""}`}
              >
                {option}
              </div>
            ))}
          </div>,
          document.body
        )}

      {/* Fire Station Country Dropdown - Rendered as portal */}
      {fireStationCountryOpen &&
        fireStationCountryButtonRef.current &&
        createPortal(
          <div
            className="fixed bg-[#3a3a3a] rounded-md shadow-lg z-[9999] text-[10px] text-white overflow-hidden"
            style={{
              top:
                fireStationCountryButtonRef.current.getBoundingClientRect()
                  .bottom + 4,
              left: fireStationCountryButtonRef.current.getBoundingClientRect()
                .left,
              width:
                fireStationCountryButtonRef.current.getBoundingClientRect()
                  .width,
            }}
          >
            {/* Search Box */}
            <div className="p-2">
              <input
                type="text"
                placeholder="Search country..."
                value={fireStationCountrySearchTerm}
                onChange={(e) =>
                  setFireStationCountrySearchTerm(e.target.value)
                }
                className="w-full p-2 rounded-md text-white outline-none focus:ring-0 focus:outline-none hover:outline-none"
              />
            </div>

            {/* Filtered country list */}
            <div
              className="overflow-y-auto"
              style={{
                maxHeight: "140px",
                scrollbarWidth: "thin",
                scrollbarColor: "#5a5a5a transparent",
              }}
              onScroll={(e) => e.stopPropagation()}
            >
              {fireStationCountryOptions
                .filter((c) =>
                  c
                    .toLowerCase()
                    .includes(fireStationCountrySearchTerm.toLowerCase())
                )
                .map((option, index, arr) => (
                  <div
                    key={index}
                    onClick={async () => {
                      setSelectedFireStationCountry(option);
                      setFireStationCountryOpen(false);
                      setFireStationCountrySearchTerm("");
                      const config = FireStationsByCountry[option];
                      if (config && mapRef.current) {
                        mapRef.current.flyTo({
                          center: config.center,
                          zoom: config.zoom,
                          essential: true,
                        });
                        try {
                          const res = await fetch(config.geojsonUrl);
                          const data = await res.json();
                          mapRef.current.drawFireStations?.(data);
                        } catch (err) {
                          console.error(
                            "Failed to fetch fire stations for",
                            option,
                            err
                          );
                        }
                      }
                    }}
                    className={`px-3 py-2 hover:bg-[#505050] cursor-pointer
${index === arr.length - 1 ? "rounded-bl-md" : ""}`}
                  >
                    {option}
                  </div>
                ))}
            </div>
          </div>,
          document.body
        )}
      {/* Fire Station Scope Dropdown - Rendered as portal */}
      {fireStationScopeOpen &&
        fireStationScopeButtonRef.current &&
        createPortal(
          <div
            className="fixed bg-[#3a3a3a] rounded-md shadow-lg z-[9999] text-[10px] text-white overflow-hidden"
            style={{
              top:
                fireStationScopeButtonRef.current.getBoundingClientRect()
                  .bottom + 4,
              left: fireStationScopeButtonRef.current.getBoundingClientRect()
                .left,
              width:
                fireStationScopeButtonRef.current.getBoundingClientRect().width,
            }}
          >
            {fireStationScopeOptions.map((option, index, arr) => (
              <div
                key={index}
                onClick={() => {
                  setSelectedFireStationScope(option);
                  setFireStationScopeOpen(false);
                }}
                className={`px-3 py-2 hover:bg-[#505050] cursor-pointer
          ${index === 0 ? "rounded-t-md" : ""}
          ${index === arr.length - 1 ? "rounded-b-md" : ""}`}
              >
                {option}
              </div>
            ))}
          </div>,
          document.body
        )}

      {/* Fire Station State Dropdown - Rendered as portal */}
      {fireStationStateOpen &&
        fireStationStateButtonRef.current &&
        createPortal(
          <div
            className="fixed bg-[#3a3a3a] rounded-md shadow-lg z-[9999] text-[10px] text-white overflow-hidden"
            style={{
              top:
                fireStationStateButtonRef.current.getBoundingClientRect()
                  .bottom + 4,
              left: fireStationStateButtonRef.current.getBoundingClientRect()
                .left,
              width:
                fireStationStateButtonRef.current.getBoundingClientRect().width,
            }}
          >
            {/* Search Box */}
            <div className="p-2">
              <input
                type="text"
                placeholder="Search state..."
                value={fireStationStateSearchTerm}
                onChange={(e) => setFireStationStateSearchTerm(e.target.value)}
                className="w-full p-2 rounded-md text-white outline-none focus:ring-0 focus:outline-none hover:outline-none"
              />
            </div>

            {/* Filtered state list */}
            <div
              className="overflow-y-auto"
              style={{
                maxHeight: "140px",
                scrollbarWidth: "thin",
                scrollbarColor: "#5a5a5a transparent",
              }}
              onScroll={(e) => e.stopPropagation()}
            >
              {fireStationStateOptions
                .filter((s) =>
                  s
                    .toLowerCase()
                    .includes(fireStationStateSearchTerm.toLowerCase())
                )
                .map((option, index, arr) => (
                  <div
                    key={index}
                    onClick={async () => {
                      setSelectedFireStationState(option);
                      setFireStationStateOpen(false);
                      setFireStationStateSearchTerm("");
                      const config = USFireStationsByState[option];
                      if (config && mapRef.current) {
                        mapRef.current.flyTo({
                          center: config.center,
                          zoom: config.zoom,
                          essential: true,
                        });
                        try {
                          const res = await fetch(config.geojsonUrl);
                          const data = await res.json();
                          mapRef.current.drawFireStations?.(data);
                        } catch (err) {
                          console.error(
                            "Failed to fetch fire stations for",
                            option,
                            err
                          );
                        }
                      }
                    }}
                    className={`px-3 py-2 hover:bg-[#505050] cursor-pointer
              ${index === arr.length - 1 ? "rounded-bl-md" : ""}`}
                  >
                    {option}
                  </div>
                ))}
            </div>
          </div>,
          document.body
        )}

      {/* Fire Station Division Type Dropdown - Rendered as portal */}
      {fireStationDivisionTypeOpen &&
        fireStationDivisionTypeButtonRef.current &&
        createPortal(
          <div
            className="fixed bg-[#3a3a3a] rounded-md shadow-lg z-[9999] text-[10px] text-white overflow-hidden"
            style={{
              top:
                fireStationDivisionTypeButtonRef.current.getBoundingClientRect()
                  .bottom + 4,
              left: fireStationDivisionTypeButtonRef.current.getBoundingClientRect()
                .left,
              width:
                fireStationDivisionTypeButtonRef.current.getBoundingClientRect()
                  .width,
            }}
          >
            {fireStationDivisionTypeOptions.map((option, index, arr) => (
              <div
                key={index}
                onClick={() => {
                  setSelectedFireStationDivisionType(option);
                  setFireStationDivisionTypeOpen(false);
                }}
                className={`px-3 py-2 hover:bg-[#505050] cursor-pointer
          ${index === 0 ? "rounded-t-md" : ""}
          ${index === arr.length - 1 ? "rounded-b-md" : ""}`}
              >
                {option}
              </div>
            ))}
          </div>,
          document.body
        )}

      {/* Police Station Coverage Dropdown - Rendered as portal */}
      {policeStationCoverageOpen &&
        policeStationButtonRef.current &&
        createPortal(
          <div
            className="fixed bg-[#3a3a3a] rounded-md shadow-lg z-[9999] text-[10px] text-white overflow-hidden"
            style={{
              top:
                policeStationButtonRef.current.getBoundingClientRect().bottom +
                4,
              left: policeStationButtonRef.current.getBoundingClientRect().left,
              width:
                policeStationButtonRef.current.getBoundingClientRect().width,
            }}
          >
            {policeStationCoverageOptions.map((option, index, arr) => (
              <div
                key={index}
                onClick={() => {
                  setSelectedPoliceCoverage(option);
                  setPoliceStationCoverageOpen(false);
                }}
                className={`px-3 py-2 hover:bg-[#505050] cursor-pointer
            ${index === 0 ? "rounded-t-md" : ""}
            ${index === arr.length - 1 ? "rounded-b-md" : ""}`}
              >
                {option}
              </div>
            ))}
          </div>,
          document.body
        )}

      {/* Police Station Country Dropdown - Rendered as portal */}
      {policeStationCountryOpen &&
        policeStationCountryButtonRef.current &&
        createPortal(
          <div
            className="fixed bg-[#3a3a3a] rounded-md shadow-lg z-[9999] text-[10px] text-white overflow-hidden"
            style={{
              top:
                policeStationCountryButtonRef.current.getBoundingClientRect()
                  .bottom + 4,
              left: policeStationCountryButtonRef.current.getBoundingClientRect()
                .left,
              width:
                policeStationCountryButtonRef.current.getBoundingClientRect()
                  .width,
            }}
          >
            {/* Search Box */}
            <div className="p-2">
              <input
                type="text"
                placeholder="Search country..."
                value={policeStationCountrySearchTerm}
                onChange={(e) =>
                  setPoliceStationCountrySearchTerm(e.target.value)
                }
                className="w-full p-2 rounded-md text-white outline-none focus:ring-0 focus:outline-none hover:outline-none"
              />
            </div>

            {/* Filtered country list */}
            <div
              className="overflow-y-auto"
              style={{
                maxHeight: "140px",
                scrollbarWidth: "thin",
                scrollbarColor: "#5a5a5a transparent",
              }}
              onScroll={(e) => e.stopPropagation()}
            >
              {policeStationCountryOptions
                .filter((c) =>
                  c
                    .toLowerCase()
                    .includes(policeStationCountrySearchTerm.toLowerCase())
                )
                .map((option, index, arr) => (
                  <div
                    key={index}
                    onClick={async () => {
                      setSelectedPoliceStationCountry(option);
                      setPoliceStationCountryOpen(false);
                      setPoliceStationCountrySearchTerm("");
                      const config = PoliceStationsByCountry[option];
                      if (config && mapRef.current) {
                        mapRef.current.flyTo({
                          center: config.center,
                          zoom: config.zoom,
                          essential: true,
                        });
                        try {
                          const res = await fetch(config.geojsonUrl);
                          const data = await res.json();
                          mapRef.current.drawPoliceStations?.(data);
                        } catch (err) {
                          console.error(
                            "Failed to fetch police stations for",
                            option,
                            err
                          );
                        }
                      }
                    }}
                    className={`px-3 py-2 hover:bg-[#505050] cursor-pointer
                ${index === arr.length - 1 ? "rounded-bl-md" : ""}`}
                  >
                    {option}
                  </div>
                ))}
            </div>
          </div>,
          document.body
        )}

      {/* Police Station Scope Dropdown - Rendered as portal */}
      {policeStationScopeOpen &&
        policeStationScopeButtonRef.current &&
        createPortal(
          <div
            className="fixed bg-[#3a3a3a] rounded-md shadow-lg z-[9999] text-[10px] text-white overflow-hidden"
            style={{
              top:
                policeStationScopeButtonRef.current.getBoundingClientRect()
                  .bottom + 4,
              left: policeStationScopeButtonRef.current.getBoundingClientRect()
                .left,
              width:
                policeStationScopeButtonRef.current.getBoundingClientRect()
                  .width,
            }}
          >
            {policeStationScopeOptions.map((option, index, arr) => (
              <div
                key={index}
                onClick={() => {
                  setSelectedPoliceStationScope(option);
                  setPoliceStationScopeOpen(false);
                }}
                className={`px-3 py-2 hover:bg-[#505050] cursor-pointer
            ${index === 0 ? "rounded-t-md" : ""}
            ${index === arr.length - 1 ? "rounded-b-md" : ""}`}
              >
                {option}
              </div>
            ))}
          </div>,
          document.body
        )}

      {/* Police Station State Dropdown - Rendered as portal */}
      {policeStationStateOpen &&
        policeStationStateButtonRef.current &&
        createPortal(
          <div
            className="fixed bg-[#3a3a3a] rounded-md shadow-lg z-[9999] text-[10px] text-white overflow-hidden"
            style={{
              top:
                policeStationStateButtonRef.current.getBoundingClientRect()
                  .bottom + 4,
              left: policeStationStateButtonRef.current.getBoundingClientRect()
                .left,
              width:
                policeStationStateButtonRef.current.getBoundingClientRect()
                  .width,
            }}
          >
            {/* Search Box */}
            <div className="p-2">
              <input
                type="text"
                placeholder="Search state..."
                value={policeStationStateSearchTerm}
                onChange={(e) =>
                  setPoliceStationStateSearchTerm(e.target.value)
                }
                className="w-full p-2 rounded-md text-white outline-none focus:ring-0 focus:outline-none hover:outline-none"
              />
            </div>

            {/* Filtered state list */}
            <div
              className="overflow-y-auto"
              style={{
                maxHeight: "140px",
                scrollbarWidth: "thin",
                scrollbarColor: "#5a5a5a transparent",
              }}
              onScroll={(e) => e.stopPropagation()}
            >
              {policeStationStateOptions
                .filter((s) =>
                  s
                    .toLowerCase()
                    .includes(policeStationStateSearchTerm.toLowerCase())
                )
                .map((option, index, arr) => (
                  <div
                    key={index}
                    onClick={async () => {
                      setSelectedPoliceStationState(option);
                      setPoliceStationStateOpen(false);
                      setPoliceStationStateSearchTerm("");
                      // Add police station state data fetching logic here
                      // const config = USPoliceStationsByState[option];
                      // if (config && mapRef.current) {
                      //   mapRef.current.flyTo({
                      //     center: config.center,
                      //     zoom: config.zoom,
                      //     essential: true,
                      //   });
                      //   try {
                      //     const res = await fetch(config.geojsonUrl);
                      //     const data = await res.json();
                      //     mapRef.current.drawPoliceStations?.(data);
                      //   } catch (err) {
                      //     console.error("Failed to fetch police stations for", option, err);
                      //   }
                      // }
                    }}
                    className={`px-3 py-2 hover:bg-[#505050] cursor-pointer
                ${index === arr.length - 1 ? "rounded-bl-md" : ""}`}
                  >
                    {option}
                  </div>
                ))}
            </div>
          </div>,
          document.body
        )}

      {/* Police Station Division Type Dropdown - Rendered as portal */}
      {policeStationDivisionTypeOpen &&
        policeStationDivisionTypeButtonRef.current &&
        createPortal(
          <div
            className="fixed bg-[#3a3a3a] rounded-md shadow-lg z-[9999] text-[10px] text-white overflow-hidden"
            style={{
              top:
                policeStationDivisionTypeButtonRef.current.getBoundingClientRect()
                  .bottom + 4,
              left: policeStationDivisionTypeButtonRef.current.getBoundingClientRect()
                .left,
              width:
                policeStationDivisionTypeButtonRef.current.getBoundingClientRect()
                  .width,
            }}
          >
            {policeStationDivisionTypeOptions.map((option, index, arr) => (
              <div
                key={index}
                onClick={() => {
                  setSelectedPoliceStationDivisionType(option);
                  setPoliceStationDivisionTypeOpen(false);
                }}
                className={`px-3 py-2 hover:bg-[#505050] cursor-pointer
            ${index === 0 ? "rounded-t-md" : ""}
            ${index === arr.length - 1 ? "rounded-b-md" : ""}`}
              >
                {option}
              </div>
            ))}
          </div>,
          document.body
        )}

      {/* Emergency Shelters Coverage Dropdown - Rendered as portal */}
      {shelterCoverageOpen &&
        shelterCoverageButtonRef.current &&
        createPortal(
          <div
            className="fixed bg-[#3a3a3a] rounded-md shadow-lg z-[9999] text-[10px] text-white overflow-hidden"
            style={{
              top:
                shelterCoverageButtonRef.current.getBoundingClientRect()
                  .bottom + 4,
              left: shelterCoverageButtonRef.current.getBoundingClientRect()
                .left,
              width:
                shelterCoverageButtonRef.current.getBoundingClientRect().width,
            }}
          >
            {shelterCoverageOptions.map((option, index, arr) => (
              <div
                key={index}
                onClick={() => {
                  setSelectedShelterCoverage(option);
                  setShelterCoverageOpen(false);
                }}
                className={`px-3 py-2 hover:bg-[#505050] cursor-pointer
          ${index === 0 ? "rounded-t-md" : ""}
          ${index === arr.length - 1 ? "rounded-b-md" : ""}`}
              >
                {option}
              </div>
            ))}
          </div>,
          document.body
        )}
    </>
  );
}


