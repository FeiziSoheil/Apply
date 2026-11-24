import type { PaginatedResult, PaginationParams } from "@/types";

const DEFAULT_PAGE = 1;
const DEFAULT_PAGE_SIZE = 12;

/**
 * Paginate a list. If neither `page` nor `pageSize` is provided,
 * returns all items in a single page (useful for generateStaticParams).
 */
export function paginate<T>(
  items: readonly T[],
  params: PaginationParams = {},
): PaginatedResult<T> {
  const total = items.length;
  const hasPagination =
    params.page !== undefined || params.pageSize !== undefined;

  if (!hasPagination) {
    return {
      items: [...items],
      total,
      page: 1,
      pageSize: total > 0 ? total : DEFAULT_PAGE_SIZE,
      totalPages: total === 0 ? 0 : 1,
    };
  }

  const page = Math.max(params.page ?? DEFAULT_PAGE, 1);
  const pageSize = Math.max(params.pageSize ?? DEFAULT_PAGE_SIZE, 1);
  const totalPages = total === 0 ? 0 : Math.ceil(total / pageSize);
  const start = (page - 1) * pageSize;

  return {
    items: items.slice(start, start + pageSize),
    total,
    page,
    pageSize,
    totalPages,
  };
}
