"use client";

import mapboxgl from "mapbox-gl";

export const drawEarthquakeDots = (
  map: mapboxgl.Map | null,
  mapIsLoaded: boolean,
  latestEarthquakesRef: React.RefObject<any[]>,
  features: any[]
) => {
  if (!map || !mapIsLoaded) return;
  latestEarthquakesRef.current = features;

  const sourceId = "earthquakes";
  const layerId = "earthquakes-layer";

  try {
    if (map.getLayer(layerId)) map.removeLayer(layerId);
    if (map.getSource(sourceId)) map.removeSource(sourceId);
  } catch (e) {
    console.warn(`Layer/source cleanup failed for ${layerId}:`, e);
  }

  const geojson: GeoJSON.FeatureCollection = {
    type: "FeatureCollection",
    features: features.map((f: any) => ({
      type: "Feature",
      properties: {
        mag: f.properties.mag,
        place: f.properties.place,
        time: f.properties.time,
        depth: f.geometry.coordinates[2],
      },
      geometry: {
        type: "Point",
        coordinates: f.geometry.coordinates.slice(0, 2),
      },
    })),
  };

  map.addSource(sourceId, { type: "geojson", data: geojson });
  map.addLayer({
    id: layerId,
    type: "circle",
    source: sourceId,
    paint: {
      "circle-radius": ["interpolate", ["linear"], ["get", "mag"], 0, 6, 8, 18],
      "circle-color": "red",
      "circle-stroke-width": 2,
      "circle-stroke-color": "white",
    },
  });

  map.on("click", layerId, (e) => {
    const props = e.features?.[0].properties!;
    const popupHTML = `
      <div style="min-width: 160px;">
        <strong>${props.place}</strong><br/>
        <span>Magnitude: ${props.mag}</span><br/>
        <span>Depth: ${Number(props.depth).toFixed(1)} km</span><br/>
        <span>${new Date(Number(props.time)).toLocaleString()}</span>
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
