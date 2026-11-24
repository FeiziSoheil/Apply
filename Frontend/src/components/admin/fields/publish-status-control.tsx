"use client";

import type { PublicationStatus } from "@/contracts/content";
import { DateTimeJalaliPicker } from "@/components/admin/fields/date-time-jalali-picker";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Spinner } from "@/components/ui/spinner";
import {
  ToggleGroup,
  ToggleGroupItem,
} from "@/components/ui/toggle-group";
import {
  PUBLICATION_STATUS_MAP,
  StatusBadge,
} from "@/components/admin/status-badge";
import { formatJalaliDate } from "@/lib/format";
import { cn } from "@/lib/utils";

const STATUS_OPTIONS: readonly {
  value: PublicationStatus;
  label: string;
}[] = [
  { value: "draft", label: "پیش‌نویس" },
  { value: "published", label: "منتشرشده" },
  { value: "scheduled", label: "زمان‌بندی" },
];

export type PublishStatusControlProps = {
  status: PublicationStatus;
  /**
   * ISO datetime for `status: "scheduled"`.
   * When provided with `onScheduledAtChange`, the Jalali picker is shown.
   */
  scheduledAt?: string | null;
  onScheduledAtChange?: (value: string | null) => void;
  /**
   * When set, a draft / published / scheduled toggle is shown.
   * Omit to keep a read-only status badge (backward compatible).
   */
  onStatusChange?: (status: PublicationStatus) => void;
  /** ISO timestamp of the last save */
  lastEditedAt?: string | null;
  /** Display name of the last editor */
  lastEditedBy?: string | null;
  isPending?: boolean;
  disabled?: boolean;
  className?: string;
  /** Persist as draft (`status: "draft"`) */
  onSaveDraft: () => void;
  /** Persist and set `status: "published"` */
  onPublish: () => void;
  /**
   * Persist as scheduled. When omitted and status is scheduled,
   * «انتشار» still works for immediate publish.
   */
  onSchedule?: () => void;
  /** @deprecated Archive is not in the publication contract; kept for callers */
  onArchive?: () => void;
};

/**
 * Editorial status control: draft / published / scheduled (optional Jalali
 * date+time), «ذخیره پیش‌نویس» / «انتشار», and last-edit metadata.
 */
export function PublishStatusControl({
  status,
  scheduledAt,
  onScheduledAtChange,
  onStatusChange,
  lastEditedAt,
  lastEditedBy,
  isPending = false,
  disabled = false,
  className,
  onSaveDraft,
  onPublish,
  onSchedule,
  onArchive,
}: PublishStatusControlProps) {
  void onArchive;
  const busy = isPending || disabled;
  const showSchedulePicker =
    status === "scheduled" && typeof onScheduledAtChange === "function";

  const lastEdit =
    lastEditedAt || lastEditedBy
      ? [
          lastEditedAt
            ? formatJalaliDate(lastEditedAt, "d MMMM yyyy، HH:mm")
            : null,
          lastEditedBy ? `ویرایشگر: ${lastEditedBy}` : null,
        ]
          .filter(Boolean)
          .join(" · ")
      : null;

  return (
    <div
      className={cn(
        "flex flex-col gap-3",
        className,
      )}
    >
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex min-w-0 flex-col gap-2">
          {onStatusChange ? (
            <div className="flex flex-col gap-2">
              <span className="text-sm text-muted-foreground">وضعیت انتشار</span>
              <ToggleGroup
                type="single"
                value={status}
                onValueChange={(value) => {
                  if (
                    value === "draft" ||
                    value === "published" ||
                    value === "scheduled"
                  ) {
                    onStatusChange(value);
                  }
                }}
                variant="outline"
                size="sm"
                spacing={0}
                className="flex flex-wrap justify-start"
                disabled={busy}
                aria-label="وضعیت انتشار"
              >
                {STATUS_OPTIONS.map((option) => (
                  <ToggleGroupItem
                    key={option.value}
                    value={option.value}
                    className="px-3"
                  >
                    {option.label}
                  </ToggleGroupItem>
                ))}
              </ToggleGroup>
            </div>
          ) : (
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-sm text-muted-foreground">وضعیت:</span>
              <StatusBadge status={status} map={PUBLICATION_STATUS_MAP} />
            </div>
          )}

          {lastEdit ? (
            <p className="truncate text-xs text-muted-foreground">
              آخرین ویرایش: {lastEdit}
            </p>
          ) : null}
        </div>

        <div className="flex flex-wrap items-center gap-2 sm:justify-end">
          <Button
            type="button"
            variant="outline"
            disabled={busy}
            onClick={onSaveDraft}
          >
            {isPending ? (
              <Spinner data-icon="inline-start" aria-label="در حال ذخیره" />
            ) : null}
            ذخیره پیش‌نویس
          </Button>
          {status === "scheduled" && onSchedule ? (
            <Button type="button" disabled={busy} onClick={onSchedule}>
              {isPending ? (
                <Spinner data-icon="inline-start" aria-label="در حال زمان‌بندی" />
              ) : null}
              زمان‌بندی انتشار
            </Button>
          ) : (
            <Button type="button" disabled={busy} onClick={onPublish}>
              {isPending ? (
                <Spinner data-icon="inline-start" aria-label="در حال انتشار" />
              ) : null}
              انتشار
            </Button>
          )}
        </div>
      </div>

      {showSchedulePicker ? (
        <div className="flex max-w-sm flex-col gap-2 rounded-lg border bg-muted/20 p-3">
          <Label htmlFor="publish-scheduled-at">زمان انتشار (جلالی)</Label>
          <DateTimeJalaliPicker
            id="publish-scheduled-at"
            mode="datetime"
            value={scheduledAt}
            onChange={onScheduledAtChange}
            disabled={busy}
            placeholder="انتخاب تاریخ و ساعت انتشار"
          />
          <p className="text-xs text-muted-foreground">
            پس از رسیدن به این زمان، وضعیت به‌صورت منتشرشده در نظر گرفته می‌شود.
          </p>
        </div>
      ) : null}
    </div>
  );
}
