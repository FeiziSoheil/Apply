import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { getDb, resetDb } from "@/mocks/db";
import {
  emitDomainEvent,
  getNotificationPreferences,
  sanitizeAuditDiff,
  upsertNotificationPreferences,
} from "@/mocks/domain-events";
import { newId } from "@/mocks/utils";

describe("domain-events", () => {
  beforeEach(() => {
    resetDb();
  });

  afterEach(() => {
    resetDb();
  });

  it("strips sensitive fields from audit diffs", () => {
    const sanitized = sanitizeAuditDiff({
      before: { password: "secret", name: "علی", token: "t" },
      after: { password: "new", name: "علی رضایی", otp: "1234" },
    });
    expect(sanitized?.before).toEqual({ name: "علی" });
    expect(sanitized?.after).toEqual({ name: "علی رضایی" });
  });

  it("emits audit + notification via emitDomainEvent", () => {
    const db = getDb();
    const user = db.users.find((u) => u.role === "consultant");
    if (!user) throw new Error("no consultant");

    const result = emitDomainEvent(db, {
      actorId: user.id,
      action: "assign",
      entityType: "lead",
      entityId: newId(),
      notifications: [
        {
          userId: user.id,
          type: "lead_assigned",
          title: "سرنخ به شما تخصیص یافت",
          body: "تست",
          link: "/admin/leads/x",
        },
      ],
    });

    expect(result.audit.action).toBe("assign");
    expect(result.notifications).toHaveLength(1);
    expect(db.notifications.filter((n) => n.userId === user.id).length).toBeGreaterThan(
      0,
    );
  });

  it("skips in-app notification when preference disables it", () => {
    const db = getDb();
    const user = db.users.find((u) => u.role === "admin");
    if (!user) throw new Error("no admin");

    upsertNotificationPreferences(db, user.id, [
      { type: "task_due", inApp: false, sms: true },
    ]);
    const prefs = getNotificationPreferences(db, user.id);
    expect(prefs.preferences.find((p) => p.type === "task_due")?.inApp).toBe(
      false,
    );

    const before = db.notifications.filter((n) => n.userId === user.id).length;
    emitDomainEvent(db, {
      actorId: user.id,
      action: "update",
      entityType: "task",
      entityId: newId(),
      notifications: [
        {
          userId: user.id,
          type: "task_due",
          title: "یادآوری",
          body: "کار",
          link: "/admin/tasks",
        },
      ],
    });
    const after = db.notifications.filter((n) => n.userId === user.id).length;
    expect(after).toBe(before);
  });
});
