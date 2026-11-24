import { expect, test } from "@playwright/test";
import { DEMO_ACCOUNTS } from "../src/mocks/config";

/**
 * Mobile-first student panel: OTP login → home next-step → documents.
 */
test.describe("Student panel (mobile)", () => {
  test.use({
    viewport: { width: 390, height: 844 },
    isMobile: true,
    hasTouch: true,
  });

  test("OTP login → dashboard next step → documents", async ({ page }) => {
    await page.goto("/login");

    await page
      .getByLabel("شماره موبایل", { exact: true })
      .fill(DEMO_ACCOUNTS.student.mobile);
    await page.getByRole("button", { name: "دریافت کد تأیید" }).click();

    // CardTitle is a div, not a heading
    await expect(page.getByText("کد تأیید را وارد کنید")).toBeVisible({
      timeout: 15_000,
    });

    const otp = DEMO_ACCOUNTS.student.otp;
    const otpRoot = page.locator("[data-otp-root]");
    const otpInputs = otpRoot.locator("input");
    await expect(otpInputs).toHaveCount(6);
    // Multi-digit fill triggers paste-style commit + onComplete verify
    await otpInputs.first().pressSequentially(otp, { delay: 30 });

    await page.waitForURL(/\/panel/, { timeout: 20_000 });

    const nextStep = page.getByTestId("student-next-step");
    await expect(nextStep).toBeVisible({ timeout: 20_000 });
    await expect(nextStep.getByText("قدم بعدی شما")).toBeVisible();

    await page
      .getByRole("navigation", { name: "ناوبری اصلی" })
      .getByRole("link", { name: "مدارک" })
      .click();

    await page.waitForURL(/\/panel\/documents/);
    await expect(page.getByTestId("student-documents")).toBeVisible({
      timeout: 15_000,
    });
    await expect(page.getByRole("heading", { name: "مدارک" })).toBeVisible();
  });
});
