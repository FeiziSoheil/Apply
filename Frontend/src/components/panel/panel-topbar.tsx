import { Separator } from "@/components/ui/separator";
import { SidebarTrigger } from "@/components/ui/sidebar";
import type { AuthArea } from "@/lib/auth/routes";
import { CommandPalette } from "./command-palette";
import { NotificationsMenu } from "./notifications-menu";
import { PanelBreadcrumb } from "./panel-breadcrumb";
import { PanelUserMenu } from "./panel-user-menu";

/**
 * Top bar: sidebar toggle, dynamic breadcrumb and, at the end edge, global
 * search (Ctrl/Cmd+K), notifications and the user menu. On desktop it is a
 * separate island over the shell background; on mobile it stays flush.
 * Server Component — only its leaves are client islands.
 */
export function PanelTopbar({ area }: { area: AuthArea }) {
  return (
    <header className="z-20 flex h-14 shrink-0 items-center gap-2 border-b bg-background/95 px-4 backdrop-blur supports-backdrop-filter:bg-background/80 md:rounded-2xl md:border md:bg-card md:backdrop-blur-none">
      <SidebarTrigger className="-ms-1" />
      <Separator orientation="vertical" className="me-1 h-4 self-center" />
      <PanelBreadcrumb area={area} />
      <div className="ms-auto flex shrink-0 items-center gap-1 sm:gap-2">
        <CommandPalette area={area} />
        <NotificationsMenu area={area} />
        <PanelUserMenu area={area} />
      </div>
    </header>
  );
}
