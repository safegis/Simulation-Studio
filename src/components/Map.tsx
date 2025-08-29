"use client";
import {
  useRef,
  useEffect,
  forwardRef,
  useImperativeHandle,
  useState,
} from "react";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import {
  Construction,
  CircleMinus,
  BriefcaseMedical,
  TrafficCone,
  Users,
  House,
  Tent,
  ShoppingBasket,
  Bus,
  Antenna,
  Cross,
  Siren,
  Shield,
  Package,
  UserX,
  ShieldUser,
  Building,
} from "lucide-react";
import ReactDOMServer from "react-dom/server";
mapboxgl.accessToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN!;
type FlyToOptions = {
  center?: [number, number];
  zoom?: number;
  bearing?: number;
  pitch?: number;
  speed?: number;
  curve?: number;
  easing?: (time: number) => number;
  essential?: boolean;
};
const MapComponent = forwardRef(function MapComponent(_, ref) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const mapInstance = useRef<mapboxgl.Map | null>(null);
  const mapIsLoaded = useRef<boolean>(false);
  const is3DMode = useRef<boolean>(false);
  const latestRoutesGeoJSON = useRef<GeoJSON.FeatureCollection | null>(null);
  const latestVolcanoes = useRef<any[]>([]);
  const latestEarthquakes = useRef<any[]>([]);
  const latestActiveFaults = useRef<GeoJSON.FeatureCollection | null>(null);
  const lastHealthFacilities = useRef<GeoJSON.FeatureCollection | null>(null);
  const healthFacilityMarkersRef = useRef<mapboxgl.Marker[]>([]);
  const healthPopupRef = useRef<mapboxgl.Popup | null>(null);
  // add this ref to hold the registered callback
  const boundsListenersRef = useRef<
    Set<(bbox: [number, number, number, number]) => void>
  >(new Set());
  const [pendingResource, setPendingResource] = useState<{
    lngLat: mapboxgl.LngLat;
    type: string;
  } | null>(null);
  const [resourceName, setResourceName] = useState("");
  const [resourceDesc, setResourceDesc] = useState("");
  const roadClosureMarkersRef = useRef<mapboxgl.Marker[]>([]);
  const laneClosureMarkersRef = useRef<mapboxgl.Marker[]>([]);
  const selectedFeatureIndexRef = useRef<number | null>(null);
  // NEW: bring the route-<i>-outline and route-<i> layers to the top of the layer stack
  const bringRouteToFront = (featureIndex: number | null) => {
    const map = mapInstance.current;
    if (!map || featureIndex === null) return;
    const routeId = `route-${featureIndex}`;
    const outlineId = `${routeId}-outline`;
    try {
      // Move outline first, then inner line — moving without the 'beforeId' param
      // will place the layer at the top of the stack.
      if (map.getLayer(outlineId)) map.moveLayer(outlineId);
    } catch (e) {
      // ignore - may happen if layer not yet added
    }
    try {
      if (map.getLayer(routeId)) map.moveLayer(routeId);
    } catch (e) {
      // ignore
    }
  };
  const locationMarkerRef = useRef<mapboxgl.Marker | null>(null);
  const startMarkerRef = useRef<mapboxgl.Marker | null>(null);
  const destinationMarkerRef = useRef<mapboxgl.Marker | null>(null);
  useEffect(() => {
    if (!mapContainer.current) return;
    const map = new mapboxgl.Map({
      container: mapContainer.current,
      style: "mapbox://styles/mapbox/streets-v12",
      center: [0, 0],
      zoom: 2.5,
      pitch: 0,
      bearing: 0,
      antialias: true,
    });
    mapInstance.current = map;
    map.on("load", () => {
      mapIsLoaded.current = true;
      map.on("moveend", () => {
        try {
          const b = map.getBounds();
          if (!b) return;
          const bbox: [number, number, number, number] = [
            b.getWest(),
            b.getSouth(),
            b.getEast(),
            b.getNorth(),
          ];
          // call all registered listeners
          boundsListenersRef.current.forEach((cb) => cb(bbox));
        } catch (e) {
          // ignore
        }
      });
      map.getCanvas().addEventListener("dragover", (e: DragEvent) => {
        e.preventDefault();
      });
      map.getCanvas().addEventListener("drop", (e: DragEvent) => {
        e.preventDefault();
        const type = e.dataTransfer?.getData("resource-type");
        if (!type) return;
        const rect = map.getCanvas().getBoundingClientRect();
        const lngLat = map.unproject([
          e.clientX - rect.left,
          e.clientY - rect.top,
        ]);
        // Open modal instead of directly adding
        setPendingResource({ lngLat, type });
        setResourceName(type.charAt(0).toUpperCase() + type.slice(1));
        setResourceDesc("");
      });
    });
    return () => {
      healthPopupRef.current?.remove();
      healthPopupRef.current = null;
      map.remove();
      mapIsLoaded.current = false;
      locationMarkerRef.current?.remove();
      startMarkerRef.current?.remove();
      destinationMarkerRef.current?.remove();
    };
  }, []);
  const drawVolcanoDots = (volcanoes: any[]) => {
    const map = mapInstance.current;
    if (!map || !mapIsLoaded.current) return;
    latestVolcanoes.current = volcanoes;
    const sourceId = "volcanoes";
    const layerId = "volcanoes-layer";
    try {
      if (map.getLayer(layerId)) map.removeLayer(layerId);
      if (map.getSource(sourceId)) map.removeSource(sourceId);
    } catch (e) {
      console.warn(`Layer/source cleanup failed for ${layerId}:`, e);
    }
    const geojson: GeoJSON.FeatureCollection = {
      type: "FeatureCollection",
      features: volcanoes.map((v) => ({
        type: "Feature",
        properties: {
          name: v.vName,
          country: v.country,
          elevation: v.elevation_m,
        },
        geometry: {
          type: "Point",
          coordinates: [v.longitude, v.latitude],
        },
      })),
    };
    map.addSource(sourceId, { type: "geojson", data: geojson });
    map.addLayer({
      id: layerId,
      type: "circle",
      source: sourceId,
      paint: {
        "circle-radius": 6,
        "circle-color": "orange",
        "circle-stroke-width": 2,
        "circle-stroke-color": "white",
      },
    });
    map.on("click", layerId, (e) => {
      const props = e.features?.[0].properties!;
      const popupHTML = `
<div style="min-width: 180px;">
<strong>${props.name}</strong><br/>
<span>Country: ${props.country}</span><br/>
<span>Elevation: ${props.elevation} m</span>
</div>
`;
      new mapboxgl.Popup().setLngLat(e.lngLat).setHTML(popupHTML).addTo(map);
    });
    map.on("mouseenter", layerId, () => {
      map.getCanvas().style.cursor = "pointer";
    });
    map.on("mouseleave", layerId, () => {
      map.getCanvas().style.cursor = "";
    });
  };
  const drawEarthquakeDots = (features: any[]) => {
    const map = mapInstance.current;
    if (!map || !mapIsLoaded.current) return;
    latestEarthquakes.current = features;
    const sourceId = "earthquakes";
    const layerId = "earthquakes-layer";
    try {
      if (map.getLayer(layerId)) map.removeLayer(layerId);
      if (map.getSource(sourceId)) map.removeSource(sourceId);
    } catch (e) {
      console.warn(`Layer/source cleanup failed for ${layerId}:`, e);
    }
    const geojson: GeoJSON.FeatureCollection = {
      type: "FeatureCollection",
      features: features.map((f: any) => ({
        type: "Feature",
        properties: {
          mag: f.properties.mag,
          place: f.properties.place,
          time: f.properties.time,
          depth: f.geometry.coordinates[2],
        },
        geometry: {
          type: "Point",
          coordinates: f.geometry.coordinates.slice(0, 2),
        },
      })),
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
          6,
          8,
          18,
        ],
        "circle-color": "red",
        "circle-stroke-width": 2,
        "circle-stroke-color": "white",
      },
    });
    map.on("click", layerId, (e) => {
      const props = e.features?.[0].properties!;
      const popupHTML = `
<div style="min-width: 160px;">
<strong>${props.place}</strong><br/>
<span>Magnitude: ${props.mag}</span><br/>
<span>Depth: ${Number(props.depth).toFixed(1)} km</span><br/>
<span>${new Date(Number(props.time)).toLocaleString()}</span>
</div>
`;
      new mapboxgl.Popup().setLngLat(e.lngLat).setHTML(popupHTML).addTo(map);
    });
    map.on("mouseenter", layerId, () => {
      map.getCanvas().style.cursor = "pointer";
    });
    map.on("mouseleave", layerId, () => {
      map.getCanvas().style.cursor = "";
    });
  };
  // find a good beforeId once per style load
  const getTopSymbolLayerId = (map: mapboxgl.Map) => {
    const layers = map.getStyle()?.layers || [];
    for (let i = layers.length - 1; i >= 0; i--) {
      if (layers[i].type === "symbol") {
        return layers[i].id; // return the last symbol layer
      }
    }
    return undefined;
  };
  const drawRoutes = (geojson: GeoJSON.FeatureCollection) => {
    const map = mapInstance.current;
    if (!map || !mapIsLoaded.current) return;
    latestRoutesGeoJSON.current = geojson;
    // cleanup old
    const style = map.getStyle();
    if (!style?.layers) return;
    style.layers.forEach((layer) => {
      if (layer.id.startsWith("route-")) {
        if (map.getLayer(layer.id)) map.removeLayer(layer.id);
        if (map.getSource(layer.id)) map.removeSource(layer.id);
      }
    });
    const beforeId = getTopSymbolLayerId(map);
    geojson.features.forEach((feature, index) => {
      const id = `route-${index}`;
      const isSelected = selectedFeatureIndexRef.current === index;
      map.addSource(id, {
        type: "geojson",
        data: { type: "FeatureCollection", features: [feature] },
      });
      map.addLayer(
        {
          id: `${id}-outline`,
          type: "line",
          source: id,
          layout: { "line-join": "round", "line-cap": "round" },
          paint: {
            "line-color": "#9699FF",
            "line-width": 10,
            "line-opacity": 0.9,
          },
        },
        beforeId // ensure above roads/labels
      );
      map.addLayer(
        {
          id,
          type: "line",
          source: id,
          layout: { "line-join": "round", "line-cap": "round" },
          paint: {
            "line-color": isSelected ? "#9699FF" : "#ffffff",
            "line-width": 6,
            "line-opacity": 0.85,
          },
        },
        beforeId
      );
    });
    if (selectedFeatureIndexRef.current !== null) {
      bringRouteToFront(selectedFeatureIndexRef.current);
    }
  };
  const drawActiveFaults = (geojson: GeoJSON.FeatureCollection | null) => {
    const map = mapInstance.current;
    if (!map || !mapIsLoaded.current) return;
    latestActiveFaults.current = geojson; // store for redraw
    const sourceId = "active-faults";
    const layerId = "active-faults-layer";
    // Remove existing
    try {
      if (map.getLayer(layerId)) map.removeLayer(layerId);
      if (map.getSource(sourceId)) map.removeSource(sourceId);
    } catch (e) {
      console.warn(`Layer/source cleanup failed for ${layerId}:`, e);
    }
    if (!geojson) return; // null means "clear the layer"
    map.addSource(sourceId, { type: "geojson", data: geojson });
    map.addLayer({
      id: layerId,
      type: "line",
      source: sourceId,
      paint: {
        "line-color": "#FF0000",
        "line-width": 2,
      },
    });
    map.on("mouseenter", layerId, () => {
      map.getCanvas().style.cursor = "pointer";
    });
    map.on("mouseleave", layerId, () => {
      map.getCanvas().style.cursor = "";
    });
    // Popup with ALL properties
    map.on("click", layerId, (e) => {
      const props = e.features?.[0].properties || {};
      let html = "<div style='min-width:180px;'>";
      for (const key in props) {
        html += `<div><strong>${key}:</strong> ${props[key]}</div>`;
      }
      html += "</div>";
      new mapboxgl.Popup().setLngLat(e.lngLat).setHTML(html).addTo(map);
    });
  };
  // --- ADD helper function near other drawX helpers in Map.tsx ---
  const drawRoadClosures = (geojson: GeoJSON.FeatureCollection | null) => {
    const map = mapInstance.current;
    if (!map || !mapIsLoaded.current) return;
    const sourceId = "tomtom-road-closures-src";
    const outlineLayerId = "tomtom-road-closures-outline";
    const innerLayerId = "tomtom-road-closures";
    // Remove existing markers first
    roadClosureMarkersRef.current.forEach((m) => m.remove());
    roadClosureMarkersRef.current = [];
    // cleanup existing layers + sources
    try {
      if (map.getLayer(innerLayerId)) map.removeLayer(innerLayerId);
      if (map.getLayer(outlineLayerId)) map.removeLayer(outlineLayerId);
      if (map.getSource(sourceId)) map.removeSource(sourceId);
    } catch (e) {
      console.warn("cleanup road closures failed", e);
    }
    // If no features, return early
    if (!geojson || geojson.features.length === 0) return;
    map.addSource(sourceId, { type: "geojson", data: geojson });
    const beforeId = getTopSymbolLayerId(map);
    // outline (red)
    map.addLayer(
      {
        id: outlineLayerId,
        type: "line",
        source: sourceId,
        layout: { "line-join": "round", "line-cap": "round" },
        paint: {
          "line-color": "#FF0000", // red outline
          "line-width": 10,
          "line-opacity": 0.85,
        },
      },
      beforeId
    );
    // inner line (white)
    map.addLayer(
      {
        id: innerLayerId,
        type: "line",
        source: sourceId,
        layout: { "line-join": "round", "line-cap": "round" },
        paint: {
          "line-color": "#FFFFFF", // white inner line
          "line-width": 6,
          "line-dasharray": [2, 1],
          "line-opacity": 0.95,
        },
      },
      beforeId
    );
    // diamond markers
    geojson.features.forEach((f) => {
      if (f.geometry.type === "LineString") {
        const coords = f.geometry.coordinates;
        if (!coords?.length) return;
        const start = coords[0] as [number, number];
        const iconSVG = ReactDOMServer.renderToString(
          <Construction size={24} color="#FF0000" />
        );
        const el = document.createElement("div");
        el.innerHTML = `
<div style="
width: 40px;
height: 40px;
background: #FFFFFF;
transform: rotate(45deg);
border: 2px solid #FF0000;
box-shadow: 0 1px 4px rgba(0,0,0,0.3);
display: flex;
align-items: center;
justify-content: center;">
<div style="transform: rotate(-45deg); display:flex; align-items:center; justify-content:center;">
${iconSVG}
</div>
</div>
`;
        const marker = new mapboxgl.Marker({
          element: el,
          anchor: "bottom",
          offset: [0, -6],
        })
          .setLngLat(start)
          .addTo(map);
        roadClosureMarkersRef.current.push(marker);
      }
    });
    // popup on line click
    map.on("click", innerLayerId, (e) => {
      const props = e.features?.[0]?.properties || {};
      const popupHTML = `
<div style="min-width:180px;">
<strong>Road Closure</strong><br/>
<div>${props.description ?? ""}</div>
<div>Start: ${props.startTime ?? "n/a"}</div>
<div>End: ${props.endTime ?? "n/a"}</div>
</div>
`;
      new mapboxgl.Popup().setLngLat(e.lngLat).setHTML(popupHTML).addTo(map);
    });
    map.on("mouseenter", innerLayerId, () => {
      map.getCanvas().style.cursor = "pointer";
    });
    map.on("mouseleave", innerLayerId, () => {
      map.getCanvas().style.cursor = "";
    });
  };
  const drawLaneClosures = (geojson: GeoJSON.FeatureCollection | null) => {
    const map = mapInstance.current;
    if (!map || !mapIsLoaded.current) return;
    const sourceId = "tomtom-lane-closures-src";
    const outlineLayerId = "tomtom-lane-closures-outline";
    const innerLayerId = "tomtom-lane-closures";
    // Remove existing markers first
    laneClosureMarkersRef.current.forEach((m) => m.remove());
    laneClosureMarkersRef.current = [];
    // cleanup layers/sources
    try {
      if (map.getLayer(innerLayerId)) map.removeLayer(innerLayerId);
      if (map.getLayer(outlineLayerId)) map.removeLayer(outlineLayerId);
      if (map.getSource(sourceId)) map.removeSource(sourceId);
    } catch (e) {
      console.warn("cleanup lane closures failed", e);
    }
    // If no features, return early
    if (!geojson || geojson.features.length === 0) return;
    map.addSource(sourceId, { type: "geojson", data: geojson });
    const beforeId = getTopSymbolLayerId(map);
    // outline (black)
    map.addLayer(
      {
        id: outlineLayerId,
        type: "line",
        source: sourceId,
        layout: { "line-join": "round", "line-cap": "round" },
        paint: {
          "line-color": "#000000",
          "line-width": 10,
          "line-opacity": 0.85,
        },
      },
      beforeId
    );
    // inner line (yellow)
    map.addLayer(
      {
        id: innerLayerId,
        type: "line",
        source: sourceId,
        layout: { "line-join": "round", "line-cap": "round" },
        paint: {
          "line-color": "#FFD700",
          "line-width": 6,
          "line-dasharray": [2, 1],
          "line-opacity": 0.95,
        },
      },
      beforeId
    );
    // diamond markers (black border, yellow background, CircleMinus icon)
    geojson.features.forEach((f) => {
      if (f.geometry.type === "LineString") {
        const coords = f.geometry.coordinates;
        if (!coords?.length) return;
        const start = coords[0] as [number, number];
        const iconSVG = ReactDOMServer.renderToString(
          <CircleMinus size={24} color="#000000" />
        );
        const el = document.createElement("div");
        el.innerHTML = `
<div style="
width: 40px;
height: 40px;
background: #FFD700;
transform: rotate(45deg);
border: 2px solid #000000;
box-shadow: 0 1px 4px rgba(0,0,0,0.3);
display: flex;
align-items: center;
justify-content: center;">
<div style="transform: rotate(-45deg); display:flex; align-items:center; justify-content:center;">
${iconSVG}
</div>
</div>
`;
        const marker = new mapboxgl.Marker({
          element: el,
          anchor: "bottom",
          offset: [0, -6],
        })
          .setLngLat(start)
          .addTo(map);
        laneClosureMarkersRef.current.push(marker);
      }
    });
    // popup
    map.on("click", innerLayerId, (e) => {
      const props = e.features?.[0]?.properties || {};
      const popupHTML = `
<div style="min-width:180px;">
<strong>Lane Closure</strong><br/>
<div>${props.description ?? ""}</div>
<div>Start: ${props.startTime ?? "n/a"}</div>
<div>End: ${props.endTime ?? "n/a"}</div>
</div>
`;
      new mapboxgl.Popup().setLngLat(e.lngLat).setHTML(popupHTML).addTo(map);
    });
    map.on("mouseenter", innerLayerId, () => {
      map.getCanvas().style.cursor = "pointer";
    });
    map.on("mouseleave", innerLayerId, () => {
      map.getCanvas().style.cursor = "";
    });
  };
  const congestionMarkersRef = useRef<mapboxgl.Marker[]>([]);
  const drawCongestion = (geojson: GeoJSON.FeatureCollection | null) => {
    const map = mapInstance.current;
    if (!map || !mapIsLoaded.current) return;
    const sourceId = "tomtom-congestion-src";
    const layerId = "tomtom-congestion";
    congestionMarkersRef.current.forEach((m) => m.remove());
    congestionMarkersRef.current = [];
    try {
      if (map.getLayer(layerId)) map.removeLayer(layerId);
      if (map.getSource(sourceId)) map.removeSource(sourceId);
    } catch {}
    if (!geojson || geojson.features.length === 0) return;
    map.addSource(sourceId, { type: "geojson", data: geojson });
    const beforeId = getTopSymbolLayerId(map);
    map.addLayer(
      {
        id: layerId,
        type: "line",
        source: sourceId,
        layout: { "line-join": "round", "line-cap": "round" },
        paint: {
          "line-width": 6,
          "line-opacity": 0.9,
          "line-dasharray": [2, 2],
          "line-color": [
            "match",
            ["get", "severity"],
            1,
            "#00FF00", // free
            2,
            "#ADD8E6", // heavy
            3,
            "#FFA500", // slow
            4,
            "#FF4500", // queuing
            5,
            "#FF0000", // stationary
            "#808080",
          ],
        },
      },
      beforeId
    );
    // --- Add diamond markers with numbers ---
    // --- Add circular markers with numbers ---
    geojson.features.forEach((f: any) => {
      const coords = f.geometry?.coordinates;
      if (!coords || coords.length < 2) return;
      const sev = f.properties?.severity ?? 0;
      // match line colors
      let bg = "#808080";
      switch (sev) {
        case 1:
          bg = "#00FF00";
          break;
        case 2:
          bg = "#ADD8E6";
          break;
        case 3:
          bg = "#FFA500";
          break;
        case 4:
          bg = "#FF4500";
          break;
        case 5:
          bg = "#FF0000";
          break;
      }
      // HTML element for circular marker
      const el = document.createElement("div");
      Object.assign(el.style, {
        width: "40px",
        height: "40px",
        boxSizing: "border-box", // keep total size 40x40 including border
        display: "grid", // bulletproof centering
        placeItems: "center",
        borderRadius: "50%",
        background: bg,
        color: "#fff",
        fontSize: "20px",
        fontWeight: "700",
        border: "2px solid #fff",
        lineHeight: "1", // avoid baseline drift
        fontVariantNumeric: "tabular-nums", // equal-width digits (if supported)
        fontFamily:
          'system-ui, -apple-system, "Segoe UI", Roboto, "Helvetica Neue", Arial',
      });
      el.textContent = String(sev);
      const marker = new mapboxgl.Marker({ element: el })
        .setLngLat(coords[0]) // for LineString: coords[0] is first point
        .addTo(map);
      congestionMarkersRef.current.push(marker);
    });
    // --- Popup on line click ---
    map.on("click", layerId, (e) => {
      const props = e.features?.[0]?.properties || {};
      const popupHTML = `
<div style="min-width:180px;">
<strong>Congestion</strong><br/>
<div>Level: ${props.description ?? "Unknown"} (Severity ${props.severity})</div>
<div>Start: ${props.startTime ?? "n/a"}</div>
<div>End: ${props.endTime ?? "n/a"}</div>
</div>
`;
      new mapboxgl.Popup().setLngLat(e.lngLat).setHTML(popupHTML).addTo(map);
    });
  };
  const obstructionItemsRef = useRef<{ remove: () => void }[]>([]);
  const obstructionSourceId = "road-obstructions-source";
  const obstructionLayerId = "road-obstructions-layer";
  const drawRoadObstructions = (geojson: GeoJSON.FeatureCollection | null) => {
    const map = mapInstance.current;
    if (!map || !mapIsLoaded.current) return;
    // clear old markers
    obstructionItemsRef.current.forEach((i) => i.remove());
    obstructionItemsRef.current = [];
    // reset source if empty
    if (!geojson || geojson.features.length === 0) {
      if (map.getSource(obstructionSourceId)) {
        (map.getSource(obstructionSourceId) as mapboxgl.GeoJSONSource).setData({
          type: "FeatureCollection",
          features: [],
        });
      }
      return;
    }
    // Collect all LineStrings for the extent lines
    const lineFeatures: GeoJSON.Feature<GeoJSON.LineString>[] = [];
    geojson.features.forEach((f) => {
      let coord: [number, number] | null = null;
      if (f.geometry.type === "Point") {
        const c = (f.geometry as any).coordinates;
        if (Array.isArray(c) && c.length >= 2) {
          coord = c as [number, number];
        }
      } else if (f.geometry.type === "LineString") {
        const c = (f.geometry as any).coordinates;
        if (Array.isArray(c) && c.length > 0) {
          coord = c[0] as [number, number]; // marker at first point
          // store full line for drawing
          lineFeatures.push({
            type: "Feature",
            geometry: f.geometry as GeoJSON.LineString,
            properties: {},
          });
        }
      }
      if (!coord) return;
      const props = f.properties || {};
      const iconSVG = ReactDOMServer.renderToString(
        <TrafficCone size={24} color="#FF6600" />
      );
      const el = document.createElement("div");
      el.innerHTML = `
<div style="
width: 40px;
height: 40px;
background: #FFD580;
transform: rotate(45deg);
display: flex;
align-items: center;
justify-content: center;
position: relative;
border: 2px solid #FF6600;
border-radius: 4px;
">
<div style="transform: rotate(-45deg); display:flex; align-items:center; justify-content:center;">
${iconSVG}
</div>
</div>
`;
      const popupHTML = `
<div style="min-width:180px;">
<strong>Road Obstruction</strong><br/>
<div>${props.description ?? ""}</div>
<div>Start: ${props.startTime ?? "n/a"}</div>
<div>End: ${props.endTime ?? "n/a"}</div>
</div>
`;
      const popup = new mapboxgl.Popup({ offset: 12 }).setHTML(popupHTML);
      const marker = new mapboxgl.Marker({ element: el })
        .setLngLat(coord)
        .setPopup(popup)
        .addTo(map);
      obstructionItemsRef.current.push({ remove: () => marker.remove() });
    });
    // Update or create shared source + layer
    if (map.getSource(obstructionSourceId)) {
      (map.getSource(obstructionSourceId) as mapboxgl.GeoJSONSource).setData({
        type: "FeatureCollection",
        features: lineFeatures,
      });
    } else {
      map.addSource(obstructionSourceId, {
        type: "geojson",
        data: {
          type: "FeatureCollection",
          features: lineFeatures,
        },
      });
      map.addLayer({
        id: obstructionLayerId,
        type: "line",
        source: obstructionSourceId,
        layout: {
          "line-cap": "round",
          "line-join": "round",
        },
        paint: {
          "line-color": "#FF6600",
          "line-width": 4,
          "line-dasharray": [2, 2],
        },
      });
    }
  };
  const drawHealthFacilities = (geojson: GeoJSON.FeatureCollection) => {
    const map = mapInstance.current;
    if (!map || !mapIsLoaded.current) return;
    lastHealthFacilities.current = geojson;
    // Remove existing markers
    healthFacilityMarkersRef.current.forEach((m) => m.remove());
    healthFacilityMarkersRef.current = [];
    geojson.features.forEach((f) => {
      if (f.geometry.type === "Point") {
        const coords = f.geometry.coordinates as [number, number];
        const iconSVG = ReactDOMServer.renderToString(
          <BriefcaseMedical size={24} color="#ffffff" />
        );
        const el = document.createElement("div");
        el.style.display = "flex";
        el.style.alignItems = "center";
        el.style.justifyContent = "center";
        el.style.width = "40px";
        el.style.height = "40px";
        el.style.cursor = "pointer"; // makes cursor pointer on hover
        el.innerHTML = `
<div style="
width: 40px;
height: 40px;
background: #FF0000;
transform: rotate(45deg);
box-shadow: 0 1px 4px rgba(0,0,0,0.3);
display: flex;
align-items: center;
justify-content: center;">
<div style="transform: rotate(-45deg); display:flex; align-items:center; justify-content:center;">
${iconSVG}
</div>
</div>
`;
        const marker = new mapboxgl.Marker({
          element: el,
          anchor: "center",
        })
          .setLngLat(coords)
          .addTo(map);
        // Reuse one popup instance → old popup closes when new one opens
        marker.getElement().addEventListener("click", (e) => {
          e.stopPropagation();
          const props = f.properties || {};
          let popupHTML = `<div style="min-width:180px;">`;
          for (const key in props) {
            if (key === "osm_id" || key === "osm_type") continue;
            if (props[key] !== null && props[key] !== "") {
              popupHTML += `<div><strong>${key}:</strong> ${props[key]}</div>`;
            }
          }
          popupHTML += "</div>";
          if (!healthPopupRef.current) {
            healthPopupRef.current = new mapboxgl.Popup({
              closeOnClick: true,
              closeButton: true,
            });
          }
          healthPopupRef.current
            .setLngLat(coords)
            .setHTML(popupHTML)
            .addTo(map);
        });
        healthFacilityMarkersRef.current.push(marker);
      }
    });
  };
  const clearHealthFacilities = () => {
    const map = mapInstance.current;
    if (!map || !mapIsLoaded.current) return;
    // remove markers
    healthFacilityMarkersRef.current.forEach((m) => m.remove());
    healthFacilityMarkersRef.current = [];
    // close the active health popup (if any)
    if (healthPopupRef.current) {
      healthPopupRef.current.remove();
      // keep the instance so we can reuse it later (optional)
      // or set to null if you prefer re-creating it next time:
      // healthPopupRef.current = null;
    }
    lastHealthFacilities.current = null;
  };
  // Restore after style change
  useEffect(() => {
    const map = mapInstance.current;
    if (!map) return;
    const handleStyleLoad = () => {
      // close any open health popup on style change
      healthPopupRef.current?.remove();
      if (lastHealthFacilities.current) {
        drawHealthFacilities(lastHealthFacilities.current);
      }
    };
    map.on("style.load", handleStyleLoad);
    return () => {
      map.off("style.load", handleStyleLoad);
    };
  }, []);
  const resourceMarkersRef = useRef<
    {
      id: string;
      type: string;
      marker: mapboxgl.Marker;
      data: { name: string; description: string };
      coords: mapboxgl.LngLat;
    }[]
  >([]);
  const resourceListenersRef = useRef<((resources: any[]) => void)[]>([]);
  const notifyResourcesChanged = () => {
    const snapshot = resourceMarkersRef.current.map((r) => ({
      id: r.id,
      type: r.type,
      data: r.data,
      coords: r.marker.getLngLat(), // include live coords
    }));
    resourceListenersRef.current.forEach((cb) => cb(snapshot));
  };
  const addResourceMarker = (
    lngLat: mapboxgl.LngLat,
    type: string,
    initialData?: { name: string; description: string }
  ) => {
    const id = `${type}-${Date.now()}`;
    let icon;
    let borderColor = "black"; // default border

    // Pick icon + color based on resource type
    switch (type) {
      case "personnel":
        icon = <Users size={20} color="red" />;
        borderColor = "red";
        break;
      case "infrastructure":
        icon = <Building size={20} color="green" />;
        borderColor = "green";
        break;
      case "supplies":
        icon = <ShoppingBasket size={20} color="blue" />;
        borderColor = "blue";
        break;
      default:
        icon = <Users size={20} />;
    }

    // ✅ Wrap icon inside white circle with colored border
    const markerWrapper = (
      <div
        style={{
          backgroundColor: "white",
          borderRadius: "50%",
          width: "38px",
          height: "38px",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          border: `2px solid ${borderColor}`,
          boxShadow: "0 0 4px rgba(0,0,0,0.3)",
        }}
      >
        {icon}
      </div>
    );

    // Create DOM element for marker
    const el = document.createElement("div");
    el.innerHTML = ReactDOMServer.renderToString(markerWrapper);

    // Create marker
    const marker = new mapboxgl.Marker({ element: el, draggable: true })
      .setLngLat(lngLat)
      .addTo(mapInstance.current!);

    // Default resource details
    let resourceData = {
      type,
      name: initialData?.name ?? type.charAt(0).toUpperCase() + type.slice(1),
      description: initialData?.description ?? "",
    };

    // Create popup HTML with editable form
    const createPopupHTML = () => `
    <div style="min-width:200px;">
      <strong>Edit Resource</strong>
      <div style="margin-top:8px;">
        <label>Name:</label><br/>
        <input type="text" id="res-name" value="${resourceData.name}" style="width:100%; margin-bottom:6px;"/>
        <label>Description:</label><br/>
        <textarea id="res-desc" rows="3" style="width:100%;">${resourceData.description}</textarea>
      </div>
      <div style="margin-top:10px; display:flex; justify-content:space-between;">
        <button id="save-btn" style="background:#5A5C99; color:white; padding:4px 8px; border-radius:4px;">Save</button>
        <button id="delete-btn" style="background:#B33A3A; color:white; padding:4px 8px; border-radius:4px;">Delete</button>
      </div>
    </div>
  `;

    const popup = new mapboxgl.Popup({ offset: 25 })
      .setLngLat(lngLat)
      .setHTML(createPopupHTML());

    // Attach popup to marker
    marker.setPopup(popup);

    // Resource object stored in ref
    const resourceObj = {
      id,
      type,
      marker,
      data: resourceData,
      coords: lngLat,
    };

    // Event: When popup opens, attach listeners to Save/Delete
    marker.getElement().addEventListener("click", () => {
      setTimeout(() => {
        const saveBtn = document.getElementById("save-btn");
        const deleteBtn = document.getElementById("delete-btn");
        const nameInput = document.getElementById(
          "res-name"
        ) as HTMLInputElement;
        const descInput = document.getElementById(
          "res-desc"
        ) as HTMLTextAreaElement;

        if (saveBtn) {
          saveBtn.onclick = () => {
            resourceData.name = nameInput.value;
            resourceData.description = descInput.value;
            popup.setHTML(createPopupHTML()); // refresh popup with updated values
            notifyResourcesChanged();
          };
        }

        if (deleteBtn) {
          deleteBtn.onclick = () => {
            marker.remove();
            popup.remove();
            resourceMarkersRef.current = resourceMarkersRef.current.filter(
              (r) => r.marker !== marker
            );
            notifyResourcesChanged();
          };
        }
      }, 50); // allow popup to render before attaching events
    });

    // Update coordinates when marker is dragged
    marker.on("dragend", () => {
      const newPos = marker.getLngLat();
      resourceObj.coords = newPos; // update coords in object
      notifyResourcesChanged(); // refresh UI instantly
    });

    // Add to resources list
    resourceMarkersRef.current.push(resourceObj);
    notifyResourcesChanged();
  };

  const clearAllResources = () => {
    resourceMarkersRef.current.forEach((r) => {
      r.marker.remove();
    });
    resourceMarkersRef.current = [];
    notifyResourcesChanged();
  };
  useImperativeHandle(ref, () => ({
    flyTo: (opts: FlyToOptions) => {
      if (!mapIsLoaded.current) return;
      mapInstance.current?.flyTo(opts);
    },
    addLocationMarker: (lng: number, lat: number) => {
      if (!mapInstance.current || !mapIsLoaded.current) return;
      startMarkerRef.current?.remove();
      startMarkerRef.current = null;
      locationMarkerRef.current?.remove();
      const marker = new mapboxgl.Marker({ color: "#9699FF" })
        .setLngLat([lng, lat])
        .addTo(mapInstance.current);
      locationMarkerRef.current = marker;
    },
    addStartMarker: (lng: number, lat: number) => {
      if (!mapInstance.current || !mapIsLoaded.current) return;
      locationMarkerRef.current?.remove();
      locationMarkerRef.current = null;
      startMarkerRef.current?.remove();
      const marker = new mapboxgl.Marker({ color: "#00FF00" })
        .setLngLat([lng, lat])
        .addTo(mapInstance.current);
      startMarkerRef.current = marker;
    },
    addDestinationMarker: (lng: number, lat: number) => {
      if (!mapInstance.current || !mapIsLoaded.current) return;
      destinationMarkerRef.current?.remove();
      const marker = new mapboxgl.Marker({ color: "#FF4C4C" })
        .setLngLat([lng, lat])
        .addTo(mapInstance.current);
      destinationMarkerRef.current = marker;
    },
    fitBoundsToMarkers: () => {
      if (
        !mapInstance.current ||
        !mapIsLoaded.current ||
        !startMarkerRef.current ||
        !destinationMarkerRef.current
      )
        return;
      const bounds = new mapboxgl.LngLatBounds();
      const startLngLat = startMarkerRef.current.getLngLat();
      bounds.extend([startLngLat.lng, startLngLat.lat]);
      const destLngLat = destinationMarkerRef.current.getLngLat();
      bounds.extend([destLngLat.lng, destLngLat.lat]);
      mapInstance.current.fitBounds(bounds, {
        padding: 100,
        maxZoom: 16,
        duration: 1000,
      });
    },
    getZoom: () => {
      return mapInstance.current?.getZoom?.() ?? 0;
    },
    switchTo2D: (label: string) => {
      const map = mapInstance.current;
      if (!map || !mapIsLoaded.current || !is3DMode.current) return;
      is3DMode.current = false;
      let style = "mapbox://styles/mapbox/streets-v12";
      switch (label) {
        case "Satellite":
          style = "mapbox://styles/mapbox/standard-satellite";
          break;
        case "Outdoors":
          style = "mapbox://styles/mapbox/outdoors-v12";
          break;
        case "Light":
          style = "mapbox://styles/mapbox/light-v11";
          break;
        case "Dark":
          style = "mapbox://styles/mapbox/dark-v11";
          break;
        case "Navigation (Day)":
          style = "mapbox://styles/mapbox/navigation-day-v1";
          break;
        case "Navigation (Night)":
          style = "mapbox://styles/mapbox/navigation-night-v1";
          break;
      }
      map.setStyle(style);
      map.once("style.load", () => {
        map.setTerrain(null);
        map.easeTo({ pitch: 0, bearing: 0, duration: 800 });
        // Call draw functions only here with stored data
        if (latestRoutesGeoJSON.current)
          drawRoutes(latestRoutesGeoJSON.current);
        if (latestVolcanoes.current.length > 0)
          drawVolcanoDots(latestVolcanoes.current);
        if (latestEarthquakes.current.length > 0)
          drawEarthquakeDots(latestEarthquakes.current);
        if (latestActiveFaults.current)
          drawActiveFaults(latestActiveFaults.current);
      });
    },
    switchTo3D: (label: string) => {
      const map = mapInstance.current;
      if (!map || !mapIsLoaded.current || is3DMode.current) return;
      is3DMode.current = true;
      let style = "mapbox://styles/shain34/cmesokqei00z501sdedixesto";
      if (label === "Satellite") {
        style = "mapbox://styles/mapbox/standard-satellite";
      }
      map.setStyle(style);
      map.once("style.load", () => {
        addTerrainOnly(map);
        map.easeTo({ pitch: 60, bearing: 30, duration: 1000 });
        // Call draw functions only here with stored data
        if (latestRoutesGeoJSON.current)
          drawRoutes(latestRoutesGeoJSON.current);
        if (latestVolcanoes.current.length > 0)
          drawVolcanoDots(latestVolcanoes.current);
        if (latestEarthquakes.current.length > 0)
          drawEarthquakeDots(latestEarthquakes.current);
        if (latestActiveFaults.current)
          drawActiveFaults(latestActiveFaults.current);
      });
    },
    setLightPreset: (preset: "dawn" | "day" | "dusk" | "night") => {
      const map = mapInstance.current;
      if (!map || !mapIsLoaded.current || !is3DMode.current) return;
      try {
        map.setConfigProperty("basemap", "lightPreset", preset);
      } catch (e) {
        console.warn("Failed to set light preset:", e);
      }
    },
    setMapStyle: (style: string) => {
      const map = mapInstance.current;
      if (!map || !mapIsLoaded.current) return;
      map.setStyle(style);
      map.once("style.load", () => {
        if (is3DMode.current && style.includes("standard")) {
          addTerrainOnly(map);
          map.easeTo({ pitch: 60, bearing: 30, duration: 1000 });
        } else {
          map.setTerrain(null);
          map.easeTo({ pitch: 0, bearing: 0, duration: 800 });
        }
        // Call draw functions only here with stored data
        if (latestRoutesGeoJSON.current)
          drawRoutes(latestRoutesGeoJSON.current);
        if (latestVolcanoes.current.length > 0)
          drawVolcanoDots(latestVolcanoes.current);
        if (latestEarthquakes.current.length > 0)
          drawEarthquakeDots(latestEarthquakes.current);
        if (latestActiveFaults.current)
          drawActiveFaults(latestActiveFaults.current);
      });
    },
    drawRoutes,
    // new: highlight by geojson feature index (the same index drawRoutes used)
    highlightRouteByFeatureIndex: (featureIndex: number | null) => {
      const map = mapInstance.current;
      selectedFeatureIndexRef.current = featureIndex;
      if (!map || !mapIsLoaded.current) return;
      try {
        // set each inner route layer to white except the selected featureIndex -> purple
        const style = map.getStyle();
        if (!style?.layers) return;
        style.layers.forEach((layer) => {
          // inner layer has id `route-<i>` and there's also route-<i>-outline
          const m = layer.id.match(/^route-(\d+)$/);
          if (!m) return;
          const idx = Number(m[1]);
          const layerId = `route-${idx}`;
          try {
            map.setPaintProperty(
              layerId,
              "line-color",
              idx === featureIndex ? "#9699FF" : "#ffffff"
            );
          } catch (e) {
            // ignore missing layers / race conditions
          }
        });
        // NEW: bring selected route layers to top so they're not visually occluded
        if (featureIndex !== null) {
          bringRouteToFront(featureIndex);
        }
      } catch (e) {
        console.warn("highlightRouteByFeatureIndex failed", e);
      }
    },
    drawVolcanoDots,
    drawEarthquakeDots,
    drawActiveFaults,
    // inside useImperativeHandle(ref, () => ({ ... }))
    getBounds: (): [number, number, number, number] | null => {
      const map = mapInstance.current;
      if (!map || !mapIsLoaded.current) return null;
      const b = map.getBounds();
      if (!b) return null; // guard for possible null/undefined
      // return [minLon, minLat, maxLon, maxLat]
      return [b.getWest(), b.getSouth(), b.getEast(), b.getNorth()];
    },
    drawRoadClosures,
    drawLaneClosures,
    drawCongestion: (geojson: GeoJSON.FeatureCollection | null) => {
      drawCongestion(geojson);
    },
    congestionMarkersRef,
    drawRoadObstructions,
    /**
     * Register a callback to be invoked when the map bounds change (moveend).
     * callback receives [minLon,minLat,maxLon,maxLat].
     * Returns nothing. Use unregisterBoundsListener to remove.
     */
    registerBoundsListener: (
      cb: (bbox: [number, number, number, number]) => void
    ) => {
      boundsListenersRef.current.add(cb);
      // call immediately with current bounds
      const map = mapInstance.current;
      if (!map || !mapIsLoaded.current) return;
      try {
        const b = map.getBounds();
        if (!b) return;
        const bbox: [number, number, number, number] = [
          b.getWest(),
          b.getSouth(),
          b.getEast(),
          b.getNorth(),
        ];
        cb(bbox);
      } catch (e) {
        // ignore
      }
    },
    unregisterBoundsListener: (
      cb: (bbox: [number, number, number, number]) => void
    ) => {
      boundsListenersRef.current.delete(cb);
    },
    drawHealthFacilities,
    clearHealthFacilities,
    addGeoJSONLayer: async (
      geojson: GeoJSON.FeatureCollection,
      layerName: string
    ) => {
      const map = mapInstance.current;
      if (!map || !mapIsLoaded.current) return;
      const safeName = layerName.replace(/[^a-zA-Z0-9_-]/g, "");
      const sourceId = `upload-${safeName}`;
      const baseId = `${sourceId}-layer`;
      // Remove old layers
      ["fill", "line", "circle"].forEach((type) => {
        const layerId = `${baseId}-${type}`;
        if (map.getLayer(layerId)) map.removeLayer(layerId);
      });
      if (map.getSource(sourceId)) map.removeSource(sourceId);
      // Normalize multi-geometries
      const turf = await import("@turf/turf");
      const normalizedFeatures: GeoJSON.Feature<GeoJSON.Geometry>[] = [];
      geojson.features.forEach((f) => {
        if (
          f.geometry.type === "MultiPolygon" ||
          f.geometry.type === "MultiLineString"
        ) {
          const exploded = turf.flatten(f);
          normalizedFeatures.push(...exploded.features);
        } else if (f.geometry.type === "MultiPoint") {
          f.geometry.coordinates.forEach((coord) => {
            normalizedFeatures.push({
              type: "Feature",
              properties: f.properties,
              geometry: { type: "Point", coordinates: coord },
            });
          });
        } else {
          normalizedFeatures.push(f);
        }
      });
      const normalizedGeoJSON: GeoJSON.FeatureCollection = {
        type: "FeatureCollection",
        features: normalizedFeatures,
      };
      // Add GeoJSON source
      map.addSource(sourceId, { type: "geojson", data: normalizedGeoJSON });
      const beforeId = getTopSymbolLayerId(map);
      // Check which geometry types exist
      const hasPolygons = normalizedGeoJSON.features.some(
        (f) => f.geometry.type === "Polygon"
      );
      const hasLines = normalizedGeoJSON.features.some(
        (f) => f.geometry.type === "LineString"
      );
      const hasPoints = normalizedGeoJSON.features.some(
        (f) => f.geometry.type === "Point"
      );
      // Unified color for all geometries
      const color = "#9699FF";
      // Add polygon layer
      if (hasPolygons) {
        map.addLayer(
          {
            id: `${baseId}-fill`,
            type: "fill",
            source: sourceId,
            paint: { "fill-color": color, "fill-opacity": 0.3 },
          },
          beforeId
        );
      }
      // Add line layer
      if (hasLines) {
        map.addLayer(
          {
            id: `${baseId}-line`,
            type: "line",
            source: sourceId,
            paint: { "line-color": color, "line-width": 3 },
          },
          beforeId
        );
      }
      // Add point layer
      if (hasPoints) {
        map.addLayer(
          {
            id: `${baseId}-circle`,
            type: "circle",
            source: sourceId,
            paint: {
              "circle-radius": 6,
              "circle-color": color,
              "circle-stroke-width": 2,
              "circle-stroke-color": "#fff",
            },
          },
          beforeId
        );
      }
      // --- Add popups ---
      const popup = new mapboxgl.Popup({
        closeButton: true,
        closeOnClick: true,
      });
      const attachPopup = (layerId: string) => {
        map.on("click", layerId, (e) => {
          if (!e.features || e.features.length === 0) return;
          const feature = e.features[0];
          const props = feature.properties || {};
          let html = "<div class='text-sm'>";
          for (const key in props) {
            html += `<strong>${key}:</strong> ${props[key]}<br/>`;
          }
          html += "</div>";
          popup.setLngLat(e.lngLat).setHTML(html).addTo(map);
        });
        // Cursor change on hover
        map.on(
          "mouseenter",
          layerId,
          () => (map.getCanvas().style.cursor = "pointer")
        );
        map.on(
          "mouseleave",
          layerId,
          () => (map.getCanvas().style.cursor = "")
        );
      };
      if (hasPolygons) attachPopup(`${baseId}-fill`);
      if (hasLines) attachPopup(`${baseId}-line`);
      if (hasPoints) attachPopup(`${baseId}-circle`);
      // Zoom to feature bounds
      try {
        const bbox = turf.bbox(normalizedGeoJSON);
        map.fitBounds(bbox as [number, number, number, number], {
          padding: 40,
          duration: 1000,
        });
      } catch (err) {
        console.warn("Could not fit bounds:", err);
      }
    },
    getMap: () => mapInstance.current,
    getResourcesOnMap: () => resourceMarkersRef.current,
    flyToResource: (id: string) => {
      const res = resourceMarkersRef.current.find((r) => r.id === id);
      if (res) {
        mapInstance.current?.flyTo({
          center: res.marker.getLngLat(),
          zoom: 14,
        });
        res.marker.togglePopup();
      }
    },
    onResourcesChanged: (cb: (resources: any[]) => void) => {
      resourceListenersRef.current.push(cb);
    },
    clearAllResources,
  }));
  return (
    <>
      <div
        ref={mapContainer}
        className="fixed top-0 left-0 w-screen h-screen z-0"
      />
      {pendingResource && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/50 z-[9999]">
          <div className="bg-white rounded-xl shadow-lg p-6 w-[400px]">
            <h2 className="text-lg font-bold mb-4">Add Resource</h2>
            <label className="block mb-2 text-sm font-medium">Name</label>
            <input
              type="text"
              value={resourceName}
              onChange={(e) => setResourceName(e.target.value)}
              className="w-full border rounded p-2 mb-4"
            />
            <label className="block mb-2 text-sm font-medium">
              Description
            </label>
            <textarea
              value={resourceDesc}
              onChange={(e) => setResourceDesc(e.target.value)}
              className="w-full border rounded p-2 mb-4"
              rows={3}
            />
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setPendingResource(null)} // cancel
                className="px-4 py-2 rounded bg-gray-300 hover:bg-gray-400"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  if (pendingResource) {
                    addResourceMarker(
                      pendingResource.lngLat,
                      pendingResource.type,
                      {
                        name: resourceName,
                        description: resourceDesc,
                      }
                    );
                    setPendingResource(null);
                  }
                }}
                className="px-4 py-2 rounded bg-blue-600 text-white hover:bg-blue-700"
              >
                Add
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
});
export default MapComponent;
const addTerrainOnly = (map: mapboxgl.Map) => {
  const style = map.getStyle();
  if (!style?.sources) return; // guard for unloaded style
  if (!map.getSource("mapbox-dem")) {
    map.addSource("mapbox-dem", {
      type: "raster-dem",
      url: "mapbox://mapbox.terrain-rgb",
      tileSize: 512,
      maxzoom: 14,
    });
  }
  map.setTerrain({ source: "mapbox-dem", exaggeration: 1.3 });
};
