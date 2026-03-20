// \SafeGIS\Simulation-Studio\frontend\src\components\controls\Features\Maps\Critical Facility Layers\EmergencyShelters.tsx
export interface EmergencyShelterConfig {
  name: string;
  center: [number, number]; // [lng, lat]
  zoom: number;
  geojsonUrl: string;
}

export const emergencyShelters: Record<string, EmergencyShelterConfig> = {
  Andorra: {
    name: "Andorra",
    center: [1.5211, 42.5078], // Approx Andorra la Vella
    zoom: 11,
    geojsonUrl:
      "https://tcohgcmobudcnlohjbuv.supabase.co/storage/v1/object/public/critical-facilities/emergency-shelters/by-country/andorra_evacuation_areas.geojson",
  },
  Angola: {
    name: "Angola",
    center: [17.8739, -11.2027], // Approx Luanda
    zoom: 5,
    geojsonUrl:
      "https://tcohgcmobudcnlohjbuv.supabase.co/storage/v1/object/public/critical-facilities/emergency-shelters/by-country/angola_evacuation_areas.geojson",
  },
  Argentina: {
    name: "Argentina",
    center: [-58.3816, -34.6037], // Approx Buenos Aires
    zoom: 4,
    geojsonUrl:
      "https://tcohgcmobudcnlohjbuv.supabase.co/storage/v1/object/public/critical-facilities/emergency-shelters/by-country/argentina_evacuation_areas.geojson",
  },
  Australia: {
    name: "Australia",
    center: [133.7751, -25.2744], // Approx center of Australia
    zoom: 4,
    geojsonUrl:
      "https://tcohgcmobudcnlohjbuv.supabase.co/storage/v1/object/public/critical-facilities/emergency-shelters/by-country/australia_evacuation_areas.geojson",
  },
  Barbados: {
    name: "Barbados",
    center: [-59.5250305, 13.1500331],
    zoom: 11,
    geojsonUrl:
      "https://tcohgcmobudcnlohjbuv.supabase.co/storage/v1/object/public/critical-facilities/emergency-shelters/by-country/barbados_evacuation_areas.geojson",
  },
  Belize: {
    name: "Belize",
    center: [-88.6859028, 17.1204943],
    zoom: 8,
    geojsonUrl:
      "https://tcohgcmobudcnlohjbuv.supabase.co/storage/v1/object/public/critical-facilities/emergency-shelters/by-country/belize_evacuation_areas.geojson",
  },
  Bolivia: {
    name: "Bolivia",
    center: [-63.5886527, -16.2901549],
    zoom: 5,
    geojsonUrl:
      "https://tcohgcmobudcnlohjbuv.supabase.co/storage/v1/object/public/critical-facilities/emergency-shelters/by-country/bolivia_evacuation_areas.geojson",
  },
  Botswana: {
    name: "Botswana",
    center: [24.684866, -22.328474],
    zoom: 6,
    geojsonUrl:
      "https://tcohgcmobudcnlohjbuv.supabase.co/storage/v1/object/public/critical-facilities/emergency-shelters/by-country/botswana_evacuation_areas.geojson",
  },
  "Burkina Faso": {
    name: "Burkina Faso",
    center: [-1.5615931, 12.238333],
    zoom: 7,
    geojsonUrl:
      "https://tcohgcmobudcnlohjbuv.supabase.co/storage/v1/object/public/critical-facilities/emergency-shelters/by-country/burkina-faso_evacuation_areas.geojson",
  },
  Burundi: {
    name: "Burundi",
    center: [29.918886, -3.373056],
    zoom: 9,
    geojsonUrl:
      "https://tcohgcmobudcnlohjbuv.supabase.co/storage/v1/object/public/critical-facilities/emergency-shelters/by-country/burundi_evacuation_areas.geojson",
  },
  "Cabo Verde": {
    name: "Cabo Verde",
    center: [-23.6167, 15.1201],
    zoom: 7,
    geojsonUrl:
      "https://tcohgcmobudcnlohjbuv.supabase.co/storage/v1/object/public/critical-facilities/emergency-shelters/by-country/cabo-verde_evacuation_areas.geojson",
  },
  "Cayman Islands": {
    name: "Cayman Islands",
    center: [-80.5636, 19.3133],
    zoom: 10,
    geojsonUrl:
      "https://tcohgcmobudcnlohjbuv.supabase.co/storage/v1/object/public/critical-facilities/emergency-shelters/by-country/cayman-islands_evacuation_areas.geojson",
  },
  Chile: {
    name: "Chile",
    center: [-71.3187697, -31.7613365],
    zoom: 4,
    geojsonUrl:
      "https://tcohgcmobudcnlohjbuv.supabase.co/storage/v1/object/public/critical-facilities/emergency-shelters/by-country/chile_evacuation_areas.geojson",
  },
  Colombia: {
    name: "Colombia",
    center: [-74.2973328, 4.5709],
    zoom: 5,
    geojsonUrl:
      "https://tcohgcmobudcnlohjbuv.supabase.co/storage/v1/object/public/critical-facilities/emergency-shelters/by-country/colombia_evacuation_areas.geojson",
  },
  "Costa Rica": {
    name: "Costa Rica",
    center: [-84.090725, 9.7489],
    zoom: 8,
    geojsonUrl:
      "https://tcohgcmobudcnlohjbuv.supabase.co/storage/v1/object/public/critical-facilities/emergency-shelters/by-country/costa-rica_evacuation_areas.geojson",
  },
  Cuba: {
    name: "Cuba",
    center: [-77.781167, 21.521757],
    zoom: 7,
    geojsonUrl:
      "https://tcohgcmobudcnlohjbuv.supabase.co/storage/v1/object/public/critical-facilities/emergency-shelters/by-country/cuba_evacuation_areas.geojson",
  },
  Dominica: {
    name: "Dominica",
    center: [-61.37097, 15.414999],
    zoom: 11,
    geojsonUrl:
      "https://tcohgcmobudcnlohjbuv.supabase.co/storage/v1/object/public/critical-facilities/emergency-shelters/by-country/dominica_evacuation_areas.geojson",
  },
  Ecuador: {
    name: "Ecuador",
    center: [-78.1834, -1.8312],
    zoom: 6,
    geojsonUrl:
      "https://tcohgcmobudcnlohjbuv.supabase.co/storage/v1/object/public/critical-facilities/emergency-shelters/by-country/ecuador_evacuation_areas.geojson",
  },
  "El Salvador": {
    name: "El Salvador",
    center: [-88.89653, 13.794185],
    zoom: 9,
    geojsonUrl:
      "https://tcohgcmobudcnlohjbuv.supabase.co/storage/v1/object/public/critical-facilities/emergency-shelters/by-country/el-salvador_evacuation_areas.geojson",
  },
  Gabon: {
    name: "Gabon",
    center: [11.609444, -0.803689],
    zoom: 6,
    geojsonUrl:
      "https://tcohgcmobudcnlohjbuv.supabase.co/storage/v1/object/public/critical-facilities/emergency-shelters/by-country/gabon_evacuation_areas.geojson",
  },
  Ghana: {
    name: "Ghana",
    center: [-1.023194, 7.946527],
    zoom: 7,
    geojsonUrl:
      "https://tcohgcmobudcnlohjbuv.supabase.co/storage/v1/object/public/critical-facilities/emergency-shelters/by-country/ghana_evacuation_areas.geojson",
  },
  Gibraltar: {
    name: "Gibraltar",
    center: [-5.3366, 36.1408],
    zoom: 14,
    geojsonUrl:
      "https://tcohgcmobudcnlohjbuv.supabase.co/storage/v1/object/public/critical-facilities/emergency-shelters/by-country/gibraltar_evacuation_areas.geojson",
  },
  Grenada: {
    name: "Grenada",
    center: [-61.679, 12.2628],
    zoom: 11,
    geojsonUrl:
      "https://tcohgcmobudcnlohjbuv.supabase.co/storage/v1/object/public/critical-facilities/emergency-shelters/by-country/grenada_evacuation_areas.geojson",
  },
  Guadeloupe: {
    name: "Guadeloupe",
    center: [-61.551, 16.265],
    zoom: 10,
    geojsonUrl:
      "https://tcohgcmobudcnlohjbuv.supabase.co/storage/v1/object/public/critical-facilities/emergency-shelters/by-country/guadeloupe_evacuation_areas.geojson",
  },
  Guam: {
    name: "Guam",
    center: [144.7937, 13.4443],
    zoom: 11,
    geojsonUrl:
      "https://tcohgcmobudcnlohjbuv.supabase.co/storage/v1/object/public/critical-facilities/emergency-shelters/by-country/guam_evacuation_areas.geojson",
  },
  Guatemala: {
    name: "Guatemala",
    center: [-90.230759, 15.783471],
    zoom: 7,
    geojsonUrl:
      "https://tcohgcmobudcnlohjbuv.supabase.co/storage/v1/object/public/critical-facilities/emergency-shelters/by-country/guatemala_evacuation_areas.geojson",
  },
  Guernsey: {
    name: "Guernsey",
    center: [-2.5356, 49.4484],
    zoom: 12,
    geojsonUrl:
      "https://tcohgcmobudcnlohjbuv.supabase.co/storage/v1/object/public/critical-facilities/emergency-shelters/by-country/guernsey_evacuation_areas.geojson",
  },
  Guyana: {
    name: "Guyana",
    center: [-58.93018, 4.860416],
    zoom: 6,
    geojsonUrl:
      "https://tcohgcmobudcnlohjbuv.supabase.co/storage/v1/object/public/critical-facilities/emergency-shelters/by-country/guyana_evacuation_areas.geojson",
  },
  Honduras: {
    name: "Honduras",
    center: [-87.517, 15.2],
    zoom: 7,
    geojsonUrl:
      "https://tcohgcmobudcnlohjbuv.supabase.co/storage/v1/object/public/critical-facilities/emergency-shelters/by-country/honduras_evacuation_areas.geojson",
  },
  India: {
    name: "India",
    center: [78.96288, 20.593684],
    zoom: 5,
    geojsonUrl:
      "https://tcohgcmobudcnlohjbuv.supabase.co/storage/v1/object/public/critical-facilities/emergency-shelters/by-country/india_evacuation_areas.geojson",
  },
  "Isle of Man": {
    name: "Isle of Man",
    center: [-4.5481, 54.2361],
    zoom: 10,
    geojsonUrl:
      "https://tcohgcmobudcnlohjbuv.supabase.co/storage/v1/object/public/critical-facilities/emergency-shelters/by-country/isle-of-man_evacuation_areas.geojson",
  },
  Jamaica: {
    name: "Jamaica",
    center: [-77.297508, 18.109581],
    zoom: 8,
    geojsonUrl:
      "https://tcohgcmobudcnlohjbuv.supabase.co/storage/v1/object/public/critical-facilities/emergency-shelters/by-country/jamaica_evacuation_areas.geojson",
  },
  Jersey: {
    name: "Jersey",
    center: [-2.1358, 49.2144],
    zoom: 12,
    geojsonUrl:
      "https://tcohgcmobudcnlohjbuv.supabase.co/storage/v1/object/public/critical-facilities/emergency-shelters/by-country/jersey_evacuation_areas.geojson",
  },
  Kenya: {
    name: "Kenya",
    center: [37.9062, -0.0236],
    zoom: 6,
    geojsonUrl:
      "https://tcohgcmobudcnlohjbuv.supabase.co/storage/v1/object/public/critical-facilities/emergency-shelters/by-country/kenya_evacuation_areas.geojson",
  },
  Lesotho: {
    name: "Lesotho",
    center: [28.233608, -29.609988],
    zoom: 8,
    geojsonUrl:
      "https://tcohgcmobudcnlohjbuv.supabase.co/storage/v1/object/public/critical-facilities/emergency-shelters/by-country/lesotho_evacuation_areas.geojson",
  },
  Liberia: {
    name: "Liberia",
    center: [-9.429499, 6.428055],
    zoom: 7,
    geojsonUrl:
      "https://tcohgcmobudcnlohjbuv.supabase.co/storage/v1/object/public/critical-facilities/emergency-shelters/by-country/liberia_evacuation_areas.geojson",
  },
  Liechtenstein: {
    name: "Liechtenstein",
    center: [9.5215, 47.141],
    zoom: 12,
    geojsonUrl:
      "https://tcohgcmobudcnlohjbuv.supabase.co/storage/v1/object/public/critical-facilities/emergency-shelters/by-country/liechtenstein_evacuation_areas.geojson",
  },
  Malawi: {
    name: "Malawi",
    center: [34.301525, -13.254308],
    zoom: 7,
    geojsonUrl:
      "https://tcohgcmobudcnlohjbuv.supabase.co/storage/v1/object/public/critical-facilities/emergency-shelters/by-country/malawi_evacuation_areas.geojson",
  },
  Malaysia: {
    name: "Malaysia",
    center: [101.975769, 4.210484],
    zoom: 6,
    geojsonUrl:
      "https://tcohgcmobudcnlohjbuv.supabase.co/storage/v1/object/public/critical-facilities/emergency-shelters/by-country/malaysia_evacuation_areas.geojson",
  },
  Mali: {
    name: "Mali",
    center: [-3.996166, 17.570692],
    zoom: 5,
    geojsonUrl:
      "https://tcohgcmobudcnlohjbuv.supabase.co/storage/v1/object/public/critical-facilities/emergency-shelters/by-country/mali_evacuation_areas.geojson",
  },
  Malta: {
    name: "Malta",
    center: [14.5146, 35.899],
    zoom: 11,
    geojsonUrl:
      "https://tcohgcmobudcnlohjbuv.supabase.co/storage/v1/object/public/critical-facilities/emergency-shelters/by-country/malta_evacuation_areas.geojson",
  },
  Martinique: {
    name: "Martinique",
    center: [-61.024174, 14.641528],
    zoom: 10,
    geojsonUrl:
      "https://tcohgcmobudcnlohjbuv.supabase.co/storage/v1/object/public/critical-facilities/emergency-shelters/by-country/martinique_evacuation_areas.geojson",
  },
  Mayotte: {
    name: "Mayotte",
    center: [45.166244, -12.8275],
    zoom: 11,
    geojsonUrl:
      "https://tcohgcmobudcnlohjbuv.supabase.co/storage/v1/object/public/critical-facilities/emergency-shelters/by-country/mayotte_evacuation_areas.geojson",
  },
  Micronesia: {
    name: "Micronesia",
    center: [150.550812, 7.425554],
    zoom: 7,
    geojsonUrl:
      "https://tcohgcmobudcnlohjbuv.supabase.co/storage/v1/object/public/critical-facilities/emergency-shelters/by-country/micronesia_evacuation_areas.geojson",
  },
  Moldova: {
    name: "Moldova",
    center: [28.369885, 47.411631],
    zoom: 8,
    geojsonUrl:
      "https://tcohgcmobudcnlohjbuv.supabase.co/storage/v1/object/public/critical-facilities/emergency-shelters/by-country/moldova_evacuation_areas.geojson",
  },
  Monaco: {
    name: "Monaco",
    center: [7.4167, 43.7384],
    zoom: 14,
    geojsonUrl:
      "https://tcohgcmobudcnlohjbuv.supabase.co/storage/v1/object/public/critical-facilities/emergency-shelters/by-country/monaco_evacuation_areas.geojson",
  },
  Montserrat: {
    name: "Montserrat",
    center: [-62.1871, 16.7425],
    zoom: 12,
    geojsonUrl:
      "https://tcohgcmobudcnlohjbuv.supabase.co/storage/v1/object/public/critical-facilities/emergency-shelters/by-country/montserrat_evacuation_areas.geojson",
  },
  Namibia: {
    name: "Namibia",
    center: [18.49041, -22.95764],
    zoom: 5,
    geojsonUrl:
      "https://tcohgcmobudcnlohjbuv.supabase.co/storage/v1/object/public/critical-facilities/emergency-shelters/by-country/namibia_evacuation_areas.geojson",
  },
  Nicaragua: {
    name: "Nicaragua",
    center: [-85.207229, 12.865416],
    zoom: 7,
    geojsonUrl:
      "https://tcohgcmobudcnlohjbuv.supabase.co/storage/v1/object/public/critical-facilities/emergency-shelters/by-country/nicaragua_evacuation_areas.geojson",
  },
  Niger: {
    name: "Niger",
    center: [8.081666, 17.607789],
    zoom: 5,
    geojsonUrl:
      "https://tcohgcmobudcnlohjbuv.supabase.co/storage/v1/object/public/critical-facilities/emergency-shelters/by-country/niger_evacuation_areas.geojson",
  },
  Nigeria: {
    name: "Nigeria",
    center: [8.675277, 9.081999],
    zoom: 6,
    geojsonUrl:
      "https://tcohgcmobudcnlohjbuv.supabase.co/storage/v1/object/public/critical-facilities/emergency-shelters/by-country/nigeria_evacuation_areas.geojson",
  },
  "Northern Mariana Islands": {
    name: "Northern Mariana Islands",
    center: [145.3889, 17.3308],
    zoom: 9,
    geojsonUrl:
      "https://tcohgcmobudcnlohjbuv.supabase.co/storage/v1/object/public/critical-facilities/emergency-shelters/by-country/northern-mariana-islands_evacuation_areas.geojson",
  },
  Philippines: {
    name: "Philippines",
    center: [121.774017, 12.879721],
    zoom: 6,
    geojsonUrl:
      "https://tcohgcmobudcnlohjbuv.supabase.co/storage/v1/object/public/critical-facilities/emergency-shelters/by-country/philippines_evacuation_areas.geojson",
  },
  Portugal: {
    name: "Portugal",
    center: [-8.224454, 39.399872],
    zoom: 7,
    geojsonUrl:
      "https://tcohgcmobudcnlohjbuv.supabase.co/storage/v1/object/public/critical-facilities/emergency-shelters/by-country/portugal_evacuation_areas.geojson",
  },
  "Puerto Rico": {
    name: "Puerto Rico",
    center: [-66.590149, 18.220833],
    zoom: 9,
    geojsonUrl:
      "https://tcohgcmobudcnlohjbuv.supabase.co/storage/v1/object/public/critical-facilities/emergency-shelters/by-country/puerto-rico_evacuation_areas.geojson",
  },
  Rwanda: {
    name: "Rwanda",
    center: [29.873888, -1.940278],
    zoom: 8,
    geojsonUrl:
      "https://tcohgcmobudcnlohjbuv.supabase.co/storage/v1/object/public/critical-facilities/emergency-shelters/by-country/rwanda_evacuation_areas.geojson",
  },
  "Saint Kitts and Nevis": {
    name: "Saint Kitts and Nevis",
    center: [-62.783, 17.3578],
    zoom: 11,
    geojsonUrl:
      "https://tcohgcmobudcnlohjbuv.supabase.co/storage/v1/object/public/critical-facilities/emergency-shelters/by-country/saint-kitts-and-nevis_evacuation_areas.geojson",
  },
  "Saint Lucia": {
    name: "Saint Lucia",
    center: [-60.9789, 13.9094],
    zoom: 11,
    geojsonUrl:
      "https://tcohgcmobudcnlohjbuv.supabase.co/storage/v1/object/public/critical-facilities/emergency-shelters/by-country/saint-lucia_evacuation_areas.geojson",
  },
  "Saint Vincent and the Grenadines": {
    name: "Saint Vincent and the Grenadines",
    center: [-61.2872, 12.9843],
    zoom: 10,
    geojsonUrl:
      "https://tcohgcmobudcnlohjbuv.supabase.co/storage/v1/object/public/critical-facilities/emergency-shelters/by-country/saint-vincent-and-the-grenadines_evacuation_areas.geojson",
  },
  "San Marino": {
    name: "San Marino",
    center: [12.4578, 43.9424],
    zoom: 13,
    geojsonUrl:
      "https://tcohgcmobudcnlohjbuv.supabase.co/storage/v1/object/public/critical-facilities/emergency-shelters/by-country/san-marino_evacuation_areas.geojson",
  },
  "Sierra Leone": {
    name: "Sierra Leone",
    center: [-11.779889, 8.460555],
    zoom: 7,
    geojsonUrl:
      "https://tcohgcmobudcnlohjbuv.supabase.co/storage/v1/object/public/critical-facilities/emergency-shelters/by-country/sierra-leone_evacuation_areas.geojson",
  },
  Singapore: {
    name: "Singapore",
    center: [103.819836, 1.352083],
    zoom: 11,
    geojsonUrl:
      "https://tcohgcmobudcnlohjbuv.supabase.co/storage/v1/object/public/critical-facilities/emergency-shelters/by-country/singapore_evacuation_areas.geojson",
  },
  "Solomon Islands": {
    name: "Solomon Islands",
    center: [160.156194, -9.64571],
    zoom: 7,
    geojsonUrl:
      "https://tcohgcmobudcnlohjbuv.supabase.co/storage/v1/object/public/critical-facilities/emergency-shelters/by-country/solomon-islands_evacuation_areas.geojson",
  },
  "South Africa": {
    name: "South Africa",
    center: [22.937506, -30.559482],
    zoom: 5,
    geojsonUrl:
      "https://tcohgcmobudcnlohjbuv.supabase.co/storage/v1/object/public/critical-facilities/emergency-shelters/by-country/south-africa_evacuation_areas.geojson",
  },
  "Sri Lanka": {
    name: "Sri Lanka",
    center: [80.771797, 7.873054],
    zoom: 7,
    geojsonUrl:
      "https://tcohgcmobudcnlohjbuv.supabase.co/storage/v1/object/public/critical-facilities/emergency-shelters/by-country/sri-lanka_evacuation_areas.geojson",
  },
  Suriname: {
    name: "Suriname",
    center: [-56.027783, 3.919305],
    zoom: 7,
    geojsonUrl:
      "https://tcohgcmobudcnlohjbuv.supabase.co/storage/v1/object/public/critical-facilities/emergency-shelters/by-country/suriname_evacuation_areas.geojson",
  },
  Tanzania: {
    name: "Tanzania",
    center: [34.888822, -6.369028],
    zoom: 6,
    geojsonUrl:
      "https://tcohgcmobudcnlohjbuv.supabase.co/storage/v1/object/public/critical-facilities/emergency-shelters/by-country/tanzania_evacuation_areas.geojson",
  },
  "Timor-Leste": {
    name: "Timor-Leste",
    center: [125.727539, -8.874217],
    zoom: 9,
    geojsonUrl:
      "https://tcohgcmobudcnlohjbuv.supabase.co/storage/v1/object/public/critical-facilities/emergency-shelters/by-country/timor-leste_evacuation_areas.geojson",
  },
  Togo: {
    name: "Togo",
    center: [0.824782, 8.619543],
    zoom: 7,
    geojsonUrl:
      "https://tcohgcmobudcnlohjbuv.supabase.co/storage/v1/object/public/critical-facilities/emergency-shelters/by-country/togo_evacuation_areas.geojson",
  },
  "Trinidad and Tobago": {
    name: "Trinidad and Tobago",
    center: [-61.222503, 10.691803],
    zoom: 9,
    geojsonUrl:
      "https://tcohgcmobudcnlohjbuv.supabase.co/storage/v1/object/public/critical-facilities/emergency-shelters/by-country/trinidad-and-tobago_evacuation_areas.geojson",
  },
  "Turks and Caicos Islands": {
    name: "Turks and Caicos Islands",
    center: [-71.797928, 21.694025],
    zoom: 10,
    geojsonUrl:
      "https://tcohgcmobudcnlohjbuv.supabase.co/storage/v1/object/public/critical-facilities/emergency-shelters/by-country/turks-and-caicos-islands_evacuation_areas.geojson",
  },
  Uganda: {
    name: "Uganda",
    center: [32.290275, 1.373333],
    zoom: 7,
    geojsonUrl:
      "https://tcohgcmobudcnlohjbuv.supabase.co/storage/v1/object/public/critical-facilities/emergency-shelters/by-country/uganda_evacuation_areas.geojson",
  },
  Uruguay: {
    name: "Uruguay",
    center: [-56.020202, -32.522779],
    zoom: 6,
    geojsonUrl:
      "https://tcohgcmobudcnlohjbuv.supabase.co/storage/v1/object/public/critical-facilities/emergency-shelters/by-country/uruguay_evacuation_areas.geojson",
  },
  Venuzuela: {
    name: "Venezuela",
    center: [-66.58973, 6.42375],
    zoom: 6,
    geojsonUrl:
      "https://tcohgcmobudcnlohjbuv.supabase.co/storage/v1/object/public/critical-facilities/emergency-shelters/by-country/venezuela_evacuation_areas.geojson",
  },
  Zambia: {
    name: "Zambia",
    center: [27.849332, -13.133897],
    zoom: 6,
    geojsonUrl:
      "https://tcohgcmobudcnlohjbuv.supabase.co/storage/v1/object/public/critical-facilities/emergency-shelters/by-country/zambia_evacuation_areas.geojson",
  },
  Zimbabwe: {
    name: "Zimbabwe",
    center: [29.154857, -19.015438],
    zoom: 6,
    geojsonUrl:
      "https://tcohgcmobudcnlohjbuv.supabase.co/storage/v1/object/public/critical-facilities/emergency-shelters/by-country/zimbabwe_evacuation_areas.geojson",
  },
};
