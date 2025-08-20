// HealthFacilities.tsx
export interface HealthFacilityConfig {
  name: string;
  center: [number, number]; // [lng, lat]
  zoom: number;
  geojsonUrl: string;
}

export const healthFacilities: Record<string, HealthFacilityConfig> = {
  Afghanistan: {
    name: "Afghanistan",
    center: [67.709953, 33.93911], // Approx Kabul
    zoom: 5,
    geojsonUrl:
      "https://tcohgcmobudcnlohjbuv.supabase.co/storage/v1/object/public/critical-facilities/health-facilities/hotosm_afg_health_facilities_points_geojson.geojson",
  },
  Angola: {
    name: "Angola",
    center: [17.8739, -11.2027], // Approx Luanda
    zoom: 5,
    geojsonUrl:
      "https://tcohgcmobudcnlohjbuv.supabase.co/storage/v1/object/public/critical-facilities/health-facilities/hotosm_ago_health_facilities_points_geojson.geojson",
  },
  Albania: {
    name: "Albania",
    center: [19.8189, 41.3275], // Approx Tirana
    zoom: 6,
    geojsonUrl:
      "https://tcohgcmobudcnlohjbuv.supabase.co/storage/v1/object/public/critical-facilities/health-facilities/hotosm_alb_health_facilities_points_geojson.geojson",
  },
  Andorra: {
    name: "Andorra",
    center: [1.5211, 42.5078], // Approx Andorra la Vella
    zoom: 11,
    geojsonUrl:
      "https://tcohgcmobudcnlohjbuv.supabase.co/storage/v1/object/public/critical-facilities/health-facilities/hotosm_and_health_facilities_points_geojson.geojson",
  },
  Argentina: {
    name: "Argentina",
    center: [-58.3816, -34.6037], // Approx Buenos Aires
    zoom: 4,
    geojsonUrl:
      "https://tcohgcmobudcnlohjbuv.supabase.co/storage/v1/object/public/critical-facilities/health-facilities/hotosm_arg_health_facilities_points_geojson.geojson",
  },
  Armenia: {
    name: "Armenia",
    center: [44.5126, 40.1792], // Approx Yerevan
    zoom: 7,
    geojsonUrl:
      "https://tcohgcmobudcnlohjbuv.supabase.co/storage/v1/object/public/critical-facilities/health-facilities/hotosm_arm_health_facilities_points_geojson.geojson",
  },
  Austria: {
    name: "Austria",
    center: [16.3738, 48.2082], // Approx Vienna
    zoom: 7,
    geojsonUrl:
      "https://tcohgcmobudcnlohjbuv.supabase.co/storage/v1/object/public/critical-facilities/health-facilities/hotosm_aut_health_facilities_points_geojson.geojson",
  },
  Azerbaijan: {
    name: "Azerbaijan",
    center: [49.8671, 40.4093], // Approx Baku
    zoom: 7,
    geojsonUrl:
      "https://tcohgcmobudcnlohjbuv.supabase.co/storage/v1/object/public/critical-facilities/health-facilities/hotosm_aze_health_facilities_points_geojson.geojson",
  },
  Benin: {
    name: "Benin",
    center: [2.6322, 6.4969], // Approx Porto-Novo
    zoom: 7,
    geojsonUrl:
      "https://tcohgcmobudcnlohjbuv.supabase.co/storage/v1/object/public/critical-facilities/health-facilities/hotosm_ben_health_facilities_points_geojson.geojson",
  },
};
