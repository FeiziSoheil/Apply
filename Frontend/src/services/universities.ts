import { universities } from "@/data/universities";
import { toEurEquivalent } from "@/lib/currency";
import { mockDelay } from "@/lib/mock-delay";
import { paginate } from "@/lib/pagination";
import type { PaginatedResult, University, UniversityFilters } from "@/types";

function filterUniversities(filters: UniversityFilters = {}): University[] {
  const search = filters.search?.trim().toLowerCase();

  return universities.filter((uni) => {
    if (filters.country && uni.countrySlug !== filters.country) {
      return false;
    }
    if (
      filters.minTuition !== undefined &&
      toEurEquivalent(uni.tuitionPerYear, uni.currency) < filters.minTuition
    ) {
      return false;
    }
    if (
      filters.maxTuition !== undefined &&
      toEurEquivalent(uni.tuitionPerYear, uni.currency) > filters.maxTuition
    ) {
      return false;
    }
    if (search) {
      const haystack =
        `${uni.nameFa} ${uni.nameEn} ${uni.city} ${uni.summary}`.toLowerCase();
      if (!haystack.includes(search)) {
        return false;
      }
    }
    return true;
  });
}

export async function getUniversities(
  filters: UniversityFilters = {},
): Promise<PaginatedResult<University>> {
  "use cache";
  await mockDelay();
  return paginate(filterUniversities(filters), filters);
}

export async function getUniversityBySlug(
  slug: string,
): Promise<University | null> {
  "use cache";
  await mockDelay();
  return universities.find((u) => u.slug === slug) ?? null;
}

export async function getUniversitiesByCountry(
  countrySlug: string,
): Promise<University[]> {
  "use cache";
  await mockDelay();
  return universities.filter((u) => u.countrySlug === countrySlug);
}
