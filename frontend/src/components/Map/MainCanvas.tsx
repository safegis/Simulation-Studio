// \SafeGIS\Simulation-Studio\frontend\src\components\Map\MainCanvas.tsx
"use client";
import {
  useRef,
  useEffect,
  forwardRef,
  useImperativeHandle,
  useState,
} from "react";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import { drawVolcanoDots as drawVolcanoDotsHelper } from "./Markers/Hazard Map/VolcanoListMarker";
import {
  drawFloodHazard as drawFloodHazardHelper,
  clearFloodHazard as clearFloodHazardHelper,
} from "./Markers/Hazard Map/FloodHazardMarker";
import { drawEarthquakeDots as drawEarthquakeDotsHelper } from "./Markers/Hazard Map/EarthquakeMarker";
import { drawActiveFaults as drawActiveFaultsHelper } from "./Markers/Hazard Map/ActiveFaultsMarker";
import { drawRoadClosures as drawRoadClosuresHelper } from "./Markers/Hazard Map/RoadClosureMarker";
import { drawLaneClosures as drawLaneClosuresHelper } from "./Markers/Hazard Map/LaneClosureMarker";
import { drawRoadObstructions as drawRoadObstructionsHelper } from "./Markers/Hazard Map/ObstructionsMarker";
import {
  drawCongestion as drawCongestionHelper,
  congestionMarkersRef,
} from "./Markers/Hazard Map/CongestionMarker";

import {
  drawWeatherMarkers as drawWeatherMarkersHelper,
  clearWeatherMarkers as clearWeatherMarkersHelper,
  weatherMarkersRef,
  WeatherData,
} from "./Markers/Hazard Map/WeatherMarker";

import { ensureAffectedAreasOnTop } from "./Markers/Assessment Tools/ExposureAssessmentMarkers";
import { ISO2_TO_ISO3 } from "@/lib/iso2ToIso3";
import {
  MAPBOX_CUSTOM_STANDARD_STYLE_URL,
  MAPBOX_CUSTOM_STANDARD_STYLE_ID_FRAGMENT,
  DEFAULT_STANDARD_3D_PITCH,
  DEFAULT_STANDARD_3D_BEARING,
} from "@/lib/mapboxCustomStandard";
import {
  geoapifyPopupTypeLabel,
  osmPopupTypeLabel,
} from "@/lib/boundaryLevelsBySource";

import {
  drawHealthFacilities as drawHealthFacilitiesHelper,
  clearHealthFacilities as clearHealthFacilitiesHelper,
  useHealthFacilitiesRestore,
} from "./Markers/Critical Facility Map/HealthFacilitiesMarker";
import {
  drawEmergencyShelters as drawEmergencySheltersHelper,
  clearEmergencyShelters as clearEmergencySheltersHelper,
  useEmergencySheltersRestore,
} from "./Markers/Critical Facility Map/EmergencySheltersMarker";
import {
  drawRoutes as drawRoutesHelper,
  highlightRouteByFeatureIndex,
  drawIncidentSegments as drawIncidentSegmentsHelper,
  clearIncidentSegments as clearIncidentSegmentsHelper,
} from "./Markers/Pathfinder/RouteLines";
import { useResources } from "./Markers/Planning Suite/ResourcesMarker";
import { switchTo2D } from "./Switch View/SwitchTo2DView";
import { switchTo3D } from "./Switch View/SwitchTo3DView";
import {
  drawFireStations as drawFireStationsHelper,
  clearFireStations as clearFireStationsHelper,
  useFireStationsRestore,
} from "./Markers/Critical Facility Map/FireStationsMarker";
import {
  drawPoliceStations as drawPoliceStationsHelper,
  clearPoliceStations as clearPoliceStationsHelper,
  usePoliceStationsRestore,
} from "./Markers/Critical Facility Map/PoliceStationsMarker";

mapboxgl.accessToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN!;

/** Serializable map state for undo/redo (paired with UI snapshot in Main-UI-Layout). */
export type MapUndoSnapshot = {
  camera: {
    lng: number;
    lat: number;
    zoom: number;
    pitch: number;
    bearing: number;
  };
  uploads: Array<{ layerName: string; data: GeoJSON.FeatureCollection }>;
  drawnBox: GeoJSON.FeatureCollection | null;
  routes: GeoJSON.FeatureCollection | null;
  affectedAreas: GeoJSON.FeatureCollection | null;
  volcanoes: any[];
  earthquakes: any[];
  activeFaults: GeoJSON.FeatureCollection | null;
  floodHazards: Array<{
    geojsonUrl: string;
    returnPeriod: string;
    provinceName: string;
  }>;
  markers: {
    location: [number, number] | null;
    start: [number, number] | null;
    dest: [number, number] | null;
  };
  routeFeatureIndex: number | null;
  /** Admin boundary layer (`geoboundaries` source), if present. */
  boundary: GeoJSON.FeatureCollection | null;
};

type FlyToOptions = {
  center?: [number, number];
  zoom?: number;
  bearing?: number;
  pitch?: number;
  speed?: number;
  curve?: number;
  easing?: (time: number) => number;
  essential?: boolean;
};

type MapComponentProps = {
  /** Called (debounced) after user pans/zooms/rotates the map — for undo history. */
  onUserMapTransform?: () => void;
};

