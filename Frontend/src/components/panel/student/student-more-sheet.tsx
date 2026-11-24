"use client";

import Link from "next/link";
import { LogOut, Loader2 } from "lucide-react";
import { useSession } from "@/components/auth/auth-provider";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { STUDENT_MORE_NAV } from "./student-nav";

type StudentMoreSheetProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export function StudentMoreSheet({ open, onOpenChange }: StudentMoreSheetProps) {
  const { isLoggingOut, signOut } = useSession();

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="rounded-t-2xl pb-[max(1.5rem,env(safe-area-inset-bottom))]">
        <SheetHeader className="text-start">
          <SheetTitle>بیشتر</SheetTitle>
          <SheetDescription>
            پرداخت‌ها، رزروها و تنظیمات حساب شما
          </SheetDescription>
        </SheetHeader>
        <nav aria-label="منوی بیشتر" className="mt-2 flex flex-col gap-1 px-2 pb-2">
          {STUDENT_MORE_NAV.map((item) => {
            const Icon = item.icon;
            return (
              <Button
                key={item.id}
                type="button"
                variant="ghost"
                className="h-12 justify-start gap-3 px-3 text-base"
                asChild
              >
                <Link href={item.href} onClick={() => onOpenChange(false)}>
                  <Icon className="size-5" aria-hidden />
                  {item.label}
                </Link>
              </Button>
            );
          })}
          <Button
            type="button"
            variant="ghost"
            className="h-12 justify-start gap-3 px-3 text-base text-destructive hover:text-destructive"
            disabled={isLoggingOut}
            onClick={() => {
              onOpenChange(false);
              void signOut();
            }}
          >
            {isLoggingOut ? (
              <Loader2 className="size-5 animate-spin" aria-hidden />
            ) : (
              <LogOut className="size-5" aria-hidden />
            )}
            خروج
          </Button>
        </nav>
      </SheetContent>
    </Sheet>
  );
}
