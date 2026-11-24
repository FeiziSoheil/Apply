import type { Metadata } from "next";
import { createPageMetadata } from "@/lib/seo";
import { AboutGallery } from "@/components/about/about-gallery";
import { AboutLicenses } from "@/components/about/about-licenses";
import { AboutStats } from "@/components/about/about-stats";
import { AboutTimeline } from "@/components/about/about-timeline";
import { AboutValues } from "@/components/about/about-values";
import { AssessmentCta } from "@/components/shared/assessment-cta";
import { PageBreadcrumb } from "@/components/shared/page-breadcrumb";
import { PageHero } from "@/components/shared/page-hero";
import { Section } from "@/components/shared/section";
import { INSTITUTE } from "@/lib/constants";
import { getAboutContent } from "@/services/about";

export const metadata: Metadata = createPageMetadata({
  title: "درباره ما",
  description: `آشنایی با ${INSTITUTE.name}؛ ماموریت، ارزش‌ها، مسیر رشد و اعتماد مؤسسه مشاوره تحصیلی.`,
  path: "/about",
});

export default async function AboutPage() {
  const about = await getAboutContent();

  return (
    <div className="flex flex-col gap-8 pb-12">
      <PageBreadcrumb
        items={[{ label: "درباره ما" }]}
      />

      <PageHero
        title="درباره اِپلای"
        description={INSTITUTE.tagline}
        primaryCta={{ label: "رزرو مشاوره", href: "/booking" }}
        secondaryCta={{ label: "تیم مشاوران", href: "/team" }}
      />

      <Section title={about.story.title}
        padding="none">
        <div className="max-w-3xl space-y-4 text-muted-foreground leading-7">
          {about.story.paragraphs.map((paragraph, index) => (
            <p key={index}>{paragraph}</p>
          ))}
        </div>
      </Section>

      <Section title={about.mission.title}
        subtitle={about.mission.description}
        padding="none">
        <AboutStats stats={about.stats} />
      </Section>

      <Section title="ارزش‌های ما"
        subtitle="اصولی که تصمیم‌های روزمره مشاوره را شکل می‌دهد"
        padding="none">
        <AboutValues values={about.values} />
      </Section>

      <Section title="مسیر رشد مؤسسه"
        subtitle="نگاهی کوتاه به نقاط عطف اِپلای"
        padding="none">
        <AboutTimeline items={about.timeline} />
      </Section>

      <Section title="مجوزها و اعتماد"
        subtitle="نشان‌ها و تعهدات رسمی (نسخه نمایشی)"
        padding="none">
        <AboutLicenses licenses={about.licenses} />
      </Section>

      <Section title="فضای دفتر"
        subtitle="تصاویر نمونه از محیط کار و جلسات مشاوره"
        padding="none">
        <AboutGallery images={about.gallery} />
      </Section>

      <AssessmentCta
        title="آماده‌اید مسیر تحصیل را شفاف شروع کنید؟"
        description="با ارزیابی رایگان یا رزرو مشاوره، اولین گام را محکم بردارید."
      />
    </div>
  );
}
