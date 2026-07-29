"use client";

import { useRef } from "react";
import mapboxgl from "mapbox-gl";
import ReactDOMServer from "react-dom/server";
import { Users, ShoppingBasket } from "lucide-react";

const PERSONNEL_MARKER_HEIGHT = 68;
const PERSONNEL_MARKER_WIDTH = 78;

type PersonFigureProps = {
  torsoFrom: string;
  torsoTo: string;
  armFrom: string;
  armTo: string;
  scale?: number;
  left?: number;
  bottom?: number;
  zIndex?: number;
};

const PersonFigure = ({
  torsoFrom,
  torsoTo,
  armFrom,
  armTo,
  scale = 1,
  left = 0,
  bottom = 0,
  zIndex = 1,
}: PersonFigureProps) => (
  <div
    style={{
      position: "absolute",
      left: `${left}px`,
      bottom: `${bottom}px`,
      width: "30px",
      height: "56px",
      transform: `scale(${scale})`,
      transformOrigin: "bottom center",
      zIndex,
    }}
  >
    <div
      style={{
        position: "absolute",
        left: "9px",
        top: "0px",
        width: "12px",
        height: "12px",
        borderRadius: "50%",
        background: "linear-gradient(145deg, #f7d8c0 0%, #e2b893 100%)",
        border: "1px solid rgba(90,60,40,0.25)",
        boxShadow: "inset -2px -2px 0 rgba(0,0,0,0.08)",
      }}
    />
    <div
      style={{
        position: "absolute",
        left: "8px",
        top: "12px",
        width: "14px",
        height: "20px",
        borderRadius: "8px 8px 6px 6px",
        background: `linear-gradient(145deg, ${torsoFrom} 0%, ${torsoTo} 100%)`,
        boxShadow:
          "inset -3px -4px 0 rgba(0,0,0,0.15), inset 2px 2px 0 rgba(255,255,255,0.12)",
      }}
    />
    <div
      style={{
        position: "absolute",
        left: "2px",
        top: "14px",
        width: "8px",
        height: "18px",
        borderRadius: "999px",
        background: `linear-gradient(145deg, ${armFrom} 0%, ${armTo} 100%)`,
        transform: "rotate(14deg)",
        transformOrigin: "top center",
      }}
    />
    <div
      style={{
        position: "absolute",
        right: "2px",
        top: "14px",
        width: "8px",
        height: "18px",
        borderRadius: "999px",
        background: `linear-gradient(145deg, ${armTo} 0%, ${torsoTo} 100%)`,
        transform: "rotate(-14deg)",
        transformOrigin: "top center",
      }}
    />
    <div
      style={{
        position: "absolute",
        left: "9px",
        top: "30px",
        width: "5px",
        height: "20px",
        borderRadius: "999px",
        background: "linear-gradient(145deg, #252833 0%, #111827 100%)",
        transform: "rotate(6deg)",
        transformOrigin: "top center",
      }}
    />
    <div
      style={{
        position: "absolute",
        right: "9px",
        top: "30px",
        width: "5px",
        height: "20px",
        borderRadius: "999px",
        background: "linear-gradient(145deg, #374151 0%, #1f2937 100%)",
        transform: "rotate(-6deg)",
        transformOrigin: "top center",
      }}
    />
    <div
      style={{
        position: "absolute",
        left: "6px",
        top: "10px",
        width: "18px",
        height: "8px",
        borderRadius: "999px 999px 6px 6px",
        background: "linear-gradient(145deg, #1f2937 0%, #111827 100%)",
        transform: "translateZ(2px)",
      }}
    />
  </div>
);

