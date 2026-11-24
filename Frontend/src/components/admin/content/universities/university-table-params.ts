import { parseAsString, parseAsStringLiteral } from "nuqs";
import {
  PUBLICATION_STATUSES,
  UNIVERSITY_SORT_FIELDS,
  type UniversityListQuery,
} from "@/contracts/content";
import type { TableUrlParams } from "../../data-table/use-table-url-state";

/**
 * Resource-specific URL filters for `/admin/content/universities`.
 */
export const universityFilterParsers = {
  country: parseAsString,
  status: parseAsStringLiteral(PUBLICATION_STATUSES),
};

type UniversityFilters = {
  country: string | null;
  status: UniversityListQuery["status"] | null;
};

function isSortField(
  value: string | null,
): value is (typeof UNIVERSITY_SORT_FIELDS)[number] {
  return (
    value !== null &&
    (UNIVERSITY_SORT_FIELDS as readonly string[]).includes(value)
  );
}

/** URL state → `GET /universities` query */
export function toUniversityListQuery(
  params: TableUrlParams,
  filters: UniversityFilters,
): Partial<UniversityListQuery> {
  const sort = isSortField(params.sort) ? params.sort : undefined;
  return {
    page: params.page,
    pageSize: params.pageSize,
    q: params.q || undefined,
    sort,
    order: sort ? params.order : undefined,
    country: filters.country || undefined,
    status: filters.status ?? undefined,
  };
}
