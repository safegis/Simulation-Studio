"use client";

import mapboxgl from "mapbox-gl";

function escHtml(s: string): string {
  return String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

/**
 * Tsunami bulletin epicenters (PHIVOLCS): distinct from earthquake layer (cyan / teal).
 */
export const drawTsunamiDots = (
  map: mapboxgl.Map | null,
  mapIsLoaded: boolean,
  latestTsunamisRef: React.RefObject<any[]>,
  features: any[]
) => {
  if (!map || !mapIsLoaded) return;
  latestTsunamisRef.current = features;

  const sourceId = "tsunami-events";
  const layerId = "tsunami-events-layer";

  try {
    if (map.getLayer(layerId)) map.removeLayer(layerId);
    if (map.getSource(sourceId)) map.removeSource(sourceId);
  } catch (e) {
    console.warn("Tsunami layer cleanup failed:", e);
  }

  const geojson: GeoJSON.FeatureCollection = {
    type: "FeatureCollection",
    features: features.map((f: any) => {
      const p = (f.properties || {}) as Record<string, unknown>;
      return {
        type: "Feature",
        properties: {
          mag: p.mag,
          place: p.place,
          time: p.time,
          depth: p.depth,
          advisory: p.advisory,
          advisoryUrl: p.advisoryUrl,
          source: p.source,
          sourceFullName: p.sourceFullName,
          dateTimeOriginal: p.dateTimeOriginal,
        },
        geometry: {
          type: "Point",
          coordinates: (f.geometry as GeoJSON.Point).coordinates.slice(0, 2),
        },
      };
    }),
  };

  map.addSource(sourceId, { type: "geojson", data: geojson });
  map.addLayer({
    id: layerId,
    type: "circle",
    source: sourceId,
    paint: {
      "circle-radius": [
        "interpolate",
        ["linear"],
        ["get", "mag"],
        0,
        7,
        8,
        16,
      ],
      "circle-color": "#22d3ee",
      "circle-opacity": 0.92,
      "circle-stroke-width": 2,
      "circle-stroke-color": "#0c4a6e",
    },
  });

  map.on("click", layerId, (e) => {
    const props = e.features?.[0]?.properties as Record<string, string> | undefined;
    if (!props) return;

    const magnitude = Number(props.mag);
    const depth = Math.abs(Number(props.depth) || 10);
    const sourceFullName = props.sourceFullName || props.source || "Unknown";
    const advisory = (props.advisory || "").trim() || "—";
    const advUrl = (props.advisoryUrl || "").trim();

    let magColor = "#4ade80";
    if (Number.isFinite(magnitude)) {
      if (magnitude >= 5.0) magColor = "#ef4444";
      else if (magnitude >= 3.0) magColor = "#f59e0b";
    }

    const advisoryInner =
      advUrl && advUrl.startsWith("http")
        ? `<a href="${escHtml(advUrl)}" target="_blank" rel="noopener noreferrer" style="color:#C7C7C7;font-size:10px;font-weight:500;line-height:1.35;text-decoration:underline;">${escHtml(advisory)}</a>`
        : `<span style="color:#C7C7C7;font-size:10px;font-weight:500;line-height:1.35;">${escHtml(advisory)}</span>`;

    const dateTimeDisplay =
      (props.dateTimeOriginal || "").trim() ||
      new Date(Number(props.time)).toLocaleString();

    const popupHTML = `
      <div style="
        background: #2E2E2E;
        border-radius: 6px;
        padding: 8px;
        min-width: 200px;
        max-width: 240px;
        box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.3), 0 2px 4px -1px rgba(0, 0, 0, 0.2);
        border: 1px solid #3a3a3a;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      ">
        <div style="
          color: white;
          font-size: 11px;
          font-weight: 600;
          margin-bottom: 8px;
          line-height: 1.3;
        ">
          ${props.place || "Unknown"}
        </div>

        <div style="
          background: #3d3e69;
          border: 1.5px solid ${magColor};
          border-radius: 4px;
          padding: 6px 8px;
          margin-bottom: 6px;
        ">
          <div style="display: flex; align-items: center; justify-content: space-between;">
            <div>
              <div style="
                color: #9699FF;
                font-size: 8px;
                font-weight: 500;
                text-transform: uppercase;
                letter-spacing: 0.5px;
                margin-bottom: 2px;
              ">
                Magnitude
              </div>
              <div style="
                color: ${magColor};
                font-size: 18px;
                font-weight: 700;
                line-height: 1;
              ">
                ${Number.isFinite(magnitude) ? magnitude.toFixed(1) : "—"}
              </div>
            </div>
          </div>
        </div>

        <div style="
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 6px;
          margin-bottom: 6px;
        ">
          <div style="
            background: #2a2a2a;
            border: 1px solid #3a3a3a;
            border-radius: 4px;
            padding: 6px;
          ">
            <div style="
              color: #9699FF;
              font-size: 8px;
              font-weight: 500;
              text-transform: uppercase;
              letter-spacing: 0.5px;
              margin-bottom: 2px;
            ">
              Depth
            </div>
            <div style="
              color: #C7C7C7;
              font-size: 11px;
              font-weight: 600;
            ">
              ${depth.toFixed(1)} km
            </div>
          </div>

          <div style="
            background: #2a2a2a;
            border: 1px solid #3a3a3a;
            border-radius: 4px;
            padding: 6px;
          ">
            <div style="
              color: #9699FF;
              font-size: 8px;
              font-weight: 500;
              text-transform: uppercase;
              letter-spacing: 0.5px;
              margin-bottom: 2px;
            ">
              Date &amp; Time (PST)
            </div>
            <div style="
              color: #C7C7C7;
              font-size: 10px;
              font-weight: 500;
              line-height: 1.25;
              word-break: break-word;
            ">
              ${escHtml(dateTimeDisplay)}
            </div>
          </div>
        </div>

        <div style="
          background: #2a2a2a;
          border: 1px solid #3a3a3a;
          border-radius: 4px;
          padding: 6px;
          margin-bottom: 6px;
        ">
          <div style="
            color: #9699FF;
            font-size: 8px;
            font-weight: 500;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            margin-bottom: 2px;
          ">
            Advisory
          </div>
          ${advisoryInner}
        </div>

        <div style="
          background: #2a2a2a;
          border: 1px solid #3a3a3a;
          border-radius: 4px;
          padding: 6px;
        ">
          <div style="
            color: #9699FF;
            font-size: 8px;
            font-weight: 500;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            margin-bottom: 2px;
          ">
            Source
          </div>
          <div style="
            color: #C7C7C7;
            font-size: 10px;
            font-weight: 500;
            line-height: 1.3;
          ">
            ${sourceFullName}
          </div>
        </div>
      </div>
    `;

    new mapboxgl.Popup({
      closeButton: true,
      closeOnClick: true,
      maxWidth: "none",
      className: "custom-earthquake-popup",
    })
      .setLngLat(e.lngLat)
      .setHTML(popupHTML)
      .addTo(map);

    const style = document.createElement("style");
    style.textContent = `
      .custom-earthquake-popup .mapboxgl-popup-content {
        padding: 0;
        background: transparent;
        box-shadow: none;
      }
      .custom-earthquake-popup .mapboxgl-popup-close-button {
        color: #C7C7C7;
        font-size: 16px;
        padding: 4px 8px;
        background: #2a2a2a;
        border-radius: 0 6px 0 4px;
        transition: all 0.2s;
        border: 1px solid #3a3a3a;
      }
      .custom-earthquake-popup .mapboxgl-popup-close-button:hover {
        color: white;
        background: #9699FF;
        border-color: #9699FF;
      }
      .custom-earthquake-popup .mapboxgl-popup-tip {
        border-top-color: #2E2E2E;
      }
    `;
    if (!document.getElementById("earthquake-popup-styles")) {
      style.id = "earthquake-popup-styles";
      document.head.appendChild(style);
    }
  });

  map.on("mouseenter", layerId, () => {
    map.getCanvas().style.cursor = "pointer";
  });
  map.on("mouseleave", layerId, () => {
    map.getCanvas().style.cursor = "";
  });
};
