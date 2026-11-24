"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronDown, ExternalLink } from "lucide-react";
import { useSession } from "@/components/auth/auth-provider";
import { SiteLogoMark } from "@/components/layout/site-logo";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSkeleton,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  SidebarRail,
  useSidebar,
} from "@/components/ui/sidebar";
import { AREA_LABELS } from "@/lib/auth/role-labels";
import type { AuthArea } from "@/lib/auth/routes";
import { INSTITUTE } from "@/lib/constants";
import { AREA_BASE_PATH, navHref, type NavGroup } from "./nav-config";
import { useVisibleGroups } from "./use-visible-groups";

/** Fixed text widths of the loading skeleton (no randomness: prerendered) */
const SKELETON_WIDTHS = ["60%", "75%", "55%", "70%", "65%", "80%"] as const;

/** Whether `href` is the current route (dashboards match exactly) */
export function isActiveRoute(
  pathname: string,
  href: string,
  base: string,
): boolean {
  if (href === base) return pathname === base;
  return pathname === href || pathname.startsWith(`${href}/`);
}

function SidebarBrand({ area }: { area: AuthArea }) {
  const { setOpenMobile } = useSidebar();
  const home = AREA_BASE_PATH[area];
  const areaLabel = AREA_LABELS[area];

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <SidebarMenuButton
          asChild
          size="lg"
          tooltip={`${INSTITUTE.name} — ${areaLabel}`}
        >
          <Link
            href={home}
            onClick={() => setOpenMobile(false)}
            aria-label={`${INSTITUTE.name} — ${areaLabel}`}
          >
            <SiteLogoMark className="size-8 rounded-lg" iconClassName="size-4" />
            <span className="flex min-w-0 flex-col gap-0.5 leading-none">
              <span className="truncate font-heading text-base font-bold">
                {INSTITUTE.name}
              </span>
              <span className="truncate text-xs text-muted-foreground">
                {areaLabel}
              </span>
            </span>
          </Link>
        </SidebarMenuButton>
      </SidebarMenuItem>
    </SidebarMenu>
  );
}

function FlatNavItems({
  group,
  area,
  base,
}: {
  group: NavGroup;
  area: AuthArea;
  base: string;
}) {
  const pathname = usePathname();
  const { setOpenMobile } = useSidebar();

  return (
    <>
      {group.items.map((item) => {
        const href = navHref(area, item);
        const active = isActiveRoute(pathname, href, base);
        const Icon = item.icon;
        return (
          <SidebarMenuItem key={href}>
            <SidebarMenuButton
              asChild
              isActive={active}
              tooltip={item.label}
            >
              <Link
                href={href}
                aria-current={active ? "page" : undefined}
                onClick={() => setOpenMobile(false)}
              >
                <Icon aria-hidden />
                <span>{item.label}</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        );
      })}
    </>
  );
}

