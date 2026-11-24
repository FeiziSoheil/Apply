import { parseAsBoolean, parseAsString } from "nuqs";
import type { ConsultantListQuery } from "@/contracts/content";
import type { TableUrlParams } from "../../data-table/use-table-url-state";
import { REORDER_LIST_PAGE_SIZE } from "../content-list-parts";

/** `/admin/content/consultants?country=germany&language=آلمانی&active=true` */
export const consultantFilterParsers = {
  country: parseAsString,
  language: parseAsString,
  active: parseAsBoolean,
};

type ConsultantFilters = {
  country: string | null;
  language: string | null;
  active: boolean | null;
};

/** URL state → `GET /consultants` query (always `order` asc, single page) */
export function toConsultantListQuery(
  params: TableUrlParams,
  filters: ConsultantFilters,
): Partial<ConsultantListQuery> {
  return {
    page: 1,
    pageSize: REORDER_LIST_PAGE_SIZE,
    q: params.q || undefined,
    sort: "order",
    order: "asc",
    country: filters.country ?? undefined,
    language: filters.language ?? undefined,
    active: filters.active ?? undefined,
  };
}
