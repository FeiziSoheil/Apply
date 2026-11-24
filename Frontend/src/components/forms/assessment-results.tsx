"use client";

import { useSyncExternalStore } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Section } from "@/components/shared/section";
import {
  loadAssessmentResult,
  type StoredAssessmentResult,
} from "@/components/forms/assessment-form";
import {
  CONTACT_PREFERENCE_LABELS,
  DEGREE_LEVEL_LABELS,
  LANGUAGE_STATUS_LABELS,
  START_TIME_LABELS,
} from "@/lib/validations/assessment";
import { formatMoney } from "@/lib/currency";
import { toPersianDigits } from "@/lib/format";
import type { DegreeLevel } from "@/types";

type CountryNameMap = Record<string, string>;

/** Display data of a program, keyed by program id (resolved on the server) */
export type RecommendedProgramInfo = {
  slug: string;
  nameFa: string;
  degreeLevel: DegreeLevel;
  field: string;
  tuition: number;
  currency: string;
  hasScholarship: boolean;
  countryNameFa: string;
  countryFlagEmoji?: string;
};

export type ProgramInfoMap = Record<string, RecommendedProgramInfo>;

type AssessmentResultsProps = {
  countryNames: CountryNameMap;
  programs: ProgramInfoMap;
};

const emptySubscribe = () => () => {};

function useIsClient(): boolean {
  return useSyncExternalStore(
    emptySubscribe,
    () => true,
    () => false,
  );
}

function useStoredAssessmentResult(): StoredAssessmentResult | null {
  return useSyncExternalStore(
    emptySubscribe,
    () => loadAssessmentResult(),
    () => null,
  );
}

export function AssessmentResults({
  countryNames,
  programs,
}: AssessmentResultsProps) {
  const isClient = useIsClient();
  const result = useStoredAssessmentResult();

  if (!isClient) {
    return (
      <Section title="نتیجه ارزیابی">
        <p className="text-muted-foreground">در حال بارگذاری نتیجه…</p>
      </Section>
    );
  }

  if (!result) {
    return (
      <Section title="نتیجه‌ای یافت نشد"
        subtitle="برای دریافت پیشنهاد، ابتدا فرم ارزیابی را تکمیل کنید.">
        <Button asChild>
          <Link href="/assessment">شروع ارزیابی</Link>
        </Button>
      </Section>
    );
  }

  const { answers } = result;
  // API returns `programId` + score; programs unknown to the catalog are skipped
  const recommendations = result.recommendations.flatMap((item) => {
    const program = programs[item.programId];
    return program ? [{ ...item, program }] : [];
  });

  const summaryRows: { label: string; value: string }[] = [
    {
      label: "مقطع فعلی",
      value: DEGREE_LEVEL_LABELS[answers.currentDegree],
    },
    {
      label: "مقطع هدف",
      value: DEGREE_LEVEL_LABELS[answers.targetDegree],
    },
    { label: "رشته", value: answers.fieldOfStudy },
    { label: "معدل", value: toPersianDigits(answers.gpa) },
    {
      label: "زبان",
      value:
        answers.languageStatus === "other"
          ? answers.languageOther || LANGUAGE_STATUS_LABELS.other
          : answers.languageStatus === "none"
            ? LANGUAGE_STATUS_LABELS.none
            : `${LANGUAGE_STATUS_LABELS[answers.languageStatus]}${
                answers.languageScore !== undefined
                  ? ` — ${toPersianDigits(answers.languageScore)}`
                  : ""
              }`,
    },
    {
      label: "کشورهای هدف",
      value: answers.targetCountries
        .map((slug) => countryNames[slug] ?? slug)
        .join("، "),
    },
    {
      label: "بودجه سالانه",
      value: formatMoney(answers.annualBudget, answers.currency),
    },
    {
      label: "شروع تحصیل",
      value: START_TIME_LABELS[answers.startTime],
    },
    {
      label: "بورسیه",
      value: answers.needsScholarship ? "بله" : "خیر",
    },
    { label: "نام", value: answers.name },
    { label: "موبایل", value: toPersianDigits(answers.mobile) },
    {
      label: "ترجیح تماس",
      value: CONTACT_PREFERENCE_LABELS[answers.contactPreference],
    },
  ];

  return (
    <div className="space-y-4 pb-10">
      <Section title="خلاصه پاسخ‌های شما"
        subtitle="بر اساس اطلاعات ثبت‌شده، سه پیشنهاد اولیه آماده شد.">
        <dl className="grid gap-3 sm:grid-cols-2">
          {summaryRows.map((row) => (
            <div
              key={row.label}
              className="rounded-lg border border-border bg-muted/30 px-4 py-3"
            >
              <dt className="text-xs text-muted-foreground">{row.label}</dt>
              <dd className="mt-1 text-sm font-medium text-foreground">
                {row.value}
              </dd>
            </div>
          ))}
        </dl>
      </Section>

      <Section title="پیشنهادهای اولیه"
        subtitle="این پیشنهادها تقریبی‌اند؛ برای برنامه دقیق‌تر مشاوره رزرو کنید.">
        {recommendations.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            پیشنهاد آماده‌ای برای نمایش وجود ندارد؛ برای دریافت برنامه دقیق
            مشاوره رزرو کنید.
          </p>
        ) : (
          <ul className="grid gap-4">
            {recommendations.map((item) => (
              <li
                key={item.programId}
                className="rounded-xl border border-border p-4 sm:p-5"
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="text-base font-semibold text-foreground">
                      {item.program.countryFlagEmoji ? (
                        <span aria-hidden="true" className="me-2">
                          {item.program.countryFlagEmoji}
                        </span>
                      ) : null}
                      {item.program.nameFa}
                    </p>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {item.program.countryNameFa} ·{" "}
                      {DEGREE_LEVEL_LABELS[item.program.degreeLevel]} ·{" "}
                      {item.program.field}
                    </p>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    امتیاز تطبیق: {toPersianDigits(Math.round(item.score))}
                  </p>
                </div>
                <p className="mt-3 text-sm text-foreground">
                  شهریه سالانه:{" "}
                  {item.program.tuition === 0
                    ? "تقریباً رایگان / هزینه ترم"
                    : formatMoney(item.program.tuition, item.program.currency)}
                  {item.program.hasScholarship ? " · دارای بورسیه" : null}
                </p>
                {item.reasons.length > 0 ? (
                  <ul className="mt-3 list-inside list-disc text-sm text-muted-foreground">
                    {item.reasons.slice(0, 3).map((reason) => (
                      <li key={reason}>{reason}</li>
                    ))}
                  </ul>
                ) : null}
                <div className="mt-4">
                  <Button asChild variant="outline" size="sm">
                    <Link href={`/programs/${item.program.slug}`}>
                      مشاهده برنامه
                    </Link>
                  </Button>
                </div>
              </li>
            ))}
          </ul>
        )}

        <div className="mt-8 flex flex-wrap gap-3">
          <Button asChild size="lg">
            <Link href="/booking">رزرو مشاوره رایگان</Link>
          </Button>
          <Button asChild variant="outline" size="lg">
            <Link href="/assessment">ویرایش ارزیابی</Link>
          </Button>
        </div>
      </Section>
    </div>
  );
}
