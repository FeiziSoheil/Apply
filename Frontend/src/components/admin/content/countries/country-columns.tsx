import type { ColumnDef } from "@tanstack/react-table";
import {
  PUBLICATION_STATUS_MAP,
  StatusBadge,
  type StatusMap,
} from "@/components/admin/status-badge";
import type { Country, CostBand } from "@/contracts/content";
import { CONTINENT_LABELS } from "@/lib/continents";
import { formatJalaliDate, formatNumber } from "@/lib/format";

/** Cost band → label & color (cheap = green, expensive = red) */
export const COST_BAND_STATUS_MAP: StatusMap<CostBand> = {
  low: { label: "ارزان", tone: "success" },
  medium: { label: "متوسط", tone: "warning" },
  high: { label: "گران", tone: "danger" },
};

/**
 * Columns of the countries table. A column whose key matches an API sort
 * field (`COUNTRY_SORT_FIELDS`) and has `enableSorting: true` is sortable.
 * Sortable columns need an `accessorKey` (TanStack requires an accessor to sort).
 * String headers get the sort button automatically; `meta.label` names the
 * column in the visibility menu and on mobile cards.
 */
export const countryColumns: ColumnDef<Country, unknown>[] = [
  {
    accessorKey: "nameFa",
    header: "کشور",
    enableSorting: true,
    enableHiding: false,
    meta: { mobile: "title" },
    cell: ({ row }) => {
      const country = row.original;
      return (
        <div className="flex items-center gap-2">
          <span className="text-xl leading-none" aria-hidden>
            {country.flagEmoji ?? "🏳️"}
          </span>
          <div className="flex min-w-0 flex-col">
            <span className="truncate font-medium">{country.nameFa}</span>
            <span className="truncate text-xs text-muted-foreground" dir="ltr">
              {country.nameEn}
            </span>
          </div>
        </div>
      );
    },
  },
  {
    id: "continent",
    header: "قاره",
    cell: ({ row }) => CONTINENT_LABELS[row.original.continent],
  },
  {
    id: "costBand",
    header: "سطح هزینه",
    cell: ({ row }) => (
      <StatusBadge status={row.original.costBand} map={COST_BAND_STATUS_MAP} />
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
  {
    accessorKey: "costOfLiving",
    header: "هزینه زندگی (ماهانه)",
    enableSorting: true,
    meta: { label: "هزینه زندگی" },
    cell: ({ row }) => (
      <span className="tabular-nums">
        {formatNumber(row.original.costOfLiving)}{" "}
        <span className="text-xs text-muted-foreground">
          {row.original.currency}
        </span>
      </span>
    ),
  },
  {
    id: "language",
    header: "زبان تحصیل",
    cell: ({ row }) => row.original.language,
  },
  {
    accessorKey: "createdAt",
    header: "تاریخ ایجاد",
    enableSorting: true,
    cell: ({ row }) => (
      <span className="tabular-nums">
        {formatJalaliDate(row.original.createdAt)}
      </span>
    ),
  },
];
