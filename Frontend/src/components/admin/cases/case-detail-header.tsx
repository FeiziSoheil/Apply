"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { StatusBadge } from "@/components/admin/status-badge";
import { Button } from "@/components/ui/button";
import type { StudentCase } from "@/contracts/students";
import { CASE_STAGE_LABELS, CASE_STATUS_MAP } from "./case-labels";
import { CaseStageStepper } from "./case-stage-stepper";

type CaseDetailHeaderProps = {
  studentCase: StudentCase;
  countryName: (slug: string) => string;
};

export function CaseDetailHeader({
  studentCase,
  countryName,
}: CaseDetailHeaderProps) {
  return (
    <header className="space-y-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="space-y-1">
          <div className="flex flex-wrap items-center gap-2">
            <Button type="button" variant="ghost" size="sm" asChild>
              <Link href="/admin/cases">
                <ArrowRight data-icon="inline-start" aria-hidden />
                بازگشت
              </Link>
            </Button>
            <StatusBadge status={studentCase.status} map={CASE_STATUS_MAP} />
          </div>
          <h1 className="text-xl font-semibold tracking-tight sm:text-2xl">
            {studentCase.studentName}
          </h1>
          <p className="text-muted-foreground text-sm">
            {countryName(studentCase.targetCountry)} ·{" "}
            {studentCase.targetDegree} · مرحله{" "}
            {CASE_STAGE_LABELS[studentCase.currentStage]}
          </p>
          <p className="text-muted-foreground text-xs">
            مسئول: {studentCase.assigneeName ?? "بدون مسئول"}
            {studentCase.leadId ? (
              <>
                {" · "}
                <Link
                  href={`/admin/leads/${studentCase.leadId}`}
                  className="text-primary hover:underline"
                >
                  سرنخ مبدأ
                </Link>
              </>
            ) : null}
            {" · "}
            <span className="tabular-nums" dir="ltr">
              {studentCase.code}
            </span>
          </p>
        </div>
      </div>
      <CaseStageStepper
        stages={studentCase.stages}
        currentStage={studentCase.currentStage}
      />
    </header>
  );
}
