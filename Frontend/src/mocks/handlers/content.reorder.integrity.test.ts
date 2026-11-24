import { afterEach, beforeEach, describe, expect, it } from "vitest";
import type { Consultant, SuccessStory } from "@/contracts/content";
import type { RouteImplementation } from "@/mocks/contract";
import { getDb, resetDb } from "@/mocks/db";
import { MockApiError } from "@/mocks/errors";
import type { MockUser } from "@/mocks/types";
import { contentHandlers } from "./content";

const admin = {
  id: "00000000-0000-4000-8000-000000000001",
  name: "تست ادمین",
  role: "admin",
  permissions: ["content:read", "content:write", "content:delete"],
  createdAt: "2026-01-01T00:00:00.000Z",
} as MockUser;

type CallInput = { params?: unknown; query?: unknown; body?: unknown };

function call(name: string, input: CallInput) {
  const handler: RouteImplementation | undefined = contentHandlers[name];
  if (!handler) throw new Error(`no handler ${name}`);
  return handler.run({
    params: input.params,
    query: input.query,
    body: input.body,
    user: admin,
    request: new Request("http://mock.test"),
    url: new URL("http://mock.test"),
    origin: "http://mock.test",
  });
}

/** Handlers throw synchronously — wrap the call so the throw is catchable. */
async function caught(run: () => Promise<unknown> | unknown): Promise<unknown> {
  try {
    return await run();
  } catch (error) {
    return error;
  }
}

async function createBareConsultant(): Promise<Consultant> {
  const reply = await call("createConsultant", {
    body: {
      name: "مشاور آزمایشی",
      role: "مشاور تست",
      countries: ["germany"],
      bio: "بیوگرافی آزمایشی",
      photo: "/images/team/placeholder.svg",
      languages: ["فارسی"],
      showOnTeamPage: true,
      active: true,
      order: 99,
    },
  });
  expect(reply.status).toBe(201);
  return reply.data as Consultant;
}

describe("content reorder / dependency integrity", () => {
  beforeEach(() => {
    resetDb();
  });

  afterEach(() => {
    resetDb();
  });

  it("deletes a consultant without dependents", async () => {
    const consultant = await createBareConsultant();
    const reply = await call("deleteConsultant", {
      params: { id: consultant.id },
    });
    expect(reply.status).toBe(204);
    expect(getDb().consultants.get(consultant.id)).toBeUndefined();
  });

  it("returns 409 when deleting a consultant assigned to a lead", async () => {
    const db = getDb();
    const lead = db.leads.all()[0];
    if (!lead) throw new Error("no lead");
    const consultant = await createBareConsultant();
    db.leads.update(lead.id, { assignedTo: consultant.id });

    const error = await caught(() =>
      call("deleteConsultant", { params: { id: consultant.id } }),
    );
    expect(error).toBeInstanceOf(MockApiError);
    expect((error as MockApiError).code).toBe("CONFLICT");
    expect((error as MockApiError).status).toBe(409);
    expect(db.consultants.get(consultant.id)).toBeDefined();
  });

  it("returns 409 when deleting a consultant with a booking", async () => {
    const db = getDb();
    const booking = db.bookings.all().find((item) => item.status !== "cancelled");
    if (!booking) throw new Error("no active booking");
    const consultant = await createBareConsultant();
    db.bookings.update(booking.id, { consultantId: consultant.id });

    const error = await caught(() =>
      call("deleteConsultant", { params: { id: consultant.id } }),
    );
    expect(error).toBeInstanceOf(MockApiError);
    expect((error as MockApiError).code).toBe("CONFLICT");
    expect((error as MockApiError).message).toContain("رزرو");
  });

  it("allows deactivating a consultant that cannot be deleted", async () => {
    const consultant = await createBareConsultant();
    const reply = await call("updateConsultant", {
      params: { id: consultant.id },
      body: { active: false, showOnTeamPage: false },
    });
    expect(reply.status).toBe(200);
    const stored = getDb().consultants.get(consultant.id);
    expect(stored?.active).toBe(false);
    expect(stored?.showOnTeamPage).toBe(false);
  });

  it("reorders services and persists the new order", async () => {
    const db = getDb();
    const before = db.services.all().sort((a, b) => a.order - b.order);
    expect(before.length).toBeGreaterThan(1);
    const reversed = [...before].reverse();

    const reply = await call("reorderServices", {
      body: {
        items: reversed.map((service, index) => ({
          id: service.id,
          order: index,
        })),
      },
    });
    expect(reply.status).toBe(200);
    expect((reply.data as { updated: number }).updated).toBe(before.length);

    const after = db.services.all().sort((a, b) => a.order - b.order);
    expect(after.map((service) => service.id)).toEqual(
      reversed.map((service) => service.id),
    );
  });

  it("rejects publishing a success story without publication consent", async () => {
    const created = await call("createSuccessStory", {
      body: {
        studentName: "دانشجوی آزمایشی",
        isAnonymous: false,
        country: "آلمان",
        university: "دانشگاه آزمایشی",
        field: "مهندسی",
        year: 2025,
        quote: "تجربه خوبی بود.",
        publicationConsent: false,
        status: "draft",
        order: 0,
      },
    });
    const story = created.data as SuccessStory;

    const error = await caught(() =>
      call("updateSuccessStory", {
        params: { id: story.id },
        body: { status: "published" },
      }),
    );
    expect(error).toBeInstanceOf(MockApiError);
    expect((error as MockApiError).code).toBe("VALIDATION_ERROR");
    expect((error as MockApiError).fields?.publicationConsent).toBeDefined();
    expect(getDb().successStories.get(story.id)?.status).toBe("draft");

    const ok = await call("updateSuccessStory", {
      params: { id: story.id },
      body: { status: "published", publicationConsent: true },
    });
    expect(ok.status).toBe(200);
    expect(getDb().successStories.get(story.id)?.status).toBe("published");
  });
});
