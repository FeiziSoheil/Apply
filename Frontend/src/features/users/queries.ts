"use client";

import { keepPreviousData, queryOptions, useQuery } from "@tanstack/react-query";
import type { ApiQueryOptions } from "@/lib/api/query-client";
import { usersApi, type StaffUserListFilters } from "./api";
import { userKeys } from "./keys";

export { userKeys } from "./keys";

export const userQueries = {
  list: (filters?: StaffUserListFilters) =>
    queryOptions({
      queryKey: userKeys.list(filters),
      queryFn: ({ signal }) => usersApi.list(filters, { signal }),
    }),
  sessions: () =>
    queryOptions({
      queryKey: userKeys.sessions(),
      queryFn: ({ signal }) => usersApi.listMySessions({ signal }),
    }),
};

type StaffPage = Awaited<ReturnType<typeof usersApi.list>>;
type Sessions = Awaited<ReturnType<typeof usersApi.listMySessions>>;

export function useStaffUsers(
  filters?: StaffUserListFilters,
  options?: ApiQueryOptions<StaffPage>,
) {
  return useQuery({
    ...userQueries.list(filters),
    placeholderData: keepPreviousData,
    ...options,
  });
}

export function useMySessions(options?: ApiQueryOptions<Sessions>) {
  return useQuery({
    ...userQueries.sessions(),
    ...options,
  });
}
