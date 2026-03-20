// \SafeGIS\Simulation-Studio\frontend\src\components\controls\Features\Maps\Critical Facility Layers\FireStations.tsx
export interface FireStationConfig {
  name: string;
  center: [number, number]; // [lng, lat]
  zoom: number;
  geojsonUrl: string;
}

export const FireStationsByCountry: Record<string, FireStationConfig> = {
  Angola: {
    name: "Angola",
    center: [17.8739, -11.2027], // Approx Luanda
    zoom: 6,
    geojsonUrl:
      "https://tcohgcmobudcnlohjbuv.supabase.co/storage/v1/object/public/critical-facilities/command-and-response-centers/fire-stations/by-country/angola_fire_stations.geojson",
  },
  Argentina: {
    name: "Argentina",
    center: [-58.3816, -34.6037], // Approx Buenos Aires
    zoom: 4,
    geojsonUrl:
      "https://tcohgcmobudcnlohjbuv.supabase.co/storage/v1/object/public/critical-facilities/command-and-response-centers/fire-stations/by-country/argentina_fire_stations.geojson",
  },
  Australia: {
    name: "Australia",
    center: [133.7751, -25.2744], // Approx center of Australia
    zoom: 4,
    geojsonUrl:
      "https://tcohgcmobudcnlohjbuv.supabase.co/storage/v1/object/public/critical-facilities/command-and-response-centers/fire-stations/by-country/australia_fire_stations.geojson",
  },
  Barbados: {
    name: "Barbados",
    center: [-59.5432, 13.1939], // Approx Bridgetown
    zoom: 10,
    geojsonUrl:
      "https://tcohgcmobudcnlohjbuv.supabase.co/storage/v1/object/public/critical-facilities/command-and-response-centers/fire-stations/by-country/barbados_fire_stations.geojson",
  },
  Belize: {
    name: "Belize",
    center: [-88.6859028, 17.1204943],
    zoom: 10,
    geojsonUrl:
      "https://tcohgcmobudcnlohjbuv.supabase.co/storage/v1/object/public/critical-facilities/command-and-response-centers/fire-stations/by-country/belize_fire_stations.geojson",
  },
  Bolivia: {
    name: "Bolivia",
    center: [-64.9912286, -17.0568696],
    zoom: 5,
    geojsonUrl:
      "https://tcohgcmobudcnlohjbuv.supabase.co/storage/v1/object/public/critical-facilities/command-and-response-centers/fire-stations/by-country/bolivia_fire_stations.geojson",
  },
  Botswana: {
    name: "Botswana",
    center: [24.5928742, -23.1681782],
    zoom: 6,
    geojsonUrl:
      "https://tcohgcmobudcnlohjbuv.supabase.co/storage/v1/object/public/critical-facilities/command-and-response-centers/fire-stations/by-country/botswana_fire_stations.geojson",
  },
  "Burkina Faso": {
    name: "Burkina Faso",
    center: [-1.5270944, 12.3681873],
    zoom: 10,
    geojsonUrl:
      "https://tcohgcmobudcnlohjbuv.supabase.co/storage/v1/object/public/critical-facilities/command-and-response-centers/fire-stations/by-country/burkina-faso_fire_stations.geojson",
  },
};
