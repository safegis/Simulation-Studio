// \SafeGIS\Simulation-Studio\frontend\src\components\controls\SafeGIS AI\SafeGIS-AI-Chat.tsx
"use client";
import { useEffect, useState, useRef } from "react";

import {
  History,
  Expand,
  Minimize,
  Plus,
  ArrowUp,
  MessageCirclePlus,
  Mic,
  Globe,
  CircleStop,
  AtSign,
  ChevronDown,
  ChevronUp,
  ExternalLink,
} from "lucide-react";
import ReactMarkdown from "react-markdown";
import LangGraphAdapter, { LangGraphMessage } from "./LangGraphAdapter";

type Props = {
  isVisible: boolean;
  mapRef?: any;
  toggleChat: () => void;
  onExpandToggle?: (expanded: boolean) => void;
  isExpanded?: boolean;
  // New props for view switching
  viewMode?: "2d" | "3d";
  switchTo2D?: () => void;
  switchTo3D?: () => void;
  setViewMode?: (mode: "2d" | "3d") => void;
  // props for map style switching
  selectedMapStyle?: string;
  handleMapStyleChange?: (style: string) => void;
  // props for time of day control
  handleTimeOfDayChange?: (preset: string) => void;
  // Live Hazard Monitor control callbacks
  liveHazardMonitorCallbacks?: {
    openLiveHazardMonitor: () => void;
    expandEarthquakeSection: () => void;
    expandWeatherSection: () => void;
    selectEarthquakeSource: (sourceName: string) => void;
    selectWeatherSource: (sourceName: string) => void;
    getSelectedEarthquakeSources: () => string[];
    getSelectedWeatherSources: () => string[];
  };
  // Exposure Assessment control callbacks
  exposureAssessmentCallbacks?: {
    openExposureAssessment: () => void;
    selectHazardSource: (source: "existing" | "imported") => void;
    selectHazardData: (
      data: string[],
      source?: "existing" | "imported"
    ) => void;
    selectElementSource: (source: "existing" | "imported") => void;
    selectElementData: (
      data: string[],
      source?: "existing" | "imported"
    ) => void;
    runAnalysis: () => void;
    clearSteps: () => void;
  };
  // Uploaded files for exposure assessment
  uploadedFiles?: string[];
  // Pathfinder control callbacks
  pathfinderCallbacks?: {
    findRoute: (
      start: string,
      destination: string,
      mode: string
    ) => Promise<void>;
    changeRouteMode: (mode: string) => void;
    changeRouteSort: (sortBy: string) => void;
    openPathfinder: () => void;
    closePathfinder: () => void;
  };
};

type Message = {
  role: "user" | "assistant";
  content: string;
  citations?: Array<{
    number: number;
    title: string;
    url: string;
    author?: string;
    published_date?: string;
  }>;
};

