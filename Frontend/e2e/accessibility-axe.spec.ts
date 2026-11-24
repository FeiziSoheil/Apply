import { expect, test, type Page } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import { DEMO_ACCOUNTS } from "../src/mocks/config";

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

test.describe("Student Panel Accessibility (axe-core)", () => {
  test.beforeEach(async ({ page }) => {
    // Disable onboarding tour modal during a11y page checks so page content is accessible
    await page.addInitScript(() => {
      localStorage.setItem("apply_onboarding_completed", "true");
      localStorage.setItem("apply_pwa_dismissed", "never");
    });
    await studentOtpLogin(page);
  });

  const routes = [
    { name: "Overview /panel", path: "/panel", readyText: "قدم بعدی شما" },
    { name: "Case /panel/case", path: "/panel/case", readyText: "پرونده من" },
    { name: "Documents /panel/documents", path: "/panel/documents", readyText: "مدارک" },
    { name: "Messages /panel/messages", path: "/panel/messages", readyText: "پیام‌ها" },
    { name: "Payments /panel/payments", path: "/panel/payments", readyText: "پرداخت" },
    { name: "Appointments /panel/appointments", path: "/panel/appointments", readyText: "جلسات" },
    { name: "Shortlist /panel/shortlist", path: "/panel/shortlist", readyText: "علاقه‌مندی" },
    { name: "Profile /panel/profile", path: "/panel/profile", readyText: "پروفایل" },
  ];

  for (const route of routes) {
    test(`axe audit on ${route.name} has no serious or critical violations`, async ({ page }) => {
      await page.goto(route.path);
      await expect(page.getByText(route.readyText).first()).toBeVisible({ timeout: 15_000 });

      const accessibilityScanResults = await new AxeBuilder({ page })
        .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"])
        .analyze();

      const seriousOrCritical = accessibilityScanResults.violations.filter(
        (v) => v.impact === "serious" || v.impact === "critical",
      );

      if (seriousOrCritical.length > 0) {
        console.error(
          `Accessibility violations on ${route.path}:`,
          JSON.stringify(
            seriousOrCritical.map((v) => ({
              id: v.id,
              impact: v.impact,
              description: v.description,
              nodes: v.nodes.map((n) => ({
                html: n.html,
                target: n.target,
                failureSummary: n.failureSummary,
              })),
            })),
            null,
            2,
          ),
        );
      }

      expect(seriousOrCritical).toEqual([]);
    });
  }
});
