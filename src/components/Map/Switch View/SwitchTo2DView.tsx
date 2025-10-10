// \SafeGIS\Simulation-Studio\frontend\src\components\Map\Switch View\SwitchTo2DView.tsx
"use client";

import mapboxgl from "mapbox-gl";
import { drawRoutes as drawRoutesHelper } from "../Markers/Pathfinder/RouteLines";
import { drawVolcanoDots as drawVolcanoDotsHelper } from "../Markers/Hazard Map/VolcanoListMarker";
import { drawEarthquakeDots as drawEarthquakeDotsHelper } from "../Markers/Hazard Map/EarthquakeMarker";
import { drawActiveFaults as drawActiveFaultsHelper } from "../Markers/Hazard Map/ActiveFaultsMarker";
import { drawFloodHazard as drawFloodHazardHelper } from "../Markers/Hazard Map/FloodHazardMarker";

export const switchTo2D = (
  label: string,
  mapInstance: React.RefObject<mapboxgl.Map | null>,
  mapIsLoaded: React.RefObject<boolean>,
  is3DMode: React.RefObject<boolean>,
  latestRoutesGeoJSON: React.RefObject<GeoJSON.FeatureCollection | null>,
  latestVolcanoes: React.RefObject<any[]>,
  latestEarthquakes: React.RefObject<any[]>,
  latestActiveFaults: React.RefObject<GeoJSON.FeatureCollection | null>,
  latestFloodHazards: React.RefObject<
    Array<{ geojsonUrl: string; returnPeriod: string; provinceName: string }>
  >,
  selectedFeatureIndexRef: React.RefObject<number | null>,
  getTopSymbolLayerId: (map: mapboxgl.Map) => string | undefined
) => {
  const map = mapInstance.current;
  if (!map || !mapIsLoaded.current || !is3DMode.current) return;
  is3DMode.current = false;

  let style = "mapbox://styles/mapbox/streets-v12";
  switch (label) {
    case "Satellite (Mapbox)":
      style = "mapbox://styles/mapbox/standard-satellite";
      break;
    case "Outdoors (Mapbox)":
      style = "mapbox://styles/mapbox/outdoors-v12";
      break;
    case "Light (Mapbox)":
      style = "mapbox://styles/mapbox/light-v11";
      break;
    case "Dark (Mapbox)":
      style = "mapbox://styles/mapbox/dark-v11";
      break;
    case "Navigation Day (Mapbox)":
      style = "mapbox://styles/mapbox/navigation-day-v1";
      break;
    case "Navigation Night (Mapbox)":
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
};
