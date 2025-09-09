// CenterLeftControls.tsx
import {
  Earth,
  MapPinned,
  ListTodo,
  OctagonAlert,
  PanelLeft,
} from "lucide-react";

interface CenterLeftControlsProps {
  showSelectMaps: boolean;
  setShowSelectMaps: React.Dispatch<React.SetStateAction<boolean>>;
  showPathfinder: boolean;
  setShowPathfinder: React.Dispatch<React.SetStateAction<boolean>>;
  showPlanningTools: boolean;
  setShowPlanningTools: React.Dispatch<React.SetStateAction<boolean>>;
  showToolPanel: boolean;
  setShowToolPanel: React.Dispatch<React.SetStateAction<boolean>>;
  selectedMaps: string[];
  selectedPlanningTools: string[];
}

export default function CenterLeftControls({
  showSelectMaps,
  setShowSelectMaps,
  showPathfinder,
  setShowPathfinder,
  showPlanningTools,
  setShowPlanningTools,
  showToolPanel,
  setShowToolPanel,
  selectedMaps,
  selectedPlanningTools,
}: CenterLeftControlsProps) {
  return (
    <div className="absolute top-1/2 left-[18px] -translate-y-1/2 z-50 flex flex-col items-center gap-[18px]">
      {/* Top 4 Buttons Group */}
      <div className="bg-[#2E2E2E] p-2 rounded-xl shadow-md w-[60px] flex flex-col gap-4">
        <button
          onClick={() =>
            setShowSelectMaps((prev) => {
              const newState = !prev;
              if (newState) {
                setShowPathfinder(false);
                setShowPlanningTools(false);
                setShowToolPanel(false);
              }
              return newState;
            })
          }
          className={`p-2 rounded-lg transition ${
            showSelectMaps
              ? "bg-gradient-to-b from-[#9699FF] to-white text-[#2E2E2E] hover:opacity-90"
              : "hover:bg-[#3a3a3a] text-[#C7C7C7]"
          }`}
        >
          <Earth width={28} height={28} />
        </button>

        <button
          onClick={() =>
            setShowPathfinder((prev) => {
              const newState = !prev;
              if (newState) {
                setShowSelectMaps(false);
                setShowPlanningTools(false);
                setShowToolPanel(false);
              }
              return newState;
            })
          }
          className={`p-2 rounded-lg transition ${
            showPathfinder
              ? "bg-gradient-to-b from-[#9699FF] to-white text-[#2E2E2E] hover:opacity-90"
              : "hover:bg-[#3a3a3a] text-[#C7C7C7]"
          }`}
        >
          <MapPinned width={28} height={28} />
        </button>

        <button
          onClick={() =>
            setShowPlanningTools((prev) => {
              const newState = !prev;
              if (newState) {
                setShowSelectMaps(false);
                setShowPathfinder(false);
                setShowToolPanel(false);
              }
              return newState;
            })
          }
          className={`p-2 rounded-lg transition ${
            showPlanningTools
              ? "bg-gradient-to-b from-[#9699FF] to-white text-[#2E2E2E] hover:opacity-90"
              : "hover:bg-[#3a3a3a] text-[#C7C7C7]"
          }`}
        >
          <ListTodo width={28} height={28} />
        </button>

        <button className="hover:bg-[#3a3a3a] text-[#C7C7C7] p-2 rounded-lg transition">
          <OctagonAlert width={28} height={28} />
        </button>
      </div>

      {/* PanelLeft Button */}
      {(selectedMaps.length > 0 || selectedPlanningTools.length > 0) && (
        <div className="bg-[#2E2E2E] p-2 rounded-xl shadow-md w-[60px] flex justify-center">
          <button
            onClick={() =>
              setShowToolPanel((prev) => {
                const newState = !prev;
                if (newState) {
                  setShowSelectMaps(false);
                  setShowPathfinder(false);
                  setShowPlanningTools(false);
                }
                return newState;
              })
            }
            className={`p-2 rounded-lg transition ${
              showToolPanel
                ? "bg-gradient-to-b from-[#9699FF] to-white text-[#2E2E2E] hover:opacity-90"
                : "hover:bg-[#3a3a3a] text-[#C7C7C7]"
            }`}
          >
            <PanelLeft width={28} height={28} />
          </button>
        </div>
      )}
    </div>
  );
}
