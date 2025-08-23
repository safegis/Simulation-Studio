"use client";

import { useEffect, useState } from "react";
import { Send } from "lucide-react";

type Props = {
  isVisible: boolean;
};

export default function SafeGISAIChat({ isVisible }: Props) {
  const [animateVisible, setAnimateVisible] = useState(false);
  const [isHiding, setIsHiding] = useState(false);
  const [inputText, setInputText] = useState("");

  useEffect(() => {
    if (isVisible) {
      setAnimateVisible(true);
      setIsHiding(false);
    } else {
      setIsHiding(true);
      const timeout = setTimeout(() => {
        setAnimateVisible(false);
        setIsHiding(false);
      }, 150); // Faster minimize
      return () => clearTimeout(timeout);
    }
  }, [isVisible]);

  if (!isVisible && !animateVisible) return null;

  return (
    <div
      className={`absolute bottom-[18px] right-[109px] w-[440px] rounded-[15px] z-50 shadow-md origin-bottom-right
        ${
          isVisible
            ? "opacity-100 scale-100 pointer-events-auto transition-all duration-300 ease-out"
            : "opacity-0 scale-75 pointer-events-none transition-all duration-150 ease-in"
        }`}
      style={{
        height: "calc(100% - 2 * 155.5px)",
        background: "linear-gradient(to bottom, #5A5C99, #232323)",
        overflow: "hidden",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
      }}
    >
      {/* Centered logo and text */}
      <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
        <img
          src="/Images/SafeGIS-AI-Logo.png"
          alt="SafeGIS AI Logo"
          className="opacity-50 w-[140px]"
        />
        <p
          className="text-white opacity-70 text-[25px] font-semibold mt-[12px]"
          style={{ letterSpacing: "0.5px" }}
        >
          SafeGIS AI
        </p>
        <p
          className="text-[#C7C7C7] text-[17px] font-[400] mt-[8px] mb-[70px]"
          style={{ letterSpacing: "0.1px" }}
        >
          Need assistance? Ask away!
        </p>
      </div>

      {/* Chat content (future messages) */}
      <div className="flex-1 p-4 overflow-y-auto">
        {/* Messages will go here */}
      </div>

      {/* Input area */}
      <div className="p-4">
        <div className="flex items-center gap-2">
          {/* Input box */}
          <input
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder="Ask a question or define a task..."
            className="flex-1 h-[50px] bg-transparent text-[#C7C7C7] placeholder-[#C7C7C7]/70 
              border-[2px] border-[#C7C7C7] rounded-md outline-none px-3"
          />

          {/* Send Button */}
          <button className="h-[50px] w-[50px] flex items-center justify-center border-[2px] border-[#C7C7C7] rounded-md text-[#C7C7C7] hover:text-white hover:border-white transition">
            <Send size={21} />
          </button>
        </div>
      </div>
    </div>
  );
}
