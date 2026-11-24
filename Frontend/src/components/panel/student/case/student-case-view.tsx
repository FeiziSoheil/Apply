"use client";

import { GraduationCap } from "lucide-react";
import { PageContainer } from "@/components/panel/page-container";
import { Badge } from "@/components/ui/badge";
import { useMyCase } from "@/features/student-panel/queries";
import { DEGREE_LEVEL_LABELS } from "@/lib/degree-levels";
import { formatJalaliDate, toPersianDigits } from "@/lib/format";
import type { DegreeLevel } from "@/types";
import { cn } from "@/lib/utils";
import { CaseLinkGate } from "../case-link-gate";
import {
  StudentPanelEmpty,
  StudentPanelError,
  StudentPanelSkeleton,
} from "../panel-query-state";
import { STUDENT_STAGE_HELP } from "../student-nav";

function CaseContent() {
  const caseQuery = useMyCase();

  if (caseQuery.isLoading) return <StudentPanelSkeleton />;
  if (caseQuery.isError) {
    return (
      <StudentPanelError
        error={caseQuery.error}
        onRetry={() => void caseQuery.refetch()}
      />
    );
  }

  const studentCase = caseQuery.data;
  if (!studentCase) return <StudentPanelSkeleton />;

  const currentHelp =
    STUDENT_STAGE_HELP[studentCase.currentStageKey] ??
    STUDENT_STAGE_HELP[studentCase.stages.find((s) => s.status === "current")?.key ?? ""] ??
    null;
  const target = studentCase.targetProgram;
  const degreeLabel =
    DEGREE_LEVEL_LABELS[studentCase.targetDegree as DegreeLevel] ??
    studentCase.targetDegree;

  return (
    <PageContainer className="gap-5 pb-4">
      <header className="space-y-1">
        <h1 className="font-heading text-2xl font-bold">پرونده من</h1>
        <p className="text-sm text-muted-foreground">
          کد {studentCase.code} · {toPersianDigits(studentCase.progressPercent)}٪
          پیشرفت
        </p>
      </header>

      {/* نوار مراحل */}
      <section
        aria-labelledby="stages-heading"
        className="rounded-2xl border bg-card p-4"
      >
        <div className="mb-4 flex items-center justify-between gap-2">
          <h2 id="stages-heading" className="font-medium">
            مراحل پرونده
          </h2>
          <Badge variant="secondary">{studentCase.currentStageTitle}</Badge>
        </div>

        <ol className="flex flex-col gap-3" role="list">
          {studentCase.stages.map((stage, index) => {
            const help = STUDENT_STAGE_HELP[stage.key];
            const isCurrent = stage.status === "current";
            return (
              <li
                key={stage.key}
                className={cn(
                  "rounded-xl border p-3",
                  isCurrent && "border-primary/40 bg-primary/5",
                  stage.status === "done" && "opacity-80",
                )}
              >
                <div className="flex items-center gap-2">
                  <span
                    className={cn(
                      "flex size-7 shrink-0 items-center justify-center rounded-full text-xs font-semibold tabular-nums",
                      stage.status === "done" &&
                        "bg-primary text-primary-foreground",
                      isCurrent && "bg-accent text-accent-foreground",
                      stage.status === "upcoming" &&
                        "bg-muted text-muted-foreground",
                    )}
                  >
                    {toPersianDigits(index + 1)}
                  </span>
                  <p className="font-medium">
                    {stage.title}
                    {isCurrent ? (
                      <span className="ms-2 text-xs font-normal text-primary">
                        مرحله فعلی
                      </span>
                    ) : null}
                  </p>
                </div>
                {isCurrent && help ? (
                  <dl className="mt-3 space-y-2 text-sm text-muted-foreground">
                    <div>
                      <dt className="font-medium text-foreground">چه خبر است؟</dt>
                      <dd>{help.what}</dd>
                    </div>
                    <div>
                      <dt className="font-medium text-foreground">چقدر طول می‌کشد؟</dt>
                      <dd>{help.duration}</dd>
                    </div>
                    <div>
                      <dt className="font-medium text-foreground">شما چه کار کنید؟</dt>
                      <dd>{help.studentMust}</dd>
                    </div>
                  </dl>
                ) : null}
              </li>
            );
          })}
        </ol>

        {currentHelp &&
        !studentCase.stages.some((s) => s.status === "current") ? (
          <p className="mt-3 text-sm text-muted-foreground">{currentHelp.what}</p>
        ) : null}
      </section>

      {/* تاریخچه */}
      <section
        aria-labelledby="history-heading"
        className="rounded-2xl border bg-card p-4"
      >
        <h2 id="history-heading" className="mb-3 font-medium">
          تاریخچه مراحل
        </h2>
        {studentCase.stageHistory.length === 0 ? (
          <StudentPanelEmpty
            className="border-0 py-6 shadow-none"
            title="هنوز تاریخچه‌ای نیست"
            description="وقتی مرحله پرونده عوض شود، اینجا می‌بینید."
          />
        ) : (
          <ol className="relative space-y-0 border-s border-border ps-4">
            {[...studentCase.stageHistory].reverse().map((entry) => (
              <li key={`${entry.stageKey}-${entry.enteredAt}`} className="pb-4 last:pb-0">
                <span
                  className="absolute start-[-0.3rem] mt-1.5 size-2 rounded-full bg-primary"
                  aria-hidden
                />
                <p className="text-sm font-medium">{entry.stageTitle}</p>
                <p className="text-xs text-muted-foreground tabular-nums">
                  {formatJalaliDate(entry.enteredAt, "yyyy/MM/dd")}
                </p>
              </li>
            ))}
          </ol>
        )}
      </section>

      {/* مقصد / برنامه */}
      <section
        aria-labelledby="target-heading"
        className="rounded-2xl border bg-card p-4"
      >
        <h2
          id="target-heading"
          className="mb-3 flex items-center gap-2 font-medium"
        >
          <GraduationCap className="size-4" aria-hidden />
          مقصد تحصیلی
        </h2>
        {target ? (
          <dl className="grid gap-3 text-sm sm:grid-cols-2">
            <div>
              <dt className="text-muted-foreground">کشور</dt>
              <dd className="font-medium">
                {target.countryName ?? target.countrySlug}
              </dd>
            </div>
            <div>
              <dt className="text-muted-foreground">مقطع</dt>
              <dd className="font-medium">{degreeLabel}</dd>
            </div>
            {target.programTitle ? (
              <div className="sm:col-span-2">
                <dt className="text-muted-foreground">برنامه</dt>
                <dd className="font-medium">{target.programTitle}</dd>
              </div>
            ) : null}
            {target.universityName ? (
              <div className="sm:col-span-2">
                <dt className="text-muted-foreground">دانشگاه</dt>
                <dd className="font-medium">{target.universityName}</dd>
              </div>
            ) : null}
            {target.languageRequirement ? (
              <div>
                <dt className="text-muted-foreground">شرایط زبان</dt>
                <dd className="font-medium">{target.languageRequirement}</dd>
              </div>
            ) : null}
            {target.minGpa !== null && target.minGpa !== undefined ? (
              <div>
                <dt className="text-muted-foreground">حداقل معدل</dt>
                <dd className="font-medium tabular-nums">
                  {toPersianDigits(target.minGpa)}
                </dd>
              </div>
            ) : null}
            {target.duration ? (
              <div>
                <dt className="text-muted-foreground">مدت</dt>
                <dd className="font-medium">{target.duration}</dd>
              </div>
            ) : null}
          </dl>
        ) : (
          <p className="text-sm text-muted-foreground">
            کشور {studentCase.targetCountry} · مقطع {degreeLabel}
          </p>
        )}
      </section>

      {/* به‌روزرسانی‌های قابل‌نمایش */}
      {studentCase.recentUpdates.length > 0 ? (
        <section
          aria-labelledby="updates-heading"
          className="rounded-2xl border bg-card p-4"
        >
          <h2 id="updates-heading" className="mb-3 font-medium">
            آخرین تغییرات
          </h2>
          <ul className="flex flex-col gap-2" role="list">
            {studentCase.recentUpdates.map((update) => (
              <li
                key={update.id}
                className="rounded-lg border border-dashed px-3 py-2 text-sm"
              >
                <p>{update.title}</p>
                <p className="mt-0.5 text-xs text-muted-foreground tabular-nums">
                  {formatJalaliDate(update.occurredAt, "yyyy/MM/dd")}
                </p>
              </li>
            ))}
          </ul>
        </section>
      ) : null}
    </PageContainer>
  );
}

export function StudentCasePageView() {
  return (
    <CaseLinkGate>
      <CaseContent />
    </CaseLinkGate>
  );
}
