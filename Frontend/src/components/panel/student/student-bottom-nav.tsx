"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { formatNumber } from "@/lib/format";
import { cn } from "@/lib/utils";
import {
  isStudentNavActive,
  STUDENT_PRIMARY_NAV,
  type StudentPrimaryNavId,
} from "./student-nav";
import { StudentMoreSheet } from "./student-more-sheet";

export type StudentNavBadges = Partial<
  Record<Exclude<StudentPrimaryNavId, "more">, number>
>;

type StudentBottomNavProps = {
  badges?: StudentNavBadges;
};

export function StudentBottomNav({ badges }: StudentBottomNavProps) {
  const pathname = usePathname();
  const [moreOpen, setMoreOpen] = useState(false);

  return (
    <>
      <nav
        aria-label="ناوبری اصلی"
        className="fixed inset-x-0 bottom-0 z-40 border-t bg-background/95 pb-[env(safe-area-inset-bottom)] backdrop-blur supports-backdrop-filter:bg-background/90 md:hidden"
      >
        <ul className="grid grid-cols-5" role="list">
          {STUDENT_PRIMARY_NAV.map((item) => {
            const Icon = item.icon;
            const active =
              item.id === "more"
                ? moreOpen
                : isStudentNavActive(pathname, item);
            const badge =
              item.id !== "more" ? (badges?.[item.id] ?? 0) : 0;

            if (item.id === "more") {
              return (
                <li key={item.id}>
                  <button
                    type="button"
                    className={cn(
                      "flex min-h-14 w-full flex-col items-center justify-center gap-0.5 px-1 text-[0.65rem] font-medium transition-colors",
                      active
                        ? "text-primary"
                        : "text-muted-foreground",
                    )}
                    aria-expanded={moreOpen}
                    aria-controls="student-more-sheet"
                    onClick={() => setMoreOpen(true)}
                  >
                    <Icon className="size-5" aria-hidden />
                    <span>{item.label}</span>
                  </button>
                </li>
              );
            }

            return (
              <li key={item.id}>
                <Link
                  href={item.href!}
                  aria-current={active ? "page" : undefined}
                  className={cn(
                    "relative flex min-h-14 w-full flex-col items-center justify-center gap-0.5 px-1 text-[0.65rem] font-medium transition-colors",
                    active ? "text-primary" : "text-muted-foreground",
                  )}
                >
                  <span className="relative">
                    <Icon className="size-5" aria-hidden />
                    {badge > 0 ? (
                      <span
                        className="absolute -end-2.5 -top-1.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-600 px-1 text-[0.65rem] font-bold text-white shadow-xs ring-2 ring-background tabular-nums"
                        aria-label={`${formatNumber(badge)} مورد`}
                      >
                        {formatNumber(badge > 99 ? 99 : badge)}
                      </span>
                    ) : null}
                  </span>
                  <span>{item.label}</span>
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
      <StudentMoreSheet open={moreOpen} onOpenChange={setMoreOpen} />
    </>
  );
}
