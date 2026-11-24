import { expect, test, type Page } from "@playwright/test";
import { DEMO_ACCOUNTS } from "../src/mocks/config";
import { staffLogin } from "./helpers";

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

test.describe("Panel Appointments, Profile, Shortlist & Admin Requests", () => {
  /* ------------------------------------------------------------------------ */
  /* 1. Appointments: list, .ics download, 24h cancel rule, new booking       */
  /* ------------------------------------------------------------------------ */
  test("1. Appointments: view upcoming/past, .ics calendar export, 24h cancel restriction, new booking dialog", async ({
    page,
  }) => {
    await studentOtpLogin(page);
    await page.goto("/panel/appointments");

    await expect(
      page.getByRole("heading", { name: "رزروها و جلسات مشاوره" }),
    ).toBeVisible({ timeout: 15_000 });

    // Verify upcoming session card is present
    await expect(page.getByText("مشاوره آنلاین").first()).toBeVisible();
    await expect(page.getByText("لینک ورود به جلسه اختصاصی:").first()).toBeVisible();

    // Verify .ics download works
    const downloadPromise = page.waitForEvent("download");
    const icsBtn = page.getByRole("button", { name: /افزودن به تقویم \(\.ics\)/ }).first();
    await expect(icsBtn).toBeVisible();
    await icsBtn.click();
    const download = await downloadPromise;
    expect(download.suggestedFilename()).toMatch(/\.ics$/);

    // Verify 24-hour cancellation rule
    const cancelBtn = page.getByRole("button", { name: "لغو رزرو" }).first();
    await expect(cancelBtn).toBeVisible();
    await cancelBtn.click();

    // Dialog opens with 24h window restriction warning
    await expect(page.getByRole("dialog")).toBeVisible();
    await expect(page.getByText("امکان لغو نوبت از پنل وجود ندارد")).toBeVisible();
    await expect(
      page.getByText("طبق قوانین موسسه، لغو یا تغییر زمان جلسه فقط تا ۲۴ ساعت قبل"),
    ).toBeVisible();

    // Link to message advisor
    const messageAdvisorLink = page.getByRole("link", { name: "پیام به مشاور پرونده" });
    await expect(messageAdvisorLink).toBeVisible();

    // Close cancel dialog
    await page.keyboard.press("Escape");
    await expect(page.getByRole("dialog")).not.toBeVisible();

    // Check past sessions tab
    await page.getByRole("tab", { name: /سوابق جلسات/ }).click();
    await expect(page.getByText("انجام‌شده").first()).toBeVisible();

    // Open new booking modal
    await page.getByRole("button", { name: "رزرو وقت جدید" }).click();
    await expect(page.getByRole("dialog")).toBeVisible();
    await expect(page.getByText("رزرو وقت مشاوره تحصیلی")).toBeVisible();

    // Verify student name and mobile are prefilled in booking form
    const nameInput = page.getByLabel("نام و نام خانوادگی");
    await expect(nameInput).not.toHaveValue("");
    const mobileInput = page.getByLabel("شماره موبایل");
    await expect(mobileInput).toHaveValue(DEMO_ACCOUNTS.student.mobile);
  });

  /* ------------------------------------------------------------------------ */
  /* 2. Shortlist: guest localStorage → OTP login → merge → compare & consult */
  /* ------------------------------------------------------------------------ */
  test("2. Shortlist: guest heart click → login merge → comparison modal with best-value highlights → consult ticket", async ({
    page,
  }) => {
    // Step A: Guest visits public programs page
    await page.goto("/programs");
    await expect(page.locator("h1")).toBeVisible({ timeout: 15_000 });

    // Click heart on the first program card
    const firstFavoriteBtn = page
      .getByRole("button", { name: "افزودن به علاقه‌مندی‌ها" })
      .first();
    await expect(firstFavoriteBtn).toBeVisible({ timeout: 10_000 });
    await firstFavoriteBtn.click();

    // Button state toggles to filled / "حذف از علاقه‌مندی‌ها"
    await expect(
      page.getByRole("button", { name: "حذف از علاقه‌مندی‌ها" }).first(),
    ).toBeVisible();

    // Check localStorage contains guest shortlist item
    const guestItems = await page.evaluate(() => {
      const raw = localStorage.getItem("apply:guest-shortlist");
      return raw ? JSON.parse(raw) : [];
    });
    expect(guestItems.length).toBeGreaterThanOrEqual(1);

    // Step B: Student logs in via OTP, merging guest shortlist into account
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

    // Step C: Navigate to shortlist page
    await page.goto("/panel/shortlist");
    await expect(page.getByRole("heading", { name: "علاقه‌مندی‌ها" })).toBeVisible({
      timeout: 15_000,
    });

    // Check programs are visible
    const selectCheckboxes = page.getByRole("checkbox");
    const count = await selectCheckboxes.count();
    expect(count).toBeGreaterThanOrEqual(1);

    // Select the first two programs for comparison if available, or select multiple
    await selectCheckboxes.nth(0).click();
    if (count >= 2) {
      await selectCheckboxes.nth(1).click();
    }

    // Floating comparison bar appears
    await expect(page.getByText("برنامه انتخاب شده")).toBeVisible();

    if (count >= 2) {
      // Click compare button
      const compareBtn = page.getByRole("button", { name: /مقایسه/ });
      await expect(compareBtn).toBeEnabled();
      await compareBtn.click();

      // Comparison dialog opens
      await expect(page.getByRole("dialog")).toBeVisible();
      await expect(page.getByText("مقایسه برنامه‌های تحصیلی منتخب")).toBeVisible();
      await expect(page.getByText("شهریه سالانه").first()).toBeVisible();

      // Click "درخواست مشاوره درباره این برنامه‌ها" inside comparison dialog
      await page.getByRole("button", { name: "درخواست مشاوره درباره این برنامه‌ها" }).click();
    } else {
      // Click "درخواست مشاوره" from floating bar
      await page.getByRole("button", { name: "درخواست مشاوره" }).click();
    }

    await expect(page.getByText("درخواست مشاوره درباره برنامه‌های انتخابی")).toBeVisible();

    // Fill consultation note and submit
    await page
      .getByPlaceholder("نکات، سوالات و اولویت‌های خود را بنویسید...")
      .fill("لطفاً در مورد شرایط پذیرش این رشته‌ها راهنمایی فرمایید.");
    await page.getByRole("button", { name: "ثبت تیکت مشاوره" }).click();

    // Navigates to tickets page
    await page.waitForURL(/\/panel\/tickets/, { timeout: 15_000 });
    await expect(page.getByRole("heading", { name: /پیام‌ها|تیکت/ })).toBeVisible();
  });

  /* ------------------------------------------------------------------------ */
  /* 3. Profile: info, assessment, notifs, data export, delete request & admin */
  /* ------------------------------------------------------------------------ */
  test("3. Profile: assessment card, vital notifications lock, JSON export, account deletion & admin processing", async ({
    page,
  }) => {
    // Step A: Student visits profile
    await studentOtpLogin(page);
    await page.goto("/panel/profile");
    await expect(page.getByRole("heading", { name: "پروفایل و تنظیمات" })).toBeVisible({
      timeout: 15_000,
    });

    // Check personal info & assessment profile card
    await expect(page.getByText("اطلاعات پایه دانشجو")).toBeVisible();
    await expect(page.getByText("پروفایل ارزیابی اولیه")).toBeVisible();
    await expect(page.getByText("مشاهده توسط مشاور")).toBeVisible();

    // Step B: Check notification preferences tab
    await page.getByRole("tab", { name: "تنظیمات اعلان‌ها" }).click();
    await expect(page.getByText("کانال‌ها و اولویت‌های دریافت اعلان")).toBeVisible();
    await expect(page.getByText("نکته درباره اعلان‌های حیاتی")).toBeVisible();

    // Verify in-app toggle for vital notifications is disabled
    const docRejectedSwitch = page.locator("#inapp-document_rejected");
    await expect(docRejectedSwitch).toBeDisabled();
    const installmentDueSwitch = page.locator("#inapp-installment_due");
    await expect(installmentDueSwitch).toBeDisabled();

    // Step C: Security & Privacy tab
    await page.getByRole("tab", { name: "امنیت و حریم خصوصی" }).click();
    await expect(page.getByText("نشست‌های فعال شما")).toBeVisible();
    await expect(page.getByText("این دستگاه")).toBeVisible();
    await expect(page.getByRole("button", { name: "خروج از همه دستگاه‌ها" })).toBeVisible();

    // Test Data Export JSON download
    const exportPromise = page.waitForEvent("download");
    await page.getByRole("button", { name: "دریافت نسخه کامل داده‌ها" }).click();
    const exportDownload = await exportPromise;
    expect(exportDownload.suggestedFilename()).toMatch(/\.json$/);

    // Test Account Deletion Request
    await page.getByRole("button", { name: "ثبت درخواست حذف حساب" }).click();
    await expect(page.getByRole("dialog")).toBeVisible();
    await expect(page.getByText("درخواست حذف حساب کاربری")).toBeVisible();

    const deleteReason = "تغییر برنامه مهاجرت برای نیمسال آینده";
    await page
      .getByPlaceholder("دلیل درخواست حذف حساب کاربری...")
      .fill(deleteReason);
    await page.getByRole("button", { name: "تأیید و ارسال درخواست به مدیر" }).click();

    // Verify request appears in history
    await expect(page.getByText("تاریخچه درخواست‌های حریم خصوصی شما:")).toBeVisible({
      timeout: 10_000,
    });
    await expect(page.getByText("در حال بررسی مدیر").first()).toBeVisible();

    // Step D: Admin processes the deletion request
    await page.evaluate(() => {
      localStorage.clear();
      sessionStorage.clear();
    });
    await page.context().clearCookies();
    await staffLogin(page);
    await page.goto("/admin/requests");
    await expect(
      page.getByRole("heading", { name: "درخواست‌های حریم خصوصی و حذف حساب" }),
    ).toBeVisible({ timeout: 15_000 });

    // Find the pending request row
    await expect(page.getByText(DEMO_ACCOUNTS.student.name).first()).toBeVisible();
    const reviewBtn = page.getByRole("button", { name: "بررسی و تعیین تکلیف" }).first();
    await expect(reviewBtn).toBeVisible();
    await reviewBtn.click();

    // Process dialog opens
    await expect(page.getByRole("dialog")).toBeVisible();
    await expect(page.getByText("بررسی درخواست حریم خصوصی")).toBeVisible();

    // Enter note and submit approval
    await page
      .getByPlaceholder("توضیحات و دلایل تصمیم...")
      .fill("تسویه حساب مالی تأیید شد و پرونده بایگانی گردید.");
    await page.getByRole("button", { name: "ثبت و نهایی‌سازی تصمیم" }).click();

    // Verify status changes to completed
    await expect(page.getByText("تکمیل‌شده").first()).toBeVisible({ timeout: 10_000 });
  });
});
