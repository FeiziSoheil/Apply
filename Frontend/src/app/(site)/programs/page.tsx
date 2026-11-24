import type { Metadata } from "next";
import { createPageMetadata } from "@/lib/seo";
import { Suspense } from "react";
import {
  ProgramFilterSidebar,
  ProgramFilters,
} from "@/components/programs/program-filters";
import { ProgramPagination } from "@/components/programs/program-pagination";
import { ProgramResults } from "@/components/programs/program-results";
import {
  ProgramFiltersSkeleton,
  ProgramResultsSkeleton,
} from "@/components/programs/program-skeletons";
import { Container } from "@/components/shared/container";
import { PageBreadcrumb } from "@/components/shared/page-breadcrumb";
import {
  programSearchParamsCache,
  toProgramFilters,
} from "@/lib/program-search-params";
import { getCountries } from "@/services/countries";
import {
  getProgramFields,
  getProgramIntakes,
  getProgramLanguageTypes,
  getPrograms,
} from "@/services/programs";
import type { SearchParams } from "nuqs/server";

export const metadata: Metadata = createPageMetadata({
  title: "جستجوی برنامه‌های تحصیلی",
  description:
    "جستجو و فیلتر برنامه‌های کارشناسی، ارشد و دکتری بر اساس کشور، رشته، شهریه و بورسیه.",
  path: "/programs",
});

type PageProps = {
  searchParams: Promise<SearchParams>;
};

async function ProgramsContent({ searchParams }: PageProps) {
  const params = await programSearchParamsCache.parse(searchParams);
  const filters = toProgramFilters(params);

  const [result, countries, fields, intakes, languageTypes] = await Promise.all(
    [
      getPrograms(filters),
      getCountries(),
      getProgramFields(),
      getProgramIntakes(),
      getProgramLanguageTypes(),
    ],
  );

  const options = {
    countries: countries.map((c) => ({ slug: c.slug, nameFa: c.nameFa })),
    fields,
    intakes,
    languageTypes,
  };

  return (
    <Container className="flex flex-col gap-8 pb-12">
      <div>
        <PageBreadcrumb
          contained={false}
          items={[{ label: "برنامه‌های تحصیلی" }]}
        />
        <h1 className="text-3xl font-bold tracking-tight text-foreground">
          جستجوی برنامه‌های تحصیلی
        </h1>
        <p className="mt-2 max-w-2xl text-muted-foreground">
          با فیلتر کشور، مقطع، رشته، شهریه و زمان پذیرش، برنامه مناسب خود را پیدا
          کنید.
        </p>
      </div>

      <div className="grid gap-8 lg:grid-cols-[18rem_minmax(0,1fr)] lg:items-start">
        <ProgramFilterSidebar options={options} />

        <div className="flex min-w-0 flex-col gap-6">
          <ProgramFilters options={options} resultCount={result.total} />
          <ProgramResults items={result.items} />
          <ProgramPagination
            page={result.page}
            totalPages={result.totalPages}
            params={params}
          />
        </div>
      </div>
    </Container>
  );
}

export default function ProgramsPage({ searchParams }: PageProps) {
  return (
    <Suspense
      fallback={
        <div className="flex flex-col gap-8 py-8">
          <ProgramFiltersSkeleton />
          <div className="grid gap-8 lg:grid-cols-[18rem_minmax(0,1fr)]">
            <ProgramFiltersSkeleton />
            <ProgramResultsSkeleton />
          </div>
        </div>
      }
    >
      <ProgramsContent searchParams={searchParams} />
    </Suspense>
  );
}
