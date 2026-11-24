"use client";

import type { ReactNode } from "react";
import type { PermissionRequirement } from "@/lib/rbac/can";
import { useCan, useCanAny } from "./use-can";

type CanProps = {
  permission: PermissionRequirement;
  /** With several permissions: `all` (default) or `any` */
  mode?: "all" | "any";
  /** Rendered when the user may not (e.g. a disabled button or a hint) */
  fallback?: ReactNode;
  children: ReactNode;
};

/**
 * Renders `children` only for users holding the permission(s).
 *
 * This is a UX convenience, never a security boundary: the API answers 403
 * regardless (see `src/mocks/contract.ts` / the real backend).
 *
 *   <Can permission="lead:assign"><AssignLeadButton /></Can>
 */
export function Can({
  permission,
  mode = "all",
  fallback = null,
  children,
}: CanProps) {
  const all = useCan(permission);
  const any = useCanAny(permission);
  return <>{(mode === "any" ? any : all) ? children : fallback}</>;
}
