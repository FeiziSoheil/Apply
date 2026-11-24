import { SectionsView } from "@/components/shared/richcontent/sections-view";
import { sectionsNav } from "@/components/shared/richcontent/sections-nav";
import { ProgramCard } from "@/components/programs/program-card";
import { Section } from "@/components/shared/section";
import { formatJalaliDate, formatNumber } from "@/lib/format";
import { formatTuition } from "@/lib/format-tuition";
import type { ProgramListItem } from "@/services/programs";
import type { Country, University } from "@/types";

export function getUniversitySectionNav(university: University) {
  return [
    ...sectionsNav(university.sections),
    { id: "facts", label: "اطلاعات کلیدی" },
    { id: "programs", label: "برنامه‌ها" },
    { id: "deadlines", label: "مهلت‌ها" },
    { id: "requirements", label: "شرایط" },
  ] as const;
}

export const UNIVERSITY_SECTION_NAV = [
  { id: "intro", label: "معرفی" },
  { id: "programs", label: "برنامه‌ها" },
  { id: "deadlines", label: "مهلت‌ها" },
  { id: "requirements", label: "شرایط" },
] as const;

type UniversityDetailSectionsProps = {
  university: University;
  country: Country | null;
  programs: ProgramListItem[];
};

export function UniversityDetailSections({
  university,
  country,
  programs,
}: UniversityDetailSectionsProps) {
  return (
    <div className="flex flex-col gap-8">
      <SectionsView sections={university.sections} />

      <Section
        contained={false}
        id="facts"
        padding="none"
        title="اطلاعات کلیدی"
      >
        <dl className="mt-4 grid gap-3 text-sm sm:grid-cols-2">
          <div className="rounded-lg border border-border p-3">
            <dt className="text-muted-foreground">شهر</dt>
            <dd className="mt-1 font-medium text-foreground">
              {university.city}
              {country ? `، ${country.nameFa}` : null}
            </dd>
          </div>
          <div className="rounded-lg border border-border p-3">
            <dt className="text-muted-foreground">رتبه جهانی تقریبی</dt>
            <dd className="mt-1 font-medium text-foreground">
              {formatNumber(university.ranking)}
            </dd>
          </div>
          <div className="rounded-lg border border-border p-3">
            <dt className="text-muted-foreground">شهریه تقریبی سالانه</dt>
            <dd className="mt-1 font-medium text-foreground">
              {formatTuition(university.tuitionPerYear, university.currency)}
            </dd>
          </div>
          <div className="rounded-lg border border-border p-3">
            <dt className="text-muted-foreground">تعداد برنامه ثبت‌شده</dt>
            <dd className="mt-1 font-medium text-foreground">
              {formatNumber(programs.length)}
            </dd>
          </div>
        </dl>
      </Section>

      <Section
        contained={false}
        id="programs"
        padding="none"
        title="برنامه‌های این دانشگاه"
        subtitle="از میان برنامه‌های موجود انتخاب کنید یا برای مشاوره اقدام کنید.">
        {programs.length === 0 ? (
          <p className="text-muted-foreground">
            هنوز برنامه‌ای برای این دانشگاه ثبت نشده است.
          </p>
        ) : (
          <ul className="grid gap-4 sm:grid-cols-2">
            {programs.map((program) => (
              <li key={program.id}>
                <ProgramCard program={program} />
              </li>
            ))}
          </ul>
        )}
      </Section>

      <Section
        contained={false}
        id="deadlines"
        padding="none"
        title="مهلت‌های پذیرش"
      >
        {university.deadlines.length === 0 ? (
          <p className="text-muted-foreground">مهلتی ثبت نشده است.</p>
        ) : (
          <ul className="flex flex-col gap-2">
            {university.deadlines.map((deadline) => (
              <li
                key={`${deadline.label}-${deadline.date}`}
                className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-border px-4 py-3 text-sm"
              >
                <span className="font-medium text-foreground">
                  {deadline.label}
                </span>
                <span className="text-muted-foreground">
                  {formatJalaliDate(deadline.date)}
                </span>
              </li>
            ))}
          </ul>
        )}
      </Section>

      <Section
        contained={false}
        id="requirements"
        padding="none"
        title="شرایط کلی پذیرش"
      >
        <ul className="list-disc space-y-2 pe-5 text-muted-foreground">
          {university.requirements.map((req) => (
            <li key={req}>{req}</li>
          ))}
        </ul>
      </Section>
    </div>
  );
}
