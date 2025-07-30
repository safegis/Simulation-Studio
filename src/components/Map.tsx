"use client";

import { useRef, useEffect, forwardRef, useImperativeHandle } from "react";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";

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
  const is3DMode = useRef<boolean>(false);

  useEffect(() => {
    if (!mapContainer.current) return;

    mapInstance.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: "mapbox://styles/mapbox/streets-v12", // Default 2D style
      center: [0, 0],
      zoom: 2.5,
      pitch: 0,
      bearing: 0,
      antialias: true,
    });

    return () => mapInstance.current?.remove();
  }, []);

  const locationMarkerRef = useRef<mapboxgl.Marker | null>(null);
  const startMarkerRef = useRef<mapboxgl.Marker | null>(null);

  useImperativeHandle(ref, () => ({
    flyTo: (opts: FlyToOptions) => {
      mapInstance.current?.flyTo(opts);
    },

    addLocationMarker: (lng: number, lat: number) => {
      if (!mapInstance.current) return;

      // 🔥 Remove the start marker if it exists
      startMarkerRef.current?.remove();
      startMarkerRef.current = null;

      // 🔄 Remove old location marker
      locationMarkerRef.current?.remove();

      // ➕ Add new location marker (blue)
      const marker = new mapboxgl.Marker({ color: "#9699FF" })
        .setLngLat([lng, lat])
        .addTo(mapInstance.current);

      locationMarkerRef.current = marker;
    },

    addStartMarker: (lng: number, lat: number) => {
      if (!mapInstance.current) return;

      // 🔥 Remove the location marker if it exists
      locationMarkerRef.current?.remove();
      locationMarkerRef.current = null;

      // 🔄 Remove old start marker
      startMarkerRef.current?.remove();

      // ➕ Add new start marker (green)
      const marker = new mapboxgl.Marker({ color: "#00FF00" })
        .setLngLat([lng, lat])
        .addTo(mapInstance.current);

      startMarkerRef.current = marker;
    },

    getZoom: () => {
      return mapInstance.current?.getZoom?.() ?? 0;
    },
    switchTo2D: (label: string) => {
      const map = mapInstance.current;
      if (!map || !is3DMode.current) return;

      is3DMode.current = false;

      let style = "mapbox://styles/mapbox/streets-v12"; // fallback

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
        case "Default":
        default:
          style = "mapbox://styles/mapbox/streets-v12";
          break;
      }

      map.setStyle(style);

      map.once("style.load", () => {
        map.setTerrain(null);
        map.easeTo({ pitch: 0, bearing: 0, duration: 800 });
      });
    },

    switchTo3D: (label: string) => {
      const map = mapInstance.current;
      if (!map || is3DMode.current) return;

      is3DMode.current = true;

      let style = "mapbox://styles/mapbox/standard"; // fallback

      switch (label) {
        case "Satellite":
          style = "mapbox://styles/mapbox/standard-satellite";
          break;
        default:
          style = "mapbox://styles/mapbox/standard";
          break;
      }

      map.setStyle(style);

      map.once("style.load", () => {
        addTerrainOnly(map);
        map.easeTo({ pitch: 60, bearing: 30, duration: 1000 });
      });
    },

    setLightPreset: (preset: "dawn" | "day" | "dusk" | "night") => {
      const map = mapInstance.current;

      // ✅ Only apply lighting preset in 3D mode
      if (!map || !is3DMode.current) return;

      try {
        map.setConfigProperty("basemap", "lightPreset", preset);
      } catch (e) {
        console.warn("Failed to set light preset:", e);
      }
    },

    setMapStyle: (style: string) => {
      const map = mapInstance.current;
      if (!map) return;

      map.setStyle(style);

      map.once("style.load", () => {
        if (is3DMode.current && style.includes("standard")) {
          addTerrainOnly(map);
          map.easeTo({ pitch: 60, bearing: 30, duration: 1000 });
        } else {
          map.setTerrain(null);
          map.easeTo({ pitch: 0, bearing: 0, duration: 800 });
        }
      });
    },
  }));

  return (
    <div ref={mapContainer} className="fixed top-0 left-0 w-screen h-screen" />
  );
});

export default MapComponent;

// ✅ Terrain only (no 3D buildings)
const addTerrainOnly = (map: mapboxgl.Map) => {
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
