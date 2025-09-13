"use client";

import mapboxgl from "mapbox-gl";
import { drawRoutes as drawRoutesHelper } from "../Markers/Pathfinder/RouteLines";
import { drawVolcanoDots as drawVolcanoDotsHelper } from "../Markers/Hazard Map/VolcanoListMarker";
import { drawEarthquakeDots as drawEarthquakeDotsHelper } from "../Markers/Hazard Map/EarthquakeMarker";
import { drawActiveFaults as drawActiveFaultsHelper } from "../Markers/Hazard Map/ActiveFaultsMarker";

export const switchTo2D = (
  label: string, // 👈 now properly declared here
  mapInstance: React.RefObject<mapboxgl.Map | null>,
  mapIsLoaded: React.RefObject<boolean>,
  is3DMode: React.RefObject<boolean>,
  latestRoutesGeoJSON: React.RefObject<GeoJSON.FeatureCollection | null>,
  latestVolcanoes: React.RefObject<any[]>,
  latestEarthquakes: React.RefObject<any[]>,
  latestActiveFaults: React.RefObject<GeoJSON.FeatureCollection | null>,
  selectedFeatureIndexRef: React.RefObject<number | null>,
  getTopSymbolLayerId: (map: mapboxgl.Map) => string | undefined
) => {
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
  });
};
