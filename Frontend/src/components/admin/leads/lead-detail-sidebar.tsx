"use client";

import { useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { DateTimeJalaliPicker } from "@/components/admin/fields/date-time-jalali-picker";
import { TaskSection } from "@/components/admin/tasks/task-section";
import { Can } from "@/components/rbac/can";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { Task } from "@/contracts/crm";
import type { Lead } from "@/contracts/leads";
import type { Booking } from "@/contracts/bookings";
import { useCreateTask } from "@/features/crm/mutations";
import { useUpdateLead } from "@/features/leads/mutations";
import { ApiError, getApiErrorMessage } from "@/lib/api";
import { DEGREE_LEVEL_LABELS } from "@/lib/degree-levels";
import {
  formatJalaliDate,
  formatRelativeFa,
  toPersianDigits,
} from "@/lib/format";
import { START_TIME_LABELS } from "./activity-labels";
import { LEAD_SOURCE_LABELS } from "./lead-labels";
import { LeadMergeDialog } from "./lead-merge-dialog";

type LeadDetailSidebarProps = {
  lead: Lead;
  version: number;
  countryName: (slug: string) => string;
  tasks: readonly Task[];
  bookings: readonly Booking[];
  duplicates: readonly Lead[];
  currentUserId: string;
  onVersionMismatch: (currentVersion?: number) => void;
  onLeadUpdated: (lead: Lead) => void;
  onDirtyChange?: (dirty: boolean) => void;
};

export function LeadDetailSidebar({
  lead,
  version,
  countryName,
  tasks,
  bookings,
  duplicates,
  currentUserId,
  onVersionMismatch,
  onLeadUpdated,
}: LeadDetailSidebarProps) {
  const updateLead = useUpdateLead();
  const createTask = useCreateTask();
  const [followUp, setFollowUp] = useState<string | null>(lead.nextFollowUpAt);
  const [editingName, setEditingName] = useState(lead.name);
  const [editingEmail, setEditingEmail] = useState(lead.email ?? "");
  const [mergeTarget, setMergeTarget] = useState<Lead | null>(null);

  function patchLead(
    body: Parameters<typeof updateLead.mutate>[0]["body"],
    successMessage: string,
  ) {
    updateLead.mutate(
      { id: lead.id, body, version },
      {
        onSuccess: (updated) => {
          toast.success(successMessage);
          onLeadUpdated(updated);
        },
        onError: (error) => {
          if (error instanceof ApiError && error.isVersionMismatch) {
            onVersionMismatch(error.currentVersion);
            return;
          }
          toast.error(getApiErrorMessage(error));
        },
      },
    );
  }

  return (
    <aside className="flex flex-col gap-4">
      <section className="bg-card space-y-3 rounded-xl border p-3">
        <h2 className="text-sm font-semibold">اطلاعات تماس</h2>
        <Can permission="lead:write">
          <div className="space-y-1.5">
            <Label htmlFor="lead-name">نام</Label>
            <Input
              id="lead-name"
              value={editingName}
              onChange={(event) => setEditingName(event.target.value)}
              onBlur={() => {
                if (editingName.trim() && editingName.trim() !== lead.name) {
                  patchLead({ name: editingName.trim() }, "نام به‌روز شد");
                }
              }}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="lead-email">ایمیل</Label>
            <Input
              id="lead-email"
              dir="ltr"
              value={editingEmail}
              onChange={(event) => setEditingEmail(event.target.value)}
              onBlur={() => {
                const next = editingEmail.trim() || null;
                if (next !== lead.email) {
                  patchLead({ email: next }, "ایمیل به‌روز شد");
                }
              }}
            />
          </div>
        </Can>
        <p className="text-sm" dir="ltr">
          {toPersianDigits(lead.mobile)}
        </p>
      </section>

      {lead.assessment ? (
        <section className="bg-card space-y-2 rounded-xl border p-3 text-sm">
          <h2 className="font-semibold">پروفایل ارزیابی</h2>
          <p>
            مقطع فعلی: {DEGREE_LEVEL_LABELS[lead.assessment.currentDegree]}
          </p>
          <p>
            مقطع هدف: {DEGREE_LEVEL_LABELS[lead.assessment.targetDegree]}
          </p>
          <p>رشته: {lead.assessment.fieldOfStudy}</p>
          <p>معدل: {toPersianDigits(lead.assessment.gpa)}</p>
          <p>
            زبان: {lead.assessment.languageStatus}
            {lead.assessment.languageScore !== undefined
              ? ` (${toPersianDigits(lead.assessment.languageScore)})`
              : ""}
          </p>
          <p>
            بودجه: {toPersianDigits(lead.assessment.annualBudget)}{" "}
            {lead.assessment.currency}
          </p>
          <p>
            کشورها:{" "}
            {lead.assessment.targetCountries.map(countryName).join("، ")}
          </p>
          <p>
            زمان شروع:{" "}
            {START_TIME_LABELS[lead.assessment.startTime] ??
              lead.assessment.startTime}
          </p>
        </section>
      ) : (
        <section className="bg-card space-y-2 rounded-xl border p-3 text-sm">
          <h2 className="font-semibold">علاقه‌مندی</h2>
          <p>
            کشورها:{" "}
            {(lead.targetCountries.length > 0
              ? lead.targetCountries
              : lead.interestCountry
                ? [lead.interestCountry]
                : []
            )
              .map(countryName)
              .join("، ") || "—"}
          </p>
          <p>
            مقطع:{" "}
            {lead.interestDegree
              ? DEGREE_LEVEL_LABELS[lead.interestDegree]
              : "—"}
          </p>
        </section>
      )}

      <section className="bg-card space-y-3 rounded-xl border p-3">
        <h2 className="text-sm font-semibold">پیگیری بعدی</h2>
        <DateTimeJalaliPicker
          value={followUp}
          onChange={setFollowUp}
          mode="datetime"
        />
        <Can permission="lead:write">
          <Button
            type="button"
            size="sm"
            disabled={updateLead.isPending || createTask.isPending}
            onClick={() => {
              patchLead({ nextFollowUpAt: followUp }, "پیگیری به‌روز شد");
              if (followUp && lead.assignedTo) {
                createTask.mutate(
                  {
                    title: `پیگیری ${lead.name}`,
                    dueAt: followUp,
                    assigneeId: lead.assignedTo,
                    relatedType: "lead",
                    relatedId: lead.id,
                    priority: "normal",
                  },
                  {
                    onSuccess: () => toast.success("کار پیگیری ساخته شد"),
                    onError: (error) =>
                      toast.error(getApiErrorMessage(error)),
                  },
                );
              }
            }}
          >
            ذخیره پیگیری
          </Button>
        </Can>
      </section>

      <TaskSection
        tasks={tasks}
        relatedType="lead"
        relatedId={lead.id}
        defaultAssigneeId={lead.assignedTo}
        currentUserId={currentUserId}
        allHref={`/admin/tasks?relatedType=lead&relatedId=${lead.id}`}
        compact
      />

      <section className="bg-card space-y-2 rounded-xl border p-3">
        <h2 className="text-sm font-semibold">رزروهای مرتبط</h2>
        {bookings.length === 0 ? (
          <p className="text-muted-foreground text-xs">رزروی نیست</p>
        ) : (
          <ul className="space-y-2 text-sm">
            {bookings.map((booking) => (
              <li key={booking.id}>
                <Link
                  href="/admin/bookings"
                  className="hover:underline"
                >
                  {formatJalaliDate(booking.startsAt, "d MMM yyyy HH:mm")} ·{" "}
                  {booking.status}
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="bg-card space-y-2 rounded-xl border p-3">
        <h2 className="text-sm font-semibold">لیدهای تکراری</h2>
        {duplicates.length === 0 ? (
          <p className="text-muted-foreground text-xs">تکراری یافت نشد</p>
        ) : (
          <ul className="space-y-2">
            {duplicates.map((dup) => (
              <li
                key={dup.id}
                className="flex flex-wrap items-center justify-between gap-2 text-sm"
              >
                <span>{dup.name}</span>
                <div className="flex gap-1">
                  <Button type="button" size="sm" variant="outline" asChild>
                    <Link href={`/admin/leads/${dup.id}`}>مشاهده</Link>
                  </Button>
                  <Can permission="lead:merge">
                    <Button
                      type="button"
                      size="sm"
                      variant="secondary"
                      onClick={() => setMergeTarget(dup)}
                    >
                      ادغام
                    </Button>
                  </Can>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="bg-card space-y-1 rounded-xl border p-3 text-sm">
        <h2 className="mb-2 font-semibold">منبع و متا</h2>
        <p>منبع: {LEAD_SOURCE_LABELS[lead.source]}</p>
        {lead.utm ? (
          <p className="text-muted-foreground text-xs" dir="ltr">
            utm: {[lead.utm.source, lead.utm.medium, lead.utm.campaign]
              .filter(Boolean)
              .join(" / ") || "—"}
          </p>
        ) : null}
        <p>ایجاد: {formatJalaliDate(lead.createdAt, "d MMMM yyyy HH:mm")}</p>
        <p>آخرین فعالیت: {formatRelativeFa(lead.lastActivityAt)}</p>
      </section>

      {mergeTarget ? (
        <LeadMergeDialog
          open
          source={lead}
          target={mergeTarget}
          onOpenChange={(open) => {
            if (!open) setMergeTarget(null);
          }}
        />
      ) : null}
    </aside>
  );
}
