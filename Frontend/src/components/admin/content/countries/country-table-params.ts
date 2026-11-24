import { parseAsStringLiteral } from "nuqs";
import {
  CONTINENTS,
  COST_BANDS,
  COUNTRY_SORT_FIELDS,
  PUBLICATION_STATUSES,
  type CountryListQuery,
} from "@/contracts/content";
import type { TableUrlParams } from "../../data-table/use-table-url-state";

/**
 * Resource-specific URL filters of the countries table, next to the shared
 * `page`, `pageSize`, `q`, `sort`, `order`:
 * `/admin/content/countries?continent=europe&costBand=low&status=published`.
 * Module-level on purpose — the parser map must be referentially stable.
 */
export const countryFilterParsers = {
  continent: parseAsStringLiteral(CONTINENTS),
  costBand: parseAsStringLiteral(COST_BANDS),
  status: parseAsStringLiteral(PUBLICATION_STATUSES),
};

type CountryFilters = {
  continent: CountryListQuery["continent"] | null;
  costBand: CountryListQuery["costBand"] | null;
  status: CountryListQuery["status"] | null;
};

function isSortField(
  value: string | null,
): value is (typeof COUNTRY_SORT_FIELDS)[number] {
  return value !== null && (COUNTRY_SORT_FIELDS as readonly string[]).includes(value);
}

/** URL state → `GET /countries` query */
export function toCountryListQuery(
  params: TableUrlParams,
  filters: CountryFilters,
): Partial<CountryListQuery> {
  const sort = isSortField(params.sort) ? params.sort : undefined;
  return {
    page: params.page,
    pageSize: params.pageSize,
    q: params.q || undefined,
    sort,
    order: sort ? params.order : undefined,
    continent: filters.continent ?? undefined,
    costBand: filters.costBand ?? undefined,
    status: filters.status ?? undefined,
  };
}
