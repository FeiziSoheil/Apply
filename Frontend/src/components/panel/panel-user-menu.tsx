"use client";

import Link from "next/link";
import { ExternalLink, Loader2, LogOut, UserCircle } from "lucide-react";
import { useSession } from "@/components/auth/auth-provider";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
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
import { ROLE_LABELS } from "@/lib/auth/role-labels";
import type { AuthArea } from "@/lib/auth/routes";
import { profileHref } from "./nav-config";

/** First letters of the first and last word of a (Persian) name */
function getInitials(name: string): string {
  const words = name.trim().split(/\s+/).filter(Boolean);
  const first = words[0]?.charAt(0) ?? "";
  const last = words.length > 1 ? (words[words.length - 1]?.charAt(0) ?? "") : "";
  return `${first}${last}`;
}

/** Avatar menu of the top bar: profile, back to site and logout */
export function PanelUserMenu({ area }: { area: AuthArea }) {
  const { user, isLoggingOut, signOut } = useSession();
  if (!user) return null;

  const contact = user.email ?? user.mobile;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          type="button"
          variant="ghost"
          className="h-9 gap-2 px-1.5"
          aria-label={`منوی کاربر — ${user.name}`}
        >
          <Avatar size="sm">
            <AvatarFallback>{getInitials(user.name)}</AvatarFallback>
          </Avatar>
          <span className="hidden max-w-32 truncate text-sm font-medium md:inline">
            {user.name}
          </span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-64 max-w-[calc(100vw-2rem)]">
        <DropdownMenuLabel className="flex items-center gap-3 py-2">
          <Avatar>
            <AvatarFallback>{getInitials(user.name)}</AvatarFallback>
          </Avatar>
          <span className="flex min-w-0 flex-col gap-1">
            <span className="truncate text-sm font-medium text-foreground">
              {user.name}
            </span>
            {contact ? (
              <span
                dir="ltr"
                className="truncate text-start text-xs text-muted-foreground"
              >
                {contact}
              </span>
            ) : null}
            <Badge variant="secondary" className="w-fit">
              {ROLE_LABELS[user.role]}
            </Badge>
          </span>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuGroup>
          <DropdownMenuItem asChild>
            <Link href={profileHref(area)}>
              <UserCircle />
              پروفایل
            </Link>
          </DropdownMenuItem>
          <DropdownMenuItem asChild>
            <Link href="/">
              <ExternalLink />
              بازگشت به سایت
            </Link>
          </DropdownMenuItem>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          variant="destructive"
          disabled={isLoggingOut}
          onSelect={() => void signOut()}
        >
          {isLoggingOut ? <Loader2 className="animate-spin" /> : <LogOut />}
          خروج از حساب
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
