import {
  parseAsBoolean,
  parseAsString,
  parseAsStringLiteral,
  type Values,
} from "nuqs";
import type { TableUrlParams } from "@/components/admin/data-table/use-table-url-state";
import {
  TICKET_CATEGORIES,
  TICKET_PRIORITIES,
  TICKET_SORT_FIELDS,
  TICKET_STATUSES,
  type TicketListQuery,
} from "@/contracts/tickets";

export const TICKET_INBOX_TABS = ["me", "unassigned", "all"] as const;
export type TicketInboxTab = (typeof TICKET_INBOX_TABS)[number];

export const ticketFilterParsers = {
  status: parseAsStringLiteral(TICKET_STATUSES),
  category: parseAsStringLiteral(TICKET_CATEGORIES),
  priority: parseAsStringLiteral(TICKET_PRIORITIES),
  assignee: parseAsString,
  unanswered: parseAsBoolean,
  slaOverdue: parseAsBoolean,
  tab: parseAsStringLiteral(TICKET_INBOX_TABS).withDefault("all"),
};

export type TicketFilters = Values<typeof ticketFilterParsers>;

export function toTicketListQuery(
  params: TableUrlParams,
  filters: TicketFilters,
  currentUserId: string | null,
): TicketListQuery {
  const sort =
    params.sort &&
    (TICKET_SORT_FIELDS as readonly string[]).includes(params.sort)
      ? (params.sort as TicketListQuery["sort"])
      : "lastMessageAt";

  const tab = filters.tab ?? "all";
  let assignedTo = filters.assignee || undefined;
  let unassigned: boolean | undefined;

  if (tab === "me" && currentUserId) {
    assignedTo = currentUserId;
  } else if (tab === "unassigned") {
    unassigned = true;
    assignedTo = undefined;
  }

  return {
    page: params.page,
    pageSize: params.pageSize,
    q: params.q || undefined,
    sort,
    order: params.order === "asc" ? "asc" : "desc",
    status: filters.status ?? undefined,
    category: filters.category ?? undefined,
    priority: filters.priority ?? undefined,
    assignedTo,
    unassigned: unassigned || undefined,
    unanswered: filters.unanswered || undefined,
    slaOverdue: filters.slaOverdue || undefined,
  };
}
