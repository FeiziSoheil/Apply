import {
  parseAsString,
  parseAsStringLiteral,
  type Values,
} from "nuqs";
import {
  BOOKING_SORT_FIELDS,
  BOOKING_STATUSES,
  CONSULTATION_TYPES,
  type BookingListQuery,
} from "@/contracts/bookings";
import type { TableUrlParams } from "@/components/admin/data-table/use-table-url-state";

export const bookingFilterParsers = {
  status: parseAsStringLiteral(BOOKING_STATUSES),
  consultantId: parseAsString,
  consultationType: parseAsStringLiteral(CONSULTATION_TYPES),
  from: parseAsString,
  to: parseAsString,
};

export type BookingFilters = Values<typeof bookingFilterParsers>;

export function toBookingListQuery(
  params: TableUrlParams,
  filters: BookingFilters,
): BookingListQuery {
  const sort =
    params.sort &&
    (BOOKING_SORT_FIELDS as readonly string[]).includes(params.sort)
      ? (params.sort as BookingListQuery["sort"])
      : "startsAt";

  return {
    page: params.page,
    pageSize: params.pageSize,
    q: params.q || undefined,
    sort,
    order: params.order === "asc" ? "asc" : "desc",
    status: filters.status ?? undefined,
    consultantId: filters.consultantId ?? undefined,
    consultationType: filters.consultationType ?? undefined,
    from: filters.from
      ? new Date(`${filters.from}T00:00:00+03:30`).toISOString()
      : undefined,
    to: filters.to
      ? new Date(`${filters.to}T23:59:59.999+03:30`).toISOString()
      : undefined,
  };
}
