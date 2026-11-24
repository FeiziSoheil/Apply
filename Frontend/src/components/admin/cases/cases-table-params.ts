import {
  parseAsBoolean,
  parseAsInteger,
  parseAsString,
  parseAsStringLiteral,
  type Values,
} from "nuqs";
import type { TableUrlParams } from "@/components/admin/data-table/use-table-url-state";
import {
  CASE_SORT_FIELDS,
  CASE_STAGES,
  CASE_STATUSES,
  type StudentCaseListQuery,
} from "@/contracts/students";

export const caseFilterParsers = {
  status: parseAsStringLiteral(CASE_STATUSES),
  stage: parseAsStringLiteral(CASE_STAGES),
  country: parseAsString,
  consultantId: parseAsString,
  docsPendingReview: parseAsBoolean,
  deadlineWithinDays: parseAsInteger,
  noActivity: parseAsBoolean,
  viewId: parseAsString,
};

export type CaseFilters = Values<typeof caseFilterParsers>;

export function toCaseListQuery(
  params: TableUrlParams,
  filters: CaseFilters,
): StudentCaseListQuery {
  const sort =
    params.sort &&
    (CASE_SORT_FIELDS as readonly string[]).includes(params.sort)
      ? (params.sort as StudentCaseListQuery["sort"])
      : "updatedAt";

  return {
    page: params.page,
    pageSize: params.pageSize,
    q: params.q || undefined,
    sort,
    order: params.order === "asc" ? "asc" : "desc",
    status: filters.status ?? undefined,
    stage: filters.stage ?? undefined,
    country: filters.country ?? undefined,
    consultantId: filters.consultantId ?? undefined,
    docsPendingReview: filters.docsPendingReview ?? undefined,
    deadlineWithinDays: filters.deadlineWithinDays ?? undefined,
    noActivity: filters.noActivity ?? undefined,
  };
}

export const SYSTEM_CASE_VIEWS = [
  { id: "all", title: "همه", patch: {} },
  {
    id: "docs-review",
    title: "مدارک در انتظار بررسی",
    patch: { docsPendingReview: true as const },
  },
  {
    id: "deadline-7d",
    title: "ددلاین ۷ روز",
    patch: { deadlineWithinDays: 7 },
  },
  {
    id: "no-activity",
    title: "بدون فعالیت",
    patch: { noActivity: true as const },
  },
] as const;
