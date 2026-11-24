"use client";

import { useQuery } from "@tanstack/react-query";
import { reportsApi, type ReportRangeFilters } from "./api";
import { reportKeys } from "./keys";

export function useFunnelReport(
  filters: ReportRangeFilters,
  options?: { enabled?: boolean },
) {
  return useQuery({
    queryKey: reportKeys.funnel(filters),
    queryFn: ({ signal }) => reportsApi.funnel(filters, { signal }),
    enabled: options?.enabled ?? true,
  });
}

export function useSourcesReport(
  filters: ReportRangeFilters,
  options?: { enabled?: boolean },
) {
  return useQuery({
    queryKey: reportKeys.sources(filters),
    queryFn: ({ signal }) => reportsApi.sources(filters, { signal }),
    enabled: options?.enabled ?? true,
  });
}

export function useConsultantsReport(
  filters: ReportRangeFilters,
  options?: { enabled?: boolean },
) {
  return useQuery({
    queryKey: reportKeys.consultants(filters),
    queryFn: ({ signal }) => reportsApi.consultants(filters, { signal }),
    enabled: options?.enabled ?? true,
  });
}

export function useTicketsReport(
  filters: ReportRangeFilters,
  options?: { enabled?: boolean },
) {
  return useQuery({
    queryKey: reportKeys.tickets(filters),
    queryFn: ({ signal }) => reportsApi.tickets(filters, { signal }),
    enabled: options?.enabled ?? true,
  });
}
