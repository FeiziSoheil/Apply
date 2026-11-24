import type { ColumnDef } from "@tanstack/react-table";
import {
  PUBLICATION_STATUS_MAP,
  StatusBadge,
} from "@/components/admin/status-badge";
import type { Program, PublicationStatus } from "@/contracts/content";
import { DEGREE_LEVEL_LABELS } from "@/lib/degree-levels";
import { formatJalaliDate, formatNumber } from "@/lib/format";

/**
 * Columns of the programs table. Sortable keys match `PROGRAM_SORT_FIELDS`.
 */
export const programColumns: ColumnDef<Program, unknown>[] = [
  {
    accessorKey: "nameFa",
    header: "برنامه",
    enableSorting: true,
    enableHiding: false,
    meta: { mobile: "title" },
    cell: ({ row }) => (
      <div className="flex min-w-0 flex-col">
        <span className="truncate font-medium">{row.original.nameFa}</span>
        <span className="truncate text-xs text-muted-foreground" dir="ltr">
          {row.original.slug}
        </span>
      </div>
    ),
  },
  {
    id: "universitySlug",
    header: "دانشگاه",
    cell: ({ row }) => (
      <span className="font-mono text-xs" dir="ltr">
        {row.original.universitySlug}
      </span>
    ),
  },
  {
    id: "countrySlug",
    header: "کشور",
    cell: ({ row }) => (
      <span className="font-mono text-xs" dir="ltr">
        {row.original.countrySlug}
      </span>
    ),
  },
  {
    id: "degreeLevel",
    header: "مقطع",
    cell: ({ row }) => DEGREE_LEVEL_LABELS[row.original.degreeLevel],
  },
  {
    id: "field",
    header: "رشته",
    cell: ({ row }) => row.original.field,
  },
  {
    accessorKey: "tuition",
    header: "شهریه",
    enableSorting: true,
    cell: ({ row }) => (
      <span className="tabular-nums">
        {formatNumber(row.original.tuition)}{" "}
        <span className="text-xs text-muted-foreground">
          {row.original.currency}
        </span>
      </span>
    ),
  },
  {
    id: "hasScholarship",
    header: "بورسیه",
    cell: ({ row }) => (row.original.hasScholarship ? "دارد" : "ندارد"),
  },
  {
    accessorKey: "deadline",
    header: "ددلاین",
    enableSorting: true,
    cell: ({ row }) => (
      <span className="tabular-nums">
        {formatJalaliDate(row.original.deadline)}
      </span>
    ),
  },
  {
    id: "status",
    header: "وضعیت",
    meta: { label: "وضعیت انتشار" },
    cell: ({ row }) => {
      const status = (row.original.status ?? "published") as PublicationStatus;
      return <StatusBadge status={status} map={PUBLICATION_STATUS_MAP} />;
    },
  },
];
