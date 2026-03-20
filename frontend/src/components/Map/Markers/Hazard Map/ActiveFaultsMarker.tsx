"use client";

import mapboxgl from "mapbox-gl";

export const drawActiveFaults = (
  map: mapboxgl.Map | null,
  mapIsLoaded: boolean,
  latestActiveFaultsRef: React.MutableRefObject<GeoJSON.FeatureCollection | null>,
  geojson: GeoJSON.FeatureCollection | null
) => {
  if (!map || !mapIsLoaded) return;

  latestActiveFaultsRef.current = geojson; // store for redraw

  const sourceId = "active-faults";
  const layerId = "active-faults-layer";

  try {
    if (map.getLayer(layerId)) map.removeLayer(layerId);
    if (map.getSource(sourceId)) map.removeSource(sourceId);
  } catch (e) {
    console.warn(`Layer/source cleanup failed for ${layerId}:`, e);
  }

  if (!geojson) return; // null means "clear the layer"

  map.addSource(sourceId, { type: "geojson", data: geojson });
  map.addLayer({
    id: layerId,
    type: "line",
    source: sourceId,
    paint: {
      "line-color": "#FF0000",
      "line-width": 2,
    },
  });

  map.on("mouseenter", layerId, () => {
    map.getCanvas().style.cursor = "pointer";
  });
  map.on("mouseleave", layerId, () => {
    map.getCanvas().style.cursor = "";
  });

  // Popup with ALL properties
  map.on("click", layerId, (e) => {
    const props = e.features?.[0].properties || {};
    let html = "<div style='min-width:180px;'>";
    for (const key in props) {
      html += `<div><strong>${key}:</strong> ${props[key]}</div>`;
    }
    html += "</div>";
    new mapboxgl.Popup().setLngLat(e.lngLat).setHTML(html).addTo(map);
  });
};
