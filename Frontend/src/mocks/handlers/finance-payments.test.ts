import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { paymentPlanCreateSchema } from "@/contracts/payments";
import { permissionsForRole } from "@/lib/rbac/permissions";
import { DEMO_ACCOUNTS } from "@/mocks/config";
import { getDb, resetDb } from "@/mocks/db";
import {
  clearPayIdempotencyCache,
  processInstallmentReminders,
} from "@/mocks/domain/payment-finance";
import { MockApiError } from "@/mocks/errors";
import type { MockUser } from "@/mocks/types";
import { newId, nowIso, toIsoDate } from "@/mocks/utils";
import { studentPanelHandlers } from "./student-panel";

function demoStudent(): MockUser {
  const user = getDb().users.find(
    (entry) => entry.mobile === DEMO_ACCOUNTS.student.mobile,
  );
  if (!user) throw new Error("demo student missing from seed");
  return user;
}

function adminUser(): MockUser {
  const admin = getDb().users.find((entry) => entry.role === "admin");
  if (!admin) throw new Error("admin missing from seed");
  return { ...admin, permissions: permissionsForRole("admin") };
}

describe("Finance & Payments Domain", () => {
  beforeEach(() => {
    resetDb();
    clearPayIdempotencyCache();
  });

  afterEach(() => {
    resetDb();
    clearPayIdempotencyCache();
  });

  describe("1. Installment Sum Validation", () => {
    it("rejects payment plan when sum of installments does not equal total", () => {
      const invalidPlan = {
        total: 50_000_000,
        installments: [
          { title: "قسط اول", amount: 20_000_000, dueDate: "2026-11-01" },
          { title: "قسط دوم", amount: 20_000_000, dueDate: "2026-12-01" },
        ], // sum = 40,000,000 != 50,000,000
      };

      const result = paymentPlanCreateSchema.safeParse(invalidPlan);
      expect(result.success).toBe(false);
      if (!result.success) {
        const msg = result.error.issues.map((i) => i.message).join(" ");
        expect(msg).toContain("مجموع اقساط باید برابر مبلغ کل باشد");
      }
    });

    it("accepts payment plan when sum of installments exactly equals total", async () => {
      const admin = adminUser();
      const student = demoStudent();
      const studentCase = getDb().cases.find((c) => c.studentId === student.id);
      expect(studentCase).toBeDefined();

      const validPlan = {
        total: 50_000_000,
        installments: [
          { title: "قسط اول", amount: 25_000_000, dueDate: "2026-11-01" },
          { title: "قسط دوم", amount: 25_000_000, dueDate: "2026-12-01" },
        ],
        invoiceTitle: "قرارداد اعزام دانشجو",
      };

      const parsed = paymentPlanCreateSchema.safeParse(validPlan);
      expect(parsed.success).toBe(true);

      const createdPlan = await studentPanelHandlers.createCasePaymentPlan.run({
        params: { id: studentCase!.id },
        query: undefined,
        body: validPlan,
        user: admin,
        request: new Request("http://mock.test"),
        url: new URL("http://mock.test"),
        origin: "http://mock.test",
      });

      expect(createdPlan.status).toBe(201);
      const data = createdPlan.data as {
        total: number;
        installments: { amount: number; title: string }[];
      };
      expect(data.total).toBe(50_000_000);
      expect(data.installments).toHaveLength(2);
      expect(
        data.installments.reduce((sum, item) => sum + item.amount, 0),
      ).toBe(50_000_000);
    });
  });

  describe("2. Duplicate Payment & Idempotency", () => {
    it("returns identical response on repeated request with same Idempotency-Key", async () => {
      const student = demoStudent();
      const list = await studentPanelHandlers.listMyInstallments.run({
        params: undefined,
        query: undefined,
        body: undefined,
        user: student,
        request: new Request("http://mock.test"),
        url: new URL("http://mock.test"),
        origin: "http://mock.test",
      });
      const payable = (
        list.data as { id: string; status: string }[]
      ).find((item) => item.status === "pending" || item.status === "overdue");
      expect(payable).toBeDefined();

      const idemKey = "idem-test-key-12345";
      const makeRequest = () =>
        new Request("http://mock.test/api/me/installments/" + payable!.id + "/pay", {
          method: "POST",
          headers: {
            "Idempotency-Key": idemKey,
            "Content-Type": "application/json",
          },
        });

      const res1 = await studentPanelHandlers.payMyInstallment.run({
        params: { id: payable!.id },
        query: undefined,
        body: {
          method: "gateway",
          callbackUrl: "http://mock.test/panel/payments/callback",
        },
        user: student,
        request: makeRequest(),
        url: new URL("http://mock.test"),
        origin: "http://mock.test",
      });

      const payment1 = res1.data as { paymentId: string };
      expect(payment1.paymentId).toBeDefined();

      // Second call with same idempotency key
      const res2 = await studentPanelHandlers.payMyInstallment.run({
        params: { id: payable!.id },
        query: undefined,
        body: {
          method: "gateway",
          callbackUrl: "http://mock.test/panel/payments/callback",
        },
        user: student,
        request: makeRequest(),
        url: new URL("http://mock.test"),
        origin: "http://mock.test",
      });

      const payment2 = res2.data as { paymentId: string };
      // Idempotency: exact same paymentId returned
      expect(payment2.paymentId).toBe(payment1.paymentId);
    });

    it("rejects duplicate payment without idempotency when payment is in-flight", async () => {
      const student = demoStudent();
      const list = await studentPanelHandlers.listMyInstallments.run({
        params: undefined,
        query: undefined,
        body: undefined,
        user: student,
        request: new Request("http://mock.test"),
        url: new URL("http://mock.test"),
        origin: "http://mock.test",
      });
      const payable = (
        list.data as { id: string; status: string }[]
      ).find((item) => item.status === "pending" || item.status === "overdue");
      expect(payable).toBeDefined();

      // First payment attempt
      await studentPanelHandlers.payMyInstallment.run({
        params: { id: payable!.id },
        query: undefined,
        body: {
          method: "gateway",
          callbackUrl: "http://mock.test/panel/payments/callback",
        },
        user: student,
        request: new Request("http://mock.test"),
        url: new URL("http://mock.test"),
        origin: "http://mock.test",
      });

      // Second attempt on the same installment without identical idempotency key
      let conflictError: MockApiError | null = null;
      try {
        await studentPanelHandlers.payMyInstallment.run({
          params: { id: payable!.id },
          query: undefined,
          body: {
            method: "gateway",
            callbackUrl: "http://mock.test/panel/payments/callback",
          },
          user: student,
          request: new Request("http://mock.test"),
          url: new URL("http://mock.test"),
          origin: "http://mock.test",
        });
      } catch (err) {
        if (err instanceof MockApiError) {
          conflictError = err;
        }
      }

      expect(conflictError).not.toBeNull();
      expect(conflictError?.status).toBe(409);
      expect(conflictError?.message).toContain("پرداخت این قسط در حال انجام است");
    });

    it("rejects payment on already paid installment", async () => {
      const student = demoStudent();
      const db = getDb();
      const paidInstallment = db.installments
        .all()
        .find((item) => item.status === "paid");
      expect(paidInstallment).toBeDefined();

      let error: MockApiError | null = null;
      try {
        await studentPanelHandlers.payMyInstallment.run({
          params: { id: paidInstallment!.id },
          query: undefined,
          body: {
            method: "gateway",
            callbackUrl: "http://mock.test/panel/payments/callback",
          },
          user: student,
          request: new Request("http://mock.test"),
          url: new URL("http://mock.test"),
          origin: "http://mock.test",
        });
      } catch (err) {
        if (err instanceof MockApiError) {
          error = err;
        }
      }

      expect(error).not.toBeNull();
      expect(error?.status).toBe(409);
      expect(error?.message).toContain("این قسط قابل پرداخت نیست");
    });
  });

  describe("3. Fake Callback Verification", () => {
    it("does not finalize payment if gateway is not resolved on server", async () => {
      const student = demoStudent();
      const list = await studentPanelHandlers.listMyInstallments.run({
        params: undefined,
        query: undefined,
        body: undefined,
        user: student,
        request: new Request("http://mock.test"),
        url: new URL("http://mock.test"),
        origin: "http://mock.test",
      });
      const payable = (
        list.data as { id: string; status: string }[]
      ).find((item) => item.status === "pending" || item.status === "overdue");
      expect(payable).toBeDefined();

      const payRes = await studentPanelHandlers.payMyInstallment.run({
        params: { id: payable!.id },
        query: undefined,
        body: {
          method: "gateway",
          callbackUrl: "http://mock.test/panel/payments/callback",
        },
        user: student,
        request: new Request("http://mock.test"),
        url: new URL("http://mock.test"),
        origin: "http://mock.test",
      });
      const paymentId = (payRes.data as { paymentId: string }).paymentId;

      // Fake callback attempt: Client tries to query payment status directly
      // Since mock gateway resolve was NOT called, the server state remains 'initiated'
      const checkRes = await studentPanelHandlers.getMyPayment.run({
        params: { id: paymentId },
        query: undefined,
        body: undefined,
        user: student,
        request: new Request("http://mock.test"),
        url: new URL("http://mock.test"),
        origin: "http://mock.test",
      });

      const attempt = checkRes.data as { status: string };
      expect(attempt.status).toBe("initiated");
      expect(attempt.status).not.toBe("succeeded");

      // The installment must still be unpaid in DB
      const updatedInstallment = getDb().installments.get(payable!.id);
      expect(updatedInstallment?.status).not.toBe("paid");
    });

    it("marks installment paid only after server-side gateway success", async () => {
      const student = demoStudent();
      const list = await studentPanelHandlers.listMyInstallments.run({
        params: undefined,
        query: undefined,
        body: undefined,
        user: student,
        request: new Request("http://mock.test"),
        url: new URL("http://mock.test"),
        origin: "http://mock.test",
      });
      const payable = (
        list.data as { id: string; status: string }[]
      ).find((item) => item.status === "pending" || item.status === "overdue");
      expect(payable).toBeDefined();

      const payRes = await studentPanelHandlers.payMyInstallment.run({
        params: { id: payable!.id },
        query: undefined,
        body: {
          method: "gateway",
          callbackUrl: "http://mock.test/panel/payments/callback",
        },
        user: student,
        request: new Request("http://mock.test"),
        url: new URL("http://mock.test"),
        origin: "http://mock.test",
      });
      const paymentId = (payRes.data as { paymentId: string }).paymentId;

      // Server resolves gateway outcome
      await studentPanelHandlers.resolveMockGateway.run({
        params: { id: paymentId },
        query: undefined,
        body: { outcome: "success" },
        user: student,
        request: new Request("http://mock.test"),
        url: new URL("http://mock.test"),
        origin: "http://mock.test",
      });

      // Verification via GET /me/payments/{id}
      const verified = await studentPanelHandlers.getMyPayment.run({
        params: { id: paymentId },
        query: undefined,
        body: undefined,
        user: student,
        request: new Request("http://mock.test"),
        url: new URL("http://mock.test"),
        origin: "http://mock.test",
      });

      expect((verified.data as { status: string }).status).toBe("succeeded");
      const installmentAfter = getDb().installments.get(payable!.id);
      expect(installmentAfter?.status).toBe("paid");
    });
  });

  describe("4. Card-to-Card Verification Queue", () => {
    it("card-to-card submission sets awaiting_verification; approval marks paid", async () => {
      const student = demoStudent();
      const admin = adminUser();
      const db = getDb();

      // Create a dummy receipt file
      const dummyFile = db.files.insert({
        id: newId(),
        name: "receipt.png",
        url: "http://mock.test/files/receipt.png",
        mimeType: "image/png",
        size: 1024,
        ownerId: student.id,
        createdAt: nowIso(),
      });

      const list = await studentPanelHandlers.listMyInstallments.run({
        params: undefined,
        query: undefined,
        body: undefined,
        user: student,
        request: new Request("http://mock.test"),
        url: new URL("http://mock.test"),
        origin: "http://mock.test",
      });
      const payable = (
        list.data as { id: string; status: string }[]
      ).find((item) => item.status === "pending" || item.status === "overdue");
      expect(payable).toBeDefined();

      // Student submits card-to-card with receipt
      const payRes = await studentPanelHandlers.payMyInstallment.run({
        params: { id: payable!.id },
        query: undefined,
        body: {
          method: "card_to_card",
          receiptFileId: dummyFile.id,
        },
        user: student,
        request: new Request("http://mock.test"),
        url: new URL("http://mock.test"),
        origin: "http://mock.test",
      });

      const attemptId = (payRes.data as { paymentId: string }).paymentId;
      const attempt = db.paymentAttempts.get(attemptId);
      expect(attempt?.status).toBe("awaiting_verification");

      const instInDb = db.installments.get(payable!.id);
      expect(instInDb?.status).toBe("awaiting_verification");

      // Staff verifies with decision: "approve"
      const verifyRes = await studentPanelHandlers.verifyPaymentAttempt.run({
        params: { id: attemptId },
        query: undefined,
        body: { decision: "approve" },
        user: admin,
        request: new Request("http://mock.test"),
        url: new URL("http://mock.test"),
        origin: "http://mock.test",
      });

      expect(verifyRes.status).toBe(200);
      const updatedAttempt = db.paymentAttempts.get(attemptId);
      expect(updatedAttempt?.status).toBe("succeeded");

      const updatedInst = db.installments.get(payable!.id);
      expect(updatedInst?.status).toBe("paid");
    });

    it("card-to-card rejection marks attempt failed, reverts installment to pending, sends notification", async () => {
      const student = demoStudent();
      const admin = adminUser();
      const db = getDb();

      const dummyFile = db.files.insert({
        id: newId(),
        name: "receipt2.png",
        url: "http://mock.test/files/receipt2.png",
        mimeType: "image/png",
        size: 2048,
        ownerId: student.id,
        createdAt: nowIso(),
      });

      const list = await studentPanelHandlers.listMyInstallments.run({
        params: undefined,
        query: undefined,
        body: undefined,
        user: student,
        request: new Request("http://mock.test"),
        url: new URL("http://mock.test"),
        origin: "http://mock.test",
      });
      const payable = (
        list.data as { id: string; status: string }[]
      ).find((item) => item.status === "pending" || item.status === "overdue");
      expect(payable).toBeDefined();

      const payRes = await studentPanelHandlers.payMyInstallment.run({
        params: { id: payable!.id },
        query: undefined,
        body: {
          method: "card_to_card",
          receiptFileId: dummyFile.id,
        },
        user: student,
        request: new Request("http://mock.test"),
        url: new URL("http://mock.test"),
        origin: "http://mock.test",
      });
      const attemptId = (payRes.data as { paymentId: string }).paymentId;

      // Staff rejects with required note
      const rejectNote = "شماره پیگیری در تصویر ناخوانا است";
      const rejectRes = await studentPanelHandlers.verifyPaymentAttempt.run({
        params: { id: attemptId },
        query: undefined,
        body: { decision: "reject", note: rejectNote },
        user: admin,
        request: new Request("http://mock.test"),
        url: new URL("http://mock.test"),
        origin: "http://mock.test",
      });

      expect(rejectRes.status).toBe(200);
      const attempt = db.paymentAttempts.get(attemptId);
      expect(attempt?.status).toBe("failed");

      const inst = db.installments.get(payable!.id);
      expect(inst?.status).toBe("pending");

      // Verify student received notification
      const notif = db.notifications
        .all()
        .find(
          (n) =>
            n.userId === student.id &&
            n.body.includes(rejectNote) &&
            n.title.includes("رد"),
        );
      expect(notif).toBeDefined();
    });
  });

  describe("5. Installment Due Reminders", () => {
    it("generates installment_due notifications for installments due in 3 days or 1 day", () => {
      const db = getDb();
      const student = demoStudent();
      const studentCase = db.cases.find((c) => c.studentId === student.id);
      expect(studentCase).toBeDefined();

      const today = new Date();
      const in3Days = new Date(today);
      in3Days.setDate(today.getDate() + 3);
      const in1Day = new Date(today);
      in1Day.setDate(today.getDate() + 1);

      const due3Str = toIsoDate(in3Days);
      const due1Str = toIsoDate(in1Day);

      // Insert an installment due in 3 days
      db.installments.insert({
        id: newId(),
        invoiceId: null,
        paymentPlanId: null,
        sequence: 10,
        title: "قسط آزمایشی ۳ روزه",
        amount: 15_000_000,
        dueDate: due3Str,
        status: "pending",
        paidAt: null,
        paymentMethod: null,
        paymentRef: null,
        createdAt: nowIso(),
        updatedAt: nowIso(),
      });

      // Link it via an invoice to the student's case
      const inst3 = db.installments.all().find((i) => i.title === "قسط آزمایشی ۳ روزه")!;
      const inv3 = db.invoices.insert({
        id: newId(),
        number: "INV-DUE-3",
        caseId: studentCase!.id,
        studentId: student.id,
        title: "فاکتور آزمایشی ۳ روز",
        description: null,
        currency: "IRR",
        items: [],
        subtotal: 15_000_000,
        discount: 0,
        tax: 0,
        total: 15_000_000,
        paidAmount: 0,
        status: "pending",
        issuedAt: nowIso(),
        dueDate: due3Str,
        paidAt: null,
        createdAt: nowIso(),
        updatedAt: nowIso(),
      });
      db.installments.update(inst3.id, { invoiceId: inv3.id });

      // Insert an installment due in 1 day
      db.installments.insert({
        id: newId(),
        invoiceId: inv3.id,
        paymentPlanId: null,
        sequence: 11,
        title: "قسط آزمایشی ۱ روزه",
        amount: 10_000_000,
        dueDate: due1Str,
        status: "pending",
        paidAt: null,
        paymentMethod: null,
        paymentRef: null,
        createdAt: nowIso(),
        updatedAt: nowIso(),
      });

      const createdCount = processInstallmentReminders(db);
      expect(createdCount).toBeGreaterThanOrEqual(1);

      const reminder = db.notifications
        .all()
        .find(
          (n) =>
            n.userId === student.id &&
            n.type === "installment_due" &&
            n.body.includes(inst3.id),
        );
      expect(reminder).toBeDefined();
      expect(reminder?.body).toContain("۳ روز دیگر");

      // Idempotency: Running it a second time should create 0 new notifications
      const rerunCount = processInstallmentReminders(db);
      expect(rerunCount).toBe(0);
    });
  });
});
