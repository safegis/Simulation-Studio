// SafeGIS-AI-Chat.tsx
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
  CircleStop,
} from "lucide-react";
import ReactMarkdown from "react-markdown";
import AgentFns from "./Agent Functions/Map-Search";
import ViewSwitchAgent from "./Agent Functions/SwitchMapView";
import MapStyleAgent from "./Agent Functions/SwitchMapStyle";
import EarthquakeAgent from "./Agent Functions/Control Hazard Layers/Toggle-Earthquake";
import VolcanoListAgent from "./Agent Functions/Control Hazard Layers/Toggle-VolcanoList";
import ActiveFaultsAgent from "./Agent Functions/Control Hazard Layers/Toggle-ActiveFaults";
import CongestionAgent from "./Agent Functions/Control Hazard Layers/Toggle-Congestion";
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
  // props for map style switching
  selectedMapStyle?: string;
  handleMapStyleChange?: (style: string) => void;
  // Earthquake control callbacks
  earthquakeControlCallbacks?: {
    enableEarthquakeHazard: () => void;
    disableEarthquakeHazard: () => void;
    isEarthquakeEnabled: () => boolean;
    stopEarthquakePolling?: () => void;
    openToolPanel?: () => void;
    selectHazardLayers?: () => void;
    expandHazardLayersDropdown?: () => void;
    expandGeologicalDropdown?: () => void;
  };
  // Volcano list control callbacks
  volcanoListControlCallbacks?: {
    enableVolcanoList: () => void;
    disableVolcanoList: () => void;
    isVolcanoListEnabled: () => boolean;
    openToolPanel?: () => void;
    selectHazardLayers?: () => void;
    expandHazardLayersDropdown?: () => void;
    expandGeologicalDropdown?: () => void;
  };
  // Active faults control callbacks
  activeFaultsControlCallbacks?: {
    enableActiveFaults: () => void;
    disableActiveFaults: () => void;
    isActiveFaultsEnabled: () => boolean;
    openToolPanel?: () => void;
    selectHazardLayers?: () => void;
    expandHazardLayersDropdown?: () => void;
    expandGeologicalDropdown?: () => void;
  };
  // Congestion control callbacks
  congestionControlCallbacks?: {
    enableCongestion: () => void;
    disableCongestion: () => void;
    isCongestionEnabled: () => boolean;
    stopCongestionPolling?: () => void;
    getCongestionSharedRefs?: () => {
      intervalId: NodeJS.Timeout | null;
      timerId: number | null;
      boundsCallback: ((bbox: [number, number, number, number]) => void) | null;
    };
    openToolPanel?: () => void;
    selectHazardLayers?: () => void;
    expandHazardLayersDropdown?: () => void;
    expandTrafficDropdown?: () => void;
  };
};

type Message = {
  role: "user" | "assistant";
  content: string;
};

// Utility function to convert AudioBuffer to WAV format
const audioBufferToWav = (buffer: AudioBuffer): ArrayBuffer => {
  const length = buffer.length;
  const numberOfChannels = buffer.numberOfChannels;
  const sampleRate = buffer.sampleRate;
  const bytesPerSample = 2;
  const blockAlign = numberOfChannels * bytesPerSample;
  const byteRate = sampleRate * blockAlign;
  const dataSize = length * blockAlign;
  const bufferSize = 44 + dataSize;

  const arrayBuffer = new ArrayBuffer(bufferSize);
  const view = new DataView(arrayBuffer);

  // WAV header
  const writeString = (offset: number, string: string) => {
    for (let i = 0; i < string.length; i++) {
      view.setUint8(offset + i, string.charCodeAt(i));
    }
  };

  writeString(0, "RIFF"); // ChunkID
  view.setUint32(4, bufferSize - 8, true); // ChunkSize
  writeString(8, "WAVE"); // Format
  writeString(12, "fmt "); // Subchunk1ID
  view.setUint32(16, 16, true); // Subchunk1Size
  view.setUint16(20, 1, true); // AudioFormat (PCM)
  view.setUint16(22, numberOfChannels, true); // NumChannels
  view.setUint32(24, sampleRate, true); // SampleRate
  view.setUint32(28, byteRate, true); // ByteRate
  view.setUint16(32, blockAlign, true); // BlockAlign
  view.setUint16(34, 16, true); // BitsPerSample
  writeString(36, "data"); // Subchunk2ID
  view.setUint32(40, dataSize, true); // Subchunk2Size

  // Convert audio data
  let offset = 44;
  for (let channel = 0; channel < numberOfChannels; channel++) {
    const channelData = buffer.getChannelData(channel);
    for (let i = 0; i < length; i++) {
      const sample = Math.max(-1, Math.min(1, channelData[i]));
      view.setInt16(
        offset,
        sample < 0 ? sample * 0x8000 : sample * 0x7fff,
        true
      );
      offset += 2;
    }
  }

  return arrayBuffer;
};

