import type {
  FinanceForecastItem,
  FinanceOverdueItem,
  FinanceReport,
  FinanceTransaction,
  Installment,
} from "@/contracts/payments";
import type { ApiResult } from "../utils";
import { deliverNotification } from "../domain-events";
import type { MockDb } from "../db";
import { toIsoDate } from "../utils";

const IDEMPOTENCY_TTL_MS = 24 * 60 * 60 * 1000;

type IdempotencyEntry = { expiresAt: number; result: ApiResult };
const payIdempotencyCache = new Map<string, IdempotencyEntry>();

export function withPayIdempotency(
  scope: string,
  key: string | null,
  run: () => ApiResult,
): ApiResult {
  if (!key) return run();
  const cacheKey = `${scope}:${key}`;
  const cached = payIdempotencyCache.get(cacheKey);
  if (cached && cached.expiresAt > Date.now()) {
    return cached.result;
  }
  const result = run();
  payIdempotencyCache.set(cacheKey, {
    expiresAt: Date.now() + IDEMPOTENCY_TTL_MS,
    result,
  });
  return result;
}

/** Test helper */
export function clearPayIdempotencyCache(): void {
  payIdempotencyCache.clear();
}

export function studentDisplayName(db: MockDb, studentId: string): string {
  const user = db.users.get(studentId);
  if (!user) return "دانشجو";
  return user.name?.trim() || user.mobile || "دانشجو";
}

export function installmentCaseId(
  db: MockDb,
  installment: Installment,
): string | null {
  if (installment.invoiceId) {
    return db.invoices.get(installment.invoiceId)?.caseId ?? null;
  }
  if (installment.paymentPlanId) {
    return db.paymentPlans.get(installment.paymentPlanId)?.caseId ?? null;
  }
  return null;
}

export function buildFinanceTransactions(db: MockDb): FinanceTransaction[] {
  const attempts = db.paymentAttempts.all().map((attempt) => {
    const installment = db.installments.get(attempt.installmentId);
    return {
      id: attempt.id,
      code: `PAY-${attempt.id.replaceAll("-", "").slice(0, 8).toUpperCase()}`,
      kind: "payment_attempt" as const,
      caseId: attempt.caseId,
      studentId: attempt.studentId,
      studentName: studentDisplayName(db, attempt.studentId),
      installmentId: attempt.installmentId,
      installmentTitle: installment?.title ?? null,
      amount: attempt.amount,
      method:
        attempt.method === "gateway"
          ? ("gateway" as const)
          : attempt.method === "cash"
            ? ("cash" as const)
            : ("card_to_card" as const),
      status: attempt.status,
      occurredAt: attempt.updatedAt || attempt.createdAt,
      ref: attempt.gatewayRef,
      receiptFileId: attempt.receiptFileId,
    };
  });

  const marks = db.installments
    .filter((item) => item.status === "paid" && item.paymentMethod !== null)
    .map((item) => {
      const caseId = installmentCaseId(db, item) ?? "";
      const linked = caseId ? db.cases.get(caseId) : null;
      const studentId = linked?.studentId ?? "";
      return {
        id: item.id,
        code: `INS-${item.id.replaceAll("-", "").slice(0, 8).toUpperCase()}`,
        kind: "installment_mark" as const,
        caseId,
        studentId,
        studentName: studentId ? studentDisplayName(db, studentId) : "—",
        installmentId: item.id,
        installmentTitle: item.title ?? null,
        amount: item.amount,
        method: item.paymentMethod,
        status: item.status,
        occurredAt: item.paidAt ?? item.updatedAt,
        ref: item.paymentRef,
        receiptFileId: null,
      };
    })
    .filter((row) => row.caseId && row.studentId);

  return [...attempts, ...marks];
}

