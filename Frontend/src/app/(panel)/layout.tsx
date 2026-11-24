import type { Metadata } from "next";
import { AuthProvider } from "@/components/auth/auth-provider";
import { RequireRole } from "@/components/auth/session-guards";
import { StudentPanelShell } from "@/components/panel/student/student-panel-shell";
import { QueryProvider } from "@/lib/api/query-provider";

/** Panels are private: never indexed, never followed, never cached by crawlers */
export const metadata: Metadata = {
  robots: {
    index: false,
    follow: false,
    nocache: true,
    googleBot: { index: false, follow: false, noimageindex: true },
  },
};

/**
 * Student panel (`/panel/*`). Separate from `(site)` so it has its own chrome
 * (mobile bottom nav + desktop sidebar) without the public header/footer.
 *
 * `src/proxy.ts` blocks requests without a session cookie; `RequireRole` then
 * verifies the user (`GET /me`) and shows a 403 page to other roles.
 */
export default function PanelLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <QueryProvider devtools>
      <AuthProvider>
        <StudentPanelShell>
          <RequireRole area="panel">{children}</RequireRole>
        </StudentPanelShell>
      </AuthProvider>
    </QueryProvider>
  );
}
