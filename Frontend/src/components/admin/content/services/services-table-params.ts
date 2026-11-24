import { parseAsStringLiteral } from "nuqs";
import {
  PUBLICATION_STATUSES,
  type ServiceListQuery,
} from "@/contracts/content";
import type { TableUrlParams } from "../../data-table/use-table-url-state";
import { REORDER_LIST_PAGE_SIZE } from "../content-list-parts";

/** `/admin/content/services?status=published&q=ویزا` */
export const serviceFilterParsers = {
  status: parseAsStringLiteral(PUBLICATION_STATUSES),
};

type ServiceFilters = {
  status: ServiceListQuery["status"] | null;
};

/**
 * URL state → `GET /services` query. The list is always ordered by `order`
 * and loaded in one page, so drag & drop covers the whole set.
 */
export function toServiceListQuery(
  params: TableUrlParams,
  filters: ServiceFilters,
): Partial<ServiceListQuery> {
  return {
    page: 1,
    pageSize: REORDER_LIST_PAGE_SIZE,
    q: params.q || undefined,
    sort: "order",
    order: "asc",
    status: filters.status ?? undefined,
  };
}
