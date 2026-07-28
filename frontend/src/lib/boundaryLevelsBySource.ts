/**
 * Administrative levels are configured **per data source**:
 *
 * - **geoBoundaries** — Which levels exist per country comes from `geoBoundaries.json`
 *   (matches what the gbOpen dataset actually publishes: ADM0–ADM3).
 *
 * - **Geoapify** — Always offers **admin0–admin3** for any catalog country.
 *   Uses part-of / consists-of + `sublevel`; hierarchy differs from gbOpen.
 */

export type BoundarySourceId = "geoboundaries" | "geoapify";

export type CatalogLevel = { label: string; adminLevel: string };

export type BoundaryLevelRow = {
  adminLevel: string;
  label: string;
};

type CountryCatalog = Record<string, { levels: CatalogLevel[] }>;

/** Geoapify: same slot keys everywhere; APIs may still 404 for sparse areas. */
const UNIVERSAL_ADMIN_SLOTS = [
  "admin0",
  "admin1",
  "admin2",
  "admin3",
] as const;

/** Geoapify: part-of / consists-of + sublevel (varies by country). */
const GEOAPIFY_LEVEL_LABELS: Record<string, string> = {
  admin0: "Country / territory (Geoapify part-of)",
  admin1: "First subdivisions inside country (Geoapify consists-of)",
  admin2: "Deeper subdivisions (Geoapify sublevel 2)",
  admin3: "Finer subdivisions (Geoapify sublevel 3)",
};

export function geoapifyPopupTypeLabel(adminSlot: string): string {
  const map: Record<string, string> = {
    admin0: "Country (Geoapify)",
    admin1: "Subdivision (Geoapify)",
    admin2: "Subdivision (Geoapify)",
    admin3: "Subdivision (Geoapify)",
  };
  return map[adminSlot] || "Boundary (Geoapify)";
}

/**
 * Level list and wording depend on the active source (see module doc above).
 */
export function getBoundaryLevelsForCountry(
  source: BoundarySourceId,
  countryKey: string,
  catalog: CountryCatalog
): BoundaryLevelRow[] {
  if (!catalog[countryKey]) return [];

  if (source === "geoboundaries") {
    return (catalog[countryKey].levels ?? []).map((l) => ({
      adminLevel: l.adminLevel,
      label: l.label,
    }));
  }

  return UNIVERSAL_ADMIN_SLOTS.map((slot) => ({
    adminLevel: slot,
    label: GEOAPIFY_LEVEL_LABELS[slot] ?? slot,
  }));
}
