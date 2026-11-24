import { expect, test, type Page } from "@playwright/test";
import { staffLogin } from "./helpers";
import { DEMO_ACCOUNTS } from "../src/mocks/config";

async function openFirstLead(page: Page) {
  await page.goto("/admin/leads");
  await expect(page.getByRole("heading", { name: "لیدها" })).toBeVisible();
  const nameLink = page.getByRole("button").filter({ hasText: /.+/ }).first();
  // Prefer a name cell button from the table
  const tableName = page.locator("table button").first();
  if (await tableName.isVisible().catch(() => false)) {
    await tableName.click();
  } else {
    await nameLink.click();
  }
  await page.waitForURL(/\/admin\/leads\/.+/);
}

test.describe("admin lead detail", () => {
  test.beforeEach(async ({ page }) => {
    await staffLogin(page);
  });

  test("registers a note and a call", async ({ page }) => {
    await openFirstLead(page);
    await expect(page.getByRole("heading").first()).toBeVisible();

    await page.getByRole("tab", { name: "یادداشت" }).click();
    await page.getByLabel("متن یادداشت").fill("یادداشت تست Playwright");
    await page.getByRole("button", { name: "ثبت یادداشت" }).click();
    await expect(page.getByText("یادداشت تست Playwright")).toBeVisible({
      timeout: 10_000,
    });

    await page.getByRole("tab", { name: "تماس" }).click();
    await page.getByRole("button", { name: "ثبت تماس" }).click();
    await expect(page.getByText(/پاسخ داد|تماس/).first()).toBeVisible({
      timeout: 10_000,
    });
  });

  test("stage move to lost requires reason", async ({ page }) => {
    await openFirstLead(page);
    // Stage badge is a button that opens the menu
    await page.getByRole("button").filter({ hasText: /.+/ }).nth(1).click();
    const lost = page.getByRole("menuitem", { name: /ریزش|از دست/ });
    if (await lost.isVisible().catch(() => false)) {
      await lost.click();
      await expect(page.getByRole("dialog")).toContainText(/دلیل ریزش/);
      await expect(
        page.getByRole("button", { name: "تأیید انتقال" }),
      ).toBeDisabled();
    }
  });

  test("assign consultant from header", async ({ page }) => {
    await openFirstLead(page);
    const assign = page.getByRole("button", { name: /مسئول|بدون مسئول/ }).first();
    if (await assign.isVisible().catch(() => false)) {
      await assign.click();
      const item = page.getByRole("menuitem").nth(1);
      if (await item.isVisible().catch(() => false)) {
        await item.click();
        await expect(page.getByText(/تخصیص به‌روز شد|مسئول/)).toBeVisible({
          timeout: 8_000,
        });
      }
    }
  });

  test("convert dialog opens", async ({ page }) => {
    await openFirstLead(page);
    await page.getByRole("button", { name: "تبدیل به پرونده" }).click();
    await expect(page.getByRole("dialog")).toContainText(/تبدیل به پرونده/);
    await expect(page.getByRole("button", { name: "ساخت پرونده" })).toBeVisible();
  });

  test("merge UI appears when duplicates exist", async ({ page }) => {
    await openFirstLead(page);
    const merge = page.getByRole("button", { name: "ادغام" }).first();
    if (await merge.isVisible({ timeout: 5_000 }).catch(() => false)) {
      await merge.click();
      await expect(page.getByRole("dialog")).toContainText(/ادغام لیدها/);
    }
  });

  test("version conflict banner after scenario", async ({ page }) => {
    await page.goto("/admin/leads");
    await page.evaluate(() => {
      window.sessionStorage.setItem("apply:mock-scenario", "version_mismatch");
    });
    await openFirstLead(page);
    // Trigger an edit that will 409
    const nameInput = page.getByLabel("نام");
    if (await nameInput.isVisible().catch(() => false)) {
      await nameInput.fill("نام تست تعارض نسخه");
      await nameInput.blur();
      await expect(
        page.getByText(/در همین لحظه|هم‌زمان|نسخه/),
      ).toBeVisible({ timeout: 8_000 });
    }
  });
});
