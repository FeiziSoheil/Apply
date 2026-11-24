import { assertMockSafety } from "@/lib/mock-safety";

/**
 * Starts the MSW Node server when `NEXT_PUBLIC_API_MOCKING=enabled`.
 *
 * Only server-side `fetch` calls with an absolute `NEXT_PUBLIC_API_URL` are
 * intercepted; public site content keeps using `src/services/*` (see
 * docs/mocking.md). The dynamic import keeps msw out of non-mocking builds.
 */
export async function register(): Promise<void> {
  // Second line of defence after next.config.ts: refuse to serve in production
  // with the mock API (or relaxed mock auth) enabled — in every runtime.
  assertMockSafety();

  if (
    process.env.NEXT_RUNTIME === "nodejs" &&
    process.env.NEXT_PUBLIC_API_MOCKING === "enabled"
  ) {
    const { startMockServer } = await import("./mocks/server");
    startMockServer();
  }
}
