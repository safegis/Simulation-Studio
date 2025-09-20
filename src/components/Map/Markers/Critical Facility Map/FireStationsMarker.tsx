"use client";

import { useEffect } from "react";
import mapboxgl from "mapbox-gl";
import ReactDOMServer from "react-dom/server";
import { FireExtinguisher } from "lucide-react";

// --- Refs for state management ---
export const fireStationMarkersRef = { current: [] as mapboxgl.Marker[] };
export const lastFireStations = {
  current: null as GeoJSON.FeatureCollection | null,
};
export const fireStationPopupRef = { current: null as mapboxgl.Popup | null };

// --- Draw function ---
export const drawFireStations = (
  map: mapboxgl.Map | null,
  mapIsLoaded: boolean,
  geojson: GeoJSON.FeatureCollection
) => {
  if (!map || !mapIsLoaded) return;

  lastFireStations.current = geojson;

  // Remove existing markers
  fireStationMarkersRef.current.forEach((m) => m.remove());
  fireStationMarkersRef.current = [];

  geojson.features.forEach((f) => {
    if (f.geometry.type === "Point") {
      const coords = f.geometry.coordinates as [number, number];
      const iconSVG = ReactDOMServer.renderToString(
        <FireExtinguisher size={24} color="#FF0000" />
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
          background: #FFFFFF;
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

        if (!fireStationPopupRef.current) {
          fireStationPopupRef.current = new mapboxgl.Popup({
            closeOnClick: true,
            closeButton: true,
          });
        }

        fireStationPopupRef.current
          .setLngLat(coords)
          .setHTML(popupHTML)
          .addTo(map);
      });

      fireStationMarkersRef.current.push(marker);
    }
  });
};

// --- Clear function ---
export const clearFireStations = (
  map: mapboxgl.Map | null,
  mapIsLoaded: boolean
) => {
  if (!map || !mapIsLoaded) return;

  // remove markers
  fireStationMarkersRef.current.forEach((m) => m.remove());
  fireStationMarkersRef.current = [];

  // close popup
  if (fireStationPopupRef.current) {
    fireStationPopupRef.current.remove();
  }

  lastFireStations.current = null;
};

// --- Hook to restore markers after style change ---
export const useFireStationsRestore = (
  mapInstance: React.RefObject<mapboxgl.Map | null>,
  mapIsLoaded: React.RefObject<boolean>
) => {
  useEffect(() => {
    const map = mapInstance.current;
    if (!map) return;

    const handleStyleLoad = () => {
      // close any open popup on style change
      fireStationPopupRef.current?.remove();
      if (lastFireStations.current) {
        drawFireStations(
          mapInstance.current,
          mapIsLoaded.current,
          lastFireStations.current
        );
      }
    };

    map.on("style.load", handleStyleLoad);
    return () => {
      map.off("style.load", handleStyleLoad);
    };
  }, [mapInstance, mapIsLoaded]);
};
