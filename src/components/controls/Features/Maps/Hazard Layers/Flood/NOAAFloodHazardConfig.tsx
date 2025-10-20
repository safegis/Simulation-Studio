// \SafeGIS\Simulation-Studio\frontend\src\components\controls\Features\Maps\Hazard Layers\Flood\NOAAFloodHazardConfig.tsx
export interface FloodHazardConfig {
  name: string;
  returnPeriod: "5-Year" | "25-Year" | "100-Year";
  country: "Philippines";
  source: string;
  geojsonUrl: string;
}

export const floodHazardMaps: Record<string, FloodHazardConfig[]> = {
  "5-Year": [
    {
      name: "Apayao",
      returnPeriod: "5-Year",
      country: "Philippines",
      source: "Nationwide Operational Assessment of Hazards (NOAH)",
      geojsonUrl:
        "https://tcohgcmobudcnlohjbuv.supabase.co/storage/v1/object/public/Static%20Hazard%20Maps/Flood/Philippines/Nationwide%20Operational%20Assessment%20of%20Hazards%20(NOAH)/5-Year%20Return%20Period/Apayao.geojson",
    },
    {
      name: "Compostela Valley",
      returnPeriod: "5-Year",
      country: "Philippines",
      source: "Nationwide Operational Assessment of Hazards (NOAH)",
      geojsonUrl:
        "https://tcohgcmobudcnlohjbuv.supabase.co/storage/v1/object/public/Static%20Hazard%20Maps/Flood/Philippines/Nationwide%20Operational%20Assessment%20of%20Hazards%20(NOAH)/5-Year%20Return%20Period/CompostelaValley.geojson",
    },
    {
      name: "Davao Oriental",
      returnPeriod: "5-Year",
      country: "Philippines",
      source: "Nationwide Operational Assessment of Hazards (NOAH)",
      geojsonUrl:
        "https://tcohgcmobudcnlohjbuv.supabase.co/storage/v1/object/public/Static%20Hazard%20Maps/Flood/Philippines/Nationwide%20Operational%20Assessment%20of%20Hazards%20(NOAH)/5-Year%20Return%20Period/DavaoOriental.geojson",
    },
    {
      name: "Dinagat Islands",
      returnPeriod: "5-Year",
      country: "Philippines",
      source: "Nationwide Operational Assessment of Hazards (NOAH)",
      geojsonUrl:
        "https://tcohgcmobudcnlohjbuv.supabase.co/storage/v1/object/public/Static%20Hazard%20Maps/Flood/Philippines/Nationwide%20Operational%20Assessment%20of%20Hazards%20(NOAH)/5-Year%20Return%20Period/DinagatIslands.geojson",
    },
    {
      name: "Ifugao",
      returnPeriod: "5-Year",
      country: "Philippines",
      source: "Nationwide Operational Assessment of Hazards (NOAH)",
      geojsonUrl:
        "https://tcohgcmobudcnlohjbuv.supabase.co/storage/v1/object/public/Static%20Hazard%20Maps/Flood/Philippines/Nationwide%20Operational%20Assessment%20of%20Hazards%20(NOAH)/5-Year%20Return%20Period/Ifugao.geojson",
    },
    {
      name: "Kalinga",
      returnPeriod: "5-Year",
      country: "Philippines",
      source: "NOAH",
      geojsonUrl:
        "https://tcohgcmobudcnlohjbuv.supabase.co/storage/v1/object/public/Static%20Hazard%20Maps/Flood/Philippines/Nationwide%20Operational%20Assessment%20of%20Hazards%20(NOAH)/5-Year%20Return%20Period/Kalinga.geojson",
    },
    {
      name: "Lanao Del Sur",
      returnPeriod: "5-Year",
      country: "Philippines",
      source: "NOAH",
      geojsonUrl:
        "https://tcohgcmobudcnlohjbuv.supabase.co/storage/v1/object/public/Static%20Hazard%20Maps/Flood/Philippines/Nationwide%20Operational%20Assessment%20of%20Hazards%20(NOAH)/5-Year%20Return%20Period/LanaoDelSur.geojson",
    },
    {
      name: "Marinduque",
      returnPeriod: "5-Year",
      country: "Philippines",
      source: "NOAH",
      geojsonUrl:
        "https://tcohgcmobudcnlohjbuv.supabase.co/storage/v1/object/public/Static%20Hazard%20Maps/Flood/Philippines/Nationwide%20Operational%20Assessment%20of%20Hazards%20(NOAH)/5-Year%20Return%20Period/Marinduque.geojson",
    },
    {
      name: "Metro Manila",
      returnPeriod: "5-Year",
      country: "Philippines",
      source: "NOAH",
      geojsonUrl:
        "https://tcohgcmobudcnlohjbuv.supabase.co/storage/v1/object/public/Static%20Hazard%20Maps/Flood/Philippines/Nationwide%20Operational%20Assessment%20of%20Hazards%20(NOAH)/5-Year%20Return%20Period/MetroManila.geojson",
    },
    {
      name: "Misamis Occidental",
      returnPeriod: "5-Year",
      country: "Philippines",
      source: "NOAH",
      geojsonUrl:
        "https://tcohgcmobudcnlohjbuv.supabase.co/storage/v1/object/public/Static%20Hazard%20Maps/Flood/Philippines/Nationwide%20Operational%20Assessment%20of%20Hazards%20(NOAH)/5-Year%20Return%20Period/MisamisOccidental.geojson",
    },
    {
      name: "Mountain Province",
      returnPeriod: "5-Year",
      country: "Philippines",
      source: "NOAH",
      geojsonUrl:
        "https://tcohgcmobudcnlohjbuv.supabase.co/storage/v1/object/public/Static%20Hazard%20Maps/Flood/Philippines/Nationwide%20Operational%20Assessment%20of%20Hazards%20(NOAH)/5-Year%20Return%20Period/MountainProvince.geojson",
    },
    {
      name: "Tarlac",
      returnPeriod: "5-Year",
      country: "Philippines",
      source: "NOAH",
      geojsonUrl:
        "https://tcohgcmobudcnlohjbuv.supabase.co/storage/v1/object/public/Static%20Hazard%20Maps/Flood/Philippines/Nationwide%20Operational%20Assessment%20of%20Hazards%20(NOAH)/5-Year%20Return%20Period/Tarlac.geojson",
    },
    {
      name: "Zamboanga Sibugay",
      returnPeriod: "5-Year",
      country: "Philippines",
      source: "NOAH",
      geojsonUrl:
        "https://tcohgcmobudcnlohjbuv.supabase.co/storage/v1/object/public/Static%20Hazard%20Maps/Flood/Philippines/Nationwide%20Operational%20Assessment%20of%20Hazards%20(NOAH)/5-Year%20Return%20Period/ZamboangaSibugay.geojson",
    },
  ],
  "25-Year": [
    {
      name: "Apayao",
      returnPeriod: "25-Year",
      country: "Philippines",
      source: "NOAH",
      geojsonUrl:
        "https://tcohgcmobudcnlohjbuv.supabase.co/storage/v1/object/public/Static%20Hazard%20Maps/Flood/Philippines/Nationwide%20Operational%20Assessment%20of%20Hazards%20(NOAH)/25-Year%20Return%20Period/Apayao.geojson",
    },
    {
      name: "Compostela Valley",
      returnPeriod: "25-Year",
      country: "Philippines",
      source: "NOAH",
      geojsonUrl:
        "https://tcohgcmobudcnlohjbuv.supabase.co/storage/v1/object/public/Static%20Hazard%20Maps/Flood/Philippines/Nationwide%20Operational%20Assessment%20of%20Hazards%20(NOAH)/25-Year%20Return%20Period/CompostelaValley.geojson",
    },
    {
      name: "Davao Oriental",
      returnPeriod: "25-Year",
      country: "Philippines",
      source: "NOAH",
      geojsonUrl:
        "https://tcohgcmobudcnlohjbuv.supabase.co/storage/v1/object/public/Static%20Hazard%20Maps/Flood/Philippines/Nationwide%20Operational%20Assessment%20of%20Hazards%20(NOAH)/25-Year%20Return%20Period/DavaoOriental.geojson",
    },
    {
      name: "Dinagat Islands",
      returnPeriod: "25-Year",
      country: "Philippines",
      source: "NOAH",
      geojsonUrl:
        "https://tcohgcmobudcnlohjbuv.supabase.co/storage/v1/object/public/Static%20Hazard%20Maps/Flood/Philippines/Nationwide%20Operational%20Assessment%20of%20Hazards%20(NOAH)/25-Year%20Return%20Period/DinagatIslands.geojson",
    },
    {
      name: "Ifugao",
      returnPeriod: "25-Year",
      country: "Philippines",
      source: "NOAH",
      geojsonUrl:
        "https://tcohgcmobudcnlohjbuv.supabase.co/storage/v1/object/public/Static%20Hazard%20Maps/Flood/Philippines/Nationwide%20Operational%20Assessment%20of%20Hazards%20(NOAH)/25-Year%20Return%20Period/Ifugao.geojson",
    },
    {
      name: "Kalinga",
      returnPeriod: "25-Year",
      country: "Philippines",
      source: "NOAH",
      geojsonUrl:
        "https://tcohgcmobudcnlohjbuv.supabase.co/storage/v1/object/public/Static%20Hazard%20Maps/Flood/Philippines/Nationwide%20Operational%20Assessment%20of%20Hazards%20(NOAH)/25-Year%20Return%20Period/Kalinga.geojson",
    },
    {
      name: "Lanao Del Sur",
      returnPeriod: "25-Year",
      country: "Philippines",
      source: "NOAH",
      geojsonUrl:
        "https://tcohgcmobudcnlohjbuv.supabase.co/storage/v1/object/public/Static%20Hazard%20Maps/Flood/Philippines/Nationwide%20Operational%20Assessment%20of%20Hazards%20(NOAH)/25-Year%20Return%20Period/LanaoDelSur.geojson",
    },
    {
      name: "Marinduque",
      returnPeriod: "25-Year",
      country: "Philippines",
      source: "NOAH",
      geojsonUrl:
        "https://tcohgcmobudcnlohjbuv.supabase.co/storage/v1/object/public/Static%20Hazard%20Maps/Flood/Philippines/Nationwide%20Operational%20Assessment%20of%20Hazards%20(NOAH)/25-Year%20Return%20Period/Marinduque.geojson",
    },
    {
      name: "Metro Manila",
      returnPeriod: "25-Year",
      country: "Philippines",
      source: "NOAH",
      geojsonUrl:
        "https://tcohgcmobudcnlohjbuv.supabase.co/storage/v1/object/public/Static%20Hazard%20Maps/Flood/Philippines/Nationwide%20Operational%20Assessment%20of%20Hazards%20(NOAH)/25-Year%20Return%20Period/MetroManila.geojson",
    },
    {
      name: "Misamis Occidental",
      returnPeriod: "25-Year",
      country: "Philippines",
      source: "NOAH",
      geojsonUrl:
        "https://tcohgcmobudcnlohjbuv.supabase.co/storage/v1/object/public/Static%20Hazard%20Maps/Flood/Philippines/Nationwide%20Operational%20Assessment%20of%20Hazards%20(NOAH)/25-Year%20Return%20Period/MisamisOccidental.geojson",
    },
    {
      name: "Mountain Province",
      returnPeriod: "25-Year",
      country: "Philippines",
      source: "NOAH",
      geojsonUrl:
        "https://tcohgcmobudcnlohjbuv.supabase.co/storage/v1/object/public/Static%20Hazard%20Maps/Flood/Philippines/Nationwide%20Operational%20Assessment%20of%20Hazards%20(NOAH)/25-Year%20Return%20Period/MountainProvince.geojson",
    },
    {
      name: "Tarlac",
      returnPeriod: "25-Year",
      country: "Philippines",
      source: "NOAH",
      geojsonUrl:
        "https://tcohgcmobudcnlohjbuv.supabase.co/storage/v1/object/public/Static%20Hazard%20Maps/Flood/Philippines/Nationwide%20Operational%20Assessment%20of%20Hazards%20(NOAH)/25-Year%20Return%20Period/Tarlac.geojson",
    },
    {
      name: "Zamboanga Sibugay",
      returnPeriod: "25-Year",
      country: "Philippines",
      source: "NOAH",
      geojsonUrl:
        "https://tcohgcmobudcnlohjbuv.supabase.co/storage/v1/object/public/Static%20Hazard%20Maps/Flood/Philippines/Nationwide%20Operational%20Assessment%20of%20Hazards%20(NOAH)/25-Year%20Return%20Period/ZamboangaSibugay.geojson",
    },
  ],
  "100-Year": [
    {
      name: "Apayao",
      returnPeriod: "100-Year",
      country: "Philippines",
      source: "NOAH",
      geojsonUrl:
        "https://tcohgcmobudcnlohjbuv.supabase.co/storage/v1/object/public/Static%20Hazard%20Maps/Flood/Philippines/Nationwide%20Operational%20Assessment%20of%20Hazards%20(NOAH)/100-Year%20Return%20Period/Apayao.geojson",
    },
    {
      name: "Compostela Valley",
      returnPeriod: "100-Year",
      country: "Philippines",
      source: "NOAH",
      geojsonUrl:
        "https://tcohgcmobudcnlohjbuv.supabase.co/storage/v1/object/public/Static%20Hazard%20Maps/Flood/Philippines/Nationwide%20Operational%20Assessment%20of%20Hazards%20(NOAH)/100-Year%20Return%20Period/CompostelaValley.geojson",
    },
    {
      name: "Davao Oriental",
      returnPeriod: "100-Year",
      country: "Philippines",
      source: "NOAH",
      geojsonUrl:
        "https://tcohgcmobudcnlohjbuv.supabase.co/storage/v1/object/public/Static%20Hazard%20Maps/Flood/Philippines/Nationwide%20Operational%20Assessment%20of%20Hazards%20(NOAH)/100-Year%20Return%20Period/DavaoOriental.geojson",
    },
    {
      name: "Dinagat Islands",
      returnPeriod: "100-Year",
      country: "Philippines",
      source: "NOAH",
      geojsonUrl:
        "https://tcohgcmobudcnlohjbuv.supabase.co/storage/v1/object/public/Static%20Hazard%20Maps/Flood/Philippines/Nationwide%20Operational%20Assessment%20of%20Hazards%20(NOAH)/100-Year%20Return%20Period/DinagatIslands.geojson",
    },
    {
      name: "Ifugao",
      returnPeriod: "100-Year",
      country: "Philippines",
      source: "NOAH",
      geojsonUrl:
        "https://tcohgcmobudcnlohjbuv.supabase.co/storage/v1/object/public/Static%20Hazard%20Maps/Flood/Philippines/Nationwide%20Operational%20Assessment%20of%20Hazards%20(NOAH)/100-Year%20Return%20Period/Ifugao.geojson",
    },
    {
      name: "Kalinga",
      returnPeriod: "100-Year",
      country: "Philippines",
      source: "NOAH",
      geojsonUrl:
        "https://tcohgcmobudcnlohjbuv.supabase.co/storage/v1/object/public/Static%20Hazard%20Maps/Flood/Philippines/Nationwide%20Operational%20Assessment%20of%20Hazards%20(NOAH)/100-Year%20Return%20Period/Kalinga.geojson",
    },
    {
      name: "Lanao Del Sur",
      returnPeriod: "100-Year",
      country: "Philippines",
      source: "NOAH",
      geojsonUrl:
        "https://tcohgcmobudcnlohjbuv.supabase.co/storage/v1/object/public/Static%20Hazard%20Maps/Flood/Philippines/Nationwide%20Operational%20Assessment%20of%20Hazards%20(NOAH)/100-Year%20Return%20Period/LanaoDelSur.geojson",
    },
    {
      name: "Marinduque",
      returnPeriod: "100-Year",
      country: "Philippines",
      source: "NOAH",
      geojsonUrl:
        "https://tcohgcmobudcnlohjbuv.supabase.co/storage/v1/object/public/Static%20Hazard%20Maps/Flood/Philippines/Nationwide%20Operational%20Assessment%20of%20Hazards%20(NOAH)/100-Year%20Return%20Period/Marinduque.geojson",
    },
    {
      name: "Metro Manila",
      returnPeriod: "100-Year",
      country: "Philippines",
      source: "Nationwide Operational Assessment of Hazards (NOAH)",
      geojsonUrl:
        "https://tcohgcmobudcnlohjbuv.supabase.co/storage/v1/object/public/Static%20Hazard%20Maps/Flood/Philippines/Nationwide%20Operational%20Assessment%20of%20Hazards%20(NOAH)/100-Year%20Return%20Period/MetroManila.geojson",
    },
    {
      name: "Misamis Occidental",
      returnPeriod: "100-Year",
      country: "Philippines",
      source: "Nationwide Operational Assessment of Hazards (NOAH)",
      geojsonUrl:
        "https://tcohgcmobudcnlohjbuv.supabase.co/storage/v1/object/public/Static%20Hazard%20Maps/Flood/Philippines/Nationwide%20Operational%20Assessment%20of%20Hazards%20(NOAH)/100-Year%20Return%20Period/MisamisOccidental.geojson",
    },
    {
      name: "Mountain Province",
      returnPeriod: "100-Year",
      country: "Philippines",
      source: "Nationwide Operational Assessment of Hazards (NOAH)",
      geojsonUrl:
        "https://tcohgcmobudcnlohjbuv.supabase.co/storage/v1/object/public/Static%20Hazard%20Maps/Flood/Philippines/Nationwide%20Operational%20Assessment%20of%20Hazards%20(NOAH)/100-Year%20Return%20Period/MountainProvince.geojson",
    },
    {
      name: "Tarlac",
      returnPeriod: "100-Year",
      country: "Philippines",
      source: "Nationwide Operational Assessment of Hazards (NOAH)",
      geojsonUrl:
        "https://tcohgcmobudcnlohjbuv.supabase.co/storage/v1/object/public/Static%20Hazard%20Maps/Flood/Philippines/Nationwide%20Operational%20Assessment%20of%20Hazards%20(NOAH)/100-Year%20Return%20Period/Tarlac.geojson",
    },
    {
      name: "Zamboanga Sibugay",
      returnPeriod: "100-Year",
      country: "Philippines",
      source: "Nationwide Operational Assessment of Hazards (NOAH)",
      geojsonUrl:
        "https://tcohgcmobudcnlohjbuv.supabase.co/storage/v1/object/public/Static%20Hazard%20Maps/Flood/Philippines/Nationwide%20Operational%20Assessment%20of%20Hazards%20(NOAH)/100-Year%20Return%20Period/ZamboangaSibugay.geojson",
    },
  ],
};
