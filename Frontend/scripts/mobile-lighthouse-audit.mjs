import { chromium } from "@playwright/test";
import lighthouse from "/home/soheil/.npm/_npx/0f94ee7615faf582/node_modules/lighthouse/core/index.js";

const STUDENT_MOBILE = "09120000000";
const STUDENT_OTP = "123456";

async function main() {
  const port = 9222;
  const browser = await chromium.launch({
    executablePath: "/usr/bin/google-chrome",
    headless: true,
    args: [`--remote-debugging-port=${port}`],
  });

  const context = await browser.newContext({
    viewport: { width: 390, height: 844 },
    userAgent:
      "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1",
  });

  const page = await context.newPage();

  // Disable onboarding tour and PWA prompts
  await page.addInitScript(() => {
    localStorage.setItem("apply_onboarding_completed", "true");
    localStorage.setItem("apply_pwa_dismissed", "never");
  });

  console.log("Logging in as student...");
  await page.goto("http://127.0.0.1:3000/login");
  await page.getByLabel("شماره موبایل", { exact: true }).fill(STUDENT_MOBILE);
  await page.getByRole("button", { name: "دریافت کد تأیید" }).click();
  await page.waitForSelector("[data-otp-root] input");
  await page.locator("[data-otp-root] input").first().pressSequentially(STUDENT_OTP, { delay: 30 });
  await page.waitForURL(/\/panel/, { timeout: 20000 });
  console.log("Student logged in successfully!");

  // Extract auth tokens to inject into any new page created by Lighthouse
  const mockTokens = await page.evaluate(() => {
    return sessionStorage.getItem("apply:mock-tokens");
  });

  if (mockTokens) {
    await context.addInitScript(({ tokens }) => {
      sessionStorage.setItem("apply:mock-tokens", tokens);
      localStorage.setItem("apply_onboarding_completed", "true");
      localStorage.setItem("apply_pwa_dismissed", "never");
    }, { tokens: mockTokens });
  }

  const routes = [
    { name: "/panel", url: "http://127.0.0.1:3000/panel", readySelector: "text=قدم بعدی شما" },
    { name: "/panel/documents", url: "http://127.0.0.1:3000/panel/documents", readySelector: "text=مدارک" },
    { name: "/panel/case", url: "http://127.0.0.1:3000/panel/case", readySelector: "text=پرونده من" },
    { name: "/panel/messages", url: "http://127.0.0.1:3000/panel/messages", readySelector: "text=پیام‌ها" },
    { name: "/panel/payments", url: "http://127.0.0.1:3000/panel/payments", readySelector: "text=پرداخت" },
  ];

  const results = [];

  for (const route of routes) {
    console.log(`\n--- Measuring ${route.name} ---`);
    let totalJsBytes = 0;
    const jsFiles = [];
    let pdfLibLoaded = false;

    const responseHandler = async (res) => {
      const url = res.url();
      const contentType = res.headers()["content-type"] || "";
      if (url.includes(".js") || contentType.includes("javascript")) {
        try {
          const body = await res.body();
          const size = body.length;
          totalJsBytes += size;
          const urlClean = url.split("?")[0].split("/").pop();
          jsFiles.push({ file: urlClean, size });
          if (url.includes("pdf-lib") || body.toString().includes("PDFDocument.create")) {
            pdfLibLoaded = true;
          }
        } catch {
          // stream or cached
        }
      }
    };

    page.on("response", responseHandler);

    await page.goto(route.url, { waitUntil: "networkidle" });
    await page.locator("main").locator("visible=true").first().waitFor({ state: "visible", timeout: 15000 });

    page.off("response", responseHandler);

    console.log(`Route: ${route.name}`);
    console.log(`Initial Transferred JS: ${(totalJsBytes / 1024).toFixed(1)} KB across ${jsFiles.length} files`);
    console.log(`pdf-lib loaded upfront: ${pdfLibLoaded ? "YES (FAIL)" : "NO (LAZY-LOADED - PASS)"}`);

    // If it's /panel or /panel/documents, run lighthouse
    if (route.name === "/panel" || route.name === "/panel/documents") {
      console.log(`Running Lighthouse mobile audit on ${route.url}...`);
      try {
        const lhResult = await lighthouse(route.url, {
          port,
          output: "json",
          onlyCategories: ["performance", "accessibility"],
          formFactor: "mobile",
          screenEmulation: {
            mobile: true,
            width: 390,
            height: 844,
            deviceScaleFactor: 3,
            disabled: false,
          },
          throttlingMethod: "provided", // Don't artificially throttle local dev server
        });

        const perfScore = Math.round((lhResult.lhr.categories.performance?.score || 0) * 100);
        const a11yScore = Math.round((lhResult.lhr.categories.accessibility?.score || 0) * 100);

        console.log(`Lighthouse Performance: ${perfScore}`);
        console.log(`Lighthouse Accessibility: ${a11yScore}`);

        results.push({
          route: route.name,
          jsKb: (totalJsBytes / 1024).toFixed(1),
          pdfLibLoaded,
          perfScore,
          a11yScore,
        });
      } catch (err) {
        console.error("Lighthouse error:", err.message);
        results.push({
          route: route.name,
          jsKb: (totalJsBytes / 1024).toFixed(1),
          pdfLibLoaded,
          error: err.message,
        });
      }
    } else {
      results.push({
        route: route.name,
        jsKb: (totalJsBytes / 1024).toFixed(1),
        pdfLibLoaded,
      });
    }
  }

  console.log("\n================ SUMMARY ================");
  console.table(results);

  await browser.close();
}

main().catch((err) => {
  console.error("Fatal:", err);
  process.exit(1);
});
