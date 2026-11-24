"use client";

import Link from "next/link";
import type { ColumnDef } from "@tanstack/react-table";
import { StatusBadge } from "@/components/admin/status-badge";
import type { Ticket } from "@/contracts/tickets";
import { formatJalaliDate, formatRelativeFa, toPersianDigits } from "@/lib/format";
import { cn } from "@/lib/utils";
import {
  TICKET_CATEGORY_LABELS,
  TICKET_PRIORITY_MAP,
  TICKET_STATUS_MAP,
} from "./ticket-labels";

function slaLabel(ticket: Ticket): { text: string; overdue: boolean } {
  if (!ticket.slaDueAt || ticket.status === "closed") {
    return { text: "—", overdue: false };
  }
  const overdue = new Date(ticket.slaDueAt).getTime() < Date.now();
  if (ticket.firstResponseAt) {
    return { text: "پاسخ داده شد", overdue: false };
  }
  return {
    text: overdue
      ? `گذشته · ${formatRelativeFa(ticket.slaDueAt)}`
      : formatJalaliDate(ticket.slaDueAt, "d MMM HH:mm"),
    overdue,
  };
}

export const ticketColumns: ColumnDef<Ticket, unknown>[] = [
  {
    accessorKey: "code",
    header: "کد",
    enableSorting: false,
    enableHiding: false,
    meta: { mobile: "title" },
    cell: ({ row }) => (
      <Link
        href={`/admin/tickets/${row.original.id}`}
        className="font-medium tabular-nums text-primary underline-offset-2 hover:underline"
        dir="ltr"
      >
        {row.original.code}
      </Link>
    ),
  },
  {
    accessorKey: "subject",
    header: "موضوع",
    enableSorting: false,
    cell: ({ row }) => (
      <div className="min-w-0 space-y-0.5">
        <Link
          href={`/admin/tickets/${row.original.id}`}
          className="line-clamp-1 font-medium hover:underline"
        >
          {row.original.subject}
        </Link>
        {row.original.lastMessagePreview ? (
          <p className="line-clamp-1 text-xs text-muted-foreground">
            {row.original.lastMessagePreview}
          </p>
        ) : null}
      </div>
    ),
  },
  {
    id: "status",
    accessorKey: "status",
    header: "وضعیت",
    enableSorting: false,
    cell: ({ row }) => (
      <StatusBadge status={row.original.status} map={TICKET_STATUS_MAP} />
    ),
  },
  {
    id: "category",
    header: "دسته",
    enableSorting: false,
    meta: { mobile: "hidden" },
    cell: ({ row }) => TICKET_CATEGORY_LABELS[row.original.category],
  },
  {
    accessorKey: "createdByName",
    header: "دانشجو",
    enableSorting: false,
    cell: ({ row }) => row.original.createdByName,
  },
  {
    id: "priority",
    accessorKey: "priority",
    header: "اولویت",
    enableSorting: true,
    meta: { mobile: "hidden" },
    cell: ({ row }) => (
      <StatusBadge status={row.original.priority} map={TICKET_PRIORITY_MAP} />
    ),
  },
  {
    id: "sla",
    header: "SLA",
    enableSorting: true,
    accessorKey: "slaDueAt",
    cell: ({ row }) => {
      const sla = slaLabel(row.original);
      return (
        <span
          className={cn(
            "text-xs tabular-nums",
            sla.overdue && "font-medium text-destructive",
          )}
        >
          {sla.text}
        </span>
      );
    },
  },
  {
    accessorKey: "lastMessageAt",
    header: "آخرین پیام",
    enableSorting: true,
    meta: { mobile: "hidden" },
    cell: ({ row }) => (
      <span className="tabular-nums text-xs">
        {formatRelativeFa(row.original.lastMessageAt)}
      </span>
    ),
  },
  {
    accessorKey: "messageCount",
    header: "پیام",
    enableSorting: false,
    meta: { mobile: "hidden" },
    cell: ({ row }) => toPersianDigits(row.original.messageCount),
  },
];
