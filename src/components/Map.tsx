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
  const mapIsLoaded = useRef<boolean>(false);
  const is3DMode = useRef<boolean>(false);
  const latestRoutesGeoJSON = useRef<GeoJSON.FeatureCollection | null>(null);
  const latestVolcanoes = useRef<any[]>([]);
  const latestEarthquakes = useRef<any[]>([]);

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
    });

    return () => {
      map.remove();
      mapIsLoaded.current = false;
      locationMarkerRef.current?.remove();
      startMarkerRef.current?.remove();
      destinationMarkerRef.current?.remove();
    };
  }, []);

  const drawVolcanoDots = (volcanoes: any[]) => {
    const map = mapInstance.current;
    if (!map || !mapIsLoaded.current) return;

    latestVolcanoes.current = volcanoes;

    const sourceId = "volcanoes";
    const layerId = "volcanoes-layer";

    if (map.getLayer(layerId)) map.removeLayer(layerId);
    if (map.getSource(sourceId)) map.removeSource(sourceId);

    const geojson: GeoJSON.FeatureCollection = {
      type: "FeatureCollection",
      features: volcanoes.map((v) => ({
        type: "Feature",
        properties: {
          name: v.vName,
          country: v.country,
          elevation: v.elevation_m,
        },
        geometry: {
          type: "Point",
          coordinates: [v.longitude, v.latitude],
        },
      })),
    };

    map.addSource(sourceId, { type: "geojson", data: geojson });

    map.addLayer({
      id: layerId,
      type: "circle",
      source: sourceId,
      paint: {
        "circle-radius": 6,
        "circle-color": "orange",
        "circle-stroke-width": 2,
        "circle-stroke-color": "white",
      },
    });

    map.on("click", layerId, (e) => {
      const props = e.features?.[0].properties!;
      const popupHTML = `
        <div style="min-width: 180px;">
          <strong>${props.name}</strong><br/>
          <span>Country: ${props.country}</span><br/>
          <span>Elevation: ${props.elevation} m</span>
        </div>
      `;
      new mapboxgl.Popup().setLngLat(e.lngLat).setHTML(popupHTML).addTo(map);
    });

    map.on("mouseenter", layerId, () => {
      map.getCanvas().style.cursor = "pointer";
    });
    map.on("mouseleave", layerId, () => {
      map.getCanvas().style.cursor = "";
    });
  };

  const drawEarthquakeDots = (features: any[]) => {
    const map = mapInstance.current;
    if (!map || !mapIsLoaded.current) return;

    latestEarthquakes.current = features;

    const sourceId = "earthquakes";
    const layerId = "earthquakes-layer";

    if (map.getLayer(layerId)) map.removeLayer(layerId);
    if (map.getSource(sourceId)) map.removeSource(sourceId);

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

    map.addSource(sourceId, { type: "geojson", data: geojson });

    map.addLayer({
      id: layerId,
      type: "circle",
      source: sourceId,
      paint: {
        "circle-radius": [
          "interpolate",
          ["linear"],
          ["get", "mag"],
          0,
          6,
          8,
          18,
        ],
        "circle-color": "red",
        "circle-stroke-width": 2,
        "circle-stroke-color": "white",
      },
    });

    map.on("click", layerId, (e) => {
      const props = e.features?.[0].properties!;
      const popupHTML = `
        <div style="min-width: 160px;">
          <strong>${props.place}</strong><br/>
          <span>Magnitude: ${props.mag}</span><br/>
          <span>Depth: ${Number(props.depth).toFixed(1)} km</span><br/>
          <span>${new Date(Number(props.time)).toLocaleString()}</span>
        </div>
      `;
      new mapboxgl.Popup().setLngLat(e.lngLat).setHTML(popupHTML).addTo(map);
    });

    map.on("mouseenter", layerId, () => {
      map.getCanvas().style.cursor = "pointer";
    });
    map.on("mouseleave", layerId, () => {
      map.getCanvas().style.cursor = "";
    });
  };

  const reDrawRoutesIfAny = () => {
    if (latestRoutesGeoJSON.current && mapInstance.current) {
      setTimeout(() => {
        drawRoutes(latestRoutesGeoJSON.current!);
      }, 300);
    }
  };

  const reDrawVolcanoesAndQuakes = () => {
    if (latestVolcanoes.current.length > 0) {
      drawVolcanoDots(latestVolcanoes.current);
    }
    if (latestEarthquakes.current.length > 0) {
      drawEarthquakeDots(latestEarthquakes.current);
    }
  };

  const drawRoutes = (geojson: GeoJSON.FeatureCollection) => {
    const map = mapInstance.current;
    if (!map || !mapIsLoaded.current) return;

    latestRoutesGeoJSON.current = geojson;

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
          "line-width": 10,
          "line-opacity": 0.9,
        },
      });

      map.addLayer({
        id,
        type: "line",
        source: id,
        layout: {
          "line-join": "round",
          "line-cap": "round",
        },
        paint: {
          "line-color": "#ffffff",
          "line-width": 6,
          "line-opacity": 0.85,
        },
      });
    });
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
      bounds.extend(startMarkerRef.current.getLngLat().toArray());
      bounds.extend(destinationMarkerRef.current.getLngLat().toArray());

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
        reDrawRoutesIfAny();
        reDrawVolcanoesAndQuakes();
      });
    },

    switchTo3D: (label: string) => {
      const map = mapInstance.current;
      if (!map || !mapIsLoaded.current || is3DMode.current) return;
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
        reDrawVolcanoesAndQuakes();
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
        reDrawRoutesIfAny();
        reDrawVolcanoesAndQuakes();
      });
    },

    drawRoutes,
    drawVolcanoDots,
    drawEarthquakeDots,
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
