import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { getDb, resetDb } from "@/mocks/db";
import { applyAssignmentRules } from "@/mocks/domain/crm";
import { MockApiError } from "@/mocks/errors";
import type { MockUser } from "@/mocks/types";
import { permissionsForRole } from "@/lib/rbac/permissions";
import { leadHandlers } from "./leads";

function adminUser(): MockUser {
  const admin = getDb().users.find((user) => user.role === "admin");
  if (!admin) throw new Error("no admin in seed");
  return {
    ...admin,
    permissions: permissionsForRole("admin"),
  };
}

function requestWithMatch(version: number): Request {
  return new Request("http://mock.test", {
    headers: { "If-Match": String(version) },
  });
}

describe("CRM domain rules", () => {
  beforeEach(() => {
    resetDb();
  });

  afterEach(() => {
    resetDb();
  });

  it("applies the first matching assignment rule", () => {
    const db = getDb();
    const rule = db.assignmentRules
      .all()
      .sort((a, b) => a.order - b.order)
      .find((entry) => entry.active);
    expect(rule).toBeTruthy();

    const countryRule = db.assignmentRules.find(
      (entry) =>
        entry.active &&
        entry.conditions.some((c) => c.type === "target_country"),
    );
    if (!countryRule) throw new Error("expected country assignment rule");
    const countryCond = countryRule.conditions.find(
      (c) => c.type === "target_country",
    );
    if (!countryCond || countryCond.type !== "target_country") {
      throw new Error("bad condition");
    }

    const assignee = applyAssignmentRules(db, {
      source: "manual",
      targetCountries: [countryCond.countrySlug],
      utm: null,
    });
    expect(assignee).toBe(countryRule.consultantIds[0]);
  });

  it("returns version_mismatch when If-Match does not match", async () => {
    const db = getDb();
    const lead = db.leads.all().find((entry) => !entry.archived);
    if (!lead) throw new Error("no lead");

    let caught: unknown;
    try {
      await leadHandlers.updateLead.run({
        params: { id: lead.id },
        query: undefined,
        body: { name: "نام تازه تستی" },
        user: adminUser(),
        request: requestWithMatch(lead.version + 5),
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
    expect(err.currentVersion).toBe(lead.version);
  });

  it("requires lostReasonId when moving to a lost stage", async () => {
    const db = getDb();
    const lead = db.leads.all().find(
      (entry) => !entry.archived && entry.stageKind === "open",
    );
    const lostStage = db.pipelineStages.find((stage) => stage.kind === "lost");
    if (!lead || !lostStage) throw new Error("missing open lead or lost stage");

    let caught: unknown;
    try {
      await leadHandlers.updateLeadStage.run({
        params: { id: lead.id },
        query: undefined,
        body: { stageId: lostStage.id },
        user: adminUser(),
        request: requestWithMatch(lead.version),
        url: new URL("http://mock.test"),
        origin: "http://mock.test",
      });
    } catch (error) {
      caught = error;
    }
    expect(caught).toBeInstanceOf(MockApiError);
    expect((caught as MockApiError).code).toBe("VALIDATION_ERROR");
  });

  it("filters leads by overdue follow-up and inactive days", async () => {
    const overdue = await leadHandlers.listLeads.run({
      params: undefined,
      query: {
        page: 1,
        pageSize: 50,
        overdueFollowUp: true,
      },
      body: undefined,
      user: adminUser(),
      request: new Request("http://mock.test"),
      url: new URL("http://mock.test"),
      origin: "http://mock.test",
    });
    expect(overdue.status).toBe(200);
    const overdueItems = overdue.data as { nextFollowUpAt: string | null }[];
    for (const lead of overdueItems) {
      expect(lead.nextFollowUpAt).toBeTruthy();
      expect(new Date(lead.nextFollowUpAt!).getTime()).toBeLessThan(Date.now());
    }

    const inactive = await leadHandlers.listLeads.run({
      params: undefined,
      query: {
        page: 1,
        pageSize: 50,
        inactiveDays: 3,
      },
      body: undefined,
      user: adminUser(),
      request: new Request("http://mock.test"),
      url: new URL("http://mock.test"),
      origin: "http://mock.test",
    });
    expect(inactive.status).toBe(200);
    const inactiveItems = inactive.data as { lastActivityAt: string }[];
    const cutoff = Date.now() - 3 * 86_400_000;
    for (const lead of inactiveItems) {
      expect(new Date(lead.lastActivityAt).getTime()).toBeLessThan(cutoff);
    }
  });

  it("moves to lost stage when lostReasonId is provided", async () => {
    const db = getDb();
    const lead = db.leads.all().find(
      (entry) => !entry.archived && entry.stageKind === "open",
    );
    const lostStage = db.pipelineStages.find((stage) => stage.kind === "lost");
    const reason = db.lostReasons.all().find((entry) => entry.active);
    if (!lead || !lostStage || !reason) {
      throw new Error("missing fixtures for lost move");
    }

    const reply = await leadHandlers.updateLeadStage.run({
      params: { id: lead.id },
      query: undefined,
      body: { stageId: lostStage.id, lostReasonId: reason.id },
      user: adminUser(),
      request: requestWithMatch(lead.version),
      url: new URL("http://mock.test"),
      origin: "http://mock.test",
    });
    expect(reply.status).toBe(200);
    const updated = db.leads.get(lead.id);
    expect(updated?.stageKind).toBe("lost");
    expect(updated?.lostReasonId).toBe(reason.id);
  });

  it("merges duplicate leads and archives the source", async () => {
    const db = getDb();
    const byMobile = new Map<string, string[]>();
    for (const lead of db.leads.all()) {
      if (lead.archived) continue;
      const list = byMobile.get(lead.mobile) ?? [];
      list.push(lead.id);
      byMobile.set(lead.mobile, list);
    }
    const pair = [...byMobile.values()].find((ids) => ids.length >= 2);
    if (!pair) throw new Error("expected duplicate mobile pair in seed");
    const [sourceId, targetId] = pair;
    const source = db.leads.get(sourceId)!;
    const target = db.leads.get(targetId)!;

    const reply = await leadHandlers.mergeLead.run({
      params: { id: source.id },
      query: undefined,
      body: { targetId: target.id },
      user: adminUser(),
      request: new Request("http://mock.test"),
      url: new URL("http://mock.test"),
      origin: "http://mock.test",
    });

    expect(reply.status).toBe(200);
    expect(db.leads.get(source.id)?.archived).toBe(true);
    expect(db.leads.get(target.id)?.archived).toBe(false);
    const audit = db.auditLogs
      .all()
      .find((log) => log.action === "merge" && log.entityId === target.id);
    expect(audit).toBeTruthy();
  });
});
