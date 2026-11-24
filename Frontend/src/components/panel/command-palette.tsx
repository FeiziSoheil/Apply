"use client";

import {
  useCallback,
  useEffect,
  useState,
  useSyncExternalStore,
  type ReactNode,
} from "react";
import { useRouter } from "next/navigation";
import { ExternalLink, LogOut, Search, UserCircle } from "lucide-react";
import { useSession } from "@/components/auth/auth-provider";
import { Button } from "@/components/ui/button";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command";
import type { AuthArea } from "@/lib/auth/routes";
import { navHref, profileHref } from "./nav-config";
import { useVisibleGroups } from "./use-visible-groups";

const noopSubscribe = () => () => undefined;

/** `true` on Apple platforms (⌘ instead of Ctrl); `false` during SSR */
function useIsApplePlatform(): boolean {
  return useSyncExternalStore(
    noopSubscribe,
    () => /Mac|iPhone|iPad|iPod/.test(navigator.platform),
    () => false,
  );
}

function ShortcutKeys({ children }: { children: ReactNode }) {
  return (
    <kbd className="hidden rounded-sm border bg-muted px-1.5 text-xs font-medium text-muted-foreground tabular-nums sm:inline-block">
      {children}
    </kbd>
  );
}

/**
 * Global search: a top-bar button plus a command palette dialog opened with
 * Ctrl/Cmd+K. It lists the same RBAC-filtered menu as the sidebar, so a user
 * can only jump to sections they may open, plus a few account shortcuts.
 */
export function CommandPalette({ area }: { area: AuthArea }) {
  const router = useRouter();
  const { signOut, isLoggingOut } = useSession();
  const groups = useVisibleGroups(area);
  const [open, setOpen] = useState(false);
  const isApple = useIsApplePlatform();

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key.toLowerCase() === "k" && (event.metaKey || event.ctrlKey)) {
        event.preventDefault();
        setOpen((current) => !current);
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  const run = useCallback((action: () => void) => {
    setOpen(false);
    action();
  }, []);

  const shortcut = isApple ? "⌘K" : "Ctrl K";

  return (
    <>
      <Button
        type="button"
        variant="outline"
        size="sm"
        className="text-muted-foreground sm:w-56 sm:justify-start"
        aria-label="جستجو در پنل"
        aria-keyshortcuts="Control+K Meta+K"
        onClick={() => setOpen(true)}
      >
        <Search data-icon="inline-start" />
        <span className="hidden flex-1 text-start sm:inline">جستجو…</span>
        <ShortcutKeys>{shortcut}</ShortcutKeys>
      </Button>

      <CommandDialog
        open={open}
        onOpenChange={setOpen}
        title="جستجوی سراسری"
        description="برای رفتن به یکی از بخش‌های پنل تایپ کنید."
      >
        <CommandInput placeholder="جستجوی بخش‌ها و میانبرها…" />
        <CommandList>
          <CommandEmpty>نتیجه‌ای پیدا نشد.</CommandEmpty>
          {groups.map((group) => (
            <CommandGroup key={group.id} heading={group.label ?? "ناوبری"}>
              {group.items.map((item) => {
                const href = navHref(area, item);
                const Icon = item.icon;
                return (
                  <CommandItem
                    key={href}
                    value={`${group.label ?? ""} ${item.label}`}
                    keywords={[item.description]}
                    onSelect={() => run(() => router.push(href))}
                  >
                    <Icon aria-hidden />
                    <span>{item.label}</span>
                  </CommandItem>
                );
              })}
            </CommandGroup>
          ))}
          {groups.length > 0 ? <CommandSeparator /> : null}
          <CommandGroup heading="میانبرها">
            <CommandItem
              value="پروفایل حساب کاربری"
              onSelect={() => run(() => router.push(profileHref(area)))}
            >
              <UserCircle aria-hidden />
              <span>پروفایل من</span>
            </CommandItem>
            <CommandItem
              value="بازگشت به سایت صفحه اصلی"
              onSelect={() => run(() => router.push("/"))}
            >
              <ExternalLink aria-hidden />
              <span>بازگشت به سایت</span>
            </CommandItem>
            <CommandItem
              value="خروج از حساب کاربری"
              disabled={isLoggingOut}
              onSelect={() => run(() => void signOut())}
            >
              <LogOut aria-hidden />
              <span>خروج از حساب</span>
            </CommandItem>
          </CommandGroup>
        </CommandList>
      </CommandDialog>
    </>
  );
}
