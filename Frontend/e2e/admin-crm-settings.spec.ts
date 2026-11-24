import { expect, test, type Page } from "@playwright/test";
import { staffLogin } from "./helpers";
import { DEMO_ACCOUNTS } from "../src/mocks/config";

/**
 * E2E for `/admin/settings/crm` (mock API).
 * Requires: `npm run dev` with mocking enabled.
 */

test.describe("admin CRM settings", () => {
  test.beforeEach(async ({ page }) => {
    await staffLogin(page);
  });

  test("reorder stages and see effect on kanban", async ({ page }) => {
    await page.goto("/admin/settings/crm?tab=pipeline");
    await expect(
      page.getByRole("heading", { name: "تنظیمات CRM" }),
    ).toBeVisible({ timeout: 15_000 });
    await expect(page.getByTestId("crm-settings-pipeline")).toBeVisible();

    const preview = page.getByTestId("pipeline-kanban-preview");
    await expect(preview).toBeVisible();
    const firstTitle = await preview
      .locator("[data-stage-title]")
      .first()
      .getAttribute("data-stage-title");

    const handles = page.getByRole("button", { name: /جابه‌جایی مورد/ });
    await expect(handles.first()).toBeVisible({ timeout: 10_000 });
    const box = await handles.first().boundingBox();
    const second = await handles.nth(1).boundingBox();
    if (box && second) {
      await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
      await page.mouse.down();
      await page.mouse.move(second.x + second.width / 2, second.y + second.height / 2, {
        steps: 12,
      });
      await page.mouse.up();
    }

    await page.getByRole("button", { name: "ذخیره تغییرات" }).click();
    await expect(page.getByText(/پایپ‌لاین ذخیره شد/)).toBeVisible({
      timeout: 10_000,
    });

    await page.goto("/admin/leads?view=kanban");
    await expect(page.getByRole("heading", { name: "لیدها" })).toBeVisible({
      timeout: 15_000,
    });
    if (firstTitle) {
      await expect(
        page.getByRole("heading", { name: firstTitle }).or(
          page.getByLabel(new RegExp(`مرحله ${firstTitle}`)),
        ),
      ).toBeVisible({ timeout: 10_000 });
    }
  });

  test("assignment rule simulator", async ({ page }) => {
    await page.goto("/admin/settings/crm?tab=assignmentRules");
    await expect(page.getByTestId("assignment-simulator")).toBeVisible({
      timeout: 15_000,
    });
    await page.getByLabel("کشور هدف").fill("germany");
    await page.getByRole("button", { name: "شبیه‌سازی" }).click();
    await expect(page.getByTestId("assignment-sim-result")).toBeVisible({
      timeout: 10_000,
    });
  });

  test("message template with invalid variable", async ({ page }) => {
    await page.goto("/admin/settings/crm?tab=messageTemplates");
    await expect(page.getByTestId("crm-settings-messages")).toBeVisible({
      timeout: 15_000,
    });
    const body = page.getByTestId("message-template-body");
    await expect(body).toBeVisible();
    await body.fill("سلام {name} و {unknown_var}");
    await expect(page.getByTestId("message-unknown-vars")).toContainText(
      /unknown_var/,
    );
    await page.getByRole("button", { name: "ذخیره تغییرات" }).click();
    await expect(page.getByText(/متغیر نامعتبر|ناشناخته/)).toBeVisible({
      timeout: 8_000,
    });
  });

  test("delete stage that has leads requires migration UI", async ({
    page,
  }) => {
    await page.goto("/admin/settings/crm?tab=pipeline");
    await expect(page.getByTestId("crm-settings-pipeline")).toBeVisible({
      timeout: 15_000,
    });
    const deleteButtons = page.getByRole("button", { name: /^حذف / });
    await expect(deleteButtons.first()).toBeVisible();
    await deleteButtons.first().click();
    await expect(page.getByRole("dialog")).toContainText(/حذف مرحله/);
    await expect(
      page.getByRole("button", { name: /انتقال لیدها و حذف/ }),
    ).toBeVisible();
  });
});
