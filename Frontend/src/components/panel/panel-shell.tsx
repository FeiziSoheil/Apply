import { PanelDetailDrawerProvider, PanelDetailDrawerSlot } from "./panel-detail-drawer";
import { PanelSidebar } from "./panel-sidebar";
import { PanelTopbar } from "./panel-topbar";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import type { AuthArea } from "@/lib/auth/routes";

type PanelShellProps = {
  /** Which area's menu to generate (`NAV_CONFIG[area]`) */
  area: AuthArea;
  children: React.ReactNode;
};

/**
 * Chrome for signed-in staff areas (`/admin`): collapsible sidebar (sheet on
 * mobile), top bar and content slot. On desktop (`md+`) the regions are
 * separate islands; an optional detail drawer becomes a third island and
 * shrinks the content column. Must sit inside `AuthProvider`.
 */
export function PanelShell({ area, children }: PanelShellProps) {
  return (
    <SidebarProvider className="h-[calc(100svh-var(--demo-banner-height))] overflow-hidden bg-muted">
      <PanelSidebar area={area} />
      <SidebarInset className="min-h-0 min-w-0 overflow-hidden bg-background md:gap-2 md:bg-transparent md:p-2 md:ps-0">
        <PanelDetailDrawerProvider>
          <PanelTopbar area={area} />
          <div className="flex min-h-0 min-w-0 flex-1 overflow-hidden">
            <div className="no-scrollbar flex min-h-0 min-w-0 flex-1 flex-col overflow-y-auto md:rounded-2xl md:border md:bg-card">
              {children}
            </div>
            <PanelDetailDrawerSlot />
          </div>
        </PanelDetailDrawerProvider>
      </SidebarInset>
    </SidebarProvider>
  );
}
