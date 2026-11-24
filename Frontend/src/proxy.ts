import { NextResponse, type NextRequest } from "next/server";
import { decideRouteAccess } from "@/lib/auth/route-access";
import { buildLoginUrl } from "@/lib/auth/routes";

/**
 * Route protection for `/panel/*` (student) and `/admin/*` (admin, consultant).
 *
 * Next.js 16 renamed `middleware.ts` to `proxy.ts` (the old name is
 * deprecated), so this file is the single edge entry point — there is no
 * `middleware.ts`.
 *
 * - No session cookie → redirect to `/login?returnUrl=…` (`/staff/login` for
 *   `/admin/*`). Cookie = `session` in real mode, `mock_session` while the
 *   mock API is enabled — see `src/lib/auth/route-access.ts`.
 * - The exact role is NOT enforced here in either mode: a signed-in user with
 *   the wrong role is let through and the area layout (`RequireRole`, based on
 *   the verified `GET /me`) renders the 403 page. (Real mode cannot read the
 *   httpOnly `session` cookie anyway; mock mode behaves the same so the 403
 *   screen is the same in both.)
 * - Login pages are NOT redirected here. A stale cookie would loop forever
 *   (an httpOnly cookie cannot be cleared from JS); the "already logged in"
 *   guard runs client-side against the verified `GET /me` (`GuestOnly`).
 * - Public pages are not matched at all, so they stay fully static.
 */

// Inlined at build time (next.config.ts); anything but "enabled" is off
const MOCKING_ENABLED = process.env.NEXT_PUBLIC_API_MOCKING === "enabled";

export function proxy(request: NextRequest): NextResponse {
  const { pathname, search } = request.nextUrl;
  const decision = decideRouteAccess({
    pathname,
    mockingEnabled: MOCKING_ENABLED,
    cookies: request.cookies,
  });

  if (decision.type === "login") {
    return NextResponse.redirect(
      new URL(buildLoginUrl(`${pathname}${search}`), request.url),
    );
  }
  // `allow` and `forbidden` (wrong role): the layout shows the 403 page
  return NextResponse.next();
}

// Must be static literals; keep in sync with PROTECTED_ROUTES (lib/auth/routes.ts)
export const config = {
  matcher: ["/panel/:path*", "/admin/:path*"],
};
