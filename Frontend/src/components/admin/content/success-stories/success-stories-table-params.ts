import { parseAsString, parseAsStringLiteral } from "nuqs";
import {
  PUBLICATION_STATUSES,
  type SuccessStoryListQuery,
} from "@/contracts/content";
import type { TableUrlParams } from "../../data-table/use-table-url-state";
import { REORDER_LIST_PAGE_SIZE } from "../content-list-parts";

/** `/admin/content/success-stories?status=draft&country=آلمان` */
export const successStoryFilterParsers = {
  status: parseAsStringLiteral(PUBLICATION_STATUSES),
  country: parseAsString,
};

type SuccessStoryFilters = {
  status: SuccessStoryListQuery["status"] | null;
  country: string | null;
};

/** URL state → `GET /success-stories` query (always `order` asc, single page) */
export function toSuccessStoryListQuery(
  params: TableUrlParams,
  filters: SuccessStoryFilters,
): Partial<SuccessStoryListQuery> {
  return {
    page: 1,
    pageSize: REORDER_LIST_PAGE_SIZE,
    q: params.q || undefined,
    sort: "order",
    order: "asc",
    status: filters.status ?? undefined,
    country: filters.country ?? undefined,
  };
}