const personnelPalette = (label?: string) => {
  const key = (label || "").toLowerCase();
  if (key.includes("health") || key.includes("medical")) {
    return [
      { torsoFrom: "#f87171", torsoTo: "#dc2626", armFrom: "#fca5a5", armTo: "#ef4444" },
      { torsoFrom: "#ffffff", torsoTo: "#e5e7eb", armFrom: "#f3f4f6", armTo: "#d1d5db" },
      { torsoFrom: "#fb7185", torsoTo: "#be123c", armFrom: "#fda4af", armTo: "#e11d48" },
    ];
  }
  if (key.includes("rescue") || key.includes("response")) {
    return [
      { torsoFrom: "#fb923c", torsoTo: "#ea580c", armFrom: "#fdba74", armTo: "#f97316" },
      { torsoFrom: "#fbbf24", torsoTo: "#d97706", armFrom: "#fcd34d", armTo: "#f59e0b" },
      { torsoFrom: "#f97316", torsoTo: "#c2410c", armFrom: "#fb923c", armTo: "#ea580c" },
    ];
  }
  if (key.includes("security") || key.includes("law")) {
    return [
      { torsoFrom: "#60a5fa", torsoTo: "#1d4ed8", armFrom: "#93c5fd", armTo: "#3b82f6" },
      { torsoFrom: "#1e3a8a", torsoTo: "#0f172a", armFrom: "#334155", armTo: "#1e293b" },
      { torsoFrom: "#3b82f6", torsoTo: "#1e40af", armFrom: "#60a5fa", armTo: "#2563eb" },
    ];
  }
  if (key.includes("logistics")) {
    return [
      { torsoFrom: "#34d399", torsoTo: "#059669", armFrom: "#6ee7b7", armTo: "#10b981" },
      { torsoFrom: "#a3e635", torsoTo: "#65a30d", armFrom: "#bef264", armTo: "#84cc16" },
      { torsoFrom: "#22c55e", torsoTo: "#15803d", armFrom: "#4ade80", armTo: "#16a34a" },
    ];
  }
  if (key.includes("admin")) {
    return [
      { torsoFrom: "#a78bfa", torsoTo: "#6d28d9", armFrom: "#c4b5fd", armTo: "#8b5cf6" },
      { torsoFrom: "#818cf8", torsoTo: "#4f46e5", armFrom: "#a5b4fc", armTo: "#6366f1" },
      { torsoFrom: "#c084fc", torsoTo: "#7e22ce", armFrom: "#d8b4fe", armTo: "#a855f7" },
    ];
  }
  return [
    { torsoFrom: "#7c83ff", torsoTo: "#4a4fb8", armFrom: "#8e95ff", armTo: "#5f65d6" },
    { torsoFrom: "#9699FF", torsoTo: "#5A5C99", armFrom: "#b0b3ff", armTo: "#6e71c4" },
    { torsoFrom: "#6366f1", torsoTo: "#3730a3", armFrom: "#818cf8", armTo: "#4f46e5" },
  ];
};

const createPersonnelMarker = (label?: string) => {
  const palette = personnelPalette(label);
  return (
    <div
      style={{
        position: "relative",
        width: `${PERSONNEL_MARKER_WIDTH}px`,
        height: `${PERSONNEL_MARKER_HEIGHT}px`,
        filter: "drop-shadow(0 8px 10px rgba(0,0,0,0.35))",
        pointerEvents: "auto",
      }}
    >
      <div
        style={{
          position: "absolute",
          left: "18px",
          bottom: "2px",
          width: "44px",
          height: "10px",
          borderRadius: "999px",
          background: "rgba(15,23,42,0.28)",
          transform: "perspective(40px) rotateX(70deg)",
        }}
      />
      {/* Back-left teammate */}
      <PersonFigure
        {...palette[0]}
        left={4}
        bottom={4}
        scale={0.86}
        zIndex={1}
      />
      {/* Back-right teammate */}
      <PersonFigure
        {...palette[1]}
        left={42}
        bottom={4}
        scale={0.86}
        zIndex={1}
      />
      {/* Front lead */}
      <PersonFigure
        {...palette[2]}
        left={23}
        bottom={0}
        scale={1}
        zIndex={2}
      />
    </div>
  );
};

const INFRA_MARKER_HEIGHT = 72;
const INFRA_MARKER_WIDTH = 70;

type InfraTheme = {
  front: string;
  side: string;
  roof: string;
  accent: string;
  kind:
    | "hospital"
    | "water"
    | "shelter"
    | "transport"
    | "comm"
    | "power"
    | "warehouse"
    | "sanitation"
    | "command"
    | "generic";
};

