import type { Metadata } from "next";
import { createPageMetadata } from "@/lib/seo";
import { ToolsHub } from "@/components/tools/tools-hub";
import { AssessmentCta } from "@/components/shared/assessment-cta";
import { PageBreadcrumb } from "@/components/shared/page-breadcrumb";
import { PageHero } from "@/components/shared/page-hero";
import { Section } from "@/components/shared/section";

export const metadata: Metadata = createPageMetadata({
  title: "ابزارها",
  description:
    "ماشین‌حساب هزینه تحصیل و شمارش معکوس ددلاین پذیرش برای برنامه‌ریزی بهتر.",
  path: "/tools",
});

export default function ToolsPage() {
  return (
    <div className="flex flex-col gap-8 pb-12">
      <PageBreadcrumb
        items={[{ label: "ابزارها" }]}
      />

      <PageHero
        title="ابزارهای اِپلای"
        description="برآورد هزینه و پیگیری مهلت پذیرش در چند کلیک"
        primaryCta={{
          label: "ماشین‌حساب هزینه",
          href: "/tools/cost-calculator",
        }}
        secondaryCta={{
          label: "شمارش معکوس ددلاین",
          href: "/tools/deadline-countdown",
        }}
      />

      <Section padding="none">
        <ToolsHub />
      </Section>

      <AssessmentCta />
    </div>
  );
}
