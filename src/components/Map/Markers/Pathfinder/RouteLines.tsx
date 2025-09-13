"use client";

import mapboxgl from "mapbox-gl";

// ✅ New: centralize bringRouteToFront here
export const bringRouteToFront = (
  map: mapboxgl.Map | null,
  featureIndex: number | null
) => {
  if (!map || featureIndex === null) return;
  const routeId = `route-${featureIndex}`;
  const outlineId = `${routeId}-outline`;

  try {
    if (map.getLayer(outlineId)) map.moveLayer(outlineId);
  } catch {
    // ignore missing outline
  }

  try {
    if (map.getLayer(routeId)) map.moveLayer(routeId);
  } catch {
    // ignore missing line
  }
};

export const drawRoutes = (
  map: mapboxgl.Map | null,
  mapIsLoaded: React.RefObject<boolean>,
  latestRoutesGeoJSON: React.RefObject<GeoJSON.FeatureCollection | null>,
  selectedFeatureIndexRef: React.RefObject<number | null>,
  getTopSymbolLayerId: (map: mapboxgl.Map) => string | undefined
) => {
  if (!map || !mapIsLoaded.current) return;

  const geojson = latestRoutesGeoJSON.current;
  if (!geojson) return;

  // cleanup old
  const style = map.getStyle();
  if (!style?.layers) return;
  style.layers.forEach((layer) => {
    if (layer.id.startsWith("route-")) {
      if (map.getLayer(layer.id)) map.removeLayer(layer.id);
      if (map.getSource(layer.id)) map.removeSource(layer.id);
    }
  });

  const beforeId = getTopSymbolLayerId(map);

  geojson.features.forEach((feature, index) => {
    const id = `route-${index}`;
    const isSelected = selectedFeatureIndexRef.current === index;

    map.addSource(id, {
      type: "geojson",
      data: { type: "FeatureCollection", features: [feature] },
    });

    map.addLayer(
      {
        id: `${id}-outline`,
        type: "line",
        source: id,
        layout: { "line-join": "round", "line-cap": "round" },
        paint: {
          "line-color": "#9699FF",
          "line-width": 10,
          "line-opacity": 0.9,
        },
      },
      beforeId
    );

    map.addLayer(
      {
        id,
        type: "line",
        source: id,
        layout: { "line-join": "round", "line-cap": "round" },
        paint: {
          "line-color": isSelected ? "#9699FF" : "#ffffff",
          "line-width": 6,
          "line-opacity": 0.85,
        },
      },
      beforeId
    );
  });

  if (selectedFeatureIndexRef.current !== null) {
    bringRouteToFront(map, selectedFeatureIndexRef.current);
  }
};

// ✅ Highlight an already-drawn route by index
export const highlightRouteByFeatureIndex = (
  map: mapboxgl.Map | null,
  mapIsLoaded: React.RefObject<boolean>,
  selectedFeatureIndexRef: React.RefObject<number | null>,
  featureIndex: number | null
) => {
  if (!map || !mapIsLoaded.current) return;

  selectedFeatureIndexRef.current = featureIndex;

  try {
    const style = map.getStyle();
    if (!style?.layers) return;

    style.layers.forEach((layer) => {
      // inner layer has id `route-<i>` and there's also route-<i>-outline
      const m = layer.id.match(/^route-(\d+)$/);
      if (!m) return;
      const idx = Number(m[1]);
      const layerId = `route-${idx}`;
      try {
        map.setPaintProperty(
          layerId,
          "line-color",
          idx === featureIndex ? "#9699FF" : "#ffffff"
        );
      } catch {
        // ignore missing layers / race conditions
      }
    });

    // bring selected route layers to front
    if (featureIndex !== null) {
      bringRouteToFront(map, featureIndex);
    }
  } catch (e) {
    console.warn("highlightRouteByFeatureIndex failed", e);
  }
};
