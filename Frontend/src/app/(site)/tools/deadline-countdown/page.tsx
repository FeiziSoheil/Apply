import type { Metadata } from "next";
import dynamic from "next/dynamic";
import { Suspense } from "react";
import { AssessmentCta } from "@/components/shared/assessment-cta";
import { PageBreadcrumb } from "@/components/shared/page-breadcrumb";
import { PageHero } from "@/components/shared/page-hero";
import { Section } from "@/components/shared/section";
import { Skeleton } from "@/components/ui/skeleton";
import { createPageMetadata } from "@/lib/seo";
import { getPrograms } from "@/services/programs";

export const metadata: Metadata = createPageMetadata({
  title: "شمارش معکوس ددلاین",
  description:
    "زمان باقی‌مانده تا مهلت پذیرش برنامه‌های تحصیلی را به‌صورت زنده ببینید.",
  path: "/tools/deadline-countdown",
});

const DeadlineCountdown = dynamic(
  () =>
    import("@/components/tools/deadline-countdown").then(
      (m) => m.DeadlineCountdown,
    ),
  { loading: () => <Skeleton className="h-80 w-full" /> },
);

async function CountdownContent() {
  const result = await getPrograms({
    sort: "nearest_deadline",
    pageSize: 40,
    page: 1,
  });

  return <DeadlineCountdown programs={result.items} />;
}

export default function DeadlineCountdownPage() {
  return (
    <div className="flex flex-col gap-8 pb-12">
      <PageBreadcrumb
        items={[
          { label: "ابزارها", href: "/tools" },
          { label: "شمارش معکوس ددلاین" },
        ]}
      />

      <PageHero
        title="شمارش معکوس ددلاین"
        description="برنامه را انتخاب کنید و ببینید چقدر تا مهلت پذیرش باقی مانده"
        primaryCta={{ label: "رزرو مشاوره", href: "/booking" }}
        secondaryCta={{
          label: "ماشین‌حساب هزینه",
          href: "/tools/cost-calculator",
        }}
      />

      <Section padding="none">
        <Suspense fallback={<Skeleton className="h-80 w-full" />}>
          <CountdownContent />
        </Suspense>
      </Section>

      <AssessmentCta
        title="نمی‌دانید کدام ددلاین برای شماست؟"
        description="با ارزیابی رایگان، برنامه‌های مناسب و زمان‌بندی اقدام را مشخص کنید."
      />
    </div>
  );
}
