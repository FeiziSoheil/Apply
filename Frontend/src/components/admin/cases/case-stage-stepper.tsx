"use client";

import { Check, Circle } from "lucide-react";
import { CASE_STAGES, type CaseStage, type CaseStageState } from "@/contracts/students";
import { cn } from "@/lib/utils";
import { CASE_STAGE_LABELS } from "./case-labels";

type CaseStageStepperProps = {
  stages: readonly CaseStageState[];
  currentStage: CaseStage;
  className?: string;
};

export function CaseStageStepper({
  stages,
  currentStage,
  className,
}: CaseStageStepperProps) {
  const byStage = new Map(stages.map((entry) => [entry.stage, entry]));
  const currentIndex = CASE_STAGES.indexOf(currentStage);

  return (
    <ol
      className={cn(
        "flex flex-col gap-3 md:flex-row md:items-start md:gap-0",
        className,
      )}
      aria-label="مراحل پرونده"
    >
      {CASE_STAGES.map((stage, index) => {
        const state = byStage.get(stage);
        const status = state?.status ?? "not_started";
        const done = status === "completed";
        const active = stage === currentStage || status === "in_progress";
        const blocked = status === "blocked";

        return (
          <li
            key={stage}
            className={cn(
              "flex items-center gap-3 md:flex-1 md:flex-col md:items-stretch md:gap-2",
              index < CASE_STAGES.length - 1 && "md:relative",
            )}
          >
            <div className="flex items-center gap-3 md:flex-col md:items-center">
              <span
                className={cn(
                  "flex size-8 shrink-0 items-center justify-center rounded-full border text-xs font-medium",
                  done && "border-success bg-success/15 text-success",
                  active && !done && "border-primary bg-primary/10 text-primary",
                  blocked && "border-destructive bg-destructive/10 text-destructive",
                  !done && !active && !blocked && "border-muted-foreground/30 text-muted-foreground",
                )}
                aria-current={active ? "step" : undefined}
              >
                {done ? (
                  <Check aria-hidden className="size-4" />
                ) : (
                  <Circle aria-hidden className="size-3 fill-current opacity-40" />
                )}
              </span>
              {index < CASE_STAGES.length - 1 ? (
                <span
                  aria-hidden
                  className={cn(
                    "bg-border hidden h-px flex-1 md:absolute md:start-[calc(50%+1rem)] md:top-4 md:block md:w-[calc(100%-2rem)]",
                    index < currentIndex && "bg-success/60",
                  )}
                />
              ) : null}
            </div>
            <div className="min-w-0 md:text-center">
              <p
                className={cn(
                  "text-sm font-medium",
                  active && "text-primary",
                  !active && "text-foreground",
                )}
              >
                {CASE_STAGE_LABELS[stage]}
              </p>
              <p className="text-muted-foreground text-xs">
                {done
                  ? "تکمیل‌شده"
                  : blocked
                    ? "مسدود"
                    : active
                      ? "جاری"
                      : "شروع‌نشده"}
              </p>
            </div>
          </li>
        );
      })}
    </ol>
  );
}
