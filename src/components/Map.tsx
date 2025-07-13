"use client";

import { useRef, useEffect, forwardRef, useImperativeHandle } from "react";
import mapboxgl from "mapbox-gl";

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
      style: "mapbox://styles/mapbox/streets-v12", // Default flat 2D
      center: [0, 0],
      zoom: 2.5,
      pitch: 0,
      bearing: 0,
      antialias: true,
    });

    return () => mapInstance.current?.remove();
  }, []);

  useImperativeHandle(ref, () => ({
    flyTo: (opts: FlyToOptions) => {
      mapInstance.current?.flyTo(opts);
    },
    getZoom: () => {
      return mapInstance.current?.getZoom?.() ?? 0;
    },
    switchTo2D: () => {
      const map = mapInstance.current;
      if (!map || !is3DMode.current) return;

      is3DMode.current = false;

      // Switch to flat 2D style
      map.setStyle("mapbox://styles/mapbox/streets-v12");

      map.once("style.load", () => {
        map.easeTo({ pitch: 0, bearing: 0, duration: 800 });
      });
    },
    switchTo3D: () => {
      const map = mapInstance.current;
      if (!map || is3DMode.current) return;

      is3DMode.current = true;

      // Switch to 3D-ready style
      map.setStyle("mapbox://styles/mapbox/standard");

      map.once("style.load", () => {
        // Enable 3D terrain
        map.addSource("mapbox-dem", {
          type: "raster-dem",
          url: "mapbox://mapbox.terrain-rgb",
          tileSize: 512,
          maxzoom: 14,
        });

        map.setTerrain({ source: "mapbox-dem", exaggeration: 1.3 });

        // Fly into a 3D view
        map.easeTo({ pitch: 60, bearing: 30, duration: 1000 });
      });
    },
  }));

  return (
    <div ref={mapContainer} className="fixed top-0 left-0 w-screen h-screen" />
  );
});

export default MapComponent;
