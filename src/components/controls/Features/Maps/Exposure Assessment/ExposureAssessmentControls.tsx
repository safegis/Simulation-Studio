"use client";

import React from "react"; // 👈 important
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
  populationExpanded: boolean;
  setPopulationExpanded: React.Dispatch<React.SetStateAction<boolean>>;
  populationCheckboxItems: string[];
  populationCheckedItems: string[];
  togglePopulationItem: (item: string) => void;

  biologicalExpanded: boolean;
  setBiologicalExpanded: React.Dispatch<React.SetStateAction<boolean>>;
  biologicalCheckboxItems: string[];
  biologicalCheckedItems: string[];
  toggleBiologicalItem: (item: string) => void;

  nonBiologicalExpanded: boolean;
  setNonBiologicalExpanded: React.Dispatch<React.SetStateAction<boolean>>;
  nonBiologicalCheckboxItems: string[];
  nonBiologicalCheckedItems: string[];
  toggleNonBiologicalItem: (item: string) => void;

  PanelToggle: React.FC<PanelToggleProps>; // 👈 fixed typing
}

const ExposureAssessmentControls: React.FC<Props> = ({
  populationExpanded,
  setPopulationExpanded,
  populationCheckboxItems,
  populationCheckedItems,
  togglePopulationItem,
  biologicalExpanded,
  setBiologicalExpanded,
  biologicalCheckboxItems,
  biologicalCheckedItems,
  toggleBiologicalItem,
  nonBiologicalExpanded,
  setNonBiologicalExpanded,
  nonBiologicalCheckboxItems,
  nonBiologicalCheckedItems,
  toggleNonBiologicalItem,
  PanelToggle,
}) => {
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
