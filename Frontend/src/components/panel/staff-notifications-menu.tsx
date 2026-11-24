"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Bell, CheckCheck, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  useMarkAllNotificationsRead,
  useMarkNotificationRead,
} from "@/features/notifications/mutations";
import { useNotificationTransport } from "@/hooks/use-notification-transport";
import { getNotificationTypeMeta } from "@/lib/crm/notification-types";
import { formatNumber, formatRelativeFa } from "@/lib/format";
import { cn } from "@/lib/utils";

/** Live staff notification bell (poll / future SSE). */
export function StaffNotificationsMenu() {
  const router = useRouter();
  const { items, unreadCount, isLoading } = useNotificationTransport();
  const markRead = useMarkNotificationRead();
  const markAll = useMarkAllNotificationsRead();

  return (
    <Popover>
      <PopoverTrigger asChild>
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
              className="absolute end-0.5 top-0.5 flex min-w-4 items-center justify-center rounded-full bg-accent px-1 text-[0.625rem] font-semibold leading-4 text-accent-foreground ring-2 ring-background"
              aria-hidden
            >
              {unreadCount > 99 ? "۹۹+" : formatNumber(unreadCount)}
            </span>
          ) : null}
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-96 max-w-[calc(100vw-2rem)] p-0">
        <div className="flex items-center justify-between gap-2 border-b border-border px-3 py-2">
          <p className="text-sm font-medium">اعلان‌ها</p>
          <Button
            type="button"
            variant="ghost"
            size="xs"
            disabled={unreadCount === 0 || markAll.isPending}
            onClick={() => markAll.mutate()}
          >
            {markAll.isPending ? (
              <Loader2 className="size-3.5 animate-spin" aria-hidden />
            ) : (
              <CheckCheck data-icon="inline-start" />
            )}
            خواندن همه
          </Button>
        </div>
        <ul className="max-h-80 overflow-y-auto py-1" role="list">
          {isLoading ? (
            <li className="px-3 py-6 text-center text-sm text-muted-foreground">
              در حال بارگذاری…
            </li>
          ) : items.length === 0 ? (
            <li className="px-3 py-6 text-center text-sm text-muted-foreground">
              اعلانی نیست
            </li>
          ) : (
            items.map((item) => {
              const meta = getNotificationTypeMeta(item.type);
              const unread = item.readAt === null;
              const Icon = meta.Icon;
              return (
                <li key={item.id}>
                  <button
                    type="button"
                    className={cn(
                      "flex w-full items-start gap-3 px-3 py-2.5 text-start transition-colors hover:bg-muted/60 focus-visible:bg-muted/60 focus-visible:outline-none",
                      unread && "bg-accent/5",
                    )}
                    onClick={() => {
                      if (unread) markRead.mutate(item.id);
                      router.push(item.link);
                    }}
                  >
                    <span className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-md bg-muted text-muted-foreground">
                      <Icon className="size-4" aria-hidden />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="flex items-start justify-between gap-2">
                        <span
                          className={cn(
                            "line-clamp-1 text-sm",
                            unread ? "font-semibold" : "font-medium",
                          )}
                        >
                          {item.title}
                        </span>
                        <span className="shrink-0 text-xs text-muted-foreground">
                          {formatRelativeFa(item.createdAt)}
                        </span>
                      </span>
                      <span className="mt-0.5 line-clamp-2 text-xs leading-5 text-muted-foreground">
                        {item.body}
                      </span>
                    </span>
                    {unread ? (
                      <span
                        aria-hidden
                        className="mt-2 size-2 shrink-0 rounded-full bg-accent"
                      />
                    ) : null}
                  </button>
                </li>
              );
            })
          )}
        </ul>
        <div className="border-t border-border px-3 py-2">
          <Button variant="ghost" size="sm" className="w-full" asChild>
            <Link href="/admin/notifications">مشاهده همه اعلان‌ها</Link>
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
}
