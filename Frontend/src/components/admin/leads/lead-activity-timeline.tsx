"use client";

import { useMemo, useState } from "react";
import { Pin, Pencil, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { useSession } from "@/components/auth/auth-provider";
import { SelectFilter } from "@/components/admin/data-table/filters";
import { Can } from "@/components/rbac/can";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import type { Activity, ActivityType } from "@/contracts/leads";
import {
  useDeleteLeadActivity,
  useUpdateLeadActivity,
} from "@/features/leads/mutations";
import { useLeadActivitiesInfinite } from "@/features/leads/queries";
import { getApiErrorMessage } from "@/lib/api";
import {
  formatJalaliDate,
  formatRelativeFa,
  toPersianDigits,
} from "@/lib/format";
import { cn } from "@/lib/utils";
import {
  ACTIVITY_FILTER_OPTIONS,
  ACTIVITY_TYPE_ICONS,
  ACTIVITY_TYPE_LABELS,
  ACTIVITY_TYPE_TONES,
  CALL_OUTCOME_LABELS,
} from "./activity-labels";

type LeadActivityTimelineProps = {
  leadId: string;
  stageTitle: (id: string) => string;
  consultantName: (id: string | null) => string;
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

export function LeadActivityTimeline({
  leadId,
  stageTitle,
  consultantName,
}: LeadActivityTimelineProps) {
  const { user } = useSession();
  const [typeFilter, setTypeFilter] = useState<string | null>(null);
  const query = useLeadActivitiesInfinite(
    leadId,
    typeFilter
      ? { type: typeFilter as ActivityType, order: "desc", sort: "createdAt" }
      : { order: "desc", sort: "createdAt" },
  );
  const updateActivity = useUpdateLeadActivity();
  const deleteActivity = useDeleteLeadActivity();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editBody, setEditBody] = useState("");

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

  const pinned = activities.filter(
    (activity) => activity.type === "note" && activity.pinned,
  );

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

      {pinned.length > 0 ? (
        <div className="space-y-2">
          <p className="text-muted-foreground text-xs">سنجاق‌شده</p>
          {pinned.map((activity) => (
            <ActivityItem
              key={`pin-${activity.id}`}
              activity={activity}
              summary={activitySummary(activity, stageTitle, consultantName)}
              canEdit={
                activity.type === "note" &&
                (activity.actorId === user?.id || user?.role === "admin")
              }
              isEditing={editingId === activity.id}
              editBody={editBody}
              onEditBody={setEditBody}
              onStartEdit={() => {
                setEditingId(activity.id);
                setEditBody(activity.type === "note" ? activity.body : "");
              }}
              onCancelEdit={() => setEditingId(null)}
              onSaveEdit={() => {
                updateActivity.mutate(
                  {
                    activityId: activity.id,
                    leadId,
                    body: { body: editBody.trim() },
                  },
                  {
                    onSuccess: () => {
                      toast.success("یادداشت به‌روز شد");
                      setEditingId(null);
                    },
                    onError: (error) => toast.error(getApiErrorMessage(error)),
                  },
                );
              }}
              onTogglePin={() => {
                if (activity.type !== "note") return;
                updateActivity.mutate(
                  {
                    activityId: activity.id,
                    leadId,
                    body: { pinned: !activity.pinned },
                  },
                  {
                    onSuccess: () => toast.success("سنجاق به‌روز شد"),
                    onError: (error) => toast.error(getApiErrorMessage(error)),
                  },
                );
              }}
              onDelete={() => {
                deleteActivity.mutate(
                  { activityId: activity.id, leadId },
                  {
                    onSuccess: () => toast.success("حذف شد"),
                    onError: (error) => toast.error(getApiErrorMessage(error)),
                  },
                );
              }}
            />
          ))}
        </div>
      ) : null}

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
              {items.map((activity) => (
                <ActivityItem
                  key={activity.id}
                  activity={activity}
                  summary={activitySummary(
                    activity,
                    stageTitle,
                    consultantName,
                  )}
                  canEdit={
                    activity.type === "note" &&
                    (activity.actorId === user?.id || user?.role === "admin")
                  }
                  isEditing={editingId === activity.id}
                  editBody={editBody}
                  onEditBody={setEditBody}
                  onStartEdit={() => {
                    setEditingId(activity.id);
                    setEditBody(activity.type === "note" ? activity.body : "");
                  }}
                  onCancelEdit={() => setEditingId(null)}
                  onSaveEdit={() => {
                    updateActivity.mutate(
                      {
                        activityId: activity.id,
                        leadId,
                        body: { body: editBody.trim() },
                      },
                      {
                        onSuccess: () => {
                          toast.success("یادداشت به‌روز شد");
                          setEditingId(null);
                        },
                        onError: (error) =>
                          toast.error(getApiErrorMessage(error)),
                      },
                    );
                  }}
                  onTogglePin={() => {
                    if (activity.type !== "note") return;
                    updateActivity.mutate(
                      {
                        activityId: activity.id,
                        leadId,
                        body: { pinned: !activity.pinned },
                      },
                      {
                        onSuccess: () => toast.success("سنجاق به‌روز شد"),
                        onError: (error) =>
                          toast.error(getApiErrorMessage(error)),
                      },
                    );
                  }}
                  onDelete={() => {
                    deleteActivity.mutate(
                      { activityId: activity.id, leadId },
                      {
                        onSuccess: () => toast.success("حذف شد"),
                        onError: (error) =>
                          toast.error(getApiErrorMessage(error)),
                      },
                    );
                  }}
                />
              ))}
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

function ActivityItem({
  activity,
  summary,
  canEdit,
  isEditing,
  editBody,
  onEditBody,
  onStartEdit,
  onCancelEdit,
  onSaveEdit,
  onTogglePin,
  onDelete,
}: {
  activity: Activity;
  summary: string;
  canEdit: boolean;
  isEditing: boolean;
  editBody: string;
  onEditBody: (value: string) => void;
  onStartEdit: () => void;
  onCancelEdit: () => void;
  onSaveEdit: () => void;
  onTogglePin: () => void;
  onDelete: () => void;
}) {
  const Icon = ACTIVITY_TYPE_ICONS[activity.type];
  const tone = ACTIVITY_TYPE_TONES[activity.type];

  return (
    <li className="bg-card flex gap-3 rounded-lg border p-3">
      <span
        data-tone={tone}
        className={cn(
          "mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-full",
          tone === "success" && "bg-success/15 text-success",
          tone === "danger" && "bg-destructive/10 text-destructive",
          tone === "warning" && "bg-warning/20 text-warning-foreground",
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
            {activity.type === "note" && activity.pinned ? (
              <Pin
                aria-label="سنجاق‌شده"
                className="ms-1 inline size-3 text-warning-foreground"
              />
            ) : null}
          </p>
          <time
            className="text-muted-foreground text-xs tabular-nums"
            title={formatJalaliDate(activity.createdAt, "yyyy/MM/dd HH:mm")}
          >
            {formatRelativeFa(activity.createdAt)} ·{" "}
            {formatJalaliDate(activity.createdAt, "HH:mm")}
          </time>
        </div>
        {isEditing ? (
          <div className="space-y-2">
            <Textarea
              value={editBody}
              onChange={(event) => onEditBody(event.target.value)}
              rows={3}
              maxLength={2000}
            />
            <div className="flex gap-2">
              <Button type="button" size="sm" onClick={onSaveEdit}>
                ذخیره
              </Button>
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={onCancelEdit}
              >
                انصراف
              </Button>
            </div>
          </div>
        ) : (
          <p className="text-muted-foreground whitespace-pre-wrap text-sm">
            {summary || "—"}
          </p>
        )}
        {canEdit && !isEditing ? (
          <div className="flex flex-wrap gap-1 pt-1">
            <Can permission="lead:write">
              <Button
                type="button"
                size="sm"
                variant="ghost"
                onClick={onTogglePin}
              >
                <Pin data-icon="inline-start" aria-hidden />
                {activity.type === "note" && activity.pinned
                  ? "برداشتن سنجاق"
                  : "سنجاق"}
              </Button>
              <Button
                type="button"
                size="sm"
                variant="ghost"
                onClick={onStartEdit}
              >
                <Pencil data-icon="inline-start" aria-hidden />
                ویرایش
              </Button>
            </Can>
            <Can permission="lead:delete">
              <Button
                type="button"
                size="sm"
                variant="ghost"
                className="text-destructive"
                onClick={onDelete}
              >
                <Trash2 data-icon="inline-start" aria-hidden />
                حذف
              </Button>
            </Can>
          </div>
        ) : null}
      </div>
    </li>
  );
}
