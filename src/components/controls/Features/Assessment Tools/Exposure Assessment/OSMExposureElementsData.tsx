export interface ExposureElementConfig {
  name: string;
  country: string;
  elementType: "Land Cover" | "Transportation Networks";
  source: string;
  geojsonUrl: string;
}

export const exposureElementsData: Record<string, ExposureElementConfig[]> = {
  "Land Cover": [
    {
      name: "Abra",
      country: "Philippines",
      elementType: "Land Cover",
      source: "OSM",
      geojsonUrl:
        "https://lvgemiarxxmuqmylgscp.supabase.co/storage/v1/object/public/Exposure%20Elements/Land%20Cover/Philippines/OSM/Abra.geojson",
    },
    {
      name: "Agusan del Norte",
      country: "Philippines",
      elementType: "Land Cover",
      source: "OSM",
      geojsonUrl:
        "https://lvgemiarxxmuqmylgscp.supabase.co/storage/v1/object/public/Exposure%20Elements/Land%20Cover/Philippines/OSM/AgusandelNorte.geojson",
    },
    {
      name: "Agusan del Sur",
      country: "Philippines",
      elementType: "Land Cover",
      source: "OSM",
      geojsonUrl:
        "https://lvgemiarxxmuqmylgscp.supabase.co/storage/v1/object/public/Exposure%20Elements/Land%20Cover/Philippines/OSM/AgusandelSur.geojson",
    },
    {
      name: "Aklan",
      country: "Philippines",
      elementType: "Land Cover",
      source: "OSM",
      geojsonUrl:
        "https://lvgemiarxxmuqmylgscp.supabase.co/storage/v1/object/public/Exposure%20Elements/Land%20Cover/Philippines/OSM/Aklan.geojson",
    },
    {
      name: "Albay",
      country: "Philippines",
      elementType: "Land Cover",
      source: "OSM",
      geojsonUrl:
        "https://lvgemiarxxmuqmylgscp.supabase.co/storage/v1/object/public/Exposure%20Elements/Land%20Cover/Philippines/OSM/Albay.geojson",
    },
    {
      name: "Antique",
      country: "Philippines",
      elementType: "Land Cover",
      source: "OSM",
      geojsonUrl:
        "https://lvgemiarxxmuqmylgscp.supabase.co/storage/v1/object/public/Exposure%20Elements/Land%20Cover/Philippines/OSM/Antique.geojson",
    },
    {
      name: "Apayao",
      country: "Philippines",
      elementType: "Land Cover",
      source: "OSM",
      geojsonUrl:
        "https://lvgemiarxxmuqmylgscp.supabase.co/storage/v1/object/public/Exposure%20Elements/Land%20Cover/Philippines/OSM/Apayao.geojson",
    },
  ],
  "Transportation Networks": [
    {
      name: "Abra",
      country: "Philippines",
      elementType: "Transportation Networks",
      source: "OSM",
      geojsonUrl:
        "https://lvgemiarxxmuqmylgscp.supabase.co/storage/v1/object/public/Exposure%20Elements/Transportation%20Networks/Philippines/OSM/Abra.geojson",
    },
    {
      name: "Agusan del Norte",
      country: "Philippines",
      elementType: "Transportation Networks",
      source: "OSM",
      geojsonUrl:
        "https://lvgemiarxxmuqmylgscp.supabase.co/storage/v1/object/public/Exposure%20Elements/Transportation%20Networks/Philippines/OSM/AgusandelNorte.geojson",
    },
    {
      name: "Agusan del Sur",
      country: "Philippines",
      elementType: "Transportation Networks",
      source: "OSM",
      geojsonUrl:
        "https://lvgemiarxxmuqmylgscp.supabase.co/storage/v1/object/public/Exposure%20Elements/Transportation%20Networks/Philippines/OSM/AgusandelSur.geojson",
    },
    {
      name: "Aklan",
      country: "Philippines",
      elementType: "Transportation Networks",
      source: "OSM",
      geojsonUrl:
        "https://lvgemiarxxmuqmylgscp.supabase.co/storage/v1/object/public/Exposure%20Elements/Transportation%20Networks/Philippines/OSM/Aklan.geojson",
    },
    {
      name: "Albay",
      country: "Philippines",
      elementType: "Transportation Networks",
      source: "OSM",
      geojsonUrl:
        "https://lvgemiarxxmuqmylgscp.supabase.co/storage/v1/object/public/Exposure%20Elements/Transportation%20Networks/Philippines/OSM/Albay.geojson",
    },
    {
      name: "Antique",
      country: "Philippines",
      elementType: "Transportation Networks",
      source: "OSM",
      geojsonUrl:
        "https://lvgemiarxxmuqmylgscp.supabase.co/storage/v1/object/public/Exposure%20Elements/Transportation%20Networks/Philippines/OSM/Antique.geojson",
    },
  ],
};
