import type { Metadata } from "next";
import { createPageMetadata } from "@/lib/seo";
import { PricingComparison } from "@/components/pricing/pricing-comparison";
import { PricingHow } from "@/components/pricing/pricing-how";
import { PricingPlans } from "@/components/pricing/pricing-plans";
import { PricingTrust } from "@/components/pricing/pricing-trust";
import { SampleContract } from "@/components/pricing/sample-contract";
import { AssessmentCta } from "@/components/shared/assessment-cta";
import { PageBreadcrumb } from "@/components/shared/page-breadcrumb";
import { PageHero } from "@/components/shared/page-hero";
import { Section } from "@/components/shared/section";
import { getPricingContent } from "@/services/pricing";

export const metadata: Metadata = createPageMetadata({
  title: "تعرفه‌ها",
  description:
    "شفافیت هزینه خدمات مشاوره تحصیلی؛ بسته‌های پایه، کامل و ویژه با مقایسه ویژگی‌ها.",
  path: "/pricing",
});

export default async function PricingPage() {
  const content = await getPricingContent();

  return (
    <div className="flex flex-col gap-8 pb-12">
      <PageBreadcrumb
        items={[{ label: "تعرفه‌ها" }]}
      />

      <PageHero
        title="تعرفه‌ها"
        description="هزینه خدمت بر اساس کشور، مقطع و دامنه همراهی محاسبه می‌شود — بدون وعده پنهان"
        primaryCta={{ label: "رزرو مشاوره", href: "/booking" }}
        secondaryCta={{ label: "سوالات تعرفه", href: "/faq" }}
      />

      <Section title="چگونه قیمت محاسبه می‌شود؟"
        subtitle="سه عامل اصلی که تعرفه نهایی را شکل می‌دهد"
        padding="none">
        <PricingHow items={content.howCalculated} />
      </Section>

      <Section title="بسته‌های خدمت"
        subtitle="مبالغ به‌صورت «شروع از» اعلام شده و پس از ارزیابی پرونده دقیق می‌شود"
        padding="none">
        <PricingPlans plans={content.plans} />
      </Section>

      <Section title="مقایسه بسته‌ها"
        subtitle="ببینید هر بسته چه سطحی از همراهی را پوشش می‌دهد"
        padding="none">
        <PricingComparison plans={content.plans} rows={content.comparison} />
      </Section>

      <Section padding="none">
        <PricingTrust
          neverCharge={content.neverCharge}
          guarantees={content.guarantees}
        />
      </Section>

      <Section title="قرارداد"
        padding="none">
        <SampleContract />
      </Section>

      <AssessmentCta
        title="قبل از پرداخت، مسیر را روشن کنید"
        description="با جلسه مشاوره، بسته مناسب و برآورد هزینه شفاف دریافت می‌کنید."
      />
    </div>
  );
}
