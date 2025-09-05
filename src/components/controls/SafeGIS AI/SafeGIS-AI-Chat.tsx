"use client";

import { useEffect, useState, useRef } from "react";
import {
  History,
  Expand,
  Plus,
  ChevronDown,
  ChevronUp,
  ArrowUp,
  MessageCirclePlus,
  Mic,
} from "lucide-react";
import ReactMarkdown from "react-markdown";
import AgentFns from "./Agent Functions/Map-Search";

type Props = { isVisible: boolean; mapRef?: any };

type Message = {
  role: "user" | "assistant";
  content: string;
};

// Loader
function ThinkingLoader() {
  return (
    <div className="flex flex-col items-center justify-center py-4">
      <div className="relative w-28 h-28">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-12 h-12 z-10">
          <div className="absolute inset-0 rounded-full border-4 border-t-transparent border-[#9699FF] animate-spin-slow"></div>
          <div className="absolute inset-[6px] rounded-full border-2 border-dashed border-[#C7C7C7] animate-spin-reverse"></div>
        </div>
        <div className="absolute top-1/2 left-1/2 w-full h-full">
          <div className="absolute w-3 h-3 bg-[#9699FF] rounded-full animate-orbit-0 -translate-x-1/2 -translate-y-1/2"></div>
          <div className="absolute w-3 h-3 bg-[#C7C7C7] rounded-full animate-orbit-90 -translate-x-1/2 -translate-y-1/2"></div>
          <div className="absolute w-3 h-3 bg-[#5A5C99] rounded-full animate-orbit-180 -translate-x-1/2 -translate-y-1/2"></div>
          <div className="absolute w-3 h-3 bg-[#ffffff] rounded-full animate-orbit-270 -translate-x-1/2 -translate-y-1/2"></div>
        </div>
      </div>
      <p className="mt-4 mb-6 text-[#C7C7C7] text-sm animate-pulse text-center">
        SafeGIS AI is mapping your answer...
      </p>
    </div>
  );
}

