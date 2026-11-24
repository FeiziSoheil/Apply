"use client";

import { useState } from "react";
import Link from "next/link";
import { Bell, CheckCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { PANEL_NOTIFICATIONS } from "@/data/panel-notifications";
import type { AuthArea } from "@/lib/auth/routes";
import { formatNumber } from "@/lib/format";
import { cn } from "@/lib/utils";
import { AREA_BASE_PATH } from "./nav-config";
import { StaffNotificationsMenu } from "./staff-notifications-menu";

/** Bell: live API for admin staff; static seed for student panel. */
export function NotificationsMenu({ area }: { area: AuthArea }) {
  if (area === "admin") {
    return <StaffNotificationsMenu />;
  }
  return <PanelStaticNotificationsMenu area={area} />;
}

function PanelStaticNotificationsMenu({ area }: { area: "panel" }) {
  const notifications = PANEL_NOTIFICATIONS[area];
  const [readIds, setReadIds] = useState<ReadonlySet<string>>(new Set());

  const unreadCount = notifications.filter(
    (item) => item.unread && !readIds.has(item.id),
  ).length;

  const markAllRead = () =>
    setReadIds(new Set(notifications.map((item) => item.id)));

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="relative"
          aria-label={
            unreadCount > 0
              ? `اعلان‌ها — ${formatNumber(unreadCount)} خوانده‌نشده`
              : "اعلان‌ها"
          }
        >
          <Bell />
          {unreadCount > 0 ? (
            <span
              aria-hidden
              className="absolute end-1.5 top-1.5 size-2 rounded-full bg-accent ring-2 ring-background"
            />
          ) : null}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80 max-w-[calc(100vw-2rem)]">
        <DropdownMenuLabel className="flex items-center justify-between gap-2">
          <span className="text-sm font-medium text-foreground">اعلان‌ها</span>
          <Button
            type="button"
            variant="ghost"
            size="xs"
            disabled={unreadCount === 0}
            onClick={markAllRead}
          >
            <CheckCheck data-icon="inline-start" />
            خوانده شد
          </Button>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuGroup>
          {notifications.map((item) => {
            const unread = item.unread && !readIds.has(item.id);
            return (
              <DropdownMenuItem
                key={item.id}
                className="items-start gap-3 py-2"
                onSelect={() =>
                  setReadIds((current) => new Set(current).add(item.id))
                }
              >
                <span
                  aria-hidden
                  className={cn(
                    "mt-2 size-2 shrink-0 rounded-full",
                    unread ? "bg-accent" : "bg-transparent",
                  )}
                />
                <span className="flex min-w-0 flex-1 flex-col gap-0.5">
                  <span className="flex items-center justify-between gap-2">
                    <span
                      className={cn(
                        "truncate text-sm",
                        unread ? "font-semibold" : "font-medium",
                      )}
                    >
                      {item.title}
                    </span>
                    <span className="shrink-0 text-xs text-muted-foreground">
                      {item.time}
                    </span>
                  </span>
                  <span className="line-clamp-2 text-xs leading-5 text-muted-foreground">
                    {item.description}
                  </span>
                </span>
              </DropdownMenuItem>
            );
          })}
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild className="justify-center text-primary">
          <Link href={`${AREA_BASE_PATH[area]}/tickets`}>مشاهده همه پیام‌ها</Link>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
