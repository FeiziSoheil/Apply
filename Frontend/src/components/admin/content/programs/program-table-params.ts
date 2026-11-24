import {
  parseAsBoolean,
  parseAsString,
  parseAsStringLiteral,
} from "nuqs";
import {
  DEGREE_LEVELS,
  PROGRAM_SORT_FIELDS,
  PUBLICATION_STATUSES,
  type ProgramListQuery,
} from "@/contracts/content";
import type { TableUrlParams } from "../../data-table/use-table-url-state";

/**
 * Resource-specific URL filters for `/admin/content/programs`.
 */
export const programFilterParsers = {
  country: parseAsString,
  university: parseAsString,
  degreeLevel: parseAsStringLiteral(DEGREE_LEVELS),
  field: parseAsString,
  hasScholarship: parseAsBoolean,
  status: parseAsStringLiteral(PUBLICATION_STATUSES),
};

type ProgramFilters = {
  country: string | null;
  university: string | null;
  degreeLevel: ProgramListQuery["degreeLevel"] | null;
  field: string | null;
  hasScholarship: boolean | null;
  status: ProgramListQuery["status"] | null;
};

function isSortField(
  value: string | null,
): value is (typeof PROGRAM_SORT_FIELDS)[number] {
  return (
    value !== null && (PROGRAM_SORT_FIELDS as readonly string[]).includes(value)
  );
}

/** URL state → `GET /programs` query */
export function toProgramListQuery(
  params: TableUrlParams,
  filters: ProgramFilters,
): Partial<ProgramListQuery> {
  const sort = isSortField(params.sort) ? params.sort : undefined;
  return {
    page: params.page,
    pageSize: params.pageSize,
    q: params.q || undefined,
    sort,
    order: sort ? params.order : undefined,
    country: filters.country || undefined,
    university: filters.university || undefined,
    degreeLevel: filters.degreeLevel ?? undefined,
    field: filters.field || undefined,
    hasScholarship: filters.hasScholarship ?? undefined,
    status: filters.status ?? undefined,
  };
}
