import { setupWorker, type SetupWorker } from "msw/browser";
import { assertMockSafety } from "@/lib/mock-safety";
import { resetDb } from "./db";
import { createHandlers } from "./handlers";
import { SCENARIOS } from "./scenarios";

/**
 * Browser entry of the mock API. Loaded with a dynamic `import()` by
 * `MockProvider` only when `NEXT_PUBLIC_API_MOCKING=enabled`.
 *
 * Idempotent across React Strict Mode remounts and Turbopack HMR: module-level
 * bindings reset on hot reload, but `@mswjs/interceptors` keeps the global
 * `WebSocket` patch — a second `worker.start()` throws
 * "Failed to replace a global value at \"WebSocket\": already replaced."
 * Mirror `server.ts` and keep the start promise on `globalThis`.
 */

type MockDevTools = {
  /** Re-seed the in-memory db */
  resetDb: () => void;
  scenarios: readonly string[];
};

type GlobalWithMockWorker = typeof globalThis & {
  __applyMockWorkerStart?: Promise<void>;
  __applyMockWorker?: SetupWorker;
};

declare global {
  interface Window {
    __applyMock?: MockDevTools;
  }
}

export function startMockWorker(): Promise<void> {
  assertMockSafety();
  const holder = globalThis as GlobalWithMockWorker;
  holder.__applyMockWorkerStart ??= (async () => {
    try {
      const worker = setupWorker(...createHandlers());
      await worker.start({
        onUnhandledFrame: "bypass", // pages, assets, HMR… are not API calls
        serviceWorker: { url: "/mockServiceWorker.js" },
      });
      holder.__applyMockWorker = worker;
      window.__applyMock = {
        resetDb: () => {
          resetDb();
        },
        scenarios: SCENARIOS.map((scenario) => scenario.id),
      };
      console.info(
        "[mock] API mocking is enabled — requests to /api/v1 are served in-browser by MSW.",
      );
    } catch (error) {
      // Do not cache a failed start — allow a later remount/HMR to retry.
      // If the failure is the double-patch invariant, treat as already running
      // (a previous HMR instance applied the interceptor successfully).
      if (isAlreadyReplacedError(error)) {
        console.info(
          "[mock] MSW WebSocket interceptor already active — skipping duplicate worker.start().",
        );
        return;
      }
      holder.__applyMockWorkerStart = undefined;
      throw error;
    }
  })();
  return holder.__applyMockWorkerStart;
}

function isAlreadyReplacedError(error: unknown): boolean {
  return (
    error instanceof Error &&
    error.message.includes('already replaced')
  );
}
