export interface FireStationStateConfig {
  name: string;
  center: [number, number]; // [lng, lat]
  zoom: number;
  geojsonUrl: string;
}

export const USFireStationsByState: Record<string, FireStationStateConfig> = {
  Alabama: {
    name: "Alabama",
    center: [-86.8073, 32.3617],
    zoom: 7,
    geojsonUrl:
      "https://tcohgcmobudcnlohjbuv.supabase.co/storage/v1/object/public/critical-facilities/command-and-response-centers/fire-stations/by-division/United%20States%20of%20America/by-state/alabama_fire_stations.geojson",
  },
  Alaska: {
    name: "Alaska",
    center: [-153.0063, 64.0685],
    zoom: 4,
    geojsonUrl:
      "https://tcohgcmobudcnlohjbuv.supabase.co/storage/v1/object/public/critical-facilities/command-and-response-centers/fire-stations/by-division/United%20States%20of%20America/by-state/alaska_fire_stations.geojson",
  },
  Arizona: {
    name: "Arizona",
    center: [-111.6602, 34.2744],
    zoom: 6,
    geojsonUrl:
      "https://tcohgcmobudcnlohjbuv.supabase.co/storage/v1/object/public/critical-facilities/command-and-response-centers/fire-stations/by-division/United%20States%20of%20America/by-state/arizona_fire_stations.geojson",
  },
  Arkansas: {
    name: "Arkansas",
    center: [-92.4426, 34.8938],
    zoom: 7,
    geojsonUrl:
      "https://tcohgcmobudcnlohjbuv.supabase.co/storage/v1/object/public/critical-facilities/command-and-response-centers/fire-stations/by-division/United%20States%20of%20America/by-state/arkansas_fire_stations.geojson",
  },
  California: {
    name: "California",
    center: [-119.773, 36.7783],
    zoom: 5,
    geojsonUrl:
      "https://tcohgcmobudcnlohjbuv.supabase.co/storage/v1/object/public/critical-facilities/command-and-response-centers/fire-stations/by-division/United%20States%20of%20America/by-state/california_fire_stations.geojson",
  },
  Connecticut: {
    name: "Connecticut",
    center: [-72.7273, 41.6032],
    zoom: 9,
    geojsonUrl:
      "https://tcohgcmobudcnlohjbuv.supabase.co/storage/v1/object/public/critical-facilities/command-and-response-centers/fire-stations/by-division/United%20States%20of%20America/by-state/connecticut_fire_stations.geojson",
  },
  Delaware: {
    name: "Delaware",
    center: [-75.5277, 39.1573],
    zoom: 9,
    geojsonUrl:
      "https://tcohgcmobudcnlohjbuv.supabase.co/storage/v1/object/public/critical-facilities/command-and-response-centers/fire-stations/by-division/United%20States%20of%20America/by-state/delaware_fire_stations.geojson",
  },
  "District of Columbia": {
    name: "District of Columbia",
    center: [-77.0369, 38.9072],
    zoom: 11,
    geojsonUrl:
      "https://tcohgcmobudcnlohjbuv.supabase.co/storage/v1/object/public/critical-facilities/command-and-response-centers/fire-stations/by-division/United%20States%20of%20America/by-state/district-of-columbia_fire_stations.geojson",
  },
  Florida: {
    name: "Florida",
    center: [-81.5158, 27.6648],
    zoom: 6,
    geojsonUrl:
      "https://tcohgcmobudcnlohjbuv.supabase.co/storage/v1/object/public/critical-facilities/command-and-response-centers/fire-stations/by-division/United%20States%20of%20America/by-state/florida_fire_stations.geojson",
  },
  Georgia: {
    name: "Georgia",
    center: [-83.1137, 32.3617],
    zoom: 7,
    geojsonUrl:
      "https://tcohgcmobudcnlohjbuv.supabase.co/storage/v1/object/public/critical-facilities/command-and-response-centers/fire-stations/by-division/United%20States%20of%20America/by-state/georgia_fire_stations.geojson",
  },
  Hawaii: {
    name: "Hawaii",
    center: [-155.5828, 19.8968],
    zoom: 7,
    geojsonUrl:
      "https://tcohgcmobudcnlohjbuv.supabase.co/storage/v1/object/public/critical-facilities/command-and-response-centers/fire-stations/by-division/United%20States%20of%20America/by-state/hawaii_fire_stations.geojson",
  },
  Idaho: {
    name: "Idaho",
    center: [-114.742, 44.0682],
    zoom: 6,
    geojsonUrl:
      "https://tcohgcmobudcnlohjbuv.supabase.co/storage/v1/object/public/critical-facilities/command-and-response-centers/fire-stations/by-division/United%20States%20of%20America/by-state/idaho_fire_stations.geojson",
  },
  Illinois: {
    name: "Illinois",
    center: [-89.3985, 40.6331],
    zoom: 7,
    geojsonUrl:
      "https://tcohgcmobudcnlohjbuv.supabase.co/storage/v1/object/public/critical-facilities/command-and-response-centers/fire-stations/by-division/United%20States%20of%20America/by-state/illinois_fire_stations.geojson",
  },
  Indiana: {
    name: "Indiana",
    center: [-86.2816, 39.8647],
    zoom: 7,
    geojsonUrl:
      "https://tcohgcmobudcnlohjbuv.supabase.co/storage/v1/object/public/critical-facilities/command-and-response-centers/fire-stations/by-division/United%20States%20of%20America/by-state/indiana_fire_stations.geojson",
  },
  Iowa: {
    name: "Iowa",
    center: [-93.0977, 41.9216],
    zoom: 7,
    geojsonUrl:
      "https://tcohgcmobudcnlohjbuv.supabase.co/storage/v1/object/public/critical-facilities/command-and-response-centers/fire-stations/by-division/United%20States%20of%20America/by-state/iowa_fire_stations.geojson",
  },
  Kansas: {
    name: "Kansas",
    center: [-98.4842, 38.5111],
    zoom: 7,
    geojsonUrl:
      "https://tcohgcmobudcnlohjbuv.supabase.co/storage/v1/object/public/critical-facilities/command-and-response-centers/fire-stations/by-division/United%20States%20of%20America/by-state/kansas_fire_stations.geojson",
  },
  Kentucky: {
    name: "Kentucky",
    center: [-84.7674, 37.8393],
    zoom: 7,
    geojsonUrl:
      "https://tcohgcmobudcnlohjbuv.supabase.co/storage/v1/object/public/critical-facilities/command-and-response-centers/fire-stations/by-division/United%20States%20of%20America/by-state/kentucky_fire_stations.geojson",
  },
  Louisiana: {
    name: "Louisiana",
    center: [-91.9623, 30.9843],
    zoom: 7,
    geojsonUrl:
      "https://tcohgcmobudcnlohjbuv.supabase.co/storage/v1/object/public/critical-facilities/command-and-response-centers/fire-stations/by-division/United%20States%20of%20America/by-state/louisiana_fire_stations.geojson",
  },
  Maine: {
    name: "Maine",
    center: [-69.4455, 45.4695],
    zoom: 7,
    geojsonUrl:
      "https://tcohgcmobudcnlohjbuv.supabase.co/storage/v1/object/public/critical-facilities/command-and-response-centers/fire-stations/by-division/United%20States%20of%20America/by-state/maine_fire_stations.geojson",
  },
  Maryland: {
    name: "Maryland",
    center: [-76.6413, 39.0458],
    zoom: 8,
    geojsonUrl:
      "https://tcohgcmobudcnlohjbuv.supabase.co/storage/v1/object/public/critical-facilities/command-and-response-centers/fire-stations/by-division/United%20States%20of%20America/by-state/maryland_fire_stations.geojson",
  },
  Massachusetts: {
    name: "Massachusetts",
    center: [-71.3824, 42.2373],
    zoom: 8,
    geojsonUrl:
      "https://tcohgcmobudcnlohjbuv.supabase.co/storage/v1/object/public/critical-facilities/command-and-response-centers/fire-stations/by-division/United%20States%20of%20America/by-state/massachusetts_fire_stations.geojson",
  },
  Michigan: {
    name: "Michigan",
    center: [-85.6024, 44.3467],
    zoom: 6,
    geojsonUrl:
      "https://tcohgcmobudcnlohjbuv.supabase.co/storage/v1/object/public/critical-facilities/command-and-response-centers/fire-stations/by-division/United%20States%20of%20America/by-state/michigan_fire_stations.geojson",
  },
  Minnesota: {
    name: "Minnesota",
    center: [-94.6859, 46.3296],
    zoom: 6,
    geojsonUrl:
      "https://tcohgcmobudcnlohjbuv.supabase.co/storage/v1/object/public/critical-facilities/command-and-response-centers/fire-stations/by-division/United%20States%20of%20America/by-state/minnesota_fire_stations.geojson",
  },
  Mississippi: {
    name: "Mississippi",
    center: [-89.3985, 32.7673],
    zoom: 7,
    geojsonUrl:
      "https://tcohgcmobudcnlohjbuv.supabase.co/storage/v1/object/public/critical-facilities/command-and-response-centers/fire-stations/by-division/United%20States%20of%20America/by-state/mississippi_fire_stations.geojson",
  },
  Missouri: {
    name: "Missouri",
    center: [-91.8318, 38.5767],
    zoom: 7,
    geojsonUrl:
      "https://tcohgcmobudcnlohjbuv.supabase.co/storage/v1/object/public/critical-facilities/command-and-response-centers/fire-stations/by-division/United%20States%20of%20America/by-state/missouri_fire_stations.geojson",
  },
  Montana: {
    name: "Montana",
    center: [-110.3626, 46.8059],
    zoom: 6,
    geojsonUrl:
      "https://tcohgcmobudcnlohjbuv.supabase.co/storage/v1/object/public/critical-facilities/command-and-response-centers/fire-stations/by-division/United%20States%20of%20America/by-state/montana_fire_stations.geojson",
  },
  Nebraska: {
    name: "Nebraska",
    center: [-99.9018, 41.4925],
    zoom: 7,
    geojsonUrl:
      "https://tcohgcmobudcnlohjbuv.supabase.co/storage/v1/object/public/critical-facilities/command-and-response-centers/fire-stations/by-division/United%20States%20of%20America/by-state/nebraska_fire_stations.geojson",
  },
  Nevada: {
    name: "Nevada",
    center: [-116.4194, 38.8026],
    zoom: 6,
    geojsonUrl:
      "https://tcohgcmobudcnlohjbuv.supabase.co/storage/v1/object/public/critical-facilities/command-and-response-centers/fire-stations/by-division/United%20States%20of%20America/by-state/nevada_fire_stations.geojson",
  },
  "New Hampshire": {
    name: "New Hampshire",
    center: [-71.5376, 43.6805],
    zoom: 8,
    geojsonUrl:
      "https://tcohgcmobudcnlohjbuv.supabase.co/storage/v1/object/public/critical-facilities/command-and-response-centers/fire-stations/by-division/United%20States%20of%20America/by-state/new-hampshire_fire_stations.geojson",
  },
  "New Jersey": {
    name: "New Jersey",
    center: [-74.4057, 40.0583],
    zoom: 8,
    geojsonUrl:
      "https://tcohgcmobudcnlohjbuv.supabase.co/storage/v1/object/public/critical-facilities/command-and-response-centers/fire-stations/by-division/United%20States%20of%20America/by-state/new-jersey_fire_stations.geojson",
  },
  "New Mexico": {
    name: "New Mexico",
    center: [-105.9378, 34.5199],
    zoom: 6,
    geojsonUrl:
      "https://tcohgcmobudcnlohjbuv.supabase.co/storage/v1/object/public/critical-facilities/command-and-response-centers/fire-stations/by-division/United%20States%20of%20America/by-state/new-mexico_fire_stations.geojson",
  },
  "New York": {
    name: "New York",
    center: [-75.1449, 43.2994],
    zoom: 7,
    geojsonUrl:
      "https://tcohgcmobudcnlohjbuv.supabase.co/storage/v1/object/public/critical-facilities/command-and-response-centers/fire-stations/by-division/United%20States%20of%20America/by-state/new-york_fire_stations.geojson",
  },
  "North Carolina": {
    name: "North Carolina",
    center: [-79.0193, 35.7596],
    zoom: 7,
    geojsonUrl:
      "https://tcohgcmobudcnlohjbuv.supabase.co/storage/v1/object/public/critical-facilities/command-and-response-centers/fire-stations/by-division/United%20States%20of%20America/by-state/north-carolina_fire_stations.geojson",
  },
  "North Dakota": {
    name: "North Dakota",
    center: [-101.002, 47.5515],
    zoom: 7,
    geojsonUrl:
      "https://tcohgcmobudcnlohjbuv.supabase.co/storage/v1/object/public/critical-facilities/command-and-response-centers/fire-stations/by-division/United%20States%20of%20America/by-state/north-dakota_fire_stations.geojson",
  },
  Ohio: {
    name: "Ohio",
    center: [-82.7937, 40.2677],
    zoom: 7,
    geojsonUrl:
      "https://tcohgcmobudcnlohjbuv.supabase.co/storage/v1/object/public/critical-facilities/command-and-response-centers/fire-stations/by-division/United%20States%20of%20America/by-state/ohio_fire_stations.geojson",
  },
  Oklahoma: {
    name: "Oklahoma",
    center: [-97.5348, 35.4676],
    zoom: 7,
    geojsonUrl:
      "https://tcohgcmobudcnlohjbuv.supabase.co/storage/v1/object/public/critical-facilities/command-and-response-centers/fire-stations/by-division/United%20States%20of%20America/by-state/oklahoma_fire_stations.geojson",
  },
  Oregon: {
    name: "Oregon",
    center: [-120.5542, 43.9336],
    zoom: 6,
    geojsonUrl:
      "https://tcohgcmobudcnlohjbuv.supabase.co/storage/v1/object/public/critical-facilities/command-and-response-centers/fire-stations/by-division/United%20States%20of%20America/by-state/oregon_fire_stations.geojson",
  },
  Pennsylvania: {
    name: "Pennsylvania",
    center: [-77.1945, 41.2033],
    zoom: 7,
    geojsonUrl:
      "https://tcohgcmobudcnlohjbuv.supabase.co/storage/v1/object/public/critical-facilities/command-and-response-centers/fire-stations/by-division/United%20States%20of%20America/by-state/pennsylvania_fire_stations.geojson",
  },
  "Rhode Island": {
    name: "Rhode Island",
    center: [-71.4774, 41.6762],
    zoom: 10,
    geojsonUrl:
      "https://tcohgcmobudcnlohjbuv.supabase.co/storage/v1/object/public/critical-facilities/command-and-response-centers/fire-stations/by-division/United%20States%20of%20America/by-state/rhode-island_fire_stations.geojson",
  },
  "South Carolina": {
    name: "South Carolina",
    center: [-81.1637, 33.8361],
    zoom: 8,
    geojsonUrl:
      "https://tcohgcmobudcnlohjbuv.supabase.co/storage/v1/object/public/critical-facilities/command-and-response-centers/fire-stations/by-division/United%20States%20of%20America/by-state/south-carolina_fire_stations.geojson",
  },
  "South Dakota": {
    name: "South Dakota",
    center: [-99.9018, 43.9695],
    zoom: 7,
    geojsonUrl:
      "https://tcohgcmobudcnlohjbuv.supabase.co/storage/v1/object/public/critical-facilities/command-and-response-centers/fire-stations/by-division/United%20States%20of%20America/by-state/south-dakota_fire_stations.geojson",
  },
  Tennessee: {
    name: "Tennessee",
    center: [-86.7816, 35.7678],
    zoom: 7,
    geojsonUrl:
      "https://tcohgcmobudcnlohjbuv.supabase.co/storage/v1/object/public/critical-facilities/command-and-response-centers/fire-stations/by-division/United%20States%20of%20America/by-state/tennessee_fire_stations.geojson",
  },
  Texas: {
    name: "Texas",
    center: [-99.9018, 31.9686],
    zoom: 5,
    geojsonUrl:
      "https://tcohgcmobudcnlohjbuv.supabase.co/storage/v1/object/public/critical-facilities/command-and-response-centers/fire-stations/by-division/United%20States%20of%20America/by-state/texas_fire_stations.geojson",
  },
  Utah: {
    name: "Utah",
    center: [-111.0937, 39.321],
    zoom: 7,
    geojsonUrl:
      "https://tcohgcmobudcnlohjbuv.supabase.co/storage/v1/object/public/critical-facilities/command-and-response-centers/fire-stations/by-division/United%20States%20of%20America/by-state/utah_fire_stations.geojson",
  },
  Vermont: {
    name: "Vermont",
    center: [-72.8108, 44.2601],
    zoom: 8,
    geojsonUrl:
      "https://tcohgcmobudcnlohjbuv.supabase.co/storage/v1/object/public/critical-facilities/command-and-response-centers/fire-stations/by-division/United%20States%20of%20America/by-state/vermont_fire_stations.geojson",
  },
  Virginia: {
    name: "Virginia",
    center: [-78.6569, 37.4316],
    zoom: 7,
    geojsonUrl:
      "https://tcohgcmobudcnlohjbuv.supabase.co/storage/v1/object/public/critical-facilities/command-and-response-centers/fire-stations/by-division/United%20States%20of%20America/by-state/virginia_fire_stations.geojson",
  },
  Washington: {
    name: "Washington",
    center: [-120.7401, 47.7511],
    zoom: 6,
    geojsonUrl:
      "https://tcohgcmobudcnlohjbuv.supabase.co/storage/v1/object/public/critical-facilities/command-and-response-centers/fire-stations/by-division/United%20States%20of%20America/by-state/washington_fire_stations.geojson",
  },
  "West Virginia": {
    name: "West Virginia",
    center: [-80.6665, 38.8489],
    zoom: 8,
    geojsonUrl:
      "https://tcohgcmobudcnlohjbuv.supabase.co/storage/v1/object/public/critical-facilities/command-and-response-centers/fire-stations/by-division/United%20States%20of%20America/by-state/west-virginia_fire_stations.geojson",
  },
  Wisconsin: {
    name: "Wisconsin",
    center: [-89.9941, 44.6243],
    zoom: 7,
    geojsonUrl:
      "https://tcohgcmobudcnlohjbuv.supabase.co/storage/v1/object/public/critical-facilities/command-and-response-centers/fire-stations/by-division/United%20States%20of%20America/by-state/wisconsin_fire_stations.geojson",
  },
  Wyoming: {
    name: "Wyoming",
    center: [-107.2903, 43.0642],
    zoom: 7,
    geojsonUrl:
      "https://tcohgcmobudcnlohjbuv.supabase.co/storage/v1/object/public/critical-facilities/command-and-response-centers/fire-stations/by-division/United%20States%20of%20America/by-state/wyoming_fire_stations.geojson",
  },
};
