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
  const latestRoutesGeoJSON = useRef<GeoJSON.FeatureCollection | null>(null);

  useEffect(() => {
    if (!mapContainer.current) return;

    mapInstance.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: "mapbox://styles/mapbox/streets-v12",
      center: [0, 0],
      zoom: 2.5,
      pitch: 0,
      bearing: 0,
      antialias: true,
    });

    return () => {
      mapInstance.current?.remove();
      locationMarkerRef.current?.remove();
      startMarkerRef.current?.remove();
      destinationMarkerRef.current?.remove();
    };
  }, []);

  const locationMarkerRef = useRef<mapboxgl.Marker | null>(null);
  const startMarkerRef = useRef<mapboxgl.Marker | null>(null);
  const destinationMarkerRef = useRef<mapboxgl.Marker | null>(null);

  const reDrawRoutesIfAny = () => {
    if (latestRoutesGeoJSON.current && mapInstance.current) {
      setTimeout(() => {
        drawRoutes(latestRoutesGeoJSON.current!);
      }, 300); // slight delay ensures style is fully ready
    }
  };

  const drawRoutes = (geojson: GeoJSON.FeatureCollection) => {
    const map = mapInstance.current;
    if (!map) return;

    latestRoutesGeoJSON.current = geojson;

    // Remove old routes
    const layers = map.getStyle().layers;
    layers?.forEach((layer) => {
      if (layer.id.startsWith("route-")) {
        if (map.getLayer(layer.id)) map.removeLayer(layer.id);
        if (map.getSource(layer.id)) map.removeSource(layer.id);
      }
    });

    geojson.features.forEach((feature, index) => {
      const id = `route-${index}`;

      map.addSource(id, {
        type: "geojson",
        data: {
          type: "FeatureCollection",
          features: [feature],
        },
      });

      // White outline (bottom layer)
      map.addLayer({
        id: `${id}-outline`,
        type: "line",
        source: id,
        layout: {
          "line-join": "round",
          "line-cap": "round",
        },
        paint: {
          "line-color": "#9699FF",
          "line-width": 10, // Increased outline thickness
          "line-opacity": 0.9,
        },
      });

      // Colored route (top layer)
      map.addLayer({
        id,
        type: "line",
        source: id,
        layout: {
          "line-join": "round",
          "line-cap": "round",
        },
        paint: {
          "line-color": "#ffffff", // original color
          "line-width": 6, // Increased line width (from 4)
          "line-opacity": 0.85,
        },
      });
    });
  };

  useImperativeHandle(ref, () => ({
    flyTo: (opts: FlyToOptions) => {
      mapInstance.current?.flyTo(opts);
    },

    addLocationMarker: (lng: number, lat: number) => {
      if (!mapInstance.current) return;

      startMarkerRef.current?.remove();
      startMarkerRef.current = null;

      locationMarkerRef.current?.remove();

      const marker = new mapboxgl.Marker({ color: "#9699FF" })
        .setLngLat([lng, lat])
        .addTo(mapInstance.current);

      locationMarkerRef.current = marker;
    },

    addStartMarker: (lng: number, lat: number) => {
      if (!mapInstance.current) return;

      locationMarkerRef.current?.remove();
      locationMarkerRef.current = null;

      startMarkerRef.current?.remove();

      const marker = new mapboxgl.Marker({ color: "#00FF00" })
        .setLngLat([lng, lat])
        .addTo(mapInstance.current);

      startMarkerRef.current = marker;
    },

    addDestinationMarker: (lng: number, lat: number) => {
      if (!mapInstance.current) return;

      destinationMarkerRef.current?.remove();

      const marker = new mapboxgl.Marker({ color: "#FF4C4C" })
        .setLngLat([lng, lat])
        .addTo(mapInstance.current);

      destinationMarkerRef.current = marker;
    },

    fitBoundsToMarkers: () => {
      if (
        !mapInstance.current ||
        !startMarkerRef.current ||
        !destinationMarkerRef.current
      )
        return;

      const bounds = new mapboxgl.LngLatBounds();

      const startLngLat = startMarkerRef.current.getLngLat();
      const destinationLngLat = destinationMarkerRef.current.getLngLat();

      bounds.extend([startLngLat.lng, startLngLat.lat]);
      bounds.extend([destinationLngLat.lng, destinationLngLat.lat]);

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
      if (!map || !is3DMode.current) return;

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
        reDrawRoutesIfAny();
      });
    },

    switchTo3D: (label: string) => {
      const map = mapInstance.current;
      if (!map || is3DMode.current) return;

      is3DMode.current = true;

      let style = "mapbox://styles/mapbox/standard";
      if (label === "Satellite") {
        style = "mapbox://styles/mapbox/standard-satellite";
      }

      map.setStyle(style);

      map.once("style.load", () => {
        addTerrainOnly(map);
        map.easeTo({ pitch: 60, bearing: 30, duration: 1000 });
        reDrawRoutesIfAny();
      });
    },

    setLightPreset: (preset: "dawn" | "day" | "dusk" | "night") => {
      const map = mapInstance.current;
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
        reDrawRoutesIfAny();
      });
    },

    drawRoutes,

    drawEarthquakeDots: (features: any[]) => {
      const map = mapInstance.current;
      if (!map) return;

      // Remove old markers
      document.querySelectorAll(".earthquake-dot").forEach((el) => el.remove());

      features.forEach((feature) => {
        const [lng, lat] = feature.geometry.coordinates;
        const { mag, place, time } = feature.properties;

        const el = document.createElement("div");
        el.className = "earthquake-dot";
        const size = Math.max(8, mag * 4); // minimum size 8px, scales with magnitude
        el.style.width = `${size}px`;
        el.style.height = `${size}px`;

        el.style.borderRadius = "50%";
        el.style.backgroundColor = "red";
        el.style.border = "2px solid white";
        el.style.cursor = "pointer";
        el.style.boxShadow = "0 0 4px white";

        const popup = new mapboxgl.Popup({
          offset: [0, -size / 2], // offset upward based on marker size
          closeButton: true,
          closeOnClick: false,
          className: "earthquake-popup", // optional for extra styling
        }).setHTML(`
  <div style="min-width: 160px;">
    <strong>${place}</strong><br/>
    <span>Magnitude: ${mag}</span><br/>
    <span>${new Date(time).toLocaleString()}</span>
  </div>
`);

        new mapboxgl.Marker(el)
          .setLngLat([lng, lat])
          .setPopup(popup)
          .addTo(map);
      });
    },
  }));

  return (
    <div ref={mapContainer} className="fixed top-0 left-0 w-screen h-screen" />
  );
});

export default MapComponent;

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
