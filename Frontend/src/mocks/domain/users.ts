import type { CurrentUser, Role } from "@/contracts/auth";
import { userCan } from "@/lib/rbac/can";
import { permissionsForRole, type Permission } from "@/lib/rbac/permissions";
import type { MockUser } from "../types";
import { apiError } from "../errors";

/** Public projection of a stored account (drops password & audit data) */
export function toCurrentUser(user: MockUser): CurrentUser {
  return {
    id: user.id,
    name: user.name,
    role: user.role,
    // Always derived from the RBAC map (the stored `permissions` of seeds are ignored)
    permissions: permissionsForRole(user.role),
    ...(user.mobile ? { mobile: user.mobile } : {}),
    ...(user.email ? { email: user.email } : {}),
  };
}

export function isStaff(user: MockUser): boolean {
  return user.role === "admin" || user.role === "consultant";
}

/** Narrow `ctx.user` for endpoints whose policy guarantees a session */
export function requireUser(user: MockUser | null): MockUser {
  if (!user) throw apiError.unauthorized();
  return user;
}

export function assertRole(user: MockUser, ...roles: Role[]): void {
  if (!roles.includes(user.role)) throw apiError.forbidden();
}

/**
 * RBAC check of a mock account. Uses the role's catalog entry, never the
 * `permissions` stored on the record, so seeds cannot drift from the map.
 */
export function hasPermission(user: MockUser, permission: Permission): boolean {
  return userCan(
    { role: user.role, permissions: permissionsForRole(user.role) },
    permission,
  );
}

/** 403 `FORBIDDEN` unless the account holds the permission */
export function assertPermission(user: MockUser, permission: Permission): void {
  if (!hasPermission(user, permission)) throw apiError.forbidden();
}
