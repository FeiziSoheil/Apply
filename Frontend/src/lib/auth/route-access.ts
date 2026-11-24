import { SESSION_COOKIE_NAME } from "@/contracts/session";
import {
  MOCK_SESSION_COOKIE_NAME,
  parseMockSession,
} from "./mock-session-cookie";
import { findProtectedRoute, getRoleHome } from "./routes";

export { PROTECTED_ROUTES, findProtectedRoute, type ProtectedRoute } from "./routes";

/**
 * Route protection shared by `src/proxy.ts` and the smoke test.
 *
 * Protected areas: `/panel/*` (student) and `/admin/*` (admin, consultant) —
 * see `PROTECTED_ROUTES` in `./routes`.
 *
 * Both transports look the same to the proxy:
 * - real mode: the httpOnly `session` cookie must be present. Its content is
 *   opaque to the frontend, so only authentication is checked here; the exact
 *   role is enforced by `RequireRole` (client layout, from `GET /me`) and by
 *   the backend (403).
 * - mock mode: the `mock_session` cookie (written by the API client after a
 *   login) must be present and valid. It carries the role, so roles are
 *   enforced here as well.
 */

export type RouteDecision =
  | { type: "allow" }
  /** No (valid) session → send to the login page */
  | { type: "login" }
  /** Logged in with the wrong role → send to the role's own home */
  | { type: "forbidden"; redirectTo: string };

export type CookieReader = { get(name: string): { value: string } | undefined };

export function decideRouteAccess(input: {
  pathname: string;
  /** `process.env.NEXT_PUBLIC_API_MOCKING === "enabled"` */
  mockingEnabled: boolean;
  cookies: CookieReader;
}): RouteDecision {
  const route = findProtectedRoute(input.pathname);
  if (!route) return { type: "allow" };

  if (input.mockingEnabled) {
    const session = parseMockSession(
      input.cookies.get(MOCK_SESSION_COOKIE_NAME)?.value,
    );
    if (!session) return { type: "login" };
    return route.roles.includes(session.role)
      ? { type: "allow" }
      : { type: "forbidden", redirectTo: getRoleHome(session.role) };
  }

  const value = input.cookies.get(SESSION_COOKIE_NAME)?.value;
  return value ? { type: "allow" } : { type: "login" };
}
