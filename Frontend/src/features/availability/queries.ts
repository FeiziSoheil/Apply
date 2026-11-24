"use client";

import { queryOptions, useQuery } from "@tanstack/react-query";
import type { ApiQueryOptions } from "@/lib/api/query-client";
import { availabilityApi } from "./api";
import { availabilityKeys } from "./keys";

export { availabilityKeys } from "./keys";

type AvailabilityList = Awaited<ReturnType<typeof availabilityApi.list>>;
type Availability = Awaited<ReturnType<typeof availabilityApi.get>>;
type Holidays = Awaited<ReturnType<typeof availabilityApi.listHolidays>>;

export const availabilityQueries = {
  list: () =>
    queryOptions({
      queryKey: availabilityKeys.lists(),
      queryFn: ({ signal }) => availabilityApi.list({ signal }),
    }),
  detail: (consultantId: string) =>
    queryOptions({
      queryKey: availabilityKeys.detail(consultantId),
      queryFn: ({ signal }) => availabilityApi.get(consultantId, { signal }),
      enabled: Boolean(consultantId),
    }),
  holidays: () =>
    queryOptions({
      queryKey: availabilityKeys.holidays(),
      queryFn: ({ signal }) => availabilityApi.listHolidays({ signal }),
    }),
};

export function useAvailabilities(options?: ApiQueryOptions<AvailabilityList>) {
  return useQuery({ ...availabilityQueries.list(), ...options });
}

export function useAvailability(
  consultantId: string,
  options?: ApiQueryOptions<Availability>,
) {
  return useQuery({
    ...availabilityQueries.detail(consultantId),
    enabled: Boolean(consultantId),
    ...options,
  });
}

export function useGlobalHolidays(options?: ApiQueryOptions<Holidays>) {
  return useQuery({ ...availabilityQueries.holidays(), ...options });
}
