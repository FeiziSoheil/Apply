"use client";

import type { ReactNode } from "react";
import { MoreHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

type RowActionsMenuProps = {
  /** برچسب دسترس‌پذیر دکمه، مثلاً «عملیات آلمان» */
  label: string;
  children: ReactNode;
  align?: "start" | "center" | "end";
};

/**
 * منوی فشردهٔ عملیات ردیف برای ستون آخر DataTable.
 * به‌جای چند دکمهٔ جدا، یک تریگر ⋯ و آیتم‌های DropdownMenu.
 */
export function RowActionsMenu({
  label,
  children,
  align = "end",
}: RowActionsMenuProps) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          type="button"
          size="icon-sm"
          variant="ghost"
          aria-label={label}
        >
          <MoreHorizontal aria-hidden className="size-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align={align} className="min-w-40">
        {children}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
