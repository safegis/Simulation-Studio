// CenterLeftControls.tsx
import {
  Earth,
  MapPinned,
  ListTodo,
  ChartColumn,
  PanelLeft,
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
}: CenterLeftControlsProps) {
  return (
    <div className="absolute top-1/2 left-[18px] -translate-y-1/2 z-50 flex flex-col items-center gap-2">
      {/* Top 4 Buttons Group */}
      <div className="bg-[#2E2E2E] p-1 rounded-md shadow-md w-[40px] flex flex-col gap-1">
        <button
          onClick={() =>
            setShowSelectMaps((prev) => {
              const newState = !prev;
              if (newState) {
                setShowPathfinder(false);
                setShowPlanningTools(false);
                setShowAssessmentTools(false);
                setShowToolPanel(false);
              }
              return newState;
            })
          }
          className={`w-[32px] h-[32px] rounded transition inline-flex items-center justify-center ${
            showSelectMaps
              ? "bg-gradient-to-b from-[#9699FF] to-white text-[#2E2E2E] hover:opacity-90"
              : "hover:bg-[#3a3a3a] text-[#C7C7C7]"
          }`}
        >
          <Earth size={18} className="shrink-0" />
        </button>

        <button
          onClick={() =>
            setShowPathfinder((prev) => {
              const newState = !prev;
              if (newState) {
                setShowSelectMaps(false);
                setShowPlanningTools(false);
                setShowAssessmentTools(false);
                setShowToolPanel(false);
              }
              return newState;
            })
          }
          className={`w-[32px] h-[32px] rounded transition inline-flex items-center justify-center ${
            showPathfinder
              ? "bg-gradient-to-b from-[#9699FF] to-white text-[#2E2E2E] hover:opacity-90"
              : "hover:bg-[#3a3a3a] text-[#C7C7C7]"
          }`}
        >
          <MapPinned size={18} className="shrink-0" />
        </button>

        <button
          onClick={() =>
            setShowAssessmentTools((prev) => {
              const newState = !prev;
              if (newState) {
                setShowSelectMaps(false);
                setShowPathfinder(false);
                setShowPlanningTools(false);
                setShowToolPanel(false);
              }
              return newState;
            })
          }
          className={`w-[32px] h-[32px] rounded transition inline-flex items-center justify-center ${
            showAssessmentTools
              ? "bg-gradient-to-b from-[#9699FF] to-white text-[#2E2E2E] hover:opacity-90"
              : "hover:bg-[#3a3a3a] text-[#C7C7C7]"
          }`}
        >
          <ChartColumn size={18} className="shrink-0" />
        </button>

        <button
          onClick={() =>
            setShowPlanningTools((prev) => {
              const newState = !prev;
              if (newState) {
                setShowSelectMaps(false);
                setShowPathfinder(false);
                setShowAssessmentTools(false);
                setShowToolPanel(false);
              }
              return newState;
            })
          }
          className={`w-[32px] h-[32px] rounded transition inline-flex items-center justify-center ${
            showPlanningTools
              ? "bg-gradient-to-b from-[#9699FF] to-white text-[#2E2E2E] hover:opacity-90"
              : "hover:bg-[#3a3a3a] text-[#C7C7C7]"
          }`}
        >
          <ListTodo size={18} className="shrink-0" />
        </button>
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
