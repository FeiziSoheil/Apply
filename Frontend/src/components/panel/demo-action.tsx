"use client";

import type { LucideIcon } from "lucide-react";
import { toast } from "sonner";
import { Can } from "@/components/rbac/can";
import { Button } from "@/components/ui/button";
import type { Permission } from "@/lib/rbac/permissions";

type DemoActionProps = {
  label: string;
  /** The button is rendered only for users holding it */
  permission?: Permission;
  tone?: "default" | "destructive" | "primary";
  icon?: LucideIcon;
};

/**
 * Demo button of a not-yet-built feature: shows when the user holds the
 * permission (`<Can>`) and announces «coming soon» on click.
 */
export function DemoAction({
  label,
  permission,
  tone = "default",
  icon: Icon,
}: DemoActionProps) {
  const button = (
    <Button
      type="button"
      variant={
        tone === "destructive"
          ? "destructive"
          : tone === "primary"
            ? "default"
            : "outline"
      }
      onClick={() =>
        toast.info(`«${label}» — این عملیات به‌زودی فعال می‌شود`)
      }
    >
      {Icon ? <Icon data-icon="inline-start" /> : null}
      {label}
    </Button>
  );

  return permission ? <Can permission={permission}>{button}</Can> : button;
}
