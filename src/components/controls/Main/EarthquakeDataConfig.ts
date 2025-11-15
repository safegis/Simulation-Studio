export interface EarthquakeDataConfig {
  name: string;
  scope: string;
  source: string;
  dataUrl: string;
}

export const earthquakeData: EarthquakeDataConfig[] = [
  {
    name: "Latest Earthquake Information (Philippince Seismic Network)",
    scope: "Philippines",
    source: "Philippine Institute of Volcanology and Seismology (PHIVOLCS)",
    dataUrl: "http://localhost:8000/earthquakes/latest",
  },
  {
    name: "Latest Earthquakes",
    scope: "Global",
    source: "U.S. Geological Survey (USGS)",
    dataUrl: "http://localhost:8000/hazards/earthquakes?feed=all_day",
  },
];

/**
 * Fetch earthquake data from the backend API
 * @param sourceName - Name of the earthquake source to fetch
 * @returns Array of GeoJSON features ready for map display
 */
export async function fetchEarthquakeData(sourceName: string): Promise<any[]> {
  const source = earthquakeData.find((item) => item.name === sourceName);

  if (!source) {
    console.error(`Unknown earthquake source: ${sourceName}`);
    return [];
  }

  try {
    console.log(`Fetching earthquake data from: ${source.name}`);
    const response = await fetch(source.dataUrl);

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();

    // Process based on source type
    if (
      sourceName ===
      "Latest Earthquake Information (Philippince Seismic Network)"
    ) {
      return processPhilippineEarthquakeData(data);
    } else if (sourceName === "Latest Earthquakes") {
      return processUSGSEarthquakeData(data);
    }

    return [];
  } catch (error) {
    console.error(`Error fetching ${source.name}:`, error);
    console.error(
      "Make sure the backend server is running on http://localhost:8000"
    );
    return [];
  }
}

/**
 * Parse PHIVOLCS date format: "15 January 2024 - 10:25 AM"
 * Returns timestamp in milliseconds
 */
function parsePhilippinesDateTime(dateTimeStr: string): number {
  try {
    // Format: "15 January 2024 - 10:25 AM"
    // Split by " - " to separate date and time
    const parts = dateTimeStr.split(" - ");
    if (parts.length !== 2) {
      console.warn(`Invalid date format: ${dateTimeStr}`);
      return Date.now(); // Return current time as fallback
    }

    const datePart = parts[0].trim(); // "15 January 2024"
    const timePart = parts[1].trim(); // "10:25 AM"

    // Parse date part
    const dateComponents = datePart.split(" ");
    if (dateComponents.length !== 3) {
      console.warn(`Invalid date components: ${datePart}`);
      return Date.now();
    }

    const day = parseInt(dateComponents[0]);
    const monthName = dateComponents[1];
    const year = parseInt(dateComponents[2]);

    // Convert month name to number
    const months: { [key: string]: number } = {
      January: 0,
      February: 1,
      March: 2,
      April: 3,
      May: 4,
      June: 5,
      July: 6,
      August: 7,
      September: 8,
      October: 9,
      November: 10,
      December: 11,
    };

    const month = months[monthName];
    if (month === undefined) {
      console.warn(`Invalid month name: ${monthName}`);
      return Date.now();
    }

    // Parse time part
    const timeMatch = timePart.match(/(\d+):(\d+)\s*(AM|PM)/i);
    if (!timeMatch) {
      console.warn(`Invalid time format: ${timePart}`);
      return Date.now();
    }

    let hours = parseInt(timeMatch[1]);
    const minutes = parseInt(timeMatch[2]);
    const period = timeMatch[3].toUpperCase();

    // Convert to 24-hour format
    if (period === "PM" && hours !== 12) {
      hours += 12;
    } else if (period === "AM" && hours === 12) {
      hours = 0;
    }

    // Create date object (assuming Philippine Time - UTC+8)
    const date = new Date(year, month, day, hours, minutes, 0, 0);
    return date.getTime();
  } catch (error) {
    console.error(`Error parsing date: ${dateTimeStr}`, error);
    return Date.now(); // Return current time as fallback
  }
}

/**
 * Process Philippine earthquake data from PHIVOLCS
 * Transforms the scraped data into GeoJSON features
 */
function processPhilippineEarthquakeData(data: any): any[] {
  if (!data.earthquakes || !Array.isArray(data.earthquakes)) {
    console.warn("Invalid Philippine earthquake data format");
    return [];
  }

  console.log(`Processing ${data.earthquakes.length} Philippine earthquakes`);

  const features = data.earthquakes.map((eq: any) => {
    const timestamp = parsePhilippinesDateTime(eq["Date & Time (PHT)"]);

    return {
      type: "Feature",
      properties: {
        mag: parseFloat(eq.Magnitude) || 0,
        place: eq.Location || "Unknown",
        time: timestamp,
        depth: parseFloat(eq["Depth (km)"]) || 0,
        source: "PHIVOLCS",
        sourceFullName:
          "Philippine Institute of Volcanology and Seismology (PHIVOLCS)",
        dateTimeOriginal: eq["Date & Time (PHT)"], // Keep original for reference
      },
      geometry: {
        type: "Point",
        coordinates: [
          parseFloat(eq["Longitude (°E)"]) || 0,
          parseFloat(eq["Latitude (°N)"]) || 0,
          parseFloat(eq["Depth (km)"]) || 0,
        ],
      },
    };
  });

  console.log(`Transformed ${features.length} Philippine earthquake features`);
  return features;
}

/**
 * Process USGS earthquake data
 * Data is already in GeoJSON format, just validate and return
 */
function processUSGSEarthquakeData(data: any): any[] {
  if (!data.features || !Array.isArray(data.features)) {
    console.warn("Invalid USGS earthquake data format");
    return [];
  }

  console.log(`Processing ${data.features.length} USGS earthquakes`);

  // Add source identifier to each feature
  const features = data.features.map((feature: any) => ({
    ...feature,
    properties: {
      ...feature.properties,
      source: "USGS",
      sourceFullName: "U.S. Geological Survey (USGS)",
    },
  }));

  console.log(`Processed ${features.length} USGS earthquake features`);
  return features;
}

/**
 * Fetch earthquake data from multiple sources
 * @param sourceNames - Array of earthquake source names to fetch
 * @returns Combined array of GeoJSON features from all sources
 */
export async function fetchMultipleEarthquakeSources(
  sourceNames: string[]
): Promise<any[]> {
  if (sourceNames.length === 0) {
    return [];
  }

  console.log(
    `Fetching earthquake data from ${sourceNames.length} sources:`,
    sourceNames
  );

  // Fetch all sources in parallel
  const promises = sourceNames.map((sourceName) =>
    fetchEarthquakeData(sourceName)
  );

  const results = await Promise.all(promises);

  // Combine all features
  const allFeatures = results.flat();

  console.log(
    `Total earthquake features from all sources: ${allFeatures.length}`
  );

  return allFeatures;
}
