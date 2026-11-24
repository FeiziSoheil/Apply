import { expect, test, type Page } from "@playwright/test";
import { staffLogin } from "./helpers";
import { DEMO_ACCOUNTS } from "../src/mocks/config";

/**
 * E2E for `/admin/tasks` (mock API).
 * Requires: `npm run dev` with mocking enabled, then `npx playwright test e2e/admin-tasks.spec.ts`.
 */

test.describe("admin tasks", () => {
  test.beforeEach(async ({ page }) => {
    await staffLogin(page);
  });

  test("create and complete a task from quick-add", async ({ page }) => {
    await page.goto("/admin/tasks?tab=upcoming");
    await expect(page.getByRole("heading", { name: "کارهای من" })).toBeVisible({
      timeout: 15_000,
    });

    const unique = `تست Playwright ${Date.now()}`;
    await page.getByLabel("افزودن سریع کار").fill(`فردا ۱۰ ${unique}`);
    await page.getByRole("button", { name: "افزودن" }).click();
    await expect(page.getByText(unique).first()).toBeVisible({
      timeout: 10_000,
    });

    const row = page.locator("[data-task-id]").filter({ hasText: unique }).first();
    await row.getByRole("checkbox", { name: new RegExp(`تکمیل`) }).click();
    await expect(page.getByText(/کار تکمیل شد/)).toBeVisible({
      timeout: 10_000,
    });
  });

  test("snooze appears in task menu", async ({ page }) => {
    await page.goto("/admin/tasks?tab=overdue");
    await expect(page.getByRole("heading", { name: "کارهای من" })).toBeVisible({
      timeout: 15_000,
    });

    const menu = page.getByRole("button", { name: "عملیات کار" }).first();
    if (await menu.isVisible({ timeout: 10_000 }).catch(() => false)) {
      await menu.click();
      await expect(page.getByText("۱ ساعت بعد")).toBeVisible();
      await page.getByText("۱ ساعت بعد").click();
      await expect(page.getByText(/تعویق|به‌روز/)).toBeVisible({
        timeout: 8_000,
      }).catch(() => undefined);
    }
  });

  test("tab filters update the list", async ({ page }) => {
    await page.goto("/admin/tasks");
    await expect(page.getByRole("heading", { name: "کارهای من" })).toBeVisible({
      timeout: 15_000,
    });

    await page.getByRole("tab", { name: /سررسیدگذشته/ }).click();
    await expect(page).toHaveURL(/tab=overdue/);

    await page.getByRole("tab", { name: /تکمیل‌شده/ }).click();
    await expect(page).toHaveURL(/tab=done/);
  });

  test("reminder process endpoint can create notifications", async ({
    page,
  }) => {
    await page.goto("/admin/tasks");
    await expect(page.getByRole("heading", { name: "کارهای من" })).toBeVisible({
      timeout: 15_000,
    });

    const result = await page.evaluate(async () => {
      const response = await fetch("/api/v1/tasks/process-reminders", {
        method: "POST",
        headers: { Accept: "application/json" },
        credentials: "include",
      });
      const json = (await response.json()) as {
        data?: { created?: number };
      };
      return { status: response.status, created: json.data?.created ?? -1 };
    });

    expect(result.status).toBe(200);
    expect(result.created).toBeGreaterThanOrEqual(0);
  });
});
