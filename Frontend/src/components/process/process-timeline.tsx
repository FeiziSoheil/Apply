import { FileText } from "lucide-react";
import type { ProcessStep } from "@/types";
import { toPersianDigits } from "@/lib/format";

type ProcessTimelineProps = {
  steps: ProcessStep[];
};

export function ProcessTimeline({ steps }: ProcessTimelineProps) {
  return (
    <ol className="relative flex flex-col gap-8 border-s border-border ps-6 md:gap-10">
      {steps.map((step, index) => (
        <li key={step.id} className="relative">
          <span className="absolute -start-[1.95rem] flex size-8 items-center justify-center rounded-full bg-primary text-sm font-semibold text-primary-foreground">
            {toPersianDigits(index + 1)}
          </span>
          <div className="rounded-2xl border border-border bg-card p-5 sm:p-6">
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <h3 className="text-lg font-semibold text-foreground">
                {step.title}
              </h3>
              <span className="rounded-md bg-muted px-2.5 py-1 text-xs font-medium text-muted-foreground">
                مدت تقریبی: {step.duration}
              </span>
            </div>
            <p className="mt-1 text-sm font-medium text-primary">
              {step.summary}
            </p>
            <p className="mt-3 text-sm leading-7 text-muted-foreground">
              {step.description}
            </p>
            <div className="mt-4">
              <p className="mb-2 inline-flex items-center gap-1.5 text-sm font-medium text-foreground">
                <FileText className="size-4 text-primary" aria-hidden />
                مدارک مورد نیاز
              </p>
              <ul className="list-inside list-disc space-y-1 text-sm text-muted-foreground">
                {step.documents.map((doc) => (
                  <li key={doc}>{doc}</li>
                ))}
              </ul>
            </div>
          </div>
        </li>
      ))}
    </ol>
  );
}
