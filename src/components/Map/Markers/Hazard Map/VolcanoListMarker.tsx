// \SafeGIS\Simulation-Studio\frontend\src\components\Map\Markers\Hazard Map\VolcanoListMarker.tsx
"use client";

import mapboxgl from "mapbox-gl";

export const drawVolcanoDots = (
  map: mapboxgl.Map | null,
  mapIsLoaded: boolean,
  latestVolcanoesRef: React.RefObject<any[]>,
  volcanoes: any[]
) => {
  if (!map || !mapIsLoaded) return;
  latestVolcanoesRef.current = volcanoes;

  const sourceId = "volcanoes";
  const layerId = "volcanoes-layer";

  try {
    if (map.getLayer(layerId)) map.removeLayer(layerId);
    if (map.getSource(sourceId)) map.removeSource(sourceId);
  } catch (e) {
    console.warn(`Layer/source cleanup failed for ${layerId}:`, e);
  }

  const geojson: GeoJSON.FeatureCollection = {
    type: "FeatureCollection",
    features: volcanoes.map((v) => ({
      type: "Feature",
      properties: {
        name: v.vName,
        country: v.country,
        elevation: v.elevation_m,
      },
      geometry: {
        type: "Point",
        coordinates: [v.longitude, v.latitude],
      },
    })),
  };

  map.addSource(sourceId, { type: "geojson", data: geojson });
  map.addLayer({
    id: layerId,
    type: "circle",
    source: sourceId,
    paint: {
      "circle-radius": 6,
      "circle-color": "orange",
      "circle-stroke-width": 2,
      "circle-stroke-color": "white",
    },
  });

  map.on("click", layerId, (e) => {
    const props = e.features?.[0].properties!;
    const popupHTML = `
      <div style="min-width: 180px;">
        <strong>${props.name}</strong><br/>
        <span>Country: ${props.country}</span><br/>
        <span>Elevation: ${props.elevation} m</span>
      </div>
    `;
    new mapboxgl.Popup().setLngLat(e.lngLat).setHTML(popupHTML).addTo(map);
  });

  map.on("mouseenter", layerId, () => {
    map.getCanvas().style.cursor = "pointer";
  });
  map.on("mouseleave", layerId, () => {
    map.getCanvas().style.cursor = "";
  });
};
