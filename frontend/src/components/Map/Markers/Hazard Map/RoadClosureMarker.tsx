"use client";

import mapboxgl from "mapbox-gl";
import ReactDOMServer from "react-dom/server";
import { Construction } from "lucide-react";

export const drawRoadClosures = (
  map: mapboxgl.Map | null,
  mapIsLoaded: boolean,
  roadClosureMarkersRef: React.MutableRefObject<mapboxgl.Marker[]>,
  geojson: GeoJSON.FeatureCollection | null,
  getTopSymbolLayerId: (map: mapboxgl.Map) => string | undefined
) => {
  if (!map || !mapIsLoaded) return;

  const sourceId = "tomtom-road-closures-src";
  const outlineLayerId = "tomtom-road-closures-outline";
  const innerLayerId = "tomtom-road-closures";

  // Remove existing markers first
  roadClosureMarkersRef.current.forEach((m) => m.remove());
  roadClosureMarkersRef.current = [];

  // cleanup existing layers + sources
  try {
    if (map.getLayer(innerLayerId)) map.removeLayer(innerLayerId);
    if (map.getLayer(outlineLayerId)) map.removeLayer(outlineLayerId);
    if (map.getSource(sourceId)) map.removeSource(sourceId);
  } catch (e) {
    console.warn("cleanup road closures failed", e);
  }

  // If no features, return early
  if (!geojson || geojson.features.length === 0) return;

  map.addSource(sourceId, { type: "geojson", data: geojson });

  const beforeId = getTopSymbolLayerId(map);

  // outline (red)
  map.addLayer(
    {
      id: outlineLayerId,
      type: "line",
      source: sourceId,
      layout: { "line-join": "round", "line-cap": "round" },
      paint: {
        "line-color": "#FF0000", // red outline
        "line-width": 10,
        "line-opacity": 0.85,
      },
    },
    beforeId
  );

  // inner line (white)
  map.addLayer(
    {
      id: innerLayerId,
      type: "line",
      source: sourceId,
      layout: { "line-join": "round", "line-cap": "round" },
      paint: {
        "line-color": "#FFFFFF", // white inner line
        "line-width": 6,
        "line-dasharray": [2, 1],
        "line-opacity": 0.95,
      },
    },
    beforeId
  );

  // diamond markers
  geojson.features.forEach((f) => {
    if (f.geometry.type === "LineString") {
      const coords = f.geometry.coordinates;
      if (!coords?.length) return;

      const start = coords[0] as [number, number];
      const iconSVG = ReactDOMServer.renderToString(
        <Construction size={24} color="#FF0000" />
      );

      const el = document.createElement("div");
      el.innerHTML = `
        <div style="
          width: 40px;
          height: 40px;
          background: #FFFFFF;
          transform: rotate(45deg);
          border: 2px solid #FF0000;
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
        anchor: "bottom",
        offset: [0, -6],
      })
        .setLngLat(start)
        .addTo(map);

      roadClosureMarkersRef.current.push(marker);
    }
  });

  // popup on line click
  map.on("click", innerLayerId, (e) => {
    const props = e.features?.[0]?.properties || {};
    const popupHTML = `
      <div style="min-width:180px;">
        <strong>Road Closure</strong><br/>
        <div>${props.description ?? ""}</div>
        <div>Start: ${props.startTime ?? "n/a"}</div>
        <div>End: ${props.endTime ?? "n/a"}</div>
      </div>
    `;
    new mapboxgl.Popup().setLngLat(e.lngLat).setHTML(popupHTML).addTo(map);
  });

  map.on("mouseenter", innerLayerId, () => {
    map.getCanvas().style.cursor = "pointer";
  });
  map.on("mouseleave", innerLayerId, () => {
    map.getCanvas().style.cursor = "";
  });
};
