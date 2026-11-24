import type { Session } from "@/contracts/auth";
import type { Role } from "@/contracts/auth";
import {
  ACCESS_TOKEN_TTL_SECONDS,
  DEMO_ACCOUNTS,
  SESSION_COOKIE,
  isAuthRelaxed,
} from "./config";
import {
  MOCK_ACCESS_TOKEN_HEADER,
  MOCK_REFRESH_TOKEN_HEADER,
  MOCK_ROLE_HEADER,
} from "@/lib/api/session-adapter";
import { isMockTokenStorageAllowed } from "@/lib/mock-safety";
import { getDb } from "./db";
import { toCurrentUser } from "./domain/users";
import type { MockUser } from "./types";
import { newId } from "./utils";

/**
 * In-memory auth state (tokens, OTPs, rate limits). Lives on `globalThis`
 * so HMR does not drop sessions; a page refresh / server restart resets it.
 */
export type OtpRecord = {
  code: string;
  expiresAt: number;
  /** Wrong codes entered so far (the OTP dies at `OTP_MAX_VERIFY_ATTEMPTS`) */
  attempts: number;
};

/** Active browser/session row surfaced by `GET /me/sessions` */
export type MockSessionRecord = {
  id: string;
  userId: string;
  accessToken: string;
  createdAt: string;
  lastSeenAt: string;
  ipAddress: string;
  userAgent: string;
};

type AuthState = {
  access: Map<string, string>;
  refresh: Map<string, string>;
  /** Keyed by access token */
  sessions: Map<string, MockSessionRecord>;
  otps: Map<string, OtpRecord>;
  otpRequests: Map<string, number[]>;
};

type GlobalWithAuth = typeof globalThis & { __applyMockAuth?: AuthState };

/**
 * sessionStorage mirror of the token → user maps (browser, development / demo
 * build only — see `isMockTokenStorageAllowed`). The in-browser MSW worker
 * lives in the page, so without it a refresh would forget every token and the
 * Bearer token restored by the session adapter would be rejected with 401.
 */
const AUTH_STORAGE_KEY = "apply:mock-auth";

type StoredAuth = {
  access: [string, string][];
  refresh: [string, string][];
};

function authStorage(): Storage | null {
  if (typeof window === "undefined" || !isMockTokenStorageAllowed()) return null;
  try {
    return window.sessionStorage;
  } catch {
    return null;
  }
}

function restoreTokens(auth: AuthState): void {
  const storage = authStorage();
  if (!storage) return;
  try {
    const raw = storage.getItem(AUTH_STORAGE_KEY);
    if (!raw) return;
    const stored = JSON.parse(raw) as Partial<StoredAuth>;
    for (const [token, userId] of stored.access ?? []) auth.access.set(token, userId);
    for (const [token, userId] of stored.refresh ?? []) auth.refresh.set(token, userId);
  } catch {
    // Corrupt snapshot: start without sessions
  }
}

function persistTokens(): void {
  const storage = authStorage();
  if (!storage) return;
  const { access, refresh } = state();
  const payload: StoredAuth = {
    access: [...access.entries()],
    refresh: [...refresh.entries()],
  };
  try {
    storage.setItem(AUTH_STORAGE_KEY, JSON.stringify(payload));
  } catch (error) {
    console.warn("[mock] could not persist the mock auth tokens", error);
  }
}

function state(): AuthState {
  const holder = globalThis as GlobalWithAuth;
  if (!holder.__applyMockAuth) {
    holder.__applyMockAuth = {
      access: new Map(),
      refresh: new Map(),
      sessions: new Map(),
      otps: new Map(),
      otpRequests: new Map(),
    };
    restoreTokens(holder.__applyMockAuth);
  }
  // HMR / older snapshots may lack the sessions map
  holder.__applyMockAuth.sessions ??= new Map();
  return holder.__applyMockAuth;
}

export function otpStore(): Pick<AuthState, "otps" | "otpRequests"> {
  const { otps, otpRequests } = state();
  return { otps, otpRequests };
}

/** Tokens of a freshly created session — they never appear in the JSON body */
export type IssuedSession = {
  /** Public contract body (`Session`) */
  session: Session;
  accessToken: string;
  refreshToken: string;
  role: Role;
};

export function issueSession(
  user: MockUser,
  options?: {
    isNewUser?: boolean;
    ipAddress?: string;
    userAgent?: string;
  },
): IssuedSession {
  const auth = state();
  const accessToken = `mock_at_${newId()}`;
  const refreshToken = `mock_rt_${newId()}`;
  const now = new Date().toISOString();
  auth.access.set(accessToken, user.id);
  auth.refresh.set(refreshToken, user.id);
  auth.sessions.set(accessToken, {
    id: newId(),
    userId: user.id,
    accessToken,
    createdAt: now,
    lastSeenAt: now,
    ipAddress: options?.ipAddress ?? "127.0.0.1",
    userAgent: options?.userAgent ?? "Apply Mock Client",
  });
  persistTokens();
  return {
    session: {
      expiresIn: ACCESS_TOKEN_TTL_SECONDS,
      ...(options?.isNewUser === undefined ? {} : { isNewUser: options.isNewUser }),
      user: toCurrentUser(user),
    },
    accessToken,
    refreshToken,
    role: user.role,
  };
}

