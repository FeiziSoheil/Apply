import { expect, test } from "@playwright/test";
import { DEMO_ACCOUNTS } from "../src/mocks/config";
import { mockAuthHeaders, staffLogin } from "./helpers";

test.describe("CRM consultant isolation", () => {
  test("consultant UI hides foreign assignee filters and admin-only actions", async ({
    page,
  }) => {
    await staffLogin(page, DEMO_ACCOUNTS.consultant);

    await page.goto("/admin/leads");
    await expect(page.getByRole("heading", { name: "لیدها" })).toBeVisible({
      timeout: 15_000,
    });
    // Filter control (not the table column header «مسئول»)
    await expect(page.getByLabel("فیلتر مسئول")).toHaveCount(0);
    await expect(
      page.getByRole("button", { name: /تخصیص|حذف انتخاب/ }),
    ).toHaveCount(0);

    await page.goto("/admin/cases");
    await expect(page.getByRole("heading", { name: "پرونده‌ها" })).toBeVisible({
      timeout: 15_000,
    });
    await expect(page.getByLabel("فیلتر مسئول")).toHaveCount(0);

    await page.goto("/admin/settings/crm");
    await expect(
      page.getByText("دسترسی شما به این بخش مجاز نیست"),
    ).toBeVisible({ timeout: 10_000 });

    await page.goto("/admin/settings/audit");
    await expect(
      page.getByText("دسترسی شما به این بخش مجاز نیست"),
    ).toBeVisible({ timeout: 10_000 });
  });

  test("API list for consultant never returns other assignees' leads", async ({
    page,
  }) => {
    await staffLogin(page, DEMO_ACCOUNTS.consultant);
    await page.goto("/admin/leads");
    await expect(page.getByRole("heading", { name: "لیدها" })).toBeVisible({
      timeout: 15_000,
    });

    const headers = await mockAuthHeaders(page);
    const result = await page.evaluate(async (hdrs) => {
      const res = await fetch("/api/v1/leads?page=1&pageSize=100", {
        credentials: "include",
        headers: hdrs,
      });
      const json = (await res.json()) as {
        data: { assignedTo: string | null }[];
      };
      const me = await fetch("/api/v1/me", {
        credentials: "include",
        headers: hdrs,
      }).then((r) => r.json() as Promise<{ data: { id: string } }>);
      return {
        status: res.status,
        meId: me.data?.id,
        foreign: (json.data ?? []).filter(
          (lead) => lead.assignedTo && lead.assignedTo !== me.data?.id,
        ).length,
      };
    }, headers);

    expect(result.status).toBe(200);
    expect(result.meId).toBeTruthy();
    expect(result.foreign).toBe(0);
  });
});
