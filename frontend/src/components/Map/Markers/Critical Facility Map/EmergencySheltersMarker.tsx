// \SafeGIS\Simulation-Studio\frontend\src\components\Map\Markers\Critical Facility Map\EmergencySheltersMarker.tsx
"use client";

import { useEffect, useRef } from "react";
import mapboxgl from "mapbox-gl";
import ReactDOMServer from "react-dom/server";
import { LandPlot } from "lucide-react";

// --- Refs for state management ---
export const emergencyShelterMarkersRef = { current: [] as mapboxgl.Marker[] };
export const lastEmergencyShelters = {
  current: null as GeoJSON.FeatureCollection | null,
};
export const emergencyShelterPopupRef = {
  current: null as mapboxgl.Popup | null,
};

// --- Draw function ---
export const drawEmergencyShelters = (
  map: mapboxgl.Map | null,
  mapIsLoaded: boolean,
  geojson: GeoJSON.FeatureCollection
) => {
  if (!map || !mapIsLoaded) return;

  lastEmergencyShelters.current = geojson;

  // Remove existing markers
  emergencyShelterMarkersRef.current.forEach((m) => m.remove());
  emergencyShelterMarkersRef.current = [];

  geojson.features.forEach((f) => {
    if (f.geometry.type === "Point") {
      const coords = f.geometry.coordinates as [number, number];
      const iconSVG = ReactDOMServer.renderToString(
        <LandPlot size={24} color="#ffffff" />
      );

      const el = document.createElement("div");
      el.style.display = "flex";
      el.style.alignItems = "center";
      el.style.justifyContent = "center";
      el.style.width = "40px";
      el.style.height = "40px";
      el.style.cursor = "pointer";

      el.innerHTML = `
        <div style="
          width: 40px;
          height: 40px;
          background: #00AA00;
          transform: rotate(45deg);
          box-shadow: 0 1px 4px rgba(0,0,0,0.3);
          display: flex;
          align-items: center;
          justify-content: center;">
          <div style="transform: rotate(-45deg); display:flex; align-items:center; justify-content:center;">
            ${iconSVG}
          </div>
        </div>
      `;

      const marker = new mapboxgl.Marker({
        element: el,
        anchor: "center",
      })
        .setLngLat(coords)
        .addTo(map);

      // Add popup on marker click
      marker.getElement().addEventListener("click", (e) => {
        e.stopPropagation();
        const props = f.properties || {};
        let popupHTML = `<div style="min-width:180px;">`;
        for (const key in props) {
          if (
            key === "osm_id" ||
            key === "osm_type" ||
            key === "type" ||
            key === "id"
          )
            continue;
          if (props[key] !== null && props[key] !== "") {
            popupHTML += `<div><strong>${key}:</strong> ${props[key]}</div>`;
          }
        }
        popupHTML += "</div>";

        if (!emergencyShelterPopupRef.current) {
          emergencyShelterPopupRef.current = new mapboxgl.Popup({
            closeOnClick: true,
            closeButton: true,
          });
        }

        emergencyShelterPopupRef.current
          .setLngLat(coords)
          .setHTML(popupHTML)
          .addTo(map);
      });

      emergencyShelterMarkersRef.current.push(marker);
    }
  });
};

// --- Clear function ---
export const clearEmergencyShelters = (
  map: mapboxgl.Map | null,
  mapIsLoaded: boolean
) => {
  if (!map || !mapIsLoaded) return;

  // remove markers
  emergencyShelterMarkersRef.current.forEach((m) => m.remove());
  emergencyShelterMarkersRef.current = [];

  // close popup
  if (emergencyShelterPopupRef.current) {
    emergencyShelterPopupRef.current.remove();
  }

  lastEmergencyShelters.current = null;
};

// --- Hook to restore markers after style change ---
export const useEmergencySheltersRestore = (
  mapInstance: React.RefObject<mapboxgl.Map | null>,
  mapIsLoaded: React.RefObject<boolean>
) => {
  useEffect(() => {
    const map = mapInstance.current;
    if (!map) return;

    const handleStyleLoad = () => {
      // close any open popup on style change
      emergencyShelterPopupRef.current?.remove();
      if (lastEmergencyShelters.current) {
        drawEmergencyShelters(
          mapInstance.current,
          mapIsLoaded.current,
          lastEmergencyShelters.current
        );
      }
    };

    map.on("style.load", handleStyleLoad);
    return () => {
      map.off("style.load", handleStyleLoad);
    };
  }, [mapInstance, mapIsLoaded]);
};
