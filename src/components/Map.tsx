"use client";

import { useRef, useEffect, forwardRef, useImperativeHandle } from "react";
import mapboxgl from "mapbox-gl";

mapboxgl.accessToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN!;

const MapComponent = forwardRef(function MapComponent(_, ref) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const mapInstance = useRef<mapboxgl.Map | null>(null);

  useEffect(() => {
    if (!mapContainer.current) return;

    mapInstance.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: "mapbox://styles/mapbox/streets-v12",
      center: [0, 0], // World center
      zoom: 2.5, // Zoomed out
    });

    return () => mapInstance.current?.remove();
  }, []);

  useImperativeHandle(ref, () => ({
    flyTo: (options: { center: [number, number]; zoom?: number }) => {
      mapInstance.current?.flyTo(options);
    },
    getZoom: () => {
      return mapInstance.current?.getZoom?.() ?? 0;
    },
  }));

  return (
    <div ref={mapContainer} className="fixed top-0 left-0 w-screen h-screen" />
  );
});

export default MapComponent;
