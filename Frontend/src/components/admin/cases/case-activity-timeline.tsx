"use client";

import { useMemo, useState } from "react";
import { SelectFilter } from "@/components/admin/data-table/filters";
import {
  ACTIVITY_FILTER_OPTIONS,
  ACTIVITY_TYPE_ICONS,
  ACTIVITY_TYPE_LABELS,
  ACTIVITY_TYPE_TONES,
  CALL_OUTCOME_LABELS,
} from "@/components/admin/leads/activity-labels";
import { Button } from "@/components/ui/button";
import type { Activity, ActivityType } from "@/contracts/leads";
import { useCaseActivitiesInfinite } from "@/features/students/queries";
import {
  formatJalaliDate,
  formatRelativeFa,
  toPersianDigits,
} from "@/lib/format";
import { cn } from "@/lib/utils";

type CaseActivityTimelineProps = {
  caseId: string;
  stageTitle?: (key: string) => string;
  consultantName?: (id: string | null) => string;
};

function dayKey(iso: string): string {
  return iso.slice(0, 10);
}

function activitySummary(
  activity: Activity,
  stageTitle: (id: string) => string,
  consultantName: (id: string | null) => string,
): string {
  switch (activity.type) {
    case "note":
    case "sms":
    case "whatsapp":
    case "email":
    case "system":
      return activity.body ?? "";
    case "call":
      return [
        CALL_OUTCOME_LABELS[activity.outcome],
        activity.direction === "inbound" ? "ورودی" : "خروجی",
        activity.durationSeconds
          ? `${toPersianDigits(activity.durationSeconds)}ث`
          : null,
        activity.body,
      ]
        .filter(Boolean)
        .join(" · ");
    case "meeting":
      return [
        activity.startsAt
          ? formatJalaliDate(activity.startsAt, "d MMM yyyy HH:mm")
          : null,
        activity.body,
      ]
        .filter(Boolean)
        .join(" · ");
    case "stage_change":
      return `${stageTitle(activity.fromStageId)} ← ${stageTitle(activity.toStageId)}${
        activity.body ? ` — ${activity.body}` : ""
      }`;
    case "assignment":
      return `${consultantName(activity.fromAssigneeId)} ← ${consultantName(activity.toAssigneeId)}`;
    case "task_created":
    case "task_done":
      return activity.body ?? ACTIVITY_TYPE_LABELS[activity.type];
    case "booking_event":
    case "document_event":
      return activity.body ?? activity.event;
    case "field_change":
      return activity.body ?? "فیلدها به‌روز شد";
    default:
      return "";
  }
}

/** Same visual timeline as C3 lead activities, bound to case entity. */
export function CaseActivityTimeline({
  caseId,
  stageTitle = (key) => key,
  consultantName = (id) => id ?? "—",
}: CaseActivityTimelineProps) {
  const [typeFilter, setTypeFilter] = useState<string | null>(null);
  const query = useCaseActivitiesInfinite(
    caseId,
    typeFilter
      ? { type: typeFilter as ActivityType, order: "desc", sort: "createdAt" }
      : { order: "desc", sort: "createdAt" },
  );

  const activities = useMemo(
    () => query.data?.pages.flatMap((page) => page.items) ?? [],
    [query.data?.pages],
  );

  const groups = useMemo(() => {
    const map = new Map<string, Activity[]>();
    for (const activity of activities) {
      const key = dayKey(activity.createdAt);
      const list = map.get(key) ?? [];
      list.push(activity);
      map.set(key, list);
    }
    return [...map.entries()];
  }, [activities]);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-sm font-semibold">تایم‌لاین فعالیت</h2>
        <SelectFilter
          label="نوع"
          value={typeFilter}
          options={ACTIVITY_FILTER_OPTIONS}
          onChange={setTypeFilter}
        />
      </div>

      {query.isPending ? (
        <p className="text-muted-foreground py-8 text-center text-sm">
          در حال بارگذاری…
        </p>
      ) : groups.length === 0 ? (
        <p className="text-muted-foreground py-8 text-center text-sm">
          هنوز فعالیتی ثبت نشده است.
        </p>
      ) : (
        groups.map(([day, items]) => (
          <section key={day} className="space-y-2">
            <h3 className="text-muted-foreground sticky top-0 z-10 bg-background/95 py-1 text-xs font-medium backdrop-blur">
              {formatJalaliDate(`${day}T12:00:00.000Z`, "EEEE d MMMM yyyy")}
            </h3>
            <ul className="space-y-2">
              {items.map((activity) => {
                const Icon = ACTIVITY_TYPE_ICONS[activity.type];
                const tone = ACTIVITY_TYPE_TONES[activity.type];
                const summary = activitySummary(
                  activity,
                  stageTitle,
                  consultantName,
                );
                return (
                  <li
                    key={activity.id}
                    className="bg-card flex gap-3 rounded-lg border p-3"
                  >
                    <span
                      className={cn(
                        "mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-full",
                        tone === "success" && "bg-success/15 text-success",
                        tone === "danger" && "bg-destructive/10 text-destructive",
                        tone === "warning" &&
                          "bg-warning/20 text-warning-foreground",
                        tone === "info" && "bg-info/15 text-info",
                        tone === "primary" && "bg-primary/10 text-primary",
                        tone === "neutral" && "bg-muted text-muted-foreground",
                      )}
                    >
                      <Icon aria-hidden className="size-3.5" />
                    </span>
                    <div className="min-w-0 flex-1 space-y-1">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <p className="text-sm font-medium">
                          {ACTIVITY_TYPE_LABELS[activity.type]}
                        </p>
                        <time
                          className="text-muted-foreground text-xs tabular-nums"
                          title={formatJalaliDate(
                            activity.createdAt,
                            "yyyy/MM/dd HH:mm",
                          )}
                        >
                          {formatRelativeFa(activity.createdAt)} ·{" "}
                          {formatJalaliDate(activity.createdAt, "HH:mm")}
                        </time>
                      </div>
                      <p className="text-muted-foreground whitespace-pre-wrap text-sm">
                        {summary || "—"}
                      </p>
                    </div>
                  </li>
                );
              })}
            </ul>
          </section>
        ))
      )}

      {query.hasNextPage ? (
        <Button
          type="button"
          variant="outline"
          className="w-full"
          disabled={query.isFetchingNextPage}
          onClick={() => void query.fetchNextPage()}
        >
          {query.isFetchingNextPage ? "در حال بارگذاری…" : "بارگذاری بیشتر"}
        </Button>
      ) : null}
    </div>
  );
}
