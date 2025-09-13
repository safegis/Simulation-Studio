"use client";

import mapboxgl from "mapbox-gl";
import { drawRoutes as drawRoutesHelper } from "../Markers/Pathfinder/RouteLines";
import { drawVolcanoDots as drawVolcanoDotsHelper } from "../Markers/Hazard Map/VolcanoListMarker";
import { drawEarthquakeDots as drawEarthquakeDotsHelper } from "../Markers/Hazard Map/EarthquakeMarker";
import { drawActiveFaults as drawActiveFaultsHelper } from "../Markers/Hazard Map/ActiveFaultsMarker";

export const switchTo3D = (
  label: string,
  mapInstance: React.RefObject<mapboxgl.Map | null>,
  mapIsLoaded: React.RefObject<boolean>,
  is3DMode: React.RefObject<boolean>,
  latestRoutesGeoJSON: React.RefObject<GeoJSON.FeatureCollection | null>,
  latestVolcanoes: React.RefObject<any[]>,
  latestEarthquakes: React.RefObject<any[]>,
  latestActiveFaults: React.RefObject<GeoJSON.FeatureCollection | null>,
  selectedFeatureIndexRef: React.RefObject<number | null>,
  getTopSymbolLayerId: (map: mapboxgl.Map) => string | undefined,
  addTerrainOnly: (map: mapboxgl.Map) => void
) => {
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
