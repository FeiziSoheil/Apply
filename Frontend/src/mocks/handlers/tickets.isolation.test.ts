import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { permissionsForRole } from "@/lib/rbac/permissions";
import { DEMO_ACCOUNTS } from "@/mocks/config";
import { getDb, resetDb } from "@/mocks/db";
import { clearTicketIdempotencyCache } from "@/mocks/domain/tickets";
import { MockApiError } from "@/mocks/errors";
import type { MockUser } from "@/mocks/types";
import { newId, nowIso } from "@/mocks/utils";
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

const ctx = (user: MockUser | null) => ({
  params: undefined as undefined,
  query: undefined as undefined,
  body: undefined as undefined,
  user,
  request: new Request("http://mock.test"),
  url: new URL("http://mock.test"),
  origin: "http://mock.test",
});

describe("ticket isolation + internal filter", () => {
  beforeEach(() => {
    resetDb();
    clearTicketIdempotencyCache();
  });

  afterEach(() => {
    resetDb();
    clearTicketIdempotencyCache();
  });

  it("foreign ticket → 404 for student (not 403)", async () => {
    const student = demoStudent();
    const admin = adminUser();
    const list = await ticketHandlers.listTickets.run({
      ...ctx(admin),
      query: { page: 1, pageSize: 100 },
    });
    const foreign = (list.data as { id: string; createdBy: string }[]).find(
      (ticket) => ticket.createdBy !== student.id,
    );
    expect(foreign).toBeTruthy();
    try {
      await studentPanelHandlers.getMyTicket.run({
        ...ctx(student),
        params: { id: foreign!.id },
      });
      expect.unreachable("expected NOT_FOUND");
    } catch (error) {
      expect(error).toBeInstanceOf(MockApiError);
      expect((error as MockApiError).code).toBe("NOT_FOUND");
      expect((error as MockApiError).status).toBe(404);
    }
  });

  it("student ticket detail never returns internal messages or internal field", async () => {
    const student = demoStudent();
    const admin = adminUser();
    const created = await studentPanelHandlers.createMyTicket.run({
      ...ctx(student),
      body: {
        subject: "تست فیلتر داخلی",
        category: "other",
        priority: "normal",
        body: "پیام اول دانشجو برای تست",
        attachmentIds: [],
      },
    });
    const ticket = created.data as { id: string };

    await ticketHandlers.createTicketMessage.run({
      ...ctx(admin),
      params: { id: ticket.id },
      body: {
        body: "یادداشت داخلی محرمانه کارکنان",
        attachmentIds: [],
        internal: true,
      },
    });
    await ticketHandlers.createTicketMessage.run({
      ...ctx(admin),
      params: { id: ticket.id },
      body: {
        body: "پاسخ عمومی به دانشجو",
        attachmentIds: [],
        internal: false,
      },
    });

    const detail = await studentPanelHandlers.getMyTicket.run({
      ...ctx(student),
      params: { id: ticket.id },
    });
    const payload = detail.data as {
      messages: Record<string, unknown>[];
    };
    const bodies = payload.messages.map((message) => message.body);
    expect(bodies).toContain("پاسخ عمومی به دانشجو");
    expect(bodies).not.toContain("یادداشت داخلی محرمانه کارکنان");
    for (const message of payload.messages) {
      expect(message).not.toHaveProperty("internal");
      expect(JSON.stringify(message)).not.toContain("یادداشت داخلی محرمانه");
    }

    const staffMessages = await ticketHandlers.listTicketMessages.run({
      ...ctx(admin),
      params: { id: ticket.id },
      query: { page: 1, pageSize: 50 },
    });
    const staffBodies = (staffMessages.data as { body: string; internal: boolean }[]).map(
      (message) => message.body,
    );
    expect(staffBodies).toContain("یادداشت داخلی محرمانه کارکنان");
  });

  it("Idempotency-Key prevents duplicate student messages", async () => {
    const student = demoStudent();
    const created = await studentPanelHandlers.createMyTicket.run({
      ...ctx(student),
      body: {
        subject: "تست ایدمپوتنسی",
        category: "technical",
        priority: "normal",
        body: "شروع گفتگو",
        attachmentIds: [],
      },
    });
    const ticket = created.data as { id: string };
    const key = `test-key-${newId()}`;
    const request = new Request("http://mock.test", {
      headers: { "Idempotency-Key": key },
    });

    const first = await studentPanelHandlers.createMyTicketMessage.run({
      ...ctx(student),
      params: { id: ticket.id },
      body: { body: "پیام تکراری نشود", attachmentIds: [] },
      request,
    });
    const second = await studentPanelHandlers.createMyTicketMessage.run({
      ...ctx(student),
      params: { id: ticket.id },
      body: { body: "پیام تکراری نشود", attachmentIds: [] },
      request,
    });

    expect((first.data as { id: string }).id).toBe(
      (second.data as { id: string }).id,
    );
    const db = getDb();
    const count = db.ticketMessages.filter(
      (message) =>
        message.ticketId === ticket.id &&
        message.body === "پیام تکراری نشود",
    ).length;
    expect(count).toBe(1);
  });

  it("student reopen blocked after 7 days", async () => {
    const student = demoStudent();
    const created = await studentPanelHandlers.createMyTicket.run({
      ...ctx(student),
      body: {
        subject: "تست بازگشایی",
        category: "other",
        priority: "normal",
        body: "متن اولیه",
        attachmentIds: [],
      },
    });
    const ticket = created.data as { id: string };
    await studentPanelHandlers.closeMyTicket.run({
      ...ctx(student),
      params: { id: ticket.id },
    });
    const oldClose = new Date(
      Date.now() - 8 * 86_400_000,
    ).toISOString();
    getDb().tickets.update(ticket.id, {
      closedAt: oldClose,
      updatedAt: nowIso(),
    });

    try {
      await studentPanelHandlers.reopenMyTicket.run({
        ...ctx(student),
        params: { id: ticket.id },
      });
      expect.unreachable("expected CONFLICT");
    } catch (error) {
      expect(error).toBeInstanceOf(MockApiError);
      expect((error as MockApiError).code).toBe("CONFLICT");
    }
  });

  it("auto-assigns new student ticket to case consultant", async () => {
    const student = demoStudent();
    const caseRow = getDb().cases.find(
      (entry) => entry.studentId === student.id,
    );
    expect(caseRow).toBeTruthy();
    const created = await studentPanelHandlers.createMyTicket.run({
      ...ctx(student),
      body: {
        subject: "تست ارجاع خودکار",
        category: "documents",
        priority: "normal",
        body: "لطفاً بررسی کنید",
        attachmentIds: [],
        relatedCaseId: caseRow!.id,
      },
    });
    const ticket = created.data as { assignedTo: string | null; caseId: string | null };
    expect(ticket.caseId).toBe(caseRow!.id);
    expect(ticket.assignedTo).toBe(caseRow!.consultantId);
  });
});