const infrastructureTheme = (label?: string): InfraTheme => {
  const key = (label || "").toLowerCase();
  if (key.includes("health") || key.includes("medical")) {
    return {
      front: "#f8fafc",
      side: "#e2e8f0",
      roof: "#dc2626",
      accent: "#ef4444",
      kind: "hospital",
    };
  }
  if (key.includes("water")) {
    return {
      front: "#bae6fd",
      side: "#7dd3fc",
      roof: "#0284c7",
      accent: "#0ea5e9",
      kind: "water",
    };
  }
  if (key.includes("shelter") || key.includes("evacuat")) {
    return {
      front: "#fde68a",
      side: "#fbbf24",
      roof: "#d97706",
      accent: "#f59e0b",
      kind: "shelter",
    };
  }
  if (key.includes("transport")) {
    return {
      front: "#cbd5e1",
      side: "#94a3b8",
      roof: "#475569",
      accent: "#334155",
      kind: "transport",
    };
  }
  if (key.includes("comm")) {
    return {
      front: "#c7d2fe",
      side: "#a5b4fc",
      roof: "#4338ca",
      accent: "#6366f1",
      kind: "comm",
    };
  }
  if (key.includes("power") || key.includes("generator")) {
    return {
      front: "#fef08a",
      side: "#facc15",
      roof: "#a16207",
      accent: "#eab308",
      kind: "power",
    };
  }
  if (key.includes("supply") || key.includes("distribution")) {
    return {
      front: "#bbf7d0",
      side: "#86efac",
      roof: "#15803d",
      accent: "#22c55e",
      kind: "warehouse",
    };
  }
  if (key.includes("sanitation")) {
    return {
      front: "#a7f3d0",
      side: "#6ee7b7",
      roof: "#0f766e",
      accent: "#14b8a6",
      kind: "sanitation",
    };
  }
  if (key.includes("command") || key.includes("field")) {
    return {
      front: "#ddd6fe",
      side: "#c4b5fd",
      roof: "#5b21b6",
      accent: "#8b5cf6",
      kind: "command",
    };
  }
  return {
    front: "#d1fae5",
    side: "#86efac",
    roof: "#166534",
    accent: "#22c55e",
    kind: "generic",
  };
};

const createInfrastructureMarker = (label?: string) => {
  const theme = infrastructureTheme(label);
  const isHospital = theme.kind === "hospital";
  const isWater = theme.kind === "water";
  const isShelter = theme.kind === "shelter";
  const isComm = theme.kind === "comm";
  const isPower = theme.kind === "power";

  return (
    <div
      style={{
        position: "relative",
        width: `${INFRA_MARKER_WIDTH}px`,
        height: `${INFRA_MARKER_HEIGHT}px`,
        filter: "drop-shadow(0 8px 10px rgba(0,0,0,0.35))",
        pointerEvents: "auto",
      }}
    >
      {/* Ground shadow */}
      <div
        style={{
          position: "absolute",
          left: "12px",
          bottom: "2px",
          width: "46px",
          height: "12px",
          borderRadius: "999px",
          background: "rgba(15,23,42,0.28)",
          transform: "perspective(40px) rotateX(70deg)",
        }}
      />

      {/* Side face */}
      <div
        style={{
          position: "absolute",
          left: isWater ? "34px" : "38px",
          bottom: "8px",
          width: isWater ? "16px" : "18px",
          height: isWater ? "34px" : isShelter ? "22px" : "34px",
          background: `linear-gradient(180deg, ${theme.side} 0%, ${theme.side}cc 100%)`,
          transform: "skewY(-18deg)",
          borderRadius: isWater ? "8px 8px 4px 4px" : "2px",
          zIndex: 1,
        }}
      />

      {/* Front face */}
      <div
        style={{
          position: "absolute",
          left: isWater ? "18px" : "14px",
          bottom: "8px",
          width: isWater ? "24px" : "28px",
          height: isWater ? "36px" : isShelter ? "24px" : "36px",
          background: `linear-gradient(145deg, ${theme.front} 0%, ${theme.side} 100%)`,
          borderRadius: isWater ? "10px 10px 4px 4px" : isShelter ? "2px" : "3px 3px 2px 2px",
          boxShadow: "inset -3px -4px 0 rgba(0,0,0,0.08)",
          zIndex: 2,
          overflow: "hidden",
        }}
      >
        {/* Windows / details */}
        {!isWater && !isShelter && (
          <>
            <div
              style={{
                position: "absolute",
                left: "5px",
                top: "8px",
                width: "6px",
                height: "7px",
                borderRadius: "1px",
                background: "rgba(30,58,138,0.45)",
              }}
            />
            <div
              style={{
                position: "absolute",
                left: "15px",
                top: "8px",
                width: "6px",
                height: "7px",
                borderRadius: "1px",
                background: "rgba(30,58,138,0.45)",
              }}
            />
            <div
              style={{
                position: "absolute",
                left: "10px",
                bottom: "4px",
                width: "8px",
                height: "10px",
                borderRadius: "1px 1px 0 0",
                background: "rgba(15,23,42,0.35)",
              }}
            />
          </>
        )}
        {isWater && (
          <div
            style={{
              position: "absolute",
              left: "5px",
              top: "8px",
              width: "14px",
              height: "18px",
              borderRadius: "6px",
              background: "linear-gradient(180deg, #e0f2fe 0%, #38bdf8 100%)",
              border: "1px solid rgba(2,132,199,0.45)",
            }}
          />
        )}
        {isShelter && (
          <div
            style={{
              position: "absolute",
              left: "0",
              right: "0",
              bottom: "0",
              height: "10px",
              background: "rgba(146,64,14,0.35)",
            }}
          />
        )}
      </div>

      {/* Roof */}
      {isShelter ? (
        <div
          style={{
            position: "absolute",
            left: "10px",
            bottom: "28px",
            width: "0",
            height: "0",
            borderLeft: "24px solid transparent",
            borderRight: "24px solid transparent",
            borderBottom: `18px solid ${theme.roof}`,
            zIndex: 3,
            filter: "drop-shadow(0 1px 0 rgba(0,0,0,0.15))",
          }}
        />
      ) : (
        <div
          style={{
            position: "absolute",
            left: isWater ? "16px" : "12px",
            bottom: isWater ? "42px" : "42px",
            width: isWater ? "28px" : "36px",
            height: isWater ? "10px" : "12px",
            background: `linear-gradient(135deg, ${theme.roof} 0%, ${theme.accent} 100%)`,
            transform: "skewX(-28deg)",
            borderRadius: "2px",
            zIndex: 3,
            boxShadow: "0 2px 0 rgba(0,0,0,0.12)",
          }}
        />
      )}

      {/* Type accents */}
      {isHospital && (
        <div
          style={{
            position: "absolute",
            left: "22px",
            bottom: "48px",
            width: "14px",
            height: "14px",
            borderRadius: "3px",
            background: "#fff",
            border: `1.5px solid ${theme.accent}`,
            zIndex: 4,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: theme.accent,
            fontSize: "11px",
            fontWeight: 800,
            lineHeight: 1,
          }}
        >
          +
        </div>
      )}
      {isComm && (
        <>
          <div
            style={{
              position: "absolute",
              left: "33px",
              bottom: "52px",
              width: "3px",
              height: "16px",
              background: theme.accent,
              zIndex: 4,
              borderRadius: "999px",
            }}
          />
          <div
            style={{
              position: "absolute",
              left: "28px",
              bottom: "64px",
              width: "12px",
              height: "12px",
              border: `2px solid ${theme.accent}`,
              borderRadius: "50%",
              zIndex: 4,
              opacity: 0.85,
            }}
          />
        </>
      )}
      {isPower && (
        <div
          style={{
            position: "absolute",
            left: "26px",
            bottom: "48px",
            width: "0",
            height: "0",
            borderLeft: "5px solid transparent",
            borderRight: "5px solid transparent",
            borderTop: "10px solid #78350f",
            zIndex: 4,
            transform: "rotate(12deg)",
          }}
        />
      )}
      {(theme.kind === "warehouse" || theme.kind === "transport") && (
        <div
          style={{
            position: "absolute",
            left: "8px",
            bottom: "8px",
            width: "10px",
            height: "8px",
            borderRadius: "1px",
            background: theme.kind === "transport" ? "#64748b" : "#166534",
            zIndex: 0,
            opacity: 0.85,
          }}
        />
      )}
    </div>
  );
};

