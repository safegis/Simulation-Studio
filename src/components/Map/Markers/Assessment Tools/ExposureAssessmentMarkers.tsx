// \SafeGIS\Simulation-Studio\frontend\src\components\Map\Markers\Assessment Tools\ExposureAssessmentMarkers.tsx
"use client";

import mapboxgl from "mapbox-gl";

// Cache for loaded GeoJSON data to avoid redundant fetches
const geojsonCache = new Map<string, GeoJSON.FeatureCollection>();

// Load GeoJSON with caching
const loadGeoJSON = async (
  geojsonUrl: string
): Promise<GeoJSON.FeatureCollection> => {
  if (geojsonCache.has(geojsonUrl)) {
    console.log(`Using cached GeoJSON: ${geojsonUrl}`);
    return geojsonCache.get(geojsonUrl)!;
  }

  console.log(`Fetching GeoJSON: ${geojsonUrl}`);
  const response = await fetch(geojsonUrl);
  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }
  const geojson = await response.json();
  geojsonCache.set(geojsonUrl, geojson);
  return geojson;
};

// BEFORE: No visualization for hazard layers during analysis
// AFTER: Draw flood hazard with blue gradient based on severity
export const drawAnalysisFloodHazard = async (
  map: mapboxgl.Map | null,
  mapIsLoaded: boolean,
  geojsonUrl: string,
  returnPeriod: string,
  provinceName: string,
  getTopSymbolLayerId: (map: mapboxgl.Map) => string | undefined
): Promise<void> => {
  if (!map || !mapIsLoaded) return;

  try {
    const geojson = await loadGeoJSON(geojsonUrl);

    const sourceId = `analysis-flood-${returnPeriod}-${provinceName}`.replace(
      /\s+/g,
      "-"
    );
    const layerId = `${sourceId}-layer`;
    const borderLayerId = `${sourceId}-border`;

    // Remove existing layers if they exist
    if (map.getLayer(borderLayerId)) map.removeLayer(borderLayerId);
    if (map.getLayer(layerId)) map.removeLayer(layerId);
    if (map.getSource(sourceId)) map.removeSource(sourceId);

    // Add source
    map.addSource(sourceId, {
      type: "geojson",
      data: geojson,
    });

    // Get the top symbol layer to insert below labels
    const beforeId = getTopSymbolLayerId(map);

    // BEFORE: Would use regular flood hazard colors (yellow/orange/red)
    // AFTER: Use blue gradient for analysis context
    // Add fill layer with blue shades based on Var value (hazard level)
    map.addLayer(
      {
        id: layerId,
        type: "fill",
        source: sourceId,
        paint: {
          "fill-color": [
            "match",
            ["get", "Var"],
            1,
            "#A8DADC", // Light blue - Low hazard (0-0.5m)
            2,
            "#457B9D", // Medium blue - Medium hazard (0.5-1.5m)
            3,
            "#1D3557", // Dark blue - High hazard (>1.5m)
            "#90A4AE", // Gray-blue - Unknown
          ],
          "fill-opacity": 0.4, // Semi-transparent
        },
      },
      beforeId
    );

    // Add subtle border
    map.addLayer(
      {
        id: borderLayerId,
        type: "line",
        source: sourceId,
        paint: {
          "line-color": "#1D3557",
          "line-width": 1,
          "line-opacity": 0.3,
        },
      },
      beforeId
    );

    // Add popup on click
    map.on("click", layerId, (e) => {
      if (!e.features || e.features.length === 0) return;

      const feature = e.features[0];
      const varValue = feature.properties?.Var || 0;
      const hazardLabels = {
        1: "Low Hazard (0-0.5m)",
        2: "Medium Hazard (0.5-1.5m)",
        3: "High Hazard (>1.5m)",
      };
      const hazardLabel = hazardLabels[varValue as 1 | 2 | 3] || "Unknown";

      const popupHTML = `
        <div style="padding: 8px; min-width: 180px;">
          <strong>${provinceName}</strong><br/>
          <strong>${hazardLabel}</strong><br/>
          <span style="font-size: 12px; color: #666;">Return Period: ${returnPeriod}</span>
        </div>
      `;

      new mapboxgl.Popup().setLngLat(e.lngLat).setHTML(popupHTML).addTo(map);
    });

    // Change cursor on hover
    map.on("mouseenter", layerId, () => {
      map.getCanvas().style.cursor = "pointer";
    });

    map.on("mouseleave", layerId, () => {
      map.getCanvas().style.cursor = "";
    });

    console.log(
      `Rendered analysis flood hazard for ${provinceName} (${returnPeriod})`
    );
  } catch (error) {
    console.error(
      `Failed to load analysis flood hazard for ${provinceName}:`,
      error
    );
  }
};

