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
  Bangladesh: {
    name: "Bangladesh",
    center: [90.2934413, 24.4769288],
    zoom: 7,
    geojsonUrl:
      "https://tcohgcmobudcnlohjbuv.supabase.co/storage/v1/object/public/critical-facilities/health-facilities/hotosm_bgd_health_facilities_points_geojson.geojson",
  },
  Bahrain: {
    name: "Bahrain",
    center: [50.5344606, 26.1551249],
    zoom: 10,
    geojsonUrl:
      "https://tcohgcmobudcnlohjbuv.supabase.co/storage/v1/object/public/critical-facilities/health-facilities/hotosm_bhr_health_facilities_points_geojson.geojson",
  },
  Canada: {
    name: "Canada",
    center: [-107.991707, 61.0666922],
    zoom: 5,
    geojsonUrl:
      "https://tcohgcmobudcnlohjbuv.supabase.co/storage/v1/object/public/critical-facilities/health-facilities/hotosm_can_health_facilities_points_geojson.geojson",
  },
  Chile: {
    name: "Chile",
    center: [-71.3187697, -31.7613365],
    zoom: 3,
    geojsonUrl:
      "https://tcohgcmobudcnlohjbuv.supabase.co/storage/v1/object/public/critical-facilities/health-facilities/hotosm_chl_health_facilities_points_geojson.geojson",
  },
  China: {
    name: "China",
    center: [104.999927, 35.000074],
    zoom: 4,
    geojsonUrl:
      "https://tcohgcmobudcnlohjbuv.supabase.co/storage/v1/object/public/critical-facilities/health-facilities/hotosm_chn_health_facilities_points_geojson.geojson",
  },
  Cameroon: {
    name: "Cameroon",
    center: [13.1535811, 4.6125522],
    zoom: 6,
    geojsonUrl:
      "https://tcohgcmobudcnlohjbuv.supabase.co/storage/v1/object/public/critical-facilities/health-facilities/hotosm_cmr_health_facilities_points_geojson.geojson",
  },
  Congo: {
    name: "Congo",
    center: [23.8222636, -2.9814344],
    zoom: 4,
    geojsonUrl:
      "https://tcohgcmobudcnlohjbuv.supabase.co/storage/v1/object/public/critical-facilities/health-facilities/hotosm_cog_health_facilities_points_geojson.geojson",
  },
};
