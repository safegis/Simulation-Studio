// \SafeGIS\Simulation-Studio\frontend\src\components\controls\Main\CenterBottomClock.tsx
"use client";

import React, { useEffect, useState } from "react";

interface CenterBottomClockProps {
  isBoundaryLoading?: boolean;
  boundaryLoadingStage?: string;
  isFileLoading?: boolean;
  fileLoadingStage?: string;
}

export default function CenterBottomClock({
  isBoundaryLoading = false,
  boundaryLoadingStage = "Loading boundary data...",
  isFileLoading = false,
  fileLoadingStage = "Loading spatial data...",
}: CenterBottomClockProps) {
  const [currentTimeFormatted, setCurrentTimeFormatted] = useState("");
  const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;

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

  return (
    <div className="absolute bottom-[15px] left-1/2 transform -translate-x-1/2 z-50 flex flex-col items-center gap-[15px]">
      {/* Loading Indicators - Shows above clock when loading */}
      {isBoundaryLoading && (
        <div className="bg-[#2E2E2E]/95 rounded-md px-4 py-2 flex items-center justify-center gap-2 shadow-lg">
          <div className="flex items-center gap-1">
            <div
              className="w-2 h-2 bg-[#9699FF] rounded-full animate-bounce"
              style={{ animationDelay: "0ms" }}
            ></div>
            <div
              className="w-2 h-2 bg-[#9699FF] rounded-full animate-bounce"
              style={{ animationDelay: "150ms" }}
            ></div>
            <div
              className="w-2 h-2 bg-[#9699FF] rounded-full animate-bounce"
              style={{ animationDelay: "300ms" }}
            ></div>
          </div>
          <span className="text-white text-[11px] font-medium leading-none">
            {boundaryLoadingStage}
          </span>
        </div>
      )}

      {isFileLoading && (
        <div className="bg-[#2E2E2E]/95 rounded-md px-4 py-2 flex items-center justify-center gap-2 shadow-lg">
          <div className="flex items-center gap-1">
            <div
              className="w-2 h-2 bg-[#9699FF] rounded-full animate-bounce"
              style={{ animationDelay: "0ms" }}
            ></div>
            <div
              className="w-2 h-2 bg-[#9699FF] rounded-full animate-bounce"
              style={{ animationDelay: "150ms" }}
            ></div>
            <div
              className="w-2 h-2 bg-[#9699FF] rounded-full animate-bounce"
              style={{ animationDelay: "300ms" }}
            ></div>
          </div>
          <span className="text-white text-[11px] font-medium leading-none">
            {fileLoadingStage}
          </span>
        </div>
      )}

      {/* Clock */}
      <div
        className="w-[340px] h-[50px] px-3 py-2 text-[#ffffff] flex flex-col items-center justify-center text-center"
        style={{
          background:
            "radial-gradient(circle, rgba(46,46,46,0.95) 0%, rgba(46,46,46,0.85) 30%, rgba(46,46,46,0.6) 55%, rgba(46,46,46,0.15) 88%, rgba(46,46,46,0.01) 100%)",
        }}
      >
        <div className="text-[12px] font-medium tracking-wide">
          {currentTimeFormatted}
        </div>
        <div className="text-[10px] mt-0.5 font-[600] bg-gradient-to-r from-[#9699FF] to-[#FFFFFF] bg-clip-text text-transparent">
          ({timeZone})
        </div>
      </div>
    </div>
  );
}
