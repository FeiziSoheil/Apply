import { expect, test, type Page } from "@playwright/test";
import path from "node:path";
import { DEMO_ACCOUNTS } from "../src/mocks/config";
import {
  apiStaffLogin,
  getStaffAuthHeaders,
  invalidateBrowserQueries,
  mockAuthHeaders,
  readMockTokens,
  staffLogin,
  staffReviewDocument,
  writeMockTokens,
} from "./helpers";

const FIXTURE_JPEG = path.join(__dirname, "fixtures/tiny.jpg");
const REJECT_REASON = "کیفیت تصویر کافی نیست؛ لطفاً اسکن واضح‌تری بارگذاری کنید.";

async function flushMockPersist(page: Page) {
  await page.waitForTimeout(400);
}

test.describe("Full Mobile Viewport Student Journey", () => {
  test.use({
    viewport: { width: 390, height: 844 },
    isMobile: true,
    hasTouch: true,
  });

  test("End-to-End Mobile Journey: Lead → Case → Student OTP → Upload → Staff Reject → Re-upload & Approve → Message → Pay Installment → CRM & Finance Verification", async ({
    page,
  }) => {
    test.setTimeout(120_000);

    const stamp = Date.now();
    const studentMobile = `0912${String(stamp).slice(-7)}`;
    const studentName = `دانشجوی موبایل ${stamp}`;

    // Disable onboarding tour, pwa prompt and nextjs dev overlay in mobile viewport
    await page.addInitScript(() => {
      localStorage.setItem("apply_onboarding_completed", "true");
      localStorage.setItem("apply_pwa_dismissed", "never");
      const style = document.createElement("style");
      style.textContent = "nextjs-portal { pointer-events: none !important; display: none !important; }";
      document.head?.appendChild(style);
      window.addEventListener("DOMContentLoaded", () => {
        document.head?.appendChild(style);
      });
    });

    /* ------------------------------------------------------------------------ */
    /* Step 1: Register lead from public website form                           */
    /* ------------------------------------------------------------------------ */
    await page.goto("/contact");
    await expect(page.getByRole("heading", { name: "تماس با ما" })).toBeVisible({
      timeout: 15_000,
    });

    const contactForm = page.locator("form").filter({
      has: page.getByRole("button", { name: "ارسال پیام" }),
    });
    await contactForm.getByLabel("نام و نام خانوادگی").fill(studentName);
    await contactForm.getByLabel("شماره موبایل", { exact: true }).fill(studentMobile);
    await contactForm.getByLabel("پیام").fill("درخواست پذیرش تحصیلی و مهاجرت از موبایل");
    await contactForm.getByRole("button", { name: "ارسال پیام" }).click();
    await expect(page.getByText(/موفقیت|ارسال شد/)).toBeVisible({
      timeout: 15_000,
    });
    await flushMockPersist(page);

    /* ------------------------------------------------------------------------ */
    /* Step 2: Consultant converts lead to case & defines payment plan          */
    /* ------------------------------------------------------------------------ */
    const staffHeaders = await getStaffAuthHeaders(page, DEMO_ACCOUNTS.admin);

    // Search and find the lead
    const leadsRes = await page.evaluate(
      async ({ mobile, auth }) => {
        const res = await fetch(`/api/v1/leads?q=${encodeURIComponent(mobile)}`, {
          headers: auth,
        });
        return res.json();
      },
      { mobile: studentMobile, auth: staffHeaders },
    );

    const leadItem = leadsRes.data?.[0];
    expect(leadItem).toBeTruthy();
    expect(leadItem.mobile).toBe(studentMobile);

    // Convert lead to case
    const convertRes = await page.evaluate(
      async ({ leadId, auth }) => {
        const res = await fetch(`/api/v1/leads/${leadId}/convert`, {
          method: "POST",
          headers: {
            ...auth,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            targetCountry: "germany",
            targetDegree: "master",
            programIds: [],
          }),
        });
        return res.json();
      },
      { leadId: leadItem.id, auth: staffHeaders },
    );

    const createdCase = convertRes.data;
    expect(createdCase?.id).toBeTruthy();
    const caseId = createdCase.id;

    // Create payment plan for this case with 1 installment
    const planRes = await page.evaluate(
      async ({ id, auth }) => {
        const res = await fetch(`/api/v1/cases/${id}/payment-plan`, {
          method: "POST",
          headers: {
            ...auth,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            total: 35_000_000,
            installments: [
              {
                title: "پیش‌پرداخت قرارداد",
                amount: 35_000_000,
                dueDate: "2026-11-20",
              },
            ],
          }),
        });
        return res.json();
      },
      { id: caseId, auth: staffHeaders },
    );
    expect(planRes.data?.id).toBeTruthy();
    await flushMockPersist(page);

    /* ------------------------------------------------------------------------ */
    /* Step 3: Student logs in via OTP on mobile viewport                       */
    /* ------------------------------------------------------------------------ */
    await page.evaluate(() => {
      sessionStorage.removeItem("apply:mock-tokens");
      sessionStorage.removeItem("apply:mock-auth");
    });
    await page.context().clearCookies();
    await page.goto("/login");
    await page.getByLabel("شماره موبایل", { exact: true }).fill(studentMobile);
    await page.getByRole("button", { name: "دریافت کد تأیید" }).click();
    await expect(page.getByText("کد تأیید را وارد کنید")).toBeVisible({
      timeout: 15_000,
    });

    const otpInputs = page.locator("[data-otp-root] input");
    await expect(otpInputs).toHaveCount(6);
    await otpInputs
      .first()
      .pressSequentially(DEMO_ACCOUNTS.student.otp, { delay: 30 });

    await page.waitForURL(/\/panel/, { timeout: 20_000 });
    await expect(page.getByText("قدم بعدی شما").first()).toBeVisible({
      timeout: 15_000,
    });

    const studentTokens = await readMockTokens(page);
    expect(studentTokens?.accessToken).toBeTruthy();

    /* ------------------------------------------------------------------------ */
    /* Step 4: Student uploads document in /panel/documents                     */
    /* ------------------------------------------------------------------------ */
    await page.getByRole("link", { name: "رفتن به مدارک" }).click();
    await page.waitForURL(/\/panel\/documents/, { timeout: 15_000 });
    await expect(page.getByTestId("student-documents")).toBeVisible({
      timeout: 20_000,
    });

    // Identify first checklist card to upload
    const uploadBtn = page.getByTestId(/student-doc-upload-/).first();
    await expect(uploadBtn).toBeVisible({ timeout: 15_000 });
    const card = page
      .locator("[data-testid^=student-doc-]")
      .filter({ has: uploadBtn })
      .first();
    const viewId = (await card.getAttribute("data-testid"))?.replace(
      "student-doc-",
      "",
    );
    expect(viewId).toBeTruthy();
    const cardTestId = `student-doc-${viewId}`;
    const docTitle = (await card.locator("p.font-medium").first().innerText())
      .replace(/\*/g, "")
      .replace(/\(اختیاری\)/g, "")
      .trim();

    // Perform upload
    await uploadBtn.click();
    await expect(page.getByTestId("student-document-uploader")).toBeVisible();
    await page
      .locator('input[type="file"][accept="image/jpeg,image/png,application/pdf"]')
      .setInputFiles(FIXTURE_JPEG);

    await expect(page.getByLabel("پیش‌نمایش صفحات")).toBeVisible({
      timeout: 15_000,
    });
    await page.getByTestId("student-document-submit").click();
    await expect(page.getByTestId("student-document-uploader")).toBeHidden({
      timeout: 30_000,
    });

    await expect(page.locator(`[data-testid="${cardTestId}"]`)).toHaveAttribute(
      "data-status",
      /uploaded|pending/,
      { timeout: 15_000 },
    );
    await flushMockPersist(page);

    /* ------------------------------------------------------------------------ */
    /* ------------------------------------------------------------------------ */
    /* Step 5: Staff rejects document with rejection reason                     */
    /* ------------------------------------------------------------------------ */
    const staffHeadersForReject = await getStaffAuthHeaders(page, DEMO_ACCOUNTS.admin);
    await staffReviewDocument(page, {
      caseId,
      checklistItemId: viewId,
      titleHint: docTitle,
      status: "rejected",
      rejectionReason: REJECT_REASON,
      authHeaders: staffHeadersForReject,
    });
    await flushMockPersist(page);

    /* ------------------------------------------------------------------------ */
    /* Step 6: Student sees rejection, re-uploads, staff approves               */
    /* ------------------------------------------------------------------------ */
    await invalidateBrowserQueries(page);

    const rejectedCard = page.locator(`[data-testid="${cardTestId}"]`);
    await expect(rejectedCard).toHaveAttribute("data-status", "rejected", {
      timeout: 15_000,
    });
    await expect(rejectedCard.getByRole("alert")).toContainText(/کیفیت/);

    // Student re-uploads
    const reuploadBtn = rejectedCard.getByTestId(/student-doc-upload-/).first();
    await reuploadBtn.click();
    await expect(page.getByTestId("student-document-uploader")).toBeVisible();
    await page
      .locator('input[type="file"][accept="image/jpeg,image/png,application/pdf"]')
      .setInputFiles(FIXTURE_JPEG);
    await expect(page.getByLabel("پیش‌نمایش صفحات")).toBeVisible({
      timeout: 15_000,
    });
    await page.getByTestId("student-document-submit").click();
    await expect(page.getByTestId("student-document-uploader")).toBeHidden({
      timeout: 30_000,
    });
    await expect(rejectedCard).toHaveAttribute(
      "data-status",
      /uploaded|pending/,
      { timeout: 15_000 },
    );
    await flushMockPersist(page);

    // Staff approves re-uploaded document
    const staffHeadersForApprove = await getStaffAuthHeaders(page, DEMO_ACCOUNTS.admin);
    await staffReviewDocument(page, {
      caseId,
      checklistItemId: viewId,
      titleHint: docTitle,
      status: "approved",
      authHeaders: staffHeadersForApprove,
    });
    await flushMockPersist(page);

    // Student sees approved status via query invalidation
    await invalidateBrowserQueries(page);
    await expect(page.getByTestId("student-documents")).toBeVisible({
      timeout: 15_000,
    });
    const approvedCard = page.locator(`[data-testid="${cardTestId}"]`);
    await expect(approvedCard).toHaveAttribute("data-status", "approved", {
      timeout: 15_000,
    });

    /* ------------------------------------------------------------------------ */
    /* Step 7: Messages/Ticket exchange between student and staff               */
    /* ------------------------------------------------------------------------ */
    const nav = page.locator("nav.md\\:hidden");
    await nav.getByRole("link", { name: "پیام‌ها" }).click({ force: true });
    await page.waitForURL(/\/panel\/messages/, { timeout: 15_000 });
    await page.getByRole("link", { name: "پیام جدید" }).click();
    await page.waitForURL(/\/panel\/messages\/new/, { timeout: 15_000 });

    await page.getByLabel("موضوع").fill("پیگیری مدارک تأییدشده و پرداخت قسط");
    await page
      .getByLabel("متن پیام")
      .fill("سلام، مدارک من تأیید شد. لطفاً قسط اول را هم بررسی کنید.");
    await page.getByRole("button", { name: "ارسال پیام" }).click();

    await page.waitForURL(/\/panel\/messages\/[0-9a-f-]+/, { timeout: 20_000 });
    const ticketUrl = page.url();
    const ticketId = ticketUrl.split("/").pop()!;

    // Staff replies via API in the same DB
    const staffReplyHdrs = await getStaffAuthHeaders(page, DEMO_ACCOUNTS.admin);
    await page.evaluate(
      async ({ id, auth }) => {
        await fetch(`/api/v1/tickets/${id}/messages`, {
          method: "POST",
          headers: {
            ...auth,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            body: "سلام، مدارک شما با موفقیت تأیید شد و قسط اول در بخش پرداخت‌ها آماده است.",
          }),
        });
      },
      { id: ticketId, auth: staffReplyHdrs },
    );
    await flushMockPersist(page);

    // Invalidate queries to render staff reply in ticket thread
    await invalidateBrowserQueries(page);
    await expect(
      page.getByText("سلام، مدارک شما با موفقیت تأیید شد و قسط اول در بخش پرداخت‌ها آماده است."),
    ).toBeVisible({ timeout: 15_000 });

    /* ------------------------------------------------------------------------ */
    /* Step 8: Installment payment via Mock Gateway                             */
    /* ------------------------------------------------------------------------ */
    await page.goto("/panel/payments");
    await expect(
      page.getByRole("heading", { name: "پرداخت‌ها و اقساط" }),
    ).toBeVisible({ timeout: 15_000 });

    const payBtn = page.getByRole("button", { name: "پرداخت" }).first();
    await expect(payBtn).toBeVisible({ timeout: 10_000 });
    await payBtn.click();

    // In payment dialog, click redirect to mock gateway
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

    // Click successful payment
    await page.getByRole("button", { name: "پرداخت موفق" }).click();

    // Returned to callback
    await page.waitForURL(/\/panel\/payments\/callback.+/, { timeout: 15_000 });
    await expect(
      page.getByRole("heading", { name: "پرداخت با موفقیت انجام شد" }),
    ).toBeVisible({ timeout: 15_000 });

    // Return to payments view and verify installment is marked paid
    await page
      .getByRole("link", { name: "مشاهده فاکتور و پرداخت‌ها" })
      .click();
    await page.waitForURL(/\/panel\/payments/, { timeout: 15_000 });
    await expect(page.getByText("پرداخت‌شده").first()).toBeVisible({
      timeout: 15_000,
    });
    await flushMockPersist(page);

    /* ------------------------------------------------------------------------ */
    /* Step 9: Staff verifies case, timeline & finance report in CRM            */
    /* ------------------------------------------------------------------------ */
    await apiStaffLogin(page, DEMO_ACCOUNTS.admin);

    // Case detail verification
    await page.goto(`/admin/cases/${caseId}`);
    await expect(page).toHaveURL(new RegExp(`/admin/cases/${caseId}`));
    await expect(page.getByText("آزمایشی").or(page.getByText("فعال")).first()).toBeVisible({
      timeout: 15_000,
    });

    // Finance overview verification
    await page.goto("/admin/finance");
    await expect(page.getByRole("heading", { name: /^مدیریت مالی/ })).toBeVisible({
      timeout: 15_000,
    });

    // Verify student payment is reflected in finance transactions table
    await expect(page.locator("table")).toContainText("درگاه آنلاین", {
      timeout: 15_000,
    });
  });
});
