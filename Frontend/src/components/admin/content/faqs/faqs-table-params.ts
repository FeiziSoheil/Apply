import { parseAsString } from "nuqs";
import type { FaqListQuery } from "@/contracts/content";
import type { TableUrlParams } from "../../data-table/use-table-url-state";
import { REORDER_LIST_PAGE_SIZE } from "../content-list-parts";

/** `/admin/content/faqs?category=ویزا&q=مدارک` */
export const faqFilterParsers = {
  category: parseAsString,
};

type FaqFilters = {
  category: string | null;
};

/** URL state → `GET /faqs` query (always `order` asc, single page) */
export function toFaqListQuery(
  params: TableUrlParams,
  filters: FaqFilters,
): Partial<FaqListQuery> {
  return {
    page: 1,
    pageSize: REORDER_LIST_PAGE_SIZE,
    q: params.q || undefined,
    sort: "order",
    order: "asc",
    category: filters.category ?? undefined,
  };
}
