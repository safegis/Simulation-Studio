// Critical Facility Layers Configuration
export interface CriticalFacility {
  name: string;
  category: string;
  scope?: string;
  source?: string;
  dataUrl: string;
}

export const criticalFacilitiesData: CriticalFacility[] = [
  // Emergency Shelters
  {
    name: "Emergency Shelters - Philippines",
    category: "Emergency Shelters",
    scope: "Philippines",
    source: "NDRRMC",
    dataUrl: "https://example.com/shelters-philippines.geojson",
  },
  {
    name: "Emergency Shelters - India",
    category: "Emergency Shelters",
    scope: "India",
    source: "OSM",
    dataUrl: "https://example.com/shelters-india.geojson",
  },
  {
    name: "Emergency Shelters - Jamaica",
    category: "Emergency Shelters",
    scope: "Jamaica",
    source: "OSM",
    dataUrl: "https://example.com/shelters-jamaica.geojson",
  },
  {
    name: "Emergency Shelters - Costa Rica",
    category: "Emergency Shelters",
    scope: "Costa Rica",
    source: "OSM",
    dataUrl: "https://example.com/shelters-costa-rica.geojson",
  },
  {
    name: "Evacuation Centers - Metro Manila",
    category: "Emergency Shelters",
    scope: "Philippines",
    source: "MMDA",
    dataUrl: "https://example.com/evacuation-metro-manila.geojson",
  },

  // Medical / Health
  {
    name: "Hospitals - Philippines",
    category: "Medical",
    scope: "Philippines",
    source: "DOH",
    dataUrl: "https://example.com/hospitals-philippines.geojson",
  },
  {
    name: "Hospitals - Afghanistan",
    category: "Medical",
    scope: "Afghanistan",
    source: "OSM",
    dataUrl: "https://example.com/hospitals-afghanistan.geojson",
  },
  {
    name: "Health Centers - Bangladesh",
    category: "Medical",
    scope: "Bangladesh",
    source: "OSM",
    dataUrl: "https://example.com/health-centers-bangladesh.geojson",
  },
  {
    name: "Clinics - Metro Manila",
    category: "Medical",
    scope: "Philippines",
    source: "DOH",
    dataUrl: "https://example.com/clinics-metro-manila.geojson",
  },
  {
    name: "Emergency Rooms - USA",
    category: "Medical",
    scope: "USA",
    source: "OSM",
    dataUrl: "https://example.com/emergency-rooms-usa.geojson",
  },

  // Command & Response
  {
    name: "Fire Stations - Philippines",
    category: "Command & Response",
    scope: "Philippines",
    source: "BFP",
    dataUrl: "https://example.com/fire-stations-philippines.geojson",
  },
  {
    name: "Fire Stations - USA",
    category: "Command & Response",
    scope: "USA",
    source: "OSM",
    dataUrl: "https://example.com/fire-stations-usa.geojson",
  },
  {
    name: "Police Stations - Philippines",
    category: "Command & Response",
    scope: "Philippines",
    source: "PNP",
    dataUrl: "https://example.com/police-stations-philippines.geojson",
  },
  {
    name: "Police Stations - Singapore",
    category: "Command & Response",
    scope: "Singapore",
    source: "OSM",
    dataUrl: "https://example.com/police-stations-singapore.geojson",
  },
  {
    name: "Emergency Operations Center",
    category: "Command & Response",
    scope: "Philippines",
    source: "NDRRMC",
    dataUrl: "https://example.com/emergency-operations-center.geojson",
  },

  // Supply Hub / Store
  {
    name: "Relief Goods Distribution Centers",
    category: "Supply Hub",
    scope: "Philippines",
    source: "DSWD",
    dataUrl: "https://example.com/relief-goods-centers.geojson",
  },
  {
    name: "Warehouses - Metro Manila",
    category: "Supply Hub",
    scope: "Philippines",
    source: "DSWD",
    dataUrl: "https://example.com/warehouses-metro-manila.geojson",
  },
  {
    name: "Food Banks",
    category: "Supply Hub",
    scope: "Philippines",
    source: "NGO",
    dataUrl: "https://example.com/food-banks.geojson",
  },

  // Public Transport
  {
    name: "Bus Terminals - Metro Manila",
    category: "Public Transport",
    scope: "Philippines",
    source: "LTFRB",
    dataUrl: "https://example.com/bus-terminals.geojson",
  },
  {
    name: "Train Stations - MRT/LRT",
    category: "Public Transport",
    scope: "Philippines",
    source: "DOTr",
    dataUrl: "https://example.com/train-stations.geojson",
  },
  {
    name: "Airports - Philippines",
    category: "Public Transport",
    scope: "Philippines",
    source: "CAAP",
    dataUrl: "https://example.com/airports-philippines.geojson",
  },
];
