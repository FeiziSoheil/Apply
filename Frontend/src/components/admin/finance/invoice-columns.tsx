import type { ColumnDef } from "@tanstack/react-table";
import { StatusBadge } from "@/components/admin/status-badge";
import type { Invoice } from "@/contracts/payments";
import { formatJalaliDate, formatMoney } from "@/lib/format";
import { INVOICE_STATUS_MAP } from "./invoice-labels";

export const invoiceColumns: ColumnDef<Invoice, unknown>[] = [
  {
    accessorKey: "number",
    header: "شماره",
    enableSorting: false,
    enableHiding: false,
    meta: { mobile: "title" },
    cell: ({ row }) => (
      <span className="font-medium tabular-nums" dir="ltr">
        {row.original.number}
      </span>
    ),
  },
  {
    accessorKey: "title",
    header: "عنوان",
    enableSorting: false,
  },
  {
    id: "status",
    accessorKey: "status",
    header: "وضعیت",
    enableSorting: false,
    cell: ({ row }) => (
      <StatusBadge status={row.original.status} map={INVOICE_STATUS_MAP} />
    ),
  },
  {
    accessorKey: "total",
    header: "مبلغ",
    enableSorting: true,
    cell: ({ row }) => (
      <span className="tabular-nums">{formatMoney(row.original.total)}</span>
    ),
  },
  {
    accessorKey: "paidAmount",
    header: "پرداخت‌شده",
    enableSorting: false,
    meta: { mobile: "hidden" },
    cell: ({ row }) => (
      <span className="tabular-nums">
        {formatMoney(row.original.paidAmount)}
      </span>
    ),
  },
  {
    accessorKey: "issuedAt",
    header: "صدور",
    enableSorting: true,
    meta: { mobile: "hidden" },
    cell: ({ row }) => (
      <span className="tabular-nums">
        {formatJalaliDate(row.original.issuedAt, "d MMMM yyyy")}
      </span>
    ),
  },
];
