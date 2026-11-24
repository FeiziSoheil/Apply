import { parseAsStringLiteral } from "nuqs";
import { PUBLICATION_STATUSES } from "@/contracts/content";
import type { AnnouncementListQuery } from "@/contracts/student-panel";
import type { TableUrlParams } from "../../data-table/use-table-url-state";

const ANNOUNCEMENT_SORT_FIELDS = [
  "publishedAt",
  "createdAt",
  "updatedAt",
] as const;

export const announcementFilterParsers = {
  status: parseAsStringLiteral(PUBLICATION_STATUSES),
};

type AnnouncementFilters = {
  status: AnnouncementListQuery["status"] | null;
};

function isSortField(
  value: string | null,
): value is (typeof ANNOUNCEMENT_SORT_FIELDS)[number] {
  return (
    value !== null &&
    (ANNOUNCEMENT_SORT_FIELDS as readonly string[]).includes(value)
  );
}

/** URL state → `GET /announcements` query */
export function toAnnouncementListQuery(
  params: TableUrlParams,
  filters: AnnouncementFilters,
): Partial<AnnouncementListQuery> {
  const sort = isSortField(params.sort) ? params.sort : undefined;
  return {
    page: params.page,
    pageSize: params.pageSize,
    q: params.q || undefined,
    sort,
    order: sort ? params.order : undefined,
    status: filters.status ?? undefined,
  };
}
