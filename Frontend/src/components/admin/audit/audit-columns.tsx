import Link from "next/link";
import type { ColumnDef } from "@tanstack/react-table";
import type { AuditLog } from "@/contracts/crm";
import {
  AUDIT_ACTION_LABELS,
  AUDIT_ENTITY_TYPE_LABELS,
  auditEntityHref,
} from "@/lib/crm/audit-labels";
import { formatJalaliDate } from "@/lib/format";

function summarizeDiff(log: AuditLog): string {
  if (!log.diff) return "—";
  const keys = [
    ...new Set([
      ...Object.keys(log.diff.before ?? {}),
      ...Object.keys(log.diff.after ?? {}),
    ]),
  ];
  if (keys.length === 0) return "—";
  return keys.slice(0, 4).join("، ");
}

/** Columns for the audit log table; actor names come from the staff map. */
export function createAuditColumns(
  usersById: Map<string, string>,
): ColumnDef<AuditLog, unknown>[] {
  return [
    {
      accessorKey: "createdAt",
      header: "زمان",
      enableSorting: true,
      enableHiding: false,
      meta: { mobile: "title", label: "زمان" },
      cell: ({ row }) => (
        <span className="whitespace-nowrap tabular-nums">
          {formatJalaliDate(row.original.createdAt, "d MMM yyyy — HH:mm")}
        </span>
      ),
    },
    {
      id: "actor",
      header: "کاربر",
      cell: ({ row }) =>
        row.original.actorId
          ? (usersById.get(row.original.actorId) ?? "کاربر")
          : "سیستم",
    },
    {
      id: "action",
      header: "عملیات",
      cell: ({ row }) => AUDIT_ACTION_LABELS[row.original.action],
    },
    {
      id: "entityType",
      header: "موجودیت",
      cell: ({ row }) => {
        const log = row.original;
        const label =
          AUDIT_ENTITY_TYPE_LABELS[log.entityType] ?? log.entityType;
        const href = auditEntityHref(log.entityType, log.entityId);
        if (!href) return label;
        return (
          <Link
            href={href}
            className="text-primary underline-offset-2 hover:underline"
            onClick={(event) => event.stopPropagation()}
          >
            {label}
          </Link>
        );
      },
    },
    {
      id: "diffSummary",
      header: "خلاصه تغییر",
      meta: { label: "خلاصه تغییر" },
      cell: ({ row }) => (
        <span className="max-w-xs truncate text-muted-foreground">
          {summarizeDiff(row.original)}
        </span>
      ),
    },
  ];
}
