import { expect, test, type Page } from "@playwright/test";
import { staffLogin } from "./helpers";
import path from "node:path";
import { DEMO_ACCOUNTS } from "../src/mocks/config";

test.describe("admin leads import wizard", () => {
  test.beforeEach(async ({ page }) => {
    await staffLogin(page);
  });

  test("sample file with errors and duplicates through wizard", async ({
    page,
  }) => {
    await page.goto("/admin/leads/import");
    await expect(
      page.getByRole("heading", { name: "ورود لید از فایل" }),
    ).toBeVisible();

    const samplePath = path.join(
      process.cwd(),
      "e2e/fixtures/leads-import-sample.csv",
    );
    await page.locator('input[type="file"]').setInputFiles(samplePath);

    await expect(page.getByText(/نگاشت ستون|ستون فایل/)).toBeVisible({
      timeout: 15_000,
    });

    await page.getByRole("button", { name: /پیش‌نمایش و اعتبارسنجی/ }).click();

    await expect(page.getByText(/کل سطرها|معتبر|تکراری/)).toBeVisible({
      timeout: 15_000,
    });
    await expect(page.getByText(/خطا|رد|تکراری/)).toBeVisible();

    const commit = page.getByRole("button", { name: "ثبت نهایی" });
    if (await commit.isEnabled()) {
      await commit.click();
      await expect(page.getByText(/ایجاد شده|شناسه ورود/)).toBeVisible({
        timeout: 20_000,
      });
    }
  });
});
