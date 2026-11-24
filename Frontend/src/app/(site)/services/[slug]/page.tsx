import type { Metadata } from "next";
import { Suspense } from "react";
import { notFound } from "next/navigation";
import {
  getServiceSectionNav,
  ServiceDetailSections,
} from "@/components/services/service-detail-sections";
import { AssessmentCta } from "@/components/shared/assessment-cta";
import { Container } from "@/components/shared/container";
import { PageBreadcrumb } from "@/components/shared/page-breadcrumb";
import { PageHero } from "@/components/shared/page-hero";
import {
  RelatedContent,
  type RelatedContentItem,
} from "@/components/shared/related-content";
import { SectionNav } from "@/components/shared/section-nav";
import { StickySummary } from "@/components/shared/sticky-summary";
import { Skeleton } from "@/components/ui/skeleton";
import { JsonLd } from "@/components/shared/json-ld";
import { formatRialsAsToman } from "@/lib/format";
import { ServiceIcon } from "@/lib/icons";
import { buildFaqPageJsonLd, createPageMetadata } from "@/lib/seo";
import {
  extractFaqsFromSections,
  resolveMetaDescription,
  resolveOgImage,
} from "@/lib/seo-content";
import {
  getRelatedServices,
  getServiceBySlug,
  getServices,
} from "@/services/services";
import type { Service } from "@/types";

type PageProps = {
  params: Promise<{ slug: string }>;
};

export async function generateStaticParams() {
  const services = await getServices();
  return services.map((s) => ({ slug: s.slug }));
}

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const service = await getServiceBySlug(slug);

  if (!service) {
    return createPageMetadata({
      title: "خدمت یافت نشد",
      description: "خدمت مورد نظر یافت نشد.",
      path: `/services/${slug}`,
      noIndex: true,
    });
  }

  const description = resolveMetaDescription({
    seo: service.seo,
    fallbacks: [
      service.shortDescription,
      ...service.sections.filter((s) => s.visible).map((s) => s.content),
    ],
  });

  return createPageMetadata({
    title: service.seo.metaTitle ?? service.title,
    description: description || service.shortDescription,
    path: `/services/${service.slug}`,
    image: resolveOgImage(service.seo),
    noIndex: service.seo.noindex,
  });
}

function servicesToRelated(items: Service[]): RelatedContentItem[] {
  return items.map((service) => ({
    id: service.id,
    href: `/services/${service.slug}`,
    title: service.title,
    description: service.shortDescription,
    meta:
      service.price !== undefined
        ? `از ${formatRialsAsToman(service.price)}`
        : undefined,
  }));
}

function bookingHref(slug: string) {
  return `/booking?service=${encodeURIComponent(slug)}`;
}

async function ServiceContent({ params }: PageProps) {
  const { slug } = await params;
  const service = await getServiceBySlug(slug);

  if (!service) {
    notFound();
  }

  const related = await getRelatedServices(service.relatedServiceSlugs);
  const bookHref = bookingHref(service.slug);

  const sectionNav = getServiceSectionNav(service).map((item) => ({
    id: item.id,
    label: item.label,
  }));

  const accordionFaqs = extractFaqsFromSections(service.sections);
  const faqJsonLd =
    accordionFaqs.length > 0
      ? buildFaqPageJsonLd(
          accordionFaqs.map((faq, index) => ({
            id: `svc-faq-${index}`,
            question: faq.question,
            answer: faq.answer,
          })),
        )
      : null;

  const summaryRows = [
    { label: "مدت تقریبی", value: service.duration },
    ...(service.price !== undefined
      ? [{ label: "هزینه تقریبی", value: `از ${formatRialsAsToman(service.price)}` }]
      : []),
  ];

  return (
    <div className="flex flex-col gap-8 pb-12">
      {faqJsonLd ? <JsonLd data={faqJsonLd} /> : null}
      <PageBreadcrumb
        items={[
          { label: "خدمات", href: "/services" },
          { label: service.title },
        ]}
      />

      <PageHero
        eyebrow={
          <>
            <span
              className="flex size-9 items-center justify-center rounded-lg bg-primary-foreground/15"
              aria-hidden
            >
              <ServiceIcon name={service.icon} className="size-5" />
            </span>
            <span>خدمات اِپلای</span>
          </>
        }
        title={service.title}
        description={service.shortDescription}
        primaryCta={{ label: "رزرو مشاوره", href: bookHref }}
        secondaryCta={{ label: "ارزیابی رایگان", href: "/assessment" }}
      />

      <Container>
        <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_17.5rem] lg:items-start">
          <div className="min-w-0 flex flex-col gap-6">
            <SectionNav items={sectionNav} />
            <ServiceDetailSections service={service} />
          </div>

          <StickySummary
            rows={summaryRows}
            cta={{ label: "رزرو مشاوره این خدمت", href: bookHref }}
          />
        </div>
      </Container>

      <AssessmentCta
        title={`برای «${service.title}» مشاوره بگیرید`}
        description="زمان مشاوره را رزرو کنید تا مسیر، مدارک و هزینه تقریبی را با مشاور بررسی کنیم."
        primaryHref={bookHref}
        primaryLabel="رزرو مشاوره"
        secondaryHref="/assessment"
        secondaryLabel="ارزیابی رایگان"
      />

      <RelatedContent
        title="خدمات مرتبط"
        items={servicesToRelated(related)}
        emptyMessage="خدمت مرتبطی یافت نشد."
      />
    </div>
  );
}

export default function ServicePage({ params }: PageProps) {
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
      <ServiceContent params={params} />
    </Suspense>
  );
}
