import type {
  Installment,
  InstallmentListQuery,
  InstallmentMarkPaid,
  InstallmentPay,
  InstallmentPlan,
  InvoiceCancel,
  InvoiceCreate,
  InvoiceListQuery,
  PaymentVerify,
} from "@/contracts/payments";
import { defineRoute, type RouteImplementations } from "../contract";
import { getDb, type MockDb } from "../db";
import {
  buildInvoiceItems,
  computeTotals,
  invoiceNumber,
  recalcInvoice,
  withEffectiveStatus,
} from "../domain/payments";
import { canAccessCase } from "../domain/access";
import { requireUser } from "../domain/users";
import { apiError } from "../errors";
import type { MockUser, StoredInvoice } from "../types";
import {
  DAY_MS,
  created,
  matchesQuery,
  newId,
  nowIso,
  ok,
  pageResult,
  resolveSort,
  sortItems,
  toIsoDate,
} from "../utils";

type IdParams = { params: { id: string } };

/** Pending gateway transactions: authority → installment id (memory only) */
type GlobalWithIntents = typeof globalThis & {
  __applyMockIntents?: Map<string, { installmentId: string; verified: boolean }>;
};
function intents() {
  const holder = globalThis as GlobalWithIntents;
  holder.__applyMockIntents ??= new Map();
  return holder.__applyMockIntents;
}

/** admin: all · student: own · consultant: invoices of own cases */
function canSeeInvoice(db: MockDb, user: MockUser, invoice: StoredInvoice): boolean {
  if (user.role === "admin") return true;
  if (user.role === "student") return invoice.studentId === user.id;
  const linked = db.cases.get(invoice.caseId);
  return linked ? canAccessCase(user, linked) : false;
}

function findInvoice(db: MockDb, id: string): StoredInvoice {
  const invoice = db.invoices.get(id);
  if (!invoice) throw apiError.notFound("فاکتور");
  return invoice;
}

function findInstallment(db: MockDb, id: string): Installment {
  const installment = db.installments.get(id);
  if (!installment) throw apiError.notFound("قسط");
  return installment;
}

function installmentsOf(db: MockDb, invoiceId: string): Installment[] {
  return db.installments
    .filter((item) => item.invoiceId === invoiceId)
    .sort((a, b) => a.sequence - b.sequence)
    .map((item) => withEffectiveStatus(item));
}

/** Contract `Invoice`: stored invoice with its installments, status re-derived */
function presentInvoice(db: MockDb, stored: StoredInvoice) {
  const installments = installmentsOf(db, stored.id);
  return { ...recalcInvoice(stored, installments), installments };
}

/** Persist the re-derived status/paid amount after installments changed */
function syncInvoice(db: MockDb, invoiceId: string) {
  const stored = findInvoice(db, invoiceId);
  const next = recalcInvoice(stored, installmentsOf(db, invoiceId));
  db.invoices.update(invoiceId, {
    paidAmount: next.paidAmount,
    status: next.status,
    paidAt: next.paidAt,
    updatedAt: nowIso(),
  });
  return presentInvoice(db, findInvoice(db, invoiceId));
}

function assertPlanMatchesTotal(
  total: number,
  paid: number,
  plan: readonly { amount: number }[],
  field: string,
): void {
  const planned = plan.reduce((sum, item) => sum + item.amount, 0);
  if (planned + paid !== total) {
    throw apiError.invalidField(
      field,
      `مجموع اقساط (${planned + paid} ریال) باید دقیقاً برابر مبلغ کل فاکتور (${total} ریال) باشد`,
    );
  }
}

function insertInstallments(
  db: MockDb,
  invoiceId: string,
  plan: readonly { amount: number; dueDate: string }[],
  startSequence: number,
): void {
  const now = nowIso();
  plan.forEach((item, index) => {
    db.installments.insert({
      id: newId(),
      invoiceId,
      paymentPlanId: null,
      sequence: startSequence + index,
      title: `قسط ${startSequence + index}`,
      amount: item.amount,
      dueDate: item.dueDate,
      status: "pending",
      paidAt: null,
      paymentMethod: null,
      paymentRef: null,
      createdAt: now,
      updatedAt: now,
    });
  });
}

function assertInstallmentAccess(db: MockDb, user: MockUser, installment: Installment): void {
  if (installment.invoiceId) {
    const invoice = findInvoice(db, installment.invoiceId);
    if (!canSeeInvoice(db, user, invoice)) throw apiError.forbidden();
    return;
  }
  if (installment.paymentPlanId) {
    const plan = db.paymentPlans.get(installment.paymentPlanId);
    const linked = plan ? db.cases.get(plan.caseId) : undefined;
    if (!linked || !canAccessCase(user, linked)) throw apiError.forbidden();
    return;
  }
  throw apiError.notFound("قسط");
}

