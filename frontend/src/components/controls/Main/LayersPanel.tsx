// LayersPanel.tsx
import { Eye, EyeOff } from "lucide-react";
import { useState, RefObject } from "react";

interface Layer {
  id: string;
  name: string;
  type: "imported" | "hazard" | "facility" | "boundary";
  visible: boolean;
}

interface LayersPanelProps {
  uploadedFiles: { name: string; layerName: string }[];
  mapRef: RefObject<any>;
  earthquakeEnabled?: boolean;
  volcanoListEnabled?: boolean;
  activeFaultsEnabled?: boolean;
  congestionEnabled?: boolean;
}

export default function LayersPanel({
  uploadedFiles,
  mapRef,
  earthquakeEnabled = false,
  volcanoListEnabled = false,
  activeFaultsEnabled = false,
  congestionEnabled = false,
}: LayersPanelProps) {
  const [layerVisibility, setLayerVisibility] = useState<
    Record<string, boolean>
  >({});

  // Build layers array from all sources
  const layers: Layer[] = [
    ...uploadedFiles.map((file) => ({
      id: file.layerName,
      name: file.name,
      type: "imported" as const,
      visible: layerVisibility[file.layerName] ?? true,
    })),
    ...(earthquakeEnabled
      ? [
          {
            id: "earthquake",
            name: "Earthquake",
            type: "hazard" as const,
            visible: true,
          },
        ]
      : []),
    ...(volcanoListEnabled
      ? [
          {
            id: "volcano",
            name: "Volcano List",
            type: "hazard" as const,
            visible: true,
          },
        ]
      : []),
    ...(activeFaultsEnabled
      ? [
          {
            id: "faults",
            name: "Active Faults",
            type: "hazard" as const,
            visible: true,
          },
        ]
      : []),
    ...(congestionEnabled
      ? [
          {
            id: "congestion",
            name: "Congestion",
            type: "hazard" as const,
            visible: true,
          },
        ]
      : []),
  ];

  // Only show panel if there are layers
  if (layers.length === 0) return null;

  const toggleVisibility = (layerId: string, layerType: string) => {
    // Get current visibility (default to true if not set)
    const currentVisibility = layerVisibility[layerId] ?? true;
    const newVisibility = !currentVisibility;

    setLayerVisibility((prev) => ({
      ...prev,
      [layerId]: newVisibility,
    }));

    // Toggle layer visibility on the map
    if (!mapRef.current) return;
    const map = mapRef.current.getMap();
    if (!map) return;

    if (layerType === "imported") {
      // Handle imported layers
      const safeName = layerId.replace(/[^a-zA-Z0-9_-]/g, "");
      const sourceId = `upload-${safeName}`;
      const baseId = `${sourceId}-layer`;

      ["fill", "line", "circle"].forEach((type) => {
        const mapLayerId = `${baseId}-${type}`;
        if (map.getLayer(mapLayerId)) {
          map.setLayoutProperty(
            mapLayerId,
            "visibility",
            newVisibility ? "visible" : "none"
          );
        }
      });
    }
    // Add handling for other layer types as needed
  };

  return (
    <div className="absolute top-[15px] right-[15px] z-40 bg-[#2E2E2E] rounded-md shadow-lg p-3 w-[250px]">
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-white text-[11px] font-semibold">Active Layers</h3>
        <span className="text-[#C7C7C7] text-[10px]">
          {layers.length} layer{layers.length !== 1 ? "s" : ""}
        </span>
      </div>

      <div className="space-y-1 max-h-[150px] overflow-y-auto scrollbar-rounded">
        {layers.map((layer) => (
          <div
            key={layer.id}
            className="flex items-center gap-2 bg-[#3a3a3a] rounded px-2 py-1.5 hover:bg-[#404040] transition"
          >
            <button
              onClick={() => toggleVisibility(layer.id, layer.type)}
              className="text-[#C7C7C7] hover:text-white transition shrink-0"
            >
              {layer.visible ? <Eye size={14} /> : <EyeOff size={14} />}
            </button>
            <span className="text-white text-[10px] truncate flex-1">
              {layer.name}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
