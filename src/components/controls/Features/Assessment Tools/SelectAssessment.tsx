// \frontend\src\components\controls\Features\Assessment Tools\SelectAssessment.tsx
"use client";
import { ChevronRight } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";

interface Props {
  isVisible: boolean;
  selectedAssessmentTools: string[];
  onGoToToolPanel: () => void;
  onSelectedAssessmentToolsChange: (tools: string[]) => void;
}

export default function SelectAssessment({
  isVisible,
  selectedAssessmentTools,
  onGoToToolPanel,
  onSelectedAssessmentToolsChange,
}: Props) {
  if (!isVisible) return null;

  const assessmentOptions = [
    { label: "Exposure Assessment", disabled: false },
    { label: "Vulnerability Assessment", disabled: true },
  ];

  const handleToggle = (label: string, disabled: boolean) => {
    if (disabled) return; // Don't allow toggling disabled options
    const updated = selectedAssessmentTools.includes(label)
      ? selectedAssessmentTools.filter((item) => item !== label)
      : [...selectedAssessmentTools, label];
    onSelectedAssessmentToolsChange(updated);
  };

  return (
    <div
      className="w-full bg-[#2E2E2E] rounded-lg shadow-md text-[#C7C7C7] flex flex-col pb-4"
      style={{
        maxHeight: "calc(100vh - 91px)",
      }}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-3 pt-3 pb-2 z-10">
        <span className="text-[10px] font-medium text-[#C7C7C7]">
          Select tools to use:
        </span>
        <button
          onClick={
            selectedAssessmentTools.length === 0 ? undefined : onGoToToolPanel
          }
          disabled={selectedAssessmentTools.length === 0}
          className={`text-[10px] flex items-center gap-0.5 transition ${
            selectedAssessmentTools.length === 0
              ? "text-[#555] cursor-not-allowed"
              : "text-[#8183e5] hover:text-[#a7a9fa]"
          }`}
        >
          Go to tool panel
          <ChevronRight size={12} />
        </button>
      </div>

      {/* Scrollable Tool List */}
      <div className="scrollbar-rounded overflow-y-auto px-3 pb-3 flex-1 space-y-2">
        {assessmentOptions.map((option, i) => (
          <div
            key={i}
            className={`bg-[#3a3a3a] h-[110px] px-3 py-2 rounded-md transition flex items-center relative ${
              option.disabled
                ? "opacity-50 cursor-not-allowed"
                : "hover:bg-[#4a4a4a] cursor-pointer"
            }`}
          >
            <Checkbox
              checked={selectedAssessmentTools.includes(option.label)}
              onCheckedChange={() =>
                handleToggle(option.label, option.disabled)
              }
              className="mr-3"
              style={{
                width: "14px",
                height: "14px",
                minWidth: "14px",
                minHeight: "14px",
              }}
              disabled={option.disabled}
            />
            <div className="flex flex-col">
              <div className="text-[12px] font-medium">{option.label}</div>
              {option.disabled && (
                <div className="text-[10px] text-[#8183e5] mt-1">
                  Coming Soon...
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
