import type { Metadata } from "next";
import { createPageMetadata } from "@/lib/seo";
import { Suspense } from "react";
import { AssessmentCta } from "@/components/shared/assessment-cta";
import { PageBreadcrumb } from "@/components/shared/page-breadcrumb";
import { PageHero } from "@/components/shared/page-hero";
import { Section } from "@/components/shared/section";
import { ConsultantGrid } from "@/components/team/consultant-grid";
import { Skeleton } from "@/components/ui/skeleton";
import { getConsultants } from "@/services/consultants";
import { getCountries } from "@/services/countries";

export const metadata: Metadata = createPageMetadata({
  title: "تیم مشاوران",
  description:
    "آشنایی با مشاوران پذیرش، ویزا و زبان اِپلای و رزرو وقت با مشاور تخصصی.",
  path: "/team",
});

async function TeamContent() {
  const [consultants, countries] = await Promise.all([
    getConsultants(),
    getCountries(),
  ]);

  return (
    <Section title="مشاوران تخصصی"
      subtitle="برای هر مقصد، مشاوری که همان مسیر را می‌شناسد"
      padding="none">
      <ConsultantGrid consultants={consultants} countries={countries} />
    </Section>
  );
}

export default function TeamPage() {
  return (
    <div className="flex flex-col gap-8 pb-12">
      <PageBreadcrumb
        items={[{ label: "تیم مشاوران" }]}
      />

      <PageHero
        title="تیم مشاوران"
        description="کارشناسان پذیرش، ویزا و آمادگی زبان؛ آماده رزرو وقت اختصاصی"
        primaryCta={{ label: "رزرو مشاوره", href: "/booking" }}
        secondaryCta={{ label: "ارزیابی رایگان", href: "/assessment" }}
      />

      <Suspense
        fallback={
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-72 w-full" />
            ))}
          </div>
        }
      >
        <TeamContent />
      </Suspense>

      <AssessmentCta />
    </div>
  );
}
