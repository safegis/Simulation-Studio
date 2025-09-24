export interface PoliceStationConfig {
  name: string;
  center: [number, number]; // [lng, lat]
  zoom: number;
  geojsonUrl: string;
}

export const PoliceStationsByCountry: Record<string, PoliceStationConfig> = {
  Andorra: {
    name: "Andorra",
    center: [1.5218, 42.5063], // Approx Andorra la Vella
    zoom: 11,
    geojsonUrl:
      "https://tcohgcmobudcnlohjbuv.supabase.co/storage/v1/object/public/critical-facilities/command-and-response-centers/police-stations/by-country/andorra_police_stations.geojson",
  },
  Angola: {
    name: "Angola",
    center: [17.8739, -11.2027], // Approx Luanda
    zoom: 6,
    geojsonUrl:
      "https://tcohgcmobudcnlohjbuv.supabase.co/storage/v1/object/public/critical-facilities/command-and-response-centers/police-stations/by-country/angola_police_stations.geojson",
  },
  Anguilla: {
    name: "Anguilla",
    center: [-63.0686, 18.2206], // Approx The Valley
    zoom: 12,
    geojsonUrl:
      "https://tcohgcmobudcnlohjbuv.supabase.co/storage/v1/object/public/critical-facilities/command-and-response-centers/police-stations/by-country/anguilla_police_stations.geojson",
  },
  Argentina: {
    name: "Argentina",
    center: [-58.3816, -34.6037], // Approx Buenos Aires
    zoom: 4,
    geojsonUrl:
      "https://tcohgcmobudcnlohjbuv.supabase.co/storage/v1/object/public/critical-facilities/command-and-response-centers/police-stations/by-country/argentina_police_stations.geojson",
  },
  Australia: {
    name: "Australia",
    center: [133.7751, -25.2744], // Approx center of Australia
    zoom: 4,
    geojsonUrl:
      "https://tcohgcmobudcnlohjbuv.supabase.co/storage/v1/object/public/critical-facilities/command-and-response-centers/police-stations/by-country/australia_police_stations.geojson",
  },
  Barbados: {
    name: "Barbados",
    center: [-59.5432, 13.1939], // Approx Bridgetown
    zoom: 10,
    geojsonUrl:
      "https://tcohgcmobudcnlohjbuv.supabase.co/storage/v1/object/public/critical-facilities/command-and-response-centers/police-stations/by-country/barbados_police_stations.geojson",
  },
  Belize: {
    name: "Belize",
    center: [-88.6859, 17.1205], // Approx Belize City
    zoom: 9,
    geojsonUrl:
      "https://tcohgcmobudcnlohjbuv.supabase.co/storage/v1/object/public/critical-facilities/command-and-response-centers/police-stations/by-country/belize_police_stations.geojson",
  },
  Bermuda: {
    name: "Bermuda",
    center: [-64.7505, 32.3078], // Approx Hamilton
    zoom: 12,
    geojsonUrl:
      "https://tcohgcmobudcnlohjbuv.supabase.co/storage/v1/object/public/critical-facilities/command-and-response-centers/police-stations/by-country/bermuda_police_stations.geojson",
  },
  Bolivia: {
    name: "Bolivia",
    center: [-64.9912, -17.0569], // Approx center of Bolivia
    zoom: 5,
    geojsonUrl:
      "https://tcohgcmobudcnlohjbuv.supabase.co/storage/v1/object/public/critical-facilities/command-and-response-centers/police-stations/by-country/bolivia_police_stations.geojson",
  },
  Botswana: {
    name: "Botswana",
    center: [24.5929, -23.1682], // Approx Gaborone
    zoom: 6,
    geojsonUrl:
      "https://tcohgcmobudcnlohjbuv.supabase.co/storage/v1/object/public/critical-facilities/command-and-response-centers/police-stations/by-country/botswana_police_stations.geojson",
  },
  "British Virgin Islands": {
    name: "British Virgin Islands",
    center: [-64.6963, 18.4207], // Approx Road Town
    zoom: 11,
    geojsonUrl:
      "https://tcohgcmobudcnlohjbuv.supabase.co/storage/v1/object/public/critical-facilities/command-and-response-centers/police-stations/by-country/british-virgin-islands_police_stations.geojson",
  },
  "Burkina Faso": {
    name: "Burkina Faso",
    center: [-1.5271, 12.3682], // Approx Ouagadougou
    zoom: 7,
    geojsonUrl:
      "https://tcohgcmobudcnlohjbuv.supabase.co/storage/v1/object/public/critical-facilities/command-and-response-centers/police-stations/by-country/burkina-faso_police_stations.geojson",
  },
  Burundi: {
    name: "Burundi",
    center: [29.9189, -3.3731], // Approx Gitega
    zoom: 8,
    geojsonUrl:
      "https://tcohgcmobudcnlohjbuv.supabase.co/storage/v1/object/public/critical-facilities/command-and-response-centers/police-stations/by-country/burundi_police_stations.geojson",
  },
  "Cabo Verde": {
    name: "Cabo Verde",
    center: [-23.6052, 14.9331], // Approx Praia
    zoom: 9,
    geojsonUrl:
      "https://tcohgcmobudcnlohjbuv.supabase.co/storage/v1/object/public/critical-facilities/command-and-response-centers/police-stations/by-country/cabo-verde_police_stations.geojson",
  },
  Canada: {
    name: "Canada",
    center: [-106.3468, 56.1304], // Approx center of Canada
    zoom: 3,
    geojsonUrl:
      "https://tcohgcmobudcnlohjbuv.supabase.co/storage/v1/object/public/critical-facilities/command-and-response-centers/police-stations/by-country/canada_police_stations.geojson",
  },
  "Cayman Islands": {
    name: "Cayman Islands",
    center: [-81.2546, 19.3133], // Approx George Town
    zoom: 11,
    geojsonUrl:
      "https://tcohgcmobudcnlohjbuv.supabase.co/storage/v1/object/public/critical-facilities/command-and-response-centers/police-stations/by-country/cayman-islands_police_stations.geojson",
  },
  Chile: {
    name: "Chile",
    center: [-71.543, -35.6751], // Approx center of Chile
    zoom: 4,
    geojsonUrl:
      "https://tcohgcmobudcnlohjbuv.supabase.co/storage/v1/object/public/critical-facilities/command-and-response-centers/police-stations/by-country/chile_police_stations.geojson",
  },
  Congo: {
    name: "Congo",
    center: [15.8277, -0.228], // Approx Brazzaville
    zoom: 6,
    geojsonUrl:
      "https://tcohgcmobudcnlohjbuv.supabase.co/storage/v1/object/public/critical-facilities/command-and-response-centers/police-stations/by-country/congo_police_stations.geojson",
  },
  "Costa Rica": {
    name: "Costa Rica",
    center: [-84.0907, 9.7489], // Approx San José
    zoom: 8,
    geojsonUrl:
      "https://tcohgcmobudcnlohjbuv.supabase.co/storage/v1/object/public/critical-facilities/command-and-response-centers/police-stations/by-country/costa-rica_police_stations.geojson",
  },
  Cuba: {
    name: "Cuba",
    center: [-77.7812, 21.5218], // Approx Havana
    zoom: 6,
    geojsonUrl:
      "https://tcohgcmobudcnlohjbuv.supabase.co/storage/v1/object/public/critical-facilities/command-and-response-centers/police-stations/by-country/cuba_police_stations.geojson",
  },
  Dominica: {
    name: "Dominica",
    center: [-61.371, 15.4149], // Approx Roseau
    zoom: 11,
    geojsonUrl:
      "https://tcohgcmobudcnlohjbuv.supabase.co/storage/v1/object/public/critical-facilities/command-and-response-centers/police-stations/by-country/dominica_police_stations.geojson",
  },
  Ecuador: {
    name: "Ecuador",
    center: [-78.1834, -1.8312], // Approx Quito
    zoom: 6,
    geojsonUrl:
      "https://tcohgcmobudcnlohjbuv.supabase.co/storage/v1/object/public/critical-facilities/command-and-response-centers/police-stations/by-country/ecuador_police_stations.geojson",
  },
  "El Salvador": {
    name: "El Salvador",
    center: [-88.8965, 13.7942], // Approx San Salvador
    zoom: 8,
    geojsonUrl:
      "https://tcohgcmobudcnlohjbuv.supabase.co/storage/v1/object/public/critical-facilities/command-and-response-centers/police-stations/by-country/el-salvador_police_stations.geojson",
  },
  Gabon: {
    name: "Gabon",
    center: [11.6094, -0.8037], // Approx Libreville
    zoom: 6,
    geojsonUrl:
      "https://tcohgcmobudcnlohjbuv.supabase.co/storage/v1/object/public/critical-facilities/command-and-response-centers/police-stations/by-country/gabon_police_stations.geojson",
  },
  Ghana: {
    name: "Ghana",
    center: [-1.0232, 7.9465], // Approx Accra
    zoom: 7,
    geojsonUrl:
      "https://tcohgcmobudcnlohjbuv.supabase.co/storage/v1/object/public/critical-facilities/command-and-response-centers/police-stations/by-country/ghana_police_stations.geojson",
  },
  Gibraltar: {
    name: "Gibraltar",
    center: [-5.3536, 36.1408], // Gibraltar
    zoom: 14,
    geojsonUrl:
      "https://tcohgcmobudcnlohjbuv.supabase.co/storage/v1/object/public/critical-facilities/command-and-response-centers/police-stations/by-country/gibraltar_police_stations.geojson",
  },
  Grenada: {
    name: "Grenada",
    center: [-61.679, 12.2628], // Approx St. George's
    zoom: 11,
    geojsonUrl:
      "https://tcohgcmobudcnlohjbuv.supabase.co/storage/v1/object/public/critical-facilities/command-and-response-centers/police-stations/by-country/grenada_police_stations.geojson",
  },
  Guadeloupe: {
    name: "Guadeloupe",
    center: [-61.5804, 16.265], // Approx Pointe-à-Pitre
    zoom: 10,
    geojsonUrl:
      "https://tcohgcmobudcnlohjbuv.supabase.co/storage/v1/object/public/critical-facilities/command-and-response-centers/police-stations/by-country/guadeloupe_police_stations.geojson",
  },
  Guam: {
    name: "Guam",
    center: [144.7937, 13.4443], // Approx Hagåtña
    zoom: 11,
    geojsonUrl:
      "https://tcohgcmobudcnlohjbuv.supabase.co/storage/v1/object/public/critical-facilities/command-and-response-centers/police-stations/by-country/guam_police_stations.geojson",
  },
  Guatemala: {
    name: "Guatemala",
    center: [-90.2308, 15.7835], // Approx Guatemala City
    zoom: 7,
    geojsonUrl:
      "https://tcohgcmobudcnlohjbuv.supabase.co/storage/v1/object/public/critical-facilities/command-and-response-centers/police-stations/by-country/guatemala_police_stations.geojson",
  },
  Guernsey: {
    name: "Guernsey",
    center: [-2.5358, 49.4484], // Approx St. Peter Port
    zoom: 12,
    geojsonUrl:
      "https://tcohgcmobudcnlohjbuv.supabase.co/storage/v1/object/public/critical-facilities/command-and-response-centers/police-stations/by-country/guernsey_police_stations.geojson",
  },
  Guyana: {
    name: "Guyana",
    center: [-58.9302, 4.8604], // Approx Georgetown
    zoom: 6,
    geojsonUrl:
      "https://tcohgcmobudcnlohjbuv.supabase.co/storage/v1/object/public/critical-facilities/command-and-response-centers/police-stations/by-country/guyana_police_stations.geojson",
  },
  Honduras: {
    name: "Honduras",
    center: [-87.275, 14.0723], // Approx Tegucigalpa
    zoom: 7,
    geojsonUrl:
      "https://tcohgcmobudcnlohjbuv.supabase.co/storage/v1/object/public/critical-facilities/command-and-response-centers/police-stations/by-country/honduras_police_stations.geojson",
  },
  Indonesia: {
    name: "Indonesia",
    center: [113.9213, -0.7893], // Approx center of Indonesia
    zoom: 4,
    geojsonUrl:
      "https://tcohgcmobudcnlohjbuv.supabase.co/storage/v1/object/public/critical-facilities/command-and-response-centers/police-stations/by-country/indonesia_police_stations.geojson",
  },
  Jamaica: {
    name: "Jamaica",
    center: [-77.2975, 18.1096], // Approx Kingston
    zoom: 9,
    geojsonUrl:
      "https://tcohgcmobudcnlohjbuv.supabase.co/storage/v1/object/public/critical-facilities/command-and-response-centers/police-stations/by-country/jamaica_police_stations.geojson",
  },
  Jersey: {
    name: "Jersey",
    center: [-2.1358, 49.2138], // Approx St. Helier
    zoom: 12,
    geojsonUrl:
      "https://tcohgcmobudcnlohjbuv.supabase.co/storage/v1/object/public/critical-facilities/command-and-response-centers/police-stations/by-country/jersey_police_stations.geojson",
  },
  Kenya: {
    name: "Kenya",
    center: [37.9062, -0.0236], // Approx Nairobi
    zoom: 6,
    geojsonUrl:
      "https://tcohgcmobudcnlohjbuv.supabase.co/storage/v1/object/public/critical-facilities/command-and-response-centers/police-stations/by-country/kenya_police_stations.geojson",
  },
  Kiribati: {
    name: "Kiribati",
    center: [-157.363, 1.8709], // Approx Tarawa
    zoom: 9,
    geojsonUrl:
      "https://tcohgcmobudcnlohjbuv.supabase.co/storage/v1/object/public/critical-facilities/command-and-response-centers/police-stations/by-country/kiribati_police_stations.geojson",
  },
  Lesotho: {
    name: "Lesotho",
    center: [28.2336, -29.61], // Approx Maseru
    zoom: 8,
    geojsonUrl:
      "https://tcohgcmobudcnlohjbuv.supabase.co/storage/v1/object/public/critical-facilities/command-and-response-centers/police-stations/by-country/lesotho_police_stations.geojson",
  },
  Liberia: {
    name: "Liberia",
    center: [-9.4295, 6.4281], // Approx Monrovia
    zoom: 7,
    geojsonUrl:
      "https://tcohgcmobudcnlohjbuv.supabase.co/storage/v1/object/public/critical-facilities/command-and-response-centers/police-stations/by-country/liberia_police_stations.geojson",
  },
  Liechtenstein: {
    name: "Liechtenstein",
    center: [9.5215, 47.166], // Approx Vaduz
    zoom: 12,
    geojsonUrl:
      "https://tcohgcmobudcnlohjbuv.supabase.co/storage/v1/object/public/critical-facilities/command-and-response-centers/police-stations/by-country/liechtenstein_police_stations.geojson",
  },
  Malawi: {
    name: "Malawi",
    center: [34.3015, -13.2543], // Approx Lilongwe
    zoom: 7,
    geojsonUrl:
      "https://tcohgcmobudcnlohjbuv.supabase.co/storage/v1/object/public/critical-facilities/command-and-response-centers/police-stations/by-country/malawi_police_stations.geojson",
  },
  Malaysia: {
    name: "Malaysia",
    center: [101.9758, 4.2105], // Approx Kuala Lumpur
    zoom: 6,
    geojsonUrl:
      "https://tcohgcmobudcnlohjbuv.supabase.co/storage/v1/object/public/critical-facilities/command-and-response-centers/police-stations/by-country/malaysia_police_stations.geojson",
  },
  Mali: {
    name: "Mali",
    center: [-3.9962, 17.5707], // Approx Bamako
    zoom: 6,
    geojsonUrl:
      "https://tcohgcmobudcnlohjbuv.supabase.co/storage/v1/object/public/critical-facilities/command-and-response-centers/police-stations/by-country/mali_police_stations.geojson",
  },
  Malta: {
    name: "Malta",
    center: [14.3754, 35.9375], // Approx Valletta
    zoom: 11,
    geojsonUrl:
      "https://tcohgcmobudcnlohjbuv.supabase.co/storage/v1/object/public/critical-facilities/command-and-response-centers/police-stations/by-country/malta_police_stations.geojson",
  },
  Martinique: {
    name: "Martinique",
    center: [-61.0242, 14.6415], // Approx Fort-de-France
    zoom: 10,
    geojsonUrl:
      "https://tcohgcmobudcnlohjbuv.supabase.co/storage/v1/object/public/critical-facilities/command-and-response-centers/police-stations/by-country/martinique_police_stations.geojson",
  },
  Mayotte: {
    name: "Mayotte",
    center: [45.1662, -12.8275], // Approx Mamoudzou
    zoom: 11,
    geojsonUrl:
      "https://tcohgcmobudcnlohjbuv.supabase.co/storage/v1/object/public/critical-facilities/command-and-response-centers/police-stations/by-country/mayotte_police_stations.geojson",
  },
  Micronesia: {
    name: "Micronesia",
    center: [158.1611, 6.8874], // Approx Palikir
    zoom: 9,
    geojsonUrl:
      "https://tcohgcmobudcnlohjbuv.supabase.co/storage/v1/object/public/critical-facilities/command-and-response-centers/police-stations/by-country/micronesia_police_stations.geojson",
  },
  Moldova: {
    name: "Moldova",
    center: [28.3699, 47.4116], // Approx Chișinău
    zoom: 8,
    geojsonUrl:
      "https://tcohgcmobudcnlohjbuv.supabase.co/storage/v1/object/public/critical-facilities/command-and-response-centers/police-stations/by-country/moldova_police_stations.geojson",
  },
  Monaco: {
    name: "Monaco",
    center: [7.4167, 43.7333], // Monaco
    zoom: 14,
    geojsonUrl:
      "https://tcohgcmobudcnlohjbuv.supabase.co/storage/v1/object/public/critical-facilities/command-and-response-centers/police-stations/by-country/monaco_police_stations.geojson",
  },
  Namibia: {
    name: "Namibia",
    center: [18.4241, -22.9576], // Approx Windhoek
    zoom: 6,
    geojsonUrl:
      "https://tcohgcmobudcnlohjbuv.supabase.co/storage/v1/object/public/critical-facilities/command-and-response-centers/police-stations/by-country/namibia_police_stations.geojson",
  },
  Niger: {
    name: "Niger",
    center: [8.0817, 17.6078], // Approx Niamey
    zoom: 6,
    geojsonUrl:
      "https://tcohgcmobudcnlohjbuv.supabase.co/storage/v1/object/public/critical-facilities/command-and-response-centers/police-stations/by-country/niger_police_stations.geojson",
  },
  Nigeria: {
    name: "Nigeria",
    center: [8.6753, 9.0765], // Approx Abuja
    zoom: 6,
    geojsonUrl:
      "https://tcohgcmobudcnlohjbuv.supabase.co/storage/v1/object/public/critical-facilities/command-and-response-centers/police-stations/by-country/nigeria_police_stations.geojson",
  },
  Philippines: {
    name: "Philippines",
    center: [121.774, 12.8797], // Approx Manila
    zoom: 6,
    geojsonUrl:
      "https://tcohgcmobudcnlohjbuv.supabase.co/storage/v1/object/public/critical-facilities/command-and-response-centers/police-stations/by-country/philippines_police_stations.geojson",
  },
  Portugal: {
    name: "Portugal",
    center: [-8.2245, 39.3999], // Approx Lisbon
    zoom: 7,
    geojsonUrl:
      "https://tcohgcmobudcnlohjbuv.supabase.co/storage/v1/object/public/critical-facilities/command-and-response-centers/police-stations/by-country/portugal_police_stations.geojson",
  },
  "Puerto Rico": {
    name: "Puerto Rico",
    center: [-66.5901, 18.2208], // Approx San Juan
    zoom: 9,
    geojsonUrl:
      "https://tcohgcmobudcnlohjbuv.supabase.co/storage/v1/object/public/critical-facilities/command-and-response-centers/police-stations/by-country/puerto-rico_police_stations.geojson",
  },
  Rwanda: {
    name: "Rwanda",
    center: [29.8739, -1.9403], // Approx Kigali
    zoom: 8,
    geojsonUrl:
      "https://tcohgcmobudcnlohjbuv.supabase.co/storage/v1/object/public/critical-facilities/command-and-response-centers/police-stations/by-country/rwanda_police_stations.geojson",
  },
  "Saint Lucia": {
    name: "Saint Lucia",
    center: [-60.9789, 13.9094], // Approx Castries
    zoom: 11,
    geojsonUrl:
      "https://tcohgcmobudcnlohjbuv.supabase.co/storage/v1/object/public/critical-facilities/command-and-response-centers/police-stations/by-country/saint-lucia_police_stations.geojson",
  },
  "San Marino": {
    name: "San Marino",
    center: [12.4578, 43.9424], // San Marino
    zoom: 13,
    geojsonUrl:
      "https://tcohgcmobudcnlohjbuv.supabase.co/storage/v1/object/public/critical-facilities/command-and-response-centers/police-stations/by-country/san-marino_police_stations.geojson",
  },
  "Sierra Leone": {
    name: "Sierra Leone",
    center: [-11.7799, 8.4606], // Approx Freetown
    zoom: 8,
    geojsonUrl:
      "https://tcohgcmobudcnlohjbuv.supabase.co/storage/v1/object/public/critical-facilities/command-and-response-centers/police-stations/by-country/sierra-leone_police_stations.geojson",
  },
  Singapore: {
    name: "Singapore",
    center: [103.8198, 1.3521], // Singapore
    zoom: 11,
    geojsonUrl:
      "https://tcohgcmobudcnlohjbuv.supabase.co/storage/v1/object/public/critical-facilities/command-and-response-centers/police-stations/by-country/singapore_police_stations.geojson",
  },
  "Solomon Islands": {
    name: "Solomon Islands",
    center: [160.1562, -9.6457], // Approx Honiara
    zoom: 8,
    geojsonUrl:
      "https://tcohgcmobudcnlohjbuv.supabase.co/storage/v1/object/public/critical-facilities/command-and-response-centers/police-stations/by-country/solomon-islands_police_stations.geojson",
  },
  "South Africa": {
    name: "South Africa",
    center: [22.9375, -30.5595], // Approx center of South Africa
    zoom: 5,
    geojsonUrl:
      "https://tcohgcmobudcnlohjbuv.supabase.co/storage/v1/object/public/critical-facilities/command-and-response-centers/police-stations/by-country/south-africa_police_stations.geojson",
  },
  "Sri Lanka": {
    name: "Sri Lanka",
    center: [80.7718, 7.8731], // Approx Colombo
    zoom: 8,
    geojsonUrl:
      "https://tcohgcmobudcnlohjbuv.supabase.co/storage/v1/object/public/critical-facilities/command-and-response-centers/police-stations/by-country/sri-lanka_police_stations.geojson",
  },
  Suriname: {
    name: "Suriname",
    center: [-56.0272, 3.9193], // Approx Paramaribo
    zoom: 7,
    geojsonUrl:
      "https://tcohgcmobudcnlohjbuv.supabase.co/storage/v1/object/public/critical-facilities/command-and-response-centers/police-stations/by-country/suriname_police_stations.geojson",
  },
  Tanzania: {
    name: "Tanzania",
    center: [34.8888, -6.369], // Approx Dodoma
    zoom: 6,
    geojsonUrl:
      "https://tcohgcmobudcnlohjbuv.supabase.co/storage/v1/object/public/critical-facilities/command-and-response-centers/police-stations/by-country/tanzania_police_stations.geojson",
  },
  "Timor-Leste": {
    name: "Timor-Leste",
    center: [125.7275, -8.8742], // Approx Dili
    zoom: 9,
    geojsonUrl:
      "https://tcohgcmobudcnlohjbuv.supabase.co/storage/v1/object/public/critical-facilities/command-and-response-centers/police-stations/by-country/timor-leste_police_stations.geojson",
  },
  Togo: {
    name: "Togo",
    center: [0.8248, 8.6195], // Approx Lomé
    zoom: 8,
    geojsonUrl:
      "https://tcohgcmobudcnlohjbuv.supabase.co/storage/v1/object/public/critical-facilities/command-and-response-centers/police-stations/by-country/togo_police_stations.geojson",
  },
  Tonga: {
    name: "Tonga",
    center: [-175.2018, -21.1789], // Approx Nuku'alofa
    zoom: 10,
    geojsonUrl:
      "https://tcohgcmobudcnlohjbuv.supabase.co/storage/v1/object/public/critical-facilities/command-and-response-centers/police-stations/by-country/tonga_police_stations.geojson",
  },
  "Trinidad and Tobago": {
    name: "Trinidad and Tobago",
    center: [-61.2225, 10.6918], // Approx Port of Spain
    zoom: 9,
    geojsonUrl:
      "https://tcohgcmobudcnlohjbuv.supabase.co/storage/v1/object/public/critical-facilities/command-and-response-centers/police-stations/by-country/trinidad-and-tobago_police_stations.geojson",
  },
  Tuvalu: {
    name: "Tuvalu",
    center: [179.1962, -7.1095], // Approx Funafuti
    zoom: 12,
    geojsonUrl:
      "https://tcohgcmobudcnlohjbuv.supabase.co/storage/v1/object/public/critical-facilities/command-and-response-centers/police-stations/by-country/tuvalu_police_stations.geojson",
  },
  Uganda: {
    name: "Uganda",
    center: [32.2903, 1.3733], // Approx Kampala
    zoom: 7,
    geojsonUrl:
      "https://tcohgcmobudcnlohjbuv.supabase.co/storage/v1/object/public/critical-facilities/command-and-response-centers/police-stations/by-country/uganda_police_stations.geojson",
  },
  "United Kingdom": {
    name: "United Kingdom",
    center: [-3.436, 55.3781], // Approx center of UK
    zoom: 5,
    geojsonUrl:
      "https://tcohgcmobudcnlohjbuv.supabase.co/storage/v1/object/public/critical-facilities/command-and-response-centers/police-stations/by-country/united-kingdom_police_stations.geojson",
  },
  "United States Virgin Islands": {
    name: "United States Virgin Islands",
    center: [-64.8963, 17.7215], // Approx Charlotte Amalie
    zoom: 11,
    geojsonUrl:
      "https://tcohgcmobudcnlohjbuv.supabase.co/storage/v1/object/public/critical-facilities/command-and-response-centers/police-stations/by-country/united-states-virgin-islands_police_stations.geojson",
  },
  Uruguay: {
    name: "Uruguay",
    center: [-55.7658, -32.5228], // Approx Montevideo
    zoom: 7,
    geojsonUrl:
      "https://tcohgcmobudcnlohjbuv.supabase.co/storage/v1/object/public/critical-facilities/command-and-response-centers/police-stations/by-country/uruguay_police_stations.geojson",
  },
  Vanuatu: {
    name: "Vanuatu",
    center: [166.9592, -15.3767], // Approx Port Vila
    zoom: 9,
    geojsonUrl:
      "https://tcohgcmobudcnlohjbuv.supabase.co/storage/v1/object/public/critical-facilities/command-and-response-centers/police-stations/by-country/vanuatu_police_stations.geojson",
  },
  Venezuela: {
    name: "Venezuela",
    center: [-66.5897, 6.4238], // Approx Caracas
    zoom: 6,
    geojsonUrl:
      "https://tcohgcmobudcnlohjbuv.supabase.co/storage/v1/object/public/critical-facilities/command-and-response-centers/police-stations/by-country/venezuela_police_stations.geojson",
  },
  Zambia: {
    name: "Zambia",
    center: [27.8546, -13.1339], // Approx Lusaka
    zoom: 6,
    geojsonUrl:
      "https://tcohgcmobudcnlohjbuv.supabase.co/storage/v1/object/public/critical-facilities/command-and-response-centers/police-stations/by-country/zambia_police_stations.geojson",
  },
  Zimbabwe: {
    name: "Zimbabwe",
    center: [29.1549, -19.0154], // Approx Harare
    zoom: 7,
    geojsonUrl:
      "https://tcohgcmobudcnlohjbuv.supabase.co/storage/v1/object/public/critical-facilities/command-and-response-centers/police-stations/by-country/zimbabwe_police_stations.geojson",
  },
};
