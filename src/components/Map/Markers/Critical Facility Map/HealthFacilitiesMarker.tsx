"use client";

import { useEffect, useRef } from "react";
import mapboxgl from "mapbox-gl";
import ReactDOMServer from "react-dom/server";
import { BriefcaseMedical } from "lucide-react";

// --- Refs for state management ---
export const healthFacilityMarkersRef = { current: [] as mapboxgl.Marker[] };
export const lastHealthFacilities = {
  current: null as GeoJSON.FeatureCollection | null,
};
export const healthPopupRef = { current: null as mapboxgl.Popup | null };

// --- Draw function ---
export const drawHealthFacilities = (
  map: mapboxgl.Map | null,
  mapIsLoaded: boolean,
  geojson: GeoJSON.FeatureCollection
) => {
  if (!map || !mapIsLoaded) return;

  lastHealthFacilities.current = geojson;

  // Remove existing markers
  healthFacilityMarkersRef.current.forEach((m) => m.remove());
  healthFacilityMarkersRef.current = [];

  geojson.features.forEach((f) => {
    if (f.geometry.type === "Point") {
      const coords = f.geometry.coordinates as [number, number];
      const iconSVG = ReactDOMServer.renderToString(
        <BriefcaseMedical size={24} color="#ffffff" />
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
          background: #FF0000;
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
          if (key === "osm_id" || key === "osm_type") continue;
          if (props[key] !== null && props[key] !== "") {
            popupHTML += `<div><strong>${key}:</strong> ${props[key]}</div>`;
          }
        }
        popupHTML += "</div>";

        if (!healthPopupRef.current) {
          healthPopupRef.current = new mapboxgl.Popup({
            closeOnClick: true,
            closeButton: true,
          });
        }

        healthPopupRef.current.setLngLat(coords).setHTML(popupHTML).addTo(map);
      });

      healthFacilityMarkersRef.current.push(marker);
    }
  });
};

// --- Clear function ---
export const clearHealthFacilities = (
  map: mapboxgl.Map | null,
  mapIsLoaded: boolean
) => {
  if (!map || !mapIsLoaded) return;

  // remove markers
  healthFacilityMarkersRef.current.forEach((m) => m.remove());
  healthFacilityMarkersRef.current = [];

  // close popup
  if (healthPopupRef.current) {
    healthPopupRef.current.remove();
  }

  lastHealthFacilities.current = null;
};

// --- Hook to restore markers after style change ---
export const useHealthFacilitiesRestore = (
  mapInstance: React.RefObject<mapboxgl.Map | null>,
  mapIsLoaded: React.RefObject<boolean>
) => {
  useEffect(() => {
    const map = mapInstance.current;
    if (!map) return;

    const handleStyleLoad = () => {
      // close any open popup on style change
      healthPopupRef.current?.remove();
      if (lastHealthFacilities.current) {
        drawHealthFacilities(
          mapInstance.current,
          mapIsLoaded.current,
          lastHealthFacilities.current
        );
      }
    };

    map.on("style.load", handleStyleLoad);
    return () => {
      map.off("style.load", handleStyleLoad);
    };
  }, [mapInstance, mapIsLoaded]);
};