// BEFORE: No visualization for exposure elements during analysis
// AFTER: Draw exposure elements with distinct colors for land cover vs transportation
export const drawAnalysisExposureElement = async (
  map: mapboxgl.Map | null,
  mapIsLoaded: boolean,
  geojsonUrl: string,
  elementName: string,
  elementType: "Land Cover" | "Transportation Networks",
  getTopSymbolLayerId: (map: mapboxgl.Map) => string | undefined
): Promise<void> => {
  if (!map || !mapIsLoaded) return;

  try {
    const geojson = await loadGeoJSON(geojsonUrl);

    const safeName = elementName.replace(/[^a-zA-Z0-9_-]/g, "-");
    const sourceId = `analysis-element-${safeName}`;
    const layerId = `${sourceId}-layer`;
    const outlineLayerId = `${sourceId}-outline`;

    // Remove existing layers if they exist
    if (map.getLayer(outlineLayerId)) map.removeLayer(outlineLayerId);
    if (map.getLayer(layerId)) map.removeLayer(layerId);
    if (map.getSource(sourceId)) map.removeSource(sourceId);

    // Add source
    map.addSource(sourceId, {
      type: "geojson",
      data: geojson,
    });

    // Get the top symbol layer but place BELOW affected areas
    const beforeId = getTopSymbolLayerId(map);

    // BEFORE: Would use generic purple color
    // AFTER: Use green for land cover, yellow for transportation networks
    const isLandCover = elementType === "Land Cover";
    const fillColor = isLandCover ? "#4CAF50" : "#FFC107"; // Green for land cover, Yellow for transportation
    const lineColor = isLandCover ? "#2E7D32" : "#F57C00";

    // Check geometry type to determine layer type
    const hasPolygons = geojson.features.some(
      (f) => f.geometry.type === "Polygon" || f.geometry.type === "MultiPolygon"
    );
    const hasLines = geojson.features.some(
      (f) =>
        f.geometry.type === "LineString" ||
        f.geometry.type === "MultiLineString"
    );
    const hasPoints = geojson.features.some(
      (f) => f.geometry.type === "Point" || f.geometry.type === "MultiPoint"
    );

    if (hasPolygons) {
      // Land cover - polygon fill
      map.addLayer(
        {
          id: layerId,
          type: "fill",
          source: sourceId,
          paint: {
            "fill-color": fillColor,
            "fill-opacity": 0.25,
          },
        },
        beforeId
      );

      map.addLayer(
        {
          id: outlineLayerId,
          type: "line",
          source: sourceId,
          paint: {
            "line-color": lineColor,
            "line-width": 1,
            "line-opacity": 0.5,
          },
        },
        beforeId
      );
    } else if (hasLines) {
      // Transportation networks - line layer
      map.addLayer(
        {
          id: layerId,
          type: "line",
          source: sourceId,
          paint: {
            "line-color": fillColor,
            "line-width": 2,
            "line-opacity": 0.7,
          },
        },
        beforeId
      );
    } else if (hasPoints) {
      // Point elements - circle markers with orange color
      map.addLayer(
        {
          id: layerId,
          type: "circle",
          source: sourceId,
          paint: {
            "circle-radius": 8,
            "circle-color": "#FF6B35", // Orange for point features
            "circle-opacity": 0.7,
            "circle-stroke-width": 2,
            "circle-stroke-color": "#FF4500",
            "circle-stroke-opacity": 0.8,
          },
        },
        beforeId
      );
    }

    // Add popup on click
    map.on("click", layerId, (e) => {
      if (!e.features || e.features.length === 0) return;

      const feature = e.features[0];
      const props = feature.properties || {};

      let html = `<div style="padding: 8px; min-width: 180px;">
        <strong>${elementName}</strong><br/>
        <span style="font-size: 12px; color: #666;">Type: ${elementType}</span><br/>`;

      // Show relevant properties
      for (const key in props) {
        if (key !== "raw" && props[key]) {
          html += `<span style="font-size: 11px;">${key}: ${props[key]}</span><br/>`;
        }
      }
      html += "</div>";

      new mapboxgl.Popup().setLngLat(e.lngLat).setHTML(html).addTo(map);
    });

    // Change cursor on hover
    map.on("mouseenter", layerId, () => {
      map.getCanvas().style.cursor = "pointer";
    });

    map.on("mouseleave", layerId, () => {
      map.getCanvas().style.cursor = "";
    });

    console.log(`Rendered analysis exposure element: ${elementName}`);
  } catch (error) {
    console.error(
      `Failed to load analysis exposure element ${elementName}:`,
      error
    );
  }
};

