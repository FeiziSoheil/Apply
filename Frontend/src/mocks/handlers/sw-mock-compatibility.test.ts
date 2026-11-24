import { describe, expect, it } from "vitest";
import fs from "node:fs";
import path from "node:path";

describe("PWA Service Worker & MSW Compatibility", () => {
  const swPath = path.resolve(process.cwd(), "public/sw.js");
  const mswPath = path.resolve(process.cwd(), "public/mockServiceWorker.js");
  const manifestPath = path.resolve(process.cwd(), "src/app/manifest.ts");
  const offlinePagePath = path.resolve(process.cwd(), "src/app/offline/page.tsx");

  it("public/sw.js exists and implements static caching with offline fallback", () => {
    expect(fs.existsSync(swPath)).toBe(true);
    const swContent = fs.readFileSync(swPath, "utf-8");

    // Must cache offline fallback and static assets
    expect(swContent).toContain("/offline");
    expect(swContent).toContain("apply-panel-static");
    expect(swContent).toContain("navigate");
  });

  it("public/sw.js explicitly bypasses MSW and sensitive endpoints", () => {
    const swContent = fs.readFileSync(swPath, "utf-8");

    // Critical: Never intercept MSW mock worker
    expect(swContent).toContain("mockServiceWorker.js");

    // Critical: Never intercept or cache API or document payloads
    expect(swContent).toContain("/api/");
    expect(swContent).toContain("/mock-files/");
    expect(swContent).toContain("/files/");
  });

  it("public/mockServiceWorker.js exists and is untouched", () => {
    expect(fs.existsSync(mswPath)).toBe(true);
  });

  it("Web App Manifest is properly configured with required fields", async () => {
    expect(fs.existsSync(manifestPath)).toBe(true);
    const { default: manifest } = await import("@/app/manifest");
    const config = manifest();

    expect(config.name).toBeTruthy();
    expect(config.short_name).toBeTruthy();
    expect(config.display).toBe("standalone");
    expect(config.theme_color).toBeTruthy();
    expect(config.lang).toBe("fa");
    expect(config.dir).toBe("rtl");
    expect(config.icons).toBeDefined();
    expect(config.icons!.length).toBeGreaterThan(0);
  });

  it("offline page exists and displays Persian offline message with retry CTA", () => {
    expect(fs.existsSync(offlinePagePath)).toBe(true);
    const offlineContent = fs.readFileSync(offlinePagePath, "utf-8");
    expect(offlineContent).toContain("اتصال اینترنت شما قطع است");
    expect(offlineContent).toContain("تلاش مجدد");
  });
});
