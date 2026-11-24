import type { Metadata } from "next";
import dynamic from "next/dynamic";
import { HomeHero } from "@/components/home/hero";
import { StatsBar } from "@/components/home/stats-bar";
import { ServicesSection } from "@/components/home/services-section";
import { ProcessSteps } from "@/components/home/process-steps";
import { WhyUs } from "@/components/home/why-us";
import { LatestArticles } from "@/components/home/latest-articles";
import { FinalCta } from "@/components/home/final-cta";
import { Skeleton } from "@/components/ui/skeleton";
import { INSTITUTE } from "@/lib/constants";
import { createPageMetadata } from "@/lib/seo";
import {
  getBlogPosts,
  getConsultants,
  getCountries,
  getFaqs,
  getPrograms,
  getServices,
  getSuccessStories,
} from "@/services";

export const metadata: Metadata = createPageMetadata({
  title: INSTITUTE.name,
  description: `${INSTITUTE.tagline}. مشاوره تحصیلی، پذیرش دانشگاه، ویزا و همراهی تا شروع تحصیل.`,
  path: "/",
  absoluteTitle: true,
  keywords: [
    "اعزام دانشجو",
    "تحصیل در خارج",
    "مشاوره تحصیلی",
    "پذیرش دانشگاه",
    "ویزای تحصیلی",
  ],
});

const sectionFallback = (
  <div className="py-12" aria-hidden>
    <Skeleton className="mx-auto h-48 w-full max-w-5xl rounded-2xl" />
  </div>
);

/** Below-fold / carousel-heavy sections — code-split without dropping SSR */
const PopularCountries = dynamic(
  () =>
    import("@/components/home/popular-countries").then((m) => m.PopularCountries),
  { loading: () => sectionFallback },
);
const QuickSearch = dynamic(
  () => import("@/components/home/quick-search").then((m) => m.QuickSearch),
  { loading: () => sectionFallback },
);
const SuccessStoriesSection = dynamic(
  () =>
    import("@/components/home/success-stories").then(
      (m) => m.SuccessStoriesSection,
    ),
  { loading: () => sectionFallback },
);
const ConsultantsSection = dynamic(
  () =>
    import("@/components/home/consultants-section").then(
      (m) => m.ConsultantsSection,
    ),
  { loading: () => sectionFallback },
);
const FaqSection = dynamic(
  () => import("@/components/home/faq-section").then((m) => m.FaqSection),
  { loading: () => sectionFallback },
);

export default async function HomePage() {
  const [
    countries,
    services,
    stories,
    consultants,
    blogResult,
    faqs,
    programsResult,
  ] = await Promise.all([
    getCountries(),
    getServices(),
    getSuccessStories(),
    getConsultants(),
    getBlogPosts({ pageSize: 3 }),
    getFaqs(),
    getPrograms(),
  ]);

  const countryOptions = countries.map((c) => ({
    slug: c.slug,
    nameFa: c.nameFa,
    flagEmoji: c.flagEmoji,
  }));

  const fields = [
    ...new Set(programsResult.items.map((p) => p.field)),
  ].sort((a, b) => a.localeCompare(b, "fa"));

  return (
    <>
      <HomeHero countries={countryOptions} />
      <StatsBar />
      <PopularCountries countries={countries} />
      <ServicesSection services={services} />
      <ProcessSteps />
      <QuickSearch countries={countryOptions} fields={fields} />
      <WhyUs />
      <SuccessStoriesSection stories={stories} />
      <ConsultantsSection
        consultants={consultants.slice(0, 3)}
        countries={countries}
      />
      <LatestArticles posts={blogResult.items} />
      <FaqSection faqs={faqs.slice(0, 5)} />
      <FinalCta />
    </>
  );
}
