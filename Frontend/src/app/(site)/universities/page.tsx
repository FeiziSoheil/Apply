import type { Metadata } from "next";
import { createPageMetadata } from "@/lib/seo";
import { Suspense } from "react";
import type { SearchParams } from "nuqs/server";
import { UniversityCard } from "@/components/universities/university-card";
import { UniversityFilters } from "@/components/universities/university-filters";
import { UniversityPagination } from "@/components/universities/university-pagination";
import { Container } from "@/components/shared/container";
import { PageBreadcrumb } from "@/components/shared/page-breadcrumb";
import { Skeleton } from "@/components/ui/skeleton";
import {
  toUniversityFilters,
  universitySearchParamsCache,
} from "@/lib/university-search-params";
import { getCountries } from "@/services/countries";
import { getUniversities } from "@/services/universities";

export const metadata: Metadata = createPageMetadata({
  title: "دانشگاه‌ها",
  description:
    "فهرست دانشگاه‌های مقصد تحصیل؛ فیلتر بر اساس کشور و جستجوی نام دانشگاه.",
  path: "/universities",
});

type PageProps = {
  searchParams: Promise<SearchParams>;
};

async function UniversitiesContent({ searchParams }: PageProps) {
  const params = await universitySearchParamsCache.parse(searchParams);
  const filters = toUniversityFilters(params);

  const [result, countries] = await Promise.all([
    getUniversities(filters),
    getCountries(),
  ]);

  const countryMap = new Map(countries.map((c) => [c.slug, c.nameFa]));

  return (
    <Container className="flex flex-col gap-8 pb-12">
      <div>
        <PageBreadcrumb
          contained={false}
          items={[{ label: "دانشگاه‌ها" }]}
        />
        <h1 className="text-3xl font-bold tracking-tight text-foreground">
          دانشگاه‌های مقصد
        </h1>
        <p className="mt-2 max-w-2xl text-muted-foreground">
          دانشگاه‌ها را بر اساس کشور جستجو کنید و جزئیات پذیرش و برنامه‌ها را ببینید.
        </p>
      </div>

      <UniversityFilters
        countries={countries.map((c) => ({
          slug: c.slug,
          nameFa: c.nameFa,
        }))}
        resultCount={result.total}
      />

      {result.items.length === 0 ? (
        <div className="rounded-xl border border-border bg-muted/30 p-8 text-center">
          <p className="text-muted-foreground">
            دانشگاهی با این فیلترها پیدا نشد. فیلترها را تغییر دهید.
          </p>
        </div>
      ) : (
        <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {result.items.map((university) => (
            <li key={university.id}>
              <UniversityCard
                university={university}
                countryNameFa={countryMap.get(university.countrySlug)}
              />
            </li>
          ))}
        </ul>
      )}

      <UniversityPagination
        page={result.page}
        totalPages={result.totalPages}
        params={params}
      />
    </Container>
  );
}

export default function UniversitiesPage({ searchParams }: PageProps) {
  return (
    <Suspense
      fallback={
        <div className="flex flex-col gap-6 py-8">
          <Skeleton className="h-10 w-64" />
          <Skeleton className="h-32 w-full" />
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-80 w-full" />
            ))}
          </div>
        </div>
      }
    >
      <UniversitiesContent searchParams={searchParams} />
    </Suspense>
  );
}
