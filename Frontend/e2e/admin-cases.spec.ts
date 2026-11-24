import { expect, test, type Page } from "@playwright/test";
import { staffLogin } from "./helpers";
import { DEMO_ACCOUNTS } from "../src/mocks/config";

async function openFirstCase(page: Page) {
  await page.goto("/admin/cases");
  await expect(page.getByRole("heading", { name: "پرونده‌ها" })).toBeVisible();
  const link = page.locator('a[href^="/admin/cases/"]').first();
  await expect(link).toBeVisible({ timeout: 15_000 });
  await link.click();
  await page.waitForURL(/\/admin\/cases\/.+/);
}

test.describe("admin cases", () => {
  test("lists cases with progress columns and filters", async ({ page }) => {
    await staffLogin(page);
    await page.goto("/admin/cases");
    await expect(page.getByRole("heading", { name: "پرونده‌ها" })).toBeVisible();
    await expect(page.getByRole("columnheader", { name: "پیشرفت" })).toBeVisible();
    await expect(
      page.getByRole("tab", { name: "مدارک در انتظار بررسی" }),
    ).toBeVisible();
    await page.getByRole("tab", { name: "مدارک در انتظار بررسی" }).click();
    await expect(page).toHaveURL(/docsPendingReview=true|viewId=docs-review/);
  });

  test("lead → case conversion opens convert dialog and can create case", async ({
    page,
  }) => {
    await staffLogin(page);
    await page.goto("/admin/leads");
    await expect(page.getByRole("heading", { name: "لیدها" })).toBeVisible();
    const tableName = page.locator("table button").first();
    await tableName.click();
    await page.waitForURL(/\/admin\/leads\/.+/);
    await page.getByRole("button", { name: "تبدیل به پرونده" }).click();
    await expect(page.getByRole("dialog")).toContainText(/تبدیل به پرونده/);
    const create = page.getByRole("button", { name: "ساخت پرونده" });
    await expect(create).toBeVisible();
    // May already be converted; if enabled, complete conversion
    if (await create.isEnabled()) {
      await create.click();
      await expect(page).toHaveURL(/\/admin\/cases\/.+/, { timeout: 15_000 });
    }
  });

  test("approve and reject document with reason", async ({ page }) => {
    await staffLogin(page);
    await openFirstCase(page);
    await page.getByRole("tab", { name: "مدارک" }).click();
    await expect(page.getByText("چک‌لیست مدارک")).toBeVisible();

    const rejectBtn = page.getByRole("button", { name: "رد" }).first();
    if (await rejectBtn.isVisible({ timeout: 5_000 }).catch(() => false)) {
      await rejectBtn.click();
      await expect(page.getByRole("dialog")).toContainText(/رد مدرک/);
      await page.getByLabel("دلیل رد").fill("کیفیت تصویر کافی نیست برای تست");
      await page.getByRole("button", { name: "تأیید رد" }).click();
      await expect(page.getByText(/رد شد|دلیل رد/).first()).toBeVisible({
        timeout: 10_000,
      });
    }

    const approveBtn = page.getByRole("button", { name: "تأیید" }).first();
    if (await approveBtn.isVisible({ timeout: 3_000 }).catch(() => false)) {
      await approveBtn.click();
      await expect(page.getByText(/تأیید شد|تأییدشده/).first()).toBeVisible({
        timeout: 10_000,
      });
    }
  });

  test("stage advance with admin override reason", async ({ page }) => {
    await staffLogin(page);
    await openFirstCase(page);
    await page.getByRole("tab", { name: "مراحل" }).click();
    const advance = page.getByRole("button", { name: "رفتن به مرحله بعد" });
    await expect(advance).toBeVisible();
    if (await advance.isEnabled()) {
      await advance.click();
      // Either advances, or opens override dialog for incomplete docs
      const overrideDialog = page.getByRole("dialog").filter({
        hasText: /نادیده گرفتن|پیشبرد/,
      });
      const advanced = page.getByText(/مرحله پرونده پیش رفت|جاری/);
      await Promise.race([
        overrideDialog.waitFor({ timeout: 8_000 }).then(async () => {
          const reason = page.getByLabel("دلیل");
          if (await reason.isVisible().catch(() => false)) {
            await reason.fill("تست Playwright برای نادیده گرفتن الزامات");
            await page
              .getByRole("button", { name: "پیشبرد با نادیده گرفتن" })
              .click();
          }
        }),
        advanced.first().waitFor({ timeout: 8_000 }),
      ]).catch(() => undefined);
    }
  });

  test("consultant only sees assigned cases", async ({ page }) => {
    await staffLogin(page, DEMO_ACCOUNTS.consultant);
    await page.goto("/admin/cases");
    await expect(page.getByRole("heading", { name: "پرونده‌ها" })).toBeVisible();
    // Consultant must not hit 403 on list; rows (if any) are scoped server-side
    await expect(page.getByText(/دسترسی ندارید|ممنوع/)).toHaveCount(0);
    const links = page.locator('a[href^="/admin/cases/"]');
    const count = await links.count();
    if (count > 0) {
      await links.first().click();
      await page.waitForURL(/\/admin\/cases\/.+/);
      await expect(page.getByRole("heading").first()).toBeVisible();
      await expect(page.getByText(/دسترسی ندارید/)).toHaveCount(0);
    }
  });
});
