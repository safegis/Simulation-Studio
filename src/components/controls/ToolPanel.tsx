"use client";

import { useState, useRef, useEffect } from "react";
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
  mapRef: React.RefObject<any>;
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
  mapRef,
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

  const earthquakeInterval = useRef<NodeJS.Timeout | null>(null);

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

  const startEarthquakePolling = () => {
    if (earthquakeInterval.current) return;
    earthquakeInterval.current = setInterval(async () => {
      try {
        const res = await fetch(
          "https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/all_day.geojson"
        );
        const data = await res.json();
        mapRef.current?.drawEarthquakeDots(data.features);
      } catch (err) {
        console.error("Error polling earthquake data:", err);
      }
    }, 60000);
  };

  const stopEarthquakePolling = () => {
    if (earthquakeInterval.current) {
      clearInterval(earthquakeInterval.current);
      earthquakeInterval.current = null;
    }
  };

  const toggleGeologicalItem = async (item: string) => {
    const isAlreadyChecked = geologicalCheckedItems.includes(item);
    const newItems = isAlreadyChecked
      ? geologicalCheckedItems.filter((i) => i !== item)
      : [...geologicalCheckedItems, item];

    setGeologicalCheckedItems(newItems);

    if (item === "Ground Shaking") {
      if (!isAlreadyChecked) {
        try {
          const res = await fetch(
            "https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/all_day.geojson"
          );
          const data = await res.json();
          mapRef.current?.drawEarthquakeDots(data.features);
        } catch (err) {
          console.error("Failed to fetch initial earthquake data:", err);
        }
        startEarthquakePolling();
      } else {
        mapRef.current?.drawEarthquakeDots([]);
        stopEarthquakePolling();
      }
    }
  };

  useEffect(() => {
    return () => {
      stopEarthquakePolling(); // Cleanup on unmount
    };
  }, []);

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
                {label === "Hazard Map" && (
                  <>
                    {/* Hydro */}
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

                    {/* Geological */}
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
                )}

                {label === "Exposure Map" && (
                  <>
                    <PanelToggle
                      title="Population"
                      icon={<PersonStanding size={20} />}
                      expanded={populationExpanded}
                      onToggle={() => setPopulationExpanded((prev) => !prev)}
                      items={populationCheckboxItems}
                      checkedItems={populationCheckedItems}
                      onCheck={togglePopulationItem}
                    />
                    <PanelToggle
                      title="Biological"
                      icon={<Sprout size={20} />}
                      expanded={biologicalExpanded}
                      onToggle={() => setBiologicalExpanded((prev) => !prev)}
                      items={biologicalCheckboxItems}
                      checkedItems={biologicalCheckedItems}
                      onCheck={toggleBiologicalItem}
                    />
                    <PanelToggle
                      title="Non-Biological"
                      icon={<Building2 size={20} />}
                      expanded={nonBiologicalExpanded}
                      onToggle={() => setNonBiologicalExpanded((prev) => !prev)}
                      items={nonBiologicalCheckboxItems}
                      checkedItems={nonBiologicalCheckedItems}
                      onCheck={toggleNonBiologicalItem}
                    />
                  </>
                )}

                {label === "Vulnerability Map" && (
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
                )}

                {label === "Critical Facility Map" && (
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

function PanelToggle({
  title,
  icon,
  expanded,
  onToggle,
  items,
  checkedItems,
  onCheck,
}: {
  title: string;
  icon: React.ReactNode;
  expanded: boolean;
  onToggle: () => void;
  items: string[];
  checkedItems: string[];
  onCheck: (item: string) => void;
}) {
  return (
    <>
      <button
        onClick={onToggle}
        className="flex justify-between items-center w-full bg-transparent text-white px-2 py-2 rounded hover:bg-[#3a3a3a] transition"
      >
        <div className="flex items-center gap-2">
          {icon}
          <span className="text-base font-medium">{title}</span>
        </div>
        <ChevronDown
          size={18}
          className={`text-white transition-transform duration-200 ${
            expanded ? "rotate-180" : ""
          }`}
        />
      </button>
      {expanded && (
        <div className="pl-7 pt-2 pb-2 space-y-2">
          {items.map((item) => (
            <div key={item} className="flex items-center">
              <Checkbox
                className="mr-3 w-[18px] h-[18px]"
                checked={checkedItems.includes(item)}
                onCheckedChange={() => onCheck(item)}
              />
              <span className="text-base">{item}</span>
            </div>
          ))}
        </div>
      )}
    </>
  );
}
