import type { ColumnDef } from "@tanstack/react-table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { FinanceTransaction } from "@/contracts/payments";
import { formatJalaliDate, formatMoney } from "@/lib/format";
import { Eye } from "lucide-react";

export const METHOD_LABELS: Record<string, string> = {
  gateway: "درگاه آنلاین",
  card_to_card: "کارت‌به‌کارت",
  bank_transfer: "حواله بانکی",
  cash: "نقدی",
};

export const STATUS_MAP: Record<
  string,
  { label: string; variant: "default" | "secondary" | "destructive" | "outline" }
> = {
  succeeded: { label: "موفق", variant: "default" },
  paid: { label: "موفق", variant: "default" },
  awaiting_verification: { label: "در انتظار تأیید", variant: "secondary" },
  failed: { label: "ناموفق", variant: "destructive" },
  cancelled: { label: "لغوشده", variant: "outline" },
  initiated: { label: "در حال پردازش", variant: "outline" },
};

export function getTransactionColumns(
  onViewReceipt?: (fileId: string, title: string) => void,
): ColumnDef<FinanceTransaction, unknown>[] {
  return [
    {
      accessorKey: "code",
      header: "کد تراکنش",
      enableSorting: false,
      cell: ({ row }) => (
        <span className="font-medium tabular-nums" dir="ltr">
          {row.original.code}
        </span>
      ),
    },
    {
      accessorKey: "studentName",
      header: "دانشجو",
      enableSorting: false,
      cell: ({ row }) => (
        <span className="font-semibold">{row.original.studentName}</span>
      ),
    },
    {
      accessorKey: "installmentTitle",
      header: "قسط",
      enableSorting: false,
      cell: ({ row }) => (
        <span>{row.original.installmentTitle || "—"}</span>
      ),
    },
    {
      accessorKey: "amount",
      header: "مبلغ",
      enableSorting: true,
      cell: ({ row }) => (
        <span className="font-bold tabular-nums">
          {formatMoney(row.original.amount)}
        </span>
      ),
    },
    {
      accessorKey: "method",
      header: "روش",
      enableSorting: false,
      cell: ({ row }) => (
        <span>
          {row.original.method
            ? METHOD_LABELS[row.original.method] ?? row.original.method
            : "—"}
        </span>
      ),
    },
    {
      accessorKey: "status",
      header: "وضعیت",
      enableSorting: false,
      cell: ({ row }) => {
        const item = STATUS_MAP[row.original.status] ?? {
          label: row.original.status,
          variant: "outline" as const,
        };
        return (
          <Badge
            variant={item.variant}
            className={
              row.original.status === "succeeded" ||
              row.original.status === "paid"
                ? "bg-emerald-600 text-white"
                : row.original.status === "awaiting_verification"
                  ? "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300"
                  : ""
            }
          >
            {item.label}
          </Badge>
        );
      },
    },
    {
      accessorKey: "occurredAt",
      header: "تاریخ",
      enableSorting: true,
      cell: ({ row }) => (
        <span className="text-xs text-muted-foreground tabular-nums">
          {formatJalaliDate(row.original.occurredAt, "yyyy/MM/dd HH:mm")}
        </span>
      ),
    },
    {
      id: "receipt",
      header: "رسید",
      enableSorting: false,
      cell: ({ row }) => {
        const receiptFileId = row.original.receiptFileId;
        if (!receiptFileId) return <span className="text-muted-foreground">—</span>;
        return (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="h-7 gap-1 text-xs"
            onClick={() =>
              onViewReceipt?.(
                receiptFileId,
                `رسید تراکنش ${row.original.studentName}`,
              )
            }
          >
            <Eye className="size-3.5" />
            مشاهده
          </Button>
        );
      },
    },
  ];
}
