export interface WeatherDataConfig {
  name: string;
  scope: string;
  source: string;
  dataUrl: string;
}

export const weatherData: WeatherDataConfig[] = [
  {
    name: "Current Weather Condition (Philippines - By Province)",
    scope: "Philippines",
    source: "Open-Meteo",
    dataUrl: "http://localhost:8000/weather/philippines",
  },
  {
    name: "Current Weather Condition (Abra - By City/Municipality)",
    scope: "Abra",
    source: "Open-Meteo",
    dataUrl: "http://localhost:8000/weather/philippines",
  },
  {
    name: "Current Weather Condition (Agusan del Norte - By City/Municipality)",
    scope: "Agusan del Norte",
    source: "Open-Meteo",
    dataUrl: "http://localhost:8000/weather/philippines",
  },
  {
    name: "Current Weather Condition (Agusan del Sur - By City/Municipality)",
    scope: "Agusan del Sur",
    source: "Open-Meteo",
    dataUrl: "http://localhost:8000/weather/philippines",
  },
  {
    name: "Current Weather Condition (Aklan - By City/Municipality)",
    scope: "Aklan",
    source: "Open-Meteo",
    dataUrl: "http://localhost:8000/weather/philippines",
  },
];

/**
 * Weather data interface matching the backend response
 */
export interface WeatherData {
  location: string;
  province?: string;
  temperature: number;
  weatherCode: number;
  windSpeed: number;
  humidity: number;
  coordinates: [number, number];
}

/**
 * Fetch weather data from the backend API
 * @param sourceName - Name of the weather source to fetch
 * @returns Array of weather data ready for map display
 */
export async function fetchWeatherData(
  sourceName: string
): Promise<WeatherData[]> {
  const source = weatherData.find((item) => item.name === sourceName);

  if (!source) {
    console.error(`Unknown weather source: ${sourceName}`);
    return [];
  }

  try {
    console.log(`Fetching weather data from: ${source.name}`);
    const response = await fetch(source.dataUrl);

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();

    // Process based on source type
    if (
      sourceName === "Current Weather Condition (Philippines - By Province)"
    ) {
      return processPhilippinesWeatherData(data);
    } else {
      // For province-specific data, filter by province
      return processProvinceWeatherData(data, source.scope);
    }
  } catch (error) {
    console.error(`Error fetching ${source.name}:`, error);
    console.error(
      "Make sure the backend server is running on http://localhost:8000"
    );
    return [];
  }
}

/**
 * Process Philippines-wide weather data from Open-Meteo
 * Returns all provinces
 */
function processPhilippinesWeatherData(data: any[]): WeatherData[] {
  if (!Array.isArray(data)) {
    console.warn("Invalid Philippines weather data format");
    return [];
  }

  console.log(`Processing ${data.length} Philippine province weather data`);

  // Data is already in the correct format from backend
  return data;
}

/**
 * Process province-specific weather data
 * Fetches weather for all cities/municipalities in the province
 * Backend handles geocoding automatically using Geoapify API!
 */
async function processProvinceWeatherData(
  _data: any[],
  provinceName: string
): Promise<WeatherData[]> {
  console.log(
    `Fetching city/municipality weather data for province: ${provinceName}`
  );

  // Fetch weather for all cities in this province (backend handles geocoding automatically!)
  try {
    const response = await fetch(
      `http://localhost:8000/weather/province/${encodeURIComponent(
        provinceName
      )}`
    );

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const weatherData = await response.json();
    console.log(
      `Fetched weather for ${weatherData.length} cities in ${provinceName}`
    );

    return weatherData;
  } catch (error) {
    console.error(`Error fetching city weather for ${provinceName}:`, error);
    return [];
  }
}

/**
 * Fetch weather data from multiple sources
 * @param sourceNames - Array of weather source names to fetch
 * @returns Combined array of weather data from all sources
 */
export async function fetchMultipleWeatherSources(
  sourceNames: string[]
): Promise<WeatherData[]> {
  if (sourceNames.length === 0) {
    return [];
  }

  console.log(
    `Fetching weather data from ${sourceNames.length} sources:`,
    sourceNames
  );

  // Fetch all sources in parallel
  const promises = sourceNames.map((sourceName) =>
    fetchWeatherData(sourceName)
  );

  const results = await Promise.all(promises);

  // Combine all weather data, removing duplicates by location
  const allWeatherData = results.flat();

  // Remove duplicates based on location
  const uniqueWeatherData = Array.from(
    new Map(allWeatherData.map((item) => [item.location, item])).values()
  );

  console.log(
    `Total weather data points from all sources: ${uniqueWeatherData.length}`
  );

  return uniqueWeatherData;
}
