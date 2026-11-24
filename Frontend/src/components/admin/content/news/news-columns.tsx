import type { ColumnDef } from "@tanstack/react-table";
import {
  PUBLICATION_STATUS_MAP,
  StatusBadge,
} from "@/components/admin/status-badge";
import type { NewsItem } from "@/contracts/content";
import { formatJalaliDate } from "@/lib/format";
import { NEWS_EVENT_TYPE_OPTIONS } from "@/lib/validations/news";

const EVENT_LABEL = Object.fromEntries(
  NEWS_EVENT_TYPE_OPTIONS.map((option) => [option.value, option.label]),
) as Record<NewsItem["eventType"], string>;

export const newsColumns: ColumnDef<NewsItem, unknown>[] = [
  {
    accessorKey: "title",
    header: "عنوان",
    enableSorting: true,
    enableHiding: false,
    meta: { mobile: "title" },
    cell: ({ row }) => (
      <span className="line-clamp-2 font-medium">{row.original.title}</span>
    ),
  },
  {
    id: "eventType",
    header: "نوع",
    cell: ({ row }) => EVENT_LABEL[row.original.eventType] ?? row.original.eventType,
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
    id: "eventDate",
    header: "تاریخ رویداد",
    cell: ({ row }) =>
      row.original.eventDate
        ? formatJalaliDate(row.original.eventDate)
        : "—",
  },
  {
    accessorKey: "publishedAt",
    header: "تاریخ انتشار",
    enableSorting: true,
    cell: ({ row }) =>
      row.original.publishedAt
        ? formatJalaliDate(row.original.publishedAt)
        : "—",
  },
];
