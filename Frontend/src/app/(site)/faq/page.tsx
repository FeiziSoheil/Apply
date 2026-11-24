import type { Metadata } from "next";
import { Suspense } from "react";
import { FaqBrowser } from "@/components/faq/faq-browser";
import { AssessmentCta } from "@/components/shared/assessment-cta";
import { JsonLd } from "@/components/shared/json-ld";
import { PageBreadcrumb } from "@/components/shared/page-breadcrumb";
import { PageHero } from "@/components/shared/page-hero";
import { Section } from "@/components/shared/section";
import { Skeleton } from "@/components/ui/skeleton";
import { buildFaqPageJsonLd, createPageMetadata } from "@/lib/seo";
import { getFaqCategories, getFaqs } from "@/services/faq";

export const metadata: Metadata = createPageMetadata({
  title: "سوالات متداول",
  description:
    "پاسخ به پرسش‌های رایج درباره پذیرش، ویزا، تعرفه، زبان و مدارک تحصیل در خارج.",
  path: "/faq",
});

async function FaqContent() {
  const [faqs, categories] = await Promise.all([
    getFaqs(),
    getFaqCategories(),
  ]);

  const jsonLd = buildFaqPageJsonLd(faqs);

  return (
    <Section padding="none">
      <JsonLd data={jsonLd} />
      <FaqBrowser faqs={faqs} categories={categories} />
    </Section>
  );
}

export default function FaqPage() {
  return (
    <div className="flex flex-col gap-8 pb-12">
      <PageBreadcrumb
        items={[{ label: "سوالات متداول" }]}
      />

      <PageHero
        title="سوالات متداول"
        description="پاسخ‌های شفاف به رایج‌ترین پرسش‌های مسیر اعزام"
        primaryCta={{ label: "تماس با ما", href: "/contact" }}
        secondaryCta={{ label: "رزرو مشاوره", href: "/booking" }}
      />

      <Suspense fallback={<Skeleton className="h-80 w-full" />}>
        <FaqContent />
      </Suspense>

      <AssessmentCta
        title="جواب سوالتان را پیدا نکردید؟"
        description="با ما تماس بگیرید یا وقت مشاوره رزرو کنید تا مسیرتان را با هم بررسی کنیم."
        primaryHref="/contact"
        primaryLabel="تماس با ما"
      />
    </div>
  );
}
