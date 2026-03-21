import type mapboxgl from "mapbox-gl";

/**
 * Default Simulation Studio basemap (Mapbox Standard–based custom style).
 * Keep in sync with Map Style dropdown + undo helpers.
 */
export const MAPBOX_CUSTOM_STANDARD_STYLE_URL =
  "mapbox://styles/shain34/cmesokqei00z501sdedixesto";

/** Present in Studio style sprite/glyph URLs for this style. */
export const MAPBOX_CUSTOM_STANDARD_STYLE_ID_FRAGMENT =
  "cmesokqei00z501sdedixesto";

/** Default oblique camera when using the Custom Mapbox Standard basemap in 3D. */
export const DEFAULT_STANDARD_3D_PITCH = 60;
export const DEFAULT_STANDARD_3D_BEARING = 30;

/**
 * True if the map’s loaded style is already the custom Standard basemap
 * (avoids redundant setStyle on boot, which causes a visible reload).
 */
export function mapAppearsToUseCustomStandardStyle(map: mapboxgl.Map): boolean {
  try {
    const style = map.getStyle();
    if (!style) return false;
    const raw = JSON.stringify(style);
    return raw.includes(MAPBOX_CUSTOM_STANDARD_STYLE_ID_FRAGMENT);
  } catch {
    return false;
  }
}
