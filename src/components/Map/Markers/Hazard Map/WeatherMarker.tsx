// \SafeGIS\Simulation-Studio\frontend\src\components\Map\Markers\Hazard Map\WeatherMarker.tsx
"use client";

import mapboxgl from "mapbox-gl";
import React from "react";
import {
  Sun,
  Cloud,
  CloudRain,
  CloudSnow,
  CloudLightning,
  CloudDrizzle,
  Cloudy,
} from "lucide-react";

// ---------- FIXED: make the ref non-nullable (current is always an array) ----------
export const weatherMarkersRef = { current: [] } as React.MutableRefObject<
  mapboxgl.Marker[]
>;

// ---------- Types ----------
export interface WeatherData {
  location: string;
  temperature: number;
  weatherCode: number;
  windSpeed: number;
  humidity: number;
  coordinates: [number, number];
}

// Map weather codes to lucide icons and descriptions
const getWeatherIcon = (weatherCode: number) => {
  if (weatherCode <= 1)
    return { icon: Sun, color: "#FFD700", description: "Clear sky" };
  if (weatherCode <= 3)
    return { icon: Cloud, color: "#87CEEB", description: "Partly cloudy" };
  if (weatherCode <= 48)
    return { icon: Cloudy, color: "#708090", description: "Overcast" };
  if (weatherCode <= 57)
    return { icon: CloudDrizzle, color: "#4682B4", description: "Drizzle" };
  if (weatherCode <= 67)
    return { icon: CloudRain, color: "#1E90FF", description: "Rain" };
  if (weatherCode <= 77)
    return { icon: CloudSnow, color: "#FFFFFF", description: "Snow" };
  if (weatherCode <= 82)
    return { icon: CloudRain, color: "#0000FF", description: "Rain showers" };
  if (weatherCode <= 86)
    return { icon: CloudSnow, color: "#E6E6FA", description: "Snow showers" };
  if (weatherCode <= 99)
    return {
      icon: CloudLightning,
      color: "#8A2BE2",
      description: "Thunderstorm",
    };
  return { icon: Cloud, color: "#808080", description: "Unknown" };
};

// Create weather marker element
const createWeatherMarkerElement = (data: WeatherData) => {
  const weatherInfo = getWeatherIcon(data.weatherCode);

  const container = document.createElement("div");
  container.className = "weather-marker-container";

  const markerEl = document.createElement("div");
  Object.assign(markerEl.style, {
    width: "50px",
    height: "50px",
    backgroundColor: weatherInfo.color,
    borderRadius: "50%",
    border: "3px solid white",
    boxShadow: "0 2px 8px rgba(0,0,0,0.3)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    cursor: "pointer",
    position: "relative",
  });

  const iconSvg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  iconSvg.setAttribute("width", "24");
  iconSvg.setAttribute("height", "24");
  iconSvg.setAttribute("viewBox", "0 0 24 24");
  iconSvg.setAttribute("fill", "none");
  iconSvg.setAttribute("stroke", "#000");
  iconSvg.setAttribute("stroke-width", "2");

  let iconPath = "";
  switch (weatherInfo.icon) {
    case Sun:
      iconPath =
        "M12 2v2m0 16v2m10-10h-2M4 12H2m15.09-5.09l-1.42 1.42M6.34 17.66l-1.42 1.42m12.74 0l-1.42-1.42M6.34 6.34L4.93 4.93M12 6a6 6 0 100 12 6 6 0 000-12z";
      break;
    case Cloud:
      iconPath = "M18 10h-1.26A8 8 0 109 20h9a5 5 0 000-10z";
      break;
    case CloudRain:
      iconPath =
        "M18 10h-1.26A8 8 0 109 20h9a5 5 0 000-10zm-9 12l-2 3m2-3l2 3m2-6l-2 3m2-3l2 3";
      break;
    case CloudSnow:
      iconPath =
        "M18 10h-1.26A8 8 0 109 20h9a5 5 0 000-10zm-5 2v.01M10 16v.01m4 0v.01m-4 4v.01m4 0v.01";
      break;
    case CloudLightning:
      iconPath = "M18 10h-1.26A8 8 0 109 20h9a5 5 0 000-10zm-5 2l-3 6h4l-3 6";
      break;
    case CloudDrizzle:
      iconPath =
        "M18 10h-1.26A8 8 0 109 20h9a5 5 0 000-10zm-7 14l.01.01M12 16l.01.01m2 2l.01.01";
      break;
    default:
      iconPath = "M18 10h-1.26A8 8 0 109 20h9a5 5 0 000-10z";
  }

  const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
  path.setAttribute("d", iconPath);
  iconSvg.appendChild(path);
  markerEl.appendChild(iconSvg);

  const tempLabel = document.createElement("div");
  Object.assign(tempLabel.style, {
    position: "absolute",
    bottom: "-25px",
    left: "50%",
    transform: "translateX(-50%)",
    backgroundColor: "rgba(255, 255, 255, 0.9)",
    padding: "2px 6px",
    borderRadius: "10px",
    fontSize: "12px",
    fontWeight: "bold",
    color: "#333",
    border: "1px solid #ccc",
    whiteSpace: "nowrap",
  });
  tempLabel.textContent = `${Math.round(data.temperature)}°C`;
  markerEl.appendChild(tempLabel);

  container.appendChild(markerEl);
  return container;
};

