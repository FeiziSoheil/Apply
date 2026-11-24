import { userCan, userCanAny, type RbacSubject } from "./can";
import type { Permission } from "./permissions";

/** Something a menu entry (or any UI block) can be hidden behind */
export type PermissionGated = {
  /** Required permissions; an empty / missing list means "any signed-in user" */
  permissions?: readonly Permission[];
  /** `all` (default): every listed permission is required · `any`: one is enough */
  match?: "all" | "any";
};

export function isAllowed(
  user: RbacSubject | null | undefined,
  gate: PermissionGated,
): boolean {
  if (!user) return false;
  const required = gate.permissions ?? [];
  if (required.length === 0) return true;
  return gate.match === "any" ? userCanAny(user, required) : userCan(user, required);
}

/** Keep only the entries the user is allowed to see (groups with no entries are dropped by callers) */
export function filterByPermission<T extends PermissionGated>(
  items: readonly T[],
  user: RbacSubject | null | undefined,
): T[] {
  return items.filter((item) => isAllowed(user, item));
}
