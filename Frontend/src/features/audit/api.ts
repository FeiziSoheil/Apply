import {
  auditLogListQuerySchema,
  auditLogSchema,
} from "@/contracts/crm";
import { z } from "@/contracts/zod";
import {
  apiGet,
  apiGetPage,
  type RequestOptions,
} from "@/lib/api/client";
import type { ListFilters } from "@/lib/api/types";

export type AuditLogListFilters = ListFilters<typeof auditLogListQuerySchema>;

export const auditApi = {
  list(filters?: AuditLogListFilters, options?: RequestOptions) {
    return apiGetPage("/audit-logs", auditLogSchema, {
      ...options,
      query: filters,
    });
  },

  exportCsv(filters?: AuditLogListFilters, options?: RequestOptions) {
    return apiGet("/audit-logs/export", z.string(), {
      ...options,
      query: filters,
    });
  },
};
