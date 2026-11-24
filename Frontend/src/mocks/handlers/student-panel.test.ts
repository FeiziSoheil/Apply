import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { permissionsForRole } from "@/lib/rbac/permissions";
import { DEMO_ACCOUNTS } from "@/mocks/config";
import { getDb, resetDb } from "@/mocks/db";
import { MockApiError } from "@/mocks/errors";
import type { MockUser } from "@/mocks/types";
import { authHandlers } from "./auth";
import { studentPanelHandlers } from "./student-panel";
import { ticketHandlers } from "./tickets";

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

describe("student panel domain", () => {
  beforeEach(() => {
    resetDb();
  });

  afterEach(() => {
    resetDb();
  });

  it("OTP login returns caseLink and links case", async () => {
    await authHandlers.requestOtp.run({
      params: undefined,
      query: undefined,
      body: { mobile: DEMO_ACCOUNTS.student.mobile },
      user: null,
      request: new Request("http://mock.test"),
      url: new URL("http://mock.test"),
      origin: "http://mock.test",
    });
    const result = await authHandlers.verifyOtp.run({
      params: undefined,
      query: undefined,
      body: {
        mobile: DEMO_ACCOUNTS.student.mobile,
        code: DEMO_ACCOUNTS.student.otp,
      },
      user: null,
      request: new Request("http://mock.test"),
      url: new URL("http://mock.test"),
      origin: "http://mock.test",
    });
    const session = result.data as {
      caseLink?: { status: string; activeCaseId?: string | null };
      user: { role: string };
    };
    expect(session.user.role).toBe("student");
    expect(session.caseLink?.status).toMatch(/linked|select/);
  });

  it("documents payload includes progress and upload settings", async () => {
    const result = await studentPanelHandlers.listMyDocumentViews.run({
      params: undefined,
      query: undefined,
      body: undefined,
      user: demoStudent(),
      request: new Request("http://mock.test"),
      url: new URL("http://mock.test"),
      origin: "http://mock.test",
    });
    const data = result.data as {
      items: { id: string; status: string; locked: boolean }[];
      progress: { approvedRequired: number; totalRequired: number };
      settings: { reviewEtaMessage: string; maxUploadBytes: number };
    };
    expect(data.items.length).toBeGreaterThan(0);
    expect(data.progress.totalRequired).toBeGreaterThan(0);
    expect(data.settings.reviewEtaMessage).toMatch(/روز کاری/);
    expect(data.items.some((doc) => doc.status === "rejected")).toBe(true);
  });

  it("upload → staff reject → re-upload → approve (shared mock db)", async () => {
    const student = demoStudent();
    const admin = adminUser();
    const db = getDb();
    const studentCase = db.cases.find((entry) => entry.studentId === student.id);
    expect(studentCase).toBeTruthy();

    const listed = await studentPanelHandlers.listMyDocumentViews.run({
      params: undefined,
      query: undefined,
      body: undefined,
      user: student,
      request: new Request("http://mock.test"),
      url: new URL("http://mock.test"),
      origin: "http://mock.test",
    });
    const payload = listed.data as {
      items: {
        id: string;
        status: string;
        checklistItemId: string | null;
        title: string;
      }[];
    };
    const target = payload.items.find(
      (doc) => doc.status === "not_uploaded" || doc.status === "rejected",
    );
    expect(target).toBeTruthy();

    const fileA = db.files.insert({
      id: "22222222-2222-4222-8222-222222222222",
      url: "http://mock.test/mock-files/22222222-2222-4222-8222-222222222222/a.jpg",
      name: "22222222-2222-4222-8222-222222222222.jpg",
      size: 1500,
      mimeType: "image/jpeg",
      createdAt: new Date().toISOString(),
      ownerId: student.id,
    });
    const uploaded = await studentPanelHandlers.uploadMyDocument.run({
      params: undefined,
      query: undefined,
      body: {
        fileId: fileA.id,
        documentId: target!.id,
        checklistItemId: target!.checklistItemId ?? undefined,
      },
      user: student,
      request: new Request("http://mock.test"),
      url: new URL("http://mock.test"),
      origin: "http://mock.test",
    });
    expect((uploaded.data as { status: string }).status).toBe("uploaded");

    const staffDoc = db.documents.find(
      (doc) =>
        doc.caseId === studentCase!.id &&
        (doc.checklistItemId === target!.checklistItemId ||
          doc.checklistItemId === target!.id),
    );
    expect(staffDoc).toBeTruthy();

    const { studentHandlers } = await import("./students");
    const rejected = await studentHandlers.reviewDocument.run({
      params: { id: staffDoc!.id },
      query: undefined,
      body: {
        status: "rejected",
        rejectionReason: "کیفیت تصویر کافی نیست؛ لطفاً دوباره بارگذاری کنید.",
      },
      user: admin,
      request: new Request("http://mock.test", {
        headers: { "If-Match": String(staffDoc!.version) },
      }),
      url: new URL("http://mock.test"),
      origin: "http://mock.test",
    });
    expect((rejected.data as { status: string }).status).toBe("rejected");

    const afterReject = await studentPanelHandlers.listMyDocumentViews.run({
      params: undefined,
      query: undefined,
      body: undefined,
      user: student,
      request: new Request("http://mock.test"),
      url: new URL("http://mock.test"),
      origin: "http://mock.test",
    });
    const rejectedView = (
      afterReject.data as { items: { id: string; status: string }[] }
    ).items.find((doc) => doc.id === target!.id);
    expect(rejectedView?.status).toBe("rejected");

    const fileB = db.files.insert({
      id: "33333333-3333-4333-8333-333333333333",
      url: "http://mock.test/mock-files/33333333-3333-4333-8333-333333333333/b.jpg",
      name: "33333333-3333-4333-8333-333333333333.jpg",
      size: 1600,
      mimeType: "image/jpeg",
      createdAt: new Date().toISOString(),
      ownerId: student.id,
    });
    const reuploaded = await studentPanelHandlers.uploadMyDocument.run({
      params: undefined,
      query: undefined,
      body: {
        fileId: fileB.id,
        documentId: target!.id,
        checklistItemId: target!.checklistItemId ?? undefined,
      },
      user: student,
      request: new Request("http://mock.test"),
      url: new URL("http://mock.test"),
      origin: "http://mock.test",
    });
    expect((reuploaded.data as { status: string }).status).toBe("uploaded");

    const fresh = db.documents.get(staffDoc!.id);
    expect(fresh).toBeTruthy();
    const approved = await studentHandlers.reviewDocument.run({
      params: { id: staffDoc!.id },
      query: undefined,
      body: { status: "approved" },
      user: admin,
      request: new Request("http://mock.test", {
        headers: { "If-Match": String(fresh!.version) },
      }),
      url: new URL("http://mock.test"),
      origin: "http://mock.test",
    });
    expect((approved.data as { status: string }).status).toBe("approved");

    const finalList = await studentPanelHandlers.listMyDocumentViews.run({
      params: undefined,
      query: undefined,
      body: undefined,
      user: student,
      request: new Request("http://mock.test"),
      url: new URL("http://mock.test"),
      origin: "http://mock.test",
    });
    const finalView = (
      finalList.data as { items: { id: string; status: string }[] }
    ).items.find((doc) => doc.id === target!.id);
    expect(finalView?.status).toBe("approved");
  });

  it("student document upload notifies consultant and sets uploaded", async () => {
    const student = demoStudent();
    const db = getDb();
    const list = await studentPanelHandlers.listMyDocumentViews.run({
      params: undefined,
      query: undefined,
      body: undefined,
      user: student,
      request: new Request("http://mock.test"),
      url: new URL("http://mock.test"),
      origin: "http://mock.test",
    });
    const payload = list.data as {
      items: { id: string; status: string; checklistItemId: string | null }[];
    };
    const target = payload.items.find(
      (doc) => doc.status === "not_uploaded" || doc.status === "rejected",
    );
    expect(target).toBeTruthy();

    const file = db.files.insert({
      id: "11111111-1111-4111-8111-111111111111",
      url: "http://mock.test/mock-files/11111111-1111-4111-8111-111111111111/x.jpg",
      name: "11111111-1111-4111-8111-111111111111.jpg",
      size: 1200,
      mimeType: "image/jpeg",
      createdAt: new Date().toISOString(),
      ownerId: student.id,
    });

    const uploaded = await studentPanelHandlers.uploadMyDocument.run({
      params: undefined,
      query: undefined,
      body: {
        fileId: file.id,
        documentId: target!.id,
        checklistItemId: target!.checklistItemId ?? undefined,
      },
      user: student,
      request: new Request("http://mock.test"),
      url: new URL("http://mock.test"),
      origin: "http://mock.test",
    });
    expect((uploaded.data as { status: string }).status).toBe("uploaded");

    const studentCase = db.cases.find((entry) => entry.studentId === student.id);
    expect(studentCase?.consultantId).toBeTruthy();
    const note = db.notifications.find(
      (entry) =>
        entry.userId === studentCase!.consultantId &&
        entry.type === "document_uploaded",
    );
    expect(note).toBeTruthy();
    const activity = db.activities.find(
      (entry) =>
        entry.entityType === "case" &&
        entry.entityId === studentCase!.id &&
        entry.type === "document_event",
    );
    expect(activity).toBeTruthy();
  });

  it("StudentCaseView snapshot has no staff-only fields", async () => {
    const view = await studentPanelHandlers.getMyCaseView.run({
      params: undefined,
      query: undefined,
      body: undefined,
      user: demoStudent(),
      request: new Request("http://mock.test"),
      url: new URL("http://mock.test"),
      origin: "http://mock.test",
    });
    const data = view.data as Record<string, unknown>;
    const json = JSON.stringify(data);
    expect(json).not.toMatch(/leadValue|auditLog|internalNote|version_mismatch/i);
    expect(data).toHaveProperty("nextStepHint");
    expect(data).toHaveProperty("progressPercent");
    expect(Array.isArray(data.stages)).toBe(true);
  });

  it("foreign ticket → 404 for student (not 403)", async () => {
    const student = demoStudent();
    const admin = adminUser();
    const list = await ticketHandlers.listTickets.run({
      params: undefined,
      query: { page: 1, pageSize: 100 },
      body: undefined,
      user: admin,
      request: new Request("http://mock.test"),
      url: new URL("http://mock.test"),
      origin: "http://mock.test",
    });
    const foreign = (list.data as { id: string; createdBy: string }[]).find(
      (ticket) => ticket.createdBy !== student.id,
    );
    expect(foreign).toBeTruthy();
    try {
      await studentPanelHandlers.getMyTicket.run({
        params: { id: foreign!.id },
        query: undefined,
        body: undefined,
        user: student,
        request: new Request("http://mock.test"),
        url: new URL("http://mock.test"),
        origin: "http://mock.test",
      });
      expect.unreachable("expected NOT_FOUND");
    } catch (error) {
      expect(error).toBeInstanceOf(MockApiError);
      expect((error as MockApiError).code).toBe("NOT_FOUND");
      expect((error as MockApiError).status).toBe(404);
    }
  });

  it("student ticket detail never returns internal messages", async () => {
    const student = demoStudent();
    const mine = await studentPanelHandlers.listMyTickets.run({
      params: undefined,
      query: { page: 1, pageSize: 20 },
      body: undefined,
      user: student,
      request: new Request("http://mock.test"),
      url: new URL("http://mock.test"),
      origin: "http://mock.test",
    });
    const ticket = (mine.data as { id: string }[])[0];
    if (!ticket) return;
    const detail = await studentPanelHandlers.getMyTicket.run({
      params: { id: ticket.id },
      query: undefined,
      body: undefined,
      user: student,
      request: new Request("http://mock.test"),
      url: new URL("http://mock.test"),
      origin: "http://mock.test",
    });
    const messages = (
      detail.data as { messages: Record<string, unknown>[] }
    ).messages;
    for (const message of messages) {
      expect(message).not.toHaveProperty("internal");
      expect(JSON.stringify(message)).not.toContain("یادداشت داخلی");
    }
  });

  it("payment verification uses handler status, not callback query", async () => {
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
    if (!payable) return;

    const pay = await studentPanelHandlers.payMyInstallment.run({
      params: { id: payable.id },
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
    const paymentId = (pay.data as { paymentId: string }).paymentId;

    await studentPanelHandlers.resolveMockGateway.run({
      params: { id: paymentId },
      query: undefined,
      body: { outcome: "success" },
      user: student,
      request: new Request("http://mock.test"),
      url: new URL("http://mock.test"),
      origin: "http://mock.test",
    });

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
  });
});
