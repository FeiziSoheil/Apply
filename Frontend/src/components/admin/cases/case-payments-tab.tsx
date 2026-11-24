"use client";

import { useState } from "react";
import { toast } from "sonner";
import {
  AlertCircle,
  Banknote,
  CheckCircle2,
  Edit2,
  FileText,
  Plus,
  Trash2,
  XCircle,
} from "lucide-react";
import { Can } from "@/components/rbac/can";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import type { Installment } from "@/contracts/payments";
import {
  useCancelInstallment,
  useCreateInvoice,
  useCreatePaymentPlan,
  useMarkInstallmentPaid,
  useUpdateInstallment,
} from "@/features/payments/mutations";
import { useInvoices } from "@/features/payments/queries";
import { getApiErrorMessage } from "@/lib/api";
import {
  formatJalaliDate,
  formatMoney,
  toPersianDigits,
} from "@/lib/format";

type CasePaymentsTabProps = {
  caseId: string;
};

const STATUS_FA: Record<string, string> = {
  pending: "در انتظار پرداخت",
  partially_paid: "پرداخت جزئی",
  paid: "پرداخت‌شده",
  overdue: "سررسید گذشته",
  awaiting_verification: "در انتظار تأیید",
  cancelled: "لغوشده",
  refunded: "بازپرداخت",
};

type PlanInstallmentRow = {
  id: string;
  title: string;
  amount: string;
  dueDate: string;
};

