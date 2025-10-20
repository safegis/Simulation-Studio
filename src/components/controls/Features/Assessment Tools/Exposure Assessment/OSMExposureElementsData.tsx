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
      source: "OpenStreetMap (OSM)",
      geojsonUrl:
        "https://lvgemiarxxmuqmylgscp.supabase.co/storage/v1/object/public/Exposure%20Elements/Land%20Cover/Philippines/OSM/Abra.geojson",
    },
    {
      name: "Agusan del Norte",
      country: "Philippines",
      elementType: "Land Cover",
      source: "OpenStreetMap (OSM)",
      geojsonUrl:
        "https://lvgemiarxxmuqmylgscp.supabase.co/storage/v1/object/public/Exposure%20Elements/Land%20Cover/Philippines/OSM/AgusandelNorte.geojson",
    },
    {
      name: "Agusan del Sur",
      country: "Philippines",
      elementType: "Land Cover",
      source: "OpenStreetMap (OSM)",
      geojsonUrl:
        "https://lvgemiarxxmuqmylgscp.supabase.co/storage/v1/object/public/Exposure%20Elements/Land%20Cover/Philippines/OSM/AgusandelSur.geojson",
    },
    {
      name: "Aklan",
      country: "Philippines",
      elementType: "Land Cover",
      source: "OpenStreetMap (OSM)",
      geojsonUrl:
        "https://lvgemiarxxmuqmylgscp.supabase.co/storage/v1/object/public/Exposure%20Elements/Land%20Cover/Philippines/OSM/Aklan.geojson",
    },
    {
      name: "Albay",
      country: "Philippines",
      elementType: "Land Cover",
      source: "OpenStreetMap (OSM)",
      geojsonUrl:
        "https://lvgemiarxxmuqmylgscp.supabase.co/storage/v1/object/public/Exposure%20Elements/Land%20Cover/Philippines/OSM/Albay.geojson",
    },
    {
      name: "Antique",
      country: "Philippines",
      elementType: "Land Cover",
      source: "OpenStreetMap (OSM)",
      geojsonUrl:
        "https://lvgemiarxxmuqmylgscp.supabase.co/storage/v1/object/public/Exposure%20Elements/Land%20Cover/Philippines/OSM/Antique.geojson",
    },
    {
      name: "Apayao",
      country: "Philippines",
      elementType: "Land Cover",
      source: "OpenStreetMap (OSM)",
      geojsonUrl:
        "https://lvgemiarxxmuqmylgscp.supabase.co/storage/v1/object/public/Exposure%20Elements/Land%20Cover/Philippines/OSM/Apayao.geojson",
    },
    {
      name: "Aurora",
      country: "Philippines",
      elementType: "Land Cover",
      source: "OpenStreetMap (OSM)",
      geojsonUrl:
        "https://lvgemiarxxmuqmylgscp.supabase.co/storage/v1/object/public/Exposure%20Elements/Land%20Cover/Philippines/OSM/Aurora.geojson",
    },
    {
      name: "Basilan",
      country: "Philippines",
      elementType: "Land Cover",
      source: "OpenStreetMap (OSM)",
      geojsonUrl:
        "https://lvgemiarxxmuqmylgscp.supabase.co/storage/v1/object/public/Exposure%20Elements/Land%20Cover/Philippines/OSM/Basilan.geojson",
    },
    {
      name: "Bataan",
      country: "Philippines",
      elementType: "Land Cover",
      source: "OpenStreetMap (OSM)",
      geojsonUrl:
        "https://lvgemiarxxmuqmylgscp.supabase.co/storage/v1/object/public/Exposure%20Elements/Land%20Cover/Philippines/OSM/Bataan.geojson",
    },
    {
      name: "Batanes",
      country: "Philippines",
      elementType: "Land Cover",
      source: "OpenStreetMap (OSM)",
      geojsonUrl:
        "https://lvgemiarxxmuqmylgscp.supabase.co/storage/v1/object/public/Exposure%20Elements/Land%20Cover/Philippines/OSM/Batanes.geojson",
    },
    {
      name: "Batangas",
      country: "Philippines",
      elementType: "Land Cover",
      source: "OpenStreetMap (OSM)",
      geojsonUrl:
        "https://lvgemiarxxmuqmylgscp.supabase.co/storage/v1/object/public/Exposure%20Elements/Land%20Cover/Philippines/OSM/Batangas.geojson",
    },
    {
      name: "Benguet",
      country: "Philippines",
      elementType: "Land Cover",
      source: "OpenStreetMap (OSM)",
      geojsonUrl:
        "https://lvgemiarxxmuqmylgscp.supabase.co/storage/v1/object/public/Exposure%20Elements/Land%20Cover/Philippines/OSM/Benguet.geojson",
    },
    {
      name: "Biliran",
      country: "Philippines",
      elementType: "Land Cover",
      source: "OpenStreetMap (OSM)",
      geojsonUrl:
        "https://lvgemiarxxmuqmylgscp.supabase.co/storage/v1/object/public/Exposure%20Elements/Land%20Cover/Philippines/OSM/Biliran.geojson",
    },
    {
      name: "Bohol",
      country: "Philippines",
      elementType: "Land Cover",
      source: "OpenStreetMap (OSM)",
      geojsonUrl:
        "https://lvgemiarxxmuqmylgscp.supabase.co/storage/v1/object/public/Exposure%20Elements/Land%20Cover/Philippines/OSM/Bohol.geojson",
    },
    {
      name: "Bukidnon",
      country: "Philippines",
      elementType: "Land Cover",
      source: "OpenStreetMap (OSM)",
      geojsonUrl:
        "https://lvgemiarxxmuqmylgscp.supabase.co/storage/v1/object/public/Exposure%20Elements/Land%20Cover/Philippines/OSM/Bukidnon.geojson",
    },
    {
      name: "Bulacan",
      country: "Philippines",
      elementType: "Land Cover",
      source: "OpenStreetMap (OSM)",
      geojsonUrl:
        "https://lvgemiarxxmuqmylgscp.supabase.co/storage/v1/object/public/Exposure%20Elements/Land%20Cover/Philippines/OSM/Bulacan.geojson",
    },
    {
      name: "Cagayan",
      country: "Philippines",
      elementType: "Land Cover",
      source: "OpenStreetMap (OSM)",
      geojsonUrl:
        "https://lvgemiarxxmuqmylgscp.supabase.co/storage/v1/object/public/Exposure%20Elements/Land%20Cover/Philippines/OSM/Cagayan.geojson",
    },
    {
      name: "Camarines Norte",
      country: "Philippines",
      elementType: "Land Cover",
      source: "OpenStreetMap (OSM)",
      geojsonUrl:
        "https://lvgemiarxxmuqmylgscp.supabase.co/storage/v1/object/public/Exposure%20Elements/Land%20Cover/Philippines/OSM/CamarinesNorte.geojson",
    },
    {
      name: "Camarines Sur",
      country: "Philippines",
      elementType: "Land Cover",
      source: "OpenStreetMap (OSM)",
      geojsonUrl:
        "https://lvgemiarxxmuqmylgscp.supabase.co/storage/v1/object/public/Exposure%20Elements/Land%20Cover/Philippines/OSM/CamarinesSur.geojson",
    },
    {
      name: "Camiguin",
      country: "Philippines",
      elementType: "Land Cover",
      source: "OpenStreetMap (OSM)",
      geojsonUrl:
        "https://lvgemiarxxmuqmylgscp.supabase.co/storage/v1/object/public/Exposure%20Elements/Land%20Cover/Philippines/OSM/Camiguin.geojson",
    },
    {
      name: "Capiz",
      country: "Philippines",
      elementType: "Land Cover",
      source: "OpenStreetMap (OSM)",
      geojsonUrl:
        "https://lvgemiarxxmuqmylgscp.supabase.co/storage/v1/object/public/Exposure%20Elements/Land%20Cover/Philippines/OSM/Capiz.geojson",
    },
    {
      name: "Catanduanes",
      country: "Philippines",
      elementType: "Land Cover",
      source: "OpenStreetMap (OSM)",
      geojsonUrl:
        "https://lvgemiarxxmuqmylgscp.supabase.co/storage/v1/object/public/Exposure%20Elements/Land%20Cover/Philippines/OSM/Catanduanes.geojson",
    },
    {
      name: "Cavite",
      country: "Philippines",
      elementType: "Land Cover",
      source: "OpenStreetMap (OSM)",
      geojsonUrl:
        "https://lvgemiarxxmuqmylgscp.supabase.co/storage/v1/object/public/Exposure%20Elements/Land%20Cover/Philippines/OSM/Cavite.geojson",
    },
    {
      name: "Cebu",
      country: "Philippines",
      elementType: "Land Cover",
      source: "OpenStreetMap (OSM)",
      geojsonUrl:
        "https://lvgemiarxxmuqmylgscp.supabase.co/storage/v1/object/public/Exposure%20Elements/Land%20Cover/Philippines/OSM/Cebu.geojson",
    },
    {
      name: "Davao del Norte",
      country: "Philippines",
      elementType: "Land Cover",
      source: "OpenStreetMap (OSM)",
      geojsonUrl:
        "https://lvgemiarxxmuqmylgscp.supabase.co/storage/v1/object/public/Exposure%20Elements/Land%20Cover/Philippines/OSM/DavaodelNorte.geojson",
    },
    {
      name: "Davao del Sur",
      country: "Philippines",
      elementType: "Land Cover",
      source: "OpenStreetMap (OSM)",
      geojsonUrl:
        "https://lvgemiarxxmuqmylgscp.supabase.co/storage/v1/object/public/Exposure%20Elements/Land%20Cover/Philippines/OSM/DavaodelSur.geojson",
    },
    {
      name: "Davao Occidental",
      country: "Philippines",
      elementType: "Land Cover",
      source: "OpenStreetMap (OSM)",
      geojsonUrl:
        "https://lvgemiarxxmuqmylgscp.supabase.co/storage/v1/object/public/Exposure%20Elements/Land%20Cover/Philippines/OSM/DavaoOccidental.geojson",
    },
    {
      name: "Davao Oriental",
      country: "Philippines",
      elementType: "Land Cover",
      source: "OpenStreetMap (OSM)",
      geojsonUrl:
        "https://lvgemiarxxmuqmylgscp.supabase.co/storage/v1/object/public/Exposure%20Elements/Land%20Cover/Philippines/OSM/DavaoOriental.geojson",
    },
    {
      name: "Dinagat Islands",
      country: "Philippines",
      elementType: "Land Cover",
      source: "OpenStreetMap (OSM)",
      geojsonUrl:
        "https://lvgemiarxxmuqmylgscp.supabase.co/storage/v1/object/public/Exposure%20Elements/Land%20Cover/Philippines/OSM/DinagatIslands.geojson",
    },
  ],
  "Transportation Networks": [
    {
      name: "Abra",
      country: "Philippines",
      elementType: "Transportation Networks",
      source: "OpenStreetMap (OSM)",
      geojsonUrl:
        "https://lvgemiarxxmuqmylgscp.supabase.co/storage/v1/object/public/Exposure%20Elements/Transportation%20Networks/Philippines/OSM/Abra.geojson",
    },
    {
      name: "Agusan del Norte",
      country: "Philippines",
      elementType: "Transportation Networks",
      source: "OpenStreetMap (OSM)",
      geojsonUrl:
        "https://lvgemiarxxmuqmylgscp.supabase.co/storage/v1/object/public/Exposure%20Elements/Transportation%20Networks/Philippines/OSM/AgusandelNorte.geojson",
    },
    {
      name: "Agusan del Sur",
      country: "Philippines",
      elementType: "Transportation Networks",
      source: "OpenStreetMap (OSM)",
      geojsonUrl:
        "https://lvgemiarxxmuqmylgscp.supabase.co/storage/v1/object/public/Exposure%20Elements/Transportation%20Networks/Philippines/OSM/AgusandelSur.geojson",
    },
    {
      name: "Aklan",
      country: "Philippines",
      elementType: "Transportation Networks",
      source: "OpenStreetMap (OSM)",
      geojsonUrl:
        "https://lvgemiarxxmuqmylgscp.supabase.co/storage/v1/object/public/Exposure%20Elements/Transportation%20Networks/Philippines/OSM/Aklan.geojson",
    },
    {
      name: "Albay",
      country: "Philippines",
      elementType: "Transportation Networks",
      source: "OpenStreetMap (OSM)",
      geojsonUrl:
        "https://lvgemiarxxmuqmylgscp.supabase.co/storage/v1/object/public/Exposure%20Elements/Transportation%20Networks/Philippines/OSM/Albay.geojson",
    },
    {
      name: "Antique",
      country: "Philippines",
      elementType: "Transportation Networks",
      source: "OpenStreetMap (OSM)",
      geojsonUrl:
        "https://lvgemiarxxmuqmylgscp.supabase.co/storage/v1/object/public/Exposure%20Elements/Transportation%20Networks/Philippines/OSM/Antique.geojson",
    },
    {
      name: "Apayao",
      country: "Philippines",
      elementType: "Transportation Networks",
      source: "OpenStreetMap (OSM)",
      geojsonUrl:
        "https://lvgemiarxxmuqmylgscp.supabase.co/storage/v1/object/public/Exposure%20Elements/Transportation%20Networks/Philippines/OSM/Apayao.geojson",
    },
    {
      name: "Aurora",
      country: "Philippines",
      elementType: "Transportation Networks",
      source: "OpenStreetMap (OSM)",
      geojsonUrl:
        "https://lvgemiarxxmuqmylgscp.supabase.co/storage/v1/object/public/Exposure%20Elements/Transportation%20Networks/Philippines/OSM/Aurora.geojson",
    },
    {
      name: "Basilan",
      country: "Philippines",
      elementType: "Transportation Networks",
      source: "OpenStreetMap (OSM)",
      geojsonUrl:
        "https://lvgemiarxxmuqmylgscp.supabase.co/storage/v1/object/public/Exposure%20Elements/Transportation%20Networks/Philippines/OSM/Basilan.geojson",
    },
    {
      name: "Bataan",
      country: "Philippines",
      elementType: "Transportation Networks",
      source: "OpenStreetMap (OSM)",
      geojsonUrl:
        "https://lvgemiarxxmuqmylgscp.supabase.co/storage/v1/object/public/Exposure%20Elements/Transportation%20Networks/Philippines/OSM/Bataan.geojson",
    },
    {
      name: "Batanes",
      country: "Philippines",
      elementType: "Transportation Networks",
      source: "OpenStreetMap (OSM)",
      geojsonUrl:
        "https://lvgemiarxxmuqmylgscp.supabase.co/storage/v1/object/public/Exposure%20Elements/Transportation%20Networks/Philippines/OSM/Batanes.geojson",
    },
    {
      name: "Benguet",
      country: "Philippines",
      elementType: "Transportation Networks",
      source: "OpenStreetMap (OSM)",
      geojsonUrl:
        "https://lvgemiarxxmuqmylgscp.supabase.co/storage/v1/object/public/Exposure%20Elements/Transportation%20Networks/Philippines/OSM/Benguet.geojson",
    },
    {
      name: "Biliran",
      country: "Philippines",
      elementType: "Transportation Networks",
      source: "OpenStreetMap (OSM)",
      geojsonUrl:
        "https://lvgemiarxxmuqmylgscp.supabase.co/storage/v1/object/public/Exposure%20Elements/Transportation%20Networks/Philippines/OSM/Biliran.geojson",
    },
    {
      name: "Bohol",
      country: "Philippines",
      elementType: "Transportation Networks",
      source: "OpenStreetMap (OSM)",
      geojsonUrl:
        "https://lvgemiarxxmuqmylgscp.supabase.co/storage/v1/object/public/Exposure%20Elements/Transportation%20Networks/Philippines/OSM/Bohol.geojson",
    },
    {
      name: "Cagayan",
      country: "Philippines",
      elementType: "Transportation Networks",
      source: "OpenStreetMap (OSM)",
      geojsonUrl:
        "https://lvgemiarxxmuqmylgscp.supabase.co/storage/v1/object/public/Exposure%20Elements/Transportation%20Networks/Philippines/OSM/Cagayan.geojson",
    },
    {
      name: "Camarines Norte",
      country: "Philippines",
      elementType: "Transportation Networks",
      source: "OpenStreetMap (OSM)",
      geojsonUrl:
        "https://lvgemiarxxmuqmylgscp.supabase.co/storage/v1/object/public/Exposure%20Elements/Transportation%20Networks/Philippines/OSM/CamarinesNorte.geojson",
    },
    {
      name: "Camarines Sur",
      country: "Philippines",
      elementType: "Transportation Networks",
      source: "OpenStreetMap (OSM)",
      geojsonUrl:
        "https://lvgemiarxxmuqmylgscp.supabase.co/storage/v1/object/public/Exposure%20Elements/Transportation%20Networks/Philippines/OSM/CamarinesSur.geojson",
    },
    {
      name: "Camiguin",
      country: "Philippines",
      elementType: "Transportation Networks",
      source: "OpenStreetMap (OSM)",
      geojsonUrl:
        "https://lvgemiarxxmuqmylgscp.supabase.co/storage/v1/object/public/Exposure%20Elements/Transportation%20Networks/Philippines/OSM/Camiguin.geojson",
    },
    {
      name: "Capiz",
      country: "Philippines",
      elementType: "Transportation Networks",
      source: "OpenStreetMap (OSM)",
      geojsonUrl:
        "https://lvgemiarxxmuqmylgscp.supabase.co/storage/v1/object/public/Exposure%20Elements/Transportation%20Networks/Philippines/OSM/Capiz.geojson",
    },
    {
      name: "Catanduanes",
      country: "Philippines",
      elementType: "Transportation Networks",
      source: "OpenStreetMap (OSM)",
      geojsonUrl:
        "https://lvgemiarxxmuqmylgscp.supabase.co/storage/v1/object/public/Exposure%20Elements/Transportation%20Networks/Philippines/OSM/Catanduanes.geojson",
    },
    {
      name: "Compostela Valley",
      country: "Philippines",
      elementType: "Transportation Networks",
      source: "OpenStreetMap (OSM)",
      geojsonUrl:
        "https://lvgemiarxxmuqmylgscp.supabase.co/storage/v1/object/public/Exposure%20Elements/Transportation%20Networks/Philippines/OSM/CompostelaValley.geojson",
    },
    {
      name: "Davao del Norte",
      country: "Philippines",
      elementType: "Transportation Networks",
      source: "OpenStreetMap (OSM)",
      geojsonUrl:
        "https://lvgemiarxxmuqmylgscp.supabase.co/storage/v1/object/public/Exposure%20Elements/Transportation%20Networks/Philippines/OSM/DavaodelNorte.geojson",
    },
    {
      name: "Davao del Sur",
      country: "Philippines",
      elementType: "Transportation Networks",
      source: "OpenStreetMap (OSM)",
      geojsonUrl:
        "https://lvgemiarxxmuqmylgscp.supabase.co/storage/v1/object/public/Exposure%20Elements/Transportation%20Networks/Philippines/OSM/DavaodelSur.geojson",
    },
    {
      name: "Davao Occidental",
      country: "Philippines",
      elementType: "Transportation Networks",
      source: "OpenStreetMap (OSM)",
      geojsonUrl:
        "https://lvgemiarxxmuqmylgscp.supabase.co/storage/v1/object/public/Exposure%20Elements/Transportation%20Networks/Philippines/OSM/DavaoOccidental.geojson",
    },
    {
      name: "Davao Oriental",
      country: "Philippines",
      elementType: "Transportation Networks",
      source: "OpenStreetMap (OSM)",
      geojsonUrl:
        "https://lvgemiarxxmuqmylgscp.supabase.co/storage/v1/object/public/Exposure%20Elements/Transportation%20Networks/Philippines/OSM/DavaoOriental.geojson",
    },
    {
      name: "Dinagat Islands",
      country: "Philippines",
      elementType: "Transportation Networks",
      source: "OpenStreetMap (OSM)",
      geojsonUrl:
        "https://lvgemiarxxmuqmylgscp.supabase.co/storage/v1/object/public/Exposure%20Elements/Transportation%20Networks/Philippines/OSM/DinagatIslands.geojson",
    },
    {
      name: "Eastern Samar",
      country: "Philippines",
      elementType: "Transportation Networks",
      source: "OpenStreetMap (OSM)",
      geojsonUrl:
        "https://lvgemiarxxmuqmylgscp.supabase.co/storage/v1/object/public/Exposure%20Elements/Transportation%20Networks/Philippines/OSM/EasternSamar.geojson",
    },
    {
      name: "Guimaras",
      country: "Philippines",
      elementType: "Transportation Networks",
      source: "OpenStreetMap (OSM)",
      geojsonUrl:
        "https://lvgemiarxxmuqmylgscp.supabase.co/storage/v1/object/public/Exposure%20Elements/Transportation%20Networks/Philippines/OSM/Guimaras.geojson",
    },
    {
      name: "Ifugao",
      country: "Philippines",
      elementType: "Transportation Networks",
      source: "OpenStreetMap (OSM)",
      geojsonUrl:
        "https://lvgemiarxxmuqmylgscp.supabase.co/storage/v1/object/public/Exposure%20Elements/Transportation%20Networks/Philippines/OSM/Ifugao.geojson",
    },
    {
      name: "Ilocos Norte",
      country: "Philippines",
      elementType: "Transportation Networks",
      source: "OpenStreetMap (OSM)",
      geojsonUrl:
        "https://lvgemiarxxmuqmylgscp.supabase.co/storage/v1/object/public/Exposure%20Elements/Transportation%20Networks/Philippines/OSM/IlocosNorte.geojson",
    },
  ],
};
