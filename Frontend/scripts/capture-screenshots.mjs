import { chromium } from "@playwright/test";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT_DIR = path.resolve(__dirname, "../..");
const SCREENSHOTS_DIR = path.resolve(ROOT_DIR, "docs/screenshots");
const PORT = 3100;
const BASE_URL = `http://127.0.0.1:${PORT}`;

fs.mkdirSync(SCREENSHOTS_DIR, { recursive: true });

async function run() {
  console.log(`Connecting to ${BASE_URL}...`);
  const browser = await chromium.launch({
    headless: true,
    channel: "chrome",
  });

  try {
    // -------------------------------------------------------------------------
    // 1. PUBLIC WEBSITE (Desktop)
    // -------------------------------------------------------------------------
    console.log("=== 1. Public Website Screenshots ===");
    const siteContext = await browser.newContext({
      viewport: { width: 1440, height: 900 },
      deviceScaleFactor: 1.5,
      locale: "fa-IR",
    });
    const sitePage = await siteContext.newPage();

    const publicPages = [
      { name: "01-homepage.png", path: "/" },
      { name: "02-universities.png", path: "/universities" },
      { name: "03-programs.png", path: "/programs" },
      { name: "04-countries.png", path: "/countries" },
      { name: "05-assessment.png", path: "/assessment" },
      { name: "06-booking.png", path: "/booking" },
      { name: "07-cost-calculator.png", path: "/tools/cost-calculator" },
    ];

    for (const item of publicPages) {
      console.log(`Capturing ${item.name} (${item.path})...`);
      try {
        await sitePage.goto(`${BASE_URL}${item.path}`, { waitUntil: "domcontentloaded", timeout: 35000 });
        await sitePage.waitForTimeout(2000);
        await sitePage.screenshot({ path: path.join(SCREENSHOTS_DIR, item.name), fullPage: false });
        console.log(`✓ Saved ${item.name}`);
      } catch (err) {
        console.error(`✗ Failed ${item.name}:`, err.message);
      }
    }

    // -------------------------------------------------------------------------
    // 2. STUDENT PANEL
    // -------------------------------------------------------------------------
    console.log("=== 2. Student Panel Screenshots ===");
    console.log("Navigating to student login...");
    try {
      await sitePage.goto(`${BASE_URL}/login`, { waitUntil: "domcontentloaded", timeout: 30000 });
      await sitePage.waitForTimeout(1000);
      await sitePage.screenshot({ path: path.join(SCREENSHOTS_DIR, "08-student-login.png") });
      console.log("✓ Saved 08-student-login.png");

      await sitePage.getByLabel("شماره موبایل", { exact: true }).fill("09120000000");
      await sitePage.getByRole("button", { name: "دریافت کد تأیید" }).click();
      await sitePage.waitForSelector("[data-otp-root]", { timeout: 15000 });
      const otpInputs = sitePage.locator("[data-otp-root] input");
      await otpInputs.first().pressSequentially("123456", { delay: 40 });
      await sitePage.waitForURL(/\/panel/, { timeout: 25000 });
      console.log("Student login successful!");
    } catch (e) {
      console.error("Student login failed:", e.message);
    }

    const studentPages = [
      { name: "09-student-dashboard.png", path: "/panel" },
      { name: "10-student-case.png", path: "/panel/case" },
      { name: "11-student-documents.png", path: "/panel/documents" },
      { name: "12-student-shortlist.png", path: "/panel/shortlist" },
      { name: "13-student-appointments.png", path: "/panel/appointments" },
      { name: "14-student-payments.png", path: "/panel/payments" },
      { name: "15-student-messages.png", path: "/panel/messages" },
    ];

    for (const item of studentPages) {
      console.log(`Capturing ${item.name} (${item.path})...`);
      try {
        await sitePage.goto(`${BASE_URL}${item.path}`, { waitUntil: "domcontentloaded", timeout: 30000 });
        await sitePage.waitForTimeout(2000);
        await sitePage.screenshot({ path: path.join(SCREENSHOTS_DIR, item.name), fullPage: false });
        console.log(`✓ Saved ${item.name}`);
      } catch (err) {
        console.error(`✗ Failed ${item.name}:`, err.message);
      }
    }

    await siteContext.close();

    // -------------------------------------------------------------------------
    // 3. STUDENT PANEL (Mobile Viewport)
    // -------------------------------------------------------------------------
    console.log("=== 3. Mobile Student Views ===");
    const mobileContext = await browser.newContext({
      viewport: { width: 390, height: 844 },
      isMobile: true,
      hasTouch: true,
      deviceScaleFactor: 2,
      locale: "fa-IR",
    });
    const mobilePage = await mobileContext.newPage();
    try {
      await mobilePage.goto(`${BASE_URL}/login`, { waitUntil: "domcontentloaded" });
      await mobilePage.getByLabel("شماره موبایل", { exact: true }).fill("09120000000");
      await mobilePage.getByRole("button", { name: "دریافت کد تأیید" }).click();
      await mobilePage.waitForSelector("[data-otp-root]", { timeout: 10000 });
      const mOtp = mobilePage.locator("[data-otp-root] input");
      await mOtp.first().pressSequentially("123456", { delay: 40 });
      await mobilePage.waitForURL(/\/panel/, { timeout: 25000 });
      await mobilePage.waitForTimeout(2000);
      await mobilePage.screenshot({ path: path.join(SCREENSHOTS_DIR, "27-mobile-student-dashboard.png") });
      console.log("✓ Saved 27-mobile-student-dashboard.png");

      await mobilePage.goto(`${BASE_URL}/panel/case`, { waitUntil: "domcontentloaded" });
      await mobilePage.waitForTimeout(1500);
      await mobilePage.screenshot({ path: path.join(SCREENSHOTS_DIR, "28-mobile-student-case.png") });
      console.log("✓ Saved 28-mobile-student-case.png");

      await mobilePage.goto(`${BASE_URL}/panel/documents`, { waitUntil: "domcontentloaded" });
      await mobilePage.waitForTimeout(1500);
      await mobilePage.screenshot({ path: path.join(SCREENSHOTS_DIR, "29-mobile-student-documents.png") });
      console.log("✓ Saved 29-mobile-student-documents.png");
    } catch (e) {
      console.error("Mobile capture error:", e.message);
    }
    await mobileContext.close();

    // -------------------------------------------------------------------------
    // 4. ADMIN & CRM PORTAL
    // -------------------------------------------------------------------------
    console.log("=== 4. Admin / Staff Portal Screenshots ===");
    const adminContext = await browser.newContext({
      viewport: { width: 1440, height: 900 },
      deviceScaleFactor: 1.5,
      locale: "fa-IR",
    });
    const adminPage = await adminContext.newPage();

    try {
      await adminPage.goto(`${BASE_URL}/staff/login`, { waitUntil: "domcontentloaded", timeout: 30000 });
      await adminPage.waitForTimeout(1000);
      await adminPage.screenshot({ path: path.join(SCREENSHOTS_DIR, "16-staff-login.png") });
      console.log("✓ Saved 16-staff-login.png");

      await adminPage.getByLabel("ایمیل", { exact: true }).fill("admin@apply.example");
      await adminPage.locator('input[name="password"]').fill("Admin@12345");
      await adminPage.getByRole("button", { name: /^ورود$/ }).click();
      await adminPage.waitForURL(/\/admin/, { timeout: 25000 });
      console.log("Admin login successful!");
    } catch (e) {
      console.error("Admin login failed:", e.message);
    }

    const adminPages = [
      { name: "17-admin-dashboard.png", path: "/admin" },
      { name: "18-admin-leads-kanban.png", path: "/admin/leads?view=kanban" },
      { name: "19-admin-leads-table.png", path: "/admin/leads" },
      { name: "20-admin-cases.png", path: "/admin/cases" },
      { name: "21-admin-tasks.png", path: "/admin/tasks" },
      { name: "22-admin-finance.png", path: "/admin/finance" },
      { name: "23-admin-tickets.png", path: "/admin/tickets" },
      { name: "24-admin-cms-universities.png", path: "/admin/content/universities" },
      { name: "25-admin-settings-crm.png", path: "/admin/settings/crm" },
    ];

    for (const item of adminPages) {
      console.log(`Capturing ${item.name} (${item.path})...`);
      try {
        await adminPage.goto(`${BASE_URL}${item.path}`, { waitUntil: "domcontentloaded", timeout: 30000 });
        await adminPage.waitForTimeout(2000);
        await adminPage.screenshot({ path: path.join(SCREENSHOTS_DIR, item.name), fullPage: false });
        console.log(`✓ Saved ${item.name}`);
      } catch (err) {
        console.error(`✗ Failed ${item.name}:`, err.message);
      }
    }

    // Try capturing a lead detail
    try {
      console.log("Navigating to first lead detail...");
      await adminPage.goto(`${BASE_URL}/admin/leads`, { waitUntil: "domcontentloaded" });
      await adminPage.waitForTimeout(1500);
      const leadLink = adminPage.locator('a[href*="/admin/leads/"]').first();
      if (await leadLink.isVisible()) {
        await leadLink.click();
        await adminPage.waitForURL(/\/admin\/leads\/.+/, { timeout: 15000 });
        await adminPage.waitForTimeout(2000);
        await adminPage.screenshot({ path: path.join(SCREENSHOTS_DIR, "26-admin-lead-detail.png") });
        console.log("✓ Saved 26-admin-lead-detail.png");
      }
    } catch (e) {
      console.error("Lead detail screenshot error:", e.message);
    }

    await adminContext.close();
    console.log("Finished capturing all requested screenshots!");
  } finally {
    await browser.close();
  }
}

run().catch((err) => {
  console.error("Script failed:", err);
  process.exit(1);
});
