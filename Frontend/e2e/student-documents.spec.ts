import { expect, test, type Page } from "@playwright/test";
import path from "node:path";
import { DEMO_ACCOUNTS } from "../src/mocks/config";
import {
  apiStaffLogin,
  mockAuthHeaders,
  readMockTokens,
  staffReviewDocument,
  writeMockTokens,
} from "./helpers";

const FIXTURE_JPEG = path.join(__dirname, "fixtures/tiny.jpg");
const REJECT_REASON =
  "کیفیت تصویر کافی نیست؛ لطفاً دوباره بارگذاری کنید.";

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

/** Mock db persist() is debounced 150ms — wait so navigations reload fresh snapshot. */
async function flushMockPersist(page: Page) {
  await page.waitForTimeout(400);
}

async function openDocuments(page: Page) {
  await flushMockPersist(page);
  await page.goto("/panel/documents");
  await expect(page.getByTestId("student-documents")).toBeVisible({
    timeout: 20_000,
  });
}

async function uploadOnCard(page: Page, cardTestId: string) {
  const card = page.locator(`[data-testid="${cardTestId}"]`);
  await card.getByTestId(/student-doc-upload-/).click();
  await expect(page.getByTestId("student-document-uploader")).toBeVisible();
  await page
    .locator(
      'input[type="file"][accept="image/jpeg,image/png,application/pdf"]',
    )
    .setInputFiles(FIXTURE_JPEG);
  await expect(page.getByLabel("پیش‌نمایش صفحات")).toBeVisible({
    timeout: 15_000,
  });
  await page.getByTestId("student-document-submit").click();
  await expect(page.getByTestId("student-document-uploader")).toBeHidden({
    timeout: 30_000,
  });
}

test.describe("Student documents (mobile)", () => {
  test.use({
    viewport: { width: 390, height: 844 },
    isMobile: true,
    hasTouch: true,
  });

  test("upload → staff reject → re-upload → approve", async ({ page }) => {
    test.setTimeout(120_000);

    // Fresh mock snapshot so seed demo docs (rejected passport, etc.) are deterministic
    await page.goto("/login");
    await page.evaluate(() => {
      localStorage.removeItem("apply:mock-db");
    });

    await studentOtpLogin(page);
    await openDocuments(page);
    await expect(page.getByText(/از .* مدرک تأیید شد/)).toBeVisible();

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
    const title = (await card.locator("p.font-medium").first().innerText())
      .replace(/\*/g, "")
      .replace(/\(اختیاری\)/g, "")
      .trim();

    /* ---- 1) Upload ---- */
    await uploadOnCard(page, cardTestId);
    await expect(page.locator(`[data-testid="${cardTestId}"]`)).toHaveAttribute(
      "data-status",
      /uploaded|pending/,
      { timeout: 15_000 },
    );
    await flushMockPersist(page);

    const studentTokens = await readMockTokens(page);
    expect(studentTokens).toBeTruthy();
    const studentHeaders = await mockAuthHeaders(page);

    const meta = await page.evaluate(async (auth) => {
      const caseRes = await fetch("/api/v1/me/case", { headers: auth });
      const caseJson = (await caseRes.json()) as { data: { id: string } };
      const docsRes = await fetch("/api/v1/me/documents", { headers: auth });
      const docsJson = (await docsRes.json()) as {
        data: {
          items: {
            id: string;
            status: string;
            checklistItemId: string | null;
            title: string;
          }[];
        };
      };
      return {
        caseId: caseJson.data.id,
        items: docsJson.data.items,
      };
    }, studentHeaders);

    const viewItem = meta.items.find((item) => item.id === viewId);
    expect(viewItem?.status).toMatch(/uploaded|pending/);
    const checklistItemId = viewItem?.checklistItemId ?? viewId;

    /* ---- 2) Staff reject (same MSW db via in-page fetch) ---- */
    await apiStaffLogin(page);
    await staffReviewDocument(page, {
      caseId: meta.caseId,
      checklistItemId,
      titleHint: title,
      status: "rejected",
      rejectionReason: REJECT_REASON,
    });
    await flushMockPersist(page);

    /* Restore student session and reload UI from persisted mock db */
    await writeMockTokens(page, studentTokens!);
    await openDocuments(page);
    const rejectedCard = page.locator(`[data-testid="${cardTestId}"]`);
    await expect(rejectedCard).toHaveAttribute("data-status", "rejected", {
      timeout: 15_000,
    });
    await expect(rejectedCard.getByRole("alert")).toContainText(/کیفیت/);

    /* ---- 3) Re-upload ---- */
    await uploadOnCard(page, cardTestId);
    await expect(rejectedCard).toHaveAttribute(
      "data-status",
      /uploaded|pending/,
      { timeout: 15_000 },
    );
    await flushMockPersist(page);

    /* ---- 4) Staff approve ---- */
    await apiStaffLogin(page);
    await staffReviewDocument(page, {
      caseId: meta.caseId,
      checklistItemId,
      titleHint: title,
      status: "approved",
    });
    await flushMockPersist(page);

    await writeMockTokens(page, studentTokens!);
    await openDocuments(page);
    const approvedCard = page.locator(`[data-testid="${cardTestId}"]`);
    await expect(approvedCard).toHaveAttribute("data-status", "approved", {
      timeout: 15_000,
    });
    await expect(
      approvedCard.getByText(/برای تغییر با مشاور تماس بگیرید/),
    ).toBeVisible();
  });
});
