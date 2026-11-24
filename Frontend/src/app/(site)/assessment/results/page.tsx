import type { Metadata } from "next";
import { PageHeader } from "@/components/shared/page-header";
import { AssessmentResults } from "@/components/forms/assessment-results";
import { createPageMetadata } from "@/lib/seo";
import type { ProgramInfoMap } from "@/components/forms/assessment-results";
import { getCountries } from "@/services/countries";
import { getPrograms } from "@/services/programs";

export const metadata: Metadata = createPageMetadata({
  title: "نتیجه ارزیابی",
  description: "خلاصه پاسخ‌ها و پیشنهادهای اولیه بر اساس ارزیابی تحصیلی شما.",
  path: "/assessment/results",
  noIndex: true,
});

export default async function AssessmentResultsPage() {
  const [countries, programsPage] = await Promise.all([
    getCountries(),
    getPrograms({ pageSize: 100 }),
  ]);
  const countryBySlug = new Map(countries.map((country) => [country.slug, country]));
  const programs: ProgramInfoMap = Object.fromEntries(
    programsPage.items.map((program) => {
      const country = countryBySlug.get(program.countrySlug);
      return [
        program.id,
        {
          slug: program.slug,
          nameFa: program.nameFa,
          degreeLevel: program.degreeLevel,
          field: program.field,
          tuition: program.tuition,
          currency: program.currency,
          hasScholarship: program.hasScholarship,
          countryNameFa: program.countryNameFa,
          countryFlagEmoji: country?.flagEmoji,
        },
      ];
    }),
  );
  const countryNames = Object.fromEntries(
    countries.map((country) => [country.slug, country.nameFa]),
  );

  return (
    <>
      <PageHeader
        title="نتیجه ارزیابی"
        description="خلاصه پاسخ‌ها و پیشنهادهای اولیه بر اساس اطلاعات شما"
        breadcrumbs={[
          { label: "ارزیابی رایگان", href: "/assessment" },
          { label: "نتیجه" },
        ]}
      />
      <AssessmentResults countryNames={countryNames} programs={programs} />
    </>
  );
}
