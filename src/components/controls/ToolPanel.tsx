"use client";

import { useState } from "react";
import {
  ChevronDown,
  Droplet,
  Mountain,
  TrafficCone,
  Wind,
  Flame,
  PersonStanding,
  Sprout,
  Building2,
  BriefcaseMedical,
  LandPlot,
  ShoppingCart,
  BusFront,
  Siren,
} from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";

interface Props {
  isVisible: boolean;
  selectedMaps: string[];
  selectedPlanningTools: string[];
}

const displayNameMap: Record<string, string> = {
  "Hazard Map": "Hazard Map",
  "Exposure Map": "Exposure Map",
  "Vulnerability Map": "Vulnerability Map",
  "Critical Facility Map": "Critical Facility Map",
};

const displayNamePlanningTools: Record<string, string> = {
  "Evacuation Planner": "Evacuation Planner",
  "Resource Planner": "Resource Planner",
  "Recovery Planner": "Recovery Planner",
  "Medical Response Planner": "Medical Response Planner",
  "Communication & Alert Planner": "Communication & Alert Planner",
};

const populationCheckboxItems = ["Urban", "Rural", "Vulnerable Population"];

const biologicalCheckboxItems = [
  "Forest Cover",
  "Agro-Ecosystem",
  "Mangrove Areas",
  "National Parks",
  "Critical Habitats",
  "Wetlands / Water Bodies",
];

const nonBiologicalCheckboxItems = [
  "Road Networks",
  "Bridges",
  "Medical Facilities",
  "Schools / Universities",
  "Active Evacuation Areas",
  "National / Local Gov’t Offices",
  "Power / Energy Plants",
  "Telecommunication Towers",
  "Water Supply Infrastructure",
  "Residential Buildings",
];

const hydroMeteorologicalCheckboxItems = [
  "Weather",
  "Storm Surge",
  "Flood",
  "Tsunami",
  "Landslide (Rain-induced)",
];

const geologicalCheckboxItems = [
  "Ground Shaking",
  "Volcano",
  "Landslide (Earthquake-triggered)",
];

