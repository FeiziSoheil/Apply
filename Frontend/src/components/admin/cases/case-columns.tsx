"use client";

import type { ColumnDef } from "@tanstack/react-table";
import Link from "next/link";
import { StatusBadge } from "@/components/admin/status-badge";
import { Badge } from "@/components/ui/badge";
import type { StudentCase } from "@/contracts/students";
import {
  formatJalaliDate,
  formatRelativeFa,
  toPersianDigits,
} from "@/lib/format";
import { CASE_STAGE_LABELS, CASE_STATUS_MAP } from "./case-labels";

export const caseColumns: ColumnDef<StudentCase, unknown>[] = [
  {
    accessorKey: "studentName",
    header: "دانشجو",
    enableSorting: false,
    enableHiding: false,
    meta: { mobile: "title" },
    cell: ({ row }) => (
      <div className="min-w-0">
        <Link
          href={`/admin/cases/${row.original.id}`}
          className="text-primary font-medium hover:underline"
        >
          {row.original.studentName}
        </Link>
        <p className="text-muted-foreground text-xs tabular-nums" dir="ltr">
          {row.original.code}
        </p>
      </div>
    ),
  },
  {
    accessorKey: "targetCountry",
    header: "کشور",
    enableSorting: false,
    cell: ({ row }) => (
      <span dir="ltr" className="text-muted-foreground">
        {row.original.targetCountry}
      </span>
    ),
  },
  {
    id: "currentStage",
    accessorKey: "currentStage",
    header: "مرحله",
    enableSorting: true,
    cell: ({ row }) => CASE_STAGE_LABELS[row.original.currentStage],
  },
  {
    id: "progressPercent",
    accessorKey: "progressPercent",
    header: "پیشرفت",
    enableSorting: true,
    cell: ({ row }) => {
      const value = row.original.progressPercent ?? 0;
      return (
        <div className="flex min-w-24 flex-col gap-1">
          <div className="bg-muted h-1.5 overflow-hidden rounded-full">
            <div
              className="bg-primary h-full rounded-full transition-[inline-size]"
              style={{ inlineSize: `${value}%` }}
            />
          </div>
          <span className="text-muted-foreground text-xs tabular-nums">
            {toPersianDigits(value)}٪
          </span>
        </div>
      );
    },
  },
  {
    id: "docs",
    header: "مدارک",
    enableSorting: false,
    meta: { mobile: "hidden" },
    cell: ({ row }) => {
      const incomplete = row.original.incompleteDocsCount ?? 0;
      const pending = row.original.pendingReviewDocsCount ?? 0;
      return (
        <div className="flex flex-wrap gap-1">
          {incomplete > 0 ? (
            <Badge variant="outline" className="tabular-nums">
              ناقص {toPersianDigits(incomplete)}
            </Badge>
          ) : null}
          {pending > 0 ? (
            <Badge variant="secondary" className="tabular-nums">
              بررسی {toPersianDigits(pending)}
            </Badge>
          ) : null}
          {incomplete === 0 && pending === 0 ? (
            <span className="text-muted-foreground text-xs">—</span>
          ) : null}
        </div>
      );
    },
  },
  {
    id: "assignee",
    header: "مسئول",
    enableSorting: false,
    cell: ({ row }) =>
      row.original.assigneeName ?? (
        <span className="text-muted-foreground">بدون مسئول</span>
      ),
  },
  {
    id: "nearestDeadline",
    accessorKey: "nearestDeadline",
    header: "ددلاین نزدیک",
    enableSorting: true,
    meta: { mobile: "hidden" },
    cell: ({ row }) => {
      const deadline = row.original.nearestDeadline;
      if (!deadline) {
        return <span className="text-muted-foreground">—</span>;
      }
      return (
        <span className="tabular-nums">
          {formatJalaliDate(`${deadline}T12:00:00.000Z`, "d MMM yyyy")}
        </span>
      );
    },
  },
  {
    id: "lastActivityAt",
    accessorKey: "lastActivityAt",
    header: "آخرین فعالیت",
    enableSorting: true,
    meta: { mobile: "hidden" },
    cell: ({ row }) => {
      const at = row.original.lastActivityAt;
      if (!at) {
        return <span className="text-muted-foreground">بدون فعالیت</span>;
      }
      return (
        <span className="text-muted-foreground text-xs" title={formatJalaliDate(at)}>
          {formatRelativeFa(at)}
        </span>
      );
    },
  },
  {
    id: "status",
    accessorKey: "status",
    header: "وضعیت",
    enableSorting: false,
    meta: { mobile: "hidden" },
    cell: ({ row }) => (
      <StatusBadge status={row.original.status} map={CASE_STATUS_MAP} />
    ),
  },
];
