"use client";

import {
  keepPreviousData,
  queryOptions,
  useInfiniteQuery,
  useQuery,
} from "@tanstack/react-query";
import type { ApiQueryOptions } from "@/lib/api/query-client";
import {
  leadsApi,
  type ActivityListFilters,
  type LeadListFilters,
} from "./api";
import { leadKeys } from "./keys";

export { leadKeys } from "./keys";

export const leadQueries = {
  list: (filters?: LeadListFilters) =>
    queryOptions({
      queryKey: leadKeys.list(filters),
      queryFn: ({ signal }) => leadsApi.list(filters, { signal }),
    }),
  detail: (id: string) =>
    queryOptions({
      queryKey: leadKeys.detail(id),
      queryFn: ({ signal }) => leadsApi.get(id, { signal }),
    }),
  activities: (id: string, filters?: ActivityListFilters) =>
    queryOptions({
      queryKey: leadKeys.activities(id, filters),
      queryFn: ({ signal }) => leadsApi.listActivities(id, filters, { signal }),
    }),
  duplicates: (id: string) =>
    queryOptions({
      queryKey: [...leadKeys.detail(id), "duplicates"] as const,
      queryFn: ({ signal }) => leadsApi.listDuplicates(id, { signal }),
    }),
};

type LeadPage = Awaited<ReturnType<typeof leadsApi.list>>;
type Lead = Awaited<ReturnType<typeof leadsApi.get>>;
type ActivityPage = Awaited<ReturnType<typeof leadsApi.listActivities>>;

export function useLeads(
  filters?: LeadListFilters,
  options?: ApiQueryOptions<LeadPage>,
) {
  return useQuery({
    ...leadQueries.list(filters),
    placeholderData: keepPreviousData,
    ...options,
  });
}

export function useLead(id: string, options?: ApiQueryOptions<Lead>) {
  return useQuery({
    ...leadQueries.detail(id),
    enabled: Boolean(id),
    ...options,
  });
}

export function useLeadActivities(
  id: string,
  filters?: ActivityListFilters,
  options?: ApiQueryOptions<ActivityPage>,
) {
  return useQuery({
    ...leadQueries.activities(id, filters),
    enabled: Boolean(id),
    placeholderData: keepPreviousData,
    ...options,
  });
}

export function useLeadActivitiesInfinite(
  id: string,
  filters?: Omit<ActivityListFilters, "page" | "pageSize">,
) {
  return useInfiniteQuery({
    queryKey: [...leadKeys.leadActivities(id), "infinite", filters ?? {}] as const,
    initialPageParam: 1,
    enabled: Boolean(id),
    queryFn: ({ pageParam, signal }) =>
      leadsApi.listActivities(
        id,
        {
          ...filters,
          page: pageParam,
          pageSize: 30,
          sort: "createdAt",
          order: "desc",
        },
        { signal },
      ),
    getNextPageParam: (last) => {
      const { page, totalPages } = last.pagination;
      return page < totalPages ? page + 1 : undefined;
    },
  });
}

export function useLeadDuplicates(
  id: string,
  options?: { enabled?: boolean },
) {
  return useQuery({
    ...leadQueries.duplicates(id),
    enabled: Boolean(id) && (options?.enabled ?? true),
  });
}
