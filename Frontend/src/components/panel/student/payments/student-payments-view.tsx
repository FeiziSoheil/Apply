"use client";

import { useState } from "react";
import { toast } from "sonner";
import {
  AlertCircle,
  Calendar,
  CheckCircle2,
  Clock,
  Copy,
  CreditCard,
  FileText,
  Printer,
  ShieldCheck,
  Upload,
} from "lucide-react";
import { PageContainer } from "@/components/panel/page-container";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { Installment, Invoice } from "@/contracts/payments";
import {
  useMyInstallments,
  useMyInvoices,
  useMyPaymentAccount,
  useMyPaymentSummary,
} from "@/features/student-panel/queries";
import { usePayMyInstallment } from "@/features/student-panel/mutations";
import { uploadFileWithProgress } from "@/lib/api/upload";
import {
  formatJalaliDate,
  formatMoney,
  toPersianDigits,
} from "@/lib/format";
import { rialsToPersianTomanWords } from "@/lib/persian-words";
import { CaseLinkGate } from "../case-link-gate";
import {
  StudentPanelEmpty,
  StudentPanelError,
  StudentPanelSkeleton,
} from "../panel-query-state";

export function StudentPaymentsView() {
  return (
    <CaseLinkGate requireCase={false}>
      <PaymentsContent />
    </CaseLinkGate>
  );
}