function NavCollapsibleGroup({
  group,
  area,
  base,
}: {
  group: NavGroup;
  area: AuthArea;
  base: string;
}) {
  const pathname = usePathname();
  const { setOpenMobile, state, isMobile } = useSidebar();
  const label = group.label ?? group.id;
  const GroupIcon = group.icon ?? group.items[0]?.icon;
  const hasActive = group.items.some((item) =>
    isActiveRoute(pathname, navHref(area, item), base),
  );
  const [userOpen, setUserOpen] = useState<boolean | null>(null);
  const open = userOpen ?? hasActive;
  const setOpen = (next: boolean) => setUserOpen(next);

  if (!GroupIcon) return null;

  // Icon-collapsed desktop: flyout dropdown (submenus are hidden by CSS)
  if (state === "collapsed" && !isMobile) {
    return (
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <SidebarMenuButton tooltip={label} isActive={hasActive}>
              <GroupIcon aria-hidden />
              <span>{label}</span>
              <ChevronDown className="ms-auto opacity-50" aria-hidden />
            </SidebarMenuButton>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            side="left"
            align="start"
            className="min-w-48"
          >
            <DropdownMenuLabel>{label}</DropdownMenuLabel>
            {group.items.map((item) => {
              const href = navHref(area, item);
              const active = isActiveRoute(pathname, href, base);
              const Icon = item.icon;
              return (
                <DropdownMenuItem key={href} asChild>
                  <Link
                    href={href}
                    aria-current={active ? "page" : undefined}
                    onClick={() => setOpenMobile(false)}
                  >
                    <Icon aria-hidden />
                    <span>{item.label}</span>
                  </Link>
                </DropdownMenuItem>
              );
            })}
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    );
  }

  return (
    <Collapsible
      open={open}
      onOpenChange={setOpen}
      className="group/collapsible"
    >
      <SidebarMenuItem>
        <CollapsibleTrigger asChild>
          <SidebarMenuButton
            tooltip={label}
            className="group-data-[state=open]/collapsible:bg-muted group-data-[state=open]/collapsible:text-foreground"
          >
            <GroupIcon aria-hidden />
            <span>{label}</span>
            <ChevronDown
              className="ms-auto transition-transform duration-200 group-data-[state=open]/collapsible:rotate-180"
              aria-hidden
            />
          </SidebarMenuButton>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <SidebarMenuSub>
            {group.items.map((item) => {
              const href = navHref(area, item);
              const active = isActiveRoute(pathname, href, base);
              const Icon = item.icon;
              return (
                <SidebarMenuSubItem key={href}>
                  <SidebarMenuSubButton asChild isActive={active}>
                    <Link
                      href={href}
                      aria-current={active ? "page" : undefined}
                      onClick={() => setOpenMobile(false)}
                    >
                      <Icon aria-hidden />
                      <span>{item.label}</span>
                    </Link>
                  </SidebarMenuSubButton>
                </SidebarMenuSubItem>
              );
            })}
          </SidebarMenuSub>
        </CollapsibleContent>
      </SidebarMenuItem>
    </Collapsible>
  );
}

/**
 * Collapsible sidebar (desktop, icon-only when collapsed) that becomes a sheet
 * on mobile — both from shadcn's `Sidebar`. Desktop uses the floating variant
 * so it reads as a separate island over the shell background. Menu entries
 * come from `NAV_CONFIG` through `useVisibleGroups`, filtered by permissions.
 */
export function PanelSidebar({ area }: { area: AuthArea }) {
  const { status } = useSession();
  const groups = useVisibleGroups(area);
  const base = AREA_BASE_PATH[area];

  return (
    <Sidebar
      side="start"
      collapsible="icon"
      variant="floating"
      className="md:[&_[data-slot=sidebar-inner]]:rounded-2xl md:[&_[data-slot=sidebar-inner]]:border md:[&_[data-slot=sidebar-inner]]:border-sidebar-border md:[&_[data-slot=sidebar-inner]]:shadow-none md:[&_[data-slot=sidebar-inner]]:ring-0"
    >
      <SidebarHeader>
        <SidebarBrand area={area} />
      </SidebarHeader>

      <SidebarContent>
        {status === "loading" ? (
          <SidebarGroup aria-busy="true" aria-label="در حال بارگذاری منو">
            <SidebarGroupContent>
              <SidebarMenu>
                {SKELETON_WIDTHS.map((width, index) => (
                  <SidebarMenuItem key={index}>
                    <SidebarMenuSkeleton showIcon width={width} />
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        ) : (
          <SidebarGroup>
            <SidebarGroupContent>
              <SidebarMenu>
                {groups.map((group) =>
                  group.label ? (
                    <NavCollapsibleGroup
                      key={group.id}
                      group={group}
                      area={area}
                      base={base}
                    />
                  ) : (
                    <FlatNavItems
                      key={group.id}
                      group={group}
                      area={area}
                      base={base}
                    />
                  ),
                )}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}
      </SidebarContent>

      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton asChild tooltip="بازگشت به سایت">
              <Link href="/">
                <ExternalLink aria-hidden />
                <span>بازگشت به سایت</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>

      <SidebarRail />
    </Sidebar>
  );
}
