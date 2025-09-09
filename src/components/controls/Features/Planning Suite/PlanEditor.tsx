"use client";

import {
  CropSquare,
  Crop32,
  Crop169,
  Crop54,
  Crop75,
} from "@mui/icons-material";

interface PlanEditorProps {
  selectedPlan: { name: string; date: string } | null;
  shapeDrawn: boolean;
  scopeConfirmed: boolean;
  setIsDrawingBox: (value: boolean) => void;
  setIsDrawingRectangle: (value: boolean) => void;
  setShapeDrawn: (value: boolean) => void;
  setScopeConfirmed: (value: boolean) => void;
  mapRef: React.MutableRefObject<any>;
}

export default function PlanEditor({
  selectedPlan,
  shapeDrawn,
  scopeConfirmed,
  setIsDrawingBox,
  setIsDrawingRectangle,
  setShapeDrawn,
  setScopeConfirmed,
  mapRef,
}: PlanEditorProps) {
  if (!selectedPlan) return null;

  return (
    <>
      {/* Define Scope Controls */}
      {(!shapeDrawn || !scopeConfirmed) && (
        <div
          className="absolute bottom-[110px] left-1/2 transform -translate-x-1/2  
            bg-[#2E2E2E] flex flex-col items-center justify-center  
            rounded-3xl shadow-2xl text-center z-50 px-8 py-6"
        >
          <span className="text-white text-md font-medium mb-6">
            Define Scope
          </span>

          <div className="flex items-center justify-center gap-6 w-full">
            {/* Square button */}
            <button
              onClick={() => {
                setIsDrawingBox(true);
                if (mapRef.current) {
                  const map = mapRef.current.getMap();
                  map.getCanvas().style.cursor = "crosshair";
                  map.dragPan.disable();
                }
              }}
              className="w-[90px] flex flex-col items-center justify-center px-6 py-4  
                rounded-xl border-3 border-dashed border-[#9699FF]  
                text-[#9699FF] transition-colors duration-200  
                hover:border-[#7F81D9] hover:text-[#7F81D9]"
            >
              <CropSquare fontSize="medium" />
              <span className="mt-2 text-sm text-white">1 : 1</span>
            </button>

            {/* Rectangle buttons */}
            <button
              className="w-[90px] flex flex-col items-center justify-center px-6 py-4  
                rounded-xl border-3 border-dashed border-[#9699FF]  
                text-[#9699FF] transition-colors duration-200  
                hover:border-[#7F81D9] hover:text-[#7F81D9]"
            >
              <Crop32 fontSize="medium" />
              <span className="mt-2 text-sm text-white">4 : 3</span>
            </button>

            <button
              className="w-[90px] flex flex-col items-center justify-center px-6 py-4  
                rounded-xl border-3 border-dashed border-[#9699FF]  
                text-[#9699FF] transition-colors duration-200  
                hover:border-[#7F81D9] hover:text-[#7F81D9]"
            >
              <Crop54 fontSize="medium" />
              <span className="mt-2 text-sm text-white">5 : 4</span>
            </button>

            <button
              className="w-[90px] flex flex-col items-center justify-center px-6 py-4  
                rounded-xl border-3 border-dashed border-[#9699FF]  
                text-[#9699FF] transition-colors duration-200  
                hover:border-[#7F81D9] hover:text-[#7F81D9]"
            >
              <Crop75 fontSize="medium" />
              <span className="mt-2 text-sm text-white">7 : 5</span>
            </button>

            {/* Rectangle 16:9 */}
            <button
              onClick={() => {
                setIsDrawingRectangle(true);
                if (mapRef.current) {
                  const map = mapRef.current.getMap();
                  map.getCanvas().style.cursor = "crosshair";
                  map.dragPan.disable();
                }
              }}
              className="w-[90px] flex flex-col items-center justify-center px-6 py-4  
                rounded-xl border-3 border-dashed border-[#9699FF]  
                text-[#9699FF] transition-colors duration-200  
                hover:border-[#7F81D9] hover:text-[#7F81D9]"
            >
              <Crop169 fontSize="medium" />
              <span className="mt-2 text-sm text-white">16 : 9</span>
            </button>
          </div>

          <span className="text-[#858585] text-sm font-medium mt-4">
            --- Select ratio ---
          </span>

          {shapeDrawn && (
            <div className="flex gap-4 mt-6">
              <button
                onClick={() => setScopeConfirmed(true)}
                className="px-6 py-2 rounded-lg bg-[#9699FF] text-white font-medium  
                  hover:bg-[#7F81D9] transition"
              >
                Save
              </button>
              <button
                onClick={() => {
                  const map = mapRef.current?.getMap();
                  if (map?.getSource("drawn-box")) {
                    map.removeLayer("drawn-box-layer");
                    map.removeLayer("drawn-box-outline");
                    map.removeSource("drawn-box");
                  }
                  setShapeDrawn(false);
                  setScopeConfirmed(false);
                }}
                className="px-6 py-2 rounded-lg bg-[#444] text-white font-medium  
                  hover:bg-[#666] transition"
              >
                Cancel
              </button>
            </div>
          )}
        </div>
      )}

      {/* Plan Details & Controls */}
      {shapeDrawn && scopeConfirmed && (
        <div
          className="absolute bottom-[110px] left-1/2 transform -translate-x-1/2 bg-[#2E2E2E] flex flex-row 
            items-stretch rounded-3xl shadow-2xl text-center z-50 p-6 gap-6"
        >
          {/* Left Column: Scope Details Box */}
          <div className="flex flex-col items-start gap-4 flex-shrink-0">
            <div
              className="w-[260px] border-2 border-dashed border-[#9699FF] rounded-xl text-white p-3 flex 
                flex-col justify-between h-full"
            >
              <span className="text-sm font-medium text-center w-full">
                Scope Details
              </span>
              <div className="flex flex-col items-start gap-1 mt-2">
                <span className="text-xs text-gray-400">Corners:</span>
                <span className="text-xs text-gray-400">Length:</span>
                <span className="text-xs text-gray-400">Width:</span>
              </div>
              <button
                onClick={() => setScopeConfirmed(false)}
                className="mt-4 px-4 py-2 rounded-lg bg-[#5A5C99] text-white text-xs font-medium hover:opacity-90 transition"
              >
                Edit Scope
              </button>
            </div>
          </div>

          {/* Right Column: Plot Routes */}
          <div className="flex flex-row gap-6 w-full items-stretch">
            <div className="flex-1 min-w-[600px] border-2 border-dashed border-[#9699FF] rounded-xl text-white p-3 flex flex-col items-start h-full">
              <span className="text-sm font-medium mb-2 text-center w-full">
                Plot Routes
              </span>
              <div className="flex flex-row gap-2 w-full mt-2 flex-1">
                <div className="flex flex-col flex-1 items-start gap-0.5">
                  <span className="text-xs font-medium text-gray-200 mb-1">
                    Starting Points
                  </span>
                  <div className="w-full h-20 border-2 border-dashed border-[#9699FF] bg-transparent rounded-lg mb-1 flex items-center justify-center text-gray-400 text-xs">
                    No added starting points yet
                  </div>
                  <div className="w-full flex justify-end">
                    <button className="w-24 px-2 py-1 text-xs rounded-lg bg-[#5A5C99] text-white hover:opacity-90 transition">
                      Add
                    </button>
                  </div>
                </div>

                <div className="flex flex-col flex-1 items-start gap-0.5">
                  <span className="text-xs font-medium text-gray-200 mb-1">
                    Evacuation Areas
                  </span>
                  <div className="w-full h-20 border-2 border-dashed border-[#9699FF] bg-transparent rounded-lg mb-1 flex items-center justify-center text-gray-400 text-xs">
                    No marked evacuation areas yet
                  </div>
                  <div className="w-full flex justify-end">
                    <button className="w-24 px-2 py-1 text-xs rounded-lg bg-[#5A5C99] text-white hover:opacity-90 transition">
                      Add
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
