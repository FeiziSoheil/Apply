import type { Metadata } from "next";
import { Suspense } from "react";
import { notFound } from "next/navigation";
import {
  PROGRAM_SECTION_NAV,
  ProgramDetailSections,
  programConsultationHref,
} from "@/components/programs/program-detail-sections";
import { AssessmentCta } from "@/components/shared/assessment-cta";
import { Container } from "@/components/shared/container";
import { PageBreadcrumb } from "@/components/shared/page-breadcrumb";
import { PageHero } from "@/components/shared/page-hero";
import { SectionNav } from "@/components/shared/section-nav";
import { StickySummary } from "@/components/shared/sticky-summary";
import { Skeleton } from "@/components/ui/skeleton";
import { DEGREE_LEVEL_LABELS } from "@/lib/degree-levels";
import { formatJalaliDate } from "@/lib/format";
import { formatTuition } from "@/lib/format-tuition";
import { createPageMetadata } from "@/lib/seo";
import { getCountryBySlug } from "@/services/countries";
import {
  getProgramBySlug,
  getPrograms,
  getSimilarPrograms,
} from "@/services/programs";
import { getUniversityBySlug } from "@/services/universities";

type PageProps = {
  params: Promise<{ slug: string }>;
};

export async function generateStaticParams() {
  const { items } = await getPrograms();
  return items.map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const program = await getProgramBySlug(slug);

  if (!program) {
    return createPageMetadata({
      title: "برنامه یافت نشد",
      description: "برنامه تحصیلی مورد نظر یافت نشد.",
      path: `/programs/${slug}`,
      noIndex: true,
    });
  }

  return createPageMetadata({
    title: program.nameFa,
    description: `${DEGREE_LEVEL_LABELS[program.degreeLevel]} ${program.field} — شهریه ${formatTuition(program.tuition, program.currency)}، مهلت ${formatJalaliDate(program.deadline)}.`,
    path: `/programs/${program.slug}`,
  });
}

async function ProgramContent({ params }: PageProps) {
  const { slug } = await params;
  const program = await getProgramBySlug(slug);

  if (!program) {
    notFound();
  }

  const [university, country, similar] = await Promise.all([
    getUniversityBySlug(program.universitySlug),
    getCountryBySlug(program.countrySlug),
    getSimilarPrograms(program, 3),
  ]);

  const bookingHref = programConsultationHref(program, "booking");
  const assessmentHref = programConsultationHref(program, "assessment");

  return (
    <div className="flex flex-col gap-8 pb-12">
      <PageBreadcrumb
        items={[
          { label: "برنامه‌ها", href: "/programs" },
          { label: program.nameFa },
        ]}
      />

      <PageHero
        eyebrow={
          country ? (
            <>
              <span className="text-3xl" aria-hidden>
                {country.flagEmoji ?? "🎓"}
              </span>
              <span>{country.nameFa}</span>
            </>
          ) : undefined
        }
        title={program.nameFa}
        description={`${DEGREE_LEVEL_LABELS[program.degreeLevel]} · ${program.field} · ${program.duration}`}
        imageSrc={country?.heroImage}
        imageAlt={
          country
            ? `فضای تحصیل مرتبط با ${program.nameFa} در ${country.nameFa}`
            : `برنامه ${program.nameFa}`
        }
        primaryCta={{ label: "رزرو مشاوره برای این برنامه", href: bookingHref }}
        secondaryCta={{ label: "ارزیابی رایگان", href: assessmentHref }}
      />

      <Container>
        <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_17.5rem] lg:items-start">
          <div className="min-w-0 flex flex-col gap-6">
            <SectionNav
              items={PROGRAM_SECTION_NAV.map((item) => ({
                id: item.id,
                label: item.label,
              }))}
            />
            <ProgramDetailSections
              program={program}
              university={university}
              country={country}
              similar={similar}
            />
          </div>

          <StickySummary
            rows={[
              {
                label: "دانشگاه",
                value: university?.nameFa ?? program.universitySlug,
              },
              {
                label: "کشور",
                value: country?.nameFa ?? program.countrySlug,
              },
              {
                label: "مقطع",
                value: DEGREE_LEVEL_LABELS[program.degreeLevel],
              },
              { label: "شهریه سالانه", value: formatTuition(program.tuition, program.currency) },
              {
                label: "مهلت درخواست",
                value: formatJalaliDate(program.deadline),
              },
              {
                label: "مدرک زبان",
                value: program.languageRequirement,
              },
            ]}
            cta={{ label: "رزرو مشاوره", href: bookingHref }}
          />
        </div>
      </Container>

      <AssessmentCta
        title="برای این برنامه مشاوره بگیرید"
        description={`مشاوران ما مسیر پذیرش «${program.nameFa}» را با شما بررسی می‌کنند.`}
        primaryHref={assessmentHref}
        primaryLabel="شروع ارزیابی"
        secondaryHref={bookingHref}
        secondaryLabel="رزرو مشاوره"
      />
    </div>
  );
}

export default function ProgramPage({ params }: PageProps) {
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
      <ProgramContent params={params} />
    </Suspense>
  );
}
