interface BoundaryLevel {
  label: string;
  adminLevel: string;
}

interface CountryBoundaries {
  [key: string]: {
    name: string;
    code: string;
    levels: BoundaryLevel[];
  };
}

export const boundaryOptions = [
  "Afghanistan (AF)",
  "Albania (AL)",
  "Algeria (DZ)",
  "American Samoa (AS)",
  "Andorra (AD)",
  "Angola (AO)",
  "Anguilla (AI)",
  "Antarctica (AQ)",
] as const;

export const countryBoundaries: CountryBoundaries = {
  "Afghanistan (AF)": {
    name: "Afghanistan",
    code: "AF",
    levels: [
      { label: "Country/Territory (Admin Level 0)", adminLevel: "admin0" },
      { label: "By province (Admin Level 1)", adminLevel: "admin1" },
      { label: "By district (Admin Level 2)", adminLevel: "admin2" },
    ],
  },
  "Albania (AL)": {
    name: "Albania",
    code: "AL",
    levels: [
      { label: "Country/Territory (Admin Level 0)", adminLevel: "admin0" },
      { label: "By county (Admin Level 1)", adminLevel: "admin1" },
      { label: "By municipality (Admin Level 2)", adminLevel: "admin2" },
    ],
  },
  "Algeria (DZ)": {
    name: "Algeria",
    code: "DZ",
    levels: [
      { label: "Country/Territory (Admin Level 0)", adminLevel: "admin0" },
      { label: "By province (Admin Level 1)", adminLevel: "admin1" },
      { label: "By commune (Admin Level 2)", adminLevel: "admin2" },
    ],
  },
  "American Samoa (AS)": {
    name: "American Samoa",
    code: "AS",
    levels: [
      { label: "Country/Territory (Admin Level 0)", adminLevel: "admin0" },
      { label: "By territory (Admin Level 1)", adminLevel: "admin1" },
      { label: "By district, island (Admin Level 2)", adminLevel: "admin2" },
      { label: "By county, island (Admin Level 3)", adminLevel: "admin3" },
    ],
  },
  "Andorra (AD)": {
    name: "Andorra",
    code: "AD",
    levels: [
      { label: "Country/Territory (Admin Level 0)", adminLevel: "admin0" },
      { label: "By parish (Admin Level 1)", adminLevel: "admin1" },
    ],
  },
  "Angola (AO)": {
    name: "Angola",
    code: "AO",
    levels: [
      { label: "Country/Territory (Admin Level 0)", adminLevel: "admin0" },
      { label: "By province (Admin Level 1)", adminLevel: "admin1" },
      { label: "By municipality (Admin Level 2)", adminLevel: "admin2" },
    ],
  },
  "Anguilla (AI)": {
    name: "Anguilla",
    code: "AI",
    levels: [
      { label: "Country/Territory (Admin Level 0)", adminLevel: "admin0" },
      { label: "By territory (Admin Level 1)", adminLevel: "admin1" },
      { label: "By district (Admin Level 2)", adminLevel: "admin2" },
    ],
  },
  "Antarctica (AQ)": {
    name: "Antarctica",
    code: "AQ",
    levels: [
      { label: "Country/Territory (Admin Level 0)", adminLevel: "admin0" },
    ],
  },
};
