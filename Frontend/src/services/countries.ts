import { countries } from "@/data/countries";
import { mockDelay } from "@/lib/mock-delay";
import type { Country, CountryFilters } from "@/types";

function filterCountries(filters: CountryFilters = {}): Country[] {
  const search = filters.search?.trim().toLowerCase();

  return countries.filter((country) => {
    if (filters.continent && country.continent !== filters.continent) {
      return false;
    }
    if (filters.costBand && country.costBand !== filters.costBand) {
      return false;
    }
    if (search) {
      const haystack =
        `${country.nameFa} ${country.nameEn} ${country.summary} ${country.popularFields.join(" ")}`.toLowerCase();
      if (!haystack.includes(search)) {
        return false;
      }
    }
    return true;
  });
}

export async function getCountries(
  filters: CountryFilters = {},
): Promise<Country[]> {
  "use cache";
  await mockDelay();
  return filterCountries(filters);
}

export async function getCountryBySlug(slug: string): Promise<Country | null> {
  "use cache";
  await mockDelay();
  return countries.find((c) => c.slug === slug) ?? null;
}
