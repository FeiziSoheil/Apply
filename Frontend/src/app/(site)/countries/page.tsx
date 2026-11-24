import type { Metadata } from "next";
import { createPageMetadata } from "@/lib/seo";
import { Suspense } from "react";
import { CountryCard } from "@/components/countries/country-card";
import { CountryFilters } from "@/components/countries/country-filters";
import { Container } from "@/components/shared/container";
import { PageBreadcrumb } from "@/components/shared/page-breadcrumb";
import { Skeleton } from "@/components/ui/skeleton";
import { isContinent, isCostBand } from "@/lib/continents";
import { formatNumber } from "@/lib/format";
import { getCountries } from "@/services/countries";
import type { CountryFilters as CountryFilterParams } from "@/types";

export const metadata: Metadata = createPageMetadata({
  title: "کشورهای مقصد تحصیل",
  description:
    "مقایسه کشورها برای تحصیل در خارج: هزینه زندگی، شهریه، ویزا و رشته‌های محبوب.",
  path: "/countries",
});

type PageProps = {
  searchParams: Promise<{
    q?: string | string[];
    continent?: string | string[];
    cost?: string | string[];
  }>;
};

function firstParam(
  value: string | string[] | undefined,
): string | undefined {
  if (Array.isArray(value)) return value[0];
  return value;
}

async function CountriesList({ searchParams }: PageProps) {
  const params = await searchParams;
  const search = firstParam(params.q)?.trim() || undefined;
  const continentRaw = firstParam(params.continent);
  const costRaw = firstParam(params.cost);

  const filters: CountryFilterParams = {
    search,
    continent:
      continentRaw && isContinent(continentRaw) ? continentRaw : undefined,
    costBand: costRaw && isCostBand(costRaw) ? costRaw : undefined,
  };

  const countries = await getCountries(filters);

  return (
    <Container className="flex flex-col gap-8 pb-12">
      <div>
        <PageBreadcrumb
          contained={false}
          items={[{ label: "کشورها" }]}
        />
        <h1 className="text-3xl font-bold tracking-tight text-foreground">
          کشورهای مقصد تحصیل
        </h1>
        <p className="mt-2 max-w-2xl text-muted-foreground">
          از میان مقاصد محبوب، بر اساس قاره، سطح هزینه یا نام کشور جستجو کنید.
        </p>
      </div>

      <CountryFilters
        key={`${search ?? ""}:${filters.continent ?? ""}:${filters.costBand ?? ""}`}
        initialSearch={search ?? ""}
        initialContinent={filters.continent}
        initialCostBand={filters.costBand}
        resultCount={countries.length}
      />

      {countries.length === 0 ? (
        <div className="rounded-xl border border-border bg-muted/30 p-8 text-center">
          <p className="text-muted-foreground">
            کشوری با این فیلترها پیدا نشد. فیلترها را تغییر دهید.
          </p>
        </div>
      ) : (
        <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {countries.map((country) => (
            <li key={country.id}>
              <CountryCard country={country} />
            </li>
          ))}
        </ul>
      )}

      <p className="sr-only">
        {formatNumber(countries.length)} کشور نمایش داده شد
      </p>
    </Container>
  );
}

export default function CountriesPage({ searchParams }: PageProps) {
  return (
    <Suspense
      fallback={
        <div className="flex flex-col gap-6 py-8">
          <Skeleton className="h-10 w-64" />
          <Skeleton className="h-32 w-full" />
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-72 w-full" />
            ))}
          </div>
        </div>
      }
    >
      <CountriesList searchParams={searchParams} />
    </Suspense>
  );
}
