declare module "@mapbox/togeojson" {
  // minimal typing so you get IntelliSense
  export function kml(doc: Document): GeoJSON.FeatureCollection;
  export function gpx(doc: Document): GeoJSON.FeatureCollection;
}
