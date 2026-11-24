import type { Metadata } from "next";
import { NotificationToastListener } from "@/components/admin/notifications/notification-toast-listener";
import { AuthProvider } from "@/components/auth/auth-provider";
import { RequireRole } from "@/components/auth/session-guards";
import { PanelShell } from "@/components/panel/panel-shell";
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
 * Admin area (`/admin/*`) for admin and consultant — see `(panel)/layout.tsx`
 * for how the proxy and `RequireRole` split the protection (wrong role → 403
 * page, rendered inside the shell). The menu is filtered by permission.
 */
export default function AdminLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <QueryProvider devtools>
      <AuthProvider>
        <PanelShell area="admin">
          <NotificationToastListener />
          <RequireRole area="admin">{children}</RequireRole>
        </PanelShell>
      </AuthProvider>
    </QueryProvider>
  );
}
