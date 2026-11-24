import {
  parseAsString,
  parseAsStringLiteral,
  type Values,
} from "nuqs";
import {
  AUDIT_ACTIONS,
  type AuditLogListQuery,
} from "@/contracts/crm";
import type { TableUrlParams } from "@/components/admin/data-table/use-table-url-state";

const AUDIT_SORT_FIELDS = ["createdAt"] as const;

export const auditFilterParsers = {
  actorId: parseAsString,
  action: parseAsStringLiteral(AUDIT_ACTIONS),
  entityType: parseAsString,
  from: parseAsString,
  to: parseAsString,
};

export type AuditFilters = Values<typeof auditFilterParsers>;

export function toAuditListQuery(
  params: TableUrlParams,
  filters: AuditFilters,
): AuditLogListQuery {
  const sort =
    params.sort &&
    (AUDIT_SORT_FIELDS as readonly string[]).includes(params.sort)
      ? (params.sort as AuditLogListQuery["sort"])
      : "createdAt";

  return {
    page: params.page,
    pageSize: params.pageSize,
    q: params.q || undefined,
    sort,
    order: params.sort ? params.order : "desc",
    actorId: filters.actorId ?? undefined,
    action: filters.action ?? undefined,
    entityType: filters.entityType ?? undefined,
    from: filters.from
      ? new Date(`${filters.from}T00:00:00+03:30`).toISOString()
      : undefined,
    to: filters.to
      ? new Date(`${filters.to}T23:59:59.999+03:30`).toISOString()
      : undefined,
  };
}