export function CasePaymentsTab({ caseId }: CasePaymentsTabProps) {
  const invoicesQuery = useInvoices({
    page: 1,
    pageSize: 50,
    caseId,
    sort: "issuedAt",
    order: "desc",
  });

  const createInvoice = useCreateInvoice();
  const createPaymentPlan = useCreatePaymentPlan();
  const markInstallmentPaid = useMarkInstallmentPaid();
  const updateInstallment = useUpdateInstallment();
  const cancelInstallment = useCancelInstallment();

  // Dialog States
  const [invoiceOpen, setInvoiceOpen] = useState(false);
  const [invoiceTitle, setInvoiceTitle] = useState("قرارداد خدمات اعزام");
  const [invoiceAmount, setInvoiceAmount] = useState("500000000"); // 500,000,000 Rials = 50,000,000 Tomans

  const [planOpen, setPlanOpen] = useState(false);
  const [planTotal, setPlanTotal] = useState("1000000000"); // 1,000,000,000 Rials
  const [planInvoiceTitle, setPlanInvoiceTitle] = useState("قرارداد خدمات اعزام دانشجو");
  const [planRows, setPlanRows] = useState<PlanInstallmentRow[]>(() => [
    {
      id: "1",
      title: "قسط ۱ (پیش‌پرداخت)",
      amount: "500000000",
      dueDate: new Date(Date.now() + 7 * 86400000).toISOString().slice(0, 10),
    },
    {
      id: "2",
      title: "قسط ۲ (هنگام اخذ پذیرش)",
      amount: "500000000",
      dueDate: new Date(Date.now() + 45 * 86400000).toISOString().slice(0, 10),
    },
  ]);

  // Action targets
  const [manualPayTarget, setManualPayTarget] = useState<Installment | null>(
    null,
  );
  const [manualMethod, setManualMethod] = useState<
    "cash" | "card_to_card" | "bank_transfer"
  >("cash");
  const [manualRef, setManualRef] = useState("");

  const [editTarget, setEditTarget] = useState<Installment | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [editAmount, setEditAmount] = useState("");
  const [editDueDate, setEditDueDate] = useState("");

  const [cancelTarget, setCancelTarget] = useState<Installment | null>(null);
  const [cancelReason, setCancelReason] = useState("");

  const invoices = invoicesQuery.data?.items ?? [];

  // Plan validation
  const planTotalNum = Number(planTotal) || 0;
  const planRowsSum = planRows.reduce(
    (sum, r) => sum + (Number(r.amount) || 0),
    0,
  );
  const planDiff = planTotalNum - planRowsSum;
  const isPlanValid = planTotalNum > 0 && planDiff === 0 && planRows.length > 0;

  function handleAddPlanRow() {
    const nextSeq = planRows.length + 1;
    const remaining = Math.max(0, planDiff);
    setPlanRows([
      ...planRows,
      {
        id: String(Date.now()),
        title: `قسط ${nextSeq}`,
        amount: String(remaining),
        dueDate: new Date(Date.now() + nextSeq * 30 * 86400000)
          .toISOString()
          .slice(0, 10),
      },
    ]);
  }

  function handleRemovePlanRow(index: number) {
    if (planRows.length <= 1) return;
    setPlanRows(planRows.filter((_, i) => i !== index));
  }

  function handleCreatePlan() {
    if (!isPlanValid) {
      toast.error("مجموع مبالغ اقساط باید دقیقاً برابر با مبلغ کل باشد");
      return;
    }
    createPaymentPlan.mutate(
      {
        caseId,
        body: {
          total: planTotalNum,
          invoiceTitle: planInvoiceTitle.trim() || undefined,
          installments: planRows.map((r) => ({
            title: r.title.trim() || undefined,
            amount: Number(r.amount),
            dueDate: r.dueDate,
          })),
        },
      },
      {
        onSuccess: () => {
          toast.success("طرح پرداخت با موفقیت ثبت شد");
          setPlanOpen(false);
          void invoicesQuery.refetch();
        },
        onError: (err) => toast.error(getApiErrorMessage(err)),
      },
    );
  }

  return (
    <div className="space-y-6">
      {/* Header and Action Buttons */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b pb-4">
        <div>
          <h2 className="text-base font-bold">امور مالی و پرداخت‌های پرونده</h2>
          <p className="text-muted-foreground text-xs">
            طرح پرداخت، اقساط، صدور فاکتور و ثبت پرداخت‌های دستی
          </p>
        </div>
        <Can permission="payment:manage">
          <div className="flex flex-wrap items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="gap-1.5"
              onClick={() => setPlanOpen(true)}
            >
              <Plus className="size-4" />
              تعریف طرح پرداخت
            </Button>
            <Button
              type="button"
              size="sm"
              className="gap-1.5"
              onClick={() => setInvoiceOpen(true)}
            >
              <FileText className="size-4" />
              صدور فاکتور
            </Button>
          </div>
        </Can>
      </div>

      {/* Invoices and Installments */}
      {invoicesQuery.isPending ? (
        <p className="text-muted-foreground text-sm">در حال بارگذاری…</p>
      ) : invoices.length === 0 ? (
        <div className="bg-card flex flex-col items-center justify-center rounded-2xl border p-8 text-center space-y-2">
          <Banknote className="size-10 text-muted-foreground" />
          <p className="font-semibold text-sm">هیچ فاکتور یا طرح پرداختی ثبت نشده است</p>
          <p className="text-muted-foreground text-xs">
            با دکمه‌های بالا می‌توانید طرح پرداخت اقساطی یا فاکتور نقدی برای این
            پرونده ایجاد کنید.
          </p>
        </div>
      ) : (
        <ul className="space-y-4" role="list">
          {invoices.map((invoice) => (
            <li
              key={invoice.id}
              className="bg-card space-y-3 rounded-2xl border p-5 shadow-xs"
            >
              <div className="flex flex-wrap items-start justify-between gap-2 border-b pb-3">
                <div className="space-y-0.5">
                  <div className="flex items-center gap-2">
                    <p className="font-bold text-base">{invoice.title}</p>
                    <Badge
                      variant={
                        invoice.status === "paid"
                          ? "default"
                          : invoice.status === "cancelled"
                            ? "destructive"
                            : "secondary"
                      }
                      className={
                        invoice.status === "paid"
                          ? "bg-emerald-600 text-white"
                          : ""
                      }
                    >
                      {STATUS_FA[invoice.status] ?? invoice.status}
                    </Badge>
                  </div>
                  <p
                    className="text-muted-foreground text-xs tabular-nums"
                    dir="ltr"
                  >
                    {invoice.number}
                  </p>
                </div>
                <div className="text-left text-xs space-y-1">
                  <p className="font-bold text-sm tabular-nums text-foreground">
                    مبلغ کل: {formatMoney(invoice.total)}
                  </p>
                  <p className="text-muted-foreground tabular-nums">
                    پرداخت‌شده: {formatMoney(invoice.paidAmount)}
                  </p>
                </div>
              </div>

              {/* Installments List */}
              {invoice.installments.length > 0 ? (
                <div className="space-y-2">
                  <span className="text-xs font-semibold text-muted-foreground block">
                    اقساط این صورتحساب:
                  </span>
                  <ul className="divide-y rounded-xl border bg-muted/20" role="list">
                    {invoice.installments.map((inst) => {
                      const isPending =
                        inst.status === "pending" || inst.status === "overdue";
                      return (
                        <li
                          key={inst.id}
                          className="flex flex-col justify-between gap-3 p-3 sm:flex-row sm:items-center text-xs"
                        >
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <span className="font-semibold text-sm">
                                {inst.title || `قسط ${toPersianDigits(inst.sequence)}`}
                              </span>
                              <Badge
                                variant={
                                  inst.status === "paid"
                                    ? "default"
                                    : inst.status === "cancelled"
                                      ? "destructive"
                                      : "outline"
                                }
                                className={
                                  inst.status === "paid"
                                    ? "bg-emerald-600 text-white"
                                    : ""
                                }
                              >
                                {STATUS_FA[inst.status] ?? inst.status}
                              </Badge>
                            </div>
                            <div className="text-muted-foreground flex flex-wrap items-center gap-3 tabular-nums">
                              <span>مبلغ: {formatMoney(inst.amount)}</span>
                              <span>سررسید: {formatJalaliDate(inst.dueDate)}</span>
                              {inst.paidAt ? (
                                <span>
                                  پرداخت: {formatJalaliDate(inst.paidAt)}
                                </span>
                              ) : null}
                              {inst.paymentRef ? (
                                <span dir="ltr">کد: {inst.paymentRef}</span>
                              ) : null}
                            </div>
                          </div>

                          {/* Action Buttons for Installment */}
                          <Can permission="payment:manage">
                            <div className="flex items-center gap-2">
                              {isPending ? (
                                <>
                                  <Button
                                    type="button"
                                    size="sm"
                                    variant="secondary"
                                    className="h-8 gap-1 text-xs"
                                    onClick={() => {
                                      setManualPayTarget(inst);
                                      setManualMethod("cash");
                                      setManualRef("");
                                    }}
                                  >
                                    <Banknote className="size-3.5" />
                                    ثبت پرداخت دستی
                                  </Button>
                                  <Button
                                    type="button"
                                    size="sm"
                                    variant="ghost"
                                    className="h-8 gap-1 text-xs"
                                    onClick={() => {
                                      setEditTarget(inst);
                                      setEditTitle(inst.title || "");
                                      setEditAmount(String(inst.amount));
                                      setEditDueDate(inst.dueDate);
                                    }}
                                  >
                                    <Edit2 className="size-3.5" />
                                    ویرایش
                                  </Button>
                                  <Button
                                    type="button"
                                    size="sm"
                                    variant="ghost"
                                    className="h-8 gap-1 text-xs text-destructive hover:text-destructive"
                                    onClick={() => {
                                      setCancelTarget(inst);
                                      setCancelReason("");
                                    }}
                                  >
                                    <XCircle className="size-3.5" />
                                    لغو
                                  </Button>
                                </>
                              ) : null}
                            </div>
                          </Can>
                        </li>
                      );
                    })}
                  </ul>
                </div>
              ) : null}
            </li>
          ))}
        </ul>
      )}

      {/* ---------------- Dialog 1: Create Payment Plan ---------------- */}
      <Dialog open={planOpen} onOpenChange={setPlanOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto" dir="rtl">
          <DialogHeader>
            <DialogTitle>تعریف طرح پرداخت اقساطی</DialogTitle>
            <DialogDescription>
              جمع کل و اقساط را مشخص کنید. مجموع مبالغ اقساط باید دقیقاً با جمع کل
              برابر باشد.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="plan-total">مبلغ کل قرارداد (ریال)</Label>
                <Input
                  id="plan-total"
                  type="number"
                  dir="ltr"
                  value={planTotal}
                  onChange={(e) => setPlanTotal(e.target.value)}
                />
                <span className="text-muted-foreground text-xs tabular-nums">
                  معادل: {formatMoney(Number(planTotal) || 0)}
                </span>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="plan-inv-title">عنوان فاکتور هم‌زمان (اختیاری)</Label>
                <Input
                  id="plan-inv-title"
                  value={planInvoiceTitle}
                  onChange={(e) => setPlanInvoiceTitle(e.target.value)}
                />
              </div>
            </div>

            {/* Installments Rows */}
            <div className="space-y-3 border-t pt-3">
              <div className="flex items-center justify-between">
                <span className="text-sm font-semibold">اقساط</span>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="h-8 gap-1 text-xs"
                  onClick={handleAddPlanRow}
                >
                  <Plus className="size-3.5" />
                  افزودن قسط
                </Button>
              </div>

              <div className="space-y-2">
                {planRows.map((row, index) => (
                  <div
                    key={row.id}
                    className="flex flex-wrap items-center gap-2 rounded-xl border bg-muted/20 p-2.5"
                  >
                    <span className="text-xs font-semibold tabular-nums w-6 text-center">
                      {toPersianDigits(index + 1)}
                    </span>
                    <div className="flex-1 min-w-[120px]">
                      <Input
                        placeholder="عنوان قسط"
                        className="h-8 text-xs"
                        value={row.title}
                        onChange={(e) => {
                          const next = [...planRows];
                          next[index].title = e.target.value;
                          setPlanRows(next);
                        }}
                      />
                    </div>
                    <div className="w-36">
                      <Input
                        type="number"
                        dir="ltr"
                        placeholder="مبلغ (ریال)"
                        className="h-8 text-xs font-mono"
                        value={row.amount}
                        onChange={(e) => {
                          const next = [...planRows];
                          next[index].amount = e.target.value;
                          setPlanRows(next);
                        }}
                      />
                    </div>
                    <div className="w-36">
                      <Input
                        type="date"
                        className="h-8 text-xs"
                        value={row.dueDate}
                        onChange={(e) => {
                          const next = [...planRows];
                          next[index].dueDate = e.target.value;
                          setPlanRows(next);
                        }}
                      />
                    </div>
                    {planRows.length > 1 ? (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="h-8 w-8 p-0 text-destructive"
                        onClick={() => handleRemovePlanRow(index)}
                      >
                        <Trash2 className="size-4" />
                      </Button>
                    ) : null}
                  </div>
                ))}
              </div>

              {/* Validation Summary */}
              <div className="flex items-center justify-between rounded-xl bg-muted/40 p-3 text-xs">
                <span>
                  مجموع اقساط:{" "}
                  <strong className="tabular-nums font-bold">
                    {formatMoney(planRowsSum)}
                  </strong>
                </span>
                {planDiff !== 0 ? (
                  <span className="text-destructive font-medium flex items-center gap-1">
                    <AlertCircle className="size-4" />
                    اختلاف با مبلغ کل: {formatMoney(Math.abs(planDiff))}{" "}
                    {planDiff > 0 ? "کسری" : "اضافی"}
                  </span>
                ) : (
                  <span className="text-emerald-600 font-medium flex items-center gap-1 dark:text-emerald-400">
                    <CheckCircle2 className="size-4" />
                    مجموع با مبلغ کل منطبق است
                  </span>
                )}
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setPlanOpen(false)}
            >
              انصراف
            </Button>
            <Button
              type="button"
              disabled={!isPlanValid || createPaymentPlan.isPending}
              onClick={handleCreatePlan}
            >
              {createPaymentPlan.isPending ? "در حال ثبت…" : "ثبت طرح پرداخت"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ---------------- Dialog 2: Create Single Invoice ---------------- */}
      <Dialog open={invoiceOpen} onOpenChange={setInvoiceOpen}>
        <DialogContent dir="rtl">
          <DialogHeader>
            <DialogTitle>صدور فاکتور جدید</DialogTitle>
            <DialogDescription>
              فاکتور برای خدمات پرونده صادر شده و در پنل دانشجو قابل پرداخت است.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div className="space-y-2">
              <Label htmlFor="inv-title">عنوان فاکتور</Label>
              <Input
                id="inv-title"
                value={invoiceTitle}
                onChange={(e) => setInvoiceTitle(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="inv-amount">مبلغ (ریال)</Label>
              <Input
                id="inv-amount"
                inputMode="numeric"
                dir="ltr"
                value={invoiceAmount}
                onChange={(e) => setInvoiceAmount(e.target.value)}
              />
              <span className="text-muted-foreground text-xs tabular-nums">
                معادل: {formatMoney(Number(invoiceAmount) || 0)}
              </span>
            </div>
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setInvoiceOpen(false)}
            >
              انصراف
            </Button>
            <Button
              type="button"
              disabled={createInvoice.isPending}
              onClick={() => {
                const unitAmount = Number(invoiceAmount);
                if (!Number.isInteger(unitAmount) || unitAmount <= 0) {
                  toast.error("مبلغ معتبر وارد کنید");
                  return;
                }
                createInvoice.mutate(
                  {
                    caseId,
                    title: invoiceTitle.trim() || "فاکتور",
                    items: [
                      {
                        title: invoiceTitle.trim() || "خدمات",
                        quantity: 1,
                        unitAmount,
                      },
                    ],
                    discount: 0,
                    tax: 0,
                  },
                  {
                    onSuccess: () => {
                      toast.success("فاکتور صادر شد");
                      setInvoiceOpen(false);
                      void invoicesQuery.refetch();
                    },
                    onError: (error) => toast.error(getApiErrorMessage(error)),
                  },
                );
              }}
            >
              صدور فاکتور
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ---------------- Dialog 3: Mark Manual Payment ---------------- */}
      <Dialog
        open={manualPayTarget !== null}
        onOpenChange={(open) => {
          if (!open) setManualPayTarget(null);
        }}
      >
        <DialogContent dir="rtl">
          <DialogHeader>
            <DialogTitle>ثبت پرداخت دستی قسط</DialogTitle>
            <DialogDescription>
              {manualPayTarget
                ? `ثبت پرداخت برای ${manualPayTarget.title} به مبلغ ${formatMoney(manualPayTarget.amount)}`
                : null}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1.5">
              <Label htmlFor="manual-method">روش پرداخت</Label>
              <select
                id="manual-method"
                value={manualMethod}
                onChange={(e) =>
                  setManualMethod(
                    e.target.value as "cash" | "card_to_card" | "bank_transfer",
                  )
                }
                className="bg-background text-foreground h-9 w-full rounded-md border px-3 text-xs"
              >
                <option value="cash">نقدی</option>
                <option value="card_to_card">کارت‌به‌کارت</option>
                <option value="bank_transfer">حواله بانکی</option>
              </select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="manual-ref">شناسه پیگیری / سند بانکی (اختیاری)</Label>
              <Input
                id="manual-ref"
                placeholder="مثلاً شماره فیش یا رسید"
                value={manualRef}
                onChange={(e) => setManualRef(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setManualPayTarget(null)}
            >
              انصراف
            </Button>
            <Button
              type="button"
              disabled={markInstallmentPaid.isPending}
              onClick={() => {
                if (!manualPayTarget) return;
                markInstallmentPaid.mutate(
                  {
                    id: manualPayTarget.id,
                    body: {
                      paymentMethod: manualMethod,
                      paymentRef: manualRef.trim() || undefined,
                    },
                  },
                  {
                    onSuccess: () => {
                      toast.success("پرداخت دستی قسط ثبت گردید");
                      setManualPayTarget(null);
                      void invoicesQuery.refetch();
                    },
                    onError: (err) => toast.error(getApiErrorMessage(err)),
                  },
                );
              }}
            >
              ثبت پرداخت
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ---------------- Dialog 4: Edit Installment ---------------- */}
      <Dialog
        open={editTarget !== null}
        onOpenChange={(open) => {
          if (!open) setEditTarget(null);
        }}
      >
        <DialogContent dir="rtl">
          <DialogHeader>
            <DialogTitle>ویرایش قسط</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1.5">
              <Label htmlFor="edit-title">عنوان قسط</Label>
              <Input
                id="edit-title"
                value={editTitle}
                onChange={(e) => setEditTitle(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="edit-amount">مبلغ قسط (ریال)</Label>
              <Input
                id="edit-amount"
                type="number"
                dir="ltr"
                value={editAmount}
                onChange={(e) => setEditAmount(e.target.value)}
              />
              <span className="text-muted-foreground text-xs tabular-nums">
                معادل: {formatMoney(Number(editAmount) || 0)}
              </span>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="edit-due">تاریخ سررسید</Label>
              <Input
                id="edit-due"
                type="date"
                value={editDueDate}
                onChange={(e) => setEditDueDate(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setEditTarget(null)}
            >
              انصراف
            </Button>
            <Button
              type="button"
              disabled={updateInstallment.isPending}
              onClick={() => {
                if (!editTarget) return;
                const amt = Number(editAmount);
                if (!Number.isInteger(amt) || amt <= 0) {
                  toast.error("مبلغ معتبر نیست");
                  return;
                }
                updateInstallment.mutate(
                  {
                    id: editTarget.id,
                    body: {
                      title: editTitle.trim() || undefined,
                      amount: amt,
                      dueDate: editDueDate || undefined,
                    },
                  },
                  {
                    onSuccess: () => {
                      toast.success("قسط ویرایش شد");
                      setEditTarget(null);
                      void invoicesQuery.refetch();
                    },
                    onError: (err) => toast.error(getApiErrorMessage(err)),
                  },
                );
              }}
            >
              ذخیره تغییرات
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ---------------- Dialog 5: Cancel Installment with Reason ---------------- */}
      <Dialog
        open={cancelTarget !== null}
        onOpenChange={(open) => {
          if (!open) setCancelTarget(null);
        }}
      >
        <DialogContent dir="rtl">
          <DialogHeader>
            <DialogTitle>لغو قسط</DialogTitle>
            <DialogDescription>
              {cancelTarget
                ? `دلیل لغو «${cancelTarget.title}» را وارد کنید. این تغییر در سابقه پرونده ثبت خواهد شد.`
                : null}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <Label htmlFor="cancel-reason">دلیل لغو (حداقل ۳ نویسه)</Label>
            <Textarea
              id="cancel-reason"
              rows={3}
              placeholder="مثلاً: انصراف دانشجو از بسته خدمات تکمیلی…"
              value={cancelReason}
              onChange={(e) => setCancelReason(e.target.value)}
            />
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setCancelTarget(null)}
            >
              انصراف
            </Button>
            <Button
              type="button"
              variant="destructive"
              disabled={
                cancelReason.trim().length < 3 || cancelInstallment.isPending
              }
              onClick={() => {
                if (!cancelTarget) return;
                cancelInstallment.mutate(
                  {
                    id: cancelTarget.id,
                    body: { reason: cancelReason.trim() },
                  },
                  {
                    onSuccess: () => {
                      toast.success("قسط با موفقیت لغو شد");
                      setCancelTarget(null);
                      void invoicesQuery.refetch();
                    },
                    onError: (err) => toast.error(getApiErrorMessage(err)),
                  },
                );
              }}
            >
              تأیید لغو قسط
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
