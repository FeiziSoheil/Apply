"use client";

import { useMemo, useState } from "react";
import { toast } from "sonner";
import {
  CheckCircle2,
  Clock,
  Download,
  Eye,
  FileSpreadsheet,
  FileText,
  ShieldCheck,
  XCircle,
} from "lucide-react";
import { DataTable } from "@/components/admin/data-table/data-table";
import {
  DateRangeFilter,
  SelectFilter,
} from "@/components/admin/data-table/filters";
import { RowActionsMenu } from "@/components/admin/data-table/row-actions-menu";
import { useTableUrlState } from "@/components/admin/data-table/use-table-url-state";
import { FileViewer } from "@/components/admin/cases/file-viewer";
import {
  FormInputField,
  FormSelectField,
  FormTextareaField,
} from "@/components/forms";
import { PageContainer } from "@/components/panel/page-container";
import { PageHeader } from "@/components/panel/page-header";
import { Can } from "@/components/rbac/can";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DropdownMenuItem } from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Form } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type {
  FinanceTransaction,
  Invoice,
  PaymentStatus,
} from "@/contracts/payments";
import {
  useCancelInvoice,
  useMarkInstallmentPaid,
  useVerifyPaymentAttempt,
} from "@/features/payments/mutations";
import {
  useFinanceReport,
  useFinanceSummary,
  useFinanceTransactions,
  useInvoices,
} from "@/features/payments/queries";
import { paymentsApi } from "@/features/payments/api";
import { getApiErrorMessage } from "@/lib/api";
import { resolveFileUrl } from "@/lib/files/resolve-file-url";
import {
  formatJalaliDate,
  formatMoney,
  toPersianDigits,
} from "@/lib/format";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { invoiceColumns } from "./invoice-columns";
import { INVOICE_STATUS_FILTER_OPTIONS } from "./invoice-labels";
import {
  invoiceFilterParsers,
  toInvoiceListQuery,
  txFilterParsers,
  toFinanceTransactionListQuery,
} from "./finance-table-params";
import { getTransactionColumns } from "./transaction-columns";

const TX_METHOD_FILTER_OPTIONS = [
  { value: "gateway", label: "درگاه آنلاین" },
  { value: "card_to_card", label: "کارت‌به‌کارت" },
  { value: "bank_transfer", label: "حواله بانکی" },
  { value: "cash", label: "نقدی" },
] as const;

const TX_STATUS_FILTER_OPTIONS = [
  { value: "succeeded", label: "موفق" },
  { value: "awaiting_verification", label: "در انتظار تأیید" },
  { value: "failed", label: "ناموفق" },
  { value: "cancelled", label: "لغوشده" },
] as const;

const cancelSchema = z.object({
  reason: z
    .string()
    .trim()
    .min(3, "دلیل لغو حداقل ۳ نویسه باشد")
    .max(500),
});

const markPaidSchema = z.object({
  paymentMethod: z.enum(["card_to_card", "bank_transfer", "cash"]),
  paymentRef: z.string().trim().max(120).optional().or(z.literal("")),
});

const rejectSchema = z.object({
  note: z
    .string()
    .trim()
    .min(3, "دلیل رد الزامی است (حداقل ۳ نویسه)")
    .max(500),
});

type CancelValues = z.infer<typeof cancelSchema>;
type MarkPaidValues = z.infer<typeof markPaidSchema>;
type RejectValues = z.infer<typeof rejectSchema>;

function getPastDaysIso(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() - days);
  return d.toISOString().slice(0, 10);
}

function getTodayIso(): string {
  return new Date().toISOString().slice(0, 10);
}

