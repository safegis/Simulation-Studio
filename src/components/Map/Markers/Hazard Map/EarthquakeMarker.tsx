// \SafeGIS\Simulation-Studio\frontend\src\components\Map\Markers\Hazard Map\EarthquakeMarker.tsx
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
  const impactSourceId = "earthquake-impact";
  const impactLayerId = "earthquake-impact-layer";
  const impactBorderLayerId = "earthquake-impact-border-layer";
  const radiusLabelSourceId = "earthquake-radius-label";
  const radiusLabelLayerId = "earthquake-radius-label-layer";
  const magnitudeLabelSourceId = "earthquake-magnitude-label";
  const magnitudeLabelLayerId = "earthquake-magnitude-label-layer";

  try {
    // Clean up existing layers and sources
    [
      layerId,
      impactLayerId,
      impactBorderLayerId,
      radiusLabelLayerId,
      magnitudeLabelLayerId,
    ].forEach((id) => {
      if (map.getLayer(id)) map.removeLayer(id);
    });
    [
      sourceId,
      impactSourceId,
      radiusLabelSourceId,
      magnitudeLabelSourceId,
    ].forEach((id) => {
      if (map.getSource(id)) map.removeSource(id);
    });
  } catch (e) {
    console.warn(`Layer/source cleanup failed:`, e);
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

  // Calculate impact radius based on the formula: Radius (km) = 10^(0.45*M-1.88) * √D
  const calculateImpactRadius = (magnitude: number, depth: number): number => {
    const M = magnitude;
    const D = Math.abs(depth); // Ensure depth is positive
    const radius = Math.pow(10, 0.45 * M - 1.88) * Math.sqrt(D);
    return Math.max(radius, 0.1); // Minimum radius to ensure visibility
  };

  // Convert radius in km to pixels at current zoom level
  const radiusKmToPixels = (radiusKm: number, lat: number): number => {
    const zoom = map.getZoom();
    // Approximate conversion: at zoom level 10, 1 degree ≈ 111 km
    // Pixels per degree = map width in pixels / 360 degrees at zoom 0, then scale by 2^zoom
    const metersPerPixel =
      (40075016.686 * Math.cos((lat * Math.PI) / 180)) / Math.pow(2, zoom + 8);
    const radiusMeters = radiusKm * 1000;
    return radiusMeters / metersPerPixel;
  };

  // Add earthquake markers
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

  // Add empty source for impact circles (will be updated on hover)
  const emptyImpactGeoJSON: GeoJSON.FeatureCollection = {
    type: "FeatureCollection",
    features: [],
  };

  map.addSource(impactSourceId, { type: "geojson", data: emptyImpactGeoJSON });

  // Add impact circle fill layer
  map.addLayer({
    id: impactLayerId,
    type: "circle",
    source: impactSourceId,
    paint: {
      "circle-radius": ["get", "radiusPixels"],
      "circle-color": "rgba(255, 0, 0, 0.15)", // Transparent red
      "circle-stroke-width": 2,
      "circle-stroke-color": "rgba(255, 0, 0, 0.6)", // Semi-transparent red border
    },
  });

  // Add empty source for radius labels (will be updated on hover)
  const emptyLabelGeoJSON: GeoJSON.FeatureCollection = {
    type: "FeatureCollection",
    features: [],
  };

  map.addSource(radiusLabelSourceId, {
    type: "geojson",
    data: emptyLabelGeoJSON,
  });

  // Add radius label layer
  map.addLayer({
    id: radiusLabelLayerId,
    type: "symbol",
    source: radiusLabelSourceId,
    layout: {
      "text-field": ["get", "radiusText"],
      "text-font": ["Open Sans Semibold", "Arial Unicode MS Bold"],
      "text-size": 14,
      "text-anchor": "center",
      "text-allow-overlap": true,
      "text-ignore-placement": true,
    },
    paint: {
      "text-color": "rgba(255, 0, 0, 0.9)",
      "text-halo-color": "rgba(255, 255, 255, 0.8)",
      "text-halo-width": 2,
    },
  });

  // Add empty source for magnitude labels (will be updated on hover)
  const emptyMagnitudeLabelGeoJSON: GeoJSON.FeatureCollection = {
    type: "FeatureCollection",
    features: [],
  };

  map.addSource(magnitudeLabelSourceId, {
    type: "geojson",
    data: emptyMagnitudeLabelGeoJSON,
  });

  // Add magnitude label layer
  map.addLayer({
    id: magnitudeLabelLayerId,
    type: "symbol",
    source: magnitudeLabelSourceId,
    layout: {
      "text-field": ["get", "magnitudeText"],
      "text-font": ["Open Sans Semibold", "Arial Unicode MS Bold"],
      "text-size": 12,
      "text-anchor": "center",
      "text-offset": [0, -2.5], // Offset above the epicenter marker
      "text-allow-overlap": true,
      "text-ignore-placement": true,
    },
    paint: {
      "text-color": "rgba(255, 0, 0, 0.9)",
      "text-halo-color": "rgba(255, 255, 255, 0.8)",
      "text-halo-width": 2,
    },
  });

  // Click handler for popup
  map.on("click", layerId, (e) => {
    const props = e.features?.[0].properties!;
    const magnitude = props.mag;
    const depth = Math.abs(props.depth || 10);
    const impactRadiusKm = calculateImpactRadius(magnitude, depth);

    const popupHTML = `
      <div style="min-width: 160px;">
        <strong>${props.place}</strong><br/>
        <span>Magnitude: ${props.mag}</span><br/>
        <span>Depth: ${Number(props.depth).toFixed(1)} km</span><br/>
        <span>Impact Radius: ${impactRadiusKm.toFixed(2)} km</span><br/>
        <span>${new Date(Number(props.time)).toLocaleString()}</span>
      </div>
    `;
    new mapboxgl.Popup().setLngLat(e.lngLat).setHTML(popupHTML).addTo(map);
  });

  // Mouse enter handler - show impact circle
  map.on("mouseenter", layerId, (e) => {
    map.getCanvas().style.cursor = "pointer";

    if (e.features && e.features.length > 0) {
      const feature = e.features[0];
      const props = feature.properties!;
      const geometry = feature.geometry as GeoJSON.Point;
      const [lng, lat] = geometry.coordinates;

      const magnitude = props.mag;
      const depth = Math.abs(props.depth || 10); // Default depth if not available

      // Calculate impact radius
      const radiusKm = calculateImpactRadius(magnitude, depth);
      const radiusPixels = radiusKmToPixels(radiusKm, lat);

      // Create impact circle feature
      const impactFeature: GeoJSON.Feature = {
        type: "Feature",
        properties: {
          radiusPixels: Math.max(radiusPixels, 20), // Minimum 20 pixels for visibility
        },
        geometry: {
          type: "Point",
          coordinates: [lng, lat],
        },
      };

      // Create radius label feature - positioned offset from center
      // Calculate offset position (about 60% of radius towards northeast)
      const offsetFactor = 0.6;
      const offsetDistance = (radiusKm / 111.32) * offsetFactor; // Convert km to degrees (approximate)
      const offsetLng = lng + offsetDistance * 0.707; // 45° northeast (cos 45°)
      const offsetLat = lat + offsetDistance * 0.707; // 45° northeast (sin 45°)

      const radiusLabelFeature: GeoJSON.Feature = {
        type: "Feature",
        properties: {
          radiusText: `${radiusKm.toFixed(2)} km`,
        },
        geometry: {
          type: "Point",
          coordinates: [offsetLng, offsetLat],
        },
      };

      // Create magnitude label feature - positioned at epicenter
      const magnitudeLabelFeature: GeoJSON.Feature = {
        type: "Feature",
        properties: {
          magnitudeText: `Mag: ${magnitude.toFixed(1)}`,
        },
        geometry: {
          type: "Point",
          coordinates: [lng, lat],
        },
      };

      // Update impact source with the hover feature
      const impactSource = map.getSource(
        impactSourceId
      ) as mapboxgl.GeoJSONSource;
      if (impactSource) {
        impactSource.setData({
          type: "FeatureCollection",
          features: [impactFeature],
        });
      }

      // Update radius label source with the hover feature
      const labelSource = map.getSource(
        radiusLabelSourceId
      ) as mapboxgl.GeoJSONSource;
      if (labelSource) {
        labelSource.setData({
          type: "FeatureCollection",
          features: [radiusLabelFeature],
        });
      }

      // Update magnitude label source with the hover feature
      const magnitudeLabelSource = map.getSource(
        magnitudeLabelSourceId
      ) as mapboxgl.GeoJSONSource;
      if (magnitudeLabelSource) {
        magnitudeLabelSource.setData({
          type: "FeatureCollection",
          features: [magnitudeLabelFeature],
        });
      }
    }
  });

  // Mouse leave handler - hide impact circle and labels
  map.on("mouseleave", layerId, () => {
    map.getCanvas().style.cursor = "";

    // Clear the impact circle
    const impactSource = map.getSource(
      impactSourceId
    ) as mapboxgl.GeoJSONSource;
    if (impactSource) {
      impactSource.setData({
        type: "FeatureCollection",
        features: [],
      });
    }

    // Clear the radius label
    const labelSource = map.getSource(
      radiusLabelSourceId
    ) as mapboxgl.GeoJSONSource;
    if (labelSource) {
      labelSource.setData({
        type: "FeatureCollection",
        features: [],
      });
    }

    // Clear the magnitude label
    const magnitudeLabelSource = map.getSource(
      magnitudeLabelSourceId
    ) as mapboxgl.GeoJSONSource;
    if (magnitudeLabelSource) {
      magnitudeLabelSource.setData({
        type: "FeatureCollection",
        features: [],
      });
    }
  });

  // Update impact circles when map is moved/zoomed
  const updateImpactRadii = () => {
    const impactSource = map.getSource(
      impactSourceId
    ) as mapboxgl.GeoJSONSource;
    const labelSource = map.getSource(
      radiusLabelSourceId
    ) as mapboxgl.GeoJSONSource;
    const magnitudeLabelSource = map.getSource(
      magnitudeLabelSourceId
    ) as mapboxgl.GeoJSONSource;

    if (impactSource && labelSource && magnitudeLabelSource) {
      const currentData = impactSource._data as GeoJSON.FeatureCollection;
      const currentLabelData = labelSource._data as GeoJSON.FeatureCollection;
      const currentMagnitudeLabelData =
        magnitudeLabelSource._data as GeoJSON.FeatureCollection;

      if (currentData && currentData.features.length > 0) {
        // Recalculate radius for current feature based on new zoom level
        const feature = currentData.features[0];
        const [lng, lat] = (feature.geometry as GeoJSON.Point).coordinates;

        // Find the corresponding earthquake data to recalculate radius
        const earthquakeFeature = geojson.features.find((f) => {
          const coords = (f.geometry as GeoJSON.Point).coordinates;
          return (
            Math.abs(coords[0] - lng) < 0.0001 &&
            Math.abs(coords[1] - lat) < 0.0001
          );
        });

        if (earthquakeFeature) {
          const magnitude = earthquakeFeature.properties!.mag;
          const depth = Math.abs(earthquakeFeature.properties!.depth || 10);
          const radiusKm = calculateImpactRadius(magnitude, depth);
          const radiusPixels = radiusKmToPixels(radiusKm, lat);

          feature.properties!.radiusPixels = Math.max(radiusPixels, 20);
          impactSource.setData(currentData);

          // Update label data remains the same (km value doesn't change with zoom)
          if (currentLabelData && currentLabelData.features.length > 0) {
            labelSource.setData(currentLabelData);
          }

          // Update magnitude label data remains the same (magnitude doesn't change with zoom)
          if (
            currentMagnitudeLabelData &&
            currentMagnitudeLabelData.features.length > 0
          ) {
            magnitudeLabelSource.setData(currentMagnitudeLabelData);
          }
        }
      }
    }
  };

  // Listen for zoom/move events to update impact circle size
  map.on("zoom", updateImpactRadii);
  map.on("move", updateImpactRadii);
};
