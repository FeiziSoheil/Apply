import type { QueryKey } from "@tanstack/react-query";
import type { StatsRangeDays } from "@/contracts/stats";

export const statsKeys = {
  all: ["stats"] as QueryKey,
  admin: (rangeDays: StatsRangeDays): QueryKey => ["stats", "admin", rangeDays],
} as const;
