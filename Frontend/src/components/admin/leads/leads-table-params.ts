import {
  parseAsArrayOf,
  parseAsBoolean,
  parseAsInteger,
  parseAsString,
  parseAsStringLiteral,
  type Values,
} from "nuqs";
import type { TableUrlParams } from "@/components/admin/data-table/use-table-url-state";
import {
  LEAD_PRIORITIES,
  LEAD_SORT_FIELDS,
  LEAD_SOURCES,
  type LeadListQuery,
} from "@/contracts/leads";

export const LEAD_VIEW_MODES = ["table", "kanban"] as const;
export type LeadViewMode = (typeof LEAD_VIEW_MODES)[number];

export const leadFilterParsers = {
  view: parseAsStringLiteral(LEAD_VIEW_MODES).withDefault("table"),
  stageIds: parseAsArrayOf(parseAsString).withDefault([]),
  source: parseAsStringLiteral(LEAD_SOURCES),
  assignedTo: parseAsString,
  unassigned: parseAsBoolean,
  country: parseAsString,
  tagId: parseAsString,
  priority: parseAsStringLiteral(LEAD_PRIORITIES),
  utmCampaign: parseAsString,
  createdFrom: parseAsString,
  createdTo: parseAsString,
  inactiveDays: parseAsInteger,
  overdueFollowUp: parseAsBoolean,
  /** Preset saved-view id or system key */
  viewId: parseAsString,
  /** Open lead drawer without leaving the list URL state */
  leadId: parseAsString,
};

export type LeadFilters = Values<typeof leadFilterParsers>;

export function toLeadListQuery(
  params: TableUrlParams,
  filters: LeadFilters,
): LeadListQuery {
  const sort =
    params.sort &&
    (LEAD_SORT_FIELDS as readonly string[]).includes(params.sort)
      ? (params.sort as LeadListQuery["sort"])
      : "createdAt";

  const createdFrom = filters.createdFrom
    ? `${filters.createdFrom}T00:00:00.000Z`
    : undefined;
  const createdTo = filters.createdTo
    ? `${filters.createdTo}T23:59:59.999Z`
    : undefined;

  return {
    page: params.page,
    pageSize: params.pageSize,
    q: params.q || undefined,
    sort,
    order: params.order === "asc" ? "asc" : "desc",
    stageIds: filters.stageIds.length > 0 ? filters.stageIds : undefined,
    source: filters.source ?? undefined,
    assignedTo: filters.assignedTo ?? undefined,
    unassigned: filters.unassigned ?? undefined,
    country: filters.country ?? undefined,
    tagId: filters.tagId ?? undefined,
    priority: filters.priority ?? undefined,
    utmCampaign: filters.utmCampaign ?? undefined,
    createdFrom,
    createdTo,
    inactiveDays: filters.inactiveDays ?? undefined,
    overdueFollowUp: filters.overdueFollowUp ?? undefined,
  };
}

/** System presets applied as filter patches (not persisted SavedView rows) */
export const SYSTEM_LEAD_VIEWS = [
  { id: "all", title: "همه", patch: {} },
  { id: "mine", title: "لیدهای من", patch: { /* assignedTo filled at runtime */ } },
  {
    id: "unassigned",
    title: "بدون مسئول",
    patch: { unassigned: true as const, assignedTo: null },
  },
  {
    id: "followup-today",
    title: "پیگیری امروز",
    patch: { overdueFollowUp: true as const },
  },
  {
    id: "inactive-3d",
    title: "بدون فعالیت ۳ روز",
    patch: { inactiveDays: 3 },
  },
] as const;