/** Sessions of a user for `GET /me/sessions` (newest first) */
export function listSessionsForUser(
  userId: string,
  currentAccessToken: string | null,
): Array<MockSessionRecord & { current: boolean }> {
  const rows = [...state().sessions.values()]
    .filter((session) => session.userId === userId)
    .sort((a, b) => b.lastSeenAt.localeCompare(a.lastSeenAt));
  return rows.map((session) => ({
    ...session,
    current: Boolean(currentAccessToken && session.accessToken === currentAccessToken),
  }));
}

/** Touch lastSeenAt when an authenticated request resolves */
export function touchSession(accessToken: string | null): void {
  if (!accessToken) return;
  const session = state().sessions.get(accessToken);
  if (session) session.lastSeenAt = new Date().toISOString();
}

/**
 * Response headers of a login. The contract session is an httpOnly cookie;
 * the mock additionally exposes the tokens as `x-mock-*` headers because the
 * browser cannot store a `Set-Cookie` coming from the service worker. The API
 * client's mock session adapter reads them (see `lib/api/session-adapter.ts`).
 */
export function sessionHeaders(issued: IssuedSession): Record<string, string> {
  return {
    "set-cookie": sessionCookie(issued.accessToken),
    [MOCK_ACCESS_TOKEN_HEADER]: issued.accessToken,
    [MOCK_REFRESH_TOKEN_HEADER]: issued.refreshToken,
    [MOCK_ROLE_HEADER]: issued.role,
    "access-control-expose-headers": [
      MOCK_ACCESS_TOKEN_HEADER,
      MOCK_REFRESH_TOKEN_HEADER,
      MOCK_ROLE_HEADER,
    ].join(", "),
  };
}

/** Rotate: the old refresh token is consumed. `null` when unknown/expired. */
export function rotateRefreshToken(token: string | null): MockUser | null {
  if (!token) return null;
  const auth = state();
  const userId = auth.refresh.get(token);
  if (!userId) return null;
  auth.refresh.delete(token);
  persistTokens();
  return getDb().users.get(userId) ?? null;
}

export function revokeRefreshToken(token: string | null): void {
  if (token) {
    state().refresh.delete(token);
    persistTokens();
  }
}

export function revokeAccessToken(token: string | null): void {
  if (token) {
    const auth = state();
    auth.access.delete(token);
    auth.sessions.delete(token);
    persistTokens();
  }
}

export function revokeSessionById(userId: string, sessionId: string): void {
  const auth = state();
  for (const [token, session] of auth.sessions.entries()) {
    if (session.id === sessionId && session.userId === userId) {
      auth.sessions.delete(token);
      auth.access.delete(token);
    }
  }
  persistTokens();
}

export function revokeOtherSessionsForUser(
  userId: string,
  currentAccessToken: string | null,
): void {
  const auth = state();
  for (const [token, session] of auth.sessions.entries()) {
    if (session.userId === userId && token !== currentAccessToken) {
      auth.sessions.delete(token);
      auth.access.delete(token);
    }
  }
  persistTokens();
}

function parseCookie(header: string | null, name: string): string | null {
  if (!header) return null;
  for (const part of header.split(";")) {
    const [key, ...rest] = part.trim().split("=");
    if (key === name) return decodeURIComponent(rest.join("="));
  }
  return null;
}

/** Access token from `Authorization: Bearer …` or the session cookie */
export function readAccessToken(request: Request): string | null {
  const authorization = request.headers.get("authorization");
  if (authorization?.toLowerCase().startsWith("bearer ")) {
    return authorization.slice(7).trim() || null;
  }
  return parseCookie(request.headers.get("cookie"), SESSION_COOKIE);
}

export function sessionCookie(token: string): string {
  return `${SESSION_COOKIE}=${encodeURIComponent(token)}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${ACCESS_TOKEN_TTL_SECONDS}`;
}

export function clearedSessionCookie(): string {
  return `${SESSION_COOKIE}=; Path=/; HttpOnly; Max-Age=0; SameSite=Lax`;
}

/** Refresh token the mock session adapter sends on `POST /auth/refresh` */
export function readRefreshToken(request: Request): string | null {
  return request.headers.get(MOCK_REFRESH_TOKEN_HEADER)?.trim() || null;
}

/** Demo account used for `relaxed` auth: first allowed role wins */
function demoUserFor(roles: readonly Role[]): MockUser | null {
  const db = getDb();
  if (roles.includes("admin")) {
    return db.users.find((user) => user.email === DEMO_ACCOUNTS.admin.email) ?? null;
  }
  if (roles.includes("consultant")) {
    return db.users.find((user) => user.email === DEMO_ACCOUNTS.consultant.email) ?? null;
  }
  return db.users.find((user) => user.mobile === DEMO_ACCOUNTS.student.mobile) ?? null;
}

/**
 * Authenticated user of a request. Without a token: `null` (strict mode) or
 * the demo user of the first allowed role (relaxed mode). Pass `null` as
 * `allowedRoles` for public endpoints — they never get a fallback user.
 */
export function resolveUser(
  request: Request,
  allowedRoles: readonly Role[] | null,
): MockUser | null {
  const token = readAccessToken(request);
  if (token) {
    const userId = state().access.get(token);
    return userId ? (getDb().users.get(userId) ?? null) : null;
  }
  return allowedRoles && isAuthRelaxed() ? demoUserFor(allowedRoles) : null;
}
