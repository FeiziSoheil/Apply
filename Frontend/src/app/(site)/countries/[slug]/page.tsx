import type { Metadata } from "next";
import { Suspense } from "react";
import { notFound } from "next/navigation";
import {
  CountryDetailSections,
  getCountrySectionNav,
} from "@/components/countries/country-detail-sections";
import { AssessmentCta } from "@/components/shared/assessment-cta";
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
import { JsonLd } from "@/components/shared/json-ld";
import { formatMoney } from "@/lib/currency";
import {
  buildFaqPageJsonLd,
  createPageMetadata,
} from "@/lib/seo";
import {
  extractFaqsFromSections,
  resolveMetaDescription,
  resolveOgImage,
} from "@/lib/seo-content";
import { getBlogPosts } from "@/services/blog";
import { getCountries, getCountryBySlug } from "@/services/countries";
import { getUniversitiesByCountry } from "@/services/universities";

type PageProps = {
  params: Promise<{ slug: string }>;
  searchParams?: Promise<{ preview?: string }>;
};

export async function generateStaticParams() {
  const countries = await getCountries();
  return countries.map((c) => ({ slug: c.slug }));
}

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const country = await getCountryBySlug(slug);

  if (!country) {
    return createPageMetadata({
      title: "کشور یافت نشد",
      description: "کشور مورد نظر یافت نشد.",
      path: `/countries/${slug}`,
      noIndex: true,
    });
  }

  const description = resolveMetaDescription({
    seo: country.seo,
    fallbacks: [
      country.summary,
      ...country.sections.filter((s) => s.visible).map((s) => s.content),
    ],
  });

  return createPageMetadata({
    title: country.seo.metaTitle ?? country.nameFa,
    description: description || country.summary,
    path: `/countries/${country.slug}`,
    image: resolveOgImage(country.seo, country.heroImage),
    noIndex: country.seo.noindex,
  });
}

async function CountryContent({ params, searchParams }: PageProps) {
  const { slug } = await params;
  const preview =
    searchParams != null && (await searchParams).preview === "1";
  const country = await getCountryBySlug(slug);

  if (!country) {
    notFound();
  }

  const [universities, relatedByTag, relatedBySearch] = await Promise.all([
    getUniversitiesByCountry(slug),
    getBlogPosts({ tag: country.nameFa, pageSize: 3 }),
    getBlogPosts({ search: country.nameFa, pageSize: 6 }),
  ]);

  const relatedPosts = (() => {
    const byId = new Map(
      [...relatedByTag.items, ...relatedBySearch.items].map((p) => [p.id, p]),
    );
    return Array.from(byId.values()).slice(0, 3);
  })();

  const sectionNav = getCountrySectionNav(country).map((item) => ({
    id: item.id,
    label: item.label,
  }));

  const accordionFaqs = extractFaqsFromSections(country.sections);
  const faqJsonLd =
    accordionFaqs.length > 0
      ? buildFaqPageJsonLd(
          accordionFaqs.map((faq, index) => ({
            id: `section-faq-${index}`,
            question: faq.question,
            answer: faq.answer,
          })),
        )
      : null;

  return (
    <div className="flex flex-col gap-8 pb-12">
      {faqJsonLd ? <JsonLd data={faqJsonLd} /> : null}
      {preview ? (
        <div
          role="status"
          className="border-b border-warning/40 bg-warning/10 px-4 py-2 text-center text-sm text-foreground"
        >
          حالت پیش‌نمایش — فقط محتوای منتشرشدهٔ عمومی نمایش داده می‌شود. پیش‌نویس
          فرم را از پنل مدیریت ببینید.
        </div>
      ) : null}
      <PageBreadcrumb
        items={[
          { label: "کشورها", href: "/countries" },
          { label: country.nameFa },
        ]}
      />

      <PageHero
        eyebrow={
          <>
            <span className="text-3xl" aria-hidden>
              {country.flagEmoji ?? "🌍"}
            </span>
            <span>{country.nameEn}</span>
          </>
        }
        title={`تحصیل در ${country.nameFa}`}
        description={country.summary}
        imageSrc={country.heroImage}
        imageAlt={`فضای تحصیل در ${country.nameFa}`}
        primaryCta={{ label: "ارزیابی رایگان", href: "/assessment" }}
        secondaryCta={{ label: "رزرو مشاوره", href: "/booking" }}
      />

      <Container>
        <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_17.5rem] lg:items-start">
          <div className="min-w-0 flex flex-col gap-6">
            <SectionNav items={sectionNav} />
            <CountryDetailSections
              country={country}
              universities={universities}
            />
          </div>

          <StickySummary
            rows={[
              { label: "شهریه تقریبی", value: country.tuitionRange },
              {
                label: "هزینه زندگی ماهانه",
                value: `حدود ${formatMoney(country.costOfLiving, country.currency)}`,
              },
              { label: "زبان تحصیل", value: country.language },
              { label: "زمان بررسی ویزا", value: country.visaDuration },
            ]}
            cta={{ label: "ارزیابی رایگان", href: "/assessment" }}
          />
        </div>
      </Container>

      <AssessmentCta
        title={`آیا ${country.nameFa} برای شما مناسب است؟`}
        description="با ارزیابی رایگان، تطبیق پروفایل شما با شرایط پذیرش و هزینه این کشور را بررسی می‌کنیم."
      />

      <RelatedContent
        title="مقالات مرتبط"
        items={blogPostsToRelated(relatedPosts)}
        emptyMessage="هنوز مقاله مرتبطی برای این کشور منتشر نشده است."
      />
    </div>
  );
}

export default function CountryPage({ params, searchParams }: PageProps) {
  return (
    <Suspense
      fallback={
        <div className="flex flex-col gap-6 py-8">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-56 w-full rounded-2xl" />
          <Skeleton className="h-96 w-full" />
        </div>
      }
    >
      <CountryContent params={params} searchParams={searchParams} />
    </Suspense>
  );
}
