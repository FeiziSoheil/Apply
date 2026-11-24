import type { Service } from "@/contracts/content";
import type {
  Installment,
  PaymentMethod,
} from "@/contracts/payments";
import type { StudentCase } from "@/contracts/students";
import {
  buildInvoiceItems,
  computeTotals,
  invoiceNumber,
  recalcInvoice,
} from "../domain/payments";
import type { StoredInvoice } from "../types";
import { DAY_MS, toIsoDate, uuidFromKey } from "../utils";
import {
  afterHours,
  chance,
  faker,
  iso,
  pick,
  type SeedClock,
} from "./helpers";

export type PaymentSeed = {
  invoices: StoredInvoice[];
  installments: Installment[];
};

const MILLION = 1_000_000;

export function buildPaymentSeed(input: {
  clock: SeedClock;
  cases: readonly StudentCase[];
  services: readonly Service[];
}): PaymentSeed {
  const { clock, cases, services } = input;
  const invoices: StoredInvoice[] = [];
  const installments: Installment[] = [];
  const priced = services.filter((service) => service.price !== undefined);
  const today = toIsoDate(new Date(clock.now));

  cases.slice(0, 32).forEach((studentCase, index) => {
    const service = pick(priced);
    const invoiceId = uuidFromKey(`invoice:${index}`);
    const issuedMs = new Date(studentCase.createdAt).getTime() + 2 * DAY_MS;
    const issuedAt = Math.min(issuedMs, clock.now - DAY_MS);

    const items = buildInvoiceItems([
      {
        title: service.title,
        quantity: 1,
        unitAmount: service.price ?? 100 * MILLION,
      },
      ...(chance(0.5)
        ? [
            {
              title: "ترجمه رسمی مدارک",
              quantity: faker.number.int({ min: 2, max: 8 }),
              unitAmount: faker.number.int({ min: 3, max: 9 }) * MILLION,
            },
          ]
        : []),
    ]);
    const subtotal = items.reduce((sum, item) => sum + item.amount, 0);
    const discount = chance(0.3) ? Math.round((subtotal * 0.05) / MILLION) * MILLION : 0;
    const tax = chance(0.4) ? Math.round((subtotal - discount) * 0.09) : 0;
    const totals = computeTotals(items, discount, tax);

    const cancelled = index % 11 === 10;
    const parts = faker.number.int({ min: 1, max: 4 });
    const base = Math.floor(totals.total / parts);
    const paidCount = cancelled ? 0 : faker.number.int({ min: 0, max: parts });

    const rows: Installment[] = Array.from({ length: parts }, (_, position) => {
      const dueMs = issuedAt + (position + 1) * 21 * DAY_MS;
      const amount = position === parts - 1 ? totals.total - base * (parts - 1) : base;
      const paid = position < paidCount;
      const paidMs = paid ? Math.min(dueMs - 2 * DAY_MS, clock.now - 3_600_000) : null;
      const method = paid
        ? pick<PaymentMethod>(["gateway", "card_to_card", "bank_transfer"])
        : null;
      const overdue =
        !paid && !cancelled && toIsoDate(new Date(dueMs)) < today && chance(0.4);
      const awaiting =
        !paid && !cancelled && !overdue && index % 7 === 0 && position === paidCount;
      return {
        id: uuidFromKey(`invoice:${index}:inst:${position}`),
        invoiceId,
        paymentPlanId: null,
        sequence: position + 1,
        title: `قسط ${position + 1}`,
        amount,
        dueDate: toIsoDate(new Date(dueMs)),
        status: cancelled
          ? "cancelled"
          : paid
            ? "paid"
            : awaiting
              ? "awaiting_verification"
              : overdue
                ? "overdue"
                : "pending",
        paidAt: paidMs === null ? null : iso(Math.max(paidMs, issuedAt)),
        paymentMethod: method,
        paymentRef: paid ? `REF-${faker.string.numeric(8)}` : null,
        createdAt: iso(issuedAt),
        updatedAt: iso(paidMs === null ? issuedAt : Math.max(paidMs, issuedAt)),
      };
    });

    const base0: StoredInvoice = {
      id: invoiceId,
      number: invoiceNumber(100 + index),
      caseId: studentCase.id,
      studentId: studentCase.studentId,
      title: `خدمات ${service.title}`,
      description: chance(0.4) ? "فاکتور خدمات مشاوره و پیگیری پرونده" : null,
      currency: "IRR",
      items,
      subtotal: totals.subtotal,
      discount,
      tax,
      total: totals.total,
      paidAmount: 0,
      status: cancelled ? "cancelled" : "pending",
      issuedAt: iso(issuedAt),
      dueDate: rows[rows.length - 1].dueDate,
      paidAt: null,
      createdAt: iso(issuedAt),
      updatedAt: iso(afterHours(clock, issuedAt, 1, 72)),
    };

    invoices.push(recalcInvoice(base0, rows, today));
    installments.push(...rows);
  });

  return { invoices, installments };
}