function markPaid(
  db: MockDb,
  installment: Installment,
  input: { method: Installment["paymentMethod"]; ref: string | null; paidAt?: string },
) {
  const paidAt = input.paidAt ?? nowIso();
  db.installments.update(installment.id, {
    status: "paid",
    paidAt,
    paymentMethod: input.method,
    paymentRef: input.ref,
    updatedAt: nowIso(),
  });
  if (installment.invoiceId) syncInvoice(db, installment.invoiceId);
  return withEffectiveStatus(findInstallment(db, installment.id));
}

export const paymentHandlers: RouteImplementations = {
  /* ----- Invoices ----- */

  listInvoices: defineRoute<{ query: InvoiceListQuery }>(({ user, query }) => {
    const actor = requireUser(user);
    const db = getDb();
    const filtered = db.invoices
      .all()
      .filter((invoice) => canSeeInvoice(db, actor, invoice))
      .map((invoice) => presentInvoice(db, invoice))
      .filter((invoice) => !query.status || invoice.status === query.status)
      .filter((invoice) => !query.caseId || invoice.caseId === query.caseId)
      .filter((invoice) => !query.studentId || invoice.studentId === query.studentId)
      .filter((invoice) => !query.dueFrom || (invoice.dueDate ?? "") >= query.dueFrom)
      .filter((invoice) => !query.dueTo || (invoice.dueDate ?? "9999") <= query.dueTo)
      .filter((invoice) => matchesQuery(query.q, [invoice.number, invoice.title]));
    const { sort, order } = resolveSort(query, { sort: "issuedAt", order: "desc" });
    return pageResult(
      sortItems(filtered, sort, order, {
        issuedAt: (invoice) => invoice.issuedAt,
        dueDate: (invoice) => invoice.dueDate,
        total: (invoice) => invoice.total,
      }),
      query,
    );
  }),

  createInvoice: defineRoute<{ body: InvoiceCreate }>(({ body }) => {
    const db = getDb();
    const linkedCase = db.cases.get(body.caseId);
    if (!linkedCase) throw apiError.invalidField("caseId", "پرونده پیدا نشد");

    const items = buildInvoiceItems(body.items);
    const { subtotal, total } = computeTotals(items, body.discount, body.tax);
    if (body.discount > subtotal + body.tax) {
      throw apiError.invalidField("discount", "تخفیف نمی‌تواند از مبلغ فاکتور بیشتر باشد");
    }
    const now = nowIso();
    const plan =
      body.installments && body.installments.length > 0
        ? body.installments
        : [{ amount: total, dueDate: toIsoDate(new Date(Date.now() + 30 * DAY_MS)) }];
    assertPlanMatchesTotal(total, 0, plan, "installments");

    const dueDates = plan.map((item) => item.dueDate).sort();
    const invoice = db.invoices.insert({
      id: newId(),
      number: invoiceNumber(100 + db.invoices.count()),
      caseId: linkedCase.id,
      studentId: linkedCase.studentId,
      title: body.title,
      description: body.description ?? null,
      currency: "IRR",
      items,
      subtotal,
      discount: body.discount,
      tax: body.tax,
      total,
      paidAmount: 0,
      status: "pending",
      issuedAt: now,
      dueDate: body.dueDate ?? dueDates[dueDates.length - 1] ?? null,
      paidAt: null,
      createdAt: now,
      updatedAt: now,
    });
    insertInstallments(db, invoice.id, plan, 1);
    return created(syncInvoice(db, invoice.id));
  }),

  getInvoice: defineRoute<IdParams>(({ user, params }) => {
    const db = getDb();
    const invoice = findInvoice(db, params.id);
    if (!canSeeInvoice(db, requireUser(user), invoice)) throw apiError.forbidden();
    return ok(presentInvoice(db, invoice));
  }),

  cancelInvoice: defineRoute<IdParams & { body: InvoiceCancel }>(({ params, body }) => {
    const db = getDb();
    const invoice = findInvoice(db, params.id);
    const installments = installmentsOf(db, invoice.id);
    if (invoice.status === "cancelled") throw apiError.conflict("فاکتور از قبل ابطال شده است");
    if (installments.some((item) => item.status === "paid")) {
      throw apiError.conflict("فاکتور دارای پرداخت موفق است و قابل ابطال نیست");
    }
    const now = nowIso();
    for (const item of installments) {
      db.installments.update(item.id, { status: "cancelled", updatedAt: now });
    }
    db.invoices.update(invoice.id, {
      status: "cancelled",
      description: `${invoice.description ? `${invoice.description}\n` : ""}ابطال: ${body.reason}`.slice(0, 1000),
      updatedAt: now,
    });
    return ok(presentInvoice(db, findInvoice(db, invoice.id)));
  }),

  replaceInvoiceInstallments: defineRoute<IdParams & { body: InstallmentPlan }>(
    ({ params, body }) => {
      const db = getDb();
      const invoice = findInvoice(db, params.id);
      if (invoice.status === "cancelled" || invoice.status === "refunded") {
        throw apiError.conflict("اقساط فاکتور ابطال‌شده قابل تغییر نیست");
      }
      const existing = installmentsOf(db, invoice.id);
      const kept = existing.filter((item) => item.status === "paid");
      const paid = kept.reduce((sum, item) => sum + item.amount, 0);
      assertPlanMatchesTotal(invoice.total, paid, body.installments, "installments");

      for (const item of existing) {
        if (item.status !== "paid") db.installments.remove(item.id);
      }
      insertInstallments(db, invoice.id, body.installments, kept.length + 1);
      return ok(syncInvoice(db, invoice.id));
    },
  ),

  /* ----- Installments ----- */

  listInstallments: defineRoute<{ query: InstallmentListQuery }>(({ user, query }) => {
    const actor = requireUser(user);
    const db = getDb();
    const filtered = db.installments
      .all()
      .filter((item) => {
        if (item.invoiceId) {
          const invoice = db.invoices.get(item.invoiceId);
          return invoice ? canSeeInvoice(db, actor, invoice) : false;
        }
        if (item.paymentPlanId) {
          const plan = db.paymentPlans.get(item.paymentPlanId);
          const linked = plan ? db.cases.get(plan.caseId) : undefined;
          return linked ? canAccessCase(actor, linked) : false;
        }
        return false;
      })
      .map((item) => withEffectiveStatus(item))
      .filter((item) => !query.status || item.status === query.status)
      .filter((item) => !query.invoiceId || item.invoiceId === query.invoiceId)
      .filter((item) => !query.dueTo || item.dueDate <= query.dueTo)
      .filter((item) =>
        matchesQuery(query.q, [
          item.invoiceId ? db.invoices.get(item.invoiceId)?.number : undefined,
          item.paymentRef,
        ]),
      );
    const { sort, order } = resolveSort(query, { sort: "dueDate", order: "asc" });
    return pageResult(
      sortItems(filtered, sort, order, {
        dueDate: (item) => item.dueDate,
        createdAt: (item) => item.createdAt,
      }),
      query,
    );
  }),

  getInstallment: defineRoute<IdParams>(({ user, params }) => {
    const db = getDb();
    const installment = findInstallment(db, params.id);
    assertInstallmentAccess(db, requireUser(user), installment);
    return ok(withEffectiveStatus(installment));
  }),

  payInstallment: defineRoute<IdParams & { body: InstallmentPay }>(
    ({ user, params, body, origin }) => {
      const db = getDb();
      const installment = findInstallment(db, params.id);
      assertInstallmentAccess(db, requireUser(user), installment);
      if (installment.status === "paid" || installment.status === "cancelled") {
        throw apiError.conflict("این قسط پرداخت یا لغو شده است");
      }
      const authority = `A${newId().replaceAll("-", "").slice(0, 20).toUpperCase()}`;
      intents().set(authority, { installmentId: installment.id, verified: false });
      const paymentUrl = new URL("/mock-gateway", origin);
      paymentUrl.searchParams.set("authority", authority);
      paymentUrl.searchParams.set("callback", body.callbackUrl);
      return created({
        authority,
        paymentUrl: paymentUrl.toString(),
        expiresAt: new Date(Date.now() + 15 * 60_000).toISOString(),
      });
    },
  ),

  markInstallmentPaid: defineRoute<IdParams & { body: InstallmentMarkPaid }>(
    ({ params, body }) => {
      const db = getDb();
      const installment = findInstallment(db, params.id);
      if (installment.status === "paid" || installment.status === "cancelled") {
        throw apiError.conflict("این قسط پرداخت یا لغو شده است");
      }
      return ok(
        markPaid(db, installment, {
          method: body.paymentMethod,
          ref: body.paymentRef ?? null,
          paidAt: body.paidAt,
        }),
      );
    },
  ),

  verifyPayment: defineRoute<{ body: PaymentVerify }>(({ user, body }) => {
    const actor = requireUser(user);
    const db = getDb();
    const intent = intents().get(body.authority);
    if (!intent) throw apiError.notFound("تراکنش");
    const installment = findInstallment(db, intent.installmentId);
    assertInstallmentAccess(db, actor, installment);

    // Idempotent: a repeated call with the same authority returns the same result
    if (intent.verified) return ok(withEffectiveStatus(installment));
    if (body.gatewayStatus === "NOK") {
      throw apiError.conflict("پرداخت توسط درگاه تأیید نشد");
    }
    intent.verified = true;
    return ok(
      markPaid(db, installment, {
        method: "gateway",
        ref: `REF-${body.authority.slice(-8)}`,
      }),
    );
  }),
};
