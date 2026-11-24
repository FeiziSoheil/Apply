"use client";

import { toPersianDigits } from "@/lib/format";
import { cn } from "@/lib/utils";

export type FormWizardTimelineStep = {
  id: string;
  title: string;
};

/** Horizontal clickable timeline of wizard steps (RTL-safe flex order) */
export function FormWizardTimeline({
  steps,
  stepIndex,
  onStepSelect,
}: {
  steps: readonly FormWizardTimelineStep[];
  stepIndex: number;
  onStepSelect: (index: number) => void;
}) {
  const lastIndex = steps.length - 1;

  return (
    <nav aria-label="سوییچ بین گام‌ها" className="w-full">
      <ol className="flex w-full items-start">
        {steps.map((step, index) => {
          const isCurrent = index === stepIndex;
          const isDone = index < stepIndex;
          const lineDoneBefore = index <= stepIndex;
          const lineDoneAfter = index < stepIndex;

          return (
            <li
              key={step.id}
              className="flex min-w-0 flex-1 flex-col items-center gap-2"
            >
              <div className="flex w-full items-center">
                <span
                  aria-hidden
                  className={cn(
                    "h-0.5 flex-1 rounded-full transition-colors duration-300",
                    index === 0
                      ? "bg-transparent"
                      : lineDoneBefore
                        ? "bg-primary"
                        : "bg-border",
                  )}
                />
                <button
                  type="button"
                  aria-current={isCurrent ? "step" : undefined}
                  aria-label={`گام ${toPersianDigits(index + 1)}: ${step.title}`}
                  onClick={() => onStepSelect(index)}
                  className={cn(
                    "relative z-10 flex size-8 shrink-0 items-center justify-center rounded-full border text-xs font-medium tabular-nums",
                    "transition-[background-color,border-color,color,box-shadow,transform] duration-300",
                    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
                    isCurrent &&
                      "scale-110 border-primary bg-primary text-primary-foreground shadow-sm",
                    isDone && "border-primary bg-primary/10 text-primary",
                    !isCurrent &&
                      !isDone &&
                      "border-border bg-background text-muted-foreground hover:border-primary/50 hover:text-foreground",
                  )}
                >
                  {toPersianDigits(index + 1)}
                </button>
                <span
                  aria-hidden
                  className={cn(
                    "h-0.5 flex-1 rounded-full transition-colors duration-300",
                    index === lastIndex
                      ? "bg-transparent"
                      : lineDoneAfter
                        ? "bg-primary"
                        : "bg-border",
                  )}
                />
              </div>
              <span
                className={cn(
                  "max-w-full px-1 text-center text-xs leading-snug transition-colors duration-300",
                  isCurrent
                    ? "font-medium text-foreground"
                    : "text-muted-foreground",
                )}
              >
                {step.title}
              </span>
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
