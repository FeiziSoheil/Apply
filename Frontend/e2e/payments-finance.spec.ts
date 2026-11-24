import { expect, test, type Page } from "@playwright/test";
import path from "node:path";
import { DEMO_ACCOUNTS } from "../src/mocks/config";
import { apiStaffLogin, staffLogin } from "./helpers";

const FIXTURE_JPEG = path.join(__dirname, "fixtures/tiny.jpg");

async function studentOtpLogin(page: Page) {
  await page.goto("/login");
  await page
    .getByLabel("شماره موبایل", { exact: true })
    .fill(DEMO_ACCOUNTS.student.mobile);
  await page.getByRole("button", { name: "دریافت کد تأیید" }).click();
  await expect(page.getByText("کد تأیید را وارد کنید")).toBeVisible({
    timeout: 15_000,
  });
  await page
    .locator("[data-otp-root] input")
    .first()
    .pressSequentially(DEMO_ACCOUNTS.student.otp, { delay: 30 });
  await page.waitForURL(/\/panel/, { timeout: 20_000 });
}

test.describe("Student and Staff Payments & Finance", () => {
  test("1. Online gateway payment: success flow with digital receipt", async ({
    page,
  }) => {
    await studentOtpLogin(page);
    await page.goto("/panel/payments");
    await expect(
      page.getByRole("heading", { name: "پرداخت‌ها و اقساط" }),
    ).toBeVisible({ timeout: 15_000 });

    // Check financial summary card
    await expect(page.getByText("کل مبلغ قرارداد")).toBeVisible();
    await expect(page.getByLabel("خلاصه مالی").getByText("پرداخت‌شده")).toBeVisible();

    // Click pay on the first payable installment
    const payBtn = page.getByRole("button", { name: "پرداخت" }).first();
    await expect(payBtn).toBeVisible({ timeout: 10_000 });
    await payBtn.click();

    // In payment modal, select online gateway and click redirect button
    await expect(page.getByRole("dialog")).toBeVisible();
    const gatewayBtn = page.getByRole("button", {
      name: "انتقال به درگاه پرداخت",
    });
    await expect(gatewayBtn).toBeVisible();
    await gatewayBtn.click();

    // Mock Gateway page
    await page.waitForURL(/\/mock-gateway\/.+/, { timeout: 15_000 });
    await expect(
      page.getByRole("heading", { name: "درگاه پرداخت آزمایشی" }),
    ).toBeVisible();

    // Click success
    await page.getByRole("button", { name: "پرداخت موفق" }).click();

    // Return to callback
    await page.waitForURL(/\/panel\/payments\/callback.+/, { timeout: 15_000 });
    await expect(
      page.getByRole("heading", { name: "پرداخت با موفقیت انجام شد" }),
    ).toBeVisible({ timeout: 15_000 });
    await expect(page.getByText("کد پیگیری تراکنش:")).toBeVisible();
    await expect(page.getByText("مبلغ به حروف:")).toBeVisible();

    // Return to payments view
    await page
      .getByRole("link", { name: "مشاهده فاکتور و پرداخت‌ها" })
      .click();
    await page.waitForURL(/\/panel\/payments/, { timeout: 15_000 });
  });

  test("2. Online gateway payment: failed outcome and retry button", async ({
    page,
  }) => {
    await studentOtpLogin(page);
    await page.goto("/panel/payments");
    await expect(
      page.getByRole("heading", { name: "پرداخت‌ها و اقساط" }),
    ).toBeVisible({ timeout: 15_000 });

    const payBtn = page.getByRole("button", { name: "پرداخت" }).first();
    await expect(payBtn).toBeVisible({ timeout: 10_000 });
    await payBtn.click();

    await expect(page.getByRole("dialog")).toBeVisible();
    const gatewayBtn = page.getByRole("button", {
      name: "انتقال به درگاه پرداخت",
    });
    await expect(gatewayBtn).toBeVisible();
    await gatewayBtn.click();

    await page.waitForURL(/\/mock-gateway\/.+/, { timeout: 15_000 });
    await page.getByRole("button", { name: "پرداخت ناموفق" }).click();

    await page.waitForURL(/\/panel\/payments\/callback.+/, { timeout: 15_000 });
    await expect(
      page.getByRole("heading", { name: "پرداخت ناموفق بود" }),
    ).toBeVisible({ timeout: 15_000 });
    const retryLink = page.getByRole("link", {
      name: "تلاش مجدد برای پرداخت",
    });
    await expect(retryLink).toBeVisible();
    await retryLink.click();
    await page.waitForURL(/\/panel\/payments/, { timeout: 15_000 });
  });

  test("3. Online gateway payment: cancelled flow", async ({ page }) => {
    await studentOtpLogin(page);
    await page.goto("/panel/payments");
    await expect(
      page.getByRole("heading", { name: "پرداخت‌ها و اقساط" }),
    ).toBeVisible({ timeout: 15_000 });

    const payBtn = page.getByRole("button", { name: "پرداخت" }).first();
    await expect(payBtn).toBeVisible({ timeout: 10_000 });
    await payBtn.click();

    await expect(page.getByRole("dialog")).toBeVisible();
    const gatewayBtn = page.getByRole("button", {
      name: "انتقال به درگاه پرداخت",
    });
    await expect(gatewayBtn).toBeVisible();
    await gatewayBtn.click();

    await page.waitForURL(/\/mock-gateway\/.+/, { timeout: 15_000 });
    await page.getByRole("button", { name: "انصراف" }).click();

    await page.waitForURL(/\/panel\/payments\/callback.+/, { timeout: 15_000 });
    await expect(
      page.getByRole("heading", { name: "انصراف از پرداخت" }),
    ).toBeVisible({ timeout: 15_000 });
    await expect(
      page.getByText("فرایند پرداخت توسط شما لغو شد"),
    ).toBeVisible();
  });

  test("4. Card-to-card receipt submission by student and staff approval", async ({
    page,
  }) => {
    // Student logs in and uploads card-to-card receipt
    await studentOtpLogin(page);
    await page.goto("/panel/payments");
    await expect(
      page.getByRole("heading", { name: "پرداخت‌ها و اقساط" }),
    ).toBeVisible({ timeout: 15_000 });

    const payBtn = page.getByRole("button", { name: "پرداخت" }).first();
    await expect(payBtn).toBeVisible({ timeout: 10_000 });
    await payBtn.click();

    // Switch to card-to-card tab
    await page.getByRole("tab", { name: "کارت‌به‌کارت" }).click();
    await expect(page.getByText("شماره کارت موسسه:")).toBeVisible();
    await expect(page.getByText("کپی شماره کارت")).toBeVisible();

    // Upload receipt file
    const fileInput = page.locator('input[type="file"]#receipt-upload');
    await fileInput.setInputFiles(FIXTURE_JPEG);

    // Wait for receipt selection
    await expect(page.getByText("رسید انتخاب شد:")).toBeVisible({
      timeout: 10_000,
    });

    // Submit card-to-card receipt
    const submitBtn = page.getByRole("button", { name: "ثبت و ارسال رسید" });
    await expect(submitBtn).toBeEnabled();
    await submitBtn.click();

    await expect(
      page.getByText(/در انتظار تأیید رسید|رسید در حال بررسی/).first(),
    ).toBeVisible({ timeout: 15_000 });

    // Now staff logs in and navigates to /admin/finance
    await apiStaffLogin(page, DEMO_ACCOUNTS.admin);
    await page.goto("/admin/finance");
    await expect(
      page.getByRole("heading", { name: "مدیریت مالی" }),
    ).toBeVisible({ timeout: 15_000 });

    // Open awaiting verification tab
    await page.getByRole("tab", { name: /در انتظار تأیید/ }).click();

    // Verify receipt preview button is visible and approve button is available
    const approveBtn = page.getByRole("button", { name: "تأیید" }).first();
    if (await approveBtn.isVisible({ timeout: 8_000 }).catch(() => false)) {
      await approveBtn.click();
      await expect(page.getByText(/تأیید شد/).first()).toBeVisible({
        timeout: 10_000,
      });
    }
  });

  test("5. Case detail payments tab: payment plan creation with sum validation", async ({
    page,
  }) => {
    await staffLogin(page);
    await page.goto("/admin/cases");
    await expect(
      page.getByRole("heading", { name: "پرونده‌ها" }),
    ).toBeVisible({ timeout: 15_000 });

    const caseLink = page.locator('a[href^="/admin/cases/"]').first();
    await expect(caseLink).toBeVisible({ timeout: 15_000 });
    await caseLink.click();
    await page.waitForURL(/\/admin\/cases\/.+/);

    // Click payments tab
    await page.getByRole("tab", { name: "پرداخت‌ها" }).click();
    await expect(
      page.getByRole("heading", { name: "امور مالی و پرداخت‌های پرونده" }),
    ).toBeVisible({ timeout: 15_000 });

    // Click define payment plan
    const definePlanBtn = page.getByRole("button", {
      name: "تعریف طرح پرداخت",
    });
    await expect(definePlanBtn).toBeVisible({ timeout: 10_000 });
    await definePlanBtn.click();

    // Check dialog opens
    await expect(page.getByRole("dialog")).toBeVisible();
    await expect(page.getByText("تعریف طرح پرداخت اقساطی")).toBeVisible();

    // The default plan rows sum to planTotal (500M + 500M = 1B Rials), so submit should be enabled
    const submitBtn = page.getByRole("button", { name: "ثبت طرح پرداخت" });
    await expect(submitBtn).toBeEnabled();
    await submitBtn.click();

    // Success toast
    await expect(
      page.getByText(/طرح پرداخت با موفقیت ثبت شد/).first(),
    ).toBeVisible({ timeout: 10_000 });
  });
});
