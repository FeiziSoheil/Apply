"use client";

import { queryOptions, useQuery } from "@tanstack/react-query";
import type { ApiQueryOptions } from "@/lib/api/query-client";
import { settingsApi } from "./api";
import { settingsKeys } from "./keys";

export { settingsKeys } from "./keys";

export const settingsQueries = {
  institute: () =>
    queryOptions({
      queryKey: settingsKeys.institute(),
      queryFn: ({ signal }) => settingsApi.getInstitute({ signal }),
    }),
};

type InstituteSettings = Awaited<ReturnType<typeof settingsApi.getInstitute>>;

export function useInstituteSettings(
  options?: ApiQueryOptions<InstituteSettings>,
) {
  return useQuery({
    ...settingsQueries.institute(),
    ...options,
  });
}
