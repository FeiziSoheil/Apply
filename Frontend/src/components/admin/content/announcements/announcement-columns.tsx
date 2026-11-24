import type { ColumnDef } from "@tanstack/react-table";
import {
  PUBLICATION_STATUS_MAP,
  StatusBadge,
} from "@/components/admin/status-badge";
import type { Announcement } from "@/contracts/student-panel";
import { formatJalaliDate } from "@/lib/format";

function audienceLabel(item: Announcement): string {
  if (item.audience.allStudents) return "همه دانشجویان";
  const slugs = item.audience.countrySlugs;
  if (slugs.length === 0) return "—";
  if (slugs.length <= 2) return slugs.join("، ");
  return `${slugs.slice(0, 2).join("، ")} و ${slugs.length - 2} کشور دیگر`;
}

export const announcementColumns: ColumnDef<Announcement, unknown>[] = [
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
    id: "audience",
    header: "مخاطب",
    cell: ({ row }) => (
      <span className="text-muted-foreground text-sm">
        {audienceLabel(row.original)}
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
  {
    accessorKey: "publishedAt",
    header: "تاریخ انتشار",
    enableSorting: true,
    cell: ({ row }) =>
      row.original.publishedAt
        ? formatJalaliDate(row.original.publishedAt)
        : "—",
  },
  {
    accessorKey: "updatedAt",
    header: "آخرین ویرایش",
    enableSorting: true,
    cell: ({ row }) => formatJalaliDate(row.original.updatedAt),
  },
];
