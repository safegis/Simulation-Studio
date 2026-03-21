// \SafeGIS\Simulation-Studio\frontend\src\components\Map\Switch View\SwitchTo3DView.tsx
"use client";

import mapboxgl from "mapbox-gl";
import {
  MAPBOX_CUSTOM_STANDARD_STYLE_URL,
  mapAppearsToUseCustomStandardStyle,
  DEFAULT_STANDARD_3D_PITCH,
  DEFAULT_STANDARD_3D_BEARING,
} from "@/lib/mapboxCustomStandard";
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
  if (!map || is3DMode.current) return;

  /** Apply 3D style + terrain. Must run only after the map instance has finished its initial `load`. */
  const apply3DStyleAndTerrain = () => {
    if (is3DMode.current) return;
    is3DMode.current = true;

    let style = "mapbox://styles/mapbox/streets-v12";
    if (label === "Default (Custom Mapbox Standard)") {
      style = MAPBOX_CUSTOM_STANDARD_STYLE_URL;
    } else if (label === "Satellite (Mapbox)") {
      style = "mapbox://styles/mapbox/standard-satellite";
    }

    const after3DStyleReady = (cameraEaseMs: number) => {
      addTerrainOnly(map);
      map.easeTo({
        pitch: DEFAULT_STANDARD_3D_PITCH,
        bearing: DEFAULT_STANDARD_3D_BEARING,
        duration: cameraEaseMs,
      });

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

      if (latestAffectedAreas.current) {
        drawAffectedAreasHelper(
          map,
          latestAffectedAreas.current,
          getTopSymbolLayerId
        );
      }
    };

    // MainCanvas boots with this style already — skip setStyle to avoid a visible flash/reload.
    const alreadyOnDefaultCustom =
      label === "Default (Custom Mapbox Standard)" &&
      map.isStyleLoaded() &&
      mapAppearsToUseCustomStandardStyle(map);

    if (alreadyOnDefaultCustom) {
      // Map already uses default pitch/bearing from MainCanvas — no 1s tilt-up animation.
      after3DStyleReady(0);
      return;
    }

    map.setStyle(style);
    map.once("style.load", () => after3DStyleReady(1000));
  };

  // Boot can call switchTo3D before `mapIsLoaded` is set; the old guard made this a no-op.
  if (!map.loaded()) {
    map.once("load", apply3DStyleAndTerrain);
    return;
  }
  apply3DStyleAndTerrain();
};
