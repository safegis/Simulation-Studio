"use client";

import mapboxgl from "mapbox-gl";
import ReactDOMServer from "react-dom/server";
import { TrafficCone } from "lucide-react";
import React from "react";

// constants + ref
export const obstructionItemsRef = React.createRef<{ remove: () => void }[]>();
export const obstructionSourceId = "road-obstructions-source";
export const obstructionLayerId = "road-obstructions-layer";

export const drawRoadObstructions = (
  map: mapboxgl.Map | null,
  mapIsLoaded: boolean,
  geojson: GeoJSON.FeatureCollection | null
) => {
  if (!map || !mapIsLoaded) return;

  // init ref if needed
  if (!obstructionItemsRef.current) {
    obstructionItemsRef.current = [];
  }

  // clear old markers
  obstructionItemsRef.current.forEach((i) => i.remove());
  obstructionItemsRef.current = [];

  // reset source if empty
  if (!geojson || geojson.features.length === 0) {
    if (map.getSource(obstructionSourceId)) {
      (map.getSource(obstructionSourceId) as mapboxgl.GeoJSONSource).setData({
        type: "FeatureCollection",
        features: [],
      });
    }
    return;
  }

  // Collect all LineStrings for the extent lines
  const lineFeatures: GeoJSON.Feature<GeoJSON.LineString>[] = [];

  geojson.features.forEach((f) => {
    let coord: [number, number] | null = null;

    if (f.geometry.type === "Point") {
      const c = (f.geometry as any).coordinates;
      if (Array.isArray(c) && c.length >= 2) {
        coord = c as [number, number];
      }
    } else if (f.geometry.type === "LineString") {
      const c = (f.geometry as any).coordinates;
      if (Array.isArray(c) && c.length > 0) {
        coord = c[0] as [number, number]; // marker at first point
        // store full line for drawing
        lineFeatures.push({
          type: "Feature",
          geometry: f.geometry as GeoJSON.LineString,
          properties: {},
        });
      }
    }

    if (!coord) return;

    const props = f.properties || {};

    const iconSVG = ReactDOMServer.renderToString(
      <TrafficCone size={24} color="#FF6600" />
    );

    const el = document.createElement("div");
    el.innerHTML = `
      <div style="
        width: 40px;
        height: 40px;
        background: #FFD580;
        transform: rotate(45deg);
        display: flex;
        align-items: center;
        justify-content: center;
        position: relative;
        border: 2px solid #FF6600;
        border-radius: 4px;
      ">
        <div style="transform: rotate(-45deg); display:flex; align-items:center; justify-content:center;">
          ${iconSVG}
        </div>
      </div>
    `;

    const popupHTML = `
      <div style="min-width:180px;">
        <strong>Road Obstruction</strong><br/>
        <div>${props.description ?? ""}</div>
        <div>Start: ${props.startTime ?? "n/a"}</div>
        <div>End: ${props.endTime ?? "n/a"}</div>
      </div>
    `;

    const popup = new mapboxgl.Popup({ offset: 12 }).setHTML(popupHTML);
    const marker = new mapboxgl.Marker({ element: el })
      .setLngLat(coord)
      .setPopup(popup)
      .addTo(map);

    obstructionItemsRef.current!.push({ remove: () => marker.remove() });
  });

  // Update or create shared source + layer
  if (map.getSource(obstructionSourceId)) {
    (map.getSource(obstructionSourceId) as mapboxgl.GeoJSONSource).setData({
      type: "FeatureCollection",
      features: lineFeatures,
    });
  } else {
    map.addSource(obstructionSourceId, {
      type: "geojson",
      data: {
        type: "FeatureCollection",
        features: lineFeatures,
      },
    });

    map.addLayer({
      id: obstructionLayerId,
      type: "line",
      source: obstructionSourceId,
      layout: {
        "line-cap": "round",
        "line-join": "round",
      },
      paint: {
        "line-color": "#FF6600",
        "line-width": 4,
        "line-dasharray": [2, 2],
      },
    });
  }
};