export function FinanceManager() {
  const [activeTab, setActiveTab] = useState<string>("transactions");

  // Summaries
  const summaryQuery = useFinanceSummary();
  const summary = summaryQuery.data;

  // Invoices Table State
  const invoiceTable = useTableUrlState(invoiceFilterParsers);
  const { params, filters, setFilters } = invoiceTable;
  const invoicesQuery = useInvoices(toInvoiceListQuery(params, filters));
  const cancelInvoice = useCancelInvoice();
  const markPaid = useMarkInstallmentPaid();

  // Transactions Table State
  const txTable = useTableUrlState(txFilterParsers);
  const {
    params: txParams,
    filters: txFilters,
    setFilters: setTxFilters,
  } = txTable;

  const transactionsQuery = useFinanceTransactions(
    toFinanceTransactionListQuery(txParams, txFilters),
  );

  // Awaiting Verification Queue
  const awaitingQuery = useFinanceTransactions({
    page: 1,
    pageSize: 50,
    awaitingVerification: true,
  });
  const verifyAttempt = useVerifyPaymentAttempt();

  // Report Query State
  const [reportFrom, setReportFrom] = useState<string>(() => getPastDaysIso(30));
  const [reportTo, setReportTo] = useState<string>(() => getTodayIso());
  const reportQuery = useFinanceReport({ from: reportFrom, to: reportTo });
  const [exportingCsv, setExportingCsv] = useState(false);

  // File Viewer State
  const [viewerFile, setViewerFile] = useState<{
    url: string | null;
    title: string;
  } | null>(null);

  // Action targets
  const [cancelTarget, setCancelTarget] = useState<Invoice | null>(null);
  const [markTarget, setMarkTarget] = useState<Invoice | null>(null);
  const [rejectTarget, setRejectTarget] = useState<FinanceTransaction | null>(
    null,
  );

  const cancelForm = useForm<CancelValues>({
    resolver: zodResolver(cancelSchema),
    defaultValues: { reason: "" },
  });

  const markForm = useForm<MarkPaidValues>({
    resolver: zodResolver(markPaidSchema),
    defaultValues: { paymentMethod: "bank_transfer", paymentRef: "" },
  });

  const rejectForm = useForm<RejectValues>({
    resolver: zodResolver(rejectSchema),
    defaultValues: { note: "" },
  });

  const pendingInstallment = markTarget?.installments.find(
    (item) => item.status === "pending" || item.status === "overdue",
  );

  const transactions = useMemo(
    () => transactionsQuery.data?.items ?? [],
    [transactionsQuery.data?.items],
  );
  const awaitingList = useMemo(
    () => awaitingQuery.data?.items ?? [],
    [awaitingQuery.data?.items],
  );

  const txTotalAmount = useMemo(() => {
    return transactions.reduce((sum, item) => sum + item.amount, 0);
  }, [transactions]);

  function handleViewReceipt(fileId: string, title: string) {
    const url = resolveFileUrl(fileId);
    setViewerFile({ url, title });
  }

  async function handleExportCsv() {
    setExportingCsv(true);
    try {
      const result = await paymentsApi.exportFinanceReportCsv({
        from: reportFrom,
        to: reportTo,
      });
      const blob = new Blob([result.csv], { type: "text/csv;charset=utf-8;" });
      const link = document.createElement("a");
      const url = URL.createObjectURL(blob);
      link.setAttribute("href", url);
      link.setAttribute("download", result.filename || "finance-report.csv");
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      toast.success("خروجی CSV با موفقیت دانلود شد");
    } catch {
      toast.error("خطا در دریافت خروجی CSV");
    } finally {
      setExportingCsv(false);
    }
  }

  function handleApprove(tx: FinanceTransaction) {
    verifyAttempt.mutate(
      { id: tx.id, body: { decision: "approve" } },
      {
        onSuccess: () => {
          toast.success(`پرداخت برای دانشجو «${tx.studentName}» تأیید شد`);
          void awaitingQuery.refetch();
          void transactionsQuery.refetch();
          void summaryQuery.refetch();
        },
        onError: (err) => toast.error(getApiErrorMessage(err)),
      },
    );
  }

  return (
    <PageContainer className="gap-6 pb-16">
      <PageHeader
        title="مدیریت مالی"
        description="تراکنش‌ها، صف تأیید رسیدهای کارت‌به‌کارت، فاکتورها و گزارش‌های مالی"
      />

      {/* Metrics Cards */}
      {summary ? (
        <section
          aria-label="آمار و شاخص‌های مالی"
          className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4"
        >
          <div className="bg-card rounded-2xl border p-4 shadow-xs">
            <span className="text-muted-foreground text-xs font-medium">
              کل درآمد دریافتی
            </span>
            <p className="mt-1 text-xl font-bold text-emerald-600 tabular-nums dark:text-emerald-400">
              {formatMoney(summary.totalPaid)}
            </p>
          </div>
          <div className="bg-card rounded-2xl border p-4 shadow-xs">
            <span className="text-muted-foreground text-xs font-medium">
              مطالبات معوق
            </span>
            <p className="mt-1 text-xl font-bold text-destructive tabular-nums">
              {formatMoney(summary.totalOverdue)}
            </p>
          </div>
          <div className="bg-card rounded-2xl border p-4 shadow-xs">
            <span className="text-muted-foreground text-xs font-medium">
              کل مبالغ فاکتورها
            </span>
            <p className="mt-1 text-xl font-bold tabular-nums">
              {formatMoney(summary.totalInvoiced)}
            </p>
          </div>
          <div className="bg-card rounded-2xl border p-4 shadow-xs">
            <span className="text-muted-foreground text-xs font-medium">
              رسیدهای در انتظار تأیید
            </span>
            <p className="mt-1 text-xl font-bold text-amber-600 tabular-nums dark:text-amber-400">
              {toPersianDigits(summary.awaitingVerificationCount)} مورد
            </p>
          </div>
        </section>
      ) : null}

      {/* Main Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-2 sm:grid-cols-4">
          <TabsTrigger value="transactions" className="gap-1.5">
            <ShieldCheck className="size-4" />
            تراکنش‌ها
          </TabsTrigger>
          <TabsTrigger value="awaiting" className="gap-1.5">
            <Clock className="size-4" />
            در انتظار تأیید
            {awaitingList.length > 0 ? (
              <Badge variant="destructive" className="h-4 px-1 text-[10px]">
                {toPersianDigits(awaitingList.length)}
              </Badge>
            ) : null}
          </TabsTrigger>
          <TabsTrigger value="invoices" className="gap-1.5">
            <FileText className="size-4" />
            فاکتورها
          </TabsTrigger>
          <TabsTrigger value="report" className="gap-1.5">
            <FileSpreadsheet className="size-4" />
            گزارش مالی
          </TabsTrigger>
        </TabsList>

        {/* ---------------- Tab 1: Transactions ---------------- */}
        <TabsContent value="transactions" className="space-y-4">
          {/* Total summary bar */}
          <div className="flex items-center justify-between rounded-xl border bg-card px-4 py-3 text-xs text-muted-foreground">
            <span>تعداد تراکنش‌ها: {toPersianDigits(transactions.length)}</span>
            <span className="font-semibold text-foreground">
              مجموع مبالغ تراکنش‌های نمایش‌داده‌شده:{" "}
              <strong className="text-primary tabular-nums">
                {formatMoney(txTotalAmount)}
              </strong>
            </span>
          </div>

          {/* Transactions DataTable */}
          <DataTable
            caption="فهرست تراکنش‌های مالی"
            columns={getTransactionColumns(handleViewReceipt)}
            data={transactions}
            pagination={transactionsQuery.data?.pagination}
            getRowId={(tx) => tx.id}
            controller={txTable}
            isLoading={transactionsQuery.isPending}
            isFetching={transactionsQuery.isFetching}
            error={transactionsQuery.error}
            onRetry={() => void transactionsQuery.refetch()}
            searchPlaceholder="جستجوی کد، دانشجو، قسط…"
            filters={
              <>
                <SelectFilter
                  label="روش پرداخت"
                  value={txFilters.method}
                  options={TX_METHOD_FILTER_OPTIONS}
                  onChange={(method) => setTxFilters({ method })}
                />
                <SelectFilter
                  label="وضعیت"
                  value={txFilters.status}
                  options={TX_STATUS_FILTER_OPTIONS}
                  onChange={(status) => setTxFilters({ status })}
                />
                <DateRangeFilter
                  label="بازه زمانی"
                  value={{ from: txFilters.from, to: txFilters.to }}
                  onChange={(range) =>
                    setTxFilters({ from: range.from, to: range.to })
                  }
                />
              </>
            }
            emptyState={{
              title: "تراکنشی یافت نشد",
              description: "تراکنشی مطابق فیلترهای انتخابی ثبت نشده است.",
            }}
          />
        </TabsContent>

        {/* ---------------- Tab 2: Awaiting Verification Queue ---------------- */}
        <TabsContent value="awaiting" className="space-y-4">
          <div className="space-y-1">
            <h2 className="text-base font-bold">
              صف رسیدهای کارت‌به‌کارت در انتظار بررسی
            </h2>
            <p className="text-muted-foreground text-xs">
              رسیدهای ارسال‌شده توسط دانشجویان را بررسی و تأیید یا با ذکر دلیل رد
              کنید. رد رسید پیام و اعلان برای دانشجو ارسال می‌کند.
            </p>
          </div>

          {awaitingList.length === 0 ? (
            <div className="bg-card flex flex-col items-center justify-center rounded-2xl border p-10 text-center space-y-2">
              <CheckCircle2 className="size-10 text-emerald-500" />
              <p className="font-semibold text-sm">
                هیچ رسیدی در صف انتظار نیست
              </p>
              <p className="text-muted-foreground text-xs">
                تمامی رسیدهای کارت‌به‌کارت بررسی و تعیین تکلیف شده‌اند.
              </p>
            </div>
          ) : (
            <ul className="grid gap-3" role="list">
              {awaitingList.map((item) => (
                <li
                  key={item.id}
                  className="bg-card flex flex-col justify-between gap-4 rounded-2xl border p-4 sm:flex-row sm:items-center shadow-xs"
                >
                  <div className="space-y-1.5">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-sm">
                        {item.studentName}
                      </span>
                      <Badge
                        variant="secondary"
                        className="bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300"
                      >
                        در انتظار تأیید
                      </Badge>
                      <span
                        className="text-muted-foreground text-xs tabular-nums"
                        dir="ltr"
                      >
                        {item.code}
                      </span>
                    </div>
                    <div className="text-muted-foreground flex flex-wrap items-center gap-3 text-xs">
                      <span>قسط: {item.installmentTitle || "—"}</span>
                      <span className="font-semibold text-foreground tabular-nums">
                        مبلغ: {formatMoney(item.amount)}
                      </span>
                      <span className="tabular-nums">
                        تاریخ ارسال: {formatJalaliDate(item.occurredAt, "yyyy/MM/dd HH:mm")}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {item.receiptFileId ? (
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="gap-1.5"
                        onClick={() =>
                          handleViewReceipt(
                            item.receiptFileId!,
                            `رسید واریز ${item.studentName}`,
                          )
                        }
                      >
                        <Eye className="size-4" />
                        پیش‌نمایش رسید
                      </Button>
                    ) : null}
                    <Can permission="payment:manage">
                      <Button
                        type="button"
                        size="sm"
                        className="bg-emerald-600 hover:bg-emerald-700 text-white gap-1"
                        disabled={verifyAttempt.isPending}
                        onClick={() => handleApprove(item)}
                      >
                        <CheckCircle2 className="size-3.5" />
                        تأیید
                      </Button>
                      <Button
                        type="button"
                        variant="destructive"
                        size="sm"
                        className="gap-1"
                        disabled={verifyAttempt.isPending}
                        onClick={() => {
                          rejectForm.reset({ note: "" });
                          setRejectTarget(item);
                        }}
                      >
                        <XCircle className="size-3.5" />
                        رد
                      </Button>
                    </Can>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </TabsContent>

        {/* ---------------- Tab 3: Invoices ---------------- */}
        <TabsContent value="invoices" className="space-y-4">
          <DataTable
            caption="فهرست فاکتورها"
            columns={invoiceColumns}
            data={invoicesQuery.data?.items}
            pagination={invoicesQuery.data?.pagination}
            getRowId={(invoice) => invoice.id}
            controller={invoiceTable}
            isLoading={invoicesQuery.isPending}
            isFetching={invoicesQuery.isFetching}
            error={invoicesQuery.error}
            onRetry={() => void invoicesQuery.refetch()}
            searchPlaceholder="جستجوی شماره یا عنوان…"
            emptyState={{
              title: "فاکتوری ثبت نشده است",
              description:
                "پس از صدور فاکتور برای پرونده‌ها، فهرست اینجا نمایش داده می‌شود.",
            }}
            filters={
              <SelectFilter
                label="وضعیت"
                value={filters.status}
                options={INVOICE_STATUS_FILTER_OPTIONS}
                onChange={(status) =>
                  setFilters({ status: status as PaymentStatus | null })
                }
              />
            }
            rowActions={(invoice) => {
              const canCancel =
                invoice.status !== "cancelled" &&
                invoice.status !== "paid" &&
                invoice.status !== "refunded";
              const canMarkPaid = invoice.installments.some(
                (item) =>
                  item.status === "pending" || item.status === "overdue",
              );
              if (!canCancel && !canMarkPaid) return null;
              return (
                <Can permission="payment:manage">
                  <RowActionsMenu label={`عملیات فاکتور ${invoice.number}`}>
                    {canCancel ? (
                      <DropdownMenuItem
                        onSelect={() => {
                          cancelForm.reset({ reason: "" });
                          setCancelTarget(invoice);
                        }}
                      >
                        لغو فاکتور
                      </DropdownMenuItem>
                    ) : null}
                    {canMarkPaid ? (
                      <DropdownMenuItem
                        onSelect={() => {
                          markForm.reset({
                            paymentMethod: "bank_transfer",
                            paymentRef: "",
                          });
                          setMarkTarget(invoice);
                        }}
                      >
                        ثبت پرداخت قسط
                      </DropdownMenuItem>
                    ) : null}
                  </RowActionsMenu>
                </Can>
              );
            }}
          />
        </TabsContent>

        {/* ---------------- Tab 4: Financial Report ---------------- */}
        <TabsContent value="report" className="space-y-6">
          <div className="bg-card rounded-2xl border p-4 flex flex-wrap items-center justify-between gap-4">
            <div className="flex flex-wrap items-center gap-3 text-xs">
              <span>بازه زمانی گزارش:</span>
              <Input
                type="date"
                className="w-36 h-9 text-xs"
                value={reportFrom}
                onChange={(e) => setReportFrom(e.target.value)}
              />
              <span>تا:</span>
              <Input
                type="date"
                className="w-36 h-9 text-xs"
                value={reportTo}
                onChange={(e) => setReportTo(e.target.value)}
              />
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="gap-2"
              disabled={exportingCsv || !reportFrom || !reportTo}
              onClick={handleExportCsv}
            >
              <Download className="size-4" />
              {exportingCsv ? "در حال دریافت…" : "خروجی CSV گزارش مالی"}
            </Button>
          </div>

          {reportQuery.isLoading ? (
            <p className="text-muted-foreground text-sm">
              در حال محاسبه گزارش مالی…
            </p>
          ) : reportQuery.data ? (
            <div className="space-y-6">
              {/* Report Summary Cards */}
              <div className="grid gap-4 sm:grid-cols-3">
                <div className="bg-card rounded-2xl border p-4 shadow-xs">
                  <span className="text-muted-foreground text-xs font-medium">
                    درآمد دریافتی در بازه
                  </span>
                  <p className="mt-1 text-xl font-bold text-emerald-600 tabular-nums dark:text-emerald-400">
                    {formatMoney(reportQuery.data.receivedRevenue)}
                  </p>
                </div>
                <div className="bg-card rounded-2xl border p-4 shadow-xs">
                  <span className="text-muted-foreground text-xs font-medium">
                    مجموع اقساط معوق
                  </span>
                  <p className="mt-1 text-xl font-bold text-destructive tabular-nums">
                    {formatMoney(reportQuery.data.overdueTotal)}
                  </p>
                </div>
                <div className="bg-card rounded-2xl border p-4 shadow-xs">
                  <span className="text-muted-foreground text-xs font-medium">
                    پیش‌بینی دریافتی ۳۰ روز آینده
                  </span>
                  <p className="mt-1 text-xl font-bold text-primary tabular-nums">
                    {formatMoney(reportQuery.data.forecastTotal)}
                  </p>
                </div>
              </div>

              {/* Overdue items list */}
              <div className="bg-card rounded-2xl border p-5 space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="font-bold text-sm">فهرست اقساط معوق</h3>
                  <span className="text-muted-foreground text-xs">
                    {toPersianDigits(reportQuery.data.overdueItems.length)} قسط
                  </span>
                </div>
                {reportQuery.data.overdueItems.length === 0 ? (
                  <p className="text-muted-foreground text-xs">
                    قسط معوقی ثبت نشده است.
                  </p>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-xs text-right border-collapse">
                      <thead>
                        <tr className="border-b bg-muted/20">
                          <th className="py-2 px-3">دانشجو</th>
                          <th className="py-2 px-3">عنوان قسط</th>
                          <th className="py-2 px-3">تاریخ سررسید</th>
                          <th className="py-2 px-3">مبلغ</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y">
                        {reportQuery.data.overdueItems.map((item) => (
                          <tr key={item.installmentId}>
                            <td className="py-2 px-3 font-semibold">
                              {item.studentName}
                            </td>
                            <td className="py-2 px-3">{item.title}</td>
                            <td className="py-2 px-3 text-destructive tabular-nums">
                              {formatJalaliDate(item.dueDate)}
                            </td>
                            <td className="py-2 px-3 font-bold tabular-nums">
                              {formatMoney(item.amount)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

              {/* 30-Day Forecast Table */}
              <div className="bg-card rounded-2xl border p-5 space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="font-bold text-sm">
                    پیش‌بینی دریافتی ۳۰ روز آینده
                  </h3>
                  <span className="text-muted-foreground text-xs">
                    مجموع: {formatMoney(reportQuery.data.forecastTotal)}
                  </span>
                </div>
                {reportQuery.data.forecast30Days.length === 0 ? (
                  <p className="text-muted-foreground text-xs">
                    قسط سررسیددار برای ۳۰ روز آینده وجود ندارد.
                  </p>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-xs text-right border-collapse">
                      <thead>
                        <tr className="border-b bg-muted/20">
                          <th className="py-2 px-3">تاریخ سررسید</th>
                          <th className="py-2 px-3">تعداد اقساط</th>
                          <th className="py-2 px-3">مبلغ پیش‌بینی‌شده</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y">
                        {reportQuery.data.forecast30Days.map((item) => (
                          <tr key={item.dueDate}>
                            <td className="py-2 px-3 font-medium tabular-nums">
                              {formatJalaliDate(item.dueDate)}
                            </td>
                            <td className="py-2 px-3 tabular-nums">
                              {toPersianDigits(item.count)} قسط
                            </td>
                            <td className="py-2 px-3 font-bold tabular-nums">
                              {formatMoney(item.amount)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          ) : null}
        </TabsContent>
      </Tabs>

      {/* Reject Card-to-Card Receipt Dialog */}
      <Dialog
        open={rejectTarget !== null}
        onOpenChange={(open) => {
          if (!open) setRejectTarget(null);
        }}
      >
        <DialogContent dir="rtl">
          <DialogHeader>
            <DialogTitle>رد رسید کارت‌به‌کارت</DialogTitle>
            <DialogDescription>
              {rejectTarget
                ? `دلیل رد رسید واریز «${rejectTarget.studentName}» را وارد کنید. این دلیل در اعلان و پیام به دانشجو ارسال می‌شود.`
                : null}
            </DialogDescription>
          </DialogHeader>
          <Form {...rejectForm}>
            <form
              className="space-y-4"
              noValidate
              onSubmit={rejectForm.handleSubmit((values) => {
                if (!rejectTarget) return;
                verifyAttempt.mutate(
                  {
                    id: rejectTarget.id,
                    body: { decision: "reject", note: values.note },
                  },
                  {
                    onSuccess: () => {
                      toast.success("رسید رد شد و پیام به دانشجو ارسال گردید");
                      setRejectTarget(null);
                      void awaitingQuery.refetch();
                      void transactionsQuery.refetch();
                      void summaryQuery.refetch();
                    },
                    onError: (err) => toast.error(getApiErrorMessage(err)),
                  },
                );
              })}
            >
              <FormTextareaField
                control={rejectForm.control}
                name="note"
                label="دلیل رد رسید (الزامی)"
                placeholder="مثلاً: تصویر ناخوانا است یا شماره پیگیری منطبق نیست…"
              />
              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setRejectTarget(null)}
                >
                  انصراف
                </Button>
                <Button
                  type="submit"
                  variant="destructive"
                  disabled={verifyAttempt.isPending}
                >
                  تأیید و رد رسید
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Cancel Invoice Dialog */}
      <Dialog
        open={cancelTarget !== null}
        onOpenChange={(open) => {
          if (!open) setCancelTarget(null);
        }}
      >
        <DialogContent dir="rtl">
          <DialogHeader>
            <DialogTitle>لغو فاکتور</DialogTitle>
            <DialogDescription>
              {cancelTarget
                ? `دلیل لغو فاکتور ${cancelTarget.number} را وارد کنید.`
                : null}
            </DialogDescription>
          </DialogHeader>
          <Form {...cancelForm}>
            <form
              className="space-y-4"
              noValidate
              onSubmit={cancelForm.handleSubmit((values) => {
                if (!cancelTarget) return;
                cancelInvoice.mutate(
                  { id: cancelTarget.id, body: { reason: values.reason } },
                  {
                    onSuccess: () => {
                      toast.success("فاکتور لغو شد");
                      setCancelTarget(null);
                    },
                    onError: (error) => toast.error(getApiErrorMessage(error)),
                  },
                );
              })}
            >
              <FormTextareaField
                control={cancelForm.control}
                name="reason"
                label="دلیل لغو"
              />
              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setCancelTarget(null)}
                >
                  انصراف
                </Button>
                <Button
                  type="submit"
                  variant="destructive"
                  disabled={cancelInvoice.isPending}
                >
                  لغو فاکتور
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Mark Installment Paid Dialog */}
      <Dialog
        open={markTarget !== null}
        onOpenChange={(open) => {
          if (!open) setMarkTarget(null);
        }}
      >
        <DialogContent dir="rtl">
          <DialogHeader>
            <DialogTitle>ثبت دستی پرداخت قسط</DialogTitle>
            <DialogDescription>
              {markTarget && pendingInstallment
                ? `قسط ${pendingInstallment.sequence} از فاکتور ${markTarget.number}`
                : "قسط قابل پرداختی یافت نشد."}
            </DialogDescription>
          </DialogHeader>
          <Form {...markForm}>
            <form
              className="space-y-4"
              noValidate
              onSubmit={markForm.handleSubmit((values) => {
                if (!pendingInstallment) return;
                markPaid.mutate(
                  {
                    id: pendingInstallment.id,
                    body: {
                      paymentMethod: values.paymentMethod,
                      paymentRef: values.paymentRef?.trim() || undefined,
                    },
                  },
                  {
                    onSuccess: () => {
                      toast.success("پرداخت قسط ثبت شد");
                      setMarkTarget(null);
                    },
                    onError: (error) => toast.error(getApiErrorMessage(error)),
                  },
                );
              })}
            >
              <FormSelectField
                control={markForm.control}
                name="paymentMethod"
                label="روش پرداخت"
                options={[
                  { value: "card_to_card", label: "کارت به کارت" },
                  { value: "bank_transfer", label: "حواله بانکی" },
                  { value: "cash", label: "نقدی" },
                ]}
              />
              <FormInputField
                control={markForm.control}
                name="paymentRef"
                label="شناسه پیگیری (اختیاری)"
              />
              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setMarkTarget(null)}
                >
                  انصراف
                </Button>
                <Button
                  type="submit"
                  disabled={markPaid.isPending || !pendingInstallment}
                >
                  ثبت پرداخت
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* File Viewer Drawer */}
      <FileViewer
        open={viewerFile !== null}
        onOpenChange={(open) => {
          if (!open) setViewerFile(null);
        }}
        title={viewerFile?.title ?? "رسید پرداخت"}
        fileUrl={viewerFile?.url}
      />
    </PageContainer>
  );
}
