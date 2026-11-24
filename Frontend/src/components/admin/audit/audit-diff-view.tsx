"use client";

import type { AuditDiff } from "@/contracts/crm";
import { cn } from "@/lib/utils";

function formatValue(value: unknown): string {
  if (value === null || value === undefined) return "—";
  if (typeof value === "string") return value;
  if (typeof value === "number" || typeof value === "boolean") {
    return String(value);
  }
  try {
    return JSON.stringify(value, null, 2);
  } catch {
    return String(value);
  }
}

export function AuditDiffView({ diff }: { diff: AuditDiff | null }) {
  if (!diff || (!diff.before && !diff.after)) {
    return (
      <p className="text-sm text-muted-foreground">تغییری ثبت نشده است.</p>
    );
  }

  const keys = [
    ...new Set([
      ...Object.keys(diff.before ?? {}),
      ...Object.keys(diff.after ?? {}),
    ]),
  ].sort();

  if (keys.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">تغییری ثبت نشده است.</p>
    );
  }

  return (
    <ul className="space-y-3" role="list">
      {keys.map((key) => {
        const before = diff.before?.[key];
        const after = diff.after?.[key];
        const changed = JSON.stringify(before) !== JSON.stringify(after);
        return (
          <li
            key={key}
            className="rounded-lg border border-border p-3 text-sm"
          >
            <p className="mb-2 font-medium text-foreground" dir="ltr">
              {key}
            </p>
            <div className="grid gap-2 sm:grid-cols-2">
              <div
                className={cn(
                  "rounded-md p-2 font-mono text-xs whitespace-pre-wrap break-all",
                  changed
                    ? "bg-destructive/10 text-destructive"
                    : "bg-muted text-muted-foreground",
                )}
              >
                <p className="mb-1 font-sans text-[0.65rem] text-muted-foreground">
                  قبل
                </p>
                {formatValue(before)}
              </div>
              <div
                className={cn(
                  "rounded-md p-2 font-mono text-xs whitespace-pre-wrap break-all",
                  changed
                    ? "bg-success/15 text-success"
                    : "bg-muted text-muted-foreground",
                )}
              >
                <p className="mb-1 font-sans text-[0.65rem] text-muted-foreground">
                  بعد
                </p>
                {formatValue(after)}
              </div>
            </div>
          </li>
        );
      })}
    </ul>
  );
}
