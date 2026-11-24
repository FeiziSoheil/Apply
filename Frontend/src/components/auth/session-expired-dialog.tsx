"use client";

import { useRouter } from "next/navigation";
import { LogIn, TimerOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { buildLoginUrl } from "@/lib/auth/routes";

type SessionExpiredDialogProps = {
  open: boolean;
};

/**
 * Blocking dialog shown when the session ended without the user asking for
 * it (401 / expired cookie). The only way out is signing in again — the login
 * page gets a `returnUrl` so the user lands back where they were.
 */
export function SessionExpiredDialog({ open }: SessionExpiredDialogProps) {
  const router = useRouter();

  function goToLogin() {
    const { pathname, search } = window.location;
    router.replace(buildLoginUrl(`${pathname}${search}`));
  }

  return (
    <Dialog open={open}>
      <DialogContent
        showCloseButton={false}
        onEscapeKeyDown={(event) => event.preventDefault()}
        onPointerDownOutside={(event) => event.preventDefault()}
        onInteractOutside={(event) => event.preventDefault()}
      >
        <DialogHeader className="items-center text-center">
          <div className="flex size-11 items-center justify-center rounded-xl bg-destructive/10 text-destructive">
            <TimerOff className="size-5" aria-hidden />
          </div>
          <DialogTitle className="text-lg font-bold">
            نشست شما منقضی شد
          </DialogTitle>
          <DialogDescription>
            به‌دلایل امنیتی از حساب شما خارج شدید. برای ادامه دوباره وارد شوید.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="sm:justify-center">
          <Button size="lg" onClick={goToLogin}>
            <LogIn data-icon="inline-start" />
            ورود مجدد
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
