import { afterEach, beforeEach, describe, expect, it } from "vitest";
import type { Lead } from "@/contracts/leads";
import { permissionsForRole } from "@/lib/rbac/permissions";
import { getDb, resetDb } from "@/mocks/db";
import type { MockUser } from "@/mocks/types";
import { newId, nowIso } from "@/mocks/utils";
import { leadHandlers } from "./leads";

function adminUser(): MockUser {
  const admin = getDb().users.find((user) => user.role === "admin");
  if (!admin) throw new Error("no admin in seed");
  return { ...admin, permissions: permissionsForRole("admin") };
}

/** Inflate lead collection toward 5k for list/pagination smoke (handler-level). */
function inflateLeads(targetTotal: number): void {
  const db = getDb();
  const existing = db.leads.all();
  const template = existing.find((lead) => !lead.archived) ?? existing[0];
  if (!template) throw new Error("no template lead");
  const stageId = template.stageId;
  const stageKind = template.stageKind;
  const now = nowIso();
  const need = Math.max(0, targetTotal - existing.length);
  const batch: Lead[] = [];
  for (let i = 0; i < need; i += 1) {
    batch.push({
      ...template,
      id: newId(),
      name: `پرف لید ${i}`,
      mobile: `09${String(1_000_000_000 + i).slice(0, 9)}`,
      email: null,
      message: null,
      stageId,
      stageKind,
      assignedTo: template.assignedTo,
      tagIds: [],
      archived: false,
      convertedCaseId: null,
      importId: null,
      version: 1,
      createdAt: now,
      updatedAt: now,
      lastActivityAt: now,
    });
  }
  db.leads.insertMany(batch);
}

describe("CRM performance smoke (large lead set)", () => {
  beforeEach(() => {
    resetDb();
  });

  afterEach(() => {
    resetDb();
  });

  it(
    "lists a page from 5_000 leads under 2s",
    async () => {
      inflateLeads(5_000);
      expect(getDb().leads.all().length).toBeGreaterThanOrEqual(5_000);

      const started = performance.now();
      const reply = await leadHandlers.listLeads.run({
        params: undefined,
        query: {
          page: 1,
          pageSize: 50,
          sort: "lastActivityAt",
          order: "desc",
        },
        body: undefined,
        user: adminUser(),
        request: new Request("http://mock.test"),
        url: new URL("http://mock.test"),
        origin: "http://mock.test",
      });
      const elapsed = performance.now() - started;

      expect(reply.status).toBe(200);
      expect((reply.data as unknown[]).length).toBe(50);
      expect(elapsed).toBeLessThan(500);
    },
    90_000,
  );

  it("paginates a single kanban stage column of 1_000 cards", async () => {
    const db = getDb();
    const stage = db.pipelineStages.all().sort((a, b) => a.order - b.order)[0];
    if (!stage) throw new Error("no stage");
    const template = db.leads.all()[0];
    if (!template) throw new Error("no lead");
    const now = nowIso();
    const batch: Lead[] = [];
    for (let i = 0; i < 1_000; i += 1) {
      batch.push({
        ...template,
        id: newId(),
        name: `کانبان ${i}`,
        mobile: `09${String(2_000_000_000 + i).slice(0, 9)}`,
        stageId: stage.id,
        stageKind: stage.kind,
        archived: false,
        version: 1,
        createdAt: now,
        updatedAt: now,
        lastActivityAt: now,
      });
    }
    db.leads.insertMany(batch);

    const started = performance.now();
    const page1 = await leadHandlers.listLeads.run({
      params: undefined,
      query: {
        page: 1,
        pageSize: 20,
        stageId: stage.id,
        sort: "lastActivityAt",
        order: "desc",
      },
      body: undefined,
      user: adminUser(),
      request: new Request("http://mock.test"),
      url: new URL("http://mock.test"),
      origin: "http://mock.test",
    });
    const elapsed = performance.now() - started;
    expect(page1.status).toBe(200);
    expect((page1.data as unknown[]).length).toBe(20);
    const pagination = page1.meta?.pagination;
    expect(pagination?.total).toBeGreaterThanOrEqual(1_000);
    expect(elapsed).toBeLessThan(500);
  });
});