// BEFORE: Affected areas helper was inline and couldn't be reused
// AFTER: Dedicated function to ensure affected areas are always on top
export const ensureAffectedAreasOnTop = (
  map: mapboxgl.Map | null,
  mapIsLoaded: boolean
): void => {
  if (!map || !mapIsLoaded) return;

  const affectedLayerId = "affected-areas-layer";
  const affectedOutlineId = "affected-areas-outline";

  // Check if layers exist
  if (!map.getLayer(affectedLayerId)) return;

  try {
    // Remove and re-add to place on top (above all other layers)
    const affectedSource = map.getSource("affected-areas");
    if (!affectedSource) return;

    const sourceData = (affectedSource as any)._data;

    // Remove existing layers
    if (map.getLayer(affectedOutlineId)) map.removeLayer(affectedOutlineId);
    if (map.getLayer(affectedLayerId)) map.removeLayer(affectedLayerId);

    // Re-add on top (no beforeId = top layer)
    map.addLayer({
      id: affectedLayerId,
      type: "fill",
      source: "affected-areas",
      paint: {
        "fill-color": "#FF0000",
        "fill-opacity": 0.35, // Slightly more visible
      },
    });

    map.addLayer({
      id: affectedOutlineId,
      type: "line",
      source: "affected-areas",
      paint: {
        "line-color": "#FF0000",
        "line-width": 2.5,
        "line-opacity": 0.9,
      },
    });

    console.log("Affected areas moved to top layer");
  } catch (error) {
    console.error("Error ensuring affected areas on top:", error);
  }
};

// Clear all analysis visualization layers
export const clearAnalysisLayers = (
  map: mapboxgl.Map | null,
  mapIsLoaded: boolean
): void => {
  if (!map || !mapIsLoaded) return;

  const layers = map.getStyle()?.layers || [];

  layers.forEach((layer) => {
    if (
      layer.id.startsWith("analysis-flood-") ||
      layer.id.startsWith("analysis-element-")
    ) {
      if (map.getLayer(layer.id)) {
        map.removeLayer(layer.id);
      }
    }
  });

  // Remove sources
  const sources = Object.keys(map.getStyle()?.sources || {});
  sources.forEach((sourceId) => {
    if (
      sourceId.startsWith("analysis-flood-") ||
      sourceId.startsWith("analysis-element-")
    ) {
      if (map.getSource(sourceId)) {
        map.removeSource(sourceId);
      }
    }
  });

  console.log("Cleared all analysis visualization layers");
};

export const drawAffectedPoints = (
  map: mapboxgl.Map | null,
  mapIsLoaded: boolean,
  affectedPointsGeoJSON: GeoJSON.FeatureCollection
) => {
  if (!map || !mapIsLoaded) return;

  const sourceId = "affected-points";
  const layerId = "affected-points-layer";

  try {
    // Clean up existing layers
    if (map.getLayer(layerId)) map.removeLayer(layerId);
    if (map.getSource(sourceId)) map.removeSource(sourceId);
  } catch (e) {
    console.warn(`Layer cleanup failed for ${layerId}:`, e);
  }

  // Filter only point geometries from affected areas
  const pointFeatures = affectedPointsGeoJSON.features.filter(
    (f) => f.geometry.type === "Point"
  );

  if (pointFeatures.length === 0) return;

  const pointsGeoJSON: GeoJSON.FeatureCollection = {
    type: "FeatureCollection",
    features: pointFeatures,
  };

  // Add source
  map.addSource(sourceId, {
    type: "geojson",
    data: pointsGeoJSON,
  });

  // Add circle layer with zoom-responsive radius (same as volcano markers)
  map.addLayer({
    id: layerId,
    type: "circle",
    source: sourceId,
    paint: {
      "circle-radius": 8, // Auto-scales with zoom
      "circle-color": "#FF6B35", // Orange color for affected points
      "circle-opacity": 0.7,
      "circle-stroke-width": 2,
      "circle-stroke-color": "#FF4500",
      "circle-stroke-opacity": 0.8,
    },
  });

  // Add popup on click
  map.on("click", layerId, (e) => {
    if (!e.features || e.features.length === 0) return;

    const props = e.features[0].properties!;

    let html = `<div style="padding: 8px; min-width: 180px;">
      <strong style="color: #FF6B35;">Affected Point</strong><br/>`;

    if (props.elementName) {
      html += `<span style="font-size: 12px;">Element: ${props.elementName}</span><br/>`;
    }

    html += `<span style="font-size: 11px; color: #666;">Geometry Type: Point</span>`;
    html += "</div>";

    new mapboxgl.Popup().setLngLat(e.lngLat).setHTML(html).addTo(map);
  });

  // Change cursor on hover
  map.on("mouseenter", layerId, () => {
    map.getCanvas().style.cursor = "pointer";
  });

  map.on("mouseleave", layerId, () => {
    map.getCanvas().style.cursor = "";
  });

  console.log(
    `Drew ${pointFeatures.length} affected point markers with zoom-responsive sizing`
  );
};

/**
 * Clear affected point markers from map
 */
export const clearAffectedPoints = (
  map: mapboxgl.Map | null,
  mapIsLoaded: boolean
) => {
  if (!map || !mapIsLoaded) return;

  const sourceId = "affected-points";
  const layerId = "affected-points-layer";

  try {
    if (map.getLayer(layerId)) map.removeLayer(layerId);
    if (map.getSource(sourceId)) map.removeSource(sourceId);
  } catch (e) {
    console.warn(`Failed to clear affected points:`, e);
  }
};
