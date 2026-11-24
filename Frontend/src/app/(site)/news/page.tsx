import type { Metadata } from "next";
import { createPageMetadata } from "@/lib/seo";
import { Suspense } from "react";
import { NewsBrowser } from "@/components/news/news-browser";
import { AssessmentCta } from "@/components/shared/assessment-cta";
import { PageBreadcrumb } from "@/components/shared/page-breadcrumb";
import { PageHero } from "@/components/shared/page-hero";
import { Section } from "@/components/shared/section";
import { Skeleton } from "@/components/ui/skeleton";
import { getNews, getNewsEventTypes } from "@/services/news";

export const metadata: Metadata = createPageMetadata({
  title: "اخبار و رویدادها",
  description:
    "آخرین اخبار مهلت پذیرش، تغییرات ویزا، وبینارها و نمایشگاه‌های تحصیل در خارج.",
  path: "/news",
});

async function NewsContent() {
  const [items, eventTypes] = await Promise.all([
    getNews(),
    getNewsEventTypes(),
  ]);

  return <NewsBrowser items={items} eventTypes={eventTypes} />;
}

export default function NewsPage() {
  return (
    <div className="flex flex-col gap-8 pb-12">
      <PageBreadcrumb
        items={[{ label: "اخبار" }]}
      />

      <PageHero
        title="اخبار و رویدادها"
        description="مهلت‌های پذیرش، تغییرات ویزا، وبینارها و نمایشگاه‌ها"
        primaryCta={{ label: "مشاهده وبلاگ", href: "/blog" }}
        secondaryCta={{ label: "رزرو مشاوره", href: "/booking" }}
      />

      <Section padding="none">
        <Suspense fallback={<Skeleton className="h-80 w-full" />}>
          <NewsContent />
        </Suspense>
      </Section>

      <AssessmentCta
        title="می‌خواهید از مهلت‌ها عقب نمانید؟"
        description="با ارزیابی رایگان، برنامه زمانی مناسب مسیرتان را مشخص کنید."
      />
    </div>
  );
}
