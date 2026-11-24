import Link from "next/link";
import { ProgramCard } from "@/components/programs/program-card";
import { CostTable } from "@/components/shared/cost-table";
import { Section } from "@/components/shared/section";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DEGREE_LEVEL_LABELS } from "@/lib/degree-levels";
import { formatJalaliDate, formatNumber } from "@/lib/format";
import { formatMoney, getCurrencyLabel } from "@/lib/currency";
import { formatTuition } from "@/lib/format-tuition";
import type { ProgramListItem } from "@/services/programs";
import type { Country, Program, University } from "@/types";

export const PROGRAM_SECTION_NAV = [
  { id: "overview", label: "معرفی" },
  { id: "requirements", label: "شرایط پذیرش" },
  { id: "cost", label: "هزینه" },
  { id: "university", label: "دانشگاه" },
  { id: "similar", label: "برنامه‌های مشابه" },
] as const;

type ProgramDetailSectionsProps = {
  program: Program;
  university: University | null;
  country: Country | null;
  similar: ProgramListItem[];
};

export function ProgramDetailSections({
  program,
  university,
  country,
  similar,
}: ProgramDetailSectionsProps) {
  return (
    <div className="flex flex-col gap-8">
      <Section
        contained={false}
        id="overview"
        padding="none"
        title="معرفی برنامه"
      >
        <div className="flex flex-wrap gap-2">
          <Badge variant="secondary">
            {DEGREE_LEVEL_LABELS[program.degreeLevel]}
          </Badge>
          <Badge variant="outline">{program.field}</Badge>
          {program.hasScholarship ? (
            <Badge>امکان بورسیه</Badge>
          ) : null}
        </div>
        <dl className="mt-4 grid gap-3 text-sm sm:grid-cols-2">
          <div className="flex flex-col gap-1 rounded-lg border border-border p-3">
            <dt className="text-muted-foreground">مدت تحصیل</dt>
            <dd className="font-medium text-foreground">{program.duration}</dd>
          </div>
          <div className="flex flex-col gap-1 rounded-lg border border-border p-3">
            <dt className="text-muted-foreground">مهلت درخواست</dt>
            <dd className="font-medium text-foreground">
              {formatJalaliDate(program.deadline)}
            </dd>
          </div>
          <div className="flex flex-col gap-1 rounded-lg border border-border p-3 sm:col-span-2">
            <dt className="text-muted-foreground">زمان‌های پذیرش</dt>
            <dd className="font-medium text-foreground">
              {program.intakes.join("، ")}
            </dd>
          </div>
        </dl>
      </Section>

      <Section
        contained={false}
        id="requirements"
        padding="none"
        title="شرایط پذیرش"
      >
        <ul className="list-disc space-y-2 pe-5 text-muted-foreground">
          <li>
            مدرک زبان:{" "}
            <span className="font-medium text-foreground">
              {program.languageRequirement}
            </span>
          </li>
          <li>
            حداقل معدل:{" "}
            <span className="font-medium text-foreground">
              {formatNumber(program.minGpa)} از ۴
            </span>
          </li>
          {university?.requirements.map((req) => (
            <li key={req}>{req}</li>
          ))}
        </ul>
      </Section>

      <Section
        contained={false}
        id="cost"
        padding="none"
        title="هزینه تقریبی"
      >
        <CostTable
          items={[
            {
              id: "tuition",
              label: "شهریه سالانه",
              amount: formatTuition(program.tuition, program.currency),
              note:
                program.tuition === 0
                  ? "در بسیاری از دانشگاه‌های دولتی آلمان شهریه ناچیز است"
                  : `مبلغ تقریبی به ${getCurrencyLabel(program.currency)}`,
            },
            ...(country
              ? [
                  {
                    id: "living",
                    label: "هزینه زندگی ماهانه",
                    amount: `حدود ${formatMoney(country.costOfLiving, country.currency)}`,
                    note: `برآورد برای ${country.nameFa}`,
                  },
                ]
              : []),
          ]}
        />
      </Section>

      <Section
        contained={false}
        id="university"
        padding="none"
        title="دانشگاه ارائه‌دهنده"
      >
        {university ? (
          <div className="rounded-xl border border-border p-5">
            <h3 className="text-lg font-semibold text-foreground">
              {university.nameFa}
            </h3>
            <p className="mt-1 text-sm text-muted-foreground">
              {university.nameEn} · {university.city}
              {country ? `، ${country.nameFa}` : null}
            </p>
            <p className="mt-3 text-muted-foreground">{university.summary}</p>
            <Button asChild variant="outline" size="sm" className="mt-4">
              <Link href={`/universities/${university.slug}`}>
                صفحه دانشگاه
              </Link>
            </Button>
          </div>
        ) : (
          <p className="text-muted-foreground">اطلاعات دانشگاه در دسترس نیست.</p>
        )}
      </Section>

      <Section
        contained={false}
        id="similar"
        padding="none"
        title="برنامه‌های مشابه"
        subtitle="بر اساس رشته، مقطع و مقصد پیشنهاد شده‌اند.">
        {similar.length === 0 ? (
          <p className="text-muted-foreground">برنامه مشابهی یافت نشد.</p>
        ) : (
          <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {similar.map((item) => (
              <li key={item.id}>
                <ProgramCard program={item} />
              </li>
            ))}
          </ul>
        )}
      </Section>
    </div>
  );
}

export function programConsultationHref(
  program: Program,
  target: "booking" | "assessment",
): string {
  const params = new URLSearchParams();
  params.set("program", program.nameFa);
  params.set("programSlug", program.slug);
  if (target === "assessment") {
    params.set("degreeLevel", program.degreeLevel);
    params.set("country", program.countrySlug);
    params.set("field", program.field);
  }
  return `/${target}?${params.toString()}`;
}
