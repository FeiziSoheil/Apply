import { parseAsString, parseAsStringLiteral } from "nuqs";
import {
  BLOG_POST_SORT_FIELDS,
  PUBLICATION_STATUSES,
  type BlogPostListQuery,
} from "@/contracts/content";
import type { TableUrlParams } from "../../data-table/use-table-url-state";

export const blogFilterParsers = {
  status: parseAsStringLiteral(PUBLICATION_STATUSES),
  categoryId: parseAsString,
  tag: parseAsString,
  author: parseAsString,
  publishedFrom: parseAsString,
  publishedTo: parseAsString,
};

type BlogFilters = {
  status: BlogPostListQuery["status"] | null;
  categoryId: string | null;
  tag: string | null;
  author: string | null;
  publishedFrom: string | null;
  publishedTo: string | null;
};

function isSortField(
  value: string | null,
): value is (typeof BLOG_POST_SORT_FIELDS)[number] {
  return (
    value !== null &&
    (BLOG_POST_SORT_FIELDS as readonly string[]).includes(value)
  );
}

/** URL state → `GET /blog-posts` query */
export function toBlogListQuery(
  params: TableUrlParams,
  filters: BlogFilters,
): Partial<BlogPostListQuery> {
  const sort = isSortField(params.sort) ? params.sort : undefined;
  return {
    page: params.page,
    pageSize: params.pageSize,
    q: params.q || undefined,
    sort,
    order: sort ? params.order : undefined,
    status: filters.status ?? undefined,
    categoryId: filters.categoryId || undefined,
    tag: filters.tag || undefined,
    author: filters.author || undefined,
    publishedFrom: filters.publishedFrom || undefined,
    publishedTo: filters.publishedTo || undefined,
  };
}
