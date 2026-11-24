"use client";

import { queryOptions, useQuery } from "@tanstack/react-query";
import type { StatsRangeDays } from "@/contracts/stats";
import type { ApiQueryOptions } from "@/lib/api/query-client";
import { statsApi } from "./api";
import { statsKeys } from "./keys";

export { statsKeys } from "./keys";

type AdminStats = Awaited<ReturnType<typeof statsApi.getAdmin>>;

export const statsQueries = {
  admin: (rangeDays: StatsRangeDays) =>
    queryOptions({
      queryKey: statsKeys.admin(rangeDays),
      queryFn: ({ signal }) => statsApi.getAdmin(rangeDays, { signal }),
    }),
};

export function useAdminStats(
  rangeDays: StatsRangeDays,
  options?: ApiQueryOptions<AdminStats>,
) {
  return useQuery({
    ...statsQueries.admin(rangeDays),
    ...options,
  });
}
