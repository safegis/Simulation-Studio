// \SafeGIS\Simulation-Studio\frontend\src\components\controls\Main\CenterRightControls.tsx
"use client";

import {
  ZoomIn,
  ZoomOut,
  File,
  X,
  ChevronDown,
  Upload,
  Check,
  RotateCcw,
  Undo2,
  Redo2,
  Link2,
  Database,
  Server,
  FolderUp,
} from "lucide-react";
import {
  RefObject,
  useRef,
  useState,
  useEffect,
  useLayoutEffect,
  useCallback,
  forwardRef,
  useImperativeHandle,
} from "react";
import type { FeatureCollection, Geometry, GeoJsonProperties } from "geojson";
import { createPortal } from "react-dom";
import geoBoundariesData from "./Boundary Options/geoBoundaries.json";
import {
  getBoundaryLevelsForCountry,
  type BoundarySourceId,
} from "@/lib/boundaryLevelsBySource";

/** Payload for Atlas / chat-driven GeoJSON fetch (same contract as backend FetchUrlRequest). */
export type AtlasFetchUrlPayload = {
  url: string;
  method?: "GET" | "POST";
  auth_type?: "none" | "bearer" | "apikey_header" | "apikey_query" | "basic";
  bearer_or_key_value?: string | null;
  api_key_header_name?: string;
  api_query_param_name?: string;
  basic_user?: string | null;
  basic_password?: string | null;
  post_body_json?: string | null;
  layer_display_name?: string | null;
};

// Ref interface for AI control
export interface CenterRightControlsRef {
  openBoundariesPanel: (
    source?: string,
    country?: string,
    adminLevel?: number
  ) => void;
  clearBoundaries: () => void;
  openImportFilesPanel: () => void;
  /** Close import / boundary panels and dropdowns. */
  closeAllPanels: () => void;
  /** Fetch GeoJSON via Simulation backend and add as a map layer (used by Atlas). */
  fetchAndAddGeoJsonFromUrl: (
    payload: AtlasFetchUrlPayload
  ) => Promise<{ ok: boolean; error?: string }>;
}

// Type for boundary data
interface BoundaryLevel {
  label: string;
  adminLevel: string;
}

interface CountryBoundary {
  name: string;
  code: string;
  levels: BoundaryLevel[];
}

type CountryBoundaries = Record<string, CountryBoundary>;

// Cast the imported JSON to the correct type
const countryBoundaries: CountryBoundaries =
  geoBoundariesData as CountryBoundaries;

// Derive boundary options from countryBoundaries keys (sorted alphabetically)
const boundaryOptions = Object.keys(countryBoundaries).sort();