// Utility function to convert audio to WAV format
const convertToWav = async (audioBlob: Blob): Promise<Blob> => {
  return new Promise((resolve, reject) => {
    const audioContext = new (window.AudioContext ||
      (window as any).webkitAudioContext)();
    const fileReader = new FileReader();

    fileReader.onload = async (event) => {
      try {
        const arrayBuffer = event.target?.result as ArrayBuffer;
        const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);

        // Convert to WAV
        const wavBuffer = audioBufferToWav(audioBuffer);
        const wavBlob = new Blob([wavBuffer], { type: "audio/wav" });
        resolve(wavBlob);
      } catch (error) {
        reject(error);
      }
    };

    fileReader.onerror = () => reject(new Error("Failed to read audio file"));
    fileReader.readAsArrayBuffer(audioBlob);
  });
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
  selectedMapStyle = "Default (Custom Mapbox Standard)",
  handleMapStyleChange,
  earthquakeControlCallbacks,
  volcanoListControlCallbacks,
  activeFaultsControlCallbacks,
  congestionControlCallbacks,
}: Props) {
  const [animateVisible, setAnimateVisible] = useState(false);
  const [isHiding, setIsHiding] = useState(false);
  const [inputText, setInputText] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const chatEndRef = useRef<HTMLDivElement | null>(null);
  const [webSearchEnabled, setWebSearchEnabled] = useState(false);

  // Voice recording state
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessingAudio, setIsProcessingAudio] = useState(false);
  const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(
    null
  );
  const [audioChunks, setAudioChunks] = useState<Blob[]>([]);

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

  // Helper functions
  const getTextareaPlaceholder = () => {
    if (isRecording) {
      return "🎤 Recording... Speak now";
    }
    if (isProcessingAudio) {
      return "🔄 Processing your voice input...";
    }
    return "Ask a question or define a task...";
  };

  const isTextareaDisabled = isRecording || isProcessingAudio || loading;

  // Voice recording functions
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          sampleRate: 16000, // Standard rate for speech recognition
          channelCount: 1, // Mono audio
          echoCancellation: true,
          noiseSuppression: true,
        },
      });

      // Use explicit MIME type for better compatibility
      const options = {
        mimeType: "audio/webm;codecs=opus",
      };

      // Fallback if webm is not supported
      if (!MediaRecorder.isTypeSupported(options.mimeType)) {
        options.mimeType = "audio/mp4";
      }

      const recorder = new MediaRecorder(stream, options);
      const chunks: Blob[] = [];

      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunks.push(event.data);
        }
      };

      recorder.onstop = async () => {
        setIsProcessingAudio(true);
        try {
          const audioBlob = new Blob(chunks, { type: recorder.mimeType });

          // Convert to WAV format before sending
          const wavBlob = await convertToWav(audioBlob);
          await transcribeAudio(wavBlob);
        } catch (error) {
          console.error("Error processing audio:", error);
          alert("Failed to process audio. Please try again.");
        } finally {
          // Stop all tracks to release microphone
          stream.getTracks().forEach((track) => track.stop());
          setIsProcessingAudio(false);
        }
      };

      setMediaRecorder(recorder);
      setAudioChunks(chunks);
      recorder.start();
      setIsRecording(true);
    } catch (error) {
      console.error("Error starting recording:", error);
      alert("Could not access microphone. Please check your permissions.");
    }
  };

  const stopRecording = () => {
    if (mediaRecorder && mediaRecorder.state === "recording") {
      mediaRecorder.stop();
      setIsRecording(false);
    }
  };

  const transcribeAudio = async (audioBlob: Blob) => {
    try {
      const formData = new FormData();
      formData.append("audio", audioBlob, "recording.wav");

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_MODEL_ENDPOINT?.replace(
          "/generate",
          "/transcribe"
        )}`,
        {
          method: "POST",
          body: formData,
        }
      );

      const data = await response.json();

      if (data.success && data.transcription) {
        setInputText(data.transcription);
      } else {
        console.error("Transcription failed:", data.error);
        alert(`Transcription failed: ${data.error || "Unknown error"}`);
      }
    } catch (error) {
      console.error("Error transcribing audio:", error);
      alert("Failed to transcribe audio. Please try again.");
    }
  };

  const handleVoiceButtonClick = () => {
    if (isRecording) {
      stopRecording();
    } else {
      startRecording();
    }
  };

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

  // Replace the handleSend function in your SafeGIS-AI-Chat.tsx with this updated version

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

      // Use embedding-based intent classification
      let intent:
        | "earthquake"
        | "volcano"
        | "activefaults"
        | "congestion"
        | "map"
        | "view"
        | "mapstyle"
        | "qa" = "qa";

      try {
        console.log("Classifying intent with embeddings for:", userText);

        const intentResponse = await fetch(
          `${process.env.NEXT_PUBLIC_MODEL_ENDPOINT?.replace(
            "/generate",
            "/classify-intent"
          )}`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              prompt: userText,
            }),
          }
        );

        const intentData = await intentResponse.json();

        if (intentData.error) {
          console.warn("Intent classification error:", intentData.error);
          intent = "qa"; // Safe fallback
        } else {
          const classifiedIntent = intentData.intent;

          // Log similarity scores for debugging
          console.log("Intent similarities:", intentData.similarities);

          // Validate the classified intent
          if (
            classifiedIntent === "map" ||
            classifiedIntent === "view" ||
            classifiedIntent === "mapstyle" ||
            classifiedIntent === "earthquake" ||
            classifiedIntent === "volcano" ||
            classifiedIntent === "activefaults" ||
            classifiedIntent === "congestion" ||
            classifiedIntent === "qa"
          ) {
            intent = classifiedIntent;
            console.log("Classified intent:", intent);
          } else {
            console.warn(
              "Invalid intent from classifier, defaulting to qa:",
              classifiedIntent
            );
            intent = "qa";
          }
        }
      } catch (err) {
        console.warn("Intent classification failed, defaulting to qa", err);
        intent = "qa";
      }

      // Handle intents (rest remains the same)
      if (intent === "earthquake") {
        if (earthquakeControlCallbacks) {
          const earthquakeHandled =
            await EarthquakeAgent.runEarthquakeHazardAgent(
              userText,
              mapRef,
              earthquakeControlCallbacks,
              (role, content) => {
                setMessages((prev) => [...prev, { role, content }]);
              }
            );
          agentHandled = earthquakeHandled;
        }
      } else if (intent === "volcano") {
        if (volcanoListControlCallbacks) {
          const volcanoHandled = await VolcanoListAgent.runVolcanoListAgent(
            userText,
            mapRef,
            volcanoListControlCallbacks,
            (role, content) => {
              setMessages((prev) => [...prev, { role, content }]);
            }
          );
          agentHandled = volcanoHandled;
        }
      } else if (intent === "activefaults") {
        if (activeFaultsControlCallbacks) {
          const activeFaultsHandled =
            await ActiveFaultsAgent.runActiveFaultsAgent(
              userText,
              mapRef,
              activeFaultsControlCallbacks,
              (role, content) => {
                setMessages((prev) => [...prev, { role, content }]);
              }
            );
          agentHandled = activeFaultsHandled;
        }
      } else if (intent === "congestion") {
        if (congestionControlCallbacks) {
          const congestionHandled = await CongestionAgent.runCongestionAgent(
            userText,
            mapRef,
            congestionControlCallbacks,
            (role, content) => {
              setMessages((prev) => [...prev, { role, content }]);
            }
          );
          agentHandled = congestionHandled;
        }
      } else if (intent === "view") {
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
      } else if (intent === "mapstyle") {
        if (handleMapStyleChange) {
          const mapStyleHandled = await MapStyleAgent.runMapStyleAgent(
            userText,
            mapRef,
            {
              handleMapStyleChange,
            },
            (role, content) => {
              setMessages((prev) => [...prev, { role, content }]);
            },
            selectedMapStyle
          );
          agentHandled = mapStyleHandled;
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
                  if (e.key === "Enter" && !e.shiftKey && !isTextareaDisabled) {
                    e.preventDefault();
                    handleSend();
                  }
                }}
                placeholder={getTextareaPlaceholder()}
                disabled={isTextareaDisabled}
                className={`flex-1 resize-none overflow-y-auto bg-transparent text-[#C7C7C7] placeholder-[#C7C7C7]/70 text-[14px] rounded-md px-2 py-1 outline-none border-none custom-scrollbar ${
                  isTextareaDisabled ? "cursor-not-allowed opacity-60" : ""
                } ${isRecording ? "placeholder-orange-300" : ""} ${
                  isProcessingAudio ? "placeholder-blue-300" : ""
                }`}
              />

              <div className="flex justify-between mt-1.5">
                <button
                  onClick={() => console.log("Plus button clicked")}
                  className="h-8 w-8 flex items-center justify-center rounded-lg text-white hover:text-gray-200 transition bg-transparent"
                >
                  <Plus size={18} />
                </button>
                <div className="flex gap-2">
                  {/* Voice Prompt Button */}
                  <button
                    onClick={handleVoiceButtonClick}
                    disabled={isProcessingAudio}
                    className={`h-8 w-8 flex items-center justify-center rounded-lg text-white transition ${
                      isRecording
                        ? "bg-red-500 hover:bg-red-600"
                        : isProcessingAudio
                        ? "bg-[#8183c8] cursor-not-allowed opacity-60"
                        : "bg-transparent hover:text-gray-200"
                    }`}
                  >
                    {isRecording ? (
                      <CircleStop size={20} />
                    ) : isProcessingAudio ? (
                      <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                    ) : (
                      <Mic size={18} />
                    )}
                  </button>
                  {/* Send Prompt Button */}
                  <button
                    onClick={handleSend}
                    disabled={
                      loading ||
                      !inputText.trim() ||
                      isRecording ||
                      isProcessingAudio
                    }
                    className={`h-8 w-8 flex items-center justify-center rounded-lg text-white transition ${
                      loading ||
                      !inputText.trim() ||
                      isRecording ||
                      isProcessingAudio
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
