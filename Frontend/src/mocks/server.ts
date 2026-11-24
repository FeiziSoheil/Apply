import { setupServer, type SetupServer } from "msw/node";
import { assertMockSafety } from "@/lib/mock-safety";
import { createHandlers } from "./handlers";

/**
 * Node entry of the mock API (used by `instrumentation.ts` and scripts).
 * Idempotent: Next may call `register()` more than once in dev.
 */

type GlobalWithServer = typeof globalThis & {
  __applyMockServer?: SetupServer;
};

export function startMockServer(): SetupServer {
  assertMockSafety();
  const holder = globalThis as GlobalWithServer;
  if (!holder.__applyMockServer) {
    const server = setupServer(...createHandlers());
    server.listen({ onUnhandledFrame: "bypass" });
    holder.__applyMockServer = server;
    console.info("[mock] API mocking is enabled on the server (msw/node).");
  }
  return holder.__applyMockServer;
}

export function stopMockServer(): void {
  const holder = globalThis as GlobalWithServer;
  holder.__applyMockServer?.close();
  holder.__applyMockServer = undefined;
}
