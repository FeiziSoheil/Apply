/**
 * Client-side session helpers.
 *
 * The public contract authenticates with the httpOnly `session` cookie
 * (`credentials: "include"`), managed by the backend. How the client carries
 * the session is delegated to a `SessionAdapter` (see `session-adapter.ts`):
 * cookie only in real mode, in-memory Bearer + `mock_session` cookie in mock
 * mode. This module owns the "session is gone" notification (401 / logout).
 */

import {
  RETURN_URL_PARAM,
  STUDENT_LOGIN_PATH,
  buildLoginUrl,
  isAuthPagePath,
  isSafeReturnUrl,
} from "@/lib/auth/routes";
import type { ApiError } from "./errors";
import { getSessionAdapter } from "./session-adapter";

export const LOGIN_PATH = STUDENT_LOGIN_PATH;
export { RETURN_URL_PARAM, buildLoginUrl, isSafeReturnUrl };

let redirecting = false;
const clearListeners = new Set<() => void>();
const expiredListeners = new Set<() => void>();

/** Mock mode only: the in-memory Bearer token. Always `null` in real mode. */
export function getAccessToken(): string | null {
  return getSessionAdapter().getAccessToken();
}

/** Mock mode only (no-op in real mode, where the session is an httpOnly cookie) */
export function setAccessToken(token: string | null): void {
  getSessionAdapter().setAccessToken(token);
}

/** Subscribe to session clearing (e.g. to wipe the query cache). */
export function onSessionCleared(listener: () => void): () => void {
  clearListeners.add(listener);
  return () => {
    clearListeners.delete(listener);
  };
}

/**
 * Subscribe to "the server rejected the session" (401). While at least one
 * listener exists (`AuthProvider`) it owns the reaction — it shows the
 * «نشست شما منقضی شد» dialog — and the hard redirect to login is skipped.
 */
export function onSessionExpired(listener: () => void): () => void {
  expiredListeners.add(listener);
  return () => {
    expiredListeners.delete(listener);
  };
}

/** Drop all client-held auth state and notify subscribers. */
export function clearSession(): void {
  getSessionAdapter().clear();
  for (const listener of clearListeners) {
    listener();
  }
}

/** Browser only: send the user to the login page, remembering where they were. */
export function redirectToLogin(): void {
  if (typeof window === "undefined" || redirecting) return;
  const { pathname, search } = window.location;
  if (isAuthPagePath(pathname)) return;
  redirecting = true;
  window.location.assign(buildLoginUrl(`${pathname}${search}`));
}

/**
 * Called by the API client when the server answers 401: the session is gone.
 * Clears it, then lets `AuthProvider` explain it (dialog); without a provider
 * (public pages) the user is redirected to the login page instead.
 */
export function handleUnauthorized(): void {
  clearSession();
  if (expiredListeners.size === 0) {
    redirectToLogin();
    return;
  }
  for (const listener of expiredListeners) {
    listener();
  }
}

const forbiddenListeners = new Set<(error: ApiError) => void>();

/**
 * Subscribe to 403 responses (the user is logged in but lacks permission),
 * e.g. to show a toast. The session is kept intact.
 */
export function onForbidden(listener: (error: ApiError) => void): () => void {
  forbiddenListeners.add(listener);
  return () => {
    forbiddenListeners.delete(listener);
  };
}

/** Called by the API client when the server answers 403. */
export function handleForbidden(error: ApiError): void {
  for (const listener of forbiddenListeners) {
    listener(error);
  }
}
