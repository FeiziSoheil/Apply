"use client";

import type { ReactNode } from "react";
import { useSession } from "@/components/auth/auth-provider";
import { ForbiddenPage } from "@/components/rbac/forbidden-page";
import { userCan, type PermissionRequirement } from "@/lib/rbac/can";

type RequirePermissionProps = {
  permission: PermissionRequirement;
  /** Section name shown on the 403 page, e.g. «کشورها» */
  areaLabel: string;
  children: ReactNode;
};

/**
 * Page-level permission gate for admin sections. A direct URL cannot bypass
 * the hidden menu entry: users lacking the permission get the 403 page (the
 * API refuses them as well). Use `<Can>` for individual buttons.
 */
export function RequirePermission({
  permission,
  areaLabel,
  children,
}: RequirePermissionProps) {
  const { user, status } = useSession();
  // Never return null: a Client Component that renders nothing drops its
  // children from the tree and breaks Instant Navigation validation.
  if (status !== "authenticated" || !user) {
    return (
      <div
        role="status"
        aria-live="polite"
        className="flex flex-1 items-center justify-center py-16 text-sm text-muted-foreground"
      >
        در حال بررسی دسترسی…
      </div>
    );
  }
  if (!userCan(user, permission)) {
    return (
      <ForbiddenPage
        areaLabel={areaLabel}
        homeHref="/admin"
        homeLabel="بازگشت به پنل مدیریت"
      />
    );
  }
  return <>{children}</>;
}
