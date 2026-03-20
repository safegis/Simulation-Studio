"use client";

import { useRef } from "react";
import mapboxgl from "mapbox-gl";
import ReactDOMServer from "react-dom/server";
import { Users, ShoppingBasket, Building } from "lucide-react";

export const useResources = (
  mapInstance: React.RefObject<mapboxgl.Map | null>
) => {
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
      coords: r.marker.getLngLat(), // live coords
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
            popup.setHTML(createPopupHTML()); // refresh popup
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
      resourceObj.coords = newPos; // update coords
      notifyResourcesChanged();
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

  const flyToResource = (id: string) => {
    const res = resourceMarkersRef.current.find((r) => r.id === id);
    if (res && mapInstance.current) {
      mapInstance.current.flyTo({
        center: res.marker.getLngLat(),
        zoom: 14,
      });
      res.marker.togglePopup();
    }
  };

  const getResourcesOnMap = () => {
    return resourceMarkersRef.current;
  };

  return {
    resourceMarkersRef,
    resourceListenersRef,
    addResourceMarker,
    clearAllResources,
    flyToResource,
    getResourcesOnMap,
    onResourcesChanged: (cb: (resources: any[]) => void) => {
      resourceListenersRef.current.push(cb);
    },
    notifyResourcesChanged,
  };
};
