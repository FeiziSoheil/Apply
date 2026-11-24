import {
  createSearchParamsCache,
  createSerializer,
  parseAsInteger,
  parseAsString,
} from "nuqs/server";
import type { UniversityFilters } from "@/types";

export const UNIVERSITY_PAGE_SIZE = 12;

export const universitySearchParams = {
  q: parseAsString.withDefault(""),
  country: parseAsString,
  page: parseAsInteger.withDefault(1),
};

export const universitySearchParamsCache = createSearchParamsCache(
  universitySearchParams,
);

export const serializeUniversitySearchParams = createSerializer(
  universitySearchParams,
);

export type UniversitySearchParams = Awaited<
  ReturnType<typeof universitySearchParamsCache.parse>
>;

export function toUniversityFilters(
  params: UniversitySearchParams,
): UniversityFilters {
  return {
    search: params.q.trim() || undefined,
    country: params.country ?? undefined,
    page: params.page,
    pageSize: UNIVERSITY_PAGE_SIZE,
  };
}
