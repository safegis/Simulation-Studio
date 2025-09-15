"use client";

import React from "react";
import { PersonStanding, Sprout, Building2 } from "lucide-react";

type PanelToggleProps = {
  title: string;
  icon: React.ReactNode;
  expanded: boolean;
  onToggle: () => void;
  items: string[];
  checkedItems: string[];
  onCheck: (item: string) => void;
};

interface Props {
  PanelToggle: React.FC<PanelToggleProps>;
}

// --- Constants ---
const populationCheckboxItems = ["Urban", "Rural", "Vulnerable Population"];

const biologicalCheckboxItems = [
  "Forest Cover",
  "Agro-Ecosystem",
  "Mangrove Areas",
  "National Parks",
  "Critical Habitats",
  "Wetlands / Water Bodies",
];

const nonBiologicalCheckboxItems = [
  "Road Networks",
  "Bridges",
  "Schools / Universities",
  "Active Evacuation Areas",
  "National / Local Gov’t Offices",
  "Power / Energy Plants",
  "Telecommunication Towers",
  "Water Supply Infrastructure",
  "Residential Buildings",
];

const ExposureAssessmentControls: React.FC<Props> = ({ PanelToggle }) => {
  // --- Expanded states ---
  const [populationExpanded, setPopulationExpanded] = React.useState(false);
  const [biologicalExpanded, setBiologicalExpanded] = React.useState(false);
  const [nonBiologicalExpanded, setNonBiologicalExpanded] =
    React.useState(false);

  // --- Checked item states ---
  const [populationCheckedItems, setPopulationCheckedItems] = React.useState<
    string[]
  >([]);
  const [biologicalCheckedItems, setBiologicalCheckedItems] = React.useState<
    string[]
  >([]);
  const [nonBiologicalCheckedItems, setNonBiologicalCheckedItems] =
    React.useState<string[]>([]);

  // --- Toggle handlers ---
  const togglePopulationItem = (item: string) => {
    setPopulationCheckedItems((prev) =>
      prev.includes(item) ? prev.filter((i) => i !== item) : [...prev, item]
    );
  };

  const toggleBiologicalItem = (item: string) => {
    setBiologicalCheckedItems((prev) =>
      prev.includes(item) ? prev.filter((i) => i !== item) : [...prev, item]
    );
  };

  const toggleNonBiologicalItem = (item: string) => {
    setNonBiologicalCheckedItems((prev) =>
      prev.includes(item) ? prev.filter((i) => i !== item) : [...prev, item]
    );
  };

  return (
    <>
      <PanelToggle
        title="Population"
        icon={<PersonStanding size={20} />}
        expanded={populationExpanded}
        onToggle={() => setPopulationExpanded((prev) => !prev)}
        items={populationCheckboxItems}
        checkedItems={populationCheckedItems}
        onCheck={togglePopulationItem}
      />
      <PanelToggle
        title="Biological Assets"
        icon={<Sprout size={20} />}
        expanded={biologicalExpanded}
        onToggle={() => setBiologicalExpanded((prev) => !prev)}
        items={biologicalCheckboxItems}
        checkedItems={biologicalCheckedItems}
        onCheck={toggleBiologicalItem}
      />
      <PanelToggle
        title="Non-Biological Assets"
        icon={<Building2 size={20} />}
        expanded={nonBiologicalExpanded}
        onToggle={() => setNonBiologicalExpanded((prev) => !prev)}
        items={nonBiologicalCheckboxItems}
        checkedItems={nonBiologicalCheckedItems}
        onCheck={toggleNonBiologicalItem}
      />
    </>
  );
};

export default ExposureAssessmentControls;
