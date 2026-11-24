"use client";

import { AlertTriangle, CheckCircle2, Info } from "lucide-react";
import type { ContentQualityIssue } from "@/lib/admin/content-quality";
import { cn } from "@/lib/utils";

type ContentQualityPanelProps = {
  issues: readonly ContentQualityIssue[];
  className?: string;
};

/**
 * Compact checklist of editorial quality warnings next to ContentEditor.
 */
export function ContentQualityPanel({
  issues,
  className,
}: ContentQualityPanelProps) {
  const errors = issues.filter((issue) => issue.severity === "error");
  const warnings = issues.filter((issue) => issue.severity === "warning");

  return (
    <aside
      className={cn(
        "rounded-lg border bg-muted/30 p-3 text-sm",
        className,
      )}
      aria-label="بررسی کیفیت محتوا"
    >
      <p className="mb-2 font-medium">کیفیت محتوا</p>
      {issues.length === 0 ? (
        <p className="flex items-start gap-2 text-muted-foreground">
          <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-primary" aria-hidden />
          موردی برای بهبود یافت نشد.
        </p>
      ) : (
        <ul className="space-y-2">
          {errors.map((issue) => (
            <li key={issue.id} className="flex items-start gap-2 text-destructive">
              <AlertTriangle className="mt-0.5 size-4 shrink-0" aria-hidden />
              <span>{issue.message}</span>
            </li>
          ))}
          {warnings.map((issue) => (
            <li
              key={issue.id}
              className="flex items-start gap-2 text-muted-foreground"
            >
              <Info className="mt-0.5 size-4 shrink-0" aria-hidden />
              <span>{issue.message}</span>
            </li>
          ))}
        </ul>
      )}
    </aside>
  );
}
