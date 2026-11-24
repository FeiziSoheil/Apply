"use client";

import type { ReactNode } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";

/**
 * Sticky-footer actions for entity wizards:
 * prev/next on intermediate steps, publish controls on the last step.
 */
export function FormWizardFooter({
  stepIndex,
  lastStepIndex,
  isSubmitting,
  onPrev,
  onNext,
  publishControl,
}: {
  stepIndex: number;
  lastStepIndex: number;
  isSubmitting: boolean;
  onPrev: () => void;
  onNext: () => void;
  publishControl: ReactNode;
}) {
  if (stepIndex >= lastStepIndex) {
    return (
      <div className="flex flex-col gap-3">
        {stepIndex > 0 ? (
          <div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={isSubmitting}
              onClick={onPrev}
            >
              <ChevronRight data-icon="inline-start" aria-hidden />
              مرحله قبل
            </Button>
          </div>
        ) : null}
        {publishControl}
      </div>
    );
  }

  return (
    <div className="flex flex-col-reverse gap-2 sm:flex-row sm:items-center sm:justify-between">
      <Button
        type="button"
        variant="outline"
        disabled={stepIndex === 0 || isSubmitting}
        onClick={onPrev}
      >
        <ChevronRight data-icon="inline-start" aria-hidden />
        قبلی
      </Button>
      <Button type="button" disabled={isSubmitting} onClick={onNext}>
        بعدی
        <ChevronLeft data-icon="inline-end" aria-hidden />
      </Button>
    </div>
  );
}
