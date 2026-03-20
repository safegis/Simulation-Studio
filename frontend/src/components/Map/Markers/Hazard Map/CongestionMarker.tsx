// \SafeGIS\Simulation-Studio\frontend\src\components\Map\Markers\Hazard Map\CongestionMarker.tsx
"use client";

import mapboxgl from "mapbox-gl";
import React from "react";

// ref to store active congestion markers
export const congestionMarkersRef = React.createRef<mapboxgl.Marker[]>();

export const drawCongestion = (
  map: mapboxgl.Map | null,
  mapIsLoaded: boolean,
  geojson: GeoJSON.FeatureCollection | null,
  getTopSymbolLayerId: (map: mapboxgl.Map) => string | undefined
) => {
  if (!map || !mapIsLoaded) return;

  // init ref if empty
  if (!congestionMarkersRef.current) {
    congestionMarkersRef.current = [];
  }

  const sourceId = "tomtom-congestion-src";
  const layerId = "tomtom-congestion";

  // cleanup markers
  congestionMarkersRef.current.forEach((m) => m.remove());
  congestionMarkersRef.current = [];

  // cleanup layers/sources
  try {
    if (map.getLayer(layerId)) map.removeLayer(layerId);
    if (map.getSource(sourceId)) map.removeSource(sourceId);
  } catch {
    // ignore
  }

  if (!geojson || geojson.features.length === 0) return;

  // add source
  map.addSource(sourceId, { type: "geojson", data: geojson });

  const beforeId = getTopSymbolLayerId(map);

  // add congestion layer (lines)
  map.addLayer(
    {
      id: layerId,
      type: "line",
      source: sourceId,
      layout: { "line-join": "round", "line-cap": "round" },
      paint: {
        "line-width": 6,
        "line-opacity": 0.9,
        "line-dasharray": [2, 2],
        "line-color": [
          "match",
          ["get", "severity"],
          1,
          "#00FF00", // free
          2,
          "#ADD8E6", // heavy
          3,
          "#FFA500", // slow
          4,
          "#FF4500", // queuing
          5,
          "#FF0000", // stationary
          "#808080",
        ],
      },
    },
    beforeId
  );

  // markers for each congestion feature
  geojson.features.forEach((f: any) => {
    const coords = f.geometry?.coordinates;
    if (!coords || coords.length < 2) return;

    const sev = f.properties?.severity ?? 0;

    // match marker background color to severity
    let bg = "#808080";
    switch (sev) {
      case 1:
        bg = "#00FF00";
        break;
      case 2:
        bg = "#ADD8E6";
        break;
      case 3:
        bg = "#FFA500";
        break;
      case 4:
        bg = "#FF4500";
        break;
      case 5:
        bg = "#FF0000";
        break;
    }

    // create circular HTML marker
    const el = document.createElement("div");
    Object.assign(el.style, {
      width: "40px",
      height: "40px",
      boxSizing: "border-box",
      display: "grid",
      placeItems: "center",
      borderRadius: "50%",
      background: bg,
      color: "#fff",
      fontSize: "20px",
      fontWeight: "700",
      border: "2px solid #fff",
      lineHeight: "1",
      fontVariantNumeric: "tabular-nums",
      fontFamily:
        'system-ui, -apple-system, "Segoe UI", Roboto, "Helvetica Neue", Arial',
    });
    el.textContent = String(sev);

    const marker = new mapboxgl.Marker({ element: el })
      .setLngLat(coords[0]) // place at first point of LineString
      .addTo(map);

    congestionMarkersRef.current!.push(marker);
  });

  // popup on congestion line click
  map.on("click", layerId, (e) => {
    const props = e.features?.[0]?.properties || {};
    const popupHTML = `
      <div style="min-width:180px;">
        <strong>Congestion</strong><br/>
        <div>Level: ${props.description ?? "Unknown"} (Severity ${
      props.severity
    })</div>
        <div>Start: ${props.startTime ?? "n/a"}</div>
        <div>End: ${props.endTime ?? "n/a"}</div>
      </div>
    `;
    new mapboxgl.Popup().setLngLat(e.lngLat).setHTML(popupHTML).addTo(map);
  });
};
