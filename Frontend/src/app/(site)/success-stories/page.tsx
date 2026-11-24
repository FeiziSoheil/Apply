import type { Metadata } from "next";
import { createPageMetadata } from "@/lib/seo";
import { Suspense } from "react";
import { AssessmentCta } from "@/components/shared/assessment-cta";
import { PageBreadcrumb } from "@/components/shared/page-breadcrumb";
import { PageHero } from "@/components/shared/page-hero";
import { Section } from "@/components/shared/section";
import { SuccessStoriesBrowser } from "@/components/success-stories/success-stories-browser";
import { Skeleton } from "@/components/ui/skeleton";
import { getSuccessStories } from "@/services/success-stories";

export const metadata: Metadata = createPageMetadata({
  title: "داستان‌های موفقیت",
  description:
    "تجربه دانشجویان ایرانی که مسیر پذیرش و ویزای تحصیلی را با اِپلای طی کردند.",
  path: "/success-stories",
});

async function StoriesContent() {
  const stories = await getSuccessStories();

  return (
    <Section padding="none">
      <SuccessStoriesBrowser stories={stories} />
    </Section>
  );
}

export default function SuccessStoriesPage() {
  return (
    <div className="flex flex-col gap-8 pb-12">
      <PageBreadcrumb
        items={[{ label: "داستان‌های موفقیت" }]}
      />

      <PageHero
        title="داستان‌های موفقیت"
        description="از زبان کسانی که مسیر اعزام را مرحله‌به‌مرحله طی کردند"
        primaryCta={{ label: "شروع ارزیابی", href: "/assessment" }}
        secondaryCta={{ label: "رزرو مشاوره", href: "/booking" }}
      />

      <Suspense fallback={<Skeleton className="h-80 w-full" />}>
        <StoriesContent />
      </Suspense>

      <AssessmentCta
        title="داستان بعدی می‌تواند مال شما باشد"
        description="با ارزیابی رایگان، نقطه شروع مناسب مسیر تحصیل خارج را پیدا کنید."
      />
    </div>
  );
}
