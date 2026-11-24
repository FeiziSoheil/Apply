"use client";

import type { ColumnDef } from "@tanstack/react-table";
import { COMMON_STATUS_MAP, StatusBadge } from "@/components/admin/status-badge";
import type { StaffUser } from "@/contracts/users";
import { ROLE_LABELS } from "@/lib/auth/role-labels";
import { formatJalaliDate } from "@/lib/format";

export function createUserColumns(): ColumnDef<StaffUser, unknown>[] {
  return [
    {
      accessorKey: "name",
      header: "نام",
      enableSorting: true,
      enableHiding: false,
      meta: { mobile: "title" },
    },
    {
      accessorKey: "email",
      header: "ایمیل",
      enableSorting: true,
      cell: ({ row }) => (
        <span dir="ltr" className="text-sm">
          {row.original.email}
        </span>
      ),
    },
    {
      accessorKey: "role",
      header: "نقش",
      enableSorting: true,
      cell: ({ row }) => ROLE_LABELS[row.original.role],
    },
    {
      accessorKey: "status",
      header: "وضعیت",
      enableSorting: true,
      cell: ({ row }) => (
        <StatusBadge status={row.original.status} map={COMMON_STATUS_MAP} />
      ),
    },
    {
      accessorKey: "lastLoginAt",
      header: "آخرین ورود",
      enableSorting: true,
      cell: ({ row }) =>
        row.original.lastLoginAt ? (
          <span className="tabular-nums text-sm">
            {formatJalaliDate(row.original.lastLoginAt, "d MMMM yyyy — HH:mm")}
          </span>
        ) : (
          <span className="text-muted-foreground">—</span>
        ),
    },
  ];
}
