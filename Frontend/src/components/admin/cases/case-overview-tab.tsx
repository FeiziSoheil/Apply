"use client";

import type { StudentCase } from "@/contracts/students";
import type { Task } from "@/contracts/crm";
import { TaskSection } from "@/components/admin/tasks/task-section";
import { CASE_STAGES } from "@/contracts/students";
import { formatJalaliDate, toPersianDigits } from "@/lib/format";
import { CASE_STAGE_LABELS, CASE_STATUS_MAP } from "./case-labels";
import { CaseTemplateCard } from "./case-template-card";
import type { CaseTemplate } from "@/contracts/crm";
import { StatusBadge } from "@/components/admin/status-badge";

type CaseOverviewTabProps = {
  studentCase: StudentCase;
  tasks: readonly Task[];
  template?: CaseTemplate | null;
  templateLoading?: boolean;
  onGoDocuments?: () => void;
  currentUserId: string;
};

export function CaseOverviewTab({
  studentCase,
  tasks,
  template,
  templateLoading,
  onGoDocuments,
  currentUserId,
}: CaseOverviewTabProps) {
  const currentIndex = CASE_STAGES.indexOf(studentCase.currentStage);
  const nextStage =
    currentIndex >= 0 && currentIndex < CASE_STAGES.length - 1
      ? CASE_STAGES[currentIndex + 1]
      : null;

  const progress = studentCase.progressPercent ?? 0;

  return (
    <div className="grid gap-4 lg:grid-cols-[1fr_20rem]">
      <div className="space-y-4">
        <section className="bg-card space-y-3 rounded-lg border p-4">
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="text-sm font-semibold">خلاصه پرونده</h2>
            <StatusBadge status={studentCase.status} map={CASE_STATUS_MAP} />
          </div>
          <dl className="grid gap-2 text-sm sm:grid-cols-2">
            <div>
              <dt className="text-muted-foreground">کد</dt>
              <dd className="tabular-nums" dir="ltr">
                {studentCase.code}
              </dd>
            </div>
            <div>
              <dt className="text-muted-foreground">مقطع</dt>
              <dd>{studentCase.targetDegree}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground">پیشرفت چک‌لیست</dt>
              <dd className="tabular-nums">{toPersianDigits(progress)}٪</dd>
            </div>
            <div>
              <dt className="text-muted-foreground">مدارک ناقص / در انتظار</dt>
              <dd className="tabular-nums">
                {toPersianDigits(studentCase.incompleteDocsCount ?? 0)} /{" "}
                {toPersianDigits(studentCase.pendingReviewDocsCount ?? 0)}
              </dd>
            </div>
          </dl>
          {(studentCase.incompleteDocsCount ?? 0) > 0 ||
          (studentCase.pendingReviewDocsCount ?? 0) > 0 ? (
            <button
              type="button"
              className="text-primary text-sm hover:underline"
              onClick={onGoDocuments}
            >
              مشاهده مدارک
            </button>
          ) : null}
        </section>

        <section className="bg-card space-y-2 rounded-lg border p-4">
          <h2 className="text-sm font-semibold">مرحله بعد و پیش‌نیازها</h2>
          {nextStage ? (
            <>
              <p className="text-sm">
                مرحله بعدی:{" "}
                <span className="font-medium">{CASE_STAGE_LABELS[nextStage]}</span>
              </p>
              <p className="text-muted-foreground text-sm">
                پیش از پیشبرد، مدارک الزامی مرحلهٔ{" "}
                {CASE_STAGE_LABELS[studentCase.currentStage]} باید تأیید شوند.
                {(studentCase.incompleteDocsCount ?? 0) > 0
                  ? ` هنوز ${toPersianDigits(studentCase.incompleteDocsCount ?? 0)} مورد ناقص است.`
                  : " چک‌لیست فعلی کامل به‌نظر می‌رسد."}
              </p>
            </>
          ) : (
            <p className="text-muted-foreground text-sm">
              پرونده در آخرین مرحله است.
            </p>
          )}
        </section>

        <TaskSection
          tasks={tasks}
          relatedType="case"
          relatedId={studentCase.id}
          defaultAssigneeId={studentCase.consultantId}
          currentUserId={currentUserId}
          allHref={`/admin/tasks?relatedType=case&relatedId=${studentCase.id}`}
          compact
        />

        <section className="bg-card space-y-2 rounded-lg border p-4">
          <h2 className="text-sm font-semibold">ددلاین‌ها</h2>
          {studentCase.nearestDeadline ? (
            <p className="text-sm">
              نزدیک‌ترین ددلاین چک‌لیست:{" "}
              <span className="font-medium tabular-nums">
                {formatJalaliDate(
                  `${studentCase.nearestDeadline}T12:00:00.000Z`,
                  "d MMMM yyyy",
                )}
              </span>
            </p>
          ) : (
            <p className="text-muted-foreground text-sm">
              ددلاین بازی برای چک‌لیست ثبت نشده است.
            </p>
          )}
        </section>
      </div>

      <CaseTemplateCard template={template} loading={templateLoading} />
    </div>
  );
}
