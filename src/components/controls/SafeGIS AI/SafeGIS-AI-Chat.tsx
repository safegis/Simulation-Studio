"use client";
import { useEffect, useState, useRef } from "react";
import {
  History,
  Expand,
  Plus,
  ArrowUp,
  MessageCirclePlus,
  Mic,
  Globe,
} from "lucide-react";
import ReactMarkdown from "react-markdown";
import AgentFns from "./Agent Functions/Map-Search";
import ViewSwitchAgent from "./Agent Functions/SwitchMapView";
import { runQandA } from "./Agent Functions/QandA";

type Props = {
  isVisible: boolean;
  mapRef?: any;
  toggleChat: () => void;
  // New props for view switching
  viewMode?: "2d" | "3d";
  switchTo2D?: () => void;
  switchTo3D?: () => void;
  setViewMode?: (mode: "2d" | "3d") => void;
};

type Message = {
  role: "user" | "assistant";
  content: string;
};

// Loader
function ThinkingLoader() {
  return (
    <div className="flex flex-col items-center justify-center py-4">
      <div className="relative w-28 h-28">
        {/* Centered spinning circles */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-12 h-12 z-10">
          {/* Outer solid spinner */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-12 h-12 rounded-full border-4 border-t-transparent border-[#9699FF] animate-spin-slow"></div>
          {/* Inner smaller dashed spinner */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-9 h-9 rounded-full border-2 border-dashed border-[#C7C7C7] animate-spin-reverse"></div>
        </div>

        {/* Orbiting dots with breathing effect */}
        <div className="absolute top-1/2 left-1/2 w-full h-full">
          <div className="absolute w-3 h-3 bg-[#9699FF] rounded-full animate-orbit-breath-0 -translate-x-1/2 -translate-y-1/2"></div>
          <div className="absolute w-3 h-3 bg-[#C7C7C7] rounded-full animate-orbit-breath-90 -translate-x-1/2 -translate-y-1/2"></div>
          <div className="absolute w-3 h-3 bg-[#5A5C99] rounded-full animate-orbit-breath-180 -translate-x-1/2 -translate-y-1/2"></div>
          <div className="absolute w-3 h-3 bg-[#ffffff] rounded-full animate-orbit-breath-270 -translate-x-1/2 -translate-y-1/2"></div>
        </div>
      </div>

      {/* Loading text */}
      <p className="mt-4 mb-6 text-[#C7C7C7] text-sm animate-pulse text-center">
        SafeGIS AI is mapping your query...
      </p>
    </div>
  );
}

export default function SafeGISAIChat({
  isVisible,
  mapRef,
  toggleChat,
  viewMode = "2d",
  switchTo2D,
  switchTo3D,
  setViewMode,
}: Props) {
  const [animateVisible, setAnimateVisible] = useState(false);
  const [isHiding, setIsHiding] = useState(false);
  const [inputText, setInputText] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const chatEndRef = useRef<HTMLDivElement | null>(null);
  const [webSearchEnabled, setWebSearchEnabled] = useState(false);

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

  if (!isVisible && !animateVisible) {
    return (
      <>
        {/* SafeGIS AI Chat Button */}
        <button
          onClick={toggleChat}
          className="absolute bottom-[18px] right-[18px] w-18 h-18 rounded-[15px] z-50 shadow-md flex items-center justify-center transition-all duration-300"
          style={{
            background: "linear-gradient(to bottom, #5A5C99, #232323)",
          }}
        >
          <img
            src="/Images/Feature-Icons/SafeGIS-AI-Logo.png"
            alt="SafeGIS AI Logo"
            className="w-12 h-12 -mt-[2.5px]"
          />
        </button>
      </>
    );
  }

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

      // Default intent
      let intent: "map" | "view" | "qa" = "qa";

      try {
        const intentResponse = await fetch(
          process.env.NEXT_PUBLIC_MODEL_ENDPOINT!,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              prompt: `
You are an intent classifier for a mapping application. 
Return ONE WORD ONLY: map, view, or qa. 
Do not explain. Do not add punctuation. Do not add sentences. 
If you output anything else, the system will fail. 

Rules:
1. 'view' → when the user wants to CHANGE HOW THE MAP IS DISPLAYED.  
   - Keywords: "2D", "3D", "2d", "3d", "perspective", "satellite view",
     "terrain view", "street view", "rotate map", "tilt map", 
     "switch view", "switch to [mode]", "display in [mode]",
     "enable [mode]", "turn on/off 3D", "map orientation".
   - If both a location AND a view are mentioned (e.g., "show New York in 3D"), classify as 'view'.

2. 'map' → when the user wants to SEARCH FOR OR DISPLAY A SPECIFIC LOCATION.  
   - Includes: city names, landmarks, addresses.
   - Phrases: "show me [place]", "go to [place]", "find [location]".
   - Only choose 'map' if no display/view change is requested.

3. 'qa' → everything else (general questions, explanations, non-map queries).

Decision hierarchy: 
- If both 'map' and 'view' apply → choose 'view'. 
- Else if location → 'map'. 
- Else → 'qa'.

Examples:
- "Now I want to see the map in 3D." → view
- "Switch to 2D mode" → view
- "Enable satellite view" → view
- "Rotate the map perspective" → view
- "Show me Paris" → map
- "Go to Tokyo station" → map
- "What is GIS?" → qa
- "Show New York in 3D" → view

Respond with ONLY:
map
view
qa

Nothing else.

User: ${userText}
`,
              max_tokens: 4,
            }),
          }
        );

        const intentData = await intentResponse.json();
        let rawIntent = intentData?.response?.toLowerCase().trim();

        // Safety filter – only accept exact values
        if (rawIntent === "map" || rawIntent === "view" || rawIntent === "qa") {
          intent = rawIntent;
        } else {
          console.warn(
            "Invalid classifier output, defaulting to qa:",
            rawIntent
          );
          intent = "qa";
        }
      } catch (err) {
        console.warn("Intent classification failed, defaulting to qa", err);
      }

      // Handle intents
      if (intent === "view") {
        if (switchTo2D && switchTo3D && setViewMode) {
          const viewSwitchHandled = await ViewSwitchAgent.runViewSwitchAgent(
            userText,
            mapRef,
            {
              switchTo2D,
              switchTo3D,
              setViewMode,
            },
            (role, content) => {
              setMessages((prev) => [...prev, { role, content }]);
            },
            viewMode
          );
          agentHandled = viewSwitchHandled;
        }
      } else if (intent === "map") {
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

      // Default to Q&A if not handled by an agent
      if (!agentHandled) {
        const formattedMessage = await runQandA(newMessages, userText);
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

  return (
    <>
      <div
        className={`absolute bottom-[18px] right-[109px] w-[400px] rounded-[15px] z-50 shadow-md origin-bottom-right flex flex-col
        ${
          isVisible
            ? "opacity-100 scale-100 pointer-events-auto transition-all duration-300 ease-out"
            : "opacity-0 scale-75 pointer-events-none transition-all duration-150 ease-in"
        } py-3`}
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
              style={{ transform: "translateY(-50px)" }}
            >
              <img
                src="/Images/Feature-Icons/SafeGIS-AI-Logo.png"
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

          {/* Messages */}
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
                          className="mb-4 leading-relaxed text-[14px]"
                          {...props}
                        />
                      ),
                      li: ({ node, ...props }) => (
                        <li className="ml-6 list-disc text-[14px]" {...props} />
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

          {/* Chat Input */}
          <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 p-[10px] flex flex-col gap-2 flex-shrink-0 w-[370px] bg-white/5 backdrop-blur-xl border border-white/10 rounded-xl shadow-lg">
            <div className="flex justify-between items-center mb-0.5">
              {/* Web Search */}
              <button
                onClick={() => setWebSearchEnabled((prev) => !prev)}
                className={`px-[8px] py-[17px] text-[13px] rounded-lg border transition-all duration-200 flex items-center justify-center h-[32px] gap-1.5 ${
                  webSearchEnabled
                    ? "bg-[#5A5C99]/35 border-[#8183c8] text-[#c6c8fb]"
                    : "bg-white/5 border-white/20 text-white/70 hover:text-white"
                }`}
              >
                <Globe size={16} />
                Web Search
              </button>

              {/* Actions */}
              <div className="flex items-center">
                <button
                  onClick={handleNewSession}
                  className="text-white hover:text-gray-200 h-[32px] w-[32px] flex items-center justify-center"
                >
                  <MessageCirclePlus size={20} />
                </button>
                <button className="text-white hover:text-gray-200 h-[32px] w-[32px] flex items-center justify-center">
                  <History size={20} />
                </button>
                <button
                  onClick={() => setIsExpanded((prev) => !prev)}
                  className="text-white hover:text-gray-200 h-[32px] w-[32px] flex items-center justify-center"
                >
                  <Expand size={20} />
                </button>
              </div>
            </div>

            {/* Textarea */}
            <div className="flex flex-col w-full h-[110px] bg-white/5 backdrop-blur-xl rounded-xl shadow-lg p-1.5 border-animated">
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
              <div className="flex justify-between mt-1.5">
                <button
                  onClick={() => console.log("Plus button clicked")}
                  className="h-8 w-8 flex items-center justify-center rounded-lg text-white hover:text-gray-200 transition bg-transparent"
                >
                  <Plus size={18} />
                </button>
                <div className="flex gap-1">
                  <button
                    onClick={() => console.log("Mic button clicked")}
                    className="h-8 w-8 flex items-center justify-center rounded-lg text-white hover:text-gray-200 transition bg-transparent"
                  >
                    <Mic size={18} />
                  </button>
                  <button
                    onClick={handleSend}
                    disabled={loading || !inputText.trim()}
                    className={`h-8 w-8 flex items-center justify-center rounded-lg text-white transition ${
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

      {/* Chat Button when Open */}
      <button
        onClick={toggleChat}
        className="absolute bottom-[18px] right-[18px] w-18 h-18 rounded-[15px] z-50 shadow-md flex items-center justify-center transition-all duration-300"
        style={{
          background: "linear-gradient(to bottom, #6B6DCC, #2E2E2E)",
        }}
      >
        <img
          src="/Images/Feature-Icons/SafeGIS-AI-Logo.png"
          alt="SafeGIS AI Logo"
          className="w-12 h-12 -mt-[2.5px]"
        />
      </button>
    </>
  );
}
