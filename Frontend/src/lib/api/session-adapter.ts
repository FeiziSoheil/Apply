import { isMockRuntimeAllowed, isMockTokenStorageAllowed } from "@/lib/mock-safety";
import {
  buildClearedMockSessionCookie,
  buildMockSessionCookie,
  isRole,
} from "@/lib/auth/mock-session-cookie";

/**
 * Session transport of the API client, behind a swappable adapter.
 *
 * - `cookieSessionAdapter` (real mode, default): the session is the httpOnly
 *   `session` cookie, sent through `credentials: "include"`. The client holds
 *   no credential and NEVER sends an `Authorization` header.
 * - `createMockSessionAdapter` (`NEXT_PUBLIC_API_MOCKING=enabled`, development
 *   or an explicit `NEXT_PUBLIC_DEMO_BUILD=enabled` build only): the mock API
 *   cannot set an httpOnly cookie, so it hands out Bearer tokens in `x-mock-*`
 *   response headers. The adapter keeps them in memory and sends
 *   `Authorization: Bearer …`. When `NODE_ENV=development` (or a demo build)
 *   it also mirrors them into **sessionStorage** (never localStorage) and
 *   restores them on page load, so a refresh does not log the developer out.
 *   It also mirrors the login in a non-httpOnly `mock_session` cookie so
 *   `src/proxy.ts` can protect routes the same way as in real mode. In real
 *   mode no token is ever kept in JS or storage.
 *
 * Bearer is an internal detail of the mock; it is not part of the public
 * contract (see `docs/openapi.yaml`, `docs/mocking.md`).
 */

export type SessionAdapter = {
  readonly kind: "cookie" | "mock-bearer";
  /** Extra headers for a request to `path` (relative to the API base URL) */
  getRequestHeaders(path: string): Record<string, string>;
  /** Called with every successful response (captures mock tokens) */
  onResponse(response: Response): void;
  /** Mock only: the in-memory access token (always `null` in real mode) */
  getAccessToken(): string | null;
  /** Mock only: set the in-memory access token (no-op in real mode) */
  setAccessToken(token: string | null): void;
  /** Drop all client-held auth state (logout, 401) */
  clear(): void;
};

/** Response headers the mock API uses to hand out its session */
export const MOCK_ACCESS_TOKEN_HEADER = "x-mock-access-token";
export const MOCK_REFRESH_TOKEN_HEADER = "x-mock-refresh-token";
export const MOCK_ROLE_HEADER = "x-mock-user-role";

const REFRESH_PATH = "/auth/refresh";

/** Real mode: cookie only, nothing to add to requests */
export const cookieSessionAdapter: SessionAdapter = {
  kind: "cookie",
  getRequestHeaders: () => ({}),
  onResponse: () => undefined,
  getAccessToken: () => null,
  setAccessToken: () => undefined,
  clear: () => undefined,
};

/** sessionStorage key of the mock tokens (dev / demo build only) */
export const MOCK_TOKENS_STORAGE_KEY = "apply:mock-tokens";

type StoredTokens = { accessToken: string; refreshToken: string | null };

function getSessionStorage(): Storage | null {
  if (typeof window === "undefined") return null;
  try {
    return window.sessionStorage;
  } catch {
    return null;
  }
}

function readStoredTokens(storage: Storage): StoredTokens | null {
  try {
    const raw = storage.getItem(MOCK_TOKENS_STORAGE_KEY);
    if (!raw) return null;
    const parsed: unknown = JSON.parse(raw);
    if (typeof parsed !== "object" || parsed === null) return null;
    const { accessToken, refreshToken } = parsed as Partial<StoredTokens>;
    if (typeof accessToken !== "string" || accessToken === "") return null;
    return {
      accessToken,
      refreshToken: typeof refreshToken === "string" ? refreshToken : null,
    };
  } catch {
    return null;
  }
}

export type MockSessionAdapterOptions = {
  /**
   * Mirror the tokens into sessionStorage (and restore them on creation).
   * Defaults to `isMockTokenStorageAllowed()`: only with the mock API enabled
   * and `NODE_ENV=development` (or a production demo build).
   */
  persistTokens?: boolean;
};

export function createMockSessionAdapter(
  options: MockSessionAdapterOptions = {},
): SessionAdapter {
  const persistTokens = options.persistTokens ?? isMockTokenStorageAllowed();
  let accessToken: string | null = null;
  let refreshToken: string | null = null;
  const inBrowser = () => typeof window !== "undefined";

  function persist(): void {
    if (!persistTokens) return;
    const storage = getSessionStorage();
    if (!storage) return;
    try {
      if (accessToken === null) {
        storage.removeItem(MOCK_TOKENS_STORAGE_KEY);
      } else {
        const payload: StoredTokens = { accessToken, refreshToken };
        storage.setItem(MOCK_TOKENS_STORAGE_KEY, JSON.stringify(payload));
      }
    } catch (error) {
      // Quota exceeded / storage blocked: keep the tokens in memory only
      console.warn("[mock] could not persist the mock session tokens", error);
    }
  }

  // Page load: restore a previous session so a refresh does not log the user out
  if (persistTokens) {
    const storage = getSessionStorage();
    const stored = storage ? readStoredTokens(storage) : null;
    if (stored) {
      accessToken = stored.accessToken;
      refreshToken = stored.refreshToken;
    }
  }

  function writeCookie(value: string): void {
    if (typeof document !== "undefined") document.cookie = value;
  }

  return {
    kind: "mock-bearer",
    getRequestHeaders(path) {
      const headers: Record<string, string> = {};
      if (accessToken) headers.Authorization = `Bearer ${accessToken}`;
      if (refreshToken && path === REFRESH_PATH) {
        headers[MOCK_REFRESH_TOKEN_HEADER] = refreshToken;
      }
      return headers;
    },
    onResponse(response) {
      if (!inBrowser()) return; // never keep a shared token on the server
      const token = response.headers.get(MOCK_ACCESS_TOKEN_HEADER);
      if (!token) return;
      accessToken = token;
      refreshToken = response.headers.get(MOCK_REFRESH_TOKEN_HEADER) ?? refreshToken;
      persist();
      const role = response.headers.get(MOCK_ROLE_HEADER);
      if (isRole(role)) writeCookie(buildMockSessionCookie({ role }));
    },
    getAccessToken: () => accessToken,
    setAccessToken(token) {
      accessToken = token;
      if (token === null) refreshToken = null;
      persist();
    },
    clear() {
      accessToken = null;
      refreshToken = null;
      persist();
      writeCookie(buildClearedMockSessionCookie());
    },
  };
}

// Inlined at build time; the mock transport can only run in production in an
// explicit demo build (`NEXT_PUBLIC_DEMO_BUILD=enabled`, see `mock-safety.ts`)
const USE_MOCK_TRANSPORT = isMockRuntimeAllowed();

let active: SessionAdapter = USE_MOCK_TRANSPORT
  ? createMockSessionAdapter()
  : cookieSessionAdapter;

export function getSessionAdapter(): SessionAdapter {
  return active;
}

/** Swap the transport (tests, future auth work). Returns the previous one. */
export function setSessionAdapter(adapter: SessionAdapter): SessionAdapter {
  const previous = active;
  active = adapter;
  return previous;
}
