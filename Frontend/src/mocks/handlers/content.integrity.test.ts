import { afterEach, beforeEach, describe, expect, it } from "vitest";
import type { MockUser } from "@/mocks/types";
import { getDb, resetDb } from "@/mocks/db";
import { MockApiError } from "@/mocks/errors";
import { contentHandlers } from "./content";

const admin = {
  id: "00000000-0000-4000-8000-000000000001",
  name: "تست ادمین",
  role: "admin",
  permissions: ["content:read", "content:write", "content:delete"],
  createdAt: "2026-01-01T00:00:00.000Z",
} as MockUser;

describe("content integrity (universities / programs)", () => {
  beforeEach(() => {
    resetDb();
  });

  afterEach(() => {
    resetDb();
  });

  it("computes programsCount from live program rows", async () => {
    const db = getDb();
    const university = db.universities.all()[0];
    if (!university) throw new Error("no university");
    const expected = db.programs
      .all()
      .filter((p) => p.universitySlug === university.slug).length;

    const reply = await contentHandlers.getUniversity.run({
      params: { id: university.id },
      query: undefined,
      body: undefined,
      user: admin,
      request: new Request("http://mock.test"),
      url: new URL("http://mock.test"),
      origin: "http://mock.test",
    });
    expect(reply.status).toBe(200);
    expect((reply.data as { programsCount: number }).programsCount).toBe(
      expected,
    );
  });

  it("returns 409 when deleting a university that has programs", async () => {
    const db = getDb();
    const withPrograms = db.universities.all().find((uni) =>
      db.programs.all().some((p) => p.universitySlug === uni.slug),
    );
    if (!withPrograms) throw new Error("no university with programs");

    let caught: unknown;
    try {
      await contentHandlers.deleteUniversity.run({
        params: { id: withPrograms.id },
        query: undefined,
        body: undefined,
        user: admin,
        request: new Request("http://mock.test"),
        url: new URL("http://mock.test"),
        origin: "http://mock.test",
      });
    } catch (error) {
      caught = error;
    }
    expect(caught).toBeInstanceOf(MockApiError);
    expect((caught as MockApiError).code).toBe("CONFLICT");
    expect((caught as MockApiError).message).toContain("برنامه");
  });

  it("cascades university slug change to dependent programs", async () => {
    const db = getDb();
    const university = db.universities.all().find((uni) =>
      db.programs.all().some((p) => p.universitySlug === uni.slug),
    );
    if (!university) throw new Error("no university with programs");
    const oldSlug = university.slug;
    const newSlug = `${oldSlug}-renamed`;

    const reply = await contentHandlers.updateUniversity.run({
      params: { id: university.id },
      query: undefined,
      body: { slug: newSlug },
      user: admin,
      request: new Request("http://mock.test"),
      url: new URL("http://mock.test"),
      origin: "http://mock.test",
    });
    expect(reply.status).toBe(200);

    const stillOnOld = db.programs
      .all()
      .filter((p) => p.universitySlug === oldSlug);
    const onNew = db.programs
      .all()
      .filter((p) => p.universitySlug === newSlug);
    expect(stillOnOld).toHaveLength(0);
    expect(onNew.length).toBeGreaterThan(0);
  });
});
