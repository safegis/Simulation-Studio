import React, { useState } from "react";
import { ChevronDown, Users, Building, ShoppingBasket } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";

interface Props {
  resourcesOnMap: {
    id: string;
    type: string;
    data: { name: string; description: string };
    coords: { lng: number; lat: number };
  }[];
  mapRef: React.RefObject<any>;
  exportAsGeoJSON: () => void;
}

export default function ResourcePlannerControls({
  resourcesOnMap,
  mapRef,
  exportAsGeoJSON,
}: Props) {
  const [personnelExpanded, setPersonnelExpanded] = useState(false);
  const [infraExpanded, setInfraExpanded] = useState(false);
  const [suppliesExpanded, setSuppliesExpanded] = useState(false);

  return (
    <>
      {/* Personnel Section */}
      <button
        onClick={() => setPersonnelExpanded((prev) => !prev)}
        className="flex justify-between items-center w-full bg-transparent text-white px-2 py-2 rounded hover:bg-[#3a3a3a] transition"
      >
        <div className="flex items-center gap-2">
          <Users size={18} />
          <span className="text-base font-medium">Personnel</span>
        </div>
        <ChevronDown
          size={18}
          className={`text-white transition-transform duration-200 ${
            personnelExpanded ? "rotate-180" : ""
          }`}
        />
      </button>
      {personnelExpanded && (
        <div className="pt-2 pb-5 px-2">
          <div className="text-gray-400 text-xs text-center mb-4 ">
            Drag and drop a resource
          </div>
          <div className="grid grid-cols-3 gap-3">
            {[
              { name: "Health / Medical", type: "personnel" },
              { name: "Response and Rescue", type: "personnel" },
              { name: "Security / Law Enforcement", type: "personnel" },
              { name: "Logistics", type: "personnel" },
              { name: "Administrative", type: "personnel" },
              { name: "Others", type: "personnel" },
            ].map((res, index) => (
              <div
                key={`${res.type}-${index}`}
                draggable
                onDragStart={(e) =>
                  e.dataTransfer.setData("resource-type", res.type)
                }
                className="flex items-center justify-center p-3 h-[100px] rounded-lg cursor-move text-white text-center bg-gradient-to-br from-[#5A5C99] to-[#232323] hover:opacity-80"
              >
                <span className="text-xs">{res.name}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Infrastructure Section */}
      <button
        onClick={() => setInfraExpanded((prev) => !prev)}
        className="flex justify-between items-center w-full bg-transparent text-white px-2 py-2 rounded hover:bg-[#3a3a3a] transition mt-3"
      >
        <div className="flex items-center gap-2">
          <Building size={18} />
          <span className="text-base font-medium">Infrastructure</span>
        </div>
        <ChevronDown
          size={18}
          className={`text-white transition-transform duration-200 ${
            infraExpanded ? "rotate-180" : ""
          }`}
        />
      </button>
      {infraExpanded && (
        <div className="pt-2 pb-5 px-2">
          <div className="text-gray-400 text-xs text-center mb-4 ">
            Drag and drop a resource
          </div>
          <div className="grid grid-cols-3 gap-3">
            {[
              { name: "Health Facility", type: "infrastructure" },
              { name: "Water Distribution Hub", type: "infrastructure" },
              { name: "Evacuation Shelter", type: "infrastructure" },
              { name: "Transport Hub", type: "infrastructure" },
              { name: "Comm Hub", type: "infrastructure" },
              { name: "Power / Generator Hub", type: "infrastructure" },
              { name: "Supply Distribution Hub", type: "infrastructure" },
              { name: "Sanitation Facility", type: "infrastructure" },
              { name: "Field Command Post", type: "infrastructure" },
              { name: "Others", type: "infrastructure" },
            ].map((res, index) => (
              <div
                key={`${res.type}-${index}`}
                draggable
                onDragStart={(e) =>
                  e.dataTransfer.setData("resource-type", res.type)
                }
                className="flex items-center justify-center p-3 h-[100px] rounded-lg cursor-move text-white text-center bg-gradient-to-br from-[#5A5C99] to-[#232323] hover:opacity-80"
              >
                <span className="text-xs text-center">{res.name}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Supplies Section */}
      <button
        onClick={() => setSuppliesExpanded((prev) => !prev)}
        className="flex justify-between items-center w-full bg-transparent text-white px-2 py-2 rounded hover:bg-[#3a3a3a] transition mt-3"
      >
        <div className="flex items-center gap-2">
          <ShoppingBasket size={18} />
          <span className="text-base font-medium">Supplies</span>
        </div>
        <ChevronDown
          size={18}
          className={`text-white transition-transform duration-200 ${
            suppliesExpanded ? "rotate-180" : ""
          }`}
        />
      </button>
      {suppliesExpanded && (
        <div className="pt-2 pb-5 px-2">
          <div className="text-gray-400 text-xs text-center mb-4 ">
            Drag and drop a resource
          </div>
          <div className="grid grid-cols-3 gap-3">
            {[
              { name: "Food Items", type: "supplies" },
              { name: "Water and Hydration", type: "supplies" },
              { name: "Health Supplies", type: "supplies" },
              { name: "Non-Food Items (NFIs)", type: "supplies" },
              { name: "Special Needs", type: "supplies" },
              { name: "Others", type: "supplies" },
            ].map((res, index) => (
              <div
                key={`${res.type}-${index}`}
                draggable
                onDragStart={(e) =>
                  e.dataTransfer.setData("resource-type", res.type)
                }
                className="flex items-center justify-center p-3 h-[100px] rounded-lg cursor-move text-white text-center bg-gradient-to-br from-[#5A5C99] to-[#232323] hover:opacity-80"
              >
                <span className="text-xs text-center">{res.name}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Resources on Map */}
      <div className="mt-7">
        <div className="text-white font-semibold mb-2">Resources on Map</div>
        <div className="space-y-2 max-h-40 overflow-y-auto pr-1">
          {resourcesOnMap.length === 0 && (
            <div className="text-gray-400 text-sm">No resources placed yet</div>
          )}
          {resourcesOnMap.map((res) => (
            <div
              key={res.id}
              onClick={() => mapRef.current?.flyToResource(res.id)}
              className="flex flex-col bg-[#3a3a3a] px-3 py-2 rounded-md cursor-pointer hover:bg-[#505050]"
            >
              <div className="flex items-center justify-between">
                <span>{res.data.name || res.type}</span>
                <div className="flex items-center gap-[5px] text-gray-400 text-xs capitalize">
                  <span>{res.type}</span>
                </div>
              </div>
              <div className="text-xs text-gray-400 mt-1">
                {res.coords.lat.toFixed(4)}, {res.coords.lng.toFixed(4)}
              </div>
            </div>
          ))}
        </div>
      </div>

      {resourcesOnMap.length > 0 && (
        <div className="flex gap-2 mt-5">
          <button
            onClick={exportAsGeoJSON}
            className="flex-1 py-2 rounded-md bg-[#5A5C99] text-white hover:opacity-90 transition flex items-center justify-center"
          >
            Export as GeoJSON
          </button>
          <button
            onClick={() => mapRef.current?.clearAllResources()}
            className="flex-1 py-2 rounded-md bg-[#5A5C99] text-white hover:opacity-90 transition flex items-center justify-center"
          >
            Clear all
          </button>
        </div>
      )}
    </>
  );
}
