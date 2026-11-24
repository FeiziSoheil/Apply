import {
  consultantsReportSchema,
  funnelReportSchema,
  reportRangeQuerySchema,
  sourcesReportSchema,
  ticketsReportSchema,
  timeseriesReportQuerySchema,
  timeseriesReportSchema,
} from "@/contracts/crm";
import { apiGet, type RequestOptions } from "@/lib/api/client";
import { validateRequest } from "@/lib/api/validate";
import type { z } from "zod";

export type ReportRangeFilters = z.input<typeof reportRangeQuerySchema>;
export type TimeseriesFilters = z.input<typeof timeseriesReportQuerySchema>;

export const reportsApi = {
  funnel(filters: ReportRangeFilters, options?: RequestOptions) {
    return apiGet("/reports/funnel", funnelReportSchema, {
      ...options,
      query: validateRequest(reportRangeQuerySchema, filters),
    });
  },

  consultants(filters: ReportRangeFilters, options?: RequestOptions) {
    return apiGet("/reports/consultants", consultantsReportSchema, {
      ...options,
      query: validateRequest(reportRangeQuerySchema, filters),
    });
  },

  sources(filters: ReportRangeFilters, options?: RequestOptions) {
    return apiGet("/reports/sources", sourcesReportSchema, {
      ...options,
      query: validateRequest(reportRangeQuerySchema, filters),
    });
  },

  timeseries(filters: TimeseriesFilters, options?: RequestOptions) {
    return apiGet("/reports/timeseries", timeseriesReportSchema, {
      ...options,
      query: validateRequest(timeseriesReportQuerySchema, filters),
    });
  },

  tickets(filters: ReportRangeFilters, options?: RequestOptions) {
    return apiGet("/reports/tickets", ticketsReportSchema, {
      ...options,
      query: validateRequest(reportRangeQuerySchema, filters),
    });
  },
};
