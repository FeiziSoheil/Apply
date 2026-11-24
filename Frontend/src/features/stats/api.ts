import {
  adminStatsQuerySchema,
  adminStatsSchema,
  type StatsRangeDays,
} from "@/contracts/stats";
import { apiGet, type RequestOptions } from "@/lib/api/client";
import { validateRequest } from "@/lib/api/validate";

export const statsApi = {
  getAdmin(rangeDays: StatsRangeDays = 30, options?: RequestOptions) {
    return apiGet("/admin/stats", adminStatsSchema, {
      ...options,
      query: validateRequest(adminStatsQuerySchema, { rangeDays }),
    });
  },
};