function addDaysIso(isoDate: string, days: number): string {
  const d = new Date(`${isoDate}T12:00:00.000Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return toIsoDate(d);
}

/**
 * Mock scheduler (C5 pattern): notify students 3 days and 1 day before due.
 * At most one notification per (installment, daysBefore) pair.
 */
export function processInstallmentReminders(
  db: MockDb,
  nowMs = Date.now(),
): number {
  const today = toIsoDate(new Date(nowMs));
  const target3 = addDaysIso(today, 3);
  const target1 = addDaysIso(today, 1);
  const existing = db.notifications.all();
  let created = 0;

  for (const raw of db.installments.all()) {
    if (
      raw.status === "paid" ||
      raw.status === "cancelled" ||
      raw.status === "awaiting_verification"
    ) {
      continue;
    }
    const caseId = installmentCaseId(db, raw);
    if (!caseId) continue;
    const linked = db.cases.get(caseId);
    if (!linked) continue;

    for (const [daysBefore, dueTarget] of [
      [3, target3],
      [1, target1],
    ] as const) {
      if (raw.dueDate !== dueTarget) continue;
      const marker = `installment_due:${raw.id}:${daysBefore}`;
      const already = existing.some(
        (n) =>
          n.userId === linked.studentId &&
          n.type === "installment_due" &&
          (n.link?.includes(marker) || n.body.includes(marker)),
      );
      if (already) continue;
      const label =
        daysBefore === 3 ? "۳ روز دیگر" : "فردا";
      const n = deliverNotification(db, {
        userId: linked.studentId,
        type: "installment_due",
        title: "یادآوری سررسید قسط",
        body: `${raw.title || "قسط"} — سررسید ${label} (${marker})`,
        link: `/panel/payments#${marker}`,
      });
      if (n) {
        created += 1;
        existing.push(n);
      }
    }
  }
  return created;
}

export function buildFinanceReport(
  db: MockDb,
  from: string,
  to: string,
  caseIds?: ReadonlySet<string> | null,
): FinanceReport {
  const today = toIsoDate(new Date());
  const horizon = addDaysIso(today, 30);

  const paidInRange = db.installments
    .all()
    .filter((item) => {
      if (item.status !== "paid" || !item.paidAt) return false;
      const day = item.paidAt.slice(0, 10);
      if (day < from || day > to) return false;
      if (!caseIds) return true;
      const caseId = installmentCaseId(db, item);
      return caseId != null && caseIds.has(caseId);
    });

  const receivedRevenue = paidInRange.reduce((sum, item) => sum + item.amount, 0);

  const overdueItems: FinanceOverdueItem[] = db.installments
    .all()
    .filter((item) => {
      if (item.status === "paid" || item.status === "cancelled") return false;
      if (item.dueDate >= today) return false;
      if (!caseIds) return true;
      const caseId = installmentCaseId(db, item);
      return caseId != null && caseIds.has(caseId);
    })
    .map((item) => {
      const caseId = installmentCaseId(db, item)!;
      const linked = db.cases.get(caseId)!;
      return {
        installmentId: item.id,
        caseId,
        studentId: linked.studentId,
        studentName: studentDisplayName(db, linked.studentId),
        title: item.title || "قسط",
        amount: item.amount,
        dueDate: item.dueDate,
      };
    })
    .sort((a, b) => a.dueDate.localeCompare(b.dueDate));

  const overdueTotal = overdueItems.reduce((sum, item) => sum + item.amount, 0);

  const forecastMap = new Map<string, { amount: number; count: number }>();
  for (const item of db.installments.all()) {
    if (
      item.status === "paid" ||
      item.status === "cancelled" ||
      item.dueDate < today ||
      item.dueDate > horizon
    ) {
      continue;
    }
    if (caseIds) {
      const caseId = installmentCaseId(db, item);
      if (!caseId || !caseIds.has(caseId)) continue;
    }
    const prev = forecastMap.get(item.dueDate) ?? { amount: 0, count: 0 };
    forecastMap.set(item.dueDate, {
      amount: prev.amount + item.amount,
      count: prev.count + 1,
    });
  }

  const forecast30Days: FinanceForecastItem[] = [...forecastMap.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([dueDate, row]) => ({
      dueDate,
      amount: row.amount,
      count: row.count,
    }));

  const forecastTotal = forecast30Days.reduce(
    (sum, item) => sum + item.amount,
    0,
  );

  return {
    from,
    to,
    receivedRevenue,
    overdueTotal,
    overdueItems,
    forecast30Days,
    forecastTotal,
  };
}

export function financeReportToCsv(report: FinanceReport): string {
  const lines = [
    "section,key,amount_rials,extra",
    `summary,received_revenue,${report.receivedRevenue},`,
    `summary,overdue_total,${report.overdueTotal},${report.overdueItems.length}`,
    `summary,forecast_total,${report.forecastTotal},`,
    ...report.overdueItems.map(
      (item) =>
        `overdue,${item.installmentId},${item.amount},"${item.studentName.replaceAll('"', '""')}|${item.dueDate}"`,
    ),
    ...report.forecast30Days.map(
      (item) => `forecast,${item.dueDate},${item.amount},${item.count}`,
    ),
  ];
  return lines.join("\n");
}

/** Validate installment amounts sum to total (shared with Vitest). */
export function installmentsSumEqualsTotal(
  total: number,
  amounts: readonly number[],
): boolean {
  return amounts.reduce((sum, n) => sum + n, 0) === total;
}
