import type { z } from "zod";
import type {
  Installment,
  InvoiceItem,
  PaymentStatus,
  invoiceItemInputSchema,
} from "@/contracts/payments";
import type { StoredInvoice } from "../types";
import { toIsoDate } from "../utils";

type InvoiceItemInput = z.output<typeof invoiceItemInputSchema>;

export function buildInvoiceItems(
  inputs: readonly InvoiceItemInput[],
): InvoiceItem[] {
  return inputs.map((input) => ({
    ...input,
    amount: input.quantity * input.unitAmount,
  }));
}

export function computeTotals(
  items: readonly InvoiceItem[],
  discount: number,
  tax: number,
): { subtotal: number; total: number } {
  const subtotal = items.reduce((sum, item) => sum + item.amount, 0);
  return { subtotal, total: Math.max(0, subtotal - discount + tax) };
}

export function invoiceNumber(sequence: number): string {
  return `INV-1405-${String(sequence).padStart(5, "0")}`;
}

/** `pending` installments past their due date are reported as `overdue` */
export function withEffectiveStatus(
  installment: Installment,
  today = toIsoDate(new Date()),
): Installment {
  if (installment.status === "pending" && installment.dueDate < today) {
    return { ...installment, status: "overdue" };
  }
  return installment;
}

/** Re-derive paid amount / status / paid date of an invoice from its installments */
export function recalcInvoice(
  invoice: StoredInvoice,
  installments: readonly Installment[],
  today = toIsoDate(new Date()),
): StoredInvoice {
  if (invoice.status === "cancelled" || invoice.status === "refunded") {
    return invoice;
  }
  const effective = installments.map((item) => withEffectiveStatus(item, today));
  const paid = effective.filter((item) => item.status === "paid");
  const paidAmount = paid.reduce((sum, item) => sum + item.amount, 0);

  let status: PaymentStatus;
  if (installments.length > 0 && paidAmount >= invoice.total) status = "paid";
  else if (effective.some((item) => item.status === "overdue")) status = "overdue";
  else if (paidAmount > 0) status = "partially_paid";
  else status = "pending";

  const lastPaidAt = paid
    .map((item) => item.paidAt)
    .filter((value): value is string => Boolean(value))
    .sort()
    .at(-1);

  return {
    ...invoice,
    paidAmount,
    status,
    paidAt: status === "paid" ? (lastPaidAt ?? invoice.paidAt) : null,
  };
}
