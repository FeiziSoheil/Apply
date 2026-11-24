"use client";

import Link from "next/link";
import { useSession } from "@/components/auth/auth-provider";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { NotificationsMenu } from "@/components/panel/notifications-menu";
import { Skeleton } from "@/components/ui/skeleton";

function getInitials(name: string): string {
  const words = name.trim().split(/\s+/).filter(Boolean);
  const first = words[0]?.charAt(0) ?? "";
  const last =
    words.length > 1 ? (words[words.length - 1]?.charAt(0) ?? "") : "";
  return `${first}${last}`;
}

/** هدر ساده موبایل‌فرست: زنگوله + آواتار */
export function StudentHeader() {
  const { user, status } = useSession();

  return (
    <header className="z-20 flex h-14 shrink-0 items-center gap-2 border-b bg-background/95 px-4 backdrop-blur supports-backdrop-filter:bg-background/80">
      <div className="min-w-0 flex-1">
        {status === "loading" || !user ? (
          <Skeleton className="h-5 w-28" />
        ) : (
          <p className="truncate text-sm font-medium md:hidden">
            سلام {user.name.split(/\s+/)[0]}
          </p>
        )}
        <p className="hidden truncate text-sm text-muted-foreground md:block">
          پیگیری پرونده و مدارک
        </p>
      </div>
      <div className="flex shrink-0 items-center gap-1">
        <NotificationsMenu area="panel" />
        {user ? (
          <Link
            href="/panel/profile"
            className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            aria-label="پروفایل"
          >
            <Avatar size="sm">
              <AvatarFallback>{getInitials(user.name)}</AvatarFallback>
            </Avatar>
          </Link>
        ) : (
          <Skeleton className="size-8 rounded-full" />
        )}
      </div>
    </header>
  );
}
