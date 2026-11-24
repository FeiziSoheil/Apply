"use client";

import type { ColumnDef } from "@tanstack/react-table";
import { StatusBadge } from "@/components/admin/status-badge";
import type { Booking } from "@/contracts/bookings";
import { formatJalaliDate, toPersianDigits } from "@/lib/format";
import {
  BOOKING_STATUS_MAP,
  CONSULTATION_TYPE_LABELS,
} from "./booking-labels";

export type BookingColumnContext = {
  consultantName: (id: string | null) => string;
};

export function createBookingColumns(
  ctx: BookingColumnContext,
): ColumnDef<Booking, unknown>[] {
  return [
    {
      accessorKey: "code",
      header: "کد",
      enableSorting: false,
      enableHiding: false,
      meta: { mobile: "title" },
      cell: ({ row }) => (
        <span className="font-medium tabular-nums" dir="ltr">
          {row.original.code}
        </span>
      ),
    },
    {
      accessorKey: "name",
      header: "نام",
      enableSorting: false,
    },
    {
      accessorKey: "mobile",
      header: "موبایل",
      enableSorting: false,
      cell: ({ row }) => (
        <span dir="ltr" className="tabular-nums">
          {toPersianDigits(row.original.mobile)}
        </span>
      ),
    },
    {
      id: "consultationType",
      header: "نوع",
      cell: ({ row }) =>
        CONSULTATION_TYPE_LABELS[row.original.consultationType],
    },
    {
      id: "consultantId",
      header: "مشاور",
      cell: ({ row }) => ctx.consultantName(row.original.consultantId),
    },
    {
      accessorKey: "startsAt",
      header: "زمان",
      enableSorting: true,
      cell: ({ row }) => (
        <span className="tabular-nums">
          {formatJalaliDate(row.original.startsAt, "EEEE d MMMM yyyy — HH:mm")}
        </span>
      ),
    },
    {
      id: "status",
      header: "وضعیت",
      cell: ({ row }) => (
        <StatusBadge status={row.original.status} map={BOOKING_STATUS_MAP} />
      ),
    },
  ];
}
