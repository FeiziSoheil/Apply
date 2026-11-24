import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { permissionsForRole } from "@/lib/rbac/permissions";
import { getDb, resetDb } from "@/mocks/db";
import { emitDomainEvent } from "@/mocks/domain-events";
import type { MockUser } from "@/mocks/types";
import { newId, nowIso } from "@/mocks/utils";
import { crmHandlers } from "./crm";

function adminUser(): MockUser {
  const admin = getDb().users.find((user) => user.role === "admin");
  if (!admin) throw new Error("no admin in seed");
  return {
    ...admin,
    permissions: permissionsForRole("admin"),
  };
}

describe("notifications + audit handlers", () => {
  beforeEach(() => {
    resetDb();
  });

  afterEach(() => {
    resetDb();
  });

  it("lists and marks notifications read", async () => {
    const staff = adminUser();
    const db = getDb();
    const created = emitDomainEvent(db, {
      actorId: staff.id,
      action: "create",
      entityType: "lead",
      entityId: newId(),
      notifications: [
        {
          userId: staff.id,
          type: "lead_new",
          title: "سرنخ جدید",
          body: "تست اعلان",
          link: "/admin/leads",
        },
      ],
    }).notifications[0];
    if (!created) throw new Error("expected notification");

    const list = await crmHandlers.listMyNotifications.run({
      params: undefined,
      query: { page: 1, pageSize: 20, order: "desc", unread: true },
      body: undefined,
      user: staff,
      request: new Request("http://mock.test"),
      url: new URL("http://mock.test"),
      origin: "http://mock.test",
    });
    const listItems = list.data as { id: string }[];
    expect(listItems.some((n) => n.id === created.id)).toBe(true);

    const marked = await crmHandlers.markNotificationRead.run({
      params: { id: created.id },
      query: undefined,
      body: undefined,
      user: staff,
      request: new Request("http://mock.test"),
      url: new URL("http://mock.test"),
      origin: "http://mock.test",
    });
    expect((marked.data as { readAt: string | null }).readAt).toBeTruthy();
  });

  it("gets and updates notification preferences", async () => {
    const staff = adminUser();
    const prefs = await crmHandlers.getMyNotificationPreferences.run({
      params: undefined,
      query: undefined,
      body: undefined,
      user: staff,
      request: new Request("http://mock.test"),
      url: new URL("http://mock.test"),
      origin: "http://mock.test",
    });
    const prefsData = prefs.data as {
      preferences: { type: string; inApp: boolean; sms: boolean }[];
    };
    expect(prefsData.preferences.length).toBeGreaterThan(0);

    const updated = await crmHandlers.updateMyNotificationPreferences.run({
      params: undefined,
      query: undefined,
      body: {
        preferences: prefsData.preferences.map((row) =>
          row.type === "mention"
            ? { ...row, type: "mention" as const, inApp: false, sms: true }
            : row,
        ),
      },
      user: staff,
      request: new Request("http://mock.test"),
      url: new URL("http://mock.test"),
      origin: "http://mock.test",
    });
    const updatedData = updated.data as {
      preferences: { type: string; sms: boolean }[];
    };
    expect(
      updatedData.preferences.find((p) => p.type === "mention")?.sms,
    ).toBe(true);
  });

  it("filters audit logs and export writes an audit entry", async () => {
    const staff = adminUser();
    const db = getDb();
    emitDomainEvent(db, {
      actorId: staff.id,
      action: "update",
      entityType: "lead",
      entityId: newId(),
      diff: {
        before: { password: "x", name: "الف" },
        after: { password: "y", name: "ب" },
      },
      now: nowIso(),
    });

    const page = await crmHandlers.listAuditLogs.run({
      params: undefined,
      query: {
        page: 1,
        pageSize: 50,
        order: "desc",
        actorId: staff.id,
        action: "update",
        entityType: "lead",
      },
      body: undefined,
      user: staff,
      request: new Request("http://mock.test"),
      url: new URL("http://mock.test"),
      origin: "http://mock.test",
    });
    const logs = page.data as {
      entityType: string;
      diff: { before: Record<string, unknown> | null } | null;
    }[];
    expect(logs.length).toBeGreaterThan(0);
    const sample = logs.find((log) => log.entityType === "lead");
    expect(sample?.diff?.before).not.toHaveProperty("password");
    expect(sample?.diff?.before).toHaveProperty("name");

    const beforeExport = db.auditLogs.filter(
      (log) => log.action === "export" && log.entityType === "audit_log",
    ).length;
    const csv = await crmHandlers.exportAuditLogs.run({
      params: undefined,
      query: { page: 1, pageSize: 20, order: "desc", actorId: staff.id },
      body: undefined,
      user: staff,
      request: new Request("http://mock.test"),
      url: new URL("http://mock.test"),
      origin: "http://mock.test",
    });
    expect(typeof csv.data).toBe("string");
    expect((csv.data as string).startsWith("\uFEFF")).toBe(true);
    expect(csv.data as string).toContain("action");
    const afterExport = db.auditLogs.filter(
      (log) => log.action === "export" && log.entityType === "audit_log",
    ).length;
    expect(afterExport).toBe(beforeExport + 1);
  });
});
