"use client";

import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { MapPin, Route, Car, Bike, Footprints } from "lucide-react";
import TwoWheelerIcon from "@mui/icons-material/TwoWheeler";

export default function PathfinderControls() {
  return (
    <div className="w-96 bg-[#2E2E2E] rounded-xl shadow-md p-4 text-[#C7C7C7] flex flex-col">
      <Tabs defaultValue="destination" className="w-full flex flex-col gap-4">
        {/* Tabs */}
        <TabsList className="bg-[#5A5A5A] rounded-xl w-full grid grid-cols-2 p-[6px] h-[48px]">
          <TabsTrigger
            value="destination"
            className="data-[state=active]:bg-[#FFFFFF] data-[state=active]:text-[#2E2E2E] text-[#FFFFFF] text-[14px] font-medium rounded-lg flex items-center justify-center h-full"
          >
            Set Destination
          </TabsTrigger>
          <TabsTrigger
            value="evacuation"
            className="data-[state=active]:bg-[#FFFFFF] data-[state=active]:text-[#2E2E2E] text-[#FFFFFF] text-[14px] font-medium rounded-lg flex items-center justify-center h-full"
          >
            Find Evacuation Area
          </TabsTrigger>
        </TabsList>

        {/* Search Fields */}
        <div className="flex flex-col gap-3">
          {/* Start Point Search */}
          <div className="bg-[#5A5A5A] h-[48px] flex items-center gap-3 px-4 rounded-xl shadow-md">
            <MapPin width={25} height={25} color="#FF9494" />
            <input
              type="text"
              placeholder="Enter starting point..."
              className="bg-transparent outline-none text-md text-[#C7C7C7] placeholder-[#999] w-full h-full"
            />
          </div>

          {/* Destination Search */}
          <div className="bg-[#5A5A5A] h-[48px] flex items-center gap-3 px-4 rounded-xl shadow-md">
            <MapPin width={25} height={25} color="#75F7A9" />
            <input
              type="text"
              placeholder="Enter destination..."
              className="bg-transparent outline-none text-md text-[#C7C7C7] placeholder-[#999] w-full h-full"
            />
          </div>

          {/* Transport Mode Buttons */}
          <div className="flex justify-between items-center">
            <button className="p-3 rounded-lg hover:bg-[#3A3A3A] transition">
              <Route size={28} />
            </button>
            <button className="p-3 rounded-lg hover:bg-[#3A3A3A] transition">
              <Car size={28} />
            </button>
            <button className="p-3 rounded-lg hover:bg-[#3A3A3A] transition">
              <TwoWheelerIcon style={{ fontSize: 28, color: "#C7C7C7" }} />
            </button>
            <button className="p-3 rounded-lg hover:bg-[#3A3A3A] transition">
              <Bike size={28} />
            </button>
            <button className="p-3 rounded-lg hover:bg-[#3A3A3A] transition">
              <Footprints size={28} />
            </button>
          </div>
        </div>
      </Tabs>
    </div>
  );
}
