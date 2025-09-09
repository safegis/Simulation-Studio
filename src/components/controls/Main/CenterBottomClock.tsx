"use client";

import React, { useEffect, useState } from "react";

export default function CenterBottomClock() {
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
  );
}
