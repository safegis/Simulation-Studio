"use client";

import mapboxgl from "mapbox-gl";
import ReactDOMServer from "react-dom/server";
import { CircleMinus } from "lucide-react";

export const drawLaneClosures = (
  map: mapboxgl.Map | null,
  mapIsLoaded: boolean,
  laneClosureMarkersRef: React.MutableRefObject<mapboxgl.Marker[]>,
  geojson: GeoJSON.FeatureCollection | null,
  getTopSymbolLayerId: (map: mapboxgl.Map) => string | undefined
) => {
  if (!map || !mapIsLoaded) return;

  const sourceId = "tomtom-lane-closures-src";
  const outlineLayerId = "tomtom-lane-closures-outline";
  const innerLayerId = "tomtom-lane-closures";

  // Remove existing markers first
  laneClosureMarkersRef.current.forEach((m) => m.remove());
  laneClosureMarkersRef.current = [];

  // cleanup layers/sources
  try {
    if (map.getLayer(innerLayerId)) map.removeLayer(innerLayerId);
    if (map.getLayer(outlineLayerId)) map.removeLayer(outlineLayerId);
    if (map.getSource(sourceId)) map.removeSource(sourceId);
  } catch (e) {
    console.warn("cleanup lane closures failed", e);
  }

  // If no features, return early
  if (!geojson || geojson.features.length === 0) return;

  map.addSource(sourceId, { type: "geojson", data: geojson });
  const beforeId = getTopSymbolLayerId(map);

  // outline (black)
  map.addLayer(
    {
      id: outlineLayerId,
      type: "line",
      source: sourceId,
      layout: { "line-join": "round", "line-cap": "round" },
      paint: {
        "line-color": "#000000",
        "line-width": 10,
        "line-opacity": 0.85,
      },
    },
    beforeId
  );

  // inner line (yellow)
  map.addLayer(
    {
      id: innerLayerId,
      type: "line",
      source: sourceId,
      layout: { "line-join": "round", "line-cap": "round" },
      paint: {
        "line-color": "#FFD700",
        "line-width": 6,
        "line-dasharray": [2, 1],
        "line-opacity": 0.95,
      },
    },
    beforeId
  );

  // diamond markers (black border, yellow background, CircleMinus icon)
  geojson.features.forEach((f) => {
    if (f.geometry.type === "LineString") {
      const coords = f.geometry.coordinates;
      if (!coords?.length) return;

      const start = coords[0] as [number, number];
      const iconSVG = ReactDOMServer.renderToString(
        <CircleMinus size={24} color="#000000" />
      );

      const el = document.createElement("div");
      el.innerHTML = `
        <div style="
          width: 40px;
          height: 40px;
          background: #FFD700;
          transform: rotate(45deg);
          border: 2px solid #000000;
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

      laneClosureMarkersRef.current.push(marker);
    }
  });

  // popup
  map.on("click", innerLayerId, (e) => {
    const props = e.features?.[0]?.properties || {};
    const popupHTML = `
      <div style="min-width:180px;">
        <strong>Lane Closure</strong><br/>
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
