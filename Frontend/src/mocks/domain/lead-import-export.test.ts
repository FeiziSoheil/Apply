import { beforeEach, describe, expect, it } from "vitest";
import { getDb, resetDb } from "../db";
import { runLeadImport, revertLeadImport } from "./lead-import-export";

describe("lead import / revert", () => {
  beforeEach(() => {
    resetDb();
  });

  it("dry-run reports duplicates and validation errors", async () => {
    const db = getDb();
    const admin = db.users.find((user) => user.role === "admin");
    if (!admin) throw new Error("expected admin user");

    const before = db.leads.count();
    const report = await runLeadImport(db, admin.id, {
      dryRun: true,
      duplicateBehavior: "reject",
      rows: [
        {
          row: 2,
          name: "علی نمونه",
          mobile: "۰۹۱۲۱۱۱۱۱۱۱",
          email: "ali@test.com",
        },
        {
          row: 3,
          name: "تکراری",
          mobile: "+989121111111",
        },
        {
          row: 4,
          name: "ب",
          mobile: "bad",
        },
      ],
    });

    expect(report.dryRun).toBe(true);
    expect(report.validRows).toBe(1);
    expect(report.duplicateRows).toBe(1);
    expect(report.errors.length).toBeGreaterThan(0);
    expect(db.leads.count()).toBe(before);
  });

  it("commits import with importId and supports admin revert", async () => {
    const db = getDb();
    const before = db.leads.count();
    const admin = db.users.find((user) => user.role === "admin");
    if (!admin) throw new Error("expected admin user");

    const report = await runLeadImport(db, admin.id, {
      dryRun: false,
      duplicateBehavior: "reject",
      rows: [
        {
          row: 2,
          name: "لید ورودی یک",
          mobile: "09128887766",
        },
        {
          row: 3,
          name: "لید ورودی دو",
          mobile: "09128887767",
        },
      ],
    });

    expect(report.createdRows).toBe(2);
    expect(db.leads.count()).toBe(before + 2);
    const imported = db.leads.filter((lead) => lead.importId === report.importId);
    expect(imported).toHaveLength(2);
    expect(imported.every((lead) => lead.source === "import")).toBe(true);

    const revert = revertLeadImport(db, admin.id, report.importId);
    expect(revert.deletedCount).toBe(2);
    expect(db.leads.filter((lead) => lead.importId === report.importId)).toHaveLength(
      0,
    );
  });
});