function PaymentsContent() {
  const summaryQuery = useMyPaymentSummary();
  const installmentsQuery = useMyInstallments();
  const invoicesQuery = useMyInvoices();

  const [activeInstallment, setActiveInstallment] = useState<Installment | null>(
    null,
  );
  const [activeInvoice, setActiveInvoice] = useState<Invoice | null>(null);

  if (summaryQuery.isLoading || installmentsQuery.isLoading) {
    return <StudentPanelSkeleton />;
  }

  if (summaryQuery.isError) {
    return (
      <StudentPanelError
        error={summaryQuery.error}
        onRetry={() => {
          void summaryQuery.refetch();
          void installmentsQuery.refetch();
        }}
      />
    );
  }

  const summary = summaryQuery.data;
  const installments = installmentsQuery.data ?? [];
  const invoices = invoicesQuery.data ?? [];

  const paidRatio =
    summary && summary.totalContract > 0
      ? Math.min(
          100,
          Math.round((summary.totalPaid / summary.totalContract) * 100),
        )
      : 0;

  return (
    <PageContainer className="gap-5 pb-24 md:gap-6 md:pb-16">
      <header className="space-y-1">
        <h1 className="font-heading text-xl font-bold tracking-tight sm:text-2xl">
          پرداخت‌ها و اقساط
        </h1>
        <p className="text-xs text-muted-foreground sm:text-sm">
          مدیریت قرارداد، پرداخت اقساط و دریافت فاکتورهای رسمی
        </p>
      </header>

      {/* Financial Summary */}
      {summary ? (
        <section
          aria-label="خلاصه مالی"
          className="rounded-2xl border bg-card p-4 shadow-xs sm:p-5"
        >
          <div className="grid grid-cols-2 gap-2.5 sm:gap-4 lg:grid-cols-4">
            <div className="flex flex-col justify-between rounded-xl bg-muted/40 p-3 sm:p-3.5 space-y-1">
              <span className="text-xs font-medium text-muted-foreground">
                کل مبلغ قرارداد
              </span>
              <p className="text-base font-bold tabular-nums sm:text-xl">
                {formatMoney(summary.totalContract)}
              </p>
            </div>
            <div className="flex flex-col justify-between rounded-xl bg-muted/40 p-3 sm:p-3.5 space-y-1">
              <span className="text-xs font-medium text-muted-foreground">
                پرداخت‌شده
              </span>
              <p className="text-base font-bold text-emerald-600 tabular-nums dark:text-emerald-400 sm:text-xl">
                {formatMoney(summary.totalPaid)}
              </p>
            </div>
            <div className="flex flex-col justify-between rounded-xl bg-muted/40 p-3 sm:p-3.5 space-y-1">
              <span className="text-xs font-medium text-muted-foreground">
                باقی‌مانده بدهی
              </span>
              <p className="text-base font-bold text-amber-600 tabular-nums dark:text-amber-400 sm:text-xl">
                {formatMoney(summary.totalDue)}
              </p>
            </div>
            <div className="flex flex-col justify-between rounded-xl bg-muted/40 p-3 sm:p-3.5 space-y-1">
              <span className="text-xs font-medium text-muted-foreground">
                قسط بعدی
              </span>
              <p className="text-xs font-semibold sm:text-sm leading-tight">
                {summary.nextDueAmount != null && summary.nextDueDate
                  ? `${formatMoney(summary.nextDueAmount)} · ${formatJalaliDate(summary.nextDueDate)}`
                  : "قسط فعالی نیست"}
              </p>
              {summary.overdueCount > 0 ? (
                <span className="flex items-center gap-1 text-[11px] font-semibold text-destructive sm:text-xs">
                  <AlertCircle className="size-3.5 shrink-0" />
                  {toPersianDigits(summary.overdueCount)} قسط معوق
                </span>
              ) : null}
            </div>
          </div>

          <div className="mt-4 space-y-2 border-t pt-3.5 sm:mt-5 sm:pt-4">
            <div className="flex items-center justify-between text-xs font-medium">
              <span className="text-muted-foreground">میزان پیشرفت پرداخت</span>
              <span className="font-bold tabular-nums text-foreground">
                {toPersianDigits(paidRatio)}٪
              </span>
            </div>
            <Progress value={paidRatio} aria-label="پیشرفت پرداخت قرارداد" className="h-2 rounded-full" />
          </div>
        </section>
      ) : null}

      {/* Installments Timeline */}
      <section className="space-y-3" aria-label="جدول زمانی اقساط">
        <div className="flex items-center justify-between">
          <h2 className="font-heading text-base font-bold sm:text-lg">اقساط قرارداد</h2>
          <Badge variant="secondary" className="rounded-full text-xs tabular-nums">
            {toPersianDigits(installments.length)} قسط
          </Badge>
        </div>

        {installments.length === 0 ? (
          <StudentPanelEmpty
            title="هیچ قسطی تعریف نشده است"
            description="پس از ثبت قرارداد توسط مشاور، اقساط شما در اینجا قرار می‌گیرند."
          />
        ) : (
          <ul className="grid gap-3" role="list">
            {installments.map((inst) => {
              const isPayable =
                inst.status === "pending" || inst.status === "overdue";
              const isAwaiting = inst.status === "awaiting_verification";
              const isPaid = inst.status === "paid";
              const isOverdue = inst.status === "overdue";

              return (
                <li
                  key={inst.id}
                  className={`flex flex-col justify-between gap-3.5 rounded-2xl border bg-card p-4 shadow-xs transition-all sm:flex-row sm:items-center sm:p-5 ${
                    isOverdue
                      ? "border-destructive/30 bg-destructive/[0.02]"
                      : isAwaiting
                        ? "border-amber-500/30 bg-amber-500/[0.02]"
                        : isPaid
                          ? "border-emerald-500/20"
                          : ""
                  }`}
                >
                  <div className="space-y-1.5">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-bold text-sm sm:text-base text-foreground">
                        {inst.title || `قسط ${toPersianDigits(inst.sequence)}`}
                      </span>
                      {isPaid ? (
                        <Badge
                          variant="default"
                          className="rounded-full bg-emerald-600 text-xs gap-1"
                        >
                          <CheckCircle2 className="size-3" />
                          پرداخت‌شده
                        </Badge>
                      ) : isAwaiting ? (
                        <Badge
                          variant="secondary"
                          className="rounded-full bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 text-xs gap-1"
                        >
                          <Clock className="size-3" />
                          در انتظار تأیید رسید
                        </Badge>
                      ) : isOverdue ? (
                        <Badge variant="destructive" className="rounded-full text-xs gap-1">
                          <AlertCircle className="size-3" />
                          معوق
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="rounded-full text-xs gap-1">
                          <Clock className="size-3" />
                          سررسید نزدیک
                        </Badge>
                      )}
                    </div>
                    <div className="flex flex-wrap items-center gap-2.5 text-xs text-muted-foreground">
                      <span className="tabular-nums">
                        سررسید: {formatJalaliDate(inst.dueDate)}
                      </span>
                      {inst.paidAt ? (
                        <span className="tabular-nums">
                          · تاریخ پرداخت: {formatJalaliDate(inst.paidAt)}
                        </span>
                      ) : null}
                      {inst.paymentRef ? (
                        <span className="tabular-nums" dir="ltr">
                          · کد پیگیری: {inst.paymentRef}
                        </span>
                      ) : null}
                    </div>
                  </div>

                  <div className="flex items-center justify-between gap-3 border-t pt-3 sm:border-0 sm:pt-0 sm:justify-end">
                    <div className="flex flex-col">
                      <span className="text-[11px] text-muted-foreground sm:hidden">
                        مبلغ قسط:
                      </span>
                      <span className="text-base font-bold tabular-nums sm:text-lg">
                        {formatMoney(inst.amount)}
                      </span>
                    </div>

                    {isPayable ? (
                      <Button
                        size="default"
                        className="min-h-11 min-w-28 rounded-xl font-semibold shadow-xs"
                        onClick={() => setActiveInstallment(inst)}
                      >
                        پرداخت
                      </Button>
                    ) : isAwaiting ? (
                      <span className="flex items-center gap-1 text-xs font-semibold text-amber-600 dark:text-amber-400">
                        <Clock className="size-3.5" />
                        رسید در حال بررسی
                      </span>
                    ) : isPaid ? (
                      <span className="flex items-center gap-1 text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                        <CheckCircle2 className="size-3.5" />
                        تسویه شده
                      </span>
                    ) : null}
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      {/* Invoices List */}
      <section className="space-y-3" aria-label="فاکتورها و رسیدها">
        <h2 className="font-heading text-base font-bold sm:text-lg">فاکتورها و رسیدها</h2>
        {invoices.length === 0 ? (
          <div className="rounded-2xl border border-dashed bg-muted/30 p-6 text-center text-xs sm:text-sm text-muted-foreground">
            فاکتوری برای حساب شما صادر نشده است.
          </div>
        ) : (
          <ul className="grid gap-3" role="list">
            {invoices.map((inv) => (
              <li
                key={inv.id}
                className="flex flex-col justify-between gap-3 rounded-2xl border bg-card p-4 shadow-xs sm:flex-row sm:items-center sm:p-5"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-sm sm:text-base text-foreground">
                      {inv.title}
                    </span>
                    <span
                      className="rounded-md bg-muted px-2 py-0.5 font-mono text-[11px] tabular-nums text-muted-foreground"
                      dir="ltr"
                    >
                      {inv.number}
                    </span>
                  </div>
                  <p className="text-xs tabular-nums text-muted-foreground">
                    تاریخ صدور: {formatJalaliDate(inv.issuedAt)} · مبلغ:{" "}
                    <span className="font-semibold text-foreground">
                      {formatMoney(inv.total)}
                    </span>
                  </p>
                </div>
                <Button
                  variant="outline"
                  className="min-h-11 w-full gap-2 rounded-xl text-xs sm:w-auto sm:text-sm font-semibold"
                  onClick={() => setActiveInvoice(inv)}
                >
                  <FileText className="size-4" />
                  مشاهده و چاپ فاکتور
                </Button>
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* Payment Method Dialog */}
      <PaymentDialog
        installment={activeInstallment}
        open={activeInstallment !== null}
        onClose={() => setActiveInstallment(null)}
      />

      {/* Printable Invoice Dialog */}
      <PrintableInvoiceDialog
        invoice={activeInvoice}
        open={activeInvoice !== null}
        onClose={() => setActiveInvoice(null)}
      />
    </PageContainer>
  );
}

/* -------------------------------------------------------------------------- */
/*  Payment Method Dialog                                                     */
/* -------------------------------------------------------------------------- */

type PaymentDialogProps = {
  installment: Installment | null;
  open: boolean;
  onClose: () => void;
};

function PaymentDialog({ installment, open, onClose }: PaymentDialogProps) {
  const accountQuery = useMyPaymentAccount();
  const payMutation = usePayMyInstallment();
  const [receiptFileId, setReceiptFileId] = useState<string | null>(null);
  const [receiptFileName, setReceiptFileName] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  if (!installment) return null;

  const account = accountQuery.data;

  function copyCardNumber() {
    if (!account?.cardNumber) return;
    void navigator.clipboard.writeText(account.cardNumber);
    toast.success("شماره کارت کپی شد.");
  }

  async function handleFileUpload(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    setUploading(true);
    setUploadProgress(0);
    try {
      const asset = await uploadFileWithProgress(file, {
        onProgress: (p) => setUploadProgress(p),
      });
      setReceiptFileId(asset.id);
      setReceiptFileName(file.name);
      toast.success("رسید با موفقیت بارگذاری شد");
    } catch {
      toast.error("خطا در بارگذاری رسید. لطفاً مجدداً تلاش کنید.");
    } finally {
      setUploading(false);
    }
  }

  function payOnline() {
    payMutation.mutate(
      {
        id: installment!.id,
        body: {
          method: "gateway",
          callbackUrl: `${window.location.origin}/panel/payments/callback`,
        },
      },
      {
        onSuccess: (result) => {
          if (result.gatewayUrl) {
            window.location.href = result.gatewayUrl;
          } else {
            toast.success("پرداخت ثبت شد");
            onClose();
          }
        },
        onError: (err) => {
          toast.error(err.message || "خطا در شروع فرایند پرداخت آنلاین");
        },
      },
    );
  }

  function payCardToCard() {
    if (!receiptFileId) {
      toast.error("لطفاً ابتدا تصویر رسید پرداخت را آپلود کنید");
      return;
    }
    payMutation.mutate(
      {
        id: installment!.id,
        body: {
          method: "card_to_card",
          receiptFileId,
        },
      },
      {
        onSuccess: () => {
          toast.success(
            "رسید کارت‌به‌کارت با موفقیت ثبت شد و در انتظار تأیید قرار گرفت.",
          );
          onClose();
        },
        onError: (err) => {
          toast.error(err.message || "خطا در ثبت رسید کارت‌به‌کارت");
        },
      },
    );
  }

  return (
    <Dialog open={open} onOpenChange={(o) => (!o ? onClose() : undefined)}>
      <DialogContent className="w-[calc(100%-2rem)] max-w-md max-h-[88svh] overflow-y-auto rounded-2xl p-4 sm:p-6" dir="rtl">
        <DialogHeader className="space-y-1.5 text-right">
          <DialogTitle className="font-heading text-lg sm:text-xl">
            پرداخت {installment.title || "قسط"}
          </DialogTitle>
          <DialogDescription className="text-xs sm:text-sm">
            مبلغ قابل پرداخت:{" "}
            <strong className="font-bold text-foreground tabular-nums text-sm sm:text-base">
              {formatMoney(installment.amount)}
            </strong>
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="gateway" className="mt-3">
          <TabsList className="grid h-12 w-full grid-cols-2 gap-1 rounded-2xl bg-muted/70 p-1.5">
            <TabsTrigger
              value="gateway"
              className="min-h-9 rounded-xl text-xs font-semibold sm:text-sm"
            >
              درگاه آنلاین
            </TabsTrigger>
            <TabsTrigger
              value="card"
              className="min-h-9 rounded-xl text-xs font-semibold sm:text-sm"
            >
              کارت‌به‌کارت
            </TabsTrigger>
          </TabsList>

          {/* Gateway Tab */}
          <TabsContent value="gateway" className="space-y-4 pt-4">
            <div className="rounded-2xl border bg-muted/40 p-4 text-xs sm:text-sm leading-relaxed">
              <div className="flex items-center gap-2 font-bold text-foreground">
                <CreditCard className="size-5 text-primary" />
                پرداخت شتابی از درگاه اینترنتی
              </div>
              <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
                با کلیک روی دکمه زیر، به درگاه پرداخت متصل می‌شوید. تمام کارت‌های
                عضو شبکه شتاب پشتیبانی می‌شوند.
              </p>
            </div>
            <DialogFooter className="pt-2">
              <Button
                type="button"
                className="min-h-12 w-full gap-2 rounded-xl text-base font-semibold shadow-xs"
                disabled={payMutation.isPending}
                onClick={payOnline}
              >
                <ShieldCheck className="size-5" />
                {payMutation.isPending
                  ? "در حال اتصال به درگاه…"
                  : "انتقال به درگاه پرداخت"}
              </Button>
            </DialogFooter>
          </TabsContent>

          {/* Card-to-Card Tab */}
          <TabsContent value="card" className="space-y-4 pt-4">
            {account ? (
              <div className="space-y-3 rounded-2xl border bg-muted/40 p-4 text-xs sm:text-sm">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-muted-foreground">
                    شماره کارت موسسه:
                  </span>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="min-h-8 gap-1 rounded-lg text-xs"
                    onClick={copyCardNumber}
                  >
                    <Copy className="size-3.5" />
                    کپی شماره کارت
                  </Button>
                </div>
                <div
                  className="rounded-xl border bg-card py-2.5 text-center font-mono text-base sm:text-lg font-bold tracking-widest tabular-nums select-all shadow-xs"
                  dir="ltr"
                >
                  {account.cardNumber}
                </div>
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>نام صاحب حساب:</span>
                  <span className="font-semibold text-foreground">
                    {account.accountHolder}
                  </span>
                </div>
                {account.bankName ? (
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>بانک:</span>
                    <span className="font-semibold text-foreground">
                      {account.bankName}
                    </span>
                  </div>
                ) : null}
              </div>
            ) : (
              <div className="text-xs text-muted-foreground">
                اطلاعات حساب بانکی در دسترس نیست.
              </div>
            )}

            <div className="space-y-2">
              <label
                htmlFor="receipt-upload"
                className="block text-xs font-semibold text-foreground"
              >
                بارگذاری تصویر یا فایل رسید بانکی:
              </label>
              <div className="flex items-center gap-2">
                <input
                  id="receipt-upload"
                  type="file"
                  accept="image/jpeg,image/png,image/webp,application/pdf"
                  className="hidden"
                  onChange={handleFileUpload}
                  disabled={uploading}
                />
                <Button
                  type="button"
                  variant="outline"
                  className="min-h-12 w-full gap-2 rounded-xl border-dashed text-xs sm:text-sm font-semibold"
                  disabled={uploading}
                  onClick={() =>
                    document.getElementById("receipt-upload")?.click()
                  }
                >
                  <Upload className="size-4" />
                  {uploading
                    ? `در حال آپلود (${toPersianDigits(uploadProgress)}٪)…`
                    : receiptFileName || "انتخاب تصویر رسید"}
                </Button>
              </div>
              {receiptFileName ? (
                <p className="flex items-center gap-1 text-xs font-medium text-emerald-600 dark:text-emerald-400">
                  <CheckCircle2 className="size-3.5 shrink-0" />
                  رسید انتخاب شد: {receiptFileName}
                </p>
              ) : null}
            </div>

            <DialogFooter className="pt-2">
              <Button
                type="button"
                className="min-h-12 w-full rounded-xl text-base font-semibold shadow-xs"
                disabled={!receiptFileId || payMutation.isPending || uploading}
                onClick={payCardToCard}
              >
                {payMutation.isPending ? "در حال ثبت رسید…" : "ثبت و ارسال رسید"}
              </Button>
            </DialogFooter>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}

/* -------------------------------------------------------------------------- */
/*  Printable Invoice / Receipt Dialog                                        */
/* -------------------------------------------------------------------------- */

type PrintableInvoiceDialogProps = {
  invoice: Invoice | null;
  open: boolean;
  onClose: () => void;
};

function PrintableInvoiceDialog({
  invoice,
  open,
  onClose,
}: PrintableInvoiceDialogProps) {
  if (!invoice) return null;

  function handlePrint() {
    window.print();
  }

  return (
    <Dialog open={open} onOpenChange={(o) => (!o ? onClose() : undefined)}>
      <DialogContent className="w-[calc(100%-1.5rem)] max-w-2xl max-h-[90svh] overflow-y-auto rounded-2xl p-0" dir="rtl">
        {/* Actions bar (hidden in print) */}
        <div className="no-print sticky top-0 z-10 flex items-center justify-between border-b bg-muted/70 px-4 py-3 backdrop-blur sm:px-6">
          <span className="text-xs sm:text-sm font-bold text-foreground">
            پیش‌نمایش فاکتور رسمی
          </span>
          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="min-h-9 gap-1.5 rounded-xl text-xs font-semibold"
              onClick={handlePrint}
            >
              <Printer className="size-3.5" />
              چاپ / ذخیره PDF
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="min-h-9 rounded-xl text-xs font-medium"
              onClick={onClose}
            >
              بستن
            </Button>
          </div>
        </div>

        {/* Printable Sheet */}
        <div className="p-4 sm:p-8 space-y-6 text-foreground bg-card print:bg-white print:p-0 print:text-black">
          {/* Header */}
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between border-b pb-5">
            <div className="space-y-1">
              <h2 className="font-heading text-lg sm:text-xl font-bold">
                موسسه مهاجرتی و اعزام دانشجو
              </h2>
              <p className="text-xs text-muted-foreground">
                رسید / صورتحساب رسمی خدمات
              </p>
            </div>
            <div className="text-right sm:text-left text-xs space-y-1 tabular-nums" dir="ltr">
              <p>
                <strong className="text-muted-foreground">شماره فاکتور: </strong>
                {invoice.number}
              </p>
              <p>
                <strong className="text-muted-foreground">تاریخ صدور: </strong>
                {formatJalaliDate(invoice.issuedAt)}
              </p>
            </div>
          </div>

          {/* Details */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div>
              <span className="mb-1 block text-muted-foreground">
                مشخصات خدمت:
              </span>
              <p className="font-bold text-sm text-foreground">{invoice.title}</p>
              {invoice.description ? (
                <p className="mt-1 text-muted-foreground">
                  {invoice.description}
                </p>
              ) : null}
            </div>
            <div className="sm:text-left space-y-1">
              <span className="mb-1 block text-muted-foreground">وضعیت پرداخت:</span>
              <Badge
                variant={invoice.status === "paid" ? "default" : "outline"}
                className={`rounded-full text-xs ${invoice.status === "paid" ? "bg-emerald-600 text-white" : ""}`}
              >
                {invoice.status === "paid"
                  ? "تسویه‌شده کامل"
                  : invoice.status === "partially_paid"
                    ? "پرداخت جزئی"
                    : "در انتظار پرداخت"}
              </Badge>
            </div>
          </div>

          {/* Line items table */}
          <div className="overflow-x-auto rounded-xl border">
            <table className="w-full text-right text-xs border-collapse">
              <thead>
                <tr className="border-b bg-muted/40">
                  <th className="py-2.5 px-3 font-semibold whitespace-nowrap">ردیف</th>
                  <th className="py-2.5 px-3 font-semibold min-w-32">شرح خدمات</th>
                  <th className="py-2.5 px-3 text-center font-semibold whitespace-nowrap">تعداد</th>
                  <th className="py-2.5 px-3 font-semibold whitespace-nowrap">مبلغ واحد (تومان)</th>
                  <th className="py-2.5 px-3 font-semibold whitespace-nowrap">مبلغ کل (تومان)</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {invoice.items.map((item, index) => (
                  <tr key={index}>
                    <td className="py-2.5 px-3 tabular-nums">
                      {toPersianDigits(index + 1)}
                    </td>
                    <td className="py-2.5 px-3 font-medium">{item.title}</td>
                    <td className="py-2.5 px-3 text-center tabular-nums">
                      {toPersianDigits(item.quantity)}
                    </td>
                    <td className="py-2.5 px-3 tabular-nums">
                      {formatMoney(item.unitAmount)}
                    </td>
                    <td className="py-2.5 px-3 font-bold tabular-nums">
                      {formatMoney(item.amount)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Totals */}
          <div className="space-y-2 border-t pt-4">
            <div className="flex justify-between text-xs">
              <span className="text-muted-foreground">جمع کل فاکتور:</span>
              <span className="font-semibold tabular-nums">
                {formatMoney(invoice.subtotal)}
              </span>
            </div>
            {invoice.discount > 0 ? (
              <div className="flex justify-between text-xs text-emerald-600">
                <span>تخفیف:</span>
                <span className="tabular-nums">
                  {formatMoney(invoice.discount)}-
                </span>
              </div>
            ) : null}
            {invoice.tax > 0 ? (
              <div className="flex justify-between text-xs">
                <span className="text-muted-foreground">مالیات و عوارض:</span>
                <span className="tabular-nums">{formatMoney(invoice.tax)}</span>
              </div>
            ) : null}
            <div className="flex justify-between border-t pt-2 text-sm sm:text-base font-bold">
              <span>مبلغ نهایی قابل پرداخت:</span>
              <span className="font-heading tabular-nums text-primary">
                {formatMoney(invoice.total)}
              </span>
            </div>
            <div className="rounded-xl bg-muted/40 p-3 text-xs leading-relaxed">
              <span className="text-muted-foreground">مبلغ به حروف: </span>
              <strong className="font-bold text-foreground">
                {rialsToPersianTomanWords(invoice.total)}
              </strong>
            </div>
          </div>

          {/* Installments Breakdown if exists */}
          {invoice.installments && invoice.installments.length > 0 ? (
            <div className="space-y-2 border-t pt-2.5 text-xs">
              <span className="block font-semibold text-muted-foreground">
                وضعیت اقساط فاکتور:
              </span>
              <div className="grid gap-1.5">
                {invoice.installments.map((inst) => (
                  <div
                    key={inst.id}
                    className="flex items-center justify-between rounded-lg bg-muted/30 px-3 py-1.5"
                  >
                    <span className="font-medium">
                      {inst.title || `قسط ${toPersianDigits(inst.sequence)}`} (
                      {formatMoney(inst.amount)})
                    </span>
                    <span className="tabular-nums text-muted-foreground text-[11px]">
                      {inst.status === "paid"
                        ? `پرداخت‌شده (${formatJalaliDate(inst.paidAt || inst.updatedAt)})`
                        : `سررسید: ${formatJalaliDate(inst.dueDate)}`}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          ) : null}

          {/* Footer note */}
          <div className="border-t pt-4 text-center text-xs text-muted-foreground">
            این سند به منزله فاکتور رسمی الکترونیکی است و مبالغ بر پایه واحد تومان
            درج شده‌اند.
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
