import { parseAsString, parseAsStringLiteral } from "nuqs";
import {
  NEWS_EVENT_TYPES,
  NEWS_SORT_FIELDS,
  PUBLICATION_STATUSES,
  type NewsListQuery,
} from "@/contracts/content";
import type { TableUrlParams } from "../../data-table/use-table-url-state";

export const newsFilterParsers = {
  status: parseAsStringLiteral(PUBLICATION_STATUSES),
  eventType: parseAsStringLiteral(NEWS_EVENT_TYPES),
  publishedFrom: parseAsString,
  publishedTo: parseAsString,
};

type NewsFilters = {
  status: NewsListQuery["status"] | null;
  eventType: NewsListQuery["eventType"] | null;
  publishedFrom: string | null;
  publishedTo: string | null;
};

function isSortField(
  value: string | null,
): value is (typeof NEWS_SORT_FIELDS)[number] {
  return (
    value !== null && (NEWS_SORT_FIELDS as readonly string[]).includes(value)
  );
}

/** URL state → `GET /news` query */
export function toNewsListQuery(
  params: TableUrlParams,
  filters: NewsFilters,
): Partial<NewsListQuery> {
  const sort = isSortField(params.sort) ? params.sort : undefined;
  return {
    page: params.page,
    pageSize: params.pageSize,
    q: params.q || undefined,
    sort,
    order: sort ? params.order : undefined,
    status: filters.status ?? undefined,
    eventType: filters.eventType ?? undefined,
  };
}
