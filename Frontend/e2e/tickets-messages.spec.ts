import { expect, test, type Page } from "@playwright/test";
import { DEMO_ACCOUNTS } from "../src/mocks/config";
import {
  apiStaffLogin,
  mockAuthHeaders,
  readMockTokens,
  writeMockTokens,
} from "./helpers";

async function studentOtpLogin(page: Page) {
  await page.goto("/login");
  await page
    .getByLabel("شماره موبایل", { exact: true })
    .fill(DEMO_ACCOUNTS.student.mobile);
  await page.getByRole("button", { name: "دریافت کد تأیید" }).click();
  await expect(page.getByText("کد تأیید را وارد کنید")).toBeVisible({
    timeout: 15_000,
  });
  const otpInputs = page.locator("[data-otp-root] input");
  await expect(otpInputs).toHaveCount(6);
  await otpInputs
    .first()
    .pressSequentially(DEMO_ACCOUNTS.student.otp, { delay: 25 });
  await page.waitForURL(/\/panel/, { timeout: 20_000 });
}

test.describe.configure({ timeout: 90_000 });

async function runTicketFlow(page: Page) {
  await studentOtpLogin(page);
  const studentTokens = await readMockTokens(page);
  expect(studentTokens?.accessToken).toBeTruthy();

  await page.goto("/panel/messages/new");
  await expect(page.getByRole("heading", { name: "پیام جدید" })).toBeVisible({
    timeout: 15_000,
  });

  await page.getByLabel("موضوع").fill("پیگیری مدارک اپلای");
  await page
    .getByLabel("متن پیام")
    .fill("سلام، وضعیت بررسی مدارک من چطور است؟");
  await page.getByRole("button", { name: "ارسال پیام" }).click();

  await page.waitForURL(/\/panel\/messages\/[0-9a-f-]+/, { timeout: 20_000 });
  const ticketUrl = page.url();
  const ticketId = ticketUrl.split("/").pop()!;
  expect(ticketId.length).toBeGreaterThan(8);

  await expect(
    page
      .getByRole("paragraph")
      .filter({ hasText: "سلام، وضعیت بررسی مدارک من چطور است؟" }),
  ).toBeVisible({ timeout: 10_000 });

  // Staff reply via API (same MSW db) then verify in student UI
  await apiStaffLogin(page, DEMO_ACCOUNTS.admin);
  const staffHeaders = await mockAuthHeaders(page);
  const replyRes = await page.evaluate(
    async ({ id, headers }) => {
      const res = await fetch(`/api/v1/tickets/${id}/messages`, {
        method: "POST",
        headers: {
          ...headers,
          "Content-Type": "application/json",
          "Idempotency-Key": `e2e-staff-${Date.now()}`,
        },
        body: JSON.stringify({
          body: "مدارک شما در حال بررسی است.",
          attachmentIds: [],
          internal: false,
        }),
      });
      return { ok: res.ok, status: res.status };
    },
    { id: ticketId, headers: staffHeaders },
  );
  expect(replyRes.ok).toBeTruthy();

  // Internal note must not appear for student
  await page.evaluate(
    async ({ id, headers }) => {
      await fetch(`/api/v1/tickets/${id}/messages`, {
        method: "POST",
        headers: {
          ...headers,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          body: "یادداشت داخلی فقط کارکنان",
          attachmentIds: [],
          internal: true,
        }),
      });
    },
    { id: ticketId, headers: staffHeaders },
  );

  await writeMockTokens(page, studentTokens!);
  await page.goto(`/panel/messages/${ticketId}`);
  await expect(
    page.getByRole("paragraph").filter({ hasText: "مدارک شما در حال بررسی است." }),
  ).toBeVisible({ timeout: 15_000 });
  await expect(
    page.getByRole("paragraph").filter({ hasText: "یادداشت داخلی فقط کارکنان" }),
  ).toHaveCount(0);

  await page.getByPlaceholder("پیام خود را بنویسید…").fill("متشکرم، منتظر می‌مانم.");
  await page.getByRole("button", { name: "ارسال" }).click();
  await expect(
    page.getByRole("paragraph").filter({ hasText: "متشکرم، منتظر می‌مانم." }),
  ).toBeVisible({ timeout: 10_000 });

  await page.getByRole("button", { name: "بستن گفتگو" }).click();
  await expect(page.getByText("امتیاز به این گفتگو")).toBeVisible({
    timeout: 10_000,
  });
  await page.getByRole("button", { name: "4 از ۵" }).click();
  await page.getByRole("button", { name: "ثبت امتیاز" }).click();
  await expect(page.getByText(/امتیاز شما: 4/)).toBeVisible({
    timeout: 10_000,
  });
}

test.describe("Tickets messages flow (mobile)", () => {
  test.use({
    viewport: { width: 390, height: 844 },
    isMobile: true,
    hasTouch: true,
  });

  test("create → staff reply → student message → close → rating", async ({
    page,
  }) => {
    await runTicketFlow(page);
  });
});

test.describe("Tickets messages flow (desktop)", () => {
  test.use({ viewport: { width: 1280, height: 800 } });

  test("create → staff reply → student message → close → rating", async ({
    page,
  }) => {
    await runTicketFlow(page);
  });
});
