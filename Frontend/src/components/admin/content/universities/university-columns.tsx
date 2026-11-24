import type { ColumnDef } from "@tanstack/react-table";
import {
  PUBLICATION_STATUS_MAP,
  StatusBadge,
} from "@/components/admin/status-badge";
import type { University } from "@/contracts/content";
import { formatNumber } from "@/lib/format";

/**
 * Columns of the universities table. Sortable keys match `UNIVERSITY_SORT_FIELDS`.
 */
export const universityColumns: ColumnDef<University, unknown>[] = [
  {
    id: "logo",
    header: "لوگو",
    enableHiding: false,
    meta: { label: "لوگو" },
    cell: ({ row }) => {
      const university = row.original;
      return (
        // eslint-disable-next-line @next/next/no-img-element -- admin list thumbnails; local/mock URLs
        <img
          src={university.logo}
          alt=""
          className="size-9 rounded-md border object-contain bg-muted/40"
        />
      );
    },
  },
  {
    accessorKey: "nameFa",
    header: "دانشگاه",
    enableSorting: true,
    enableHiding: false,
    meta: { mobile: "title" },
    cell: ({ row }) => {
      const university = row.original;
      return (
        <div className="flex min-w-0 flex-col">
          <span className="truncate font-medium">{university.nameFa}</span>
          <span className="truncate text-xs text-muted-foreground" dir="ltr">
            {university.nameEn}
          </span>
        </div>
      );
    },
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
    id: "city",
    header: "شهر",
    cell: ({ row }) => row.original.city,
  },
  {
    accessorKey: "ranking",
    header: "رتبه",
    enableSorting: true,
    cell: ({ row }) => (
      <span className="tabular-nums">{formatNumber(row.original.ranking)}</span>
    ),
  },
  {
    id: "programsCount",
    header: "برنامه‌ها",
    meta: { label: "تعداد برنامه" },
    cell: ({ row }) => (
      <span className="tabular-nums">
        {formatNumber(row.original.programsCount)}
      </span>
    ),
  },
  {
    id: "status",
    header: "وضعیت",
    meta: { label: "وضعیت انتشار" },
    cell: ({ row }) => (
      <StatusBadge status={row.original.status} map={PUBLICATION_STATUS_MAP} />
    ),
  },
];
