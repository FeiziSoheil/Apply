import type { Metadata } from "next";
import dynamic from "next/dynamic";
import { Suspense } from "react";
import { AssessmentCta } from "@/components/shared/assessment-cta";
import { PageBreadcrumb } from "@/components/shared/page-breadcrumb";
import { PageHero } from "@/components/shared/page-hero";
import { Section } from "@/components/shared/section";
import { Skeleton } from "@/components/ui/skeleton";
import { createPageMetadata } from "@/lib/seo";
import { getCostCalculatorCountries } from "@/services/cost-calculator";

export const metadata: Metadata = createPageMetadata({
  title: "ماشین‌حساب هزینه تحصیل",
  description:
    "برآورد شهریه، هزینه زندگی، بیمه و ویزا به تومان و ارز مقصد بر اساس کشور و سبک زندگی.",
  path: "/tools/cost-calculator",
});

const CostCalculator = dynamic(
  () =>
    import("@/components/tools/cost-calculator").then((m) => m.CostCalculator),
  { loading: () => <Skeleton className="h-96 w-full" /> },
);

async function CalculatorContent() {
  const countries = await getCostCalculatorCountries();
  return <CostCalculator countries={countries} />;
}

export default function CostCalculatorPage() {
  return (
    <div className="flex flex-col gap-8 pb-12">
      <PageBreadcrumb
        items={[
          { label: "ابزارها", href: "/tools" },
          { label: "ماشین‌حساب هزینه" },
        ]}
      />

      <PageHero
        title="ماشین‌حساب هزینه تحصیل"
        description="شهریه، زندگی، بیمه و ویزا را سریع برآورد کنید و برنامه دقیق بگیرید"
        primaryCta={{ label: "دریافت برنامه دقیق", href: "/assessment" }}
        secondaryCta={{
          label: "شمارش معکوس ددلاین",
          href: "/tools/deadline-countdown",
        }}
      />

      <Section padding="none">
        <Suspense fallback={<Skeleton className="h-96 w-full" />}>
          <CalculatorContent />
        </Suspense>
      </Section>

      <AssessmentCta
        title="نیاز به برآورد دقیق‌تر دارید؟"
        description="با ارزیابی رایگان یا رزرو مشاوره، بودجه و مسیر را دقیق‌تر تنظیم می‌کنیم."
        primaryLabel="دریافت برنامه دقیق"
      />
    </div>
  );
}
