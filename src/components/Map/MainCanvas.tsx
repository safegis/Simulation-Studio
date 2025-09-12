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
import { Users, ShoppingBasket, Building } from "lucide-react";
import ReactDOMServer from "react-dom/server";
import { drawVolcanoDots as drawVolcanoDotsHelper } from "./Markers/Hazard Map/VolcanoListMarker";
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
  drawHealthFacilities as drawHealthFacilitiesHelper,
  clearHealthFacilities as clearHealthFacilitiesHelper,
  useHealthFacilitiesRestore,
} from "./Markers/Critical Facility Map/HealthFacilitiesMarker";

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
  const healthPopupRef = useRef<mapboxgl.Popup | null>(null);

  // --- use the custom hook to restore health facility markers after style change ---
  useHealthFacilitiesRestore(mapInstance, mapIsLoaded);

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
  // NEW: bring the route-<i>-outline and route-<i> layers to the top of the layer stack
  const bringRouteToFront = (featureIndex: number | null) => {
    const map = mapInstance.current;
    if (!map || featureIndex === null) return;
    const routeId = `route-${featureIndex}`;
    const outlineId = `${routeId}-outline`;
    try {
      // Move outline first, then inner line — moving without the 'beforeId' param
      // will place the layer at the top of the stack.
      if (map.getLayer(outlineId)) map.moveLayer(outlineId);
    } catch (e) {
      // ignore - may happen if layer not yet added
    }
    try {
      if (map.getLayer(routeId)) map.moveLayer(routeId);
    } catch (e) {
      // ignore
    }
  };
  const locationMarkerRef = useRef<mapboxgl.Marker | null>(null);
  const startMarkerRef = useRef<mapboxgl.Marker | null>(null);
  const destinationMarkerRef = useRef<mapboxgl.Marker | null>(null);
  useEffect(() => {
    if (!mapContainer.current) return;
    const map = new mapboxgl.Map({
      container: mapContainer.current,
      style: "mapbox://styles/mapbox/streets-v12",
      center: [0, 0],
      zoom: 2.5,
      pitch: 0,
      bearing: 0,
      antialias: true,
    });
    mapInstance.current = map;
    map.on("load", () => {
      mapIsLoaded.current = true;
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
  const drawRoutes = (geojson: GeoJSON.FeatureCollection) => {
    const map = mapInstance.current;
    if (!map || !mapIsLoaded.current) return;
    latestRoutesGeoJSON.current = geojson;
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
        beforeId // ensure above roads/labels
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
      bringRouteToFront(selectedFeatureIndexRef.current);
    }
  };

  const resourceMarkersRef = useRef<
    {
      id: string;
      type: string;
      marker: mapboxgl.Marker;
      data: { name: string; description: string };
      coords: mapboxgl.LngLat;
    }[]
  >([]);
  const resourceListenersRef = useRef<((resources: any[]) => void)[]>([]);
  const notifyResourcesChanged = () => {
    const snapshot = resourceMarkersRef.current.map((r) => ({
      id: r.id,
      type: r.type,
      data: r.data,
      coords: r.marker.getLngLat(), // include live coords
    }));
    resourceListenersRef.current.forEach((cb) => cb(snapshot));
  };
  const addResourceMarker = (
    lngLat: mapboxgl.LngLat,
    type: string,
    initialData?: { name: string; description: string }
  ) => {
    const id = `${type}-${Date.now()}`;
    let icon;
    let borderColor = "black"; // default border

    // Pick icon + color based on resource type
    switch (type) {
      case "personnel":
        icon = <Users size={20} color="red" />;
        borderColor = "red";
        break;
      case "infrastructure":
        icon = <Building size={20} color="green" />;
        borderColor = "green";
        break;
      case "supplies":
        icon = <ShoppingBasket size={20} color="blue" />;
        borderColor = "blue";
        break;
      default:
        icon = <Users size={20} />;
    }

    // ✅ Wrap icon inside white circle with colored border
    const markerWrapper = (
      <div
        style={{
          backgroundColor: "white",
          borderRadius: "50%",
          width: "38px",
          height: "38px",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          border: `2px solid ${borderColor}`,
          boxShadow: "0 0 4px rgba(0,0,0,0.3)",
        }}
      >
        {icon}
      </div>
    );

    // Create DOM element for marker
    const el = document.createElement("div");
    el.innerHTML = ReactDOMServer.renderToString(markerWrapper);

    // Create marker
    const marker = new mapboxgl.Marker({ element: el, draggable: true })
      .setLngLat(lngLat)
      .addTo(mapInstance.current!);

    // Default resource details
    let resourceData = {
      type,
      name: initialData?.name ?? type.charAt(0).toUpperCase() + type.slice(1),
      description: initialData?.description ?? "",
    };

    // Create popup HTML with editable form
    const createPopupHTML = () => `
    <div style="min-width:200px;">
      <strong>Edit Resource</strong>
      <div style="margin-top:8px;">
        <label>Name:</label><br/>
        <input type="text" id="res-name" value="${resourceData.name}" style="width:100%; margin-bottom:6px;"/>
        <label>Description:</label><br/>
        <textarea id="res-desc" rows="3" style="width:100%;">${resourceData.description}</textarea>
      </div>
      <div style="margin-top:10px; display:flex; justify-content:space-between;">
        <button id="save-btn" style="background:#5A5C99; color:white; padding:4px 8px; border-radius:4px;">Save</button>
        <button id="delete-btn" style="background:#B33A3A; color:white; padding:4px 8px; border-radius:4px;">Delete</button>
      </div>
    </div>
  `;

    const popup = new mapboxgl.Popup({ offset: 25 })
      .setLngLat(lngLat)
      .setHTML(createPopupHTML());

    // Attach popup to marker
    marker.setPopup(popup);

    // Resource object stored in ref
    const resourceObj = {
      id,
      type,
      marker,
      data: resourceData,
      coords: lngLat,
    };

    // Event: When popup opens, attach listeners to Save/Delete
    marker.getElement().addEventListener("click", () => {
      setTimeout(() => {
        const saveBtn = document.getElementById("save-btn");
        const deleteBtn = document.getElementById("delete-btn");
        const nameInput = document.getElementById(
          "res-name"
        ) as HTMLInputElement;
        const descInput = document.getElementById(
          "res-desc"
        ) as HTMLTextAreaElement;

        if (saveBtn) {
          saveBtn.onclick = () => {
            resourceData.name = nameInput.value;
            resourceData.description = descInput.value;
            popup.setHTML(createPopupHTML()); // refresh popup with updated values
            notifyResourcesChanged();
          };
        }

        if (deleteBtn) {
          deleteBtn.onclick = () => {
            marker.remove();
            popup.remove();
            resourceMarkersRef.current = resourceMarkersRef.current.filter(
              (r) => r.marker !== marker
            );
            notifyResourcesChanged();
          };
        }
      }, 50); // allow popup to render before attaching events
    });

    // Update coordinates when marker is dragged
    marker.on("dragend", () => {
      const newPos = marker.getLngLat();
      resourceObj.coords = newPos; // update coords in object
      notifyResourcesChanged(); // refresh UI instantly
    });

    // Add to resources list
    resourceMarkersRef.current.push(resourceObj);
    notifyResourcesChanged();
  };

  const clearAllResources = () => {
    resourceMarkersRef.current.forEach((r) => {
      r.marker.remove();
    });
    resourceMarkersRef.current = [];
    notifyResourcesChanged();
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

    switchTo2D: (label: string) => {
      const map = mapInstance.current;
      if (!map || !mapIsLoaded.current || !is3DMode.current) return;
      is3DMode.current = false;
      let style = "mapbox://styles/mapbox/streets-v12";
      switch (label) {
        case "Satellite":
          style = "mapbox://styles/mapbox/standard-satellite";
          break;
        case "Outdoors":
          style = "mapbox://styles/mapbox/outdoors-v12";
          break;
        case "Light":
          style = "mapbox://styles/mapbox/light-v11";
          break;
        case "Dark":
          style = "mapbox://styles/mapbox/dark-v11";
          break;
        case "Navigation (Day)":
          style = "mapbox://styles/mapbox/navigation-day-v1";
          break;
        case "Navigation (Night)":
          style = "mapbox://styles/mapbox/navigation-night-v1";
          break;
      }
      map.setStyle(style);
      map.once("style.load", () => {
        map.setTerrain(null);
        map.easeTo({ pitch: 0, bearing: 0, duration: 800 });
        // Call draw functions only here with stored data
        if (latestRoutesGeoJSON.current)
          drawRoutes(latestRoutesGeoJSON.current);
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
      });
    },
    switchTo3D: (label: string) => {
      const map = mapInstance.current;
      if (!map || !mapIsLoaded.current || is3DMode.current) return;
      is3DMode.current = true;
      let style = "mapbox://styles/shain34/cmesokqei00z501sdedixesto";
      if (label === "Satellite") {
        style = "mapbox://styles/mapbox/standard-satellite";
      }
      map.setStyle(style);
      map.once("style.load", () => {
        addTerrainOnly(map);
        map.easeTo({ pitch: 60, bearing: 30, duration: 1000 });
        // Call draw functions only here with stored data
        if (latestRoutesGeoJSON.current)
          drawRoutes(latestRoutesGeoJSON.current);
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
      });
    },
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
          drawRoutes(latestRoutesGeoJSON.current);
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
      });
    },
    drawRoutes,
    // new: highlight by geojson feature index (the same index drawRoutes used)
    highlightRouteByFeatureIndex: (featureIndex: number | null) => {
      const map = mapInstance.current;
      selectedFeatureIndexRef.current = featureIndex;
      if (!map || !mapIsLoaded.current) return;
      try {
        // set each inner route layer to white except the selected featureIndex -> purple
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
          } catch (e) {
            // ignore missing layers / race conditions
          }
        });
        // NEW: bring selected route layers to top so they're not visually occluded
        if (featureIndex !== null) {
          bringRouteToFront(featureIndex);
        }
      } catch (e) {
        console.warn("highlightRouteByFeatureIndex failed", e);
      }
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
      boundsListenersRef.current.add(cb);
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
    unregisterBoundsListener: (
      cb: (bbox: [number, number, number, number]) => void
    ) => {
      boundsListenersRef.current.delete(cb);
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
      });
      const attachPopup = (layerId: string) => {
        map.on("click", layerId, (e) => {
          if (!e.features || e.features.length === 0) return;
          const feature = e.features[0];
          const props = feature.properties || {};
          let html = "<div class='text-sm'>";
          for (const key in props) {
            html += `<strong>${key}:</strong> ${props[key]}<br/>`;
          }
          html += "</div>";
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
    getResourcesOnMap: () => resourceMarkersRef.current,
    flyToResource: (id: string) => {
      const res = resourceMarkersRef.current.find((r) => r.id === id);
      if (res) {
        mapInstance.current?.flyTo({
          center: res.marker.getLngLat(),
          zoom: 14,
        });
        res.marker.togglePopup();
      }
    },
    onResourcesChanged: (cb: (resources: any[]) => void) => {
      resourceListenersRef.current.push(cb);
    },
    clearAllResources,
  }));
  return (
    <>
      <div
        ref={mapContainer}
        className="fixed top-0 left-0 w-screen h-screen z-0"
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
