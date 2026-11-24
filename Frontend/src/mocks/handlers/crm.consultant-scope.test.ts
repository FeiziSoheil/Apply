import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { permissionsForRole } from "@/lib/rbac/permissions";
import { getDb, resetDb } from "@/mocks/db";
import { MockApiError } from "@/mocks/errors";
import type { MockUser } from "@/mocks/types";
import { crmHandlers } from "./crm";
import { leadHandlers } from "./leads";
import { studentHandlers } from "./students";

function withPerms(user: MockUser): MockUser {
  return { ...user, permissions: permissionsForRole(user.role) };
}

function consultantUsers(): MockUser[] {
  return getDb()
    .users.filter((user) => user.role === "consultant")
    .map(withPerms);
}

function requestWithMatch(version: number): Request {
  return new Request("http://mock.test", {
    headers: { "If-Match": String(version) },
  });
}

describe("CRM consultant scoping", () => {
  beforeEach(() => {
    resetDb();
  });

  afterEach(() => {
    resetDb();
  });

  it("lists only leads assigned to the consultant", async () => {
    const [consultant, other] = consultantUsers();
    expect(consultant).toBeTruthy();
    expect(other).toBeTruthy();

    const own = getDb().leads.all().find((lead) => lead.assignedTo === consultant.id);
    const foreign = getDb()
      .leads.all()
      .find(
        (lead) =>
          lead.assignedTo &&
          lead.assignedTo !== consultant.id &&
          !lead.archived,
      );
    expect(own).toBeTruthy();
    expect(foreign).toBeTruthy();

    const reply = await leadHandlers.listLeads.run({
      params: undefined,
      query: { page: 1, pageSize: 100 },
      body: undefined,
      user: consultant,
      request: new Request("http://mock.test"),
      url: new URL("http://mock.test"),
      origin: "http://mock.test",
    });
    expect(reply.status).toBe(200);
    const items = reply.data as { id: string; assignedTo: string | null }[];
    expect(items.every((lead) => lead.assignedTo === consultant.id)).toBe(true);
    expect(items.some((lead) => lead.id === foreign!.id)).toBe(false);

    let caught: unknown;
    try {
      await leadHandlers.getLead.run({
        params: { id: foreign!.id },
        query: undefined,
        body: undefined,
        user: consultant,
        request: new Request("http://mock.test"),
        url: new URL("http://mock.test"),
        origin: "http://mock.test",
      });
    } catch (error) {
      caught = error;
    }
    expect(caught).toBeInstanceOf(MockApiError);
    expect((caught as MockApiError).code).toBe("FORBIDDEN");
  });

  it("lists only cases assigned to the consultant", async () => {
    const [consultant] = consultantUsers();
    const foreign = getDb()
      .cases.all()
      .find((entry) => entry.consultantId && entry.consultantId !== consultant.id);
    expect(foreign).toBeTruthy();

    const reply = await studentHandlers.listCases.run({
      params: undefined,
      query: { page: 1, pageSize: 100 },
      body: undefined,
      user: consultant,
      request: new Request("http://mock.test"),
      url: new URL("http://mock.test"),
      origin: "http://mock.test",
    });
    expect(reply.status).toBe(200);
    const items = reply.data as { consultantId: string | null }[];
    expect(items.every((entry) => entry.consultantId === consultant.id)).toBe(
      true,
    );
  });

  it("blocks consultant from reassigning a case to another consultant", async () => {
    const [consultant, other] = consultantUsers();
    const ownCase = getDb()
      .cases.all()
      .find((entry) => entry.consultantId === consultant.id);
    expect(ownCase).toBeTruthy();
    expect(other).toBeTruthy();

    let caught: unknown;
    try {
      await studentHandlers.updateCase.run({
        params: { id: ownCase!.id },
        query: undefined,
        body: { consultantId: other.id },
        user: consultant,
        request: requestWithMatch(ownCase!.version),
        url: new URL("http://mock.test"),
        origin: "http://mock.test",
      });
    } catch (error) {
      caught = error;
    }
    expect(caught).toBeInstanceOf(MockApiError);
    expect((caught as MockApiError).code).toBe("FORBIDDEN");
  });

  it("scopes funnel report to the consultant", async () => {
    const [consultant] = consultantUsers();
    const to = new Date().toISOString();
    const from = new Date(Date.now() - 365 * 86_400_000).toISOString();
    const reply = await crmHandlers.getFunnelReport.run({
      params: undefined,
      query: { from, to },
      body: undefined,
      user: consultant,
      request: new Request("http://mock.test"),
      url: new URL("http://mock.test"),
      origin: "http://mock.test",
    });
    expect(reply.status).toBe(200);
    const data = reply.data as {
      stages: { count: number }[];
      conversionRate: number;
    };
    const total = data.stages.reduce((sum, stage) => sum + stage.count, 0);
    const owned = getDb()
      .leads.all()
      .filter(
        (lead) =>
          !lead.archived &&
          lead.assignedTo === consultant.id &&
          lead.createdAt >= from &&
          lead.createdAt <= to,
      ).length;
    expect(total).toBe(owned);
  });
});