export default function ToolPanel({
  isVisible,
  selectedMaps,
  selectedPlanningTools,
}: Props) {
  const [expandedPanels, setExpandedPanels] = useState<Record<string, boolean>>(
    {}
  );

  const [populationExpanded, setPopulationExpanded] = useState(false);
  const [populationCheckedItems, setPopulationCheckedItems] = useState<
    string[]
  >([]);

  const [biologicalExpanded, setBiologicalExpanded] = useState(false);
  const [nonBiologicalExpanded, setNonBiologicalExpanded] = useState(false);

  const [biologicalCheckedItems, setBiologicalCheckedItems] = useState<
    string[]
  >([]);
  const [nonBiologicalCheckedItems, setNonBiologicalCheckedItems] = useState<
    string[]
  >([]);

  const [hydroExpanded, setHydroExpanded] = useState(false);
  const [hydroCheckedItems, setHydroCheckedItems] = useState<string[]>([]);

  const [geologicalExpanded, setGeologicalExpanded] = useState(false);
  const [geologicalCheckedItems, setGeologicalCheckedItems] = useState<
    string[]
  >([]);

  if (!isVisible) return null;

  const togglePanel = (key: string) => {
    setExpandedPanels((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  const togglePopulationItem = (item: string) => {
    setPopulationCheckedItems((prev) =>
      prev.includes(item) ? prev.filter((i) => i !== item) : [...prev, item]
    );
  };

  const toggleBiologicalItem = (item: string) => {
    setBiologicalCheckedItems((prev) =>
      prev.includes(item) ? prev.filter((i) => i !== item) : [...prev, item]
    );
  };

  const toggleNonBiologicalItem = (item: string) => {
    setNonBiologicalCheckedItems((prev) =>
      prev.includes(item) ? prev.filter((i) => i !== item) : [...prev, item]
    );
  };

  const toggleHydroItem = (item: string) => {
    setHydroCheckedItems((prev) =>
      prev.includes(item) ? prev.filter((i) => i !== item) : [...prev, item]
    );
  };

  const toggleGeologicalItem = (item: string) => {
    setGeologicalCheckedItems((prev) =>
      prev.includes(item) ? prev.filter((i) => i !== item) : [...prev, item]
    );
  };

  return (
    <div
      className="mt-[18px] w-full bg-transparent rounded-xl shadow-md text-[#C7C7C7] flex flex-col overflow-y-auto scrollbar-rounded"
      style={{ maxHeight: "calc(100vh - 91px - 18px)", padding: "0px" }}
    >
      {[...selectedMaps, ...selectedPlanningTools].map((label, index, arr) => {
        const isMap = label in displayNameMap;
        const displayName = isMap
          ? displayNameMap[label]
          : displayNamePlanningTools[label] || label;
        const key = `${isMap ? "map" : "tool"}-${label}`;
        const isExpanded = expandedPanels[key];

        return (
          <div key={key} className={index !== arr.length - 1 ? "mb-3" : ""}>
            <button
              onClick={() => togglePanel(key)}
              className="flex justify-between items-center px-4 w-full rounded-xl"
              style={{ height: "50px", backgroundColor: "#454545" }}
            >
              <span className="text-base font-medium text-white">
                {displayName}
              </span>
              <ChevronDown
                size={20}
                className={`text-white transform transition-transform duration-200 ${
                  isExpanded ? "rotate-180" : ""
                }`}
              />
            </button>

            {isExpanded && (
              <div className="bg-[#2E2E2E] text-sm text-white p-4 rounded-b-xl mt-2 space-y-2">
                {label === "Hazard Map" ? (
                  <>
                    <button
                      onClick={() => setHydroExpanded((prev) => !prev)}
                      className="flex justify-between items-center w-full bg-transparent text-white px-2 py-2 rounded hover:bg-[#3a3a3a] transition"
                    >
                      <div className="flex items-center gap-2">
                        <Droplet size={20} />
                        <span className="text-base font-medium">
                          Hydro-Meteorological
                        </span>
                      </div>
                      <ChevronDown
                        size={18}
                        className={`text-white transition-transform duration-200 ${
                          hydroExpanded ? "rotate-180" : ""
                        }`}
                      />
                    </button>

                    {hydroExpanded && (
                      <div className="pl-7 pt-2 pb-2 space-y-2">
                        {hydroMeteorologicalCheckboxItems.map((item) => (
                          <div key={item} className="flex items-center">
                            <Checkbox
                              className="mr-3 w-[18px] h-[18px]"
                              checked={hydroCheckedItems.includes(item)}
                              onCheckedChange={() => toggleHydroItem(item)}
                            />
                            <span className="text-base">{item}</span>
                          </div>
                        ))}
                      </div>
                    )}

                    <button
                      onClick={() => setGeologicalExpanded((prev) => !prev)}
                      className="flex justify-between items-center w-full bg-transparent text-white px-2 py-2 rounded hover:bg-[#3a3a3a] transition"
                    >
                      <div className="flex items-center gap-2">
                        <Mountain size={20} />
                        <span className="text-base font-medium">
                          Geological
                        </span>
                      </div>
                      <ChevronDown
                        size={18}
                        className={`text-white transition-transform duration-200 ${
                          geologicalExpanded ? "rotate-180" : ""
                        }`}
                      />
                    </button>

                    {geologicalExpanded && (
                      <div className="pl-7 pt-2 pb-2 space-y-2">
                        {geologicalCheckboxItems.map((item) => (
                          <div key={item} className="flex items-center">
                            <Checkbox
                              className="mr-3 w-[18px] h-[18px]"
                              checked={geologicalCheckedItems.includes(item)}
                              onCheckedChange={() => toggleGeologicalItem(item)}
                            />
                            <span className="text-base">{item}</span>
                          </div>
                        ))}
                      </div>
                    )}

                    <TransparentButton
                      label="Traffic Incidents"
                      icon={<TrafficCone size={20} />}
                    />
                    <TransparentButton
                      label="Air Quality Index (AQI)"
                      icon={<Wind size={20} />}
                    />
                    <TransparentButton
                      label="Active Fire"
                      icon={<Flame size={20} />}
                    />
                    <TransparentButton
                      label="Infectious Disease"
                      icon={<Flame size={20} />}
                    />
                  </>
                ) : label === "Exposure Map" ? (
                  <>
                    {/* Population */}
                    <button
                      onClick={() => setPopulationExpanded((prev) => !prev)}
                      className="flex justify-between items-center w-full bg-transparent text-white px-2 py-2 rounded hover:bg-[#3a3a3a] transition"
                    >
                      <div className="flex items-center gap-2">
                        <PersonStanding size={20} />
                        <span className="text-base font-medium">
                          Population
                        </span>
                      </div>
                      <ChevronDown
                        size={18}
                        className={`text-white transition-transform duration-200 ${
                          populationExpanded ? "rotate-180" : ""
                        }`}
                      />
                    </button>

                    {populationExpanded && (
                      <div className="pl-7 pt-2 pb-2 space-y-2">
                        {populationCheckboxItems.map((item) => (
                          <div key={item} className="flex items-center">
                            <Checkbox
                              className="mr-3 w-[18px] h-[18px]"
                              checked={populationCheckedItems.includes(item)}
                              onCheckedChange={() => togglePopulationItem(item)}
                            />
                            <span className="text-base">{item}</span>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Biological */}
                    <button
                      onClick={() => setBiologicalExpanded((prev) => !prev)}
                      className="flex justify-between items-center w-full bg-transparent text-white px-2 py-2 rounded hover:bg-[#3a3a3a] transition"
                    >
                      <div className="flex items-center gap-2">
                        <Sprout size={20} />
                        <span className="text-base font-medium">
                          Biological
                        </span>
                      </div>
                      <ChevronDown
                        size={18}
                        className={`text-white transition-transform duration-200 ${
                          biologicalExpanded ? "rotate-180" : ""
                        }`}
                      />
                    </button>
                    {biologicalExpanded && (
                      <div className="pl-7 pt-2 pb-2 space-y-2">
                        {biologicalCheckboxItems.map((item) => (
                          <div key={item} className="flex items-center">
                            <Checkbox
                              className="mr-3 w-[18px] h-[18px]"
                              checked={biologicalCheckedItems.includes(item)}
                              onCheckedChange={() => toggleBiologicalItem(item)}
                            />
                            <span className="text-base">{item}</span>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Non-Biological */}
                    <button
                      onClick={() => setNonBiologicalExpanded((prev) => !prev)}
                      className="flex justify-between items-center w-full bg-transparent text-white px-2 py-2 rounded hover:bg-[#3a3a3a] transition"
                    >
                      <div className="flex items-center gap-2">
                        <Building2 size={20} />
                        <span className="text-base font-medium">
                          Non-Biological
                        </span>
                      </div>
                      <ChevronDown
                        size={18}
                        className={`text-white transition-transform duration-200 ${
                          nonBiologicalExpanded ? "rotate-180" : ""
                        }`}
                      />
                    </button>
                    {nonBiologicalExpanded && (
                      <div className="pl-7 pt-2 pb-2 space-y-2">
                        {nonBiologicalCheckboxItems.map((item) => (
                          <div key={item} className="flex items-center">
                            <Checkbox
                              className="mr-3 w-[18px] h-[18px]"
                              checked={nonBiologicalCheckedItems.includes(item)}
                              onCheckedChange={() =>
                                toggleNonBiologicalItem(item)
                              }
                            />
                            <span className="text-base">{item}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </>
                ) : label === "Vulnerability Map" ? (
                  <>
                    <TransparentButton
                      label="Population"
                      icon={<PersonStanding size={20} />}
                    />
                    <TransparentButton
                      label="Biological"
                      icon={<Sprout size={20} />}
                    />
                    <TransparentButton
                      label="Non-Biological"
                      icon={<Building2 size={20} />}
                    />
                  </>
                ) : label === "Critical Facility Map" ? (
                  <>
                    <TransparentButton
                      label="Active Evacuation Area"
                      icon={<LandPlot size={20} />}
                    />
                    <TransparentButton
                      label="Medical / Health"
                      icon={<BriefcaseMedical size={20} />}
                    />
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
                ) : (
                  <p>
                    This is the panel for <strong>{displayName}</strong>.
                  </p>
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
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
