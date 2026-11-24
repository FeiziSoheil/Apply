"use client";

import { useSession } from "@/components/auth/auth-provider";
import {
  userCan,
  userCanAny,
  type PermissionRequirement,
} from "@/lib/rbac/can";

/**
 * `true` when the signed-in user holds ALL the permissions (from `GET /me`).
 * `false` while the session is loading or signed out — so a guarded element
 * never flashes for someone who may not use it.
 */
export function useCan(requirement: PermissionRequirement): boolean {
  const { user } = useSession();
  return userCan(user, requirement);
}

/** `true` when the user holds AT LEAST ONE of the permissions */
export function useCanAny(requirement: PermissionRequirement): boolean {
  const { user } = useSession();
  return userCanAny(user, requirement);
}