export const useResources = (
  mapInstance: React.RefObject<mapboxgl.Map | null>
) => {
  const resourceMarkersRef = useRef<
    {
      id: string;
      type: string;
      marker: mapboxgl.Marker;
      data: { name: string; description: string };
      coords: mapboxgl.LngLat;
    }[]
  >([]);

  const resourceListenersRef = useRef<((resources: any[]) => void)[]>([]);

  const notifyResourcesChanged = () => {
    const snapshot = resourceMarkersRef.current.map((r) => ({
      id: r.id,
      type: r.type,
      data: r.data,
      coords: r.marker.getLngLat(), // live coords
    }));
    resourceListenersRef.current.forEach((cb) => cb(snapshot));
  };

  const addResourceMarker = (
    lngLat: mapboxgl.LngLat,
    type: string,
    initialData?: { name: string; description: string }
  ) => {
    const id = `${type}-${Date.now()}`;
    let icon;
    let borderColor = "black"; // default border
    let markerWrapper;

    // Pick icon + color based on resource type
    switch (type) {
      case "personnel":
        markerWrapper = createPersonnelMarker(initialData?.name);
        break;
      case "infrastructure":
        markerWrapper = createInfrastructureMarker(initialData?.name);
        break;
      case "supplies":
        icon = <ShoppingBasket size={20} color="blue" />;
        borderColor = "blue";
        break;
      default:
        icon = <Users size={20} />;
    }

    if (!markerWrapper) {
      // Default non-3D resources keep the circular planner marker style.
      markerWrapper = (
        <div
          style={{
            backgroundColor: "white",
            borderRadius: "50%",
            width: "38px",
            height: "38px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            border: `2px solid ${borderColor}`,
            boxShadow: "0 0 4px rgba(0,0,0,0.3)",
          }}
        >
          {icon}
        </div>
      );
    }

    // Create DOM element for marker
    const el = document.createElement("div");
    el.innerHTML = ReactDOMServer.renderToString(markerWrapper);
    el.style.cursor = "grab";

    const useGroundedMarker =
      type === "personnel" || type === "infrastructure";
    const groundedHeight =
      type === "personnel" ? PERSONNEL_MARKER_HEIGHT : INFRA_MARKER_HEIGHT;

    // Create marker
    const marker = new mapboxgl.Marker({
      element: el,
      draggable: true,
      anchor: useGroundedMarker ? "bottom" : "center",
      offset: useGroundedMarker
        ? [0, Math.round(-groundedHeight / 2)]
        : [0, 0],
    })
      .setLngLat(lngLat)
      .addTo(mapInstance.current!);

    // Default resource details
    let resourceData = {
      type,
      name: initialData?.name ?? type.charAt(0).toUpperCase() + type.slice(1),
      description: initialData?.description ?? "",
    };

    // Create popup HTML with editable form
    const createPopupHTML = () => `
    <div style="min-width:200px;">
      <strong>Edit Resource</strong>
      <div style="margin-top:8px;">
        <label>Name:</label><br/>
        <input type="text" id="res-name" value="${resourceData.name}" style="width:100%; margin-bottom:6px;"/>
        <label>Description:</label><br/>
        <textarea id="res-desc" rows="3" style="width:100%;">${resourceData.description}</textarea>
      </div>
      <div style="margin-top:10px; display:flex; justify-content:space-between;">
        <button id="save-btn" style="background:#5A5C99; color:white; padding:4px 8px; border-radius:4px;">Save</button>
        <button id="delete-btn" style="background:#B33A3A; color:white; padding:4px 8px; border-radius:4px;">Delete</button>
      </div>
    </div>
    `;

    const popup = new mapboxgl.Popup({ offset: 25 })
      .setLngLat(lngLat)
      .setHTML(createPopupHTML());

    // Attach popup to marker
    marker.setPopup(popup);

    // Resource object stored in ref
    const resourceObj = {
      id,
      type,
      marker,
      data: resourceData,
      coords: lngLat,
    };

    // Event: When popup opens, attach listeners to Save/Delete
    marker.getElement().addEventListener("click", () => {
      setTimeout(() => {
        const saveBtn = document.getElementById("save-btn");
        const deleteBtn = document.getElementById("delete-btn");
        const nameInput = document.getElementById(
          "res-name"
        ) as HTMLInputElement;
        const descInput = document.getElementById(
          "res-desc"
        ) as HTMLTextAreaElement;

        if (saveBtn) {
          saveBtn.onclick = () => {
            resourceData.name = nameInput.value;
            resourceData.description = descInput.value;
            popup.setHTML(createPopupHTML()); // refresh popup
            notifyResourcesChanged();
          };
        }

        if (deleteBtn) {
          deleteBtn.onclick = () => {
            marker.remove();
            popup.remove();
            resourceMarkersRef.current = resourceMarkersRef.current.filter(
              (r) => r.marker !== marker
            );
            notifyResourcesChanged();
          };
        }
      }, 50); // allow popup to render before attaching events
    });

    // Update coordinates when marker is dragged
    marker.on("dragend", () => {
      const newPos = marker.getLngLat();
      resourceObj.coords = newPos; // update coords
      notifyResourcesChanged();
    });

    // Add to resources list
    resourceMarkersRef.current.push(resourceObj);
    notifyResourcesChanged();
  };

  const clearAllResources = () => {
    resourceMarkersRef.current.forEach((r) => {
      r.marker.remove();
    });
    resourceMarkersRef.current = [];
    notifyResourcesChanged();
  };

  const flyToResource = (id: string) => {
    const res = resourceMarkersRef.current.find((r) => r.id === id);
    if (res && mapInstance.current) {
      mapInstance.current.flyTo({
        center: res.marker.getLngLat(),
        zoom: 14,
      });
      res.marker.togglePopup();
    }
  };

  const getResourcesOnMap = () => {
    return resourceMarkersRef.current;
  };

  return {
    resourceMarkersRef,
    resourceListenersRef,
    addResourceMarker,
    clearAllResources,
    flyToResource,
    getResourcesOnMap,
    onResourcesChanged: (cb: (resources: any[]) => void) => {
      resourceListenersRef.current.push(cb);
    },
    notifyResourcesChanged,
  };
};