const MapComponent = forwardRef(function MapComponent(
  { onUserMapTransform }: MapComponentProps,
  ref
) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const mapInstance = useRef<mapboxgl.Map | null>(null);
  const mapIsLoaded = useRef<boolean>(false);
  const is3DMode = useRef<boolean>(false);
  const latestRoutesGeoJSON = useRef<GeoJSON.FeatureCollection | null>(null);
  const latestVolcanoes = useRef<any[]>([]);
  const latestEarthquakes = useRef<any[]>([]);
  const latestActiveFaults = useRef<GeoJSON.FeatureCollection | null>(null);
  const latestFloodHazards = useRef<
    Array<{ geojsonUrl: string; returnPeriod: string; provinceName: string }>
  >([]);
  const latestAffectedAreas = useRef<GeoJSON.FeatureCollection | null>(null);

  const healthPopupRef = useRef<mapboxgl.Popup | null>(null);
  const boundaryClickHandlerRef = useRef<
    ((e: mapboxgl.MapLayerMouseEvent) => void) | null
  >(null);
  const boundaryPopupRef = useRef<mapboxgl.Popup | null>(null);

  // --- use the custom hook to restore health facility markers after style change ---
  useHealthFacilitiesRestore(mapInstance, mapIsLoaded);

  // --- use the custom hook to restore fire station markers after style change ---
  useFireStationsRestore(mapInstance, mapIsLoaded);

  // --- use the custom hook to restore police station markers after style change ---
  usePoliceStationsRestore(mapInstance, mapIsLoaded);

  // --- use the custom hook to restore emergency shelter markers after style change ---
  useEmergencySheltersRestore(mapInstance, mapIsLoaded);

  // add this ref to hold the registered callback
  const boundsListenersRef = useRef<
    Set<(bbox: [number, number, number, number]) => void>
  >(new Set());
  const [pendingResource, setPendingResource] = useState<{
    lngLat: mapboxgl.LngLat;
    type: string;
  } | null>(null);
  const [resourceName, setResourceName] = useState("");
  const [resourceDesc, setResourceDesc] = useState("");
  const roadClosureMarkersRef = useRef<mapboxgl.Marker[]>([]);
  const laneClosureMarkersRef = useRef<mapboxgl.Marker[]>([]);
  const undoMoveDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(
    null
  );
  const onUserMapTransformRef = useRef(onUserMapTransform);
  onUserMapTransformRef.current = onUserMapTransform;
  const selectedFeatureIndexRef = useRef<number | null>(null);
  const locationMarkerRef = useRef<mapboxgl.Marker | null>(null);
  const startMarkerRef = useRef<mapboxgl.Marker | null>(null);
  const destinationMarkerRef = useRef<mapboxgl.Marker | null>(null);
  useEffect(() => {
    if (!mapContainer.current) return;
    const map = new mapboxgl.Map({
      container: mapContainer.current,
      // Match app default basemap so first paint isn’t streets → Standard swap.
      style: MAPBOX_CUSTOM_STANDARD_STYLE_URL,
      center: [0, 0],
      zoom: 1.8,
      // Start angled for default Standard basemap (avoids top-down globe then ease).
      pitch: DEFAULT_STANDARD_3D_PITCH,
      bearing: DEFAULT_STANDARD_3D_BEARING,
      antialias: true,
    });
    mapInstance.current = map;
    map.on("load", () => {
      mapIsLoaded.current = true;

      // Add custom popup styles for consistent dark theme
      if (!document.getElementById("earthquake-popup-styles")) {
        const style = document.createElement("style");
        style.id = "earthquake-popup-styles";
        style.textContent = `
          .custom-earthquake-popup .mapboxgl-popup-content {
            padding: 0;
            background: transparent;
            box-shadow: none;
            position: relative;
          }
          .custom-earthquake-popup .mapboxgl-popup-close-button {
            color: #C7C7C7;
            font-size: 16px;
            padding: 4px 8px;
            background: #2a2a2a;
            border-radius: 0 6px 0 4px;
            transition: all 0.2s;
            border: 1px solid #3a3a3a;
            position: absolute;
            top: 0;
            right: 0;
            z-index: 10;
            cursor: pointer;
          }
          .custom-earthquake-popup .mapboxgl-popup-close-button:hover {
            color: white;
            background: #9699FF;
            border-color: #9699FF;
          }
          .custom-earthquake-popup .mapboxgl-popup-tip {
            border-top-color: #2E2E2E;
          }
        `;
        document.head.appendChild(style);
      }

      map.on("moveend", () => {
        try {
          const b = map.getBounds();
          if (!b) return;
          const bbox: [number, number, number, number] = [
            b.getWest(),
            b.getSouth(),
            b.getEast(),
            b.getNorth(),
          ];
          // call all registered listeners
          console.log(
            "Map moveend, calling",
            boundsListenersRef.current.size,
            "listeners"
          );
          boundsListenersRef.current.forEach((cb) => cb(bbox));
        } catch (e) {
          // ignore
        }
        if (onUserMapTransformRef.current) {
          if (undoMoveDebounceRef.current) {
            clearTimeout(undoMoveDebounceRef.current);
          }
          undoMoveDebounceRef.current = setTimeout(() => {
            undoMoveDebounceRef.current = null;
            onUserMapTransformRef.current?.();
          }, 400);
        }
      });
      map.getCanvas().addEventListener("dragover", (e: DragEvent) => {
        e.preventDefault();
      });
      map.getCanvas().addEventListener("drop", (e: DragEvent) => {
        e.preventDefault();
        const type = e.dataTransfer?.getData("resource-type");
        if (!type) return;
        const rect = map.getCanvas().getBoundingClientRect();
        const lngLat = map.unproject([
          e.clientX - rect.left,
          e.clientY - rect.top,
        ]);
        // Open modal instead of directly adding
        setPendingResource({ lngLat, type });
        setResourceName(type.charAt(0).toUpperCase() + type.slice(1));
        setResourceDesc("");
      });
    });
    return () => {
      healthPopupRef.current?.remove();
      healthPopupRef.current = null;
      map.remove();
      mapIsLoaded.current = false;
      locationMarkerRef.current?.remove();
      startMarkerRef.current?.remove();
      destinationMarkerRef.current?.remove();
    };
  }, []);

  // find a good beforeId once per style load
  const getTopSymbolLayerId = (map: mapboxgl.Map) => {
    const layers = map.getStyle()?.layers || [];
    for (let i = layers.length - 1; i >= 0; i--) {
      if (layers[i].type === "symbol") {
        return layers[i].id; // return the last symbol layer
      }
    }
    return undefined;
  };

  const drawAffectedAreasHelper = (
    map: mapboxgl.Map,
    geojson: GeoJSON.FeatureCollection,
    getTopSymbolLayerId: (map: mapboxgl.Map) => string | undefined
  ) => {
    if (!map || !mapIsLoaded.current) return;

    const sourceId = "affected-areas";
    const layerId = "affected-areas-layer";
    const outlineLayerId = "affected-areas-outline";

    // Remove existing layers if they exist
    if (map.getLayer(outlineLayerId)) map.removeLayer(outlineLayerId);
    if (map.getLayer(layerId)) map.removeLayer(layerId);
    if (map.getSource(sourceId)) map.removeSource(sourceId);

    // Add source
    map.addSource(sourceId, {
      type: "geojson",
      data: geojson,
    });

    const beforeId = getTopSymbolLayerId(map);

    // Add fill layer with semi-transparent red
    map.addLayer(
      {
        id: layerId,
        type: "fill",
        source: sourceId,
        paint: {
          "fill-color": "#FF0000",
          "fill-opacity": 0.3,
        },
      },
      beforeId
    );

    // Add outline layer
    map.addLayer(
      {
        id: outlineLayerId,
        type: "line",
        source: sourceId,
        paint: {
          "line-color": "#FF0000",
          "line-width": 2,
          "line-opacity": 0.8,
        },
      },
      beforeId
    );

    // Add popup on click
    const popup = new mapboxgl.Popup({
      closeButton: true,
      closeOnClick: true,
      maxWidth: "none",
      className: "custom-earthquake-popup",
    });

    map.on("click", layerId, (e) => {
      if (!e.features || e.features.length === 0) return;
      const feature = e.features[0];
      const props = feature.properties || {};

      // Build property rows with consistent styling
      let propertyRows = "";
      for (const key in props) {
        propertyRows += `
          <div style="
            background: #2a2a2a;
            border: 1px solid #3a3a3a;
            border-radius: 4px;
            padding: 6px;
            margin-bottom: 6px;
          ">
            <div style="
              color: #9699FF;
              font-size: 8px;
              font-weight: 500;
              text-transform: uppercase;
              letter-spacing: 0.5px;
              margin-bottom: 2px;
            ">
              ${key}
            </div>
            <div style="
              color: #C7C7C7;
              font-size: 11px;
              font-weight: 600;
              word-break: break-word;
            ">
              ${props[key]}
            </div>
          </div>
        `;
      }

      const html = `
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
          <!-- Title -->
          <div style="
            color: white;
            font-size: 12px;
            font-weight: 600;
            margin-bottom: 8px;
            line-height: 1.3;
          ">
            Affected Area
          </div>

          <!-- Properties -->
          ${propertyRows}
        </div>
      `;

      popup.setLngLat(e.lngLat).setHTML(html).addTo(map);
    });

    // Cursor change on hover
    map.on("mouseenter", layerId, () => {
      map.getCanvas().style.cursor = "pointer";
    });
    map.on("mouseleave", layerId, () => {
      map.getCanvas().style.cursor = "";
    });

    console.log(`Restored ${geojson.features.length} affected areas on map`);
  };

  const {
    addResourceMarker,
    clearAllResources,
    flyToResource,
    getResourcesOnMap,
    onResourcesChanged,
  } = useResources(mapInstance);

  const getUploadedLayerData = (layerName: string) => {
    if (!mapInstance.current || !mapIsLoaded.current) return null;

    const map = mapInstance.current;
    const safeName = layerName.replace(/[^a-zA-Z0-9_-]/g, "");
    const sourceId = `upload-${safeName}`;

    const source = map.getSource(sourceId);
    if (source && (source as any)._data) {
      return (source as any)._data;
    }

    return null;
  };

  const stripGeoboundariesForUndo = (map: mapboxgl.Map) => {
    const sourceId = "geoboundaries";
    const fillLayerId = "boundary-fill";
    const lineLayerId = "boundary-line";
    const hoverLayerId = `${fillLayerId}-hover`;
    const selectedLayerId = `${fillLayerId}-selected`;
    if (boundaryClickHandlerRef.current && map.getLayer(fillLayerId)) {
      map.off("click", fillLayerId, boundaryClickHandlerRef.current);
      boundaryClickHandlerRef.current = null;
    }
    boundaryPopupRef.current?.remove();
    boundaryPopupRef.current = null;
    if (map.getLayer(selectedLayerId)) map.removeLayer(selectedLayerId);
    if (map.getLayer(hoverLayerId)) map.removeLayer(hoverLayerId);
    if (map.getLayer(lineLayerId)) map.removeLayer(lineLayerId);
    if (map.getLayer(fillLayerId)) map.removeLayer(fillLayerId);
    if (map.getSource(sourceId)) map.removeSource(sourceId);
  };

  const restoreSimpleBoundaryFromSnapshot = (
    map: mapboxgl.Map,
    geojson: GeoJSON.FeatureCollection | null
  ) => {
    stripGeoboundariesForUndo(map);
    if (!geojson?.features?.length) return;
    const data = JSON.parse(JSON.stringify(geojson)) as GeoJSON.FeatureCollection;
    map.addSource("geoboundaries", {
      type: "geojson",
      data,
      generateId: true,
    });
    map.addLayer({
      id: "boundary-fill",
      type: "fill",
      source: "geoboundaries",
      paint: { "fill-color": "#9699FF", "fill-opacity": 0.2 },
    });
    map.addLayer({
      id: "boundary-line",
      type: "line",
      source: "geoboundaries",
      paint: { "line-color": "#9699FF", "line-width": 2 },
    });
  };

  const mapUndoImplRefs: {
    addGeoJSONLayer:
      | ((
          geojson: GeoJSON.FeatureCollection,
          layerName: string
        ) => Promise<void>)
      | null;
    drawAffectedAreas:
      | ((geojson: GeoJSON.FeatureCollection) => void)
      | null;
    clearAffectedAreas: (() => void) | null;
  } = {
    addGeoJSONLayer: null,
    drawAffectedAreas: null,
    clearAffectedAreas: null,
  };

  useImperativeHandle(ref, () => ({
    flyTo: (opts: FlyToOptions) => {
      if (!mapIsLoaded.current) return;
      mapInstance.current?.flyTo(opts);
    },
    addLocationMarker: (lng: number, lat: number) => {
      if (!mapInstance.current || !mapIsLoaded.current) return;
      startMarkerRef.current?.remove();
      startMarkerRef.current = null;
      locationMarkerRef.current?.remove();
      const marker = new mapboxgl.Marker({ color: "#9699FF" })
        .setLngLat([lng, lat])
        .addTo(mapInstance.current);
      locationMarkerRef.current = marker;
    },
    addStartMarker: (lng: number, lat: number) => {
      if (!mapInstance.current || !mapIsLoaded.current) return;
      locationMarkerRef.current?.remove();
      locationMarkerRef.current = null;
      startMarkerRef.current?.remove();
      const marker = new mapboxgl.Marker({ color: "#00FF00" })
        .setLngLat([lng, lat])
        .addTo(mapInstance.current);
      startMarkerRef.current = marker;
    },
    addDestinationMarker: (lng: number, lat: number) => {
      if (!mapInstance.current || !mapIsLoaded.current) return;
      destinationMarkerRef.current?.remove();
      const marker = new mapboxgl.Marker({ color: "#FF4C4C" })
        .setLngLat([lng, lat])
        .addTo(mapInstance.current);
      destinationMarkerRef.current = marker;
    },
    fitBoundsToMarkers: () => {
      if (
        !mapInstance.current ||
        !mapIsLoaded.current ||
        !startMarkerRef.current ||
        !destinationMarkerRef.current
      )
        return;
      const bounds = new mapboxgl.LngLatBounds();
      const startLngLat = startMarkerRef.current.getLngLat();
      bounds.extend([startLngLat.lng, startLngLat.lat]);
      const destLngLat = destinationMarkerRef.current.getLngLat();
      bounds.extend([destLngLat.lng, destLngLat.lat]);
      mapInstance.current.fitBounds(bounds, {
        padding: 100,
        maxZoom: 16,
        duration: 1000,
      });
    },
    clearStartMarker: () => {
      startMarkerRef.current?.remove();
      startMarkerRef.current = null;
    },
    clearDestinationMarker: () => {
      destinationMarkerRef.current?.remove();
      destinationMarkerRef.current = null;
    },
    clearLocationMarker: () => {
      locationMarkerRef.current?.remove();
      locationMarkerRef.current = null;
    },
    clearRoutes: () => {
      if (!mapInstance.current || !mapIsLoaded.current) return;

      // Clear routes GeoJSON data
      latestRoutesGeoJSON.current = null;

      // Remove all route layers and sources
      const map = mapInstance.current;
      const style = map.getStyle();

      if (style && style.layers) {
        // Remove route layers
        style.layers.forEach((layer: any) => {
          if (
            layer.id.startsWith("route-") ||
            layer.id.startsWith("route-outline-") ||
            layer.id.startsWith("incident-segment-")
          ) {
            if (map.getLayer(layer.id)) {
              map.removeLayer(layer.id);
            }
          }
        });

        // Remove route sources
        if (style.sources) {
          Object.keys(style.sources).forEach((sourceId: string) => {
            if (
              sourceId.startsWith("route-") ||
              sourceId.startsWith("incident-segment-")
            ) {
              if (map.getSource(sourceId)) {
                map.removeSource(sourceId);
              }
            }
          });
        }
      }

      // Reset selected feature index
      selectedFeatureIndexRef.current = null;
    },
    getZoom: () => {
      return mapInstance.current?.getZoom?.() ?? 0;
    },

    switchTo2D: (label: string) =>
      switchTo2D(
        label,
        mapInstance,
        mapIsLoaded,
        is3DMode,
        latestRoutesGeoJSON,
        latestVolcanoes,
        latestEarthquakes,
        latestActiveFaults,
        latestFloodHazards,
        selectedFeatureIndexRef,
        getTopSymbolLayerId,
        latestAffectedAreas, // NEW: Pass affected areas ref
        drawAffectedAreasHelper // NEW: Pass helper function
      ),

    switchTo3D: (label: string) =>
      switchTo3D(
        label,
        mapInstance,
        mapIsLoaded,
        is3DMode,
        latestRoutesGeoJSON,
        latestVolcanoes,
        latestEarthquakes,
        latestActiveFaults,
        latestFloodHazards,
        selectedFeatureIndexRef,
        getTopSymbolLayerId,
        addTerrainOnly,
        latestAffectedAreas, // NEW: Pass affected areas ref
        drawAffectedAreasHelper // NEW: Pass helper function
      ),

    setLightPreset: (preset: "dawn" | "day" | "dusk" | "night") => {
      const map = mapInstance.current;
      if (!map || !mapIsLoaded.current || !is3DMode.current) return;
      try {
        map.setConfigProperty("basemap", "lightPreset", preset);
      } catch (e) {
        console.warn("Failed to set light preset:", e);
      }
    },
    setMapStyle: (style: string) => {
      const map = mapInstance.current;
      if (!map || !mapIsLoaded.current) return;
      map.setStyle(style);
      map.once("style.load", () => {
        const use3dTerrain =
          is3DMode.current &&
          (style.includes("standard") ||
            style.includes(MAPBOX_CUSTOM_STANDARD_STYLE_ID_FRAGMENT));
        if (use3dTerrain) {
          addTerrainOnly(map);
          map.easeTo({
            pitch: DEFAULT_STANDARD_3D_PITCH,
            bearing: DEFAULT_STANDARD_3D_BEARING,
            duration: 1000,
          });
        } else {
          map.setTerrain(null);
          map.easeTo({ pitch: 0, bearing: 0, duration: 800 });
        }
        // Call draw functions only here with stored data
        if (latestRoutesGeoJSON.current)
          drawRoutesHelper(
            mapInstance.current,
            mapIsLoaded,
            latestRoutesGeoJSON,
            selectedFeatureIndexRef,
            getTopSymbolLayerId
          );
        if (latestVolcanoes.current.length > 0)
          drawVolcanoDotsHelper(
            mapInstance.current,
            mapIsLoaded.current,
            latestVolcanoes,
            latestVolcanoes.current
          );
        if (latestEarthquakes.current.length > 0)
          drawEarthquakeDotsHelper(
            mapInstance.current,
            mapIsLoaded.current,
            latestEarthquakes,
            latestEarthquakes.current
          );
        if (latestActiveFaults.current)
          drawActiveFaultsHelper(
            mapInstance.current,
            mapIsLoaded.current,
            latestActiveFaults,
            latestActiveFaults.current
          );
        if (latestFloodHazards.current.length > 0) {
          latestFloodHazards.current.forEach(async (fh) => {
            await drawFloodHazardHelper(
              mapInstance.current,
              mapIsLoaded.current,
              fh.geojsonUrl,
              fh.returnPeriod,
              fh.provinceName
            );
          });
        }
      });
    },
    drawRoutes: (geojson: GeoJSON.FeatureCollection) => {
      latestRoutesGeoJSON.current = geojson;
      drawRoutesHelper(
        mapInstance.current,
        mapIsLoaded,
        latestRoutesGeoJSON,
        selectedFeatureIndexRef,
        getTopSymbolLayerId
      );
    },
    highlightRouteByFeatureIndex: (featureIndex: number | null) => {
      highlightRouteByFeatureIndex(
        mapInstance.current,
        mapIsLoaded,
        selectedFeatureIndexRef,
        featureIndex
      );
    },
    drawVolcanoDots: (volcanoes: any[]) => {
      drawVolcanoDotsHelper(
        mapInstance.current,
        mapIsLoaded.current,
        latestVolcanoes,
        volcanoes
      );
    },

    drawEarthquakeDots: (features: any[]) => {
      drawEarthquakeDotsHelper(
        mapInstance.current,
        mapIsLoaded.current,
        latestEarthquakes,
        features
      );
    },

    drawActiveFaults: (geojson: GeoJSON.FeatureCollection | null) => {
      drawActiveFaultsHelper(
        mapInstance.current,
        mapIsLoaded.current,
        latestActiveFaults,
        geojson
      );
    },

    drawFloodHazard: async (
      geojsonUrl: string,
      returnPeriod: string,
      provinceName: string
    ) => {
      // Store the flood hazard data
      const existingIndex = latestFloodHazards.current.findIndex(
        (fh) =>
          fh.returnPeriod === returnPeriod && fh.provinceName === provinceName
      );

      if (existingIndex >= 0) {
        latestFloodHazards.current[existingIndex] = {
          geojsonUrl,
          returnPeriod,
          provinceName,
        };
      } else {
        latestFloodHazards.current.push({
          geojsonUrl,
          returnPeriod,
          provinceName,
        });
      }

      return await drawFloodHazardHelper(
        mapInstance.current,
        mapIsLoaded.current,
        geojsonUrl,
        returnPeriod,
        provinceName
      );
    },

    clearFloodHazard: (returnPeriod?: string, provinceName?: string) => {
      // Remove from stored flood hazards
      if (returnPeriod && provinceName) {
        latestFloodHazards.current = latestFloodHazards.current.filter(
          (fh) =>
            !(
              fh.returnPeriod === returnPeriod &&
              fh.provinceName === provinceName
            )
        );
      } else if (returnPeriod) {
        latestFloodHazards.current = latestFloodHazards.current.filter(
          (fh) => fh.returnPeriod !== returnPeriod
        );
      } else {
        latestFloodHazards.current = [];
      }

      clearFloodHazardHelper(
        mapInstance.current,
        mapIsLoaded.current,
        returnPeriod,
        provinceName
      );
    },

    // inside useImperativeHandle(ref, () => ({ ... }))
    getBounds: (): [number, number, number, number] | null => {
      const map = mapInstance.current;
      if (!map || !mapIsLoaded.current) return null;
      const b = map.getBounds();
      if (!b) return null; // guard for possible null/undefined
      // return [minLon, minLat, maxLon, maxLat]
      return [b.getWest(), b.getSouth(), b.getEast(), b.getNorth()];
    },
    drawRoadClosures: (geojson: GeoJSON.FeatureCollection | null) => {
      drawRoadClosuresHelper(
        mapInstance.current,
        mapIsLoaded.current,
        roadClosureMarkersRef,
        geojson,
        getTopSymbolLayerId
      );
    },

    drawLaneClosures: (geojson: GeoJSON.FeatureCollection | null) => {
      drawLaneClosuresHelper(
        mapInstance.current,
        mapIsLoaded.current,
        laneClosureMarkersRef,
        geojson,
        getTopSymbolLayerId
      );
    },

    drawCongestion: (geojson: GeoJSON.FeatureCollection | null) => {
      drawCongestionHelper(
        mapInstance.current,
        mapIsLoaded.current,
        geojson,
        getTopSymbolLayerId
      );
    },

    congestionMarkersRef,
    drawRoadObstructions: (geojson: GeoJSON.FeatureCollection | null) => {
      drawRoadObstructionsHelper(
        mapInstance.current,
        mapIsLoaded.current,
        geojson
      );
    },

    /**
     * Register a callback to be invoked when the map bounds change (moveend).
     * callback receives [minLon,minLat,maxLon,maxLat].
     * Returns nothing. Use unregisterBoundsListener to remove.
     */
    registerBoundsListener: (
      cb: (bbox: [number, number, number, number]) => void
    ) => {
      console.log(
        "Registering bounds listener, current count:",
        boundsListenersRef.current.size
      );
      boundsListenersRef.current.add(cb);
      console.log(
        "After registration, listener count:",
        boundsListenersRef.current.size
      );

      // call immediately with current bounds
      const map = mapInstance.current;
      if (!map || !mapIsLoaded.current) return;
      try {
        const b = map.getBounds();
        if (!b) return;
        const bbox: [number, number, number, number] = [
          b.getWest(),
          b.getSouth(),
          b.getEast(),
          b.getNorth(),
        ];
        cb(bbox);
      } catch (e) {
        // ignore
      }
    },

    // BEFORE: unregisterBoundsListener had unclear success feedback
    // AFTER: Enhanced logging and clearer return value handling
    unregisterBoundsListener: (
      cb: (bbox: [number, number, number, number]) => void
    ) => {
      const sizeBefore = boundsListenersRef.current.size;
      const wasRemoved = boundsListenersRef.current.delete(cb);
      const sizeAfter = boundsListenersRef.current.size;

      console.log("Unregistering bounds listener:", {
        wasRemoved,
        sizeBefore,
        sizeAfter,
        remainingListeners: sizeAfter,
      });

      return wasRemoved;
    },
    drawHealthFacilities: (geojson: GeoJSON.FeatureCollection) => {
      drawHealthFacilitiesHelper(
        mapInstance.current,
        mapIsLoaded.current,
        geojson
      );
    },
    clearHealthFacilities: () => {
      clearHealthFacilitiesHelper(mapInstance.current, mapIsLoaded.current);
    },
    drawEmergencyShelters: (geojson: GeoJSON.FeatureCollection) => {
      drawEmergencySheltersHelper(
        mapInstance.current,
        mapIsLoaded.current,
        geojson
      );
    },
    clearEmergencyShelters: () => {
      clearEmergencySheltersHelper(mapInstance.current, mapIsLoaded.current);
    },
    drawFireStations: (geojson: GeoJSON.FeatureCollection) => {
      drawFireStationsHelper(mapInstance.current, mapIsLoaded.current, geojson);
    },
    clearFireStations: () => {
      clearFireStationsHelper(mapInstance.current, mapIsLoaded.current);
    },
    drawPoliceStations: (geojson: GeoJSON.FeatureCollection) => {
      drawPoliceStationsHelper(
        mapInstance.current,
        mapIsLoaded.current,
        geojson
      );
    },
    clearPoliceStations: () => {
      clearPoliceStationsHelper(mapInstance.current, mapIsLoaded.current);
    },
    drawWeatherMarkers: (weatherDataArray: WeatherData[]) => {
      drawWeatherMarkersHelper(
        mapInstance.current,
        mapIsLoaded.current,
        weatherDataArray
      );
    },

    clearWeatherMarkers: () => {
      clearWeatherMarkersHelper();
    },
    weatherMarkersRef,

    addGeoJSONLayer: (mapUndoImplRefs.addGeoJSONLayer = async (
      geojson: GeoJSON.FeatureCollection,
      layerName: string
    ) => {
      const map = mapInstance.current;
      if (!map || !mapIsLoaded.current) return;
      const safeName = layerName.replace(/[^a-zA-Z0-9_-]/g, "");
      const sourceId = `upload-${safeName}`;
      const baseId = `${sourceId}-layer`;
      // Remove old layers
      ["fill", "line", "circle"].forEach((type) => {
        const layerId = `${baseId}-${type}`;
        if (map.getLayer(layerId)) map.removeLayer(layerId);
      });
      if (map.getSource(sourceId)) map.removeSource(sourceId);
      // Normalize multi-geometries
      const turf = await import("@turf/turf");
      const normalizedFeatures: GeoJSON.Feature<GeoJSON.Geometry>[] = [];
      geojson.features.forEach((f) => {
        try {
          if (
            f.geometry.type === "MultiPolygon" ||
            f.geometry.type === "MultiLineString"
          ) {
            // Check complexity before flattening
            const coordCount = JSON.stringify(f.geometry.coordinates).length;
            if (coordCount > 1000000) {
              console.warn(
                "Skipping flatten for very complex geometry, using as-is"
              );
              normalizedFeatures.push(f);
            } else {
              const exploded = turf.flatten(f);
              normalizedFeatures.push(...exploded.features);
            }
          } else if (f.geometry.type === "MultiPoint") {
            f.geometry.coordinates.forEach((coord) => {
              normalizedFeatures.push({
                type: "Feature",
                properties: f.properties,
                geometry: { type: "Point", coordinates: coord },
              });
            });
          } else {
            normalizedFeatures.push(f);
          }
        } catch (flattenError) {
          console.warn("Error flattening geometry, using as-is:", flattenError);
          normalizedFeatures.push(f);
        }
      });
      const normalizedGeoJSON: GeoJSON.FeatureCollection = {
        type: "FeatureCollection",
        features: normalizedFeatures,
      };

      console.log("Normalized GeoJSON features:", normalizedFeatures.length);
      console.log("Adding source:", sourceId);

      // Add GeoJSON source
      map.addSource(sourceId, { type: "geojson", data: normalizedGeoJSON });
      const beforeId = getTopSymbolLayerId(map);

      // Check which geometry types exist
      const hasPolygons = normalizedGeoJSON.features.some(
        (f) =>
          f.geometry.type === "Polygon" || f.geometry.type === "MultiPolygon"
      );
      const hasLines = normalizedGeoJSON.features.some(
        (f) =>
          f.geometry.type === "LineString" ||
          f.geometry.type === "MultiLineString"
      );
      const hasPoints = normalizedGeoJSON.features.some(
        (f) => f.geometry.type === "Point" || f.geometry.type === "MultiPoint"
      );

      console.log(
        "Geometry types - Polygons:",
        hasPolygons,
        "Lines:",
        hasLines,
        "Points:",
        hasPoints
      );
      // Unified color for all geometries
      const color = "#9699FF";
      // Add polygon layer
      if (hasPolygons) {
        map.addLayer(
          {
            id: `${baseId}-fill`,
            type: "fill",
            source: sourceId,
            paint: { "fill-color": color, "fill-opacity": 0.3 },
          },
          beforeId
        );
      }
      // Add line layer
      if (hasLines) {
        map.addLayer(
          {
            id: `${baseId}-line`,
            type: "line",
            source: sourceId,
            paint: { "line-color": color, "line-width": 3 },
          },
          beforeId
        );
      }
      // Add point layer
      if (hasPoints) {
        map.addLayer(
          {
            id: `${baseId}-circle`,
            type: "circle",
            source: sourceId,
            paint: {
              "circle-radius": 6,
              "circle-color": color,
              "circle-stroke-width": 2,
              "circle-stroke-color": "#fff",
            },
          },
          beforeId
        );
      }
      // --- Add popups ---
      const popup = new mapboxgl.Popup({
        closeButton: true,
        closeOnClick: true,
        maxWidth: "none",
        className: "custom-earthquake-popup",
      });
      const attachPopup = (layerId: string) => {
        map.on("click", layerId, (e) => {
          if (!e.features || e.features.length === 0) return;
          const feature = e.features[0];
          const props = feature.properties || {};

          // Build property rows with consistent styling
          let propertyRows = "";
          for (const key in props) {
            propertyRows += `
              <div style="
                background: #2a2a2a;
                border: 1px solid #3a3a3a;
                border-radius: 4px;
                padding: 6px;
                margin-bottom: 6px;
              ">
                <div style="
                  color: #9699FF;
                  font-size: 8px;
                  font-weight: 500;
                  text-transform: uppercase;
                  letter-spacing: 0.5px;
                  margin-bottom: 2px;
                ">
                  ${key}
                </div>
                <div style="
                  color: #C7C7C7;
                  font-size: 11px;
                  font-weight: 600;
                  word-break: break-word;
                ">
                  ${props[key]}
                </div>
              </div>
            `;
          }

          const html = `
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
              <!-- Title -->
              <div style="
                color: white;
                font-size: 12px;
                font-weight: 600;
                margin-bottom: 8px;
                line-height: 1.3;
              ">
                Feature Properties
              </div>

              <!-- Properties -->
              ${propertyRows}
            </div>
          `;

          popup.setLngLat(e.lngLat).setHTML(html).addTo(map);
        });
        // Cursor change on hover
        map.on(
          "mouseenter",
          layerId,
          () => (map.getCanvas().style.cursor = "pointer")
        );
        map.on(
          "mouseleave",
          layerId,
          () => (map.getCanvas().style.cursor = "")
        );
      };
      if (hasPolygons) attachPopup(`${baseId}-fill`);
      if (hasLines) attachPopup(`${baseId}-line`);
      if (hasPoints) attachPopup(`${baseId}-circle`);
      // Zoom to feature bounds
      try {
        const bbox = turf.bbox(normalizedGeoJSON);
        console.log("Fitting bounds to:", bbox);
        map.fitBounds(bbox as [number, number, number, number], {
          padding: 40,
          duration: 1000,
        });
      } catch (err) {
        console.warn("Could not fit bounds:", err);
        // Try manual bounds calculation as fallback
        try {
          const bounds = new mapboxgl.LngLatBounds();
          normalizedGeoJSON.features.forEach((feature) => {
            if (feature.geometry.type === "Point") {
              bounds.extend(feature.geometry.coordinates as [number, number]);
            } else if (feature.geometry.type === "Polygon") {
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
          if (!bounds.isEmpty()) {
            console.log("Using manual bounds calculation");
            map.fitBounds(bounds, { padding: 40, duration: 1000 });
          }
        } catch (manualErr) {
          console.error("Manual bounds calculation also failed:", manualErr);
        }
      }
    }),
    getMap: () => mapInstance.current,
    getResourcesOnMap,
    flyToResource,
    onResourcesChanged,
    clearAllResources,
    drawAffectedAreas: (mapUndoImplRefs.drawAffectedAreas = (
      geojson: GeoJSON.FeatureCollection
    ) => {
      const map = mapInstance.current;
      if (!map || !mapIsLoaded.current) return;

      // Store for restoration after style changes
      latestAffectedAreas.current = geojson;

      // BEFORE: All affected geometries were rendered as polygons/lines
      // AFTER: Separate point geometries for proper zoom-responsive rendering

      // Separate point and non-point geometries
      const pointFeatures = geojson.features.filter(
        (f) => f.geometry.type === "Point"
      );
      const nonPointFeatures = geojson.features.filter(
        (f) => f.geometry.type !== "Point"
      );

      // Handle non-point geometries (polygons and lines) as before
      if (nonPointFeatures.length > 0) {
        const sourceId = "affected-areas";
        const layerId = "affected-areas-layer";
        const outlineLayerId = "affected-areas-outline";

        // Remove existing layers if they exist
        if (map.getLayer(outlineLayerId)) map.removeLayer(outlineLayerId);
        if (map.getLayer(layerId)) map.removeLayer(layerId);
        if (map.getSource(sourceId)) map.removeSource(sourceId);

        // Add source with non-point features
        map.addSource(sourceId, {
          type: "geojson",
          data: {
            type: "FeatureCollection",
            features: nonPointFeatures,
          },
        });

        // Exposed boundaries (affected areas) = prominent red so they read as the result
        map.addLayer({
          id: layerId,
          type: "fill",
          source: sourceId,
          paint: {
            "fill-color": "#FF0000",
            "fill-opacity": 0.5,
          },
        });

        map.addLayer({
          id: outlineLayerId,
          type: "line",
          source: sourceId,
          paint: {
            "line-color": "#FF0000",
            "line-width": 3,
            "line-opacity": 0.95,
          },
        });

        // Add popup on click for non-point features
        const popup = new mapboxgl.Popup({
          closeButton: true,
          closeOnClick: true,
          maxWidth: "none",
          className: "custom-earthquake-popup",
        });

        map.on("click", layerId, (e) => {
          if (!e.features || e.features.length === 0) return;
          const feature = e.features[0];
          const props = feature.properties || {};

          // Build property rows with consistent styling
          let propertyRows = "";
          for (const key in props) {
            propertyRows += `
              <div style="
                background: #2a2a2a;
                border: 1px solid #3a3a3a;
                border-radius: 4px;
                padding: 6px;
                margin-bottom: 6px;
              ">
                <div style="
                  color: #9699FF;
                  font-size: 8px;
                  font-weight: 500;
                  text-transform: uppercase;
                  letter-spacing: 0.5px;
                  margin-bottom: 2px;
                ">
                  ${key}
                </div>
                <div style="
                  color: #C7C7C7;
                  font-size: 11px;
                  font-weight: 600;
                  word-break: break-word;
                ">
                  ${props[key]}
                </div>
              </div>
            `;
          }

          const html = `
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
              <!-- Title -->
              <div style="
                color: white;
                font-size: 12px;
                font-weight: 600;
                margin-bottom: 8px;
                line-height: 1.3;
              ">
                Affected Area
              </div>

              <!-- Properties -->
              ${propertyRows}
            </div>
          `;

          popup.setLngLat(e.lngLat).setHTML(html).addTo(map);
        });

        // Cursor change on hover
        map.on("mouseenter", layerId, () => {
          map.getCanvas().style.cursor = "pointer";
        });
        map.on("mouseleave", layerId, () => {
          map.getCanvas().style.cursor = "";
        });

        console.log(
          `Drew ${nonPointFeatures.length} affected areas (polygons/lines) on TOP layer`
        );
      }

      // Handle point geometries with zoom-responsive circles
      if (pointFeatures.length > 0) {
        const pointSourceId = "affected-points";
        const pointLayerId = "affected-points-layer";

        // Remove existing point layer if exists
        if (map.getLayer(pointLayerId)) map.removeLayer(pointLayerId);
        if (map.getSource(pointSourceId)) map.removeSource(pointSourceId);

        // Add point source
        map.addSource(pointSourceId, {
          type: "geojson",
          data: {
            type: "FeatureCollection",
            features: pointFeatures,
          },
        });

        // Add circle layer with zoom-responsive radius (like volcano markers)
        map.addLayer({
          id: pointLayerId,
          type: "circle",
          source: pointSourceId,
          paint: {
            "circle-radius": 8, // Auto-scales with zoom
            "circle-color": "#FF0000",
          },
        });

        // Add popup on click for point features
        const pointPopup = new mapboxgl.Popup({
          closeButton: true,
          closeOnClick: true,
          maxWidth: "none",
          className: "custom-earthquake-popup",
        });

        map.on("click", pointLayerId, (e) => {
          if (!e.features || e.features.length === 0) return;
          const feature = e.features[0];
          const props = feature.properties || {};

          // Build property rows with consistent styling
          let propertyRows = "";
          for (const key in props) {
            if (key !== "raw") {
              propertyRows += `
                <div style="
                  background: #2a2a2a;
                  border: 1px solid #3a3a3a;
                  border-radius: 4px;
                  padding: 6px;
                  margin-bottom: 6px;
                ">
                  <div style="
                    color: #9699FF;
                    font-size: 8px;
                    font-weight: 500;
                    text-transform: uppercase;
                    letter-spacing: 0.5px;
                    margin-bottom: 2px;
                  ">
                    ${key}
                  </div>
                  <div style="
                    color: #C7C7C7;
                    font-size: 11px;
                    font-weight: 600;
                    word-break: break-word;
                  ">
                    ${props[key]}
                  </div>
                </div>
              `;
            }
          }

          const html = `
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
              <!-- Title -->
              <div style="
                color: white;
                font-size: 12px;
                font-weight: 600;
                margin-bottom: 8px;
                line-height: 1.3;
              ">
                Affected Point
              </div>

              <!-- Properties -->
              ${propertyRows}
            </div>
          `;

          pointPopup.setLngLat(e.lngLat).setHTML(html).addTo(map);
        });

        // Cursor change on hover
        map.on("mouseenter", pointLayerId, () => {
          map.getCanvas().style.cursor = "pointer";
        });
        map.on("mouseleave", pointLayerId, () => {
          map.getCanvas().style.cursor = "";
        });

        console.log(
          `Drew ${pointFeatures.length} affected point markers with zoom-responsive sizing`
        );
      }
    }),

    fitBoundsToAffectedAreas: (geojson: GeoJSON.FeatureCollection) => {
      const map = mapInstance.current;
      if (!map || !mapIsLoaded.current || !geojson.features.length) return;

      try {
        // Calculate bounds from all affected area features
        const bounds = new mapboxgl.LngLatBounds();
        let hasValidCoordinates = false; // NEW: Track if we have any valid coordinates

        geojson.features.forEach((feature) => {
          if (feature.geometry.type === "Polygon") {
            feature.geometry.coordinates[0].forEach((coord) => {
              // NEW: Validate coordinate before extending bounds
              if (
                Array.isArray(coord) &&
                coord.length === 2 &&
                typeof coord[0] === "number" &&
                typeof coord[1] === "number" &&
                !isNaN(coord[0]) &&
                !isNaN(coord[1])
              ) {
                bounds.extend(coord as [number, number]);
                hasValidCoordinates = true;
              }
            });
          } else if (feature.geometry.type === "MultiPolygon") {
            feature.geometry.coordinates.forEach((polygon) => {
              polygon[0].forEach((coord) => {
                // NEW: Validate coordinate before extending bounds
                if (
                  Array.isArray(coord) &&
                  coord.length === 2 &&
                  typeof coord[0] === "number" &&
                  typeof coord[1] === "number" &&
                  !isNaN(coord[0]) &&
                  !isNaN(coord[1])
                ) {
                  bounds.extend(coord as [number, number]);
                  hasValidCoordinates = true;
                }
              });
            });
          } else if (feature.geometry.type === "LineString") {
            feature.geometry.coordinates.forEach((coord) => {
              // NEW: Validate coordinate before extending bounds
              if (
                Array.isArray(coord) &&
                coord.length === 2 &&
                typeof coord[0] === "number" &&
                typeof coord[1] === "number" &&
                !isNaN(coord[0]) &&
                !isNaN(coord[1])
              ) {
                bounds.extend(coord as [number, number]);
                hasValidCoordinates = true;
              }
            });
          } else if (feature.geometry.type === "MultiLineString") {
            feature.geometry.coordinates.forEach((line) => {
              line.forEach((coord) => {
                // NEW: Validate coordinate before extending bounds
                if (
                  Array.isArray(coord) &&
                  coord.length === 2 &&
                  typeof coord[0] === "number" &&
                  typeof coord[1] === "number" &&
                  !isNaN(coord[0]) &&
                  !isNaN(coord[1])
                ) {
                  bounds.extend(coord as [number, number]);
                  hasValidCoordinates = true;
                }
              });
            });
          } else if (feature.geometry.type === "Point") {
            // NEW: Handle Point geometries
            const coord = feature.geometry.coordinates;
            if (
              Array.isArray(coord) &&
              coord.length === 2 &&
              typeof coord[0] === "number" &&
              typeof coord[1] === "number" &&
              !isNaN(coord[0]) &&
              !isNaN(coord[1])
            ) {
              bounds.extend(coord as [number, number]);
              hasValidCoordinates = true;
            }
          } else if (feature.geometry.type === "MultiPoint") {
            // NEW: Handle MultiPoint geometries
            feature.geometry.coordinates.forEach((coord) => {
              if (
                Array.isArray(coord) &&
                coord.length === 2 &&
                typeof coord[0] === "number" &&
                typeof coord[1] === "number" &&
                !isNaN(coord[0]) &&
                !isNaN(coord[1])
              ) {
                bounds.extend(coord as [number, number]);
                hasValidCoordinates = true;
              }
            });
          }
        });

        // NEW: Only attempt fitBounds if we have valid coordinates
        if (!hasValidCoordinates) {
          console.warn(
            "No valid coordinates found in affected areas, cannot fit bounds"
          );
          return;
        }

        const sw = bounds.getSouthWest();
        const ne = bounds.getNorthEast();

        if (
          !sw ||
          !ne ||
          isNaN(sw.lng) ||
          isNaN(sw.lat) ||
          isNaN(ne.lng) ||
          isNaN(ne.lat)
        ) {
          console.warn("Invalid bounds calculated, cannot fit bounds");
          return;
        }

        // Fit map to bounds with padding
        map.fitBounds(bounds, {
          padding: 100,
          maxZoom: 15,
          duration: 1500,
        });

        console.log(`Zoomed to ${geojson.features.length} affected areas`);
      } catch (error) {
        console.error("Error fitting bounds to affected areas:", error);
      }
    },

    clearAffectedAreas: (mapUndoImplRefs.clearAffectedAreas = () => {
      const map = mapInstance.current;
      if (!map || !mapIsLoaded.current) return;

      // Clear stored data
      latestAffectedAreas.current = null;

      // BEFORE: Only cleared polygon/line layers
      // AFTER: Also clear point layers

      // Clear polygon/line layers
      const sourceId = "affected-areas";
      const layerId = "affected-areas-layer";
      const outlineLayerId = "affected-areas-outline";

      if (map.getLayer(outlineLayerId)) map.removeLayer(outlineLayerId);
      if (map.getLayer(layerId)) map.removeLayer(layerId);
      if (map.getSource(sourceId)) map.removeSource(sourceId);

      // Clear point layers
      const pointSourceId = "affected-points";
      const pointLayerId = "affected-points-layer";

      if (map.getLayer(pointLayerId)) map.removeLayer(pointLayerId);
      if (map.getSource(pointSourceId)) map.removeSource(pointSourceId);

      console.log(
        "Cleared affected areas (polygons, lines, and points) from map"
      );
    }),
    getUploadedLayerData,

    captureUndoState: (
      uploadedFilesList: { name: string; layerName: string }[]
    ): MapUndoSnapshot | null => {
      const map = mapInstance.current;
      if (!map || !mapIsLoaded.current) return null;
      const c = map.getCenter();
      const uploads: MapUndoSnapshot["uploads"] = [];
      for (const f of uploadedFilesList) {
        const data = getUploadedLayerData(f.layerName);
        if (data && data.type === "FeatureCollection") {
          uploads.push({
            layerName: f.layerName,
            data: JSON.parse(JSON.stringify(data)) as GeoJSON.FeatureCollection,
          });
        }
      }
      let drawnBox: GeoJSON.FeatureCollection | null = null;
      const drawnSrc = map.getSource("drawn-box") as
        | (mapboxgl.GeoJSONSource & { _data?: GeoJSON.FeatureCollection })
        | undefined;
      if (drawnSrc && drawnSrc._data) {
        drawnBox = JSON.parse(
          JSON.stringify(drawnSrc._data)
        ) as GeoJSON.FeatureCollection;
      }
      return {
        camera: {
          lng: c.lng,
          lat: c.lat,
          zoom: map.getZoom(),
          pitch: map.getPitch(),
          bearing: map.getBearing(),
        },
        uploads,
        drawnBox,
        routes: latestRoutesGeoJSON.current
          ? JSON.parse(JSON.stringify(latestRoutesGeoJSON.current))
          : null,
        affectedAreas: latestAffectedAreas.current
          ? JSON.parse(JSON.stringify(latestAffectedAreas.current))
          : null,
        volcanoes: JSON.parse(JSON.stringify(latestVolcanoes.current)),
        earthquakes: JSON.parse(JSON.stringify(latestEarthquakes.current)),
        activeFaults: latestActiveFaults.current
          ? JSON.parse(JSON.stringify(latestActiveFaults.current))
          : null,
        floodHazards: JSON.parse(JSON.stringify(latestFloodHazards.current)),
        markers: {
          location: locationMarkerRef.current
            ? (() => {
                const ll = locationMarkerRef.current!.getLngLat();
                return [ll.lng, ll.lat] as [number, number];
              })()
            : null,
          start: startMarkerRef.current
            ? (() => {
                const ll = startMarkerRef.current!.getLngLat();
                return [ll.lng, ll.lat] as [number, number];
              })()
            : null,
          dest: destinationMarkerRef.current
            ? (() => {
                const ll = destinationMarkerRef.current!.getLngLat();
                return [ll.lng, ll.lat] as [number, number];
              })()
            : null,
        },
        routeFeatureIndex: selectedFeatureIndexRef.current,
        boundary: (() => {
          const bSrc = map.getSource("geoboundaries") as
            | (mapboxgl.GeoJSONSource & {
                _data?: GeoJSON.FeatureCollection;
              })
            | undefined;
          if (
            bSrc &&
            bSrc._data &&
            (bSrc._data as GeoJSON.FeatureCollection).features?.length
          ) {
            return JSON.parse(
              JSON.stringify(bSrc._data)
            ) as GeoJSON.FeatureCollection;
          }
          return null;
        })(),
      };
    },

    setIs3DModeForUndo: (is3d: boolean) => {
      is3DMode.current = is3d;
    },

    /**
     * Re-applies layers/refs after a style reload (used with undo/redo).
     * Parent should set map style, wait for style.load, then call this.
     */
    restoreUndoMapsLayers: async (
      snap: MapUndoSnapshot,
      viewMode: "2d" | "3d" = "2d"
    ) => {
      const map = mapInstance.current;
      if (!map || !mapIsLoaded.current) return;
      const addLayer = mapUndoImplRefs.addGeoJSONLayer;
      const uploads = snap.uploads ?? [];
      if (uploads.length > 0 && !addLayer) return;

      if (viewMode === "3d") {
        addTerrainOnly(map);
      } else {
        try {
          map.setTerrain(null);
        } catch {
          /* ignore */
        }
      }

      locationMarkerRef.current?.remove();
      locationMarkerRef.current = null;
      startMarkerRef.current?.remove();
      startMarkerRef.current = null;
      destinationMarkerRef.current?.remove();
      destinationMarkerRef.current = null;

      if (map.getLayer("drawn-box-layer")) map.removeLayer("drawn-box-layer");
      if (map.getLayer("drawn-box-outline")) map.removeLayer("drawn-box-outline");
      if (map.getSource("drawn-box")) map.removeSource("drawn-box");

      stripGeoboundariesForUndo(map);

      const style = map.getStyle();
      if (style?.sources) {
        Object.keys(style.sources).forEach((sourceId) => {
          if (!sourceId.startsWith("upload-")) return;
          const safe = sourceId.replace(/^upload-/, "");
          const baseId = `${sourceId}-layer`;
          ["fill", "line", "circle"].forEach((type) => {
            const layerId = `${baseId}-${type}`;
            if (map.getLayer(layerId)) map.removeLayer(layerId);
          });
          if (map.getSource(sourceId)) map.removeSource(sourceId);
        });
      }

      mapUndoImplRefs.clearAffectedAreas?.();

      latestRoutesGeoJSON.current = snap.routes
        ? JSON.parse(JSON.stringify(snap.routes))
        : null;
      latestVolcanoes.current = JSON.parse(JSON.stringify(snap.volcanoes));
      latestEarthquakes.current = JSON.parse(JSON.stringify(snap.earthquakes));
      latestActiveFaults.current = snap.activeFaults
        ? JSON.parse(JSON.stringify(snap.activeFaults))
        : null;
      latestFloodHazards.current = JSON.parse(JSON.stringify(snap.floodHazards));
      latestAffectedAreas.current = snap.affectedAreas
        ? JSON.parse(JSON.stringify(snap.affectedAreas))
        : null;
      selectedFeatureIndexRef.current = snap.routeFeatureIndex;

      for (const u of uploads) {
        await addLayer!(u.data, u.layerName);
      }

      if (snap.drawnBox?.features?.length) {
        map.addSource("drawn-box", { type: "geojson", data: snap.drawnBox });
        map.addLayer({
          id: "drawn-box-layer",
          type: "fill",
          source: "drawn-box",
          paint: { "fill-color": "#9699FF", "fill-opacity": 0.15 },
        });
        map.addLayer({
          id: "drawn-box-outline",
          type: "line",
          source: "drawn-box",
          paint: { "line-color": "#9699FF", "line-width": 2 },
        });
      }

      if (latestRoutesGeoJSON.current) {
        drawRoutesHelper(
          mapInstance.current,
          mapIsLoaded,
          latestRoutesGeoJSON,
          selectedFeatureIndexRef,
          getTopSymbolLayerId
        );
      }

      if (latestVolcanoes.current.length > 0) {
        drawVolcanoDotsHelper(
          mapInstance.current,
          mapIsLoaded.current,
          latestVolcanoes,
          latestVolcanoes.current
        );
      }
      if (latestEarthquakes.current.length > 0) {
        drawEarthquakeDotsHelper(
          mapInstance.current,
          mapIsLoaded.current,
          latestEarthquakes,
          latestEarthquakes.current
        );
      }
      if (latestActiveFaults.current) {
        drawActiveFaultsHelper(
          mapInstance.current,
          mapIsLoaded.current,
          latestActiveFaults,
          latestActiveFaults.current
        );
      }

      if (latestAffectedAreas.current?.features?.length) {
        mapUndoImplRefs.drawAffectedAreas?.(latestAffectedAreas.current);
      }

      for (const fh of latestFloodHazards.current) {
        await drawFloodHazardHelper(
          mapInstance.current,
          mapIsLoaded.current,
          fh.geojsonUrl,
          fh.returnPeriod,
          fh.provinceName
        );
      }

      if (snap.markers.location) {
        const [lng, lat] = snap.markers.location;
        const marker = new mapboxgl.Marker({ color: "#9699FF" })
          .setLngLat([lng, lat])
          .addTo(map);
        locationMarkerRef.current = marker;
      }
      if (snap.markers.start) {
        const [lng, lat] = snap.markers.start;
        const marker = new mapboxgl.Marker({ color: "#00FF00" })
          .setLngLat([lng, lat])
          .addTo(map);
        startMarkerRef.current = marker;
      }
      if (snap.markers.dest) {
        const [lng, lat] = snap.markers.dest;
        const marker = new mapboxgl.Marker({ color: "#FF4C4C" })
          .setLngLat([lng, lat])
          .addTo(map);
        destinationMarkerRef.current = marker;
      }

      if (snap.routeFeatureIndex != null && latestRoutesGeoJSON.current) {
        highlightRouteByFeatureIndex(
          mapInstance.current,
          mapIsLoaded,
          selectedFeatureIndexRef,
          snap.routeFeatureIndex
        );
      }

      restoreSimpleBoundaryFromSnapshot(map, snap.boundary ?? null);

      map.jumpTo({
        center: [snap.camera.lng, snap.camera.lat],
        zoom: snap.camera.zoom,
        pitch: snap.camera.pitch,
        bearing: snap.camera.bearing,
      });
    },

    // Add boundary layer: geoBoundaries, OSM/Overpass, or Geoapify Boundaries API
    addBoundaryLayer: async (
      countryCode: string,
      adminLevel: string,
      boundaryLabel?: string,
      dataSource: "geoboundaries" | "osm" | "geoapify" = "geoboundaries",
      geoapifyCountryName?: string
    ) => {
      const map = mapInstance.current;
      if (!map || !mapIsLoaded.current) return;

      const sourceId = "geoboundaries";
      const fillLayerId = "boundary-fill";
      const lineLayerId = "boundary-line";

      // Remove existing click handler before removing layers
      if (boundaryClickHandlerRef.current && map.getLayer(fillLayerId)) {
        map.off("click", fillLayerId, boundaryClickHandlerRef.current);
        boundaryClickHandlerRef.current = null;
      }

      // Remove existing popup
      boundaryPopupRef.current?.remove();
      boundaryPopupRef.current = null;

      // Remove existing boundary layers (must remove ALL layers before removing source)
      const hoverLayerId = `${fillLayerId}-hover`;
      const selectedLayerId = `${fillLayerId}-selected`;

      if (map.getLayer(selectedLayerId)) map.removeLayer(selectedLayerId);
      if (map.getLayer(hoverLayerId)) map.removeLayer(hoverLayerId);
      if (map.getLayer(lineLayerId)) map.removeLayer(lineLayerId);
      if (map.getLayer(fillLayerId)) map.removeLayer(fillLayerId);
      if (map.getSource(sourceId)) map.removeSource(sourceId);

      // Map admin level to geoBoundaries format (ADM0, ADM1, ADM2, etc.)
      const gbAdminLevelMap: Record<string, string> = {
        admin0: "ADM0",
        admin1: "ADM1",
        admin2: "ADM2",
        admin3: "ADM3",
      };

      const gbAdminLevel = gbAdminLevelMap[adminLevel];
      if (!gbAdminLevel) {
        console.warn(`Unknown admin level: ${adminLevel}`);
        return;
      }

      const iso2 = countryCode.toUpperCase();
      const iso3 = ISO2_TO_ISO3[iso2];
      if (dataSource === "geoboundaries" && !iso3) {
        console.warn(`Unknown country code: ${countryCode}`);
        return;
      }
      if (dataSource === "geoapify") {
        const cn = (geoapifyCountryName || "").trim();
        if (!cn) {
          console.warn("Geoapify boundaries require a country name");
          alert("Geoapify needs a country name — pick a country from the list.");
          return;
        }
      }

      try {
        const backendEndpoint =
          process.env.NEXT_PUBLIC_BACKEND_ENDPOINT || "http://localhost:8000";
        let backendUrl: string;
        if (dataSource === "osm") {
          backendUrl = `${backendEndpoint}/api/boundaries/osm/${iso2}/${adminLevel}`;
          console.log(`Fetching OSM boundaries: ${backendUrl}`);
        } else if (dataSource === "geoapify") {
          const q = new URLSearchParams({
            country: (geoapifyCountryName || "").trim(),
          });
          backendUrl = `${backendEndpoint}/api/boundaries/geoapify/${iso2}/${adminLevel}?${q}`;
          console.log(`Fetching Geoapify boundaries: ${backendUrl}`);
        } else {
          console.log(`Fetching boundary for ${iso3} at ${gbAdminLevel}...`);
          backendUrl = `${backendEndpoint}/api/boundaries/${iso3}/${gbAdminLevel}`;
          console.log(`Fetching from backend: ${backendUrl}`);
        }

        const response = await fetch(backendUrl);

        if (!response.ok) {
          const errorData = await response
            .json()
            .catch(() => ({ detail: "Unknown error" }));
          throw new Error(
            errorData.detail ||
              `Failed to fetch boundary data: ${response.statusText}`
          );
        }

        const geojson: GeoJSON.FeatureCollection = await response.json();

        if (!geojson || !geojson.features || geojson.features.length === 0) {
          throw new Error("Empty GeoJSON data");
        }

        console.log(`Loaded ${geojson.features.length} boundary features`);

        // Add the GeoJSON source with generateId option as fallback
        map.addSource(sourceId, {
          type: "geojson",
          data: geojson,
          generateId: true,
        });

        // Add fill layer
        map.addLayer({
          id: fillLayerId,
          type: "fill",
          source: sourceId,
          paint: { "fill-color": "#9699FF", "fill-opacity": 0.2 },
        });

        // Add line layer
        map.addLayer({
          id: lineLayerId,
          type: "line",
          source: sourceId,
          paint: { "line-color": "#9699FF", "line-width": 2 },
        });

        // Add hover highlight layer (also shows for selected features)
        map.addLayer({
          id: `${fillLayerId}-hover`,
          type: "fill",
          source: sourceId,
          paint: {
            "fill-color": "#9699FF",
            "fill-opacity": [
              "case",
              [
                "any",
                ["boolean", ["feature-state", "hover"], false],
                ["boolean", ["feature-state", "selected"], false],
              ],
              0.5,
              0,
            ],
          },
        });

        // Add click highlight layer
        map.addLayer({
          id: `${fillLayerId}-selected`,
          type: "line",
          source: sourceId,
          paint: {
            "line-color": "#FFD700",
            "line-width": [
              "case",
              ["boolean", ["feature-state", "selected"], false],
              3,
              0,
            ],
          },
        });

        // Track hover and selected states
        let hoveredFeatureId: string | number | null = null;
        let selectedFeatureId: string | number | null = null;

        // Add hover effect
        map.on("mousemove", fillLayerId, (e) => {
          if (e.features && e.features.length > 0) {
            // Change cursor to pointer
            map.getCanvas().style.cursor = "pointer";

            const feature = e.features[0];
            if (feature.id !== hoveredFeatureId) {
              // Remove hover from previous feature
              if (hoveredFeatureId !== null) {
                map.setFeatureState(
                  { source: sourceId, id: hoveredFeatureId },
                  { hover: false }
                );
              }
              // Add hover to current feature
              hoveredFeatureId = feature.id as string | number;
              map.setFeatureState(
                { source: sourceId, id: hoveredFeatureId },
                { hover: true }
              );
            }
          }
        });

        // Remove hover when mouse leaves
        map.on("mouseleave", fillLayerId, () => {
          map.getCanvas().style.cursor = "";
          if (hoveredFeatureId !== null) {
            map.setFeatureState(
              { source: sourceId, id: hoveredFeatureId },
              { hover: false }
            );
            hoveredFeatureId = null;
          }
        });

        // Add click popup for boundary info - use ref to track and clean up
        // (cleanup already done at the start of this function)
        boundaryPopupRef.current = new mapboxgl.Popup({
          closeButton: true,
          closeOnClick: true,
          maxWidth: "none",
          className: "custom-earthquake-popup",
        });

        // Create click handler and store reference for cleanup
        const clickHandler = (e: mapboxgl.MapLayerMouseEvent) => {
          if (!e.features || e.features.length === 0) return;
          const feature = e.features[0];
          const props = feature.properties || {};

          // Update selected state
          if (selectedFeatureId !== null) {
            map.setFeatureState(
              { source: sourceId, id: selectedFeatureId },
              { selected: false }
            );
          }
          selectedFeatureId = feature.id as string | number;
          map.setFeatureState(
            { source: sourceId, id: selectedFeatureId },
            { selected: true }
          );

          // geoBoundaries / OSM backend both set shapeName
          const boundaryName =
            props.shapeName || props.name || props.NAME || "Unknown";
          const sourceNote =
            props.boundary_source === "osm"
              ? '<div style="color:#888;font-size:9px;margin-top:6px;">© OpenStreetMap contributors (ODbL)</div>'
              : props.boundary_source === "geoapify"
                ? '<div style="color:#888;font-size:9px;margin-top:6px;">© Geoapify · OpenStreetMap (ODbL)</div>'
                : "";

          let typeLabel = "Boundary";
          if (dataSource === "osm") {
            typeLabel = osmPopupTypeLabel(adminLevel);
          } else if (dataSource === "geoapify") {
            typeLabel = geoapifyPopupTypeLabel(adminLevel);
          } else if (boundaryLabel) {
            const match = boundaryLabel.match(/^By\s+(.+?)\s*\(/i);
            if (match) {
              typeLabel =
                match[1].charAt(0).toUpperCase() +
                match[1].slice(1).toLowerCase();
            } else if (boundaryLabel.includes("Country")) {
              typeLabel = "Country";
            }
          }

          const adminLevelDisplay =
            dataSource === "osm" && props.osm_admin_level != null
              ? `OSM admin_level ${String(props.osm_admin_level)}`
              : dataSource === "geoapify"
                ? `Geoapify · ${adminLevel}`
                : `geoBoundaries ${gbAdminLevel}`;

          // Get country code from shapeGroup (ISO3 code)
          const isoCode = props.shapeGroup || "";

          const html = `
            <div style="
              background: #2E2E2E;
              border-radius: 6px;
              padding: 8px;
              min-width: 180px;
              max-width: 260px;
              box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.3), 0 2px 4px -1px rgba(0, 0, 0, 0.2);
              border: 1px solid #3a3a3a;
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            ">
              <div style="
                background: #2a2a2a;
                border: 1px solid #3a3a3a;
                border-radius: 4px;
                padding: 6px;
                margin-bottom: 6px;
              ">
                <div style="
                  color: #9699FF;
                  font-size: 8px;
                  font-weight: 500;
                  text-transform: uppercase;
                  letter-spacing: 0.5px;
                  margin-bottom: 2px;
                ">
                  ${typeLabel}
                </div>
                <div style="
                  color: white;
                  font-size: 13px;
                  font-weight: 600;
                  word-break: break-word;
                ">
                  ${boundaryName}
                </div>
              </div>
              <div style="
                background: #2a2a2a;
                border: 1px solid #3a3a3a;
                border-radius: 4px;
                padding: 6px;
                margin-bottom: 6px;
              ">
                <div style="
                  color: #9699FF;
                  font-size: 8px;
                  font-weight: 500;
                  text-transform: uppercase;
                  letter-spacing: 0.5px;
                  margin-bottom: 2px;
                ">
                  Level (data source)
                </div>
                <div style="
                  color: #C7C7C7;
                  font-size: 11px;
                  font-weight: 600;
                ">
                  ${adminLevelDisplay}
                </div>
              </div>
              ${
                isoCode
                  ? `
              <div style="
                background: #2a2a2a;
                border: 1px solid #3a3a3a;
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
                  Country Code
                </div>
                <div style="
                  color: #C7C7C7;
                  font-size: 11px;
                  font-weight: 600;
                ">
                  ${isoCode}
                </div>
              </div>
              `
                  : ""
              }
              ${sourceNote}
            </div>
          `;

          boundaryPopupRef.current
            ?.setLngLat(e.lngLat)
            .setHTML(html)
            .addTo(map);
        };

        // Store the handler reference for cleanup
        boundaryClickHandlerRef.current = clickHandler;
        map.on("click", fillLayerId, clickHandler);

        // Cursor change on hover
        map.on("mouseenter", fillLayerId, () => {
          map.getCanvas().style.cursor = "pointer";
        });
        map.on("mouseleave", fillLayerId, () => {
          map.getCanvas().style.cursor = "";
        });

        // Fit map to boundary bounds
        const turf = await import("@turf/turf");
        const bbox = turf.bbox(geojson);
        map.fitBounds(bbox as [number, number, number, number], {
          padding: 50,
          duration: 1000,
        });

        console.log(
          `Added boundary layer (${dataSource}) for ${iso2} at ${gbAdminLevel}`
        );
      } catch (error) {
        console.error("Error fetching boundary data:", error);
        // Show user-friendly error message
        const errorMessage =
          error instanceof Error ? error.message : "Unknown error occurred";
        alert(`Failed to load boundary data: ${errorMessage}`);
      }
    },

    // Remove boundary layer
    removeBoundaryLayer: () => {
      const map = mapInstance.current;
      if (!map || !mapIsLoaded.current) return;

      const sourceId = "geoboundaries";
      const fillLayerId = "boundary-fill";
      const lineLayerId = "boundary-line";
      const hoverLayerId = `${fillLayerId}-hover`;
      const selectedLayerId = `${fillLayerId}-selected`;

      // Remove click handler before removing layers
      if (boundaryClickHandlerRef.current && map.getLayer(fillLayerId)) {
        map.off("click", fillLayerId, boundaryClickHandlerRef.current);
        boundaryClickHandlerRef.current = null;
      }

      // Remove popup
      boundaryPopupRef.current?.remove();
      boundaryPopupRef.current = null;

      // Remove all layers first (must remove layers before removing source)
      if (map.getLayer(selectedLayerId)) map.removeLayer(selectedLayerId);
      if (map.getLayer(hoverLayerId)) map.removeLayer(hoverLayerId);
      if (map.getLayer(lineLayerId)) map.removeLayer(lineLayerId);
      if (map.getLayer(fillLayerId)) map.removeLayer(fillLayerId);

      // Now remove the source
      if (map.getSource(sourceId)) map.removeSource(sourceId);

      console.log("Removed boundary layer");
    },

    // Traffic incident visualization
    drawIncidentSegments: (
      routesWithIncidents: Array<{
        featureIndex: number;
        trafficData?: {
          incidents: Array<{
            geometry: any;
            severity: number;
            category_name: string;
          }>;
        };
      }>
    ) => {
      drawIncidentSegmentsHelper(
        mapInstance.current,
        mapIsLoaded,
        routesWithIncidents,
        getTopSymbolLayerId
      );
    },

    clearIncidentSegments: () => {
      clearIncidentSegmentsHelper(mapInstance.current, mapIsLoaded);
    },
  }));
  return (
    <>
      <div
        ref={mapContainer}
        className="absolute top-0 left-0 w-full h-full z-0"
      />
      {pendingResource && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/50 z-[9999]">
          <div className="bg-white rounded-xl shadow-lg p-6 w-[400px]">
            <h2 className="text-lg font-bold mb-4">Add Resource</h2>
            <label className="block mb-2 text-sm font-medium">Name</label>
            <input
              type="text"
              value={resourceName}
              onChange={(e) => setResourceName(e.target.value)}
              className="w-full border rounded p-2 mb-4"
            />
            <label className="block mb-2 text-sm font-medium">
              Description
            </label>
            <textarea
              value={resourceDesc}
              onChange={(e) => setResourceDesc(e.target.value)}
              className="w-full border rounded p-2 mb-4"
              rows={3}
            />
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setPendingResource(null)} // cancel
                className="px-4 py-2 rounded bg-gray-300 hover:bg-gray-400"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  if (pendingResource) {
                    addResourceMarker(
                      pendingResource.lngLat,
                      pendingResource.type,
                      {
                        name: resourceName,
                        description: resourceDesc,
                      }
                    );
                    setPendingResource(null);
                  }
                }}
                className="px-4 py-2 rounded bg-blue-600 text-white hover:bg-blue-700"
              >
                Add
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
});
export default MapComponent;
const addTerrainOnly = (map: mapboxgl.Map) => {
  const style = map.getStyle();
  if (!style?.sources) return; // guard for unloaded style
  if (!map.getSource("mapbox-dem")) {
    map.addSource("mapbox-dem", {
      type: "raster-dem",
      url: "mapbox://mapbox.terrain-rgb",
      tileSize: 512,
      maxzoom: 14,
    });
  }
  map.setTerrain({ source: "mapbox-dem", exaggeration: 1.3 });
};
