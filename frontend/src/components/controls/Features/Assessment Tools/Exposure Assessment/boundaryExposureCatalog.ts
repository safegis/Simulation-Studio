/**
 * Build selectable exposure "elements" from the same geoBoundaries catalog
 * used by "Add Boundaries to Map" (CenterRightControls).
 */
import geoBoundariesData from "../../../Main/Boundary Options/geoBoundaries.json";
import { iso2ToIso3 } from "@/lib/iso2ToIso3";

type CountryEntry = {
  name: string;
  code: string;
  levels: { label: string; adminLevel: string }[];
};

export type BoundaryExposureConfig = {
  kind: "boundary";
  iso2: string;
  iso3: string;
  adminLevel: string;
  countryName: string;
  levelLabel: string;
};

export interface BoundaryElementListItem {
  displayName: string;
  config: BoundaryExposureConfig;
}

const countries = geoBoundariesData as Record<string, CountryEntry>;

/** Maps JSON adminLevel (admin0…) to backend /api/boundaries/{iso3}/{ADM} */
export const ADMIN_LEVEL_TO_GB: Record<string, string> = {
  admin0: "ADM0",
  admin1: "ADM1",
  admin2: "ADM2",
  admin3: "ADM3",
};

export function getBoundaryExposureListItems(): BoundaryElementListItem[] {
  const out: BoundaryElementListItem[] = [];

  for (const country of Object.values(countries)) {
    const iso3 = iso2ToIso3(country.code);
    if (!iso3) continue;

    for (const level of country.levels) {
      if (!ADMIN_LEVEL_TO_GB[level.adminLevel]) continue;

      const displayName = `Boundary — ${country.name} — ${level.label}`;
      out.push({
        displayName,
        config: {
          kind: "boundary",
          iso2: country.code,
          iso3,
          adminLevel: level.adminLevel,
          countryName: country.name,
          levelLabel: level.label,
        },
      });
    }
  }

  return out.sort((a, b) => a.displayName.localeCompare(b.displayName));
}
