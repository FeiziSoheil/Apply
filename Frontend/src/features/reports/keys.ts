import type { ReportRangeFilters, TimeseriesFilters } from "./api";

export const reportKeys = {
  all: ["reports"] as const,
  funnel: (filters: ReportRangeFilters) =>
    [...reportKeys.all, "funnel", filters] as const,
  consultants: (filters: ReportRangeFilters) =>
    [...reportKeys.all, "consultants", filters] as const,
  sources: (filters: ReportRangeFilters) =>
    [...reportKeys.all, "sources", filters] as const,
  timeseries: (filters: TimeseriesFilters) =>
    [...reportKeys.all, "timeseries", filters] as const,
  tickets: (filters: ReportRangeFilters) =>
    [...reportKeys.all, "tickets", filters] as const,
};
