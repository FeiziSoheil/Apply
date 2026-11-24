import type { ColumnDef } from "@tanstack/react-table";
import {
  PUBLICATION_STATUS_MAP,
  StatusBadge,
} from "@/components/admin/status-badge";
import type { BlogPost } from "@/contracts/content";
import { formatJalaliDate } from "@/lib/format";

/**
 * Columns of the blog posts table. Sortable keys match `BLOG_POST_SORT_FIELDS`.
 */
export const blogColumns: ColumnDef<BlogPost, unknown>[] = [
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
    id: "category",
    header: "دسته",
    cell: ({ row }) => row.original.category,
  },
  {
    id: "author",
    header: "نویسنده",
    cell: ({ row }) => row.original.author,
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
];
