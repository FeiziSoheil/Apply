import type { AuditLogListFilters } from "./api";

export const auditKeys = {
  all: ["audit-logs"] as const,
  list: (filters?: AuditLogListFilters) =>
    [...auditKeys.all, "list", filters ?? {}] as const,
};
