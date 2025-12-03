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
