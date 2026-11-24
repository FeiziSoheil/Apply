import type { Role } from "@/contracts/auth";

/**
 * Route constants and pure helpers of the auth flow.
 *
 * Dependency-free on purpose (type imports only): it is shared by
 * `src/proxy.ts` (edge), the API session helpers, the auth UI and the smoke
 * test.
 */

export const STUDENT_LOGIN_PATH = "/login";
export const STAFF_LOGIN_PATH = "/staff/login";
export const PANEL_PATH = "/panel";
export const ADMIN_PATH = "/admin";
export const RETURN_URL_PARAM = "returnUrl";

/** Login pages — a logged-in user is sent away from them */
export const AUTH_PAGE_PATHS = [STUDENT_LOGIN_PATH, STAFF_LOGIN_PATH] as const;

/** Where each role lives (admin & consultant share the admin area) */
export const ROLE_HOME: Record<Role, string> = {
  admin: ADMIN_PATH,
  consultant: ADMIN_PATH,
  student: PANEL_PATH,
};

export type ProtectedRoute = {
  /** Path prefix, matches the prefix itself and everything below it */
  prefix: string;
  /** Roles allowed in */
  roles: readonly Role[];
};

export type AuthArea = "panel" | "admin";

/** Roles that may enter each protected area */
export const AREA_ROLES: Record<AuthArea, readonly Role[]> = {
  panel: ["student"],
  admin: ["admin", "consultant"],
};

/** Keep in sync with `config.matcher` of `src/proxy.ts` */
export const PROTECTED_ROUTES: readonly ProtectedRoute[] = [
  { prefix: PANEL_PATH, roles: AREA_ROLES.panel },
  { prefix: ADMIN_PATH, roles: AREA_ROLES.admin },
];

function matchesPrefix(pathname: string, prefix: string): boolean {
  return pathname === prefix || pathname.startsWith(`${prefix}/`);
}

export function getRoleHome(role: Role): string {
  return ROLE_HOME[role];
}

export function isStaffRole(role: Role): boolean {
  return role === "admin" || role === "consultant";
}

export function findProtectedRoute(pathname: string): ProtectedRoute | undefined {
  return PROTECTED_ROUTES.find(({ prefix }) => matchesPrefix(pathname, prefix));
}

/** `true` for `/login` and `/staff/login` (query string tolerated) */
export function isAuthPagePath(pathname: string): boolean {
  const path = pathname.split(/[?#]/, 1)[0] ?? pathname;
  return AUTH_PAGE_PATHS.some((page) => matchesPrefix(path, page));
}

/** Only same-origin relative paths are allowed as `returnUrl`. */
export function isSafeReturnUrl(value: string | null | undefined): value is string {
  return (
    typeof value === "string" &&
    value.startsWith("/") &&
    !value.startsWith("//") &&
    !value.startsWith("/\\")
  );
}

/** The login page that fits a destination: the admin area uses staff login */
export function loginPathFor(returnUrl?: string | null): string {
  if (isSafeReturnUrl(returnUrl) && matchesPrefix(pathOf(returnUrl), ADMIN_PATH)) {
    return STAFF_LOGIN_PATH;
  }
  return STUDENT_LOGIN_PATH;
}

/** The login page a role signs in through */
export function loginPathForRole(role: Role): string {
  return isStaffRole(role) ? STAFF_LOGIN_PATH : STUDENT_LOGIN_PATH;
}

function pathOf(url: string): string {
  return url.split(/[?#]/, 1)[0] ?? url;
}

/** `/login?returnUrl=…` or `/staff/login?returnUrl=…` (no param for unusable URLs) */
export function buildLoginUrl(returnUrl?: string | null): string {
  const loginPath = loginPathFor(returnUrl);
  if (!isSafeReturnUrl(returnUrl) || isAuthPagePath(returnUrl)) return loginPath;
  return `${loginPath}?${RETURN_URL_PARAM}=${encodeURIComponent(returnUrl)}`;
}

/** Can `role` open `pathname`? Unprotected paths are open to everyone. */
export function canRoleAccessPath(role: Role, pathname: string): boolean {
  const route = findProtectedRoute(pathOf(pathname));
  return !route || route.roles.includes(role);
}

/**
 * Where to send a user right after login (or when a logged-in user opens a
 * login page): the `returnUrl` if it is safe, not a login page and allowed
 * for the role — otherwise the role's home.
 */
export function resolvePostLoginUrl(
  role: Role,
  returnUrl?: string | null,
): string {
  if (
    isSafeReturnUrl(returnUrl) &&
    !isAuthPagePath(returnUrl) &&
    canRoleAccessPath(role, returnUrl)
  ) {
    return returnUrl;
  }
  return getRoleHome(role);
}
