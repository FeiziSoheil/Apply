import type { Metadata } from "next";
import { Suspense } from "react";
import { PageHeader } from "@/components/shared/page-header";
import { Section } from "@/components/shared/section";
import { AssessmentForm } from "@/components/forms/assessment-form";
import { Skeleton } from "@/components/ui/skeleton";
import { isDegreeLevel } from "@/lib/degree-levels";
import { createPageMetadata } from "@/lib/seo";
import { getCountries } from "@/services/countries";
import type { AssessmentFormValues } from "@/lib/validations/assessment";

export const metadata: Metadata = createPageMetadata({
  title: "ارزیابی رایگان",
  description:
    "در چند گام کوتاه شرایط تحصیلی‌تان را بررسی کنید و پیشنهاد اولیه مقصد و رشته دریافت کنید.",
  path: "/assessment",
});

type AssessmentPageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

function firstParam(
  value: string | string[] | undefined,
): string | undefined {
  if (Array.isArray(value)) return value[0];
  return value;
}

async function AssessmentContent({ searchParams }: AssessmentPageProps) {
  const params = await searchParams;
  const countries = await getCountries();

  const degreeLevel = firstParam(params.degreeLevel);
  const country = firstParam(params.country);
  const phone = firstParam(params.phone);
  const field = firstParam(params.field);
  const program = firstParam(params.program);

  const initialValues: Partial<AssessmentFormValues> = {};
  if (degreeLevel && isDegreeLevel(degreeLevel)) {
    initialValues.targetDegree = degreeLevel;
  }
  if (country) {
    initialValues.targetCountries = [country];
  }
  if (phone) {
    initialValues.mobile = phone;
  }
  if (field) {
    initialValues.fieldOfStudy = field;
  } else if (program) {
    initialValues.fieldOfStudy = program;
  }

  return (
    <Section className="pt-0">
      <AssessmentForm
        countries={countries.map((c) => ({
          slug: c.slug,
          nameFa: c.nameFa,
          flagEmoji: c.flagEmoji,
        }))}
        initialValues={initialValues}
      />
    </Section>
  );
}

export default function AssessmentPage({ searchParams }: AssessmentPageProps) {
  return (
    <>
      <PageHeader
        title="ارزیابی رایگان"
        description="در چند گام کوتاه شرایط تحصیلی‌تان را بررسی می‌کنیم و پیشنهاد اولیه مقصد و رشته می‌دهیم."
        breadcrumbs={[{ label: "ارزیابی رایگان" }]}
      />
      <Suspense fallback={<Skeleton className="mx-auto h-96 w-full max-w-2xl" />}>
        <AssessmentContent searchParams={searchParams} />
      </Suspense>
    </>
  );
}
