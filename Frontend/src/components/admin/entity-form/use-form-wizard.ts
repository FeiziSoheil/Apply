"use client";

import { useCallback, useState } from "react";
import type { FieldErrors, FieldValues, UseFormReturn } from "react-hook-form";
import { focusFirstError } from "@/components/forms/focus-first-error";
import {
  collectFormErrorPaths,
  formWizardStepIndexForErrors,
  type FormWizardStep,
} from "./form-wizard";

/**
 * Step state + navigation for CMS entity wizards.
 * Backward jumps are free; forward jumps validate every intermediate step.
 */
export function useFormWizard<T extends FieldValues>(
  steps: readonly FormWizardStep<T>[],
) {
  const [stepIndex, setStepIndex] = useState(0);
  const lastStepIndex = Math.max(0, steps.length - 1);
  const isLastStep = stepIndex >= lastStepIndex;
  const activeStep = steps[stepIndex] ?? steps[0];

  const jumpToErrorStep = useCallback(
    (errors: FieldErrors<T>) => {
      setStepIndex(
        formWizardStepIndexForErrors(steps, collectFormErrorPaths(errors)),
      );
    },
    [steps],
  );

  const goToStep = useCallback(
    async (form: UseFormReturn<T>, target: number) => {
      const clamped = Math.max(0, Math.min(target, lastStepIndex));
      if (clamped === stepIndex) return;

      if (clamped < stepIndex) {
        setStepIndex(clamped);
        return;
      }

      for (let index = stepIndex; index < clamped; index += 1) {
        const step = steps[index];
        if (!step) continue;
        const ok = await form.trigger([...step.fields]);
        if (!ok) {
          setStepIndex(index);
          requestAnimationFrame(() => {
            focusFirstError(form.formState.errors, form.setFocus);
          });
          return;
        }
      }
      setStepIndex(clamped);
    },
    [lastStepIndex, stepIndex, steps],
  );

  const goNext = useCallback(
    (form: UseFormReturn<T>) => goToStep(form, stepIndex + 1),
    [goToStep, stepIndex],
  );

  const goPrev = useCallback(() => {
    setStepIndex((prev) => Math.max(prev - 1, 0));
  }, []);

  return {
    stepIndex,
    lastStepIndex,
    isLastStep,
    activeStep,
    goToStep,
    goNext,
    goPrev,
    jumpToErrorStep,
  };
}
