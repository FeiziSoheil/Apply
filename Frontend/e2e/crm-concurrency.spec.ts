import { expect, test } from "@playwright/test";
import { mockAuthHeaders, staffLogin } from "./helpers";

test.describe("CRM concurrency (two tabs / stale If-Match)", () => {
  test("concurrent lead edits: second write returns version_mismatch", async ({
    page,
  }) => {
    await staffLogin(page);
    const headers = await mockAuthHeaders(page);

    const list = await page.evaluate(async (hdrs) => {
      const res = await fetch("/api/v1/leads?page=1&pageSize=5", {
        credentials: "include",
        headers: hdrs,
      });
      return (await res.json()) as {
        data: { id: string; version: number; name: string }[];
      };
    }, headers);

    const lead = list.data?.[0];
    expect(lead).toBeTruthy();

    const first = await page.evaluate(
      async ({ id, version, hdrs }) => {
        const res = await fetch(`/api/v1/leads/${id}`, {
          method: "PATCH",
          credentials: "include",
          headers: {
            ...hdrs,
            "Content-Type": "application/json",
            "If-Match": String(version),
          },
          body: JSON.stringify({ name: `تب‌الف ${Date.now()}` }),
        });
        return { status: res.status, body: await res.json() };
      },
      { id: lead.id, version: lead.version, hdrs: headers },
    );
    expect(first.status).toBe(200);

    const second = await page.evaluate(
      async ({ id, version, hdrs }) => {
        const res = await fetch(`/api/v1/leads/${id}`, {
          method: "PATCH",
          credentials: "include",
          headers: {
            ...hdrs,
            "Content-Type": "application/json",
            "If-Match": String(version),
          },
          body: JSON.stringify({ name: `تب‌ب ${Date.now()}` }),
        });
        return { status: res.status, body: await res.json() };
      },
      { id: lead.id, version: lead.version, hdrs: headers },
    );

    expect(second.status).toBe(409);
    expect(second.body?.error?.reason).toBe("version_mismatch");
  });

  test("concurrent case edits: second write returns version_mismatch", async ({
    page,
  }) => {
    await staffLogin(page);
    const headers = await mockAuthHeaders(page);

    const list = await page.evaluate(async (hdrs) => {
      const res = await fetch("/api/v1/cases?page=1&pageSize=5", {
        credentials: "include",
        headers: hdrs,
      });
      return (await res.json()) as {
        data: { id: string; version: number; status: string }[];
      };
    }, headers);

    const entity = list.data?.[0];
    expect(entity).toBeTruthy();

    const first = await page.evaluate(
      async ({ id, version, status, hdrs }) => {
        const res = await fetch(`/api/v1/cases/${id}`, {
          method: "PATCH",
          credentials: "include",
          headers: {
            ...hdrs,
            "Content-Type": "application/json",
            "If-Match": String(version),
          },
          body: JSON.stringify({ status }),
        });
        return { status: res.status };
      },
      {
        id: entity.id,
        version: entity.version,
        status: entity.status,
        hdrs: headers,
      },
    );
    expect(first.status).toBe(200);

    const second = await page.evaluate(
      async ({ id, version, status, hdrs }) => {
        const res = await fetch(`/api/v1/cases/${id}`, {
          method: "PATCH",
          credentials: "include",
          headers: {
            ...hdrs,
            "Content-Type": "application/json",
            "If-Match": String(version),
          },
          body: JSON.stringify({ status }),
        });
        return { status: res.status, body: await res.json() };
      },
      {
        id: entity.id,
        version: entity.version,
        status: entity.status,
        hdrs: headers,
      },
    );

    expect(second.status).toBe(409);
    expect(second.body?.error?.reason).toBe("version_mismatch");
  });
});
