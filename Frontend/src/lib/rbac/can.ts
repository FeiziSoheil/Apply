import type { Role } from "@/contracts/auth";
import type { Permission } from "./permissions";

/**
 * Pure permission checks — usable in Server Components, route handlers, the
 * mock API and (through `useCan`) in client components. No React, no browser
 * APIs.
 */

/** What a check needs from a user: `CurrentUser` (from `GET /me`) fits as is */
export type RbacSubject = {
  role: Role;
  permissions: readonly Permission[];
};

/**
 * What a check needs from a session: the contract `Session`, the client
 * `SessionState` (`useSession()`) and `{ user }` of a server-side session all
 * fit. `null` / no user = signed out = nothing is allowed.
 */
export type RbacSession = { user: RbacSubject | null } | null | undefined;

/** One permission, or several that must ALL be held */
export type PermissionRequirement = Permission | readonly Permission[];

function asList(requirement: PermissionRequirement): readonly Permission[] {
  return typeof requirement === "string" ? [requirement] : requirement;
}

export function userCan(
  user: RbacSubject | null | undefined,
  requirement: PermissionRequirement,
): boolean {
  if (!user) return false;
  return asList(requirement).every((permission) =>
    user.permissions.includes(permission),
  );
}

export function userCanAny(
  user: RbacSubject | null | undefined,
  requirement: PermissionRequirement,
): boolean {
  if (!user) return false;
  return asList(requirement).some((permission) =>
    user.permissions.includes(permission),
  );
}

/** `true` when the session's user holds ALL the permissions */
export function can(
  session: RbacSession,
  requirement: PermissionRequirement,
): boolean {
  return userCan(session?.user, requirement);
}

/** `true` when the session's user holds AT LEAST ONE of the permissions */
export function canAny(
  session: RbacSession,
  requirement: PermissionRequirement,
): boolean {
  return userCanAny(session?.user, requirement);
}
