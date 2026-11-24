import { expect, test, type Page } from "@playwright/test";
import { staffLogin } from "./helpers";
import { DEMO_ACCOUNTS } from "../src/mocks/config";

test.describe("admin notifications + audit", () => {
  test.beforeEach(async ({ page }) => {
    await staffLogin(page);
  });

  test("notifications page loads filters and mark-all", async ({ page }) => {
    await page.goto("/admin/notifications");
    await expect(page.getByRole("heading", { name: "اعلان‌ها" })).toBeVisible({
      timeout: 15_000,
    });
    await expect(page.getByLabel("نوع")).toBeVisible();
    await expect(page.getByRole("button", { name: /خواندن همه/ })).toBeVisible();
  });

  test("profile shows notification preferences", async ({ page }) => {
    await page.goto("/admin/profile");
    await expect(
      page.getByRole("heading", { name: "ترجیحات اعلان" }),
    ).toBeVisible({ timeout: 15_000 });
    await expect(
      page.getByRole("button", { name: "ذخیره ترجیحات اعلان" }),
    ).toBeVisible();
  });

  test("audit page filters and opens detail drawer", async ({ page }) => {
    await page.goto("/admin/settings/audit");
    await expect(
      page.getByRole("heading", { name: "گزارش حسابرسی" }),
    ).toBeVisible({ timeout: 15_000 });

    await page.getByLabel("عملیات").click();
    await page.getByRole("option", { name: "ایجاد" }).click();

    const menu = page.getByRole("button", { name: "عملیات لاگ" }).first();
    if (await menu.isVisible({ timeout: 8_000 }).catch(() => false)) {
      await menu.click();
      await page.getByRole("menuitem", { name: "جزئیات" }).click();
      await expect(page.getByText("جزئیات حسابرسی")).toBeVisible();
      await expect(page.getByText("اختلاف قبل / بعد")).toBeVisible();
    }

    await expect(page.getByRole("button", { name: /خروجی CSV/ })).toBeVisible();
  });
});
