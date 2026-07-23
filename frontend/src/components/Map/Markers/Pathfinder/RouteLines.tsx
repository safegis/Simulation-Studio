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

  // CRITICAL: After moving route to front, ensure incidents stay on top
  const style = map.getStyle();
  if (style?.layers) {
    const incidentLayers = style.layers.filter((layer) =>
      layer.id.startsWith("incident-segment-")
    );
    incidentLayers.forEach((layer) => {
      try {
        if (map.getLayer(layer.id)) {
          map.moveLayer(layer.id);
        }
      } catch {
        // ignore errors
      }
    });
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

    // Dark casing keeps the route legible on satellite / lit Standard styles.
    // line-emissive-strength: 1 stops night/dusk lightPreset from washing the color out.
    map.addLayer(
      {
        id: `${id}-outline`,
        type: "line",
        source: id,
        layout: { "line-join": "round", "line-cap": "round" },
        paint: {
          "line-color": "#0B1020",
          "line-width": 12,
          "line-opacity": 0.95,
          "line-emissive-strength": 1,
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
          "line-color": isSelected ? "#B8BAFF" : "#FFFFFF",
          "line-width": isSelected ? 7 : 6,
          "line-opacity": 1,
          "line-emissive-strength": 1,
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
          idx === featureIndex ? "#B8BAFF" : "#FFFFFF"
        );
        try {
          map.setPaintProperty(
            layerId,
            "line-width",
            idx === featureIndex ? 7 : 6
          );
        } catch {
          // older styles may lack width updates mid-flight
        }
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

/**
 * Draw traffic incident segments on routes
 * Highlights segments where incidents occur with color-coded severity
 * Incident layers are always rendered on top (no beforeId)
 */
export const drawIncidentSegments = (
  map: mapboxgl.Map | null,
  mapIsLoaded: React.RefObject<boolean>,
  routesWithIncidents: Array<{
    featureIndex: number;
    trafficData?: {
      incidents: Array<{
        geometry: any;
        severity: number;
        category_name: string;
      }>;
    };
  }>,
  getTopSymbolLayerId: (map: mapboxgl.Map) => string | undefined
) => {
  if (!map || !mapIsLoaded.current) return;

  // Remove existing incident layers (removing layers automatically removes their event listeners)
  const style = map.getStyle();
  if (style?.layers) {
    style.layers.forEach((layer) => {
      if (layer.id.startsWith("incident-segment-")) {
        // Remove layer and source (this also removes associated event listeners)
        if (map.getLayer(layer.id)) map.removeLayer(layer.id);
        if (map.getSource(layer.id)) map.removeSource(layer.id);
      }
    });
  }

  // NO beforeId - incidents will be on top of everything including routes

  // Severity to color mapping
  const getSeverityColor = (severity: number): string => {
    if (severity >= 5) return "#FF0000"; // Red - Critical (Accident, RoadClosed, Flooding)
    if (severity >= 4) return "#FF6B00"; // Orange - High (DangerousConditions, Ice)
    if (severity >= 3) return "#FFB800"; // Yellow - Medium (Jam, LaneClosed, BrokenDown)
    if (severity >= 2) return "#FFE600"; // Light Yellow - Low (Fog, Rain, RoadWorks, Wind)
    return "#CCCCCC"; // Gray - Unknown
  };

  // Format category name: "RoadClosed" -> "Road Closed", "DangerousConditions" -> "Dangerous Conditions"
  const formatCategoryName = (categoryName: string): string => {
    // Add space before capital letters (except the first one)
    return categoryName.replace(/([A-Z])/g, " $1").trim();
  };

  const incidentLayerIds: string[] = [];

  // Step 1: Build a map of incidents by location to track which routes they affect
  const incidentMap = new Map<
    string,
    {
      incident: any;
      routeIndices: number[];
      geometry: any;
    }
  >();

  routesWithIncidents.forEach((route) => {
    if (!route.trafficData?.incidents) return;

    route.trafficData.incidents.forEach((incident) => {
      if (!incident.geometry || incident.geometry.type !== "LineString") return;

      // Create a unique key based on incident location (first coordinate)
      const coords = incident.geometry.coordinates;
      if (!coords || coords.length === 0) return;

      const key = `${coords[0][0].toFixed(5)},${coords[0][1].toFixed(5)}-${
        incident.category_name
      }`;

      if (incidentMap.has(key)) {
        // Add this route to the existing incident
        const existing = incidentMap.get(key)!;
        if (!existing.routeIndices.includes(route.featureIndex)) {
          existing.routeIndices.push(route.featureIndex);
        }
      } else {
        // New incident
        incidentMap.set(key, {
          incident,
          routeIndices: [route.featureIndex],
          geometry: incident.geometry,
        });
      }
    });
  });

  // Step 2: Draw incident segments (one per unique incident location)
  let globalIncidentIndex = 0;
  incidentMap.forEach((data) => {
    const { incident, routeIndices, geometry } = data;
    const layerId = `incident-segment-${globalIncidentIndex}`;
    const color = getSeverityColor(incident.severity);

    try {
      // Add source for incident segment with ALL affected routes
      map.addSource(layerId, {
        type: "geojson",
        data: {
          type: "Feature",
          geometry: geometry,
          properties: {
            severity: incident.severity,
            category: incident.category_name,
            affectedRoutes: routeIndices.sort((a, b) => a - b).join(","),
          },
        },
      });

      // Add colored outline layer (severity color) - NO beforeId (top layer)
      map.addLayer({
        id: `${layerId}-outline`,
        type: "line",
        source: layerId,
        layout: { "line-join": "round", "line-cap": "round" },
        paint: {
          "line-color": color,
          "line-width": 10,
          "line-opacity": 0.9,
          "line-emissive-strength": 1,
        },
      });

      // Add white main incident line - NO beforeId (top layer)
      map.addLayer({
        id: layerId,
        type: "line",
        source: layerId,
        layout: { "line-join": "round", "line-cap": "round" },
        paint: {
          "line-color": "#FFFFFF",
          "line-width": 4,
          "line-opacity": 1,
          "line-emissive-strength": 1,
        },
      });

      incidentLayerIds.push(`${layerId}-outline`);
      incidentLayerIds.push(layerId);

      // Add click handler for incident info (ONLY on main layer, not pulse)
      map.on("click", layerId, (e) => {
        if (!e.features || e.features.length === 0) return;
        const feature = e.features[0];
        const props = feature.properties;

        // Remove any existing popups first
        const existingPopups =
          document.getElementsByClassName("mapboxgl-popup");
        while (existingPopups.length > 0) {
          existingPopups[0].remove();
        }

        // Parse affected routes and format as "Route 1, Route 2, Route 3"
        const affectedRoutesStr = props?.affectedRoutes || "";
        const routeNumbers = affectedRoutesStr
          .split(",")
          .map((idx: string) => `Route ${parseInt(idx) + 1}`)
          .join(", ");

        // Format category name for display
        const formattedCategory = formatCategoryName(
          props?.category || "Unknown Incident"
        );

        new mapboxgl.Popup({
          closeButton: true,
          closeOnClick: false,
          maxWidth: "none",
          className: "custom-earthquake-popup",
        })
          .setLngLat(e.lngLat)
          .setHTML(
            `
            <div style="
              background: #2E2E2E;
              border-radius: 6px;
              padding: 8px;
              min-width: 200px;
              max-width: 280px;
              box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.3), 0 2px 4px -1px rgba(0, 0, 0, 0.2);
              border: 1px solid #3a3a3a;
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            ">
              <!-- Title with incident type (white color) -->
              <div style="
                color: white;
                font-size: 12px;
                font-weight: 600;
                margin-bottom: 8px;
                line-height: 1.3;
              ">
                ${formattedCategory}
              </div>

              <!-- Severity Property with colored border -->
              <div style="
                background: #2a2a2a;
                border: 1px solid ${color};
                border-radius: 4px;
                padding: 6px;
              ">
                <div style="
                  color: #9699FF;
                  font-size: 8px;
                  font-weight: 500;
                  text-transform: uppercase;
                  letter-spacing: 0.5px;
                  margin-bottom: 2px;
                ">
                  SEVERITY
                </div>
                <div style="
                  color: #C7C7C7;
                  font-size: 11px;
                  font-weight: 600;
                  word-break: break-word;
                ">
                  ${props?.severity || 0}/5
                </div>
              </div>

              <!-- Affected Routes -->
              <div style="
                background: #2a2a2a;
                border: 1px solid #3a3a3a;
                border-radius: 4px;
                padding: 6px;
                margin-top: 6px;
              ">
                <div style="
                  color: #9699FF;
                  font-size: 8px;
                  font-weight: 500;
                  text-transform: uppercase;
                  letter-spacing: 0.5px;
                  margin-bottom: 2px;
                ">
                  AFFECTED ROUTES
                </div>
                <div style="
                  color: #C7C7C7;
                  font-size: 11px;
                  font-weight: 600;
                  word-break: break-word;
                ">
                  ${routeNumbers || "Unknown"}
                </div>
              </div>
            </div>
          `
          )
          .addTo(map);
      });

      // Change cursor on hover
      map.on("mouseenter", layerId, () => {
        map.getCanvas().style.cursor = "pointer";
      });

      map.on("mouseleave", layerId, () => {
        map.getCanvas().style.cursor = "";
      });

      // Increment global incident index
      globalIncidentIndex++;
    } catch (error) {
      console.error(`Error adding incident segment ${layerId}:`, error);
    }
  });

  // CRITICAL: Move all incident layers to the very top after creation
  incidentLayerIds.forEach((layerId) => {
    try {
      if (map.getLayer(layerId)) {
        map.moveLayer(layerId);
      }
    } catch (error) {
      console.error(`Error moving incident layer ${layerId} to top:`, error);
    }
  });
};

/**
 * Clear all incident segments from the map
 */
export const clearIncidentSegments = (
  map: mapboxgl.Map | null,
  mapIsLoaded: React.RefObject<boolean>
) => {
  if (!map || !mapIsLoaded.current) return;

  const style = map.getStyle();
  if (!style?.layers) return;

  style.layers.forEach((layer) => {
    if (layer.id.startsWith("incident-segment-")) {
      try {
        if (map.getLayer(layer.id)) map.removeLayer(layer.id);
        if (map.getSource(layer.id)) map.removeSource(layer.id);
      } catch (error) {
        console.error(`Error removing incident layer ${layer.id}:`, error);
      }
    }
  });
};
