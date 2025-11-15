// Hazard Layers Configuration
export interface HazardLayer {
  name: string;
  hazardType: string;
  scope?: string;
  source?: string;
  dataUrl: string;
}

export const hazardLayersData: HazardLayer[] = [
  // Hydro-Meteorological
  {
    name: "Flood Hazard Map - Metro Manila",
    hazardType: "Hydro-Meteorological",
    scope: "Philippines",
    source: "MGB",
    dataUrl: "https://example.com/flood-metro-manila.geojson",
  },
  {
    name: "Flood Hazard Map - Tarlac",
    hazardType: "Hydro-Meteorological",
    scope: "Philippines",
    source: "MGB",
    dataUrl: "https://example.com/flood-tarlac.geojson",
  },
  {
    name: "Flood Hazard Map - Apayao",
    hazardType: "Hydro-Meteorological",
    scope: "Philippines",
    source: "MGB",
    dataUrl: "https://example.com/flood-apayao.geojson",
  },
  {
    name: "Weather Data - Philippines",
    hazardType: "Hydro-Meteorological",
    scope: "Philippines",
    source: "Open-Meteo",
    dataUrl: "https://example.com/weather-philippines.geojson",
  },
  {
    name: "Weather Data - USA",
    hazardType: "Hydro-Meteorological",
    scope: "USA",
    source: "Open-Meteo",
    dataUrl: "https://example.com/weather-usa.geojson",
  },
  {
    name: "Typhoon Track - Haiyan",
    hazardType: "Hydro-Meteorological",
    scope: "Philippines",
    source: "PAGASA",
    dataUrl: "https://example.com/typhoon-haiyan.geojson",
  },
  {
    name: "Rainfall Intensity Map",
    hazardType: "Hydro-Meteorological",
    scope: "Philippines",
    source: "NOAH",
    dataUrl: "https://example.com/rainfall-intensity.geojson",
  },

  // Geological
  {
    name: "Earthquake Epicenters - Global",
    hazardType: "Geological",
    scope: "Global",
    source: "USGS",
    dataUrl: "https://example.com/earthquake-global.geojson",
  },
  {
    name: "Fault Lines - Philippines",
    hazardType: "Geological",
    scope: "Philippines",
    source: "PHIVOLCS",
    dataUrl: "https://example.com/fault-lines-philippines.geojson",
  },
  {
    name: "Volcanic Hazard Zones",
    hazardType: "Geological",
    scope: "Philippines",
    source: "PHIVOLCS",
    dataUrl: "https://example.com/volcanic-hazard.geojson",
  },
  {
    name: "Landslide Susceptibility",
    hazardType: "Geological",
    scope: "Philippines",
    source: "MGB",
    dataUrl: "https://example.com/landslide-susceptibility.geojson",
  },
  {
    name: "Tsunami Hazard Zones",
    hazardType: "Geological",
    scope: "Philippines",
    source: "PHIVOLCS",
    dataUrl: "https://example.com/tsunami-hazard.geojson",
  },

  // Traffic Incidents
  {
    name: "Road Accidents - Metro Manila",
    hazardType: "Traffic",
    scope: "Philippines",
    source: "MMDA",
    dataUrl: "https://example.com/road-accidents.geojson",
  },
  {
    name: "Traffic Congestion Points",
    hazardType: "Traffic",
    scope: "Philippines",
    source: "MMDA",
    dataUrl: "https://example.com/traffic-congestion.geojson",
  },
  {
    name: "Road Closures",
    hazardType: "Traffic",
    scope: "Philippines",
    source: "DPWH",
    dataUrl: "https://example.com/road-closures.geojson",
  },
];
