// \SafeGIS\Simulation-Studio\frontend\src\components\Map\Switch View\SwitchTo3DView.tsx
"use client";

import mapboxgl from "mapbox-gl";
import { drawRoutes as drawRoutesHelper } from "../Markers/Pathfinder/RouteLines";
import { drawVolcanoDots as drawVolcanoDotsHelper } from "../Markers/Hazard Map/VolcanoListMarker";
import { drawEarthquakeDots as drawEarthquakeDotsHelper } from "../Markers/Hazard Map/EarthquakeMarker";
import { drawActiveFaults as drawActiveFaultsHelper } from "../Markers/Hazard Map/ActiveFaultsMarker";
import { drawFloodHazard as drawFloodHazardHelper } from "../Markers/Hazard Map/FloodHazardMarker";

export const switchTo3D = (
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
  getTopSymbolLayerId: (map: mapboxgl.Map) => string | undefined,
  addTerrainOnly: (map: mapboxgl.Map) => void,
  latestAffectedAreas: React.RefObject<GeoJSON.FeatureCollection | null>, // NEW
  drawAffectedAreasHelper: (
    map: mapboxgl.Map,
    geojson: GeoJSON.FeatureCollection,
    getTopSymbolLayerId: (map: mapboxgl.Map) => string | undefined
  ) => void // NEW
) => {
  const map = mapInstance.current;
  if (!map || !mapIsLoaded.current || is3DMode.current) return;
  is3DMode.current = true;

  let style = "mapbox://styles/shain34/cmesokqei00z501sdedixesto";
  if (label === "Satellite (Mapbox)") {
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

    // NEW: Restore affected areas
    if (latestAffectedAreas.current) {
      drawAffectedAreasHelper(
        map,
        latestAffectedAreas.current,
        getTopSymbolLayerId
      );
    }
  });
};