// Draw weather markers from pre-fetched data
export const drawWeatherMarkers = (
  map: mapboxgl.Map | null,
  mapIsLoaded: boolean,
  weatherDataArray: WeatherData[]
) => {
  if (!map || !mapIsLoaded) return;

  // Clear existing markers
  weatherMarkersRef.current.forEach((m) => m.remove());
  weatherMarkersRef.current = [];

  // Create markers from the provided weather data
  weatherDataArray.forEach((weatherInfo) => {
    const markerElement = createWeatherMarkerElement(weatherInfo);
    const marker = new mapboxgl.Marker({ element: markerElement })
      .setLngLat(weatherInfo.coordinates)
      .addTo(map);

    // Add popup on click
    const weatherCondition = getWeatherIcon(weatherInfo.weatherCode);
    const popup = new mapboxgl.Popup({ offset: 25 }).setHTML(`
      <div style="min-width: 200px; font-family: Arial, sans-serif;">
        <h3 style="margin: 0 0 10px 0; color: #333;">${
          weatherInfo.location
        }</h3>
        <div style="display: flex; align-items: center; margin-bottom: 8px;">
          <strong style="color: #666;">Condition:</strong>
          <span style="margin-left: 8px;">${weatherCondition.description}</span>
        </div>
        <div style="display: flex; align-items: center; margin-bottom: 8px;">
          <strong style="color: #666;">Temperature:</strong>
          <span style="margin-left: 8px;">${Math.round(
            weatherInfo.temperature
          )}°C</span>
        </div>
        <div style="display: flex; align-items: center; margin-bottom: 8px;">
          <strong style="color: #666;">Wind Speed:</strong>
          <span style="margin-left: 8px;">${Math.round(
            weatherInfo.windSpeed
          )} km/h</span>
        </div>
        <div style="display: flex; align-items: center;">
          <strong style="color: #666;">Humidity:</strong>
          <span style="margin-left: 8px;">${Math.round(
            weatherInfo.humidity
          )}%</span>
        </div>
      </div>
    `);

    marker.setPopup(popup);
    weatherMarkersRef.current.push(marker);
  });

  console.log(`Created ${weatherMarkersRef.current.length} weather markers`);
};

export const clearWeatherMarkers = () => {
  // remove all markers and reset
  weatherMarkersRef.current.forEach((m) => m.remove());
  weatherMarkersRef.current = [];
  console.log("Cleared all weather markers");
};
