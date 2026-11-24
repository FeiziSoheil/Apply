import type { Metadata } from "next";
import { createPageMetadata } from "@/lib/seo";
import { Suspense } from "react";
import { ServiceCard } from "@/components/services/service-card";
import { Container } from "@/components/shared/container";
import { PageBreadcrumb } from "@/components/shared/page-breadcrumb";
import { Skeleton } from "@/components/ui/skeleton";
import { getServices } from "@/services/services";

export const metadata: Metadata = createPageMetadata({
  title: "خدمات",
  description:
    "خدمات اپلای دانشگاه، ویزای تحصیلی، آمادگی زبان، ترجمه رسمی، بورسیه و اسکان دانشجویی.",
  path: "/services",
});

async function ServicesContent() {
  const services = await getServices();

  return (
    <Container className="flex flex-col gap-8 pb-12">
      <div>
        <PageBreadcrumb
          contained={false}
          items={[{ label: "خدمات" }]}
        />
        <h1 className="text-3xl font-bold tracking-tight text-foreground">
          خدمات ما
        </h1>
        <p className="mt-2 max-w-2xl text-muted-foreground">
          از اپلای دانشگاه تا اسکان در مقصد؛ هر خدمت را ببینید و برای مشاوره
          رزرو کنید.
        </p>
      </div>

      <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {services.map((service) => (
          <li key={service.id}>
            <ServiceCard service={service} />
          </li>
        ))}
      </ul>
    </Container>
  );
}

export default function ServicesPage() {
  return (
    <Suspense
      fallback={
        <div className="flex flex-col gap-6 py-8">
          <Skeleton className="h-10 w-64" />
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-64 w-full" />
            ))}
          </div>
        </div>
      }
    >
      <ServicesContent />
    </Suspense>
  );
}
