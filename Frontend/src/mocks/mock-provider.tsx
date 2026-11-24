"use client";

import { useEffect, useSyncExternalStore, type ReactNode } from "react";

/**
 * Client-side gate of the mock API (see `docs/mocking.md`).
 *
 * This file is deliberately tiny and free of mock imports: the worker, db and
 * handlers are loaded through a dynamic `import()` inside a branch on the
 * build-time constant `process.env.NEXT_PUBLIC_API_MOCKING`. With mocking
 * disabled the bundler removes the branch, so no mock code ships to users.
 *
 * Start state lives on `globalThis` so Turbopack HMR can re-evaluate this
 * module without resetting the ready gate or kicking off a second
 * `worker.start()` (see `browser.ts`).
 */

type GlobalWithMockClient = typeof globalThis & {
  __applyMockClientStarted?: boolean;
  __applyMockClientStart?: Promise<void>;
};

const listeners = new Set<() => void>();

function getHolder(): GlobalWithMockClient {
  return globalThis as GlobalWithMockClient;
}

function markStarted(): void {
  getHolder().__applyMockClientStarted = true;
  for (const listener of listeners) listener();
}

function startMocks(): Promise<void> {
  const holder = getHolder();
  if (holder.__applyMockClientStart) return holder.__applyMockClientStart;
  if (
    typeof window !== "undefined" &&
    process.env.NEXT_PUBLIC_API_MOCKING === "enabled"
  ) {
    holder.__applyMockClientStart = import("./browser")
      .then((module) => module.startMockWorker())
      .catch((error: unknown) => {
        // Never block the UI because the worker failed (e.g. unsupported browser)
        console.error("[mock] Failed to start the MSW worker:", error);
        // Allow a later remount to retry a transient failure
        holder.__applyMockClientStart = undefined;
      })
      .finally(markStarted);
    return holder.__applyMockClientStart;
  }
  return Promise.resolve();
}

function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

const MOCKING_ENABLED = process.env.NEXT_PUBLIC_API_MOCKING === "enabled";

/**
 * Children render only after the worker is running, so the very first API
 * request of an island is never sent to the (non-existent) real backend.
 * With mocking disabled it is a pass-through.
 */
export function MockProvider({ children }: { children: ReactNode }) {
  const ready = useSyncExternalStore(
    subscribe,
    () => !MOCKING_ENABLED || Boolean(getHolder().__applyMockClientStarted),
    () => !MOCKING_ENABLED,
  );

  useEffect(() => {
    void startMocks();
  }, []);

  return ready ? <>{children}</> : null;
}
