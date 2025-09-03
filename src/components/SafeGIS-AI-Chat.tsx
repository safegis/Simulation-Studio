"use client";

import { useEffect, useState, useRef } from "react";
import { Send, History, Expand, Plus } from "lucide-react";
import ReactMarkdown from "react-markdown";

type Props = {
  isVisible: boolean;
};

type Message = {
  role: "user" | "assistant";
  content: string;
};

// 🔹 Unique Loader Component
function ThinkingLoader() {
  return (
    <div className="flex flex-col items-center justify-center py-4">
      {/* Parent container for globe + satellites */}
      <div className="relative w-28 h-28">
        {/* Center spinning globe */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-12 h-12 z-10">
          <div className="absolute inset-0 rounded-full border-4 border-t-transparent border-[#9699FF] animate-spin-slow"></div>
          <div className="absolute inset-[6px] rounded-full border-2 border-dashed border-[#C7C7C7] animate-spin-reverse"></div>
        </div>

        {/* Orbiting satellites */}
        <div className="absolute top-1/2 left-1/2 w-full h-full">
          <div className="absolute w-3 h-3 bg-[#9699FF] rounded-full animate-orbit-0 -translate-x-1/2 -translate-y-1/2"></div>
          <div className="absolute w-3 h-3 bg-[#C7C7C7] rounded-full animate-orbit-90 -translate-x-1/2 -translate-y-1/2"></div>
          <div className="absolute w-3 h-3 bg-[#5A5C99] rounded-full animate-orbit-180 -translate-x-1/2 -translate-y-1/2"></div>
          <div className="absolute w-3 h-3 bg-[#ffffff] rounded-full animate-orbit-270 -translate-x-1/2 -translate-y-1/2"></div>
        </div>
      </div>

      <p className="mt-10 text-[#C7C7C7] text-sm animate-pulse text-center">
        SafeGIS AI is mapping your answer...
      </p>
    </div>
  );
}

export default function SafeGISAIChat({ isVisible }: Props) {
  const [animateVisible, setAnimateVisible] = useState(false);
  const [isHiding, setIsHiding] = useState(false);
  const [inputText, setInputText] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);

  const chatEndRef = useRef<HTMLDivElement | null>(null);

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    if (chatEndRef.current) {
      chatEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
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

    const newMessages: Message[] = [
      ...messages,
      { role: "user", content: inputText },
    ];
    setMessages(newMessages);
    setInputText("");
    setLoading(true);

    try {
      const response = await fetch(
        "https://openrouter.ai/api/v1/chat/completions",
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${process.env.NEXT_PUBLIC_OPENROUTER_API_KEY}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            model: "google/gemma-3-27b-it:free",
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
    } catch (err) {
      console.error("Error fetching AI response:", err);
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

  // 🔹 Reset the chat (new session)
  const handleNewSession = () => {
    setMessages([]);
    setInputText("");
    setLoading(false);
  };

  return (
    <div
      className={`absolute bottom-[18px] right-[109px] w-[400px] rounded-[15px] z-50 shadow-md origin-bottom-right flex
        ${
          isVisible
            ? "opacity-100 scale-100 pointer-events-auto transition-all duration-300 ease-out"
            : "opacity-0 scale-75 pointer-events-none transition-all duration-150 ease-in"
        }`}
      style={{
        height: "calc(100% - 2 * 220px)",
        background: "linear-gradient(to bottom, #5A5C99, #232323)",
        overflow: "hidden",
      }}
    >
      {/* Sidebar */}
      <div
        className="w-[45px] flex flex-col items-center py-3 space-y-5"
        style={{ backgroundColor: "#9699FF50" }}
      >
        {/* Show SafeGIS logo only when there are messages */}
        {messages.length > 0 && (
          <img
            src="/Images/SafeGIS-AI-Logo.png"
            alt="SafeGIS AI Logo"
            className="w-[30px]"
          />
        )}

        {/* 🔹 Plus button to reset chat */}
        <button
          onClick={handleNewSession}
          className="text-white hover:text-gray-200"
        >
          <Plus size={20} />
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

      {/* Chat container */}
      <div className="flex-1 flex flex-col justify-between">
        {/* Logo + intro text only when no messages */}
        {messages.length === 0 && (
          <div
            className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none"
            style={{ left: "45px", width: "calc(100% - 45px)" }}
          >
            <img
              src="/Images/SafeGIS-AI-Logo.png"
              alt="SafeGIS AI Logo"
              className="opacity-50 w-[130px]"
            />
            <p className="text-white opacity-70 text-[22px] font-semibold mt-[12px]">
              SafeGIS AI
            </p>
            <p className="text-[#C7C7C7] text-[15px] font-[400] mt-[8px] mb-[70px]">
              Need assistance? Ask away!
            </p>
          </div>
        )}

        {/* Chat content */}
        <div className="flex-1 p-4 overflow-y-auto space-y-3 relative custom-scrollbar">
          {messages.map((msg, idx) => (
            <div
              key={idx}
              className={`flex ${
                msg.role === "user" ? "justify-end" : "justify-center"
              }`}
            >
              <div
                className={`p-4 prose prose-invert break-words ${
                  msg.role === "user"
                    ? "bg-[#3e3f68] text-white rounded-xl max-w-[75%]"
                    : "text-[#C7C7C7] w-full px-2"
                }`}
              >
                <ReactMarkdown
                  components={{
                    p: ({ node, ...props }) => (
                      <p
                        className="mb-4 leading-relaxed text-base"
                        {...props}
                      />
                    ),
                    li: ({ node, ...props }) => (
                      <li className="ml-6 list-disc" {...props} />
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

        {/* Input area */}
        <div className="p-4">
          <div className="flex items-center gap-2">
            <input
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  handleSend();
                }
              }}
              placeholder="Ask a question or define a task..."
              className="flex-1 h-[50px] bg-transparent text-[#C7C7C7] text-sm placeholder-[#C7C7C7]/70 
                          border-[2px] border-[#C7C7C7] rounded-md outline-none px-3 placeholder:text-sm"
            />
            <button
              onClick={handleSend}
              disabled={loading}
              className="h-[50px] w-[50px] flex items-center justify-center border-[2px] border-[#C7C7C7] rounded-md text-[#C7C7C7] hover:text-white hover:border-white transition disabled:opacity-50"
            >
              <Send size={19} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
