import type { QueryKey } from "@tanstack/react-query";
import { createEntityKeys } from "@/lib/api/query-keys";
import type { StaffUserListFilters } from "./api";

const base = createEntityKeys<StaffUserListFilters>(["users"]);

export const userKeys = {
  ...base,
  sessions: (): QueryKey => ["users", "sessions"],
} as const;