// Citation Card Component
function CitationCard({
  citation,
}: {
  citation: {
    number: number;
    title: string;
    url: string;
    author?: string;
    published_date?: string;
  };
}) {
  // Extract domain from URL for display
  const getDomain = (url: string) => {
    try {
      const urlObj = new URL(url);
      return urlObj.hostname.replace("www.", "");
    } catch {
      return url;
    }
  };

  return (
    <div className="bg-white/5 border border-white/10 rounded-md p-2 hover:bg-white/10 transition-colors">
      <div className="flex items-start gap-2">
        <div className="flex-shrink-0 w-5 h-5 bg-[#5A5C99]/50 rounded-full flex items-center justify-center text-[9px] text-white font-semibold mt-0.5">
          {citation.number}
        </div>
        <div className="flex-1 min-w-0">
          <h4 className="text-white text-[10px] font-medium leading-tight mb-1 line-clamp-2">
            {citation.title}
          </h4>
          {citation.author && (
            <p className="text-[#C7C7C7] text-[9px] mb-1">{citation.author}</p>
          )}
          <a
            href={citation.url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-400 hover:text-blue-300 text-[9px] flex items-center gap-1 group"
          >
            <span className="truncate">{getDomain(citation.url)}</span>
            <ExternalLink
              size={9}
              className="flex-shrink-0 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform"
            />
          </a>
        </div>
      </div>
    </div>
  );
}

// Citations Section Component
function CitationsSection({
  citations,
}: {
  citations: Array<{
    number: number;
    title: string;
    url: string;
    author?: string;
    published_date?: string;
  }>;
}) {
  const [isExpanded, setIsExpanded] = useState(true);

  if (!citations || citations.length === 0) return null;

  return (
    <div className="mt-3 border-t border-white/10 pt-2">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="flex items-center justify-between w-full text-white hover:text-gray-200 transition-colors mb-2"
      >
        <div className="flex items-center gap-1.5">
          <span className="text-[10px] font-semibold">References</span>
          <span className="text-[9px] text-[#C7C7C7] bg-white/10 px-1.5 py-0.5 rounded-full">
            {citations.length}
          </span>
        </div>
        {isExpanded ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
      </button>
      {isExpanded && (
        <div className="space-y-2">
          {citations.map((citation) => (
            <CitationCard key={citation.number} citation={citation} />
          ))}
        </div>
      )}
    </div>
  );
}

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

// Loader with operation steps
function ThinkingLoader({ operations }: { operations: string[] }) {
  return (
    <div className="flex flex-col py-4">
      {/* Centered loading animation and text */}
      <div className="flex flex-col items-center justify-center">
        <div className="relative w-20 h-20 mt-5">
          {/* Centered spinning circles */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-9 h-9 z-10">
            {/* Outer solid spinner */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-9 h-9 rounded-full border-3 border-t-transparent border-[#9699FF] animate-spin-slow"></div>
            {/* Inner smaller dashed spinner */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-7 h-7 rounded-full border-2 border-dashed border-[#C7C7C7] animate-spin-reverse"></div>
          </div>
          {/* Orbiting dots with breathing effect */}
          <div className="absolute top-1/2 left-1/2 w-16 h-16">
            <div className="absolute w-2.5 h-2.5 bg-[#9699FF] rounded-full animate-orbit-breath-0 -translate-x-1/2 -translate-y-1/2"></div>
            <div className="absolute w-2.5 h-2.5 bg-[#C7C7C7] rounded-full animate-orbit-breath-90 -translate-x-1/2 -translate-y-1/2"></div>
            <div className="absolute w-2.5 h-2.5 bg-[#5A5C99] rounded-full animate-orbit-breath-180 -translate-x-1/2 -translate-y-1/2"></div>
            <div className="absolute w-2.5 h-2.5 bg-[#ffffff] rounded-full animate-orbit-breath-270 -translate-x-1/2 -translate-y-1/2"></div>
          </div>
        </div>
        {/* Loading text */}
        <p className="mt-8 mb-2 text-[#C7C7C7] text-[10px] animate-pulse text-center">
          Atlas is mapping your query...
        </p>
      </div>

      {/* Operation steps - centered with wider containers */}
      {operations.length > 0 && (
        <div className="mt-4 mb-4 space-y-1.5 w-full flex flex-col items-center px-2">
          {operations.map((operation, index) => (
            <div
              key={index}
              className="bg-white/5 rounded-md px-3 py-2 flex items-start gap-2 text-[9px] text-[#C7C7C7]/90 animate-fade-in border border-white/5 w-full max-w-[calc(100%-8px)]"
              style={{
                animationDelay: `${index * 100}ms`,
              }}
            >
              <span className="text-[#9699FF] mt-0.5 flex-shrink-0">•</span>
              <span className="flex-1">{operation}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default function SafeGISAIChat({
  isVisible,
  mapRef,
  toggleChat,
  onExpandToggle,
  isExpanded: isExpandedProp = false,
  viewMode = "2d",
  switchTo2D,
  switchTo3D,
  setViewMode,
  selectedMapStyle = "Default (Custom Mapbox Standard)",
  handleMapStyleChange,
  handleTimeOfDayChange,
  liveHazardMonitorCallbacks,
  exposureAssessmentCallbacks,
  uploadedFiles = [],
  pathfinderCallbacks,
}: Props) {
  const [animateVisible, setAnimateVisible] = useState(false);
  const [inputText, setInputText] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [conversationHistory, setConversationHistory] = useState<
    LangGraphMessage[]
  >([]);
  const [operationSteps, setOperationSteps] = useState<string[]>([]);

  // Sync internal state with prop
  useEffect(() => {
    setIsExpanded(isExpandedProp);
  }, [isExpandedProp]);
  const chatEndRef = useRef<HTMLDivElement | null>(null);
  const [webSearchEnabled, setWebSearchEnabled] = useState(false);

  // Voice recording state
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessingAudio, setIsProcessingAudio] = useState(false);
  const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(
    null
  );

  useEffect(() => {
    if (chatEndRef.current)
      chatEndRef.current.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading, operationSteps]);

  useEffect(() => {
    if (isVisible) {
      setAnimateVisible(true);
    } else {
      const timeout = setTimeout(() => {
        setAnimateVisible(false);
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
        {/* Atlas Chat Button */}
        <button
          onClick={toggleChat}
          className="absolute bottom-[15px] right-[15px] w-13 h-13 rounded-md z-50 shadow-md flex items-center justify-center transition-all duration-300"
          style={{
            background: "linear-gradient(to bottom, #5A5C99, #232323)",
          }}
        >
          <img
            src="/Images/Feature-Icons/SafeGIS-AI-Logo.png"
            alt="Atlas Logo"
            className="w-8.5 h-8 -mt-[1.5px] mr-[1px]"
          />
        </button>
      </>
    );
  }

  // LangGraph Multi-Agent System Integration
  const handleSend = async () => {
    if (!inputText.trim()) return;

    const userText = inputText;
    setMessages((prev) => [...prev, { role: "user", content: userText }]);
    setInputText("");
    setLoading(true);
    setOperationSteps([]);

    try {
      // Add initial operation step
      setOperationSteps(["Understanding your request..."]);

      await new Promise((resolve) => setTimeout(resolve, 300));
      setOperationSteps((prev) => [...prev, "Routing to appropriate agent..."]);

      // If web search is enabled, add web search messages
      if (webSearchEnabled) {
        await new Promise((resolve) => setTimeout(resolve, 200));
        setOperationSteps((prev) => [...prev, "Searching the web..."]);
      }

      // Send to LangGraph backend
      const response = await LangGraphAdapter.sendToLangGraph(
        userText,
        conversationHistory,
        {
          currentMapStyle: selectedMapStyle,
          viewMode: viewMode,
        },
        webSearchEnabled,
        uploadedFiles
      );

      // Add more web search steps if search results were found
      if (
        webSearchEnabled &&
        response.response.search_results &&
        Array.isArray(response.response.search_results) &&
        response.response.search_results.length > 0
      ) {
        const searchResultsCount = response.response.search_results.length;
        setOperationSteps((prev) => [
          ...prev,
          `Found ${searchResultsCount} sources`,
        ]);
        await new Promise((resolve) => setTimeout(resolve, 200));
        setOperationSteps((prev) => [...prev, "Analyzing information..."]);
        await new Promise((resolve) => setTimeout(resolve, 200));
        setOperationSteps((prev) => [...prev, "Generating response..."]);
      }

      // Add operation based on response type
      const hasSearchResults =
        response.response.search_results &&
        Array.isArray(response.response.search_results) &&
        response.response.search_results.length > 0;

      console.log("Response type check:", {
        tool: response.response.tool,
        hasText: !!response.response.text,
        hasSearchResults,
        multipleActions: !!response.response.multiple_actions,
      });

      if (response.response.tool === "search_location") {
        setOperationSteps((prev) => [...prev, "Searching for location..."]);
      } else if (response.response.tool === "change_map_style") {
        setOperationSteps((prev) => [...prev, "Changing map style..."]);
      } else if (response.response.tool === "switch_view_mode") {
        setOperationSteps((prev) => [...prev, "Switching view mode..."]);
      } else if (response.response.tool === "control_time_of_day") {
        setOperationSteps((prev) => [...prev, "Adjusting time of day..."]);
      } else if (response.response.tool === "control_zoom") {
        setOperationSteps((prev) => [...prev, "Adjusting zoom level..."]);
      } else if (response.response.tool === "control_earthquake_data") {
        setOperationSteps((prev) => [
          ...prev,
          "Configuring earthquake monitoring...",
        ]);
      } else if (response.response.tool === "control_weather_data") {
        setOperationSteps((prev) => [
          ...prev,
          "Configuring weather monitoring...",
        ]);
      } else if (response.response.multiple_actions) {
        setOperationSteps((prev) => [
          ...prev,
          "Processing multiple actions...",
        ]);
      } else {
        // For Q&A responses - if no tool and no search results were already handled
        console.log("Entering else block for Q&A");
        if (!hasSearchResults) {
          console.log("Adding 'Generating response...' message");
          setOperationSteps((prev) => [...prev, "Generating response..."]);
        }
      }

      // Process response and execute actions
      await LangGraphAdapter.processLangGraphResponse(
        response,
        {
          searchLocation: async (query: string) => {
            // Location search - fly to location on map
            setOperationSteps((prev) => [...prev, `Looking up "${query}"...`]);
            if (mapRef?.current) {
              try {
                console.log(`Searching for location: ${query}`);
                // Use backend geocoding endpoint
                const geocodeResponse = await fetch(
                  `http://localhost:8000/geocode/search?query=${encodeURIComponent(
                    query
                  )}`
                );
                const geocodeData = await geocodeResponse.json();
                console.log("Geocode response:", geocodeData);

                if (geocodeData.results && geocodeData.results.length > 0) {
                  const result = geocodeData.results[0];
                  const lngLat: [number, number] = [result.lon, result.lat];
                  console.log(`Flying to: ${result.name} at [${lngLat}]`);

                  setOperationSteps((prev) => [
                    ...prev,
                    `Found location: ${result.name}`,
                  ]);
                  setOperationSteps((prev) => [
                    ...prev,
                    "Flying to location...",
                  ]);

                  // Fly to location
                  if (mapRef.current.flyTo) {
                    mapRef.current.flyTo({
                      center: lngLat,
                      zoom: 15,
                      essential: true, // This animation is considered essential
                    });
                    console.log("FlyTo executed");
                  } else {
                    console.warn("mapRef.current.flyTo not available");
                  }

                  // Add marker if available
                  if (mapRef.current.addLocationMarker) {
                    mapRef.current.addLocationMarker(result.lon, result.lat);
                    console.log("Marker added");
                  }
                } else {
                  console.warn("No geocoding results found");
                }
              } catch (error) {
                console.error("Location search error:", error);
              }
            } else {
              console.warn("mapRef not available");
            }
          },
          changeMapStyle: (style: string) => {
            if (handleMapStyleChange) {
              handleMapStyleChange(style);
            }
          },
          switchViewMode: (mode: "2d" | "3d", style?: string) => {
            if (mode === "2d" && switchTo2D) {
              switchTo2D();
              if (setViewMode) setViewMode("2d");
            } else if (mode === "3d") {
              // Use the provided style or fall back to current
              const styleToUse =
                style || selectedMapStyle || "Default (Custom Mapbox Standard)";
              console.log("AI switchViewMode to 3D with style:", styleToUse);

              // Update the state first
              if (style && handleMapStyleChange) {
                handleMapStyleChange(style);
              }

              // Call switchTo3D through mapRef directly with the correct style
              if (mapRef?.current?.switchTo3D) {
                mapRef.current.switchTo3D(styleToUse);
              }

              if (setViewMode) setViewMode("3d");

              // Set time of day to Auto when switching to 3D
              if (handleTimeOfDayChange) {
                handleTimeOfDayChange("Auto");
              }
            }
          },
          getCurrentMapStyle: () =>
            selectedMapStyle || "Default (Custom Mapbox Standard)",
          controlTimeOfDay: (preset: string) => {
            if (handleTimeOfDayChange) {
              handleTimeOfDayChange(preset);
            }
          },
          controlZoom: (
            direction: "in" | "out",
            amount: number,
            isMax: boolean
          ) => {
            if (mapRef?.current) {
              let newZoom: number;

              if (isMax) {
                // Zoom to max: 22 for zoom in (closest), 0 for zoom out (farthest)
                newZoom = direction === "in" ? 22 : 0;
              } else {
                const currentZoom = mapRef.current.getZoom?.() || 10;
                const zoomChange = direction === "in" ? amount : -amount;
                newZoom = currentZoom + zoomChange;
                // Clamp between 0 and 22
                newZoom = Math.max(0, Math.min(22, newZoom));
              }

              mapRef.current.flyTo?.({ zoom: newZoom, duration: 500 });
            }
          },
          controlEarthquake: (
            action: "enable" | "disable",
            source: "philippine" | "global"
          ) => {
            if (liveHazardMonitorCallbacks) {
              liveHazardMonitorCallbacks.openLiveHazardMonitor();
              liveHazardMonitorCallbacks.expandEarthquakeSection();

              const sourceMap: { [key: string]: string } = {
                philippine:
                  "Latest Earthquake Information (Philippines Seismic Network)",
                global: "Latest Earthquakes",
              };

              const sourceName = sourceMap[source];

              if (action === "enable") {
                liveHazardMonitorCallbacks.selectEarthquakeSource(sourceName);
              } else {
                // Disable - toggle off if currently selected
                const currentSources =
                  liveHazardMonitorCallbacks.getSelectedEarthquakeSources();
                if (currentSources.includes(sourceName)) {
                  liveHazardMonitorCallbacks.selectEarthquakeSource(sourceName);
                }
              }
            }
          },
          controlWeather: (
            action: "enable" | "disable",
            scope: string,
            province?: string
          ) => {
            if (liveHazardMonitorCallbacks) {
              liveHazardMonitorCallbacks.openLiveHazardMonitor();
              liveHazardMonitorCallbacks.expandWeatherSection();

              const allSources = [
                "Current Weather Condition (Philippines - By Province)",
                "Current Weather Condition (Abra - By City/Municipality)",
                "Current Weather Condition (Agusan del Norte - By City/Municipality)",
                "Current Weather Condition (Agusan del Sur - By City/Municipality)",
                "Current Weather Condition (Aklan - By City/Municipality)",
              ];

              const citySources = [
                "Current Weather Condition (Abra - By City/Municipality)",
                "Current Weather Condition (Agusan del Norte - By City/Municipality)",
                "Current Weather Condition (Agusan del Sur - By City/Municipality)",
                "Current Weather Condition (Aklan - By City/Municipality)",
              ];

              let sourcesToToggle: string[] = [];

              if (scope === "province") {
                sourcesToToggle = [
                  "Current Weather Condition (Philippines - By Province)",
                ];
              } else if (scope === "all") {
                sourcesToToggle = allSources;
              } else if (scope === "all_cities") {
                sourcesToToggle = citySources;
              } else if (scope === "city" && province) {
                // Specific province city data
                sourcesToToggle = [
                  `Current Weather Condition (${province} - By City/Municipality)`,
                ];
              }

              if (action === "enable") {
                // Enable selected sources
                sourcesToToggle.forEach((sourceName) => {
                  liveHazardMonitorCallbacks.selectWeatherSource(sourceName);
                });
              } else {
                // Disable - toggle off if currently selected
                const currentSources =
                  liveHazardMonitorCallbacks.getSelectedWeatherSources();
                sourcesToToggle.forEach((sourceName) => {
                  if (currentSources.includes(sourceName)) {
                    liveHazardMonitorCallbacks.selectWeatherSource(sourceName);
                  }
                });
              }
            }
          },
          controlExposureAssessment: (
            action: "run" | "clear" | "select_hazard" | "select_element",
            params?: {
              hazard_source?: "existing" | "imported";
              hazard_data?: string[];
              element_source?: "existing" | "imported";
              element_data?: string[];
            }
          ) => {
            if (exposureAssessmentCallbacks) {
              exposureAssessmentCallbacks.openExposureAssessment();

              if (action === "run") {
                // Set sources first
                if (params?.hazard_source) {
                  exposureAssessmentCallbacks.selectHazardSource(
                    params.hazard_source
                  );
                }
                if (params?.element_source) {
                  exposureAssessmentCallbacks.selectElementSource(
                    params.element_source
                  );
                }

                // Then set data with source parameter
                if (params?.hazard_data) {
                  exposureAssessmentCallbacks.selectHazardData(
                    params.hazard_data,
                    params.hazard_source
                  );
                }
                if (params?.element_data) {
                  exposureAssessmentCallbacks.selectElementData(
                    params.element_data,
                    params.element_source
                  );
                }

                // Finally run the analysis
                setTimeout(() => {
                  exposureAssessmentCallbacks.runAnalysis();
                }, 100);
              } else if (action === "clear") {
                // Clear all steps
                exposureAssessmentCallbacks.clearSteps();
              } else if (action === "select_hazard" && params) {
                // Select hazard data
                if (params.hazard_source) {
                  exposureAssessmentCallbacks.selectHazardSource(
                    params.hazard_source
                  );
                }
                if (params.hazard_data) {
                  exposureAssessmentCallbacks.selectHazardData(
                    params.hazard_data,
                    params.hazard_source
                  );
                }
              } else if (action === "select_element" && params) {
                // Select exposure elements
                if (params.element_source) {
                  exposureAssessmentCallbacks.selectElementSource(
                    params.element_source
                  );
                }
                if (params.element_data) {
                  exposureAssessmentCallbacks.selectElementData(
                    params.element_data,
                    params.element_source
                  );
                }
              }
            }
          },
          findRoute: async (
            start: string,
            destination: string,
            mode: string
          ) => {
            if (pathfinderCallbacks) {
              await pathfinderCallbacks.findRoute(start, destination, mode);
            }
          },
          changeRouteMode: (mode: string) => {
            if (pathfinderCallbacks) {
              pathfinderCallbacks.changeRouteMode(mode);
            }
          },
          changeRouteSort: (sortBy: string) => {
            if (pathfinderCallbacks) {
              pathfinderCallbacks.changeRouteSort(sortBy);
            }
          },
          openPathfinder: () => {
            if (pathfinderCallbacks) {
              pathfinderCallbacks.openPathfinder();
            }
          },
          closePathfinder: () => {
            if (pathfinderCallbacks) {
              pathfinderCallbacks.closePathfinder();
            }
          },
        },
        (role: "user" | "assistant", content: string, citations?: any[]) => {
          setMessages((prev) => [...prev, { role, content, citations }]);
        }
      );

      // Update conversation history
      setConversationHistory(response.conversation_history);
    } catch (error) {
      console.error("Error:", error);
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: "Failed to process request. Please try again.",
        },
      ]);
    } finally {
      // Add a small delay so users can see the final operation message
      await new Promise((resolve) => setTimeout(resolve, 500));
      setLoading(false);
      setOperationSteps([]);
    }
  };

  const handleNewSession = () => {
    setMessages([]);
    setInputText("");
    setLoading(false);
    setOperationSteps([]);
  };

  return (
    <>
      <div
        className={`${
          isExpanded
            ? "fixed top-0 right-0 h-screen w-[360px] rounded-none border-l border-white/10"
            : "absolute bottom-[15px] h-[393px] right-[82px] w-[280px] rounded-md py-2"
        } ${
          isExpanded ? "z-10" : "z-50"
        } shadow-md origin-bottom-right flex flex-col
  ${
    isVisible
      ? "opacity-100 scale-100 pointer-events-auto transition-all duration-300 ease-out"
      : "opacity-0 scale-75 pointer-events-none transition-all duration-150 ease-in"
  }`}
        style={{
          background: "linear-gradient(to bottom, #5A5C99, #232323)",
          overflow: "hidden",
        }}
      >
        <div className="flex-1 flex flex-col overflow-hidden bg-transparent">
          {messages.length === 0 && (
            <div
              className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none px-3"
              style={{ transform: "translateY(-30px)" }}
            >
              <img
                src="/Images/Feature-Icons/SafeGIS-AI-Logo.png"
                alt="Atlas Logo"
                className="opacity-50 w-[90px]"
              />
              <p className="text-white opacity-70 text-[16px] font-semibold mt-1.5">
                Atlas
              </p>
              <p className="text-[#C7C7C7] text-[10px] font-[400] mt-1 mb-12">
                Need assistance? Ask away!
              </p>
            </div>
          )}

          {/* Messages */}
          <div
            className={`flex-1 p-2 overflow-y-auto space-y-1.5 relative custom-scrollbar bg-transparent ${
              isExpanded ? "pb-[120px]" : "pb-[120px]"
            }`}
          >
            {messages.map((msg, idx) => (
              <div
                key={idx}
                className={`flex ${
                  msg.role === "user" ? "justify-end" : "justify-center"
                }`}
              >
                <div
                  className={`p-2 prose prose-invert break-words select-text ${
                    msg.role === "user"
                      ? "bg-[#3e3f68] text-white rounded-md max-w-[75%]"
                      : "text-[#C7C7C7] w-full px-1 bg-transparent"
                  }`}
                >
                  <ReactMarkdown
                    components={{
                      p: ({ node, ...props }) => (
                        <p
                          className="mb-2 leading-relaxed text-[10px]"
                          {...props}
                        />
                      ),
                      li: ({ node, ...props }) => (
                        <li className="ml-3 list-disc text-[10px]" {...props} />
                      ),
                      a: ({ node, ...props }) => (
                        <a
                          className="text-blue-400 hover:text-blue-300 underline cursor-pointer text-[10px]"
                          target="_blank"
                          rel="noopener noreferrer"
                          {...props}
                        />
                      ),
                    }}
                  >
                    {msg.content}
                  </ReactMarkdown>
                  {/* Display citations in collapsible section */}
                  {msg.citations && msg.citations.length > 0 && (
                    <CitationsSection citations={msg.citations} />
                  )}
                </div>
              </div>
            ))}

            {loading && <ThinkingLoader operations={operationSteps} />}
            <div ref={chatEndRef} />
          </div>

          {/* Chat Input */}
          <div
            className={`absolute bottom-2 left-1/2 transform -translate-x-1/2 p-2 flex flex-col gap-1 flex-shrink-0 ${
              isExpanded ? "w-[345px]" : "w-[265px]"
            } bg-white/5 backdrop-blur-xl border border-white/10 rounded-md shadow-lg`}
          >
            <div className="flex justify-between items-center mb-0">
              {/* Web Search */}
              <button
                onClick={() => setWebSearchEnabled((prev) => !prev)}
                className={`px-1.5 text-[9px] rounded-sm border transition-all duration-200 flex items-center justify-center h-[22px] gap-1 ${
                  webSearchEnabled
                    ? "bg-[#5A5C99]/35 border-[#8183c8] text-[#c6c8fb]"
                    : "bg-white/5 border-white/20 text-white/70 hover:text-white"
                }`}
              >
                <span className="flex items-center" style={{ lineHeight: 0 }}>
                  <Globe size={10} />
                </span>
                <span style={{ lineHeight: "22px" }}>Web Search</span>
              </button>

              {/* Actions */}
              <div className="flex items-center gap-0">
                <button
                  onClick={handleNewSession}
                  className="text-white hover:text-gray-200 h-[22px] w-[22px] flex items-center justify-center"
                >
                  <MessageCirclePlus size={14} />
                </button>
                <button className="text-white hover:text-gray-200 h-[22px] w-[22px] flex items-center justify-center">
                  <History size={14} />
                </button>
                <button
                  onClick={() => {
                    const newExpanded = !isExpanded;
                    setIsExpanded(newExpanded);
                    onExpandToggle?.(newExpanded);
                  }}
                  className="text-white hover:text-gray-200 h-[22px] w-[22px] flex items-center justify-center"
                  title={isExpanded ? "Minimize" : "Expand"}
                >
                  {isExpanded ? <Minimize size={14} /> : <Expand size={14} />}
                </button>
              </div>
            </div>

            {/* Textarea */}
            <div className="flex flex-col w-full h-[70px] backdrop-blur-xl !rounded-[0.375rem] shadow-lg p-1 border-animated">
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
                className={`flex-1 resize-none overflow-y-auto bg-transparent text-[#C7C7C7] placeholder-[#C7C7C7]/70 text-[10px] rounded-md px-1 py-0.5 outline-none border-none custom-scrollbar ${
                  isTextareaDisabled ? "cursor-not-allowed opacity-60" : ""
                } ${isRecording ? "placeholder-orange-300" : ""} ${
                  isProcessingAudio ? "placeholder-blue-300" : ""
                }`}
              />

              <div className="flex justify-between mt-0.5">
                <div className="flex gap-0.5">
                  <button
                    onClick={() => console.log("Plus button clicked")}
                    className="h-5 w-5 flex items-center justify-center rounded-sm text-white hover:text-gray-200 transition bg-transparent"
                  >
                    <Plus size={13} />
                  </button>
                  <button
                    onClick={() => console.log("At-sign button clicked")}
                    className="h-5 w-5 flex items-center justify-center rounded-sm text-white hover:text-gray-200 transition bg-transparent"
                  >
                    <AtSign size={12} />
                  </button>
                </div>
                <div className="flex gap-1">
                  {/* Voice Prompt Button */}
                  <button
                    onClick={handleVoiceButtonClick}
                    disabled={isProcessingAudio}
                    className={`h-5 w-5 flex items-center justify-center rounded-sm text-white transition ${
                      isRecording
                        ? "bg-red-500 hover:bg-red-600"
                        : isProcessingAudio
                        ? "bg-[#8183c8] cursor-not-allowed opacity-60"
                        : "bg-transparent hover:text-gray-200"
                    }`}
                  >
                    {isRecording ? (
                      <CircleStop size={13} />
                    ) : isProcessingAudio ? (
                      <div className="animate-spin rounded-full h-3 w-3 border-2 border-white border-t-transparent"></div>
                    ) : (
                      <Mic size={13} />
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
                    className={`h-5 w-5 flex items-center justify-center rounded-sm text-white transition ${
                      loading ||
                      !inputText.trim() ||
                      isRecording ||
                      isProcessingAudio
                        ? "bg-[#676767] opacity-50 cursor-not-allowed"
                        : "bg-[#676767] hover:bg-[#737373]"
                    }`}
                  >
                    <ArrowUp size={13} className="shrink-0" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Chat Button when Open - Hide when expanded */}
      {!isExpanded && (
        <button
          onClick={toggleChat}
          className="absolute bottom-[15px] right-[15px] w-13 h-13 rounded-md z-50 shadow-md flex items-center justify-center transition-all duration-300"
          style={{
            background: "linear-gradient(to bottom, #6B6DCC, #2E2E2E)",
          }}
        >
          <img
            src="/Images/Feature-Icons/SafeGIS-AI-Logo.png"
            alt="Atlas Logo"
            className="w-8.5 h-8 -mt-[1.5px] mr-[1px]"
          />
        </button>
      )}
    </>
  );
}