export default function SafeGISAIChat({ isVisible, mapRef }: Props) {
  const [animateVisible, setAnimateVisible] = useState(false);
  const [isHiding, setIsHiding] = useState(false);
  const [inputText, setInputText] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [modelDropdownOpen, setModelDropdownOpen] = useState(false);
  const [selectedModel, setSelectedModel] = useState("Gemma 3 27B");

  const chatEndRef = useRef<HTMLDivElement | null>(null);
  const dropdownButtonRef = useRef<HTMLButtonElement | null>(null);

  useEffect(() => {
    if (chatEndRef.current)
      chatEndRef.current.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  useEffect(() => {
    if (isVisible) {
      setAnimateVisible(true);
      setIsHiding(false);
    } else {
      setIsHiding(true);
      const timeout = setTimeout(() => {
        setAnimateVisible(false);
        setIsHiding(false);
      }, 150);
      return () => clearTimeout(timeout);
    }
  }, [isVisible]);

  if (!isVisible && !animateVisible) return null;

  const handleSend = async () => {
    if (!inputText.trim()) return;

    const userText = inputText;
    const newMessages: Message[] = [
      ...messages,
      { role: "user", content: userText },
    ];
    setMessages(newMessages);
    setInputText("");
    setLoading(true);

    try {
      let agentHandled = false;

      // --- Step 1: Classify Intent using a lightweight LLM call ---
      let intent: "map" | "qa" = "qa"; // default
      try {
        const intentResponse = await fetch(
          "https://openrouter.ai/api/v1/chat/completions",
          {
            method: "POST",
            headers: {
              Authorization: `Bearer ${process.env.NEXT_PUBLIC_OPENROUTER_API_KEY}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              model: "google/gemma-3-27b-it:free", // fast + free
              messages: [
                {
                  role: "system",
                  content:
                    "You are an intent classifier. Decide if the user wants to see a PLACE ON THE MAP (respond with 'map') or if it's a GENERAL QUESTION (respond with 'qa'). Respond with only one word: 'map' or 'qa'.",
                },
                { role: "user", content: userText },
              ],
            }),
          }
        );

        const intentData = await intentResponse.json();
        const rawIntent = intentData?.choices?.[0]?.message?.content
          ?.toLowerCase()
          .trim();
        if (rawIntent === "map" || rawIntent === "qa") {
          intent = rawIntent;
        }
      } catch (err) {
        console.warn("Intent classification failed, defaulting to qa", err);
      }

      // --- Step 2: If intent is map → run SafeGIS Agent ---
      if (intent === "map") {
        try {
          await AgentFns.runAgent(userText, mapRef, (role, content) => {
            setMessages((prev) => [...prev, { role, content }]);
          });
          agentHandled = true;
        } catch (agentErr) {
          console.error("Agent error:", agentErr);
          setMessages((prev) => [
            ...prev,
            { role: "assistant", content: "Agent failed: " + String(agentErr) },
          ]);
        }
      }

      // --- Step 3: If not handled by agent → normal LLM Q&A ---
      if (!agentHandled) {
        const response = await fetch(
          "https://openrouter.ai/api/v1/chat/completions",
          {
            method: "POST",
            headers: {
              Authorization: `Bearer ${process.env.NEXT_PUBLIC_OPENROUTER_API_KEY}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              model:
                selectedModel === "Gemma 3 27B"
                  ? "google/gemma-3-27b-it:free"
                  : "deepseek/deepseek-r1-0528:free",
              messages: [
                {
                  role: "system",
                  content:
                    "You are SafeGIS AI. Only answer questions related to disaster management, GIS, and mapping. If the user asks about unrelated topics, politely refuse and remind them you are specialized only in these domains.",
                },
                ...newMessages,
              ],
            }),
          }
        );

        const data = await response.json();
        const aiMessage =
          data?.choices?.[0]?.message?.content ||
          "Sorry, I couldn’t generate a response.";

        const formattedMessage = aiMessage
          .split("\n")
          .map((line: string) => line.trim())
          .join("\n\n");

        setMessages((prev) => [
          ...prev,
          { role: "assistant", content: formattedMessage },
        ]);
      }
    } catch (err) {
      console.error("Error in handleSend:", err);
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: "Error: Failed to connect to SafeGIS AI.",
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleNewSession = () => {
    setMessages([]);
    setInputText("");
    setLoading(false);
  };

  const toggleModelDropdown = () => setModelDropdownOpen(!modelDropdownOpen);

  const handleModelSelect = (model: string) => {
    setSelectedModel(model);
    setModelDropdownOpen(false);
  };

  return (
    <div
      className={`absolute bottom-[18px] right-[109px] w-[400px] rounded-[15px] z-50 shadow-md origin-bottom-right flex flex-col
    ${
      isVisible
        ? "opacity-100 scale-100 pointer-events-auto transition-all duration-300 ease-out"
        : "opacity-0 scale-75 pointer-events-none transition-all duration-150 ease-in"
    } py-3`} // <-- Added equal padding top & bottom
      style={{
        height: "calc(100% - 2 * 220px)",
        background: "linear-gradient(to bottom, #5A5C99, #232323)",
        overflow: "hidden",
      }}
    >
      <div className="flex-1 flex flex-col overflow-hidden bg-transparent">
        {messages.length === 0 && (
          <div
            className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none px-6"
            style={{ transform: "translateY(-50px)" }} // slightly down
          >
            <img
              src="/Images/SafeGIS-AI-Logo.png"
              alt="SafeGIS AI Logo"
              className="opacity-50 w-[120px]"
            />
            <p className="text-white opacity-70 text-[20px] font-semibold mt-[12px]">
              SafeGIS AI
            </p>
            <p className="text-[#C7C7C7] text-[14px] font-[400] mt-[8px] mb-[80px]">
              Need assistance? Ask away!
            </p>
          </div>
        )}

        {/* Messages Container */}
        <div className="flex-1 p-4 overflow-y-auto space-y-3 relative custom-scrollbar bg-transparent pb-[180px]">
          {messages.map((msg, idx) => (
            <div
              key={idx}
              className={`flex ${
                msg.role === "user" ? "justify-end" : "justify-center"
              }`}
            >
              <div
                className={`p-4 prose prose-invert break-words select-text ${
                  msg.role === "user"
                    ? "bg-[#3e3f68] text-white rounded-xl max-w-[75%]"
                    : "text-[#C7C7C7] w-full px-2 bg-transparent"
                }`}
              >
                <ReactMarkdown
                  components={{
                    p: ({ node, ...props }) => (
                      <p
                        className="mb-4 leading-relaxed text-[14px]" // <-- changed from text-base
                        {...props}
                      />
                    ),
                    li: ({ node, ...props }) => (
                      <li className="ml-6 list-disc text-[14px]" {...props} /> // optional for list items
                    ),
                  }}
                >
                  {msg.content}
                </ReactMarkdown>
              </div>
            </div>
          ))}
          {loading && <ThinkingLoader />}
          <div ref={chatEndRef} />
        </div>

        {/* Floating Bottom Chat Bar */}
        <div
          className="absolute bottom-4 left-1/2 transform -translate-x-1/2 p-[10px] flex flex-col gap-2 flex-shrink-0
                        w-[370px] bg-white/5 backdrop-blur-xl border border-white/10 rounded-xl shadow-lg"
        >
          <div className="flex justify-between items-center mb-1">
            {/* Model Dropdown */}
            <div className="relative">
              <button
                ref={dropdownButtonRef}
                onClick={toggleModelDropdown}
                className="flex items-center justify-between px-3 py-1 bg-[#2E2E2E]/80 rounded-md text-white text-[13px] hover:bg-[#3a3a3a]/80 transition min-w-[200px]"
              >
                <span className="flex-1 text-left pr-2">
                  {selectedModel}
                  {selectedModel === "Gemma 3 27B" ? " (Default)" : ""}
                </span>
                {modelDropdownOpen ? (
                  <ChevronDown size={16} />
                ) : (
                  <ChevronUp size={16} />
                )}
              </button>

              {modelDropdownOpen && (
                <div
                  className="absolute bottom-full left-0 mb-1 bg-[#2E2E2E]/90 rounded-md shadow-lg z-50"
                  style={{ width: dropdownButtonRef.current?.offsetWidth }}
                >
                  {["Gemma 3 27B", "DeepSeek: R1 0528"].map(
                    (model, idx, arr) => (
                      <div
                        key={model}
                        onClick={() => handleModelSelect(model)}
                        className={`px-3 py-2 cursor-pointer text-white text-[13px] hover:bg-[#3a3a3a] transition
                          ${idx === 0 ? "rounded-t-md" : ""}
                          ${idx === arr.length - 1 ? "rounded-b-md" : ""}`}
                      >
                        {model}
                        {model === "Gemma 3 27B" ? " (Default)" : ""}
                      </div>
                    )
                  )}
                </div>
              )}
            </div>

            {/* Buttons */}
            <div className="flex gap-2">
              <button
                onClick={handleNewSession}
                className="text-white hover:text-gray-200"
              >
                <MessageCirclePlus size={20} />
              </button>
              <button className="text-white hover:text-gray-200">
                <History size={20} />
              </button>
              <button
                onClick={() => setIsExpanded((prev) => !prev)}
                className="text-white hover:text-gray-200"
              >
                <Expand size={20} />
              </button>
            </div>
          </div>

          {/* Input with integrated Send button container */}
          <div className="flex flex-col w-full h-[110px] bg-white/5 backdrop-blur-xl rounded-xl shadow-lg p-1.5 border-animated">
            {/* Scrollable Textarea */}
            <textarea
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  handleSend();
                }
              }}
              placeholder="Ask a question or define a task..."
              className="flex-1 resize-none overflow-y-auto bg-transparent text-[#C7C7C7] placeholder-[#C7C7C7]/70 text-[14px] rounded-md px-2 py-1 outline-none border-none custom-scrollbar"
            />

            {/* Button Row */}
            <div className="flex justify-between mt-1.5">
              {/* Plus Button on the far left */}
              <button
                onClick={() => console.log("Plus button clicked")}
                className="h-8 w-8 flex items-center justify-center rounded-lg text-white hover:text-gray-200 transition bg-transparent"
              >
                <Plus size={18} />
              </button>

              {/* Right-side buttons: Mic and Send */}
              <div className="flex gap-1">
                {/* Mic Button */}
                <button
                  onClick={() => console.log("Mic button clicked")}
                  className="h-8 w-8 flex items-center justify-center rounded-lg text-white hover:text-gray-200 transition bg-transparent"
                >
                  <Mic size={18} />
                </button>

                {/* Send Button */}
                <button
                  onClick={handleSend}
                  disabled={loading || !inputText.trim()}
                  className={`h-8 w-8 flex items-center justify-center rounded-lg text-white transition
        ${
          loading || !inputText.trim()
            ? "bg-[#676767] opacity-50 cursor-not-allowed"
            : "bg-[#676767] hover:bg-[#737373]"
        }`}
                >
                  <ArrowUp size={18} />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
