import type { NextConfig } from "next";
import bundleAnalyzer from "@next/bundle-analyzer";

import { assertMockSafety } from "./src/lib/mock-safety";

// Fails `next build` / `next start` with a clear error when the mock API (or
// relaxed mock auth) is enabled together with NODE_ENV=production. The mock API
// is only allowed in production with the explicit NEXT_PUBLIC_DEMO_BUILD=enabled
// flag; relaxed mock auth is never allowed (see src/lib/mock-safety.ts).
assertMockSafety();

/**
 * Optional same-origin proxy of the REST API (docs/deployment-notes.md).
 * Only active when `API_PROXY_TARGET` (server-side, e.g. `https://api.example.com`)
 * is set; the target has no trailing slash and no `/api/v1` suffix.
 */
const apiProxyTarget = process.env.API_PROXY_TARGET?.trim().replace(/\/+$/, "");

const withBundleAnalyzer = bundleAnalyzer({
  enabled: process.env.ANALYZE === "true",
});

const nextConfig: NextConfig = {
  /* config options here */
  cacheComponents: true,
  // Playwright and some tooling hit 127.0.0.1 while `next dev` binds localhost;
  // without this, /_next/hmr (and related) are blocked and the page stays blank.
  allowedDevOrigins: ["127.0.0.1", "localhost"],
  // Inlined at build time so the mock code is dead-code-eliminated in production
  // builds (see docs/mocking.md). Anything but "enabled" means mocking is off.
  env: {
    NEXT_PUBLIC_API_MOCKING:
      process.env.NEXT_PUBLIC_API_MOCKING === "enabled" ? "enabled" : "disabled",
    // Production build with the mock API (public preview). Anything but "enabled" is off.
    NEXT_PUBLIC_DEMO_BUILD:
      process.env.NEXT_PUBLIC_DEMO_BUILD === "enabled" ? "enabled" : "disabled",
  },
  async rewrites() {
    if (!apiProxyTarget) return [];
    return [
      {
        source: "/api/v1/:path*",
        destination: `${apiProxyTarget}/api/v1/:path*`,
      },
    ];
  },
  partialPrefetching: true,
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default withBundleAnalyzer(nextConfig);
