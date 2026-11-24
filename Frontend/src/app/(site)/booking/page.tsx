import type { Metadata } from "next";
import { Suspense } from "react";
import { PageHeader } from "@/components/shared/page-header";
import { Section } from "@/components/shared/section";
import { BookingForm } from "@/components/forms/booking-form";
import { Skeleton } from "@/components/ui/skeleton";
import { createPageMetadata } from "@/lib/seo";
import { getConsultants } from "@/services/consultants";
import { getServiceBySlug } from "@/services/services";

export const metadata: Metadata = createPageMetadata({
  title: "رزرو مشاوره",
  description:
    "وقت مشاوره حضوری یا آنلاین را در تقویم جلالی انتخاب کنید و مسیر اعزام را شروع کنید.",
  path: "/booking",
});

type BookingPageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

function firstParam(
  value: string | string[] | undefined,
): string | undefined {
  if (Array.isArray(value)) return value[0];
  return value;
}

function buildInitialNotes(params: {
  program?: string;
  university?: string;
  serviceTitle?: string;
}): string {
  const parts: string[] = [];
  if (params.serviceTitle) {
    parts.push(`علاقه‌مند به خدمت: ${params.serviceTitle}`);
  }
  if (params.program) {
    parts.push(`علاقه‌مند به برنامه: ${params.program}`);
  }
  if (params.university) {
    parts.push(`علاقه‌مند به دانشگاه: ${params.university}`);
  }
  return parts.join("\n");
}

async function BookingContent({ searchParams }: BookingPageProps) {
  const raw = await searchParams;
  const serviceSlug = firstParam(raw.service);
  const consultantId = firstParam(raw.consultant);
  const [consultants, service] = await Promise.all([
    getConsultants(),
    serviceSlug ? getServiceBySlug(serviceSlug) : Promise.resolve(null),
  ]);

  const initialNotes = buildInitialNotes({
    program: firstParam(raw.program),
    university: firstParam(raw.university),
    serviceTitle: service?.title,
  });

  return (
    <Section className="pt-0">
      <BookingForm
        consultants={consultants.map((c) => ({
          id: c.id,
          name: c.name,
          role: c.role,
        }))}
        initialNotes={initialNotes}
        initialConsultantId={consultantId}
      />
    </Section>
  );
}

export default function BookingPage({ searchParams }: BookingPageProps) {
  return (
    <>
      <PageHeader
        title="رزرو مشاوره"
        description="وقت مشاوره حضوری یا آنلاین را در تقویم جلالی انتخاب کنید."
        breadcrumbs={[{ label: "رزرو مشاوره" }]}
      />
      <Suspense fallback={<Skeleton className="mx-auto h-96 w-full max-w-3xl" />}>
        <BookingContent searchParams={searchParams} />
      </Suspense>
    </>
  );
}
