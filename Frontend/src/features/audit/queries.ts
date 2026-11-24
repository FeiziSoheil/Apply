"use client";

import { keepPreviousData, queryOptions, useQuery } from "@tanstack/react-query";
import { auditApi, type AuditLogListFilters } from "./api";
import { auditKeys } from "./keys";

export { auditKeys } from "./keys";

type QueryOpts = { enabled?: boolean };

export const auditQueries = {
  list: (filters?: AuditLogListFilters) =>
    queryOptions({
      queryKey: auditKeys.list(filters),
      queryFn: ({ signal }) => auditApi.list(filters, { signal }),
      placeholderData: keepPreviousData,
    }),
};

export function useAuditLogs(
  filters?: AuditLogListFilters,
  options?: QueryOpts,
) {
  return useQuery({ ...auditQueries.list(filters), ...options });
}
