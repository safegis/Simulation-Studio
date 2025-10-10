"use client";

import mapboxgl from "mapbox-gl";

export const floodLayerSourceIds = {
  current: new Set<string>(),
};

// Cache for loaded GeoJSON data
const geojsonCache = new Map<string, GeoJSON.FeatureCollection>();

const getHazardColor = (varValue: number): string => {
  switch (varValue) {
    case 1:
      return "#FFFF00"; // Yellow - Low hazard (0-0.5 meters)
    case 2:
      return "#FFA500"; // Orange - Medium hazard (>0.5-1.5 meters)
    case 3:
      return "#FF0000"; // Red - High hazard (>1.5 meters)
    default:
      return "#808080"; // Gray - Unknown
  }
};

const getHazardLabel = (varValue: number): string => {
  switch (varValue) {
    case 1:
      return "Low Hazard (0-0.5m)";
    case 2:
      return "Medium Hazard (0.5-1.5m)";
    case 3:
      return "High Hazard (>1.5m)";
    default:
      return "Unknown";
  }
};

// Function to fetch GeoJSON directly
const loadGeoJSON = async (
  geojsonUrl: string
): Promise<GeoJSON.FeatureCollection> => {
  // Check cache first
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

  // Cache the result
  geojsonCache.set(geojsonUrl, geojson);
  console.log(`Cached GeoJSON: ${geojsonUrl}`);

  return geojson;
};

export const drawFloodHazard = async (
  map: mapboxgl.Map | null,
  mapIsLoaded: boolean,
  geojsonUrl: string,
  returnPeriod: string,
  provinceName: string
): Promise<mapboxgl.LngLatBounds | null> => {
  if (!map || !mapIsLoaded) return null;

  try {
    // Load the GeoJSON (from cache or fetch)
    const geojson = await loadGeoJSON(geojsonUrl);

    const sourceId = `flood-${returnPeriod}-${provinceName}`.replace(
      /\s+/g,
      "-"
    );
    const layerId = `${sourceId}-layer`;
    const borderLayerId = `${sourceId}-border`;

    // Track this source ID
    floodLayerSourceIds.current.add(sourceId);

    // Remove existing layers if they exist
    if (map.getLayer(borderLayerId)) map.removeLayer(borderLayerId);
    if (map.getLayer(layerId)) map.removeLayer(layerId);
    if (map.getSource(sourceId)) map.removeSource(sourceId);

    // Add source
    map.addSource(sourceId, {
      type: "geojson",
      data: geojson,
    });

    // Add fill layer with color based on Var value
    map.addLayer({
      id: layerId,
      type: "fill",
      source: sourceId,
      paint: {
        "fill-color": [
          "match",
          ["get", "Var"],
          1,
          "#FFFF00", // Yellow - Low
          2,
          "#FFA500", // Orange - Medium
          3,
          "#FF0000", // Red - High
          "#808080", // Gray - Default
        ],
        "fill-opacity": 0.6,
      },
    });

    // Add border layer
    map.addLayer({
      id: borderLayerId,
      type: "line",
      source: sourceId,
      paint: {
        "line-color": "#000000",
        "line-width": 1,
        "line-opacity": 0.5,
      },
    });

    // Add popup on click
    map.on("click", layerId, (e) => {
      if (!e.features || e.features.length === 0) return;

      const feature = e.features[0];
      const varValue = feature.properties?.Var || 0;
      const hazardLabel = getHazardLabel(varValue);

      const popupHTML = `
        <div style="padding: 8px; min-width: 180px;">
          <strong>${provinceName}</strong><br/>
          <span style="color: ${getHazardColor(varValue)};">●</span> 
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
      `Successfully rendered flood hazard for ${provinceName} (${returnPeriod})`
    );

    // Calculate bounds for this layer
    const bounds = new mapboxgl.LngLatBounds();
    geojson.features.forEach((feature) => {
      if (feature.geometry.type === "Polygon") {
        feature.geometry.coordinates[0].forEach((coord) => {
          bounds.extend(coord as [number, number]);
        });
      } else if (feature.geometry.type === "MultiPolygon") {
        feature.geometry.coordinates.forEach((polygon) => {
          polygon[0].forEach((coord) => {
            bounds.extend(coord as [number, number]);
          });
        });
      }
    });

    return bounds;
  } catch (error) {
    console.error(
      `Failed to load flood hazard for ${provinceName} (${returnPeriod}):`,
      error
    );
    return null;
  }
};

export const clearFloodHazard = (
  map: mapboxgl.Map | null,
  mapIsLoaded: boolean,
  returnPeriod?: string,
  provinceName?: string
): void => {
  if (!map || !mapIsLoaded) return;

  try {
    // Normalize the return period to match source ID format
    // e.g., "5 - Year" becomes "5-Year"
    const normalizedPeriod = returnPeriod?.replace(/\s+/g, "");
    const normalizedProvince = provinceName?.replace(/\s+/g, "-");

    // If specific return period and province are provided, only clear that specific layer
    // Otherwise, filter by return period only, or clear all if no filter provided
    const sourceIdsToRemove = Array.from(floodLayerSourceIds.current).filter(
      (id) => {
        if (normalizedPeriod && normalizedProvince) {
          // Clear specific province + return period combination
          return (
            id.includes(normalizedPeriod) && id.includes(normalizedProvince)
          );
        } else if (normalizedPeriod) {
          // Clear all provinces for this return period
          return id.includes(normalizedPeriod);
        } else {
          // Clear all
          return true;
        }
      }
    );

    sourceIdsToRemove.forEach((sourceId) => {
      const layerId = `${sourceId}-layer`;
      const borderLayerId = `${sourceId}-border`;

      // Remove layers (this automatically removes associated event listeners)
      if (map.getLayer(borderLayerId)) map.removeLayer(borderLayerId);
      if (map.getLayer(layerId)) map.removeLayer(layerId);

      // Remove source
      if (map.getSource(sourceId)) map.removeSource(sourceId);

      // Remove from tracking set
      floodLayerSourceIds.current.delete(sourceId);
    });

    console.log(
      `Cleared ${sourceIdsToRemove.length} flood hazard layer(s)${
        returnPeriod ? ` for ${returnPeriod}` : ""
      }`
    );
  } catch (error) {
    console.error("Error clearing flood hazard layers:", error);
  }
};
