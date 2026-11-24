"use client";

import { keepPreviousData, queryOptions, useQuery } from "@tanstack/react-query";
import type { ApiQueryOptions } from "@/lib/api/query-client";
import {
  bookingsApi,
  type BookingListFilters,
  type SlotsParams,
} from "./api";
import { bookingKeys } from "./keys";

export { bookingKeys } from "./keys";

type BookingPage = Awaited<ReturnType<typeof bookingsApi.list>>;
type Booking = Awaited<ReturnType<typeof bookingsApi.get>>;
type Slots = Awaited<ReturnType<typeof bookingsApi.listSlots>>;

export const bookingQueries = {
  list: (filters?: BookingListFilters) =>
    queryOptions({
      queryKey: bookingKeys.list(filters),
      queryFn: ({ signal }) => bookingsApi.list(filters, { signal }),
    }),
  mine: (filters?: BookingListFilters) =>
    queryOptions({
      queryKey: bookingKeys.mine(filters),
      queryFn: ({ signal }) => bookingsApi.listMine(filters, { signal }),
    }),
  detail: (id: string) =>
    queryOptions({
      queryKey: bookingKeys.detail(id),
      queryFn: ({ signal }) => bookingsApi.get(id, { signal }),
    }),
  slots: (params: SlotsParams) =>
    queryOptions({
      queryKey: bookingKeys.slots(params),
      queryFn: ({ signal }) => bookingsApi.listSlots(params, { signal }),
      // Availability changes quickly — keep it fresher than the global default
      staleTime: 15_000,
    }),
  history: (id: string) =>
    queryOptions({
      queryKey: bookingKeys.history(id),
      queryFn: ({ signal }) => bookingsApi.history(id, { signal }),
    }),
};

export function useBookings(
  filters?: BookingListFilters,
  options?: ApiQueryOptions<BookingPage>,
) {
  return useQuery({
    ...bookingQueries.list(filters),
    placeholderData: keepPreviousData,
    ...options,
  });
}

export function useMyBookings(
  filters?: BookingListFilters,
  options?: ApiQueryOptions<BookingPage>,
) {
  return useQuery({
    ...bookingQueries.mine(filters),
    placeholderData: keepPreviousData,
    ...options,
  });
}

export function useBooking(id: string, options?: ApiQueryOptions<Booking>) {
  return useQuery({
    ...bookingQueries.detail(id),
    enabled: Boolean(id),
    ...options,
  });
}

/** Slots of one day; pass `enabled: false` until a date is chosen */
export function useBookingSlots(params: SlotsParams, options?: ApiQueryOptions<Slots>) {
  return useQuery({
    ...bookingQueries.slots(params),
    ...options,
  });
}

type History = Awaited<ReturnType<typeof bookingsApi.history>>;

export function useBookingHistory(
  id: string,
  options?: ApiQueryOptions<History>,
) {
  return useQuery({
    ...bookingQueries.history(id),
    enabled: Boolean(id),
    ...options,
  });
}
