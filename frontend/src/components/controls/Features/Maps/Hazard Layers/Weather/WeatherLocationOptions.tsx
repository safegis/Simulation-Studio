// \SafeGIS\Simulation-Studio\frontend\src\components\controls\Features\Maps\Hazard Layers\Weather\WeatherLocationOptions.tsx

export const weatherLocationOptions: Record<string, string[]> = {
  Philippines: ["By province", "By municipality/city", "By barangay"],
  "United States of America": [
    "By county, parish, city",
    "By township, town, charter township",
    "By city, town village",
  ],
  // Add more countries here as needed
  // "Canada": [
  //   "By province/territory",
  //   "By city",
  //   "By postal code"
  // ],
  // "United Kingdom": [
  //   "By country",
  //   "By county",
  //   "By district/borough"
  // ]
};

export const getWeatherLocationOptions = (country: string): string[] => {
  switch (country) {
    case "Philippines":
      return ["By province", "By municipality/city"];
    case "United States of America":
      return ["By state", "By city"];
    default:
      return [];
  }
};
