import type { Metadata } from "next";
import { createPageMetadata } from "@/lib/seo";
import { ProcessTimeline } from "@/components/process/process-timeline";
import { AssessmentCta } from "@/components/shared/assessment-cta";
import { PageBreadcrumb } from "@/components/shared/page-breadcrumb";
import { PageHero } from "@/components/shared/page-hero";
import { Section } from "@/components/shared/section";
import { getProcessSteps } from "@/services/process";

export const metadata: Metadata = createPageMetadata({
  title: "فرآیند اعزام",
  description:
    "مراحل همکاری از مشاوره و انتخاب دانشگاه تا اپلای، ویزا و آمادگی سفر.",
  path: "/process",
});

export default async function ProcessPage() {
  const steps = await getProcessSteps();

  return (
    <div className="flex flex-col gap-8 pb-12">
      <PageBreadcrumb
        items={[{ label: "فرآیند اعزام" }]}
      />

      <PageHero
        title="فرآیند اعزام"
        description="شش گام مشخص از اولین مشاوره تا استقرار در مقصد"
        primaryCta={{ label: "شروع ارزیابی", href: "/assessment" }}
        secondaryCta={{ label: "رزرو مشاوره", href: "/booking" }}
      />

      <Section title="مراحل همکاری"
        subtitle="برای هر گام، زمان تقریبی و مدارک مورد نیاز مشخص شده است"
        padding="none">
        <ProcessTimeline steps={steps} />
      </Section>

      <AssessmentCta
        title="می‌خواهید بدانید در کدام گام هستید؟"
        description="با ارزیابی رایگان، نقطه شروع مناسب مسیرتان مشخص می‌شود."
      />
    </div>
  );
}
