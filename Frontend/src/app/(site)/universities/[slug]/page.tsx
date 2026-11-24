import type { Metadata } from "next";
import { Suspense } from "react";
import { notFound } from "next/navigation";
import {
  getUniversitySectionNav,
  UniversityDetailSections,
} from "@/components/universities/university-detail-sections";
import { AssessmentCta } from "@/components/shared/assessment-cta";
import { JsonLd } from "@/components/shared/json-ld";
import { Container } from "@/components/shared/container";
import { PageBreadcrumb } from "@/components/shared/page-breadcrumb";
import { PageHero } from "@/components/shared/page-hero";
import {
  RelatedContent,
  blogPostsToRelated,
} from "@/components/shared/related-content";
import { SectionNav } from "@/components/shared/section-nav";
import { StickySummary } from "@/components/shared/sticky-summary";
import { Skeleton } from "@/components/ui/skeleton";
import { formatJalaliDate, formatNumber } from "@/lib/format";
import { formatTuition } from "@/lib/format-tuition";
import {
  buildEducationalOrganizationJsonLd,
  buildFaqPageJsonLd,
  createPageMetadata,
} from "@/lib/seo";
import {
  extractFaqsFromSections,
  resolveMetaDescription,
  resolveOgImage,
} from "@/lib/seo-content";
import { getBlogPosts } from "@/services/blog";
import { getCountryBySlug } from "@/services/countries";
import { getPrograms } from "@/services/programs";
import {
  getUniversities,
  getUniversityBySlug,
} from "@/services/universities";

type PageProps = {
  params: Promise<{ slug: string }>;
};

export async function generateStaticParams() {
  const { items } = await getUniversities();
  return items.map((u) => ({ slug: u.slug }));
}

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const university = await getUniversityBySlug(slug);

  if (!university) {
    return createPageMetadata({
      title: "دانشگاه یافت نشد",
      description: "دانشگاه مورد نظر یافت نشد.",
      path: `/universities/${slug}`,
      noIndex: true,
    });
  }

  const description = resolveMetaDescription({
    seo: university.seo,
    fallbacks: [
      university.summary,
      ...university.sections.filter((s) => s.visible).map((s) => s.content),
    ],
  });

  return createPageMetadata({
    title: university.seo?.metaTitle ?? university.nameFa,
    description: description || university.summary,
    path: `/universities/${university.slug}`,
    image: resolveOgImage(university.seo, university.heroImage),
    noIndex: university.seo?.noindex,
  });
}

async function UniversityContent({ params }: PageProps) {
  const { slug } = await params;
  const university = await getUniversityBySlug(slug);

  if (!university) {
    notFound();
  }

  const [country, programsResult, relatedPosts] = await Promise.all([
    getCountryBySlug(university.countrySlug),
    getPrograms({ university: slug, pageSize: 24 }),
    getBlogPosts({ search: university.nameFa, pageSize: 3 }),
  ]);

  const nearestDeadline = university.deadlines
    .map((d) => d.date)
    .sort()[0];

  const bookingHref = `/booking?university=${encodeURIComponent(university.nameFa)}&universitySlug=${university.slug}`;
  const assessmentHref = `/assessment?country=${university.countrySlug}`;
  const eduOrgJsonLd = buildEducationalOrganizationJsonLd(university, {
    countryNameFa: country?.nameFa,
  });
  const accordionFaqs = extractFaqsFromSections(university.sections);
  const faqJsonLd =
    accordionFaqs.length > 0
      ? buildFaqPageJsonLd(
          accordionFaqs.map((faq, index) => ({
            id: `uni-faq-${index}`,
            question: faq.question,
            answer: faq.answer,
          })),
        )
      : null;
  const sectionNav = getUniversitySectionNav(university).map((item) => ({
    id: item.id,
    label: item.label,
  }));

  return (
    <div className="flex flex-col gap-8 pb-12">
      <JsonLd data={eduOrgJsonLd} />
      {faqJsonLd ? <JsonLd data={faqJsonLd} /> : null}
      <PageBreadcrumb
        items={[
          { label: "دانشگاه‌ها", href: "/universities" },
          { label: university.nameFa },
        ]}
      />

      <PageHero
        eyebrow={
          country ? (
            <>
              <span className="text-3xl" aria-hidden>
                {country.flagEmoji ?? "🎓"}
              </span>
              <span>{university.nameEn}</span>
            </>
          ) : (
            <span>{university.nameEn}</span>
          )
        }
        title={university.nameFa}
        description={university.summary}
        imageSrc={university.heroImage}
        imageAlt={`پردیس ${university.nameFa}`}
        primaryCta={{ label: "رزرو مشاوره", href: bookingHref }}
        secondaryCta={{
          label: "مشاهده برنامه‌ها",
          href: `#programs`,
        }}
      />

      <Container>
        <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_17.5rem] lg:items-start">
          <div className="min-w-0 flex flex-col gap-6">
            <SectionNav items={sectionNav} />
            <UniversityDetailSections
              university={university}
              country={country}
              programs={programsResult.items}
            />
          </div>

          <StickySummary
            rows={[
              {
                label: "کشور",
                value: country?.nameFa ?? university.countrySlug,
              },
              { label: "شهر", value: university.city },
              {
                label: "رتبه تقریبی",
                value: formatNumber(university.ranking),
              },
              {
                label: "شهریه سالانه",
                value: formatTuition(university.tuitionPerYear, university.currency),
              },
              {
                label: "نزدیک‌ترین مهلت",
                value: nearestDeadline
                  ? formatJalaliDate(nearestDeadline)
                  : "—",
              },
            ]}
            cta={{ label: "رزرو مشاوره", href: bookingHref }}
          />
        </div>
      </Container>

      <RelatedContent
        title="مقالات مرتبط"
        items={blogPostsToRelated(relatedPosts.items)}
        emptyMessage="مقاله مرتبطی یافت نشد."
      />

      <AssessmentCta
        title={`پذیرش از ${university.nameFa}`}
        description="با ارزیابی رایگان یا رزرو مشاوره، مسیر اپلای این دانشگاه را مشخص کنید."
        primaryHref={assessmentHref}
        secondaryHref={bookingHref}
      />
    </div>
  );
}

export default function UniversityPage({ params }: PageProps) {
  return (
    <Suspense
      fallback={
        <div className="flex flex-col gap-6 py-8">
          <Skeleton className="h-10 w-64" />
          <Skeleton className="h-56 w-full" />
          <Skeleton className="h-96 w-full" />
        </div>
      }
    >
      <UniversityContent params={params} />
    </Suspense>
  );
}
