"use client";

import type { ReactNode } from "react";
import { FieldGroup } from "@/components/ui/field";
import { FormWizardStepPanel } from "./form-wizard-step-panel";
import {
  FormWizardTimeline,
  type FormWizardTimelineStep,
} from "./form-wizard-timeline";

/** Timeline + animated active step — shared shell for CMS entity wizards */
export function FormWizardShell({
  steps,
  stepIndex,
  onStepSelect,
  children,
}: {
  steps: readonly FormWizardTimelineStep[];
  stepIndex: number;
  onStepSelect: (index: number) => void;
  children: ReactNode;
}) {
  const active = steps[stepIndex] ?? steps[0];
  if (!active) return null;

  return (
    <FieldGroup className="gap-8">
      <FormWizardTimeline
        steps={steps}
        stepIndex={stepIndex}
        onStepSelect={onStepSelect}
      />
      <FormWizardStepPanel
        stepKey={active.id}
        stepIndex={stepIndex}
        title={active.title}
      >
        {children}
      </FormWizardStepPanel>
    </FieldGroup>
  );
}
