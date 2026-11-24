import type { Role } from "@/contracts/auth";

/**
 * `mock_session` — a NON-httpOnly cookie that exists only while the mock API
 * is enabled (`NEXT_PUBLIC_API_MOCKING=enabled`, never in production).
 *
 * The real session is an httpOnly `session` cookie set by the backend. With
 * MSW nobody can set it (browsers drop `Set-Cookie` from service-worker
 * responses), so the API client writes this cookie after a successful login
 * to give `src/proxy.ts` the same signal in both modes. It is a UI-routing
 * hint only; the mock API authorizes with the in-memory Bearer token.
 */

export const MOCK_SESSION_COOKIE_NAME = "mock_session";

/** Lifetime of the cookie — same as the mock access token */
export const MOCK_SESSION_MAX_AGE_SECONDS = 3_600;

export type MockSession = { role: Role };

// `Record<Role, …>` keeps this list exhaustive when roles change
const ROLE_LOOKUP: Record<Role, true> = {
  admin: true,
  consultant: true,
  student: true,
};

export function isRole(value: unknown): value is Role {
  return typeof value === "string" && Object.hasOwn(ROLE_LOOKUP, value);
}

/** Cookie value: URL-encoded JSON, e.g. `%7B%22role%22%3A%22admin%22%7D` */
export function serializeMockSession(session: MockSession): string {
  return encodeURIComponent(JSON.stringify(session));
}

/** Tolerant parser — anything malformed is "no session" */
export function parseMockSession(raw: string | null | undefined): MockSession | null {
  if (!raw) return null;
  try {
    const value: unknown = JSON.parse(decodeURIComponent(raw));
    if (typeof value !== "object" || value === null) return null;
    const role = (value as { role?: unknown }).role;
    return isRole(role) ? { role } : null;
  } catch {
    return null;
  }
}

/** `document.cookie` string that stores the session */
export function buildMockSessionCookie(session: MockSession): string {
  return `${MOCK_SESSION_COOKIE_NAME}=${serializeMockSession(session)}; Path=/; Max-Age=${MOCK_SESSION_MAX_AGE_SECONDS}; SameSite=Lax`;
}

/** `document.cookie` string that deletes the session */
export function buildClearedMockSessionCookie(): string {
  return `${MOCK_SESSION_COOKIE_NAME}=; Path=/; Max-Age=0; SameSite=Lax`;
}
