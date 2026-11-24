import type { QueryKey } from "@tanstack/react-query";
import { createEntityKeys } from "@/lib/api/query-keys";
import type { BookingListQuery, SlotsQuery } from "@/contracts/bookings";

const base = createEntityKeys<Partial<BookingListQuery>>(["bookings"]);

export const bookingKeys = {
  ...base,
  /** Bookings of the current student (`GET /me/bookings`) */
  mine: (filters?: Partial<BookingListQuery>): QueryKey =>
    ["bookings", "mine", filters ?? {}],
  slots: (query?: Partial<SlotsQuery>): QueryKey =>
    ["bookings", "slots", query ?? {}],
  allSlots: (): QueryKey => ["bookings", "slots"],
  history: (id: string): QueryKey => ["bookings", "history", id],
} as const;
