"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ExternalLink, LogOut, Loader2 } from "lucide-react";
import { useSession } from "@/components/auth/auth-provider";
import { SiteLogoMark } from "@/components/layout/site-logo";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { INSTITUTE } from "@/lib/constants";
import { formatNumber } from "@/lib/format";
import { cn } from "@/lib/utils";
import {
  isStudentNavActive,
  STUDENT_MORE_NAV,
  STUDENT_PRIMARY_NAV,
} from "./student-nav";
import type { StudentNavBadges } from "./student-bottom-nav";

type StudentSidebarProps = {
  badges?: StudentNavBadges;
};

export function StudentSidebar({ badges }: StudentSidebarProps) {
  const pathname = usePathname();
  const { isLoggingOut, signOut } = useSession();
  const [moreExpanded, setMoreExpanded] = useState(true);

  const primary = STUDENT_PRIMARY_NAV.filter((item) => item.id !== "more");

  return (
    <aside className="hidden h-full w-60 shrink-0 flex-col border-e bg-background md:flex">
      <div className="flex h-14 items-center gap-2 border-b px-4">
        <Link
          href="/panel"
          className="flex min-h-11 min-w-0 items-center gap-2 rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          aria-label={`${INSTITUTE.name} — پنل دانشجو`}
        >
          <SiteLogoMark className="size-8 rounded-lg" iconClassName="size-4" />
          <span className="truncate font-heading text-sm font-bold">
            پنل دانشجو
          </span>
        </Link>
      </div>

      <nav
        aria-label="ناوبری اصلی"
        className="flex flex-1 flex-col gap-1 overflow-y-auto p-3"
      >
        {primary.map((item) => {
          const Icon = item.icon;
          const active = isStudentNavActive(pathname, item);
          const badge =
            item.id === "more" ? 0 : (badges?.[item.id] ?? 0);
          return (
            <Link
              key={item.id}
              href={item.href!}
              aria-current={active ? "page" : undefined}
              className={cn(
                "flex min-h-11 items-center gap-3 rounded-lg px-3 text-sm font-medium transition-colors",
                active
                  ? "bg-primary/10 text-primary"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground",
              )}
            >
              <Icon className="size-5 shrink-0" aria-hidden />
              <span className="flex-1">{item.label}</span>
              {badge > 0 ? (
                <span className="rounded-full bg-red-600 px-2 py-0.5 text-[0.65rem] font-bold text-white shadow-xs tabular-nums">
                  {formatNumber(badge > 99 ? 99 : badge)}
                </span>
              ) : null}
            </Link>
          );
        })}

        <Separator className="my-2" />

        <button
          type="button"
          className="flex min-h-11 items-center justify-between rounded-lg px-3 text-sm font-medium text-muted-foreground hover:bg-muted hover:text-foreground"
          aria-expanded={moreExpanded}
          onClick={() => setMoreExpanded((value) => !value)}
        >
          بیشتر
        </button>
        {moreExpanded
          ? STUDENT_MORE_NAV.map((item) => {
              const Icon = item.icon;
              const active =
                pathname === item.href || pathname.startsWith(`${item.href}/`);
              return (
                <Link
                  key={item.id}
                  href={item.href}
                  aria-current={active ? "page" : undefined}
                  className={cn(
                    "flex min-h-11 items-center gap-3 rounded-lg px-3 text-sm font-medium transition-colors",
                    active
                      ? "bg-primary/10 text-primary"
                      : "text-muted-foreground hover:bg-muted hover:text-foreground",
                  )}
                >
                  <Icon className="size-5 shrink-0" aria-hidden />
                  {item.label}
                </Link>
              );
            })
          : null}
      </nav>

      <div className="flex flex-col gap-1 border-t p-3">
        <Button variant="ghost" className="min-h-11 justify-start" asChild>
          <Link href="/">
            <ExternalLink data-icon="inline-start" aria-hidden />
            بازگشت به سایت
          </Link>
        </Button>
        <Button
          type="button"
          variant="ghost"
          className="min-h-11 justify-start text-destructive hover:text-destructive"
          disabled={isLoggingOut}
          onClick={() => void signOut()}
        >
          {isLoggingOut ? (
            <Loader2 className="animate-spin" data-icon="inline-start" aria-hidden />
          ) : (
            <LogOut data-icon="inline-start" aria-hidden />
          )}
          خروج
        </Button>
      </div>
    </aside>
  );
}
