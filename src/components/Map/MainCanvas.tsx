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

const MapComponent = forwardRef(function MapComponent(_, ref) {
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
  const selectedFeatureIndexRef = useRef<number | null>(null);
  const locationMarkerRef = useRef<mapboxgl.Marker | null>(null);
  const startMarkerRef = useRef<mapboxgl.Marker | null>(null);
  const destinationMarkerRef = useRef<mapboxgl.Marker | null>(null);
  useEffect(() => {
    if (!mapContainer.current) return;
    const map = new mapboxgl.Map({
      container: mapContainer.current,
      style: "mapbox://styles/mapbox/streets-v12",
      center: [0, 0],
      zoom: 1.8,
      pitch: 0,
      bearing: 0,
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
        if (is3DMode.current && style.includes("standard")) {
          addTerrainOnly(map);
          map.easeTo({ pitch: 60, bearing: 30, duration: 1000 });
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

    addGeoJSONLayer: async (
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
        if (
          f.geometry.type === "MultiPolygon" ||
          f.geometry.type === "MultiLineString"
        ) {
          const exploded = turf.flatten(f);
          normalizedFeatures.push(...exploded.features);
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
      });
      const normalizedGeoJSON: GeoJSON.FeatureCollection = {
        type: "FeatureCollection",
        features: normalizedFeatures,
      };
      // Add GeoJSON source
      map.addSource(sourceId, { type: "geojson", data: normalizedGeoJSON });
      const beforeId = getTopSymbolLayerId(map);
      // Check which geometry types exist
      const hasPolygons = normalizedGeoJSON.features.some(
        (f) => f.geometry.type === "Polygon"
      );
      const hasLines = normalizedGeoJSON.features.some(
        (f) => f.geometry.type === "LineString"
      );
      const hasPoints = normalizedGeoJSON.features.some(
        (f) => f.geometry.type === "Point"
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
        map.fitBounds(bbox as [number, number, number, number], {
          padding: 40,
          duration: 1000,
        });
      } catch (err) {
        console.warn("Could not fit bounds:", err);
      }
    },
    getMap: () => mapInstance.current,
    getResourcesOnMap,
    flyToResource,
    onResourcesChanged,
    clearAllResources,
    drawAffectedAreas: (geojson: GeoJSON.FeatureCollection) => {
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

        // Add fill layer with semi-transparent red - NO beforeId = top layer
        map.addLayer({
          id: layerId,
          type: "fill",
          source: sourceId,
          paint: {
            "fill-color": "#FF0000",
            "fill-opacity": 0.35,
          },
        });

        // Add outline layer - NO beforeId = top layer
        map.addLayer({
          id: outlineLayerId,
          type: "line",
          source: sourceId,
          paint: {
            "line-color": "#FF0000",
            "line-width": 2.5,
            "line-opacity": 0.9,
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
    },

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

    clearAffectedAreas: () => {
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
    },
    getUploadedLayerData,

    // Add boundary layer using geoBoundaries API (free, CC-BY 4.0)
    addBoundaryLayer: async (
      countryCode: string,
      adminLevel: string,
      boundaryLabel?: string
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

      // Remove existing boundary layers
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

      // ISO2 to ISO3 mapping for geoBoundaries API
      // Complete ISO2 to ISO3 mapping for all countries
      const iso3Map: Record<string, string> = {
        AD: "AND",
        AE: "ARE",
        AF: "AFG",
        AG: "ATG",
        AI: "AIA",
        AL: "ALB",
        AM: "ARM",
        AO: "AGO",
        AQ: "ATA",
        AR: "ARG",
        AS: "ASM",
        AT: "AUT",
        AU: "AUS",
        AW: "ABW",
        AZ: "AZE",
        BA: "BIH",
        BB: "BRB",
        BD: "BGD",
        BE: "BEL",
        BF: "BFA",
        BG: "BGR",
        BH: "BHR",
        BI: "BDI",
        BJ: "BEN",
        BM: "BMU",
        BN: "BRN",
        BO: "BOL",
        BR: "BRA",
        BS: "BHS",
        BT: "BTN",
        BW: "BWA",
        BY: "BLR",
        BZ: "BLZ",
        CA: "CAN",
        CD: "COD",
        CF: "CAF",
        CG: "COG",
        CH: "CHE",
        CI: "CIV",
        CL: "CHL",
        CM: "CMR",
        CN: "CHN",
        CO: "COL",
        CR: "CRI",
        CU: "CUB",
        CV: "CPV",
        CY: "CYP",
        CZ: "CZE",
        DE: "DEU",
        DJ: "DJI",
        DK: "DNK",
        DM: "DMA",
        DO: "DOM",
        DZ: "DZA",
        EC: "ECU",
        EE: "EST",
        EG: "EGY",
        ER: "ERI",
        ES: "ESP",
        ET: "ETH",
        FI: "FIN",
        FJ: "FJI",
        FR: "FRA",
        GA: "GAB",
        GB: "GBR",
        GD: "GRD",
        GE: "GEO",
        GH: "GHA",
        GL: "GRL",
        GM: "GMB",
        GN: "GIN",
        GQ: "GNQ",
        GR: "GRC",
        GT: "GTM",
        GW: "GNB",
        GY: "GUY",
        HK: "HKG",
        HN: "HND",
        HR: "HRV",
        HT: "HTI",
        HU: "HUN",
        ID: "IDN",
        IE: "IRL",
        IL: "ISR",
        IN: "IND",
        IQ: "IRQ",
        IR: "IRN",
        IS: "ISL",
        IT: "ITA",
        JM: "JAM",
        JO: "JOR",
        JP: "JPN",
        KE: "KEN",
        KG: "KGZ",
        KH: "KHM",
        KM: "COM",
        KN: "KNA",
        KP: "PRK",
        KR: "KOR",
        KW: "KWT",
        KZ: "KAZ",
        LA: "LAO",
        LB: "LBN",
        LC: "LCA",
        LI: "LIE",
        LK: "LKA",
        LR: "LBR",
        LS: "LSO",
        LT: "LTU",
        LU: "LUX",
        LV: "LVA",
        LY: "LBY",
        MA: "MAR",
        MC: "MCO",
        MD: "MDA",
        ME: "MNE",
        MG: "MDG",
        MK: "MKD",
        ML: "MLI",
        MM: "MMR",
        MN: "MNG",
        MR: "MRT",
        MT: "MLT",
        MU: "MUS",
        MV: "MDV",
        MW: "MWI",
        MX: "MEX",
        MY: "MYS",
        MZ: "MOZ",
        NA: "NAM",
        NE: "NER",
        NG: "NGA",
        NI: "NIC",
        NL: "NLD",
        NO: "NOR",
        NP: "NPL",
        NZ: "NZL",
        OM: "OMN",
        PA: "PAN",
        PE: "PER",
        PG: "PNG",
        PH: "PHL",
        PK: "PAK",
        PL: "POL",
        PR: "PRI",
        PS: "PSE",
        PT: "PRT",
        PY: "PRY",
        QA: "QAT",
        RO: "ROU",
        RS: "SRB",
        RU: "RUS",
        RW: "RWA",
        SA: "SAU",
        SB: "SLB",
        SC: "SYC",
        SD: "SDN",
        SE: "SWE",
        SG: "SGP",
        SI: "SVN",
        SK: "SVK",
        SL: "SLE",
        SM: "SMR",
        SN: "SEN",
        SO: "SOM",
        SR: "SUR",
        SS: "SSD",
        ST: "STP",
        SV: "SLV",
        SY: "SYR",
        SZ: "SWZ",
        TD: "TCD",
        TG: "TGO",
        TH: "THA",
        TJ: "TJK",
        TL: "TLS",
        TM: "TKM",
        TN: "TUN",
        TO: "TON",
        TR: "TUR",
        TT: "TTO",
        TW: "TWN",
        TZ: "TZA",
        UA: "UKR",
        UG: "UGA",
        US: "USA",
        UY: "URY",
        UZ: "UZB",
        VA: "VAT",
        VC: "VCT",
        VE: "VEN",
        VN: "VNM",
        VU: "VUT",
        WS: "WSM",
        XK: "XKX",
        YE: "YEM",
        ZA: "ZAF",
        ZM: "ZMB",
        ZW: "ZWE",
      };

      const iso3 = iso3Map[countryCode];
      if (!iso3) {
        console.warn(`Unknown country code: ${countryCode}`);
        return;
      }

      try {
        console.log(`Fetching boundary for ${iso3} at ${gbAdminLevel}...`);

        // Helper function to try fetching with multiple CORS proxies
        const fetchWithProxy = async (url: string): Promise<Response> => {
          const proxies = [
            "https://corsproxy.io/?",
            "https://api.allorigins.win/raw?url=",
          ];

          for (const proxy of proxies) {
            try {
              const response = await fetch(proxy + encodeURIComponent(url));
              if (response.ok) {
                return response;
              }
            } catch (e) {
              console.warn(`Proxy ${proxy} failed, trying next...`);
            }
          }
          throw new Error("All CORS proxies failed");
        };

        // Step 1: Get the geoBoundaries API metadata
        const apiUrl = `https://www.geoboundaries.org/api/current/gbOpen/${iso3}/${gbAdminLevel}/`;

        console.log(`Fetching geoBoundaries metadata from: ${apiUrl}`);

        const metaResponse = await fetchWithProxy(apiUrl);

        // Read response as text first, then parse as JSON
        const metaText = await metaResponse.text();
        let metadata;
        try {
          metadata = JSON.parse(metaText);
        } catch (jsonError) {
          console.error(
            "Received non-JSON response:",
            metaText.substring(0, 200)
          );
          // Check if it's a 404 error
          if (metaText.includes("404") || metaText.includes("Not Found")) {
            throw new Error(
              `Boundary data not available for this country at ${gbAdminLevel}. Try a different admin level.`
            );
          }
          throw new Error(
            "API returned non-JSON response. The boundary data may not be available."
          );
        }

        if (!metadata || !metadata.simplifiedGeometryGeoJSON) {
          throw new Error("No boundary data available for this country/level");
        }

        // Use simplified geometry for faster loading (smaller file size)
        const geojsonUrl =
          metadata.simplifiedGeometryGeoJSON || metadata.gjDownloadURL;
        console.log(`Downloading GeoJSON from: ${geojsonUrl}`);

        // Step 2: Download the actual GeoJSON file
        const geojsonResponse = await fetchWithProxy(geojsonUrl);

        // Read response as text first, then parse as JSON
        const geojsonText = await geojsonResponse.text();
        let geojson: GeoJSON.FeatureCollection;
        try {
          geojson = JSON.parse(geojsonText);
        } catch (jsonError) {
          console.error(
            "Failed to parse GeoJSON response:",
            geojsonText.substring(0, 200)
          );
          throw new Error("GeoJSON download returned invalid JSON.");
        }

        if (!geojson || !geojson.features || geojson.features.length === 0) {
          throw new Error("Empty GeoJSON data");
        }

        console.log(`Loaded ${geojson.features.length} boundary features`);

        // Generate unique IDs for features if they don't have them
        geojson.features.forEach((feature, index) => {
          if (!feature.id) {
            feature.id = index;
          }
        });

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

          // Get the boundary name - geoBoundaries uses shapeName field
          const boundaryName =
            props.shapeName || props.name || props.NAME || "Unknown";

          // Extract the specific boundary type from the label (e.g., "By province (Admin Level 1)" -> "Province")
          let typeLabel = "Boundary";
          if (boundaryLabel) {
            // Parse "By province (Admin Level 1)" to get "Province"
            const match = boundaryLabel.match(/^By\s+(.+?)\s*\(/i);
            if (match) {
              typeLabel =
                match[1].charAt(0).toUpperCase() +
                match[1].slice(1).toLowerCase();
            } else if (boundaryLabel.includes("Country")) {
              typeLabel = "Country";
            }
          }

          // Get admin level display (e.g., "Admin Level 1")
          const adminLevelDisplay = gbAdminLevel.replace("ADM", "Admin Level ");

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
                  Administrative Level
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

        console.log(`Added boundary layer for ${iso3} at ${gbAdminLevel}`);
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