/** Custom dropdown matching boundaries / pathfinder dark panel style (not native select). */
function PanelSelect<V extends string>({
  value,
  onChange,
  options,
  disabled,
}: {
  value: V;
  onChange: (v: V) => void;
  options: readonly { value: V; label: string }[];
  disabled?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const [menuStyle, setMenuStyle] = useState<React.CSSProperties>({});

  const updatePosition = useCallback(() => {
    const el = triggerRef.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    setMenuStyle({
      position: "fixed",
      top: r.bottom + 4,
      left: r.left,
      width: Math.max(r.width, 120),
      zIndex: 10000,
    });
  }, []);

  useLayoutEffect(() => {
    if (!open) return;
    updatePosition();
    const onScroll = () => updatePosition();
    window.addEventListener("scroll", onScroll, true);
    window.addEventListener("resize", onScroll);
    return () => {
      window.removeEventListener("scroll", onScroll, true);
      window.removeEventListener("resize", onScroll);
    };
  }, [open, updatePosition]);

  useEffect(() => {
    if (!open) return;
    const close = (e: MouseEvent) => {
      const t = e.target as Node;
      if (triggerRef.current?.contains(t)) return;
      if (menuRef.current?.contains(t)) return;
      setOpen(false);
    };
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, [open]);

  const label =
    options.find((o) => o.value === value)?.label ?? String(value);

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        disabled={disabled}
        onClick={() => {
          if (disabled) return;
          setOpen((o) => {
            const next = !o;
            if (next) requestAnimationFrame(updatePosition);
            return next;
          });
        }}
        className={`flex justify-between items-center w-full bg-[#2E2E2E] text-white p-1.5 px-2 rounded-sm text-[10px] min-w-0 border border-[#555] outline-none focus:border-[#9699FF] ${
          disabled
            ? "opacity-50 cursor-not-allowed"
            : "hover:bg-[#454545] cursor-pointer"
        }`}
      >
        <span className="truncate text-left">{label}</span>
        <ChevronDown
          size={12}
          className={`ml-1 shrink-0 transition-transform duration-200 ${
            open ? "rotate-180" : ""
          }`}
        />
      </button>
      {open &&
        createPortal(
          <div
            ref={menuRef}
            style={menuStyle}
            className="bg-[#3a3a3a] rounded-sm shadow-lg border border-[#555] max-h-48 overflow-y-auto py-0.5 scrollbar-rounded"
            role="listbox"
          >
            {options.map((opt) => (
              <button
                key={opt.value}
                type="button"
                role="option"
                aria-selected={opt.value === value}
                onClick={() => {
                  onChange(opt.value);
                  setOpen(false);
                }}
                className={`w-full text-left px-2 py-1.5 text-[10px] leading-snug break-words hover:bg-[#505050] ${
                  opt.value === value
                    ? "bg-gradient-to-r from-[#9699FF] to-white text-[#2E2E2E] font-medium"
                    : "text-white"
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>,
          document.body
        )}
    </>
  );
}

interface RightSideControlsProps {
  show3DControls: boolean;
  viewMode: "2d" | "3d";
  switchTo2D: () => void;
  switchTo3D: () => void;
  handleZoom: (inc: number) => void;
  mapRef: RefObject<any>;
  uploadedFiles?: { name: string; layerName: string; sourceType?: string }[];
  setUploadedFiles?: React.Dispatch<
    React.SetStateAction<
      { name: string; layerName: string; sourceType?: string }[]
    >
  >;
  isBoundaryLoading?: boolean;
  setIsBoundaryLoading?: React.Dispatch<React.SetStateAction<boolean>>;
  setBoundaryLoadingStage?: React.Dispatch<React.SetStateAction<string>>;
  isFileLoading?: boolean;
  setIsFileLoading?: React.Dispatch<React.SetStateAction<boolean>>;
  setFileLoadingStage?: React.Dispatch<React.SetStateAction<string>>;
  /** Reset map + all UI to defaults (from parent). */
  onGlobalReset?: () => void;
  canUndo?: boolean;
  canRedo?: boolean;
  onUndo?: () => void;
  onRedo?: () => void;
}

const RightSideControls = forwardRef<
  CenterRightControlsRef,
  RightSideControlsProps
>(
  (
    {
      show3DControls,
      viewMode,
      switchTo2D,
      switchTo3D,
      handleZoom,
      mapRef,
      uploadedFiles = [],
      setUploadedFiles = () => {},
      isBoundaryLoading: externalIsBoundaryLoading,
      setIsBoundaryLoading: externalSetIsBoundaryLoading,
      setBoundaryLoadingStage: externalSetBoundaryLoadingStage,
      isFileLoading: externalIsFileLoading,
      setIsFileLoading: externalSetIsFileLoading,
      setFileLoadingStage: externalSetFileLoadingStage,
      onGlobalReset,
      canUndo = false,
      canRedo = false,
      onUndo,
      onRedo,
    },
    ref
  ) => {
    const [showGeoJSONPanel, setShowGeoJSONPanel] = useState(false);
    type SpatialDataTab = "file" | "api" | "sql" | "mcp";
    const [spatialDataTab, setSpatialDataTab] =
      useState<SpatialDataTab>("file");
    const [apiHttpMethod, setApiHttpMethod] = useState<"GET" | "POST">("GET");
    const [apiEndpointUrl, setApiEndpointUrl] = useState("");
    const [apiAuthType, setApiAuthType] = useState<
      "none" | "bearer" | "apikey_header" | "apikey_query" | "basic"
    >("none");
    const [apiBearerOrKeyValue, setApiBearerOrKeyValue] = useState("");
    const [apiKeyHeaderName, setApiKeyHeaderName] = useState("X-API-Key");
    const [apiQueryParamName, setApiQueryParamName] = useState("api_key");
    const [apiBasicUser, setApiBasicUser] = useState("");
    const [apiBasicPassword, setApiBasicPassword] = useState("");
    const [apiPostBody, setApiPostBody] = useState("");
    const [apiLayerDisplayName, setApiLayerDisplayName] = useState("");

    const [sqlEngine, setSqlEngine] = useState<
      "postgresql" | "mysql" | "mssql" | "sqlite"
    >("postgresql");
    const [sqlHost, setSqlHost] = useState("");
    const [sqlPort, setSqlPort] = useState("5432");
    const [sqlDatabase, setSqlDatabase] = useState("");
    const [sqlSchema, setSqlSchema] = useState("");
    const [sqlUsername, setSqlUsername] = useState("");
    const [sqlPassword, setSqlPassword] = useState("");
    const [sqlSslMode, setSqlSslMode] = useState<
      "disable" | "prefer" | "require" | "verify-full"
    >("require");
    const [sqlTableOrView, setSqlTableOrView] = useState("");
    const [sqlGeometryColumn, setSqlGeometryColumn] = useState("geom");

    const [mcpDisplayName, setMcpDisplayName] = useState("");
    const [mcpTransport, setMcpTransport] = useState<
      "sse" | "streamable_http" | "websocket" | "stdio"
    >("sse");
    const [mcpServerUrl, setMcpServerUrl] = useState("");
    const [mcpStdioCommand, setMcpStdioCommand] = useState("");
    const [mcpAuthKeyOrToken, setMcpAuthKeyOrToken] = useState("");
    const [mcpOAuthClientId, setMcpOAuthClientId] = useState("");
    const [mcpOAuthClientSecret, setMcpOAuthClientSecret] = useState("");

    const [fileLayerDisplayName, setFileLayerDisplayName] = useState("");
    const [isDragging, setIsDragging] = useState(false);
    const [showBoundariesPanel, setShowBoundariesPanel] = useState(false);
    const [sessionId] = useState(
      () => `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    );
    const [selectedBoundary, setSelectedBoundary] = useState<string | null>(
      null
    );
    const [boundarySearchTerm, setBoundarySearchTerm] = useState("");
    const boundaryButtonRef = useRef<HTMLButtonElement>(null);
    const [showBoundaryDropdown, setShowBoundaryDropdown] = useState(false);
    const [hoveredButton, setHoveredButton] = useState<string | null>(null);

    const fileInputRef = useRef<HTMLInputElement | null>(null);

    const spatialFieldClass =
      "w-full bg-[#2E2E2E] text-white text-[10px] px-2 py-1.5 rounded-sm border border-[#555] outline-none focus:border-[#9699FF]";

    const backendBase =
      process.env.NEXT_PUBLIC_BACKEND_ENDPOINT || "http://localhost:8000";

    async function parseBackendError(res: Response): Promise<string> {
      try {
        const j = (await res.json()) as { detail?: unknown };
        const d = j.detail;
        if (typeof d === "string") return d;
        if (Array.isArray(d))
          return d
            .map((x: { msg?: string }) => x?.msg || JSON.stringify(x))
            .join("; ");
        if (d != null) return JSON.stringify(d);
      } catch {
        /* ignore */
      }
      return res.statusText || `HTTP ${res.status}`;
    }

    const addConnectorGeoJsonToMap = async (
      fc: FeatureCollection<Geometry, GeoJsonProperties>,
      listName: string,
      idPrefix: string,
      sourceType?: string
    ) => {
      const safePrefix =
        idPrefix.replace(/[^a-zA-Z0-9_-]/g, "_").slice(0, 40) || "layer";
      const layerName = `${safePrefix}_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
      if (!mapRef.current?.addGeoJSONLayer) {
        alert("Map is not ready yet.");
        return;
      }
      await mapRef.current.addGeoJSONLayer(fc, layerName);
      setUploadedFiles((prev) => [
        ...prev,
        sourceType
          ? { name: listName, layerName, sourceType }
          : { name: listName, layerName },
      ]);
    };

    const runAtlasFetchUrl = async (
      payload: AtlasFetchUrlPayload
    ): Promise<{ ok: boolean; error?: string }> => {
      const url = payload.url?.trim();
      if (!url) return { ok: false, error: "Missing URL" };
      if (!mapRef.current?.addGeoJSONLayer) {
        return { ok: false, error: "Map is not ready yet." };
      }
      setIsFileLoading(true);
      setFileLoadingStage("Fetching GeoJSON (Atlas)…");
      try {
        const method = (payload.method || "GET").toUpperCase() as "GET" | "POST";
        const body = {
          url,
          method,
          auth_type: payload.auth_type || "none",
          bearer_or_key_value: payload.bearer_or_key_value?.trim() || null,
          api_key_header_name: payload.api_key_header_name || "X-API-Key",
          api_query_param_name: payload.api_query_param_name || "api_key",
          basic_user: payload.basic_user?.trim() || null,
          basic_password: payload.basic_password ?? null,
          post_body_json:
            method === "POST" && payload.post_body_json?.trim()
              ? payload.post_body_json.trim()
              : null,
        };
        const res = await fetch(`${backendBase}/api/spatial-data/fetch-url`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        });
        if (!res.ok) throw new Error(await parseBackendError(res));
        const fc = (await res.json()) as FeatureCollection<
          Geometry,
          GeoJsonProperties
        >;
        if (fc.type !== "FeatureCollection" || !Array.isArray(fc.features)) {
          throw new Error("Server did not return a valid FeatureCollection.");
        }
        const listName =
          payload.layer_display_name?.trim() ||
          (() => {
            try {
              return new URL(url).hostname;
            } catch {
              return "Atlas URL layer";
            }
          })();
        await addConnectorGeoJsonToMap(fc, listName, listName, "atlas_url");
        return { ok: true };
      } catch (e) {
        return {
          ok: false,
          error: e instanceof Error ? e.message : String(e),
        };
      } finally {
        setIsFileLoading(false);
      }
    };

    const handleConnectApi = async () => {
      const url = apiEndpointUrl.trim();
      if (!url) {
        alert("Enter an endpoint URL.");
        return;
      }
      if (apiAuthType === "basic") {
        if (!apiBasicUser.trim()) {
          alert("Basic auth requires a username.");
          return;
        }
      } else if (
        apiAuthType === "bearer" ||
        apiAuthType === "apikey_header" ||
        apiAuthType === "apikey_query"
      ) {
        if (!apiBearerOrKeyValue.trim()) {
          alert("Enter a token or API key for the selected auth type.");
          return;
        }
      }
      setIsFileLoading(true);
      setFileLoadingStage("Fetching GeoJSON from API…");
      try {
        const body = {
          url,
          method: apiHttpMethod,
          auth_type: apiAuthType,
          bearer_or_key_value: apiBearerOrKeyValue.trim() || null,
          api_key_header_name: apiKeyHeaderName || "X-API-Key",
          api_query_param_name: apiQueryParamName || "api_key",
          basic_user: apiBasicUser.trim() || null,
          basic_password: apiBasicPassword || null,
          post_body_json:
            apiHttpMethod === "POST" && apiPostBody.trim()
              ? apiPostBody.trim()
              : null,
        };
        const res = await fetch(`${backendBase}/api/spatial-data/fetch-url`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        });
        if (!res.ok) throw new Error(await parseBackendError(res));
        const fc = (await res.json()) as FeatureCollection<
          Geometry,
          GeoJsonProperties
        >;
        if (fc.type !== "FeatureCollection" || !Array.isArray(fc.features)) {
          throw new Error("Server did not return a valid FeatureCollection.");
        }
        const listName =
          apiLayerDisplayName.trim() ||
          (() => {
            try {
              return new URL(url).hostname;
            } catch {
              return "API layer";
            }
          })();
        await addConnectorGeoJsonToMap(fc, listName, listName, "api");
      } catch (e) {
        alert(e instanceof Error ? e.message : String(e));
      } finally {
        setIsFileLoading(false);
      }
    };

    const handleConnectSql = async () => {
      if (sqlEngine !== "postgresql") {
        alert(
          "Only PostgreSQL / PostGIS is supported by the backend from this panel. Choose PostgreSQL, or use Local file / API."
        );
        return;
      }
      if (!sqlHost.trim() || !sqlDatabase.trim() || !sqlUsername.trim()) {
        alert("Host, database, and username are required.");
        return;
      }
      if (!sqlTableOrView.trim()) {
        alert("Enter a table or view name.");
        return;
      }
      const port = parseInt(sqlPort, 10);
      if (Number.isNaN(port) || port < 1 || port > 65535) {
        alert("Enter a valid port (1–65535).");
        return;
      }
      setIsFileLoading(true);
      setFileLoadingStage("Loading from PostGIS…");
      try {
        const body = {
          host: sqlHost.trim(),
          port,
          database: sqlDatabase.trim(),
          username: sqlUsername.trim(),
          password: sqlPassword,
          db_schema: sqlSchema.trim() || "public",
          table_or_view: sqlTableOrView.trim(),
          geometry_column: sqlGeometryColumn.trim() || "geom",
          ssl_mode: sqlSslMode,
        };
        const res = await fetch(`${backendBase}/api/spatial-data/postgis`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        });
        if (!res.ok) throw new Error(await parseBackendError(res));
        const fc = (await res.json()) as FeatureCollection<
          Geometry,
          GeoJsonProperties
        >;
        if (fc.type !== "FeatureCollection" || !Array.isArray(fc.features)) {
          throw new Error("Server did not return a valid FeatureCollection.");
        }
        const listName = `${sqlTableOrView.trim()} (${sqlDatabase.trim()})`;
        await addConnectorGeoJsonToMap(fc, listName, listName, "postgis");
      } catch (e) {
        alert(e instanceof Error ? e.message : String(e));
      } finally {
        setIsFileLoading(false);
      }
    };

    const handleConnectMcp = async () => {
      if (mcpTransport === "stdio") {
        alert(
          "Stdio MCP cannot be started from the web UI. If your tool exposes GeoJSON over HTTPS, choose HTTP + SSE (or Streamable HTTP), paste that URL here, and connect — or use the API tab."
        );
        return;
      }
      const url = mcpServerUrl.trim();
      if (!url) {
        alert("Enter a server URL. For raw GeoJSON, this uses the same proxy as the API tab (full MCP session protocol is not implemented here).");
        return;
      }
      if (mcpOAuthClientId.trim() || mcpOAuthClientSecret) {
        console.warn(
          "MCP OAuth client fields are not sent to the backend in this version; use the access token field if your server accepts Bearer auth."
        );
      }
      setIsFileLoading(true);
      setFileLoadingStage("Fetching via MCP URL…");
      try {
        const body = {
          url,
          method: "GET" as const,
          auth_type: mcpAuthKeyOrToken.trim() ? ("bearer" as const) : ("none" as const),
          bearer_or_key_value: mcpAuthKeyOrToken.trim() || null,
          api_key_header_name: "X-API-Key",
          api_query_param_name: "api_key",
          basic_user: null,
          basic_password: null,
          post_body_json: null,
        };
        const res = await fetch(`${backendBase}/api/spatial-data/fetch-url`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        });
        if (!res.ok) throw new Error(await parseBackendError(res));
        const fc = (await res.json()) as FeatureCollection<
          Geometry,
          GeoJsonProperties
        >;
        if (fc.type !== "FeatureCollection" || !Array.isArray(fc.features)) {
          throw new Error("Server did not return a valid FeatureCollection.");
        }
        const listName =
          mcpDisplayName.trim() ||
          (() => {
            try {
              return new URL(url).hostname;
            } catch {
              return "MCP / HTTP layer";
            }
          })();
        await addConnectorGeoJsonToMap(fc, listName, listName, "mcp_http");
      } catch (e) {
        alert(e instanceof Error ? e.message : String(e));
      } finally {
        setIsFileLoading(false);
      }
    };

    const [showBoundaryLevelDropdown, setShowBoundaryLevelDropdown] =
      useState(false);
    /** Stable slot: admin0, admin1, … (labels differ by data source). */
    const [selectedBoundaryAdminSlot, setSelectedBoundaryAdminSlot] = useState<
      string | null
    >(null);
    const boundaryLevelButtonRef = useRef<HTMLButtonElement>(null);

    // Boundary source dropdown state
    const [selectedBoundarySource, setSelectedBoundarySource] = useState<
      BoundarySourceId | null
    >(null);
    const [showBoundarySourceDropdown, setShowBoundarySourceDropdown] =
      useState(false);
    const boundarySourceButtonRef = useRef<HTMLButtonElement>(null);
    /** UI label → id for `addBoundaryLayer` */
    const boundarySourceOptions: { label: string; id: BoundarySourceId }[] = [
      { label: "geoBoundaries", id: "geoboundaries" },
      { label: "OSM (Overpass)", id: "osm" },
      { label: "Geoapify", id: "geoapify" },
    ];

    const boundarySourceLabel = (id: string | null) =>
      boundarySourceOptions.find((o) => o.id === id)?.label ?? id ?? "";

    // Use external loading state if provided, otherwise use local state
    const [localIsBoundaryLoading, setLocalIsBoundaryLoading] = useState(false);
    const isBoundaryLoading =
      externalIsBoundaryLoading ?? localIsBoundaryLoading;
    const setIsBoundaryLoading =
      externalSetIsBoundaryLoading ?? setLocalIsBoundaryLoading;
    const setBoundaryLoadingStage =
      externalSetBoundaryLoadingStage ?? (() => {});

    // Use external file loading state if provided, otherwise use local state
    const [localIsFileLoading, setLocalIsFileLoading] = useState(false);
    const isFileLoading = externalIsFileLoading ?? localIsFileLoading;
    const setIsFileLoading = externalSetIsFileLoading ?? setLocalIsFileLoading;
    const setFileLoadingStage = externalSetFileLoadingStage ?? (() => {});

    // Expose methods for AI control via ref
    useImperativeHandle(ref, () => ({
      openBoundariesPanel: (
        source?: string,
        country?: string,
        adminLevel?: number
      ) => {
        console.log("🔵 AI opening boundaries panel:", {
          source,
          country,
          adminLevel,
        });

        // Open the panel
        setShowBoundariesPanel(true);

        // Set source if provided
        if (source) {
          const s = source.toLowerCase();
          if (s.includes("osm") || s.includes("overpass")) {
            setSelectedBoundarySource("osm");
          } else if (s.includes("geoapify")) {
            setSelectedBoundarySource("geoapify");
          } else {
            setSelectedBoundarySource("geoboundaries");
          }
        }

        // Delay setting country and admin level to ensure panel is mounted
        setTimeout(() => {
          // Set country if provided
          if (country) {
            // Find the country in boundaryOptions (case-insensitive)
            // Match against both the full key (e.g., "Philippines (PH)") and the country name
            const matchedCountry = boundaryOptions.find((opt) => {
              const optLower = opt.toLowerCase();
              const countryLower = country.toLowerCase();
              // Check if the option starts with the country name
              return (
                optLower === countryLower ||
                optLower.startsWith(countryLower + " (")
              );
            });
            if (matchedCountry) {
              console.log("🔵 Setting country to:", matchedCountry);
              setSelectedBoundary(matchedCountry);

              // Set admin level if provided
              if (adminLevel !== undefined) {
                setTimeout(() => {
                  const countryData = countryBoundaries[matchedCountry];
                  if (countryData) {
                    // Find the level that matches the admin level
                    // Format is "admin0", "admin1", etc.
                    const level = countryData.levels.find(
                      (l) => l.adminLevel === `admin${adminLevel}`
                    );
                    if (level) {
                      console.log("🔵 Setting admin slot to:", level.adminLevel);
                      setSelectedBoundaryAdminSlot(level.adminLevel);
                    } else {
                      console.warn(
                        `🔵 Admin level admin${adminLevel} not found for ${matchedCountry}. Available levels:`,
                        countryData.levels.map((l) => l.adminLevel)
                      );
                    }
                  }
                }, 100);
              }
            } else {
              console.warn(
                `🔵 Country "${country}" not found in boundary options`
              );
            }
          }
        }, 100);
      },
      clearBoundaries: () => {
        console.log("🔵 AI clearing boundaries");
        // Clear all boundary selections
        setSelectedBoundarySource(null);
        setSelectedBoundary(null);
        setSelectedBoundaryAdminSlot(null);
        // Close the panel
        setShowBoundariesPanel(false);
        // Clear boundaries from the map by calling the map's clear function
        if (mapRef?.current?.clearBoundaries) {
          mapRef.current.clearBoundaries();
        }
      },
      openImportFilesPanel: () => {
        setShowGeoJSONPanel(true);
        setShowBoundariesPanel(false);
      },
      closeAllPanels: () => {
        setShowGeoJSONPanel(false);
        setShowBoundariesPanel(false);
        setShowBoundaryDropdown(false);
        setShowBoundaryLevelDropdown(false);
        setShowBoundarySourceDropdown(false);
      },
      fetchAndAddGeoJsonFromUrl: (payload: AtlasFetchUrlPayload) =>
        runAtlasFetchUrl(payload),
    }));

    // ✅ File handling inside component
    const handleFiles = async (files: FileList) => {
      setIsFileLoading(true);
      setFileLoadingStage("Reading file...");
      try {
        for (const file of Array.from(files)) {
          const defaultStem =
            file.name.replace(/\.[^.]+$/, "").replace(/\s+/g, "_") || "upload";
          const namePrefix = (
            fileLayerDisplayName.trim() || defaultStem
          ).replace(/[^a-zA-Z0-9_-]/g, "_");
          const uniqueLayerId = () =>
            `${namePrefix}_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;

          const ext = file.name.split(".").pop()?.toLowerCase();
          try {
            let geojson:
              | FeatureCollection<Geometry, GeoJsonProperties>
              | FeatureCollection<Geometry, GeoJsonProperties>[]
              | null = null;

            if (ext === "geojson" || ext === "json") {
              setFileLoadingStage("Parsing GeoJSON...");
              const text = await file.text();
              geojson = JSON.parse(text);
            } else if (ext === "kml") {
              setFileLoadingStage("Parsing KML...");
              const text = await file.text();
              const dom = new DOMParser().parseFromString(text, "text/xml");
              const toGeoJSON = await import("@mapbox/togeojson");
              geojson = toGeoJSON.kml(dom) as FeatureCollection<
                Geometry,
                GeoJsonProperties
              >;
            } else if (ext === "zip" || ext === "shp") {
              try {
                setFileLoadingStage("Extracting shapefile...");
                const arrayBuffer = await file.arrayBuffer();
                const shp = (await import("shpjs")).default;
                setFileLoadingStage("Parsing shapefile...");
                let result: any = await shp(arrayBuffer);

                // Convert to JSON and back to remove circular references
                try {
                  const jsonStr = JSON.stringify(result);
                  result = JSON.parse(jsonStr);
                  console.log("Shapefile parsed and sanitized");
                } catch (jsonError) {
                  console.error(
                    "Could not serialize shapefile result, using as-is"
                  );
                }

                // shpjs typically returns a FeatureCollection directly
                if (result && result.type === "FeatureCollection") {
                  console.log(
                    "Direct FeatureCollection, features:",
                    result.features?.length
                  );
                  geojson = result;
                } else if (Array.isArray(result)) {
                  console.log("Array of FeatureCollections");
                  geojson = result;
                } else {
                  console.warn(
                    "Unexpected shapefile format, attempting to use as-is"
                  );
                  geojson = result;
                }
              } catch (shpError) {
                const errorMsg =
                  shpError instanceof Error
                    ? shpError.message
                    : "Unknown error";
                console.error("Error parsing shapefile:", errorMsg);
                throw new Error(`Shapefile parsing failed: ${errorMsg}`);
              }
            }

            if (geojson) {
              setFileLoadingStage("Processing geometry...");
              if (Array.isArray(geojson)) {
                // Handle multiple feature collections
                for (let i = 0; i < geojson.length; i++) {
                  const fc = geojson[i];
                  if (fc && fc.type === "FeatureCollection") {
                    setFileLoadingStage(`Rendering layer ${i + 1}...`);
                    const layerName = uniqueLayerId();
                    await mapRef.current?.addGeoJSONLayer(fc, layerName);
                    if (setUploadedFiles) {
                      const listName = fileLayerDisplayName.trim()
                        ? `${fileLayerDisplayName} · ${file.name} (layer ${i + 1})`
                        : `${file.name} (Layer ${i + 1})`;
                      setUploadedFiles((prev) => [
                        ...prev,
                        { name: listName, layerName, sourceType: "file" },
                      ]);
                    }
                  }
                }
              } else if (geojson.type === "FeatureCollection") {
                setFileLoadingStage("Rendering on map...");
                const layerName = uniqueLayerId();
                await mapRef.current?.addGeoJSONLayer(geojson, layerName);
                if (setUploadedFiles) {
                  const listName = fileLayerDisplayName.trim()
                    ? `${fileLayerDisplayName} (${file.name})`
                    : file.name;
                  setUploadedFiles((prev) => [
                    ...prev,
                    { name: listName, layerName, sourceType: "file" },
                  ]);
                }
              }
            }
          } catch (err) {
            // Avoid logging circular references that cause stack overflow
            const errorMessage =
              err instanceof Error ? err.message : String(err);
            console.error(
              `Error processing file: "${file.name}"`,
              errorMessage
            );
            alert(`Failed to load ${file.name}: ${errorMessage}`);
          }
        }
      } finally {
        setIsFileLoading(false);
      }
    };

    const handleDrop = (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);
      if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
        handleFiles(e.dataTransfer.files);
      }
    };

    const handleDragOver = (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(true);
    };

    const handleDragLeave = () => setIsDragging(false);

    const handleRemoveFile = (layerName: string) => {
      if (!mapRef.current) return;

      const safeName = layerName.replace(/[^a-zA-Z0-9_-]/g, "");
      const sourceId = `upload-${safeName}`;
      const baseId = `${sourceId}-layer`;

      const map = mapRef.current.getMap();
      if (map) {
        ["fill", "line", "circle"].forEach((type) => {
          const layerId = `${baseId}-${type}`;
          if (map.getLayer(layerId)) map.removeLayer(layerId);
        });

        if (map.getSource(sourceId)) map.removeSource(sourceId);
      }

      if (setUploadedFiles) {
        setUploadedFiles((prev) =>
          prev.filter((f) => f.layerName !== layerName)
        );
      }

      if (fileInputRef.current) fileInputRef.current.value = "";
    };

    // Effect to render boundary on map when selection changes
    useEffect(() => {
      if (!mapRef.current) return;

      // If no boundary level selected, remove any existing boundary layer
      if (
        !selectedBoundarySource ||
        !selectedBoundary ||
        !selectedBoundaryAdminSlot
      ) {
        mapRef.current.removeBoundaryLayer?.();
        setIsBoundaryLoading(false);
        return;
      }

      const countryData = countryBoundaries[selectedBoundary];
      if (!countryData) return;

      const countryCode = countryData.code;
      const levelRows = getBoundaryLevelsForCountry(
        selectedBoundarySource,
        selectedBoundary,
        countryBoundaries
      );
      const levelData = levelRows.find(
        (r) => r.adminLevel === selectedBoundaryAdminSlot
      );
      if (!levelData) return;

      // Set loading state and add the boundary layer
      const loadBoundary = async () => {
        setIsBoundaryLoading(true);
        setBoundaryLoadingStage("Fetching boundary metadata...");
        try {
          setBoundaryLoadingStage("Downloading boundary data...");
          await mapRef.current.addBoundaryLayer?.(
            countryCode,
            levelData.adminLevel,
            levelData.label,
            selectedBoundarySource,
            selectedBoundarySource === "geoapify"
              ? countryData.name
              : undefined
          );
          setBoundaryLoadingStage("Rendering boundary...");
        } catch (error) {
          console.error("Error loading boundary:", error);
        } finally {
          setIsBoundaryLoading(false);
          setBoundaryLoadingStage("");
        }
      };

      loadBoundary();
    }, [
      selectedBoundarySource,
      selectedBoundary,
      selectedBoundaryAdminSlot,
      mapRef,
    ]);

    const boundaryLevelRows =
      selectedBoundarySource && selectedBoundary
        ? getBoundaryLevelsForCountry(
            selectedBoundarySource,
            selectedBoundary,
            countryBoundaries
          )
        : [];
    const selectedBoundaryLevelLabel =
      boundaryLevelRows.find((r) => r.adminLevel === selectedBoundaryAdminSlot)
        ?.label ?? "";

    return (
      <div className="absolute right-[15px] top-1/2 -translate-y-1/2 z-50 flex flex-col items-center gap-2">
        {/* 2D/3D Toggle */}
        {show3DControls && (
          <div className="relative bg-[#2E2E2E] p-1 rounded-md shadow-md w-[40px] overflow-hidden">
            <div
              className="absolute w-[32px] h-[32px] left-1 rounded bg-gradient-to-b from-[#9699FF] to-white transition-all duration-300 ease-in-out"
              style={{ top: viewMode === "2d" ? "4px" : "40px" }}
            />
            <div className="relative z-10 flex flex-col gap-1 items-center">
              <button
                onClick={switchTo2D}
                className={`w-[32px] h-[32px] inline-flex items-center justify-center rounded ${
                  viewMode === "2d" ? "text-[#2E2E2E]" : "text-[#C7C7C7]"
                }`}
              >
                <span className="font-semibold text-xs leading-none">2D</span>
              </button>
              <button
                onClick={switchTo3D}
                className={`w-[32px] h-[32px] inline-flex items-center justify-center rounded ${
                  viewMode === "3d" ? "text-[#2E2E2E]" : "text-[#C7C7C7]"
                }`}
              >
                <span className="font-semibold text-xs leading-none">3D</span>
              </button>
            </div>
          </div>
        )}

        {/* Zoom buttons */}
        <div className="bg-[#2E2E2E] p-1 rounded-md shadow-md w-[40px] flex flex-col gap-1">
          <button
            onClick={() => handleZoom(1)}
            className="w-[32px] h-[32px] hover:bg-[#3a3a3a] text-[#C7C7C7] inline-flex items-center justify-center rounded transition"
          >
            <ZoomIn size={18} className="shrink-0" />
          </button>
          <button
            onClick={() => handleZoom(-1)}
            className="w-[32px] h-[32px] hover:bg-[#3a3a3a] text-[#C7C7C7] inline-flex items-center justify-center rounded transition"
          >
            <ZoomOut size={18} className="shrink-0" />
          </button>
        </div>

        {/* Spatial data: local files, API, SQL, MCP */}
        <div className="relative bg-[#2E2E2E] p-1 rounded-md shadow-md w-[40px] h-[40px] flex justify-center items-center">
          <button
            onClick={() => {
              setShowGeoJSONPanel((prev) => !prev);
              setShowBoundariesPanel(false); // Close boundaries panel
            }}
            onMouseEnter={() => setHoveredButton("importFiles")}
            onMouseLeave={() => setHoveredButton(null)}
            className={`w-[32px] h-[32px] inline-flex items-center justify-center rounded transition ${
              showGeoJSONPanel
                ? "bg-gradient-to-b from-[#9699FF] to-white"
                : "hover:bg-[#3a3a3a] text-[#C7C7C7]"
            }`}
          >
            <File
              size={18}
              color={showGeoJSONPanel ? "#2E2E2E" : "#C7C7C7"}
              className="shrink-0"
            />
          </button>
          {hoveredButton === "importFiles" && !showGeoJSONPanel && (
            <div className="absolute right-[50px] top-1/2 -translate-y-1/2 bg-white text-black text-[11px] px-2 py-1 rounded shadow-lg z-[9999] whitespace-nowrap">
              Add spatial data
            </div>
          )}

          {showGeoJSONPanel && (
            <div className="absolute right-full mr-2 top-1/2 -translate-y-1/2 w-[min(100vw-2rem,320px)] max-h-[min(90vh,560px)] bg-[#2E2E2E] rounded-md shadow-md p-3 z-40 flex flex-col items-stretch min-h-0">
              <h3 className="shrink-0 text-center text-[11px] font-semibold text-white mb-0.5">
                Import / connect spatial data
              </h3>
              <p className="shrink-0 text-center text-[9px] text-[#AAAAAA] mb-2 leading-snug">
                Import files or connect live sources (API, database, MCP).
              </p>

              {/* Source type tabs — full width, equal columns */}
              <div
                className="grid grid-cols-4 gap-1 mb-2 shrink-0 w-full"
                role="tablist"
              >
                {(
                  [
                    {
                      id: "file" as const,
                      label: "Local file",
                      icon: FolderUp,
                    },
                    { id: "api" as const, label: "API", icon: Link2 },
                    { id: "sql" as const, label: "SQL", icon: Database },
                    { id: "mcp" as const, label: "MCP", icon: Server },
                  ] as const
                ).map(({ id, label, icon: Icon }) => (
                  <button
                    key={id}
                    type="button"
                    role="tab"
                    aria-selected={spatialDataTab === id}
                    onClick={() => setSpatialDataTab(id)}
                    className={`flex w-full min-w-0 flex-col items-center justify-center gap-0.5 px-0.5 py-1.5 rounded-sm text-[8px] font-medium leading-tight text-center transition ${
                      spatialDataTab === id
                        ? "bg-gradient-to-b from-[#9699FF] to-white text-[#2E2E2E]"
                        : "bg-[#3a3a3a] text-[#C7C7C7] hover:bg-[#454545]"
                    }`}
                  >
                    <Icon size={12} className="shrink-0" />
                    <span className="line-clamp-2 break-words hyphens-auto max-w-full">
                      {label}
                    </span>
                  </button>
                ))}
              </div>

              <div
                className="flex flex-col gap-1.5 w-full min-h-0 flex-1 overflow-y-auto overflow-x-hidden pr-0.5 scrollbar-rounded"
                role="tabpanel"
              >
                {uploadedFiles.length > 0 && (
                  <div className="text-[9px] text-[#888] uppercase tracking-wide mb-0.5">
                    On map
                  </div>
                )}
                {uploadedFiles.map((file, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between bg-[#3a3a3a] text-white px-2 py-1 rounded-sm w-full"
                  >
                    <span className="truncate text-[10px]">{file.name}</span>
                    <button
                      onClick={() => handleRemoveFile(file.layerName)}
                      className="text-red-400 hover:text-red-600 ml-1.5"
                      type="button"
                    >
                      <X size={14} />
                    </button>
                  </div>
                ))}

                {spatialDataTab === "file" && (
                  <>
                    <label className="text-[9px] text-[#AAAAAA]">
                      Layer name on map (optional)
                    </label>
                    <input
                      type="text"
                      value={fileLayerDisplayName}
                      onChange={(e) => setFileLayerDisplayName(e.target.value)}
                      placeholder="Defaults to file name if empty"
                      className={spatialFieldClass}
                    />
                    <div
                      onClick={() =>
                        !isFileLoading && fileInputRef.current?.click()
                      }
                      onDragOver={(e) => !isFileLoading && handleDragOver(e)}
                      onDragLeave={() => !isFileLoading && handleDragLeave()}
                      onDrop={(e) => !isFileLoading && handleDrop(e)}
                      className={`px-3 py-2 rounded-sm shadow-md text-center w-full transition flex flex-col items-center justify-center ${
                        isFileLoading
                          ? "bg-[#5A5C99] opacity-50 cursor-not-allowed"
                          : isDragging
                            ? "bg-transparent border-2 border-dashed border-[#9699FF] text-[#9699FF] cursor-pointer"
                            : "bg-[#5A5C99] text-white hover:opacity-90 cursor-pointer"
                      }`}
                    >
                      <Upload size={20} className="mb-2" />
                      <span className="font-medium text-[11px] leading-tight">
                        Choose or drop a file
                      </span>
                      <span className="block text-[10px] mt-0.5 text-[#E0E0E0] leading-tight">
                        .geojson, .shp (zip), .kml
                      </span>
                    </div>

                    <input
                      ref={fileInputRef}
                      type="file"
                      multiple
                      hidden
                      disabled={isFileLoading}
                      accept=".geojson,.json,.kml,.shp,.zip"
                      onChange={(e) =>
                        e.target.files && handleFiles(e.target.files)
                      }
                    />
                  </>
                )}

                {spatialDataTab === "api" && (
                  <div className="flex flex-col gap-1.5 bg-[#3a3a3a] rounded-sm p-2">
                    <label className="text-[9px] text-[#AAAAAA]">
                      Layer name on map (optional)
                    </label>
                    <input
                      type="text"
                      value={apiLayerDisplayName}
                      onChange={(e) => setApiLayerDisplayName(e.target.value)}
                      placeholder="Defaults to URL host or collection id"
                      className={spatialFieldClass}
                    />
                    <div className="grid grid-cols-2 gap-1.5">
                      <div>
                        <label className="text-[9px] text-[#AAAAAA] block mb-0.5">
                          HTTP method
                        </label>
                        <PanelSelect
                          value={apiHttpMethod}
                          onChange={(v) => setApiHttpMethod(v)}
                          options={[
                            { value: "GET", label: "GET" },
                            { value: "POST", label: "POST" },
                          ]}
                          disabled={isFileLoading}
                        />
                      </div>
                      <div>
                        <label className="text-[9px] text-[#AAAAAA] block mb-0.5">
                          Auth type
                        </label>
                        <PanelSelect
                          value={apiAuthType}
                          onChange={(v) => setApiAuthType(v)}
                          options={[
                            { value: "none", label: "None" },
                            { value: "bearer", label: "Bearer token" },
                            {
                              value: "apikey_header",
                              label: "API key (header)",
                            },
                            {
                              value: "apikey_query",
                              label: "API key (query)",
                            },
                            { value: "basic", label: "Basic (user + password)" },
                          ]}
                          disabled={isFileLoading}
                        />
                      </div>
                    </div>
                    <label className="text-[9px] text-[#AAAAAA]">
                      Endpoint URL
                    </label>
                    <input
                      type="url"
                      value={apiEndpointUrl}
                      onChange={(e) => setApiEndpointUrl(e.target.value)}
                      placeholder="https://example.com/ogc/collections/roads/items?f=geojson"
                      className={spatialFieldClass}
                    />
                    {apiAuthType === "bearer" && (
                      <>
                        <label className="text-[9px] text-[#AAAAAA]">
                          Bearer token
                        </label>
                        <input
                          type="password"
                          autoComplete="off"
                          value={apiBearerOrKeyValue}
                          onChange={(e) => setApiBearerOrKeyValue(e.target.value)}
                          placeholder="Authorization: Bearer …"
                          className={spatialFieldClass}
                        />
                      </>
                    )}
                    {apiAuthType === "apikey_header" && (
                      <>
                        <label className="text-[9px] text-[#AAAAAA]">
                          Header name
                        </label>
                        <input
                          type="text"
                          value={apiKeyHeaderName}
                          onChange={(e) => setApiKeyHeaderName(e.target.value)}
                          placeholder="X-API-Key"
                          className={spatialFieldClass}
                        />
                        <label className="text-[9px] text-[#AAAAAA]">
                          API key value
                        </label>
                        <input
                          type="password"
                          autoComplete="off"
                          value={apiBearerOrKeyValue}
                          onChange={(e) => setApiBearerOrKeyValue(e.target.value)}
                          className={spatialFieldClass}
                        />
                      </>
                    )}
                    {apiAuthType === "apikey_query" && (
                      <>
                        <label className="text-[9px] text-[#AAAAAA]">
                          Query parameter name
                        </label>
                        <input
                          type="text"
                          value={apiQueryParamName}
                          onChange={(e) => setApiQueryParamName(e.target.value)}
                          placeholder="api_key"
                          className={spatialFieldClass}
                        />
                        <label className="text-[9px] text-[#AAAAAA]">
                          API key value
                        </label>
                        <input
                          type="password"
                          autoComplete="off"
                          value={apiBearerOrKeyValue}
                          onChange={(e) => setApiBearerOrKeyValue(e.target.value)}
                          className={spatialFieldClass}
                        />
                      </>
                    )}
                    {apiAuthType === "basic" && (
                      <>
                        <label className="text-[9px] text-[#AAAAAA]">
                          Username
                        </label>
                        <input
                          type="text"
                          autoComplete="off"
                          value={apiBasicUser}
                          onChange={(e) => setApiBasicUser(e.target.value)}
                          className={spatialFieldClass}
                        />
                        <label className="text-[9px] text-[#AAAAAA]">
                          Password
                        </label>
                        <input
                          type="password"
                          autoComplete="off"
                          value={apiBasicPassword}
                          onChange={(e) => setApiBasicPassword(e.target.value)}
                          className={spatialFieldClass}
                        />
                      </>
                    )}
                    {apiHttpMethod === "POST" && (
                      <>
                        <label className="text-[9px] text-[#AAAAAA]">
                          Request body (JSON, optional)
                        </label>
                        <textarea
                          value={apiPostBody}
                          onChange={(e) => setApiPostBody(e.target.value)}
                          placeholder='{"query": "…"}'
                          rows={3}
                          className={`${spatialFieldClass} resize-y min-h-[52px] font-mono`}
                        />
                      </>
                    )}
                    <p className="text-[9px] text-[#888] leading-snug">
                      All secrets go through the SafeGIS backend proxy; nothing
                      is persisted in localStorage by default.
                    </p>
                    <button
                      type="button"
                      disabled={isFileLoading}
                      onClick={() => void handleConnectApi()}
                      className={`mt-1 w-full py-1.5 rounded-sm text-[10px] font-medium ${
                        isFileLoading
                          ? "bg-[#5A5C99] text-white/50 cursor-not-allowed"
                          : "bg-[#5A5C99] text-white cursor-pointer hover:opacity-90"
                      }`}
                    >
                      Connect via API
                    </button>
                  </div>
                )}

                {spatialDataTab === "sql" && (
                  <div className="flex flex-col gap-1.5 bg-[#3a3a3a] rounded-sm p-2">
                    <label className="text-[9px] text-[#AAAAAA]">
                      Database engine
                    </label>
                    <PanelSelect
                      value={sqlEngine}
                      onChange={(v) => setSqlEngine(v)}
                      options={[
                        {
                          value: "postgresql",
                          label: "PostgreSQL / PostGIS",
                        },
                        { value: "mysql", label: "MySQL / MariaDB" },
                        {
                          value: "mssql",
                          label: "Microsoft SQL Server",
                        },
                        {
                          value: "sqlite",
                          label: "SQLite (file or :memory:)",
                        },
                      ]}
                      disabled={isFileLoading}
                    />
                    <div className="grid grid-cols-2 gap-1.5">
                      <div className="col-span-2">
                        <label className="text-[9px] text-[#AAAAAA] block mb-0.5">
                          Host
                        </label>
                        <input
                          type="text"
                          value={sqlHost}
                          onChange={(e) => setSqlHost(e.target.value)}
                          placeholder="db.example.com (omit for SQLite file)"
                          className={spatialFieldClass}
                        />
                      </div>
                      <div>
                        <label className="text-[9px] text-[#AAAAAA] block mb-0.5">
                          Port
                        </label>
                        <input
                          type="text"
                          value={sqlPort}
                          onChange={(e) => setSqlPort(e.target.value)}
                          placeholder="5432"
                          className={spatialFieldClass}
                        />
                      </div>
                      <div>
                        <label className="text-[9px] text-[#AAAAAA] block mb-0.5">
                          Database name
                        </label>
                        <input
                          type="text"
                          value={sqlDatabase}
                          onChange={(e) => setSqlDatabase(e.target.value)}
                          placeholder="gis"
                          className={spatialFieldClass}
                        />
                      </div>
                      <div className="col-span-2">
                        <label className="text-[9px] text-[#AAAAAA] block mb-0.5">
                          Schema (optional)
                        </label>
                        <input
                          type="text"
                          value={sqlSchema}
                          onChange={(e) => setSqlSchema(e.target.value)}
                          placeholder="public"
                          className={spatialFieldClass}
                        />
                      </div>
                      <div className="col-span-2">
                        <label className="text-[9px] text-[#AAAAAA] block mb-0.5">
                          Username
                        </label>
                        <input
                          type="text"
                          autoComplete="off"
                          value={sqlUsername}
                          onChange={(e) => setSqlUsername(e.target.value)}
                          className={spatialFieldClass}
                        />
                      </div>
                      <div className="col-span-2">
                        <label className="text-[9px] text-[#AAAAAA] block mb-0.5">
                          Password
                        </label>
                        <input
                          type="password"
                          autoComplete="off"
                          value={sqlPassword}
                          onChange={(e) => setSqlPassword(e.target.value)}
                          className={spatialFieldClass}
                        />
                      </div>
                      <div className="col-span-2">
                        <label className="text-[9px] text-[#AAAAAA] block mb-0.5">
                          SSL mode
                        </label>
                        <PanelSelect
                          value={sqlSslMode}
                          onChange={(v) => setSqlSslMode(v)}
                          options={[
                            { value: "disable", label: "Disable" },
                            { value: "prefer", label: "Prefer" },
                            { value: "require", label: "Require" },
                            {
                              value: "verify-full",
                              label: "Verify full (TLS)",
                            },
                          ]}
                          disabled={isFileLoading}
                        />
                      </div>
                      <div className="col-span-2">
                        <label className="text-[9px] text-[#AAAAAA] block mb-0.5">
                          Table or view (spatial layer)
                        </label>
                        <input
                          type="text"
                          value={sqlTableOrView}
                          onChange={(e) => setSqlTableOrView(e.target.value)}
                          placeholder="e.g. public.parcels or parcels_view"
                          className={spatialFieldClass}
                        />
                      </div>
                      <div className="col-span-2">
                        <label className="text-[9px] text-[#AAAAAA] block mb-0.5">
                          Geometry column
                        </label>
                        <input
                          type="text"
                          value={sqlGeometryColumn}
                          onChange={(e) => setSqlGeometryColumn(e.target.value)}
                          placeholder="geom, shape, wkb_geometry…"
                          className={spatialFieldClass}
                        />
                      </div>
                    </div>
                    <p className="text-[9px] text-[#888] leading-snug">
                      Use a read-only DB user when possible. Credentials are sent
                      to your SafeGIS backend only, not stored in the browser.
                    </p>
                    <button
                      type="button"
                      disabled={isFileLoading}
                      onClick={() => void handleConnectSql()}
                      className={`mt-1 w-full py-1.5 rounded-sm text-[10px] font-medium ${
                        isFileLoading
                          ? "bg-[#5A5C99] text-white/50 cursor-not-allowed"
                          : "bg-[#5A5C99] text-white cursor-pointer hover:opacity-90"
                      }`}
                    >
                      Connect database
                    </button>
                  </div>
                )}

                {spatialDataTab === "mcp" && (
                  <div className="flex flex-col gap-1.5 bg-[#3a3a3a] rounded-sm p-2">
                    <label className="text-[9px] text-[#AAAAAA]">
                      Display name (optional)
                    </label>
                    <input
                      type="text"
                      value={mcpDisplayName}
                      onChange={(e) => setMcpDisplayName(e.target.value)}
                      placeholder="Shown in layer list"
                      className={spatialFieldClass}
                    />
                    <label className="text-[9px] text-[#AAAAAA]">
                      Transport
                    </label>
                    <PanelSelect
                      value={mcpTransport}
                      onChange={(v) => setMcpTransport(v)}
                      options={[
                        {
                          value: "sse",
                          label: "HTTP + SSE (classic remote MCP)",
                        },
                        {
                          value: "streamable_http",
                          label: "Streamable HTTP (MCP 2025-03-26)",
                        },
                        { value: "websocket", label: "WebSocket" },
                        { value: "stdio", label: "Stdio (local command)" },
                      ]}
                      disabled={isFileLoading}
                    />
                    {mcpTransport === "stdio" ? (
                      <>
                        <label className="text-[9px] text-[#AAAAAA]">
                          Command + args
                        </label>
                        <input
                          type="text"
                          value={mcpStdioCommand}
                          onChange={(e) => setMcpStdioCommand(e.target.value)}
                          placeholder='npx -y @modelcontextprotocol/server-filesystem /path'
                          className={spatialFieldClass}
                        />
                      </>
                    ) : (
                      <>
                        <label className="text-[9px] text-[#AAAAAA]">
                          Server URL
                        </label>
                        <input
                          type="url"
                          value={mcpServerUrl}
                          onChange={(e) => setMcpServerUrl(e.target.value)}
                          placeholder="https://mcp.example.com/sse"
                          className={spatialFieldClass}
                        />
                      </>
                    )}
                    <label className="text-[9px] text-[#AAAAAA]">
                      API key / access token (optional)
                    </label>
                    <input
                      type="password"
                      autoComplete="off"
                      value={mcpAuthKeyOrToken}
                      onChange={(e) => setMcpAuthKeyOrToken(e.target.value)}
                      placeholder="Bearer or static token if required"
                      className={spatialFieldClass}
                    />
                    <div className="border-t border-[#555] pt-1.5 mt-0.5">
                      <p className="text-[9px] text-[#888] mb-1">
                        OAuth (optional)
                      </p>
                      <label className="text-[9px] text-[#AAAAAA]">
                        Client ID
                      </label>
                      <input
                        type="text"
                        autoComplete="off"
                        value={mcpOAuthClientId}
                        onChange={(e) => setMcpOAuthClientId(e.target.value)}
                        className={`${spatialFieldClass} mb-1`}
                      />
                      <label className="text-[9px] text-[#AAAAAA]">
                        Client secret
                      </label>
                      <input
                        type="password"
                        autoComplete="off"
                        value={mcpOAuthClientSecret}
                        onChange={(e) =>
                          setMcpOAuthClientSecret(e.target.value)
                        }
                        className={spatialFieldClass}
                      />
                    </div>
                    <p className="text-[9px] text-[#888] leading-snug">
                      Full MCP JSON-RPC/SSE sessions are not implemented here yet.
                      This button uses the same GeoJSON HTTP proxy as API when the
                      URL returns FeatureCollection JSON. OAuth fields are not sent
                      yet—use the access token field for Bearer auth.
                    </p>
                    <button
                      type="button"
                      disabled={isFileLoading}
                      onClick={() => void handleConnectMcp()}
                      className={`mt-1 w-full py-1.5 rounded-sm text-[10px] font-medium ${
                        isFileLoading
                          ? "bg-[#5A5C99] text-white/50 cursor-not-allowed"
                          : "bg-[#5A5C99] text-white cursor-pointer hover:opacity-90"
                      }`}
                    >
                      Connect MCP / HTTP
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Boundaries Button & Panel */}
        <div className="relative bg-[#2E2E2E] p-1 rounded-md shadow-md w-[40px] h-[40px] flex justify-center items-center">
          <button
            onClick={() => {
              setShowBoundariesPanel((prev) => !prev);
              setShowGeoJSONPanel(false); // Close GeoJSON panel
            }}
            onMouseEnter={() => setHoveredButton("boundaries")}
            onMouseLeave={() => setHoveredButton(null)}
            className={`w-[32px] h-[32px] text-base font-semibold inline-flex items-center justify-center rounded transition ${
              showBoundariesPanel
                ? "bg-gradient-to-b from-[#9699FF] to-white text-[#2E2E2E]"
                : "hover:bg-[#3a3a3a] text-[#C7C7C7]"
            }`}
          >
            B
          </button>
          {hoveredButton === "boundaries" && !showBoundariesPanel && (
            <div className="absolute right-[50px] top-1/2 -translate-y-1/2 bg-white text-black text-[11px] px-2 py-1 rounded shadow-lg whitespace-nowrap z-[9999]">
              Add Boundaries
            </div>
          )}

          {showBoundariesPanel && (
            <div className="absolute right-full mr-2 top-1/2 -translate-y-1/2 w-[300px] bg-[#2E2E2E] rounded-md shadow-md p-3 z-40 flex flex-col items-center">
              <h3 className="text-[11px] font-semibold text-white mb-3">
                Add Boundaries to Map
              </h3>

              <div className="flex flex-col gap-1 w-full">
                {/* Source Dropdown */}
                <div
                  className={`flex gap-2 w-full items-center ${
                    selectedBoundarySource ? "mb-1.5" : ""
                  }`}
                >
                  <span className="text-white text-[10px] whitespace-nowrap">
                    Source:
                  </span>
                  <div className="relative flex-1 min-w-0">
                    <button
                      ref={boundarySourceButtonRef}
                      onClick={() =>
                        !isBoundaryLoading &&
                        setShowBoundarySourceDropdown((prev) => !prev)
                      }
                      disabled={isBoundaryLoading}
                      className={`flex justify-between items-center w-full bg-[#3a3a3a] text-white p-1.5 px-2 rounded-sm text-[10px] min-w-0 ${
                        isBoundaryLoading ? "opacity-50 cursor-not-allowed" : ""
                      }`}
                    >
                      <span
                        className={`truncate ${
                          selectedBoundarySource
                            ? "text-white"
                            : "text-gray-400"
                        }`}
                      >
                        {selectedBoundarySource
                          ? boundarySourceLabel(selectedBoundarySource)
                          : "Select Source"}
                      </span>
                      <ChevronDown
                        size={12}
                        className={`ml-1 flex-shrink-0 transition-transform duration-200 ${
                          showBoundarySourceDropdown ? "rotate-180" : ""
                        }`}
                      />
                    </button>
                    {showBoundarySourceDropdown &&
                      boundarySourceButtonRef.current &&
                      createPortal(
                        <div
                          className="fixed bg-[#3a3a3a] rounded-md shadow-lg z-[9999] text-[10px] text-white overflow-hidden"
                          style={{
                            top:
                              boundarySourceButtonRef.current.getBoundingClientRect()
                                .bottom + 4,
                            left: boundarySourceButtonRef.current.getBoundingClientRect()
                              .left,
                            width:
                              boundarySourceButtonRef.current.getBoundingClientRect()
                                .width,
                          }}
                        >
                          <div
                            className="overflow-y-auto"
                            style={{ maxHeight: "120px" }}
                          >
                            {boundarySourceOptions.map((option, index) => (
                              <div
                                key={index}
                                onClick={() => {
                                  setSelectedBoundarySource(option.id);
                                  setShowBoundarySourceDropdown(false);
                                  // Reset country and boundary level when source changes
                                  setSelectedBoundary(null);
                                  setSelectedBoundaryAdminSlot(null);
                                }}
                                className="px-3 py-2 hover:bg-[#505050] cursor-pointer text-[10px]"
                              >
                                {option.label}
                              </div>
                            ))}
                          </div>
                        </div>,
                        document.body
                      )}
                  </div>
                  <button
                    onClick={() => {
                      if (!isBoundaryLoading) {
                        setSelectedBoundarySource(null);
                        setSelectedBoundary(null);
                        setSelectedBoundaryAdminSlot(null);
                      }
                    }}
                    disabled={isBoundaryLoading}
                    className={`px-2 py-1.5 rounded-sm shadow-md text-center bg-[#5A5C99] text-white whitespace-nowrap text-[10px] ${
                      isBoundaryLoading
                        ? "opacity-50 cursor-not-allowed"
                        : "cursor-pointer hover:opacity-90"
                    }`}
                  >
                    Clear
                  </button>
                </div>

                {/* Country Dropdown - only show when source is selected */}
                {selectedBoundarySource && (
                  <>
                    <div
                      className={`flex gap-2 w-full items-center ${
                        selectedBoundary ? "mb-1.5" : ""
                      }`}
                    >
                      <span className="text-white text-[10px] whitespace-nowrap">
                        Country:
                      </span>
                      <div className="relative flex-1 min-w-0">
                        <button
                          ref={boundaryButtonRef}
                          onClick={() =>
                            !isBoundaryLoading &&
                            setShowBoundaryDropdown((prev) => !prev)
                          }
                          disabled={isBoundaryLoading}
                          className={`flex justify-between items-center w-full bg-[#3a3a3a] text-white p-1.5 px-2 rounded-sm text-[10px] min-w-0 ${
                            isBoundaryLoading
                              ? "opacity-50 cursor-not-allowed"
                              : ""
                          }`}
                        >
                          <span
                            className={`truncate ${
                              selectedBoundary ? "text-white" : "text-gray-400"
                            }`}
                          >
                            {selectedBoundary || "Select Country"}
                          </span>
                          <ChevronDown
                            size={12}
                            className={`ml-1 flex-shrink-0 transition-transform duration-200 ${
                              showBoundaryDropdown ? "rotate-180" : ""
                            }`}
                          />
                        </button>
                        {showBoundaryDropdown &&
                          boundaryButtonRef.current &&
                          createPortal(
                            <div
                              className="fixed bg-[#3a3a3a] rounded-md shadow-lg z-[9999] text-[10px] text-white overflow-hidden"
                              style={{
                                top:
                                  boundaryButtonRef.current.getBoundingClientRect()
                                    .bottom + 4,
                                left: boundaryButtonRef.current.getBoundingClientRect()
                                  .left,
                                width:
                                  boundaryButtonRef.current.getBoundingClientRect()
                                    .width,
                              }}
                            >
                              {/* Search Box */}
                              <div className="p-2">
                                <input
                                  type="text"
                                  placeholder="Search coverage..."
                                  value={boundarySearchTerm}
                                  onChange={(e) =>
                                    setBoundarySearchTerm(e.target.value)
                                  }
                                  className="w-full p-2 rounded-md text-white outline-none focus:ring-0 focus:outline-none hover:outline-none"
                                />
                              </div>

                              {/* Filtered options list */}
                              <div
                                className="overflow-y-auto"
                                style={{
                                  maxHeight: "120px", // Changed from 200px to 150px
                                  scrollbarWidth: "thin",
                                  scrollbarColor: "#5a5a5a transparent",
                                }}
                                onScroll={(e) => e.stopPropagation()}
                              >
                                {boundaryOptions
                                  .filter((option) =>
                                    option
                                      .toLowerCase()
                                      .includes(
                                        boundarySearchTerm.toLowerCase()
                                      )
                                  )
                                  .map((option, index) => (
                                    <div
                                      key={index}
                                      onClick={() => {
                                        setSelectedBoundary(option);
                                        setShowBoundaryDropdown(false);
                                        setBoundarySearchTerm("");
                                        setSelectedBoundaryAdminSlot(null); // Add this line to reset boundary level
                                      }}
                                      className="px-3 py-2 hover:bg-[#505050] cursor-pointer text-[10px]"
                                    >
                                      {option}
                                    </div>
                                  ))}
                              </div>
                            </div>,
                            document.body
                          )}
                      </div>
                      {/* New Clear button */}
                      <button
                        onClick={() => {
                          if (!isBoundaryLoading) {
                            setSelectedBoundary(null);
                            setBoundarySearchTerm("");
                            setSelectedBoundaryAdminSlot(null);
                          }
                        }}
                        disabled={isBoundaryLoading}
                        className={`px-2 py-1.5 rounded-sm shadow-md text-center bg-[#5A5C99] text-white whitespace-nowrap text-[10px] ${
                          isBoundaryLoading
                            ? "opacity-50 cursor-not-allowed"
                            : "cursor-pointer hover:opacity-90"
                        }`}
                      >
                        Clear
                      </button>
                    </div>
                  </>
                )}

                {/* Boundary Level dropdown - only show when source and country are selected */}
                {selectedBoundarySource && selectedBoundary && (
                  <>
                    <div className="flex gap-2 w-full items-center">
                      <span className="text-white text-[10px] whitespace-nowrap">
                        Boundary:
                      </span>
                      <div className="relative flex-1 min-w-0">
                        <button
                          ref={boundaryLevelButtonRef}
                          onClick={() =>
                            !isBoundaryLoading &&
                            setShowBoundaryLevelDropdown((prev) => !prev)
                          }
                          disabled={isBoundaryLoading}
                          className={`flex justify-between items-center w-full bg-[#3a3a3a] text-white p-1.5 px-2 rounded-sm text-[10px] min-w-0 ${
                            isBoundaryLoading
                              ? "opacity-50 cursor-not-allowed"
                              : ""
                          }`}
                        >
                          <span
                            className={`truncate ${
                              selectedBoundaryAdminSlot
                                ? "text-white"
                                : "text-gray-400"
                            }`}
                          >
                            {selectedBoundaryLevelLabel || "Select level"}
                          </span>
                          <ChevronDown
                            size={12}
                            className={`ml-1 flex-shrink-0 transition-transform duration-200 ${
                              showBoundaryLevelDropdown ? "rotate-180" : ""
                            }`}
                          />
                        </button>

                        {showBoundaryLevelDropdown &&
                          boundaryLevelButtonRef.current &&
                          createPortal(
                            <div
                              className="fixed bg-[#3a3a3a] rounded-md shadow-lg z-[9999] text-[10px] text-white overflow-hidden"
                              style={{
                                top:
                                  boundaryLevelButtonRef.current.getBoundingClientRect()
                                    .bottom + 4,
                                left: boundaryLevelButtonRef.current.getBoundingClientRect()
                                  .left,
                                width:
                                  boundaryLevelButtonRef.current.getBoundingClientRect()
                                    .width,
                              }}
                            >
                              <div
                                className="overflow-y-auto"
                                style={{
                                  maxHeight: "120px",
                                  scrollbarWidth: "thin",
                                  scrollbarColor: "#5a5a5a transparent",
                                }}
                                onScroll={(e) => e.stopPropagation()}
                              >
                                {boundaryLevelRows.map((option, index) => (
                                  <div
                                    key={`${option.adminLevel}-${index}`}
                                    onClick={() => {
                                      setSelectedBoundaryAdminSlot(
                                        option.adminLevel
                                      );
                                      setShowBoundaryLevelDropdown(false);
                                    }}
                                    className="px-3 py-2 hover:bg-[#505050] cursor-pointer text-[10px] leading-snug"
                                  >
                                    {option.label}
                                  </div>
                                ))}
                              </div>
                            </div>,
                            document.body
                          )}
                      </div>

                      <button
                        onClick={() => {
                          if (!isBoundaryLoading) {
                            setSelectedBoundaryAdminSlot(null);
                          }
                        }}
                        disabled={isBoundaryLoading}
                        className={`px-2 py-1.5 rounded-sm shadow-md text-center bg-[#5A5C99] text-white whitespace-nowrap text-[10px] ${
                          isBoundaryLoading
                            ? "opacity-50 cursor-not-allowed"
                            : "cursor-pointer hover:opacity-90"
                        }`}
                      >
                        Clear
                      </button>
                    </div>
                  </>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Undo / Redo / Global reset */}
        {(onUndo || onRedo || onGlobalReset) && (
          <div className="flex flex-col gap-1">
            {(onUndo || onRedo) && (
              <div className="flex flex-col gap-1">
                {onUndo && (
                  <div className="relative bg-[#2E2E2E] p-1 rounded-md shadow-md w-[40px] h-[40px] flex justify-center items-center">
                    <button
                      type="button"
                      disabled={!canUndo}
                      onClick={() => onUndo()}
                      onMouseEnter={() => setHoveredButton("undo")}
                      onMouseLeave={() => setHoveredButton(null)}
                      className={`w-[32px] h-[32px] inline-flex items-center justify-center rounded transition text-[#C7C7C7] ${
                        canUndo
                          ? "hover:bg-[#3a3a3a] cursor-pointer"
                          : "opacity-40 cursor-not-allowed"
                      }`}
                      title="Undo"
                    >
                      <Undo2 size={18} className="shrink-0" />
                    </button>
                    {hoveredButton === "undo" && (
                      <div className="absolute right-[50px] top-1/2 -translate-y-1/2 bg-white text-black text-[11px] px-2 py-1 rounded shadow-lg whitespace-nowrap z-[9999]">
                        Undo
                      </div>
                    )}
                  </div>
                )}
                {onRedo && (
                  <div className="relative bg-[#2E2E2E] p-1 rounded-md shadow-md w-[40px] h-[40px] flex justify-center items-center">
                    <button
                      type="button"
                      disabled={!canRedo}
                      onClick={() => onRedo()}
                      onMouseEnter={() => setHoveredButton("redo")}
                      onMouseLeave={() => setHoveredButton(null)}
                      className={`w-[32px] h-[32px] inline-flex items-center justify-center rounded transition text-[#C7C7C7] ${
                        canRedo
                          ? "hover:bg-[#3a3a3a] cursor-pointer"
                          : "opacity-40 cursor-not-allowed"
                      }`}
                      title="Redo (reapply last undone change)"
                    >
                      <Redo2 size={18} className="shrink-0" />
                    </button>
                    {hoveredButton === "redo" && (
                      <div className="absolute right-[50px] top-1/2 -translate-y-1/2 bg-white text-black text-[11px] px-2 py-1 rounded shadow-lg whitespace-nowrap z-[9999]">
                        Redo
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
            {onGlobalReset && (
              <div className="relative bg-[#2E2E2E] p-1 rounded-md shadow-md w-[40px] h-[40px] flex justify-center items-center">
                <button
                  type="button"
                  onClick={() => onGlobalReset()}
                  onMouseEnter={() => setHoveredButton("resetAll")}
                  onMouseLeave={() => setHoveredButton(null)}
                  className="w-[32px] h-[32px] inline-flex items-center justify-center rounded transition hover:bg-[#3a3a3a] text-[#C7C7C7]"
                  title="Reset map (clear layers & drawings)"
                >
                  <RotateCcw size={18} className="shrink-0" />
                </button>
                {hoveredButton === "resetAll" && (
                  <div className="absolute right-[50px] top-1/2 -translate-y-1/2 bg-white text-black text-[11px] px-2 py-1 rounded shadow-lg whitespace-nowrap z-[9999]">
                    Reset all
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    );
  }
);

RightSideControls.displayName = "RightSideControls";

export default RightSideControls;
