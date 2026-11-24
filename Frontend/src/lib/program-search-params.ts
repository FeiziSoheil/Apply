import {
  createSearchParamsCache,
  createSerializer,
  parseAsBoolean,
  parseAsInteger,
  parseAsString,
  parseAsStringLiteral,
} from "nuqs/server";
import { DEGREE_LEVELS } from "@/lib/degree-levels";
import { LANGUAGE_REQUIREMENT_TYPES } from "@/lib/language-requirements";
import { PROGRAM_SORTS } from "@/lib/program-sort";
import { TUITION_RANGE } from "@/lib/tuition-range";
import type { ProgramFilters } from "@/types";

export const PROGRAM_PAGE_SIZE = 12;

/**
 * URL search params for /programs — shareable and refresh-safe via nuqs.
 * Home quick-search uses: country, degreeLevel, field (kept compatible).
 */
export const programSearchParams = {
  q: parseAsString.withDefault(""),
  country: parseAsString,
  degreeLevel: parseAsStringLiteral(DEGREE_LEVELS),
  field: parseAsString,
  languageType: parseAsStringLiteral(LANGUAGE_REQUIREMENT_TYPES),
  intake: parseAsString,
  hasScholarship: parseAsBoolean,
  minTuition: parseAsInteger.withDefault(TUITION_RANGE.min),
  maxTuition: parseAsInteger.withDefault(TUITION_RANGE.max),
  sort: parseAsStringLiteral(PROGRAM_SORTS).withDefault("relevant"),
  page: parseAsInteger.withDefault(1),
};

export const programSearchParamsCache =
  createSearchParamsCache(programSearchParams);

export const serializeProgramSearchParams =
  createSerializer(programSearchParams);

export type ProgramSearchParams = Awaited<
  ReturnType<typeof programSearchParamsCache.parse>
>;

export function toProgramFilters(
  params: ProgramSearchParams,
): ProgramFilters {
  const minTuition =
    params.minTuition > TUITION_RANGE.min ? params.minTuition : undefined;
  const maxTuition =
    params.maxTuition < TUITION_RANGE.max ? params.maxTuition : undefined;

  return {
    search: params.q.trim() || undefined,
    country: params.country ?? undefined,
    degreeLevel: params.degreeLevel ?? undefined,
    field: params.field ?? undefined,
    languageType: params.languageType ?? undefined,
    intake: params.intake ?? undefined,
    hasScholarship: params.hasScholarship ?? undefined,
    minTuition,
    maxTuition,
    sort: params.sort,
    page: params.page,
    pageSize: PROGRAM_PAGE_SIZE,
  };
}
