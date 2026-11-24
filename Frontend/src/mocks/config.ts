/**
 * Runtime configuration of the mock API. Everything is derived from env vars
 * documented in `.env.example` / `docs/mocking.md`.
 */

import { SESSION_COOKIE_NAME } from "@/contracts/session";

export const DEFAULT_API_PREFIX = "/api/v1";

/** Path prefix that every handler is mounted under (origin-agnostic) */
export function getApiPrefix(): string {
  const raw = process.env.NEXT_PUBLIC_API_URL?.trim() || DEFAULT_API_PREFIX;
  let path = raw;
  if (/^https?:\/\//i.test(raw)) {
    try {
      path = new URL(raw).pathname;
    } catch {
      path = DEFAULT_API_PREFIX;
    }
  }
  const normalized = path.replace(/\/+$/, "");
  return normalized.startsWith("/") ? normalized : `/${normalized}`;
}

/** `NEXT_PUBLIC_API_MOCK_DELAY=off` disables the simulated latency (tests, scripts) */
export function isLatencyEnabled(): boolean {
  return process.env.NEXT_PUBLIC_API_MOCK_DELAY !== "off";
}

export const LATENCY_RANGE_MS = { min: 200, max: 600 } as const;
/** Delay used by the `slow` scenario — long enough to trigger loading states */
export const SLOW_SCENARIO_DELAY_MS = 8_000;

/**
 * Keeps the in-memory db in localStorage. `NEXT_PUBLIC_API_MOCK_PERSIST=enabled`
 * turns it on everywhere; in development (`NODE_ENV=development`) it is ON by
 * default unless explicitly set to `disabled`. Otherwise it is off.
 */
export function isPersistenceEnabled(): boolean {
  const setting = process.env.NEXT_PUBLIC_API_MOCK_PERSIST;
  if (setting === "enabled") return true;
  if (setting === "disabled") return false;
  return process.env.NODE_ENV === "development";
}

/**
 * Auth strictness. `strict` (default): protected endpoints answer 401 without
 * a token. `relaxed`: a missing token is treated as the demo user of the first
 * role the endpoint allows — handy while the panels have no login UI yet.
 */
export function isAuthRelaxed(): boolean {
  // Defense in depth: `relaxed` is development-only. The build / server start
  // is already rejected by `assertMockSafety`; this keeps it a no-op anyway.
  if (process.env.NODE_ENV === "production") return false;
  return process.env.NEXT_PUBLIC_API_MOCK_AUTH === "relaxed";
}

export const PERSIST_STORAGE_KEY = "apply:mock-db";
/** Bump when the seed shape changes so stale snapshots are discarded */
export const DB_SCHEMA_VERSION = 8;

/** Demo accounts, documented in `docs/mocking.md` */
export const DEMO_ACCOUNTS = {
  admin: { email: "admin@apply.example", password: "Admin@12345" },
  consultant: { email: "consultant1@apply.example", password: "Consultant@12345" },
  student: { name: "کتایون مشا", mobile: "09120000000", otp: "123456" },
} as const;

// OTP limits come from the contract (src/contracts/session.ts)
export {
  OTP_EXPIRES_IN_SECONDS,
  OTP_MAX_REQUESTS_PER_HOUR,
  OTP_MAX_VERIFY_ATTEMPTS,
  OTP_RESEND_AFTER_SECONDS,
} from "@/contracts/session";
export const ACCESS_TOKEN_TTL_SECONDS = 3_600;

/**
 * Cookie name of the contract. MSW responses cannot set cookies in the browser
 * (so the client uses a Bearer token + `mock_session`), but the header is
 * still emitted exactly like the real backend would for server-side callers.
 */
export const SESSION_COOKIE = SESSION_COOKIE_NAME;

/** Origin used to build absolute file / gateway URLs */
export function getMockOrigin(): string {
  if (typeof window !== "undefined") return window.location.origin;
  return (process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000").replace(
    /\/+$/,
    "",
  );
}
