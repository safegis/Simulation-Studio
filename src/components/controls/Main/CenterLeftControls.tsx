// CenterLeftControls.tsx
import { useState } from "react";
import {
  Earth,
  MapPinned,
  ListTodo,
  ChartColumn,
  PanelLeft,
  Activity,
} from "lucide-react";

interface CenterLeftControlsProps {
  showSelectMaps: boolean;
  setShowSelectMaps: React.Dispatch<React.SetStateAction<boolean>>;
  showPathfinder: boolean;
  setShowPathfinder: React.Dispatch<React.SetStateAction<boolean>>;
  showPlanningTools: boolean;
  setShowPlanningTools: React.Dispatch<React.SetStateAction<boolean>>;
  showAssessmentTools: boolean;
  setShowAssessmentTools: React.Dispatch<React.SetStateAction<boolean>>;
  showToolPanel: boolean;
  setShowToolPanel: React.Dispatch<React.SetStateAction<boolean>>;
  selectedMaps: string[];
  selectedPlanningTools: string[];
  selectedAssessmentTools: string[];
  showLiveHazardMonitor: boolean;
  setShowLiveHazardMonitor: React.Dispatch<React.SetStateAction<boolean>>;
}

export default function CenterLeftControls({
  showSelectMaps,
  setShowSelectMaps,
  showPathfinder,
  setShowPathfinder,
  showPlanningTools,
  setShowPlanningTools,
  showAssessmentTools,
  setShowAssessmentTools,
  showToolPanel,
  setShowToolPanel,
  selectedMaps,
  selectedPlanningTools,
  selectedAssessmentTools,
  showLiveHazardMonitor,
  setShowLiveHazardMonitor,
}: CenterLeftControlsProps) {
  const [hoveredButton, setHoveredButton] = useState<string | null>(null);

  return (
    <div className="absolute top-1/2 left-[15px] -translate-y-1/2 z-50 flex flex-col items-center gap-2">
      {/* Top Buttons Group with Live Hazard Monitor */}
      <div className="bg-[#2E2E2E] p-1 rounded-md shadow-md w-[40px] flex flex-col gap-1">
        <div className="relative">
          <button
            onClick={() =>
              setShowLiveHazardMonitor((prev) => {
                const newState = !prev;
                if (newState) {
                  setShowSelectMaps(false);
                  setShowPathfinder(false);
                  setShowPlanningTools(false);
                  setShowAssessmentTools(false);
                  setShowToolPanel(false);
                }
                return newState;
              })
            }
            onMouseEnter={() => setHoveredButton("liveHazard")}
            onMouseLeave={() => setHoveredButton(null)}
            className={`w-[32px] h-[32px] rounded transition inline-flex items-center justify-center ${
              showLiveHazardMonitor
                ? "bg-gradient-to-b from-[#9699FF] to-white text-[#2E2E2E] hover:opacity-90"
                : "hover:bg-[#3a3a3a] text-[#C7C7C7]"
            }`}
          >
            <Activity size={18} className="shrink-0" />
          </button>
          {hoveredButton === "liveHazard" && (
            <div className="absolute left-[45px] top-1/2 -translate-y-1/2 bg-white text-black text-[11px] px-2 py-1 rounded shadow-lg whitespace-nowrap z-[9999]">
              Live Hazard Monitor
            </div>
          )}
        </div>

        <div className="relative">
          <button
            onClick={() =>
              setShowSelectMaps((prev) => {
                const newState = !prev;
                if (newState) {
                  setShowLiveHazardMonitor(false);
                  setShowPathfinder(false);
                  setShowPlanningTools(false);
                  setShowAssessmentTools(false);
                  setShowToolPanel(false);
                }
                return newState;
              })
            }
            onMouseEnter={() => setHoveredButton("mapLayers")}
            onMouseLeave={() => setHoveredButton(null)}
            className={`w-[32px] h-[32px] rounded transition inline-flex items-center justify-center ${
              showSelectMaps
                ? "bg-gradient-to-b from-[#9699FF] to-white text-[#2E2E2E] hover:opacity-90"
                : "hover:bg-[#3a3a3a] text-[#C7C7C7]"
            }`}
          >
            <Earth size={18} className="shrink-0" />
          </button>
          {hoveredButton === "mapLayers" && (
            <div className="absolute left-[45px] top-1/2 -translate-y-1/2 bg-white text-black text-[11px] px-2 py-1 rounded shadow-lg whitespace-nowrap z-[9999]">
              Map Layers
            </div>
          )}
        </div>

        <div className="relative">
          <button
            onClick={() =>
              setShowPathfinder((prev) => {
                const newState = !prev;
                if (newState) {
                  setShowLiveHazardMonitor(false);
                  setShowSelectMaps(false);
                  setShowPlanningTools(false);
                  setShowAssessmentTools(false);
                  setShowToolPanel(false);
                }
                return newState;
              })
            }
            onMouseEnter={() => setHoveredButton("pathfinder")}
            onMouseLeave={() => setHoveredButton(null)}
            className={`w-[32px] h-[32px] rounded transition inline-flex items-center justify-center ${
              showPathfinder
                ? "bg-gradient-to-b from-[#9699FF] to-white text-[#2E2E2E] hover:opacity-90"
                : "hover:bg-[#3a3a3a] text-[#C7C7C7]"
            }`}
          >
            <MapPinned size={18} className="shrink-0" />
          </button>
          {hoveredButton === "pathfinder" && (
            <div className="absolute left-[45px] top-1/2 -translate-y-1/2 bg-white text-black text-[11px] px-2 py-1 rounded shadow-lg whitespace-nowrap z-[9999]">
              Pathfinder
            </div>
          )}
        </div>

        <div className="relative">
          <button
            onClick={() =>
              setShowAssessmentTools((prev) => {
                const newState = !prev;
                if (newState) {
                  setShowLiveHazardMonitor(false);
                  setShowSelectMaps(false);
                  setShowPathfinder(false);
                  setShowPlanningTools(false);
                  setShowToolPanel(false);
                }
                return newState;
              })
            }
            onMouseEnter={() => setHoveredButton("assessment")}
            onMouseLeave={() => setHoveredButton(null)}
            className={`w-[32px] h-[32px] rounded transition inline-flex items-center justify-center ${
              showAssessmentTools
                ? "bg-gradient-to-b from-[#9699FF] to-white text-[#2E2E2E] hover:opacity-90"
                : "hover:bg-[#3a3a3a] text-[#C7C7C7]"
            }`}
          >
            <ChartColumn size={18} className="shrink-0" />
          </button>
          {hoveredButton === "assessment" && (
            <div className="absolute left-[45px] top-1/2 -translate-y-1/2 bg-white text-black text-[11px] px-2 py-1 rounded shadow-lg whitespace-nowrap z-[9999]">
              Assessment Tools
            </div>
          )}
        </div>

        <div className="relative">
          <button
            onClick={() =>
              setShowPlanningTools((prev) => {
                const newState = !prev;
                if (newState) {
                  setShowLiveHazardMonitor(false);
                  setShowSelectMaps(false);
                  setShowPathfinder(false);
                  setShowAssessmentTools(false);
                  setShowToolPanel(false);
                }
                return newState;
              })
            }
            onMouseEnter={() => setHoveredButton("planning")}
            onMouseLeave={() => setHoveredButton(null)}
            className={`w-[32px] h-[32px] rounded transition inline-flex items-center justify-center ${
              showPlanningTools
                ? "bg-gradient-to-b from-[#9699FF] to-white text-[#2E2E2E] hover:opacity-90"
                : "hover:bg-[#3a3a3a] text-[#C7C7C7]"
            }`}
          >
            <ListTodo size={18} className="shrink-0" />
          </button>
          {hoveredButton === "planning" && (
            <div className="absolute left-[45px] top-1/2 -translate-y-1/2 bg-white text-black text-[11px] px-2 py-1 rounded shadow-lg whitespace-nowrap z-[9999]">
              Planning Suite
            </div>
          )}
        </div>
      </div>

      {/* PanelLeft Button */}
      {(selectedMaps.length > 0 ||
        selectedPlanningTools.length > 0 ||
        selectedAssessmentTools.length > 0) && (
        <div className="bg-[#2E2E2E] p-1 rounded-md shadow-md w-[40px] h-[40px] flex justify-center items-center">
          <button
            onClick={() =>
              setShowToolPanel((prev) => {
                const newState = !prev;
                if (newState) {
                  setShowLiveHazardMonitor(false);
                  setShowSelectMaps(false);
                  setShowPathfinder(false);
                  setShowPlanningTools(false);
                  setShowAssessmentTools(false);
                }
                return newState;
              })
            }
            className={`w-[32px] h-[32px] rounded transition inline-flex items-center justify-center ${
              showToolPanel
                ? "bg-gradient-to-b from-[#9699FF] to-white text-[#2E2E2E] hover:opacity-90"
                : "hover:bg-[#3a3a3a] text-[#C7C7C7]"
            }`}
          >
            <PanelLeft size={18} className="shrink-0" />
          </button>
        </div>
      )}
    </div>
  );
}
