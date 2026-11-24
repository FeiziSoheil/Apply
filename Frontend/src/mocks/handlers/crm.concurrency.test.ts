import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { permissionsForRole } from "@/lib/rbac/permissions";
import { getDb, resetDb } from "@/mocks/db";
import { MockApiError } from "@/mocks/errors";
import type { MockUser } from "@/mocks/types";
import { leadHandlers } from "./leads";
import { studentHandlers } from "./students";

function adminUser(): MockUser {
  const admin = getDb().users.find((user) => user.role === "admin");
  if (!admin) throw new Error("no admin in seed");
  return { ...admin, permissions: permissionsForRole("admin") };
}

function requestWithMatch(version: number): Request {
  return new Request("http://mock.test", {
    headers: { "If-Match": String(version) },
  });
}

describe("CRM concurrent edits (If-Match)", () => {
  beforeEach(() => {
    resetDb();
  });

  afterEach(() => {
    resetDb();
  });

  it("second lead PATCH with stale version gets version_mismatch", async () => {
    const lead = getDb().leads.all().find((entry) => !entry.archived);
    if (!lead) throw new Error("no lead");
    const admin = adminUser();
    const v = lead.version;

    const first = await leadHandlers.updateLead.run({
      params: { id: lead.id },
      query: undefined,
      body: { name: "ویرایش اول هم‌زمان" },
      user: admin,
      request: requestWithMatch(v),
      url: new URL("http://mock.test"),
      origin: "http://mock.test",
    });
    expect(first.status).toBe(200);

    let caught: unknown;
    try {
      await leadHandlers.updateLead.run({
        params: { id: lead.id },
        query: undefined,
        body: { name: "ویرایش دوم هم‌زمان" },
        user: admin,
        request: requestWithMatch(v),
        url: new URL("http://mock.test"),
        origin: "http://mock.test",
      });
    } catch (error) {
      caught = error;
    }
    expect(caught).toBeInstanceOf(MockApiError);
    const err = caught as MockApiError;
    expect(err.code).toBe("CONFLICT");
    expect(err.reason).toBe("version_mismatch");
    expect(err.currentVersion).toBe(v + 1);
  });

  it("second case PATCH with stale version gets version_mismatch", async () => {
    const entity = getDb().cases.all()[0];
    if (!entity) throw new Error("no case");
    const admin = adminUser();
    const v = entity.version;

    const first = await studentHandlers.updateCase.run({
      params: { id: entity.id },
      query: undefined,
      body: { status: entity.status },
      user: admin,
      request: requestWithMatch(v),
      url: new URL("http://mock.test"),
      origin: "http://mock.test",
    });
    expect(first.status).toBe(200);

    let caught: unknown;
    try {
      await studentHandlers.updateCase.run({
        params: { id: entity.id },
        query: undefined,
        body: { status: entity.status },
        user: admin,
        request: requestWithMatch(v),
        url: new URL("http://mock.test"),
        origin: "http://mock.test",
      });
    } catch (error) {
      caught = error;
    }
    expect(caught).toBeInstanceOf(MockApiError);
    const err = caught as MockApiError;
    expect(err.code).toBe("CONFLICT");
    expect(err.reason).toBe("version_mismatch");
    expect(err.currentVersion).toBe(v + 1);
  });
});
