"use client";

import { useEffect, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import type { Role } from "@/contracts/auth";
import {
  AREA_ROLES,
  RETURN_URL_PARAM,
  buildLoginUrl,
  getRoleHome,
  resolvePostLoginUrl,
  type AuthArea,
} from "@/lib/auth/routes";
import { ForbiddenPage } from "@/components/rbac/forbidden-page";
import { AREA_LABELS } from "@/lib/auth/role-labels";
import { useSession } from "./auth-provider";

const AREA_OF_ROLE: Record<Role, AuthArea> = {
  admin: "admin",
  consultant: "admin",
  student: "panel",
};

function SessionStatusMessage({ children }: { children: ReactNode }) {
  return (
    <div
      role="status"
      aria-live="polite"
      className="flex flex-1 items-center justify-center gap-2 py-16 text-sm text-muted-foreground"
    >
      <Loader2 className="size-4 animate-spin" aria-hidden />
      {children}
    </div>
  );
}

/**
 * Client-side gate of a protected area (`/panel`, `/admin`). The proxy has
 * already checked that a session cookie exists; here the verified `GET /me`
 * answers who the user is:
 * - unauthenticated → login page with `returnUrl` (unless the expiry dialog
 *   or a logout is already handling it)
 * - wrong role → a full 403 page (`ForbiddenPage`) with a link to the user's
 *   own home. The URL is kept, so the refusal is explicit instead of a silent
 *   redirect; the API enforces the same rule with 403 regardless.
 */
export function RequireRole({
  area,
  children,
}: {
  area: AuthArea;
  children: ReactNode;
}) {
  const router = useRouter();
  const { status, role, isExpired, isLoggingOut } = useSession();
  const allowed = role !== null && AREA_ROLES[area].includes(role);

  useEffect(() => {
    if (isExpired || isLoggingOut) return;
    if (status === "unauthenticated") {
      const { pathname, search } = window.location;
      router.replace(buildLoginUrl(`${pathname}${search}`));
    }
  }, [status, isExpired, isLoggingOut, router]);

  if (status === "authenticated" && allowed) return <>{children}</>;
  if (status === "authenticated" && role) {
    return (
      <ForbiddenPage
        areaLabel={AREA_LABELS[area]}
        homeHref={getRoleHome(role)}
        homeLabel={`رفتن به ${AREA_LABELS[AREA_OF_ROLE[role]]}`}
      />
    );
  }
  if (status === "unauthenticated") {
    return <SessionStatusMessage>در حال انتقال به صفحه ورود…</SessionStatusMessage>;
  }
  return <SessionStatusMessage>در حال بررسی نشست…</SessionStatusMessage>;
}

/**
 * Login pages only: a signed-in user never sees the form. They are sent to the
 * `returnUrl` (when allowed for their role) or to their home — which is also
 * what completes a login, since the forms just call `signIn()`.
 */
export function GuestOnly({ children }: { children: ReactNode }) {
  const router = useRouter();
  const { status, role } = useSession();

  useEffect(() => {
    if (status !== "authenticated" || !role) return;
    const returnUrl = new URLSearchParams(window.location.search).get(
      RETURN_URL_PARAM,
    );
    router.replace(resolvePostLoginUrl(role, returnUrl));
  }, [status, role, router]);

  if (status === "authenticated") {
    return <SessionStatusMessage>در حال انتقال…</SessionStatusMessage>;
  }
  return <>{children}</>;
}
