"use client";

import type { ReactNode } from "react";
import { AlertTriangle, HelpCircle } from "lucide-react";
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogMedia,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { cn } from "@/lib/utils";

export type ConfirmDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: ReactNode;
  confirmLabel?: string;
  cancelLabel?: string;
  /** `destructive` for delete; `default` for status changes */
  tone?: "default" | "destructive";
  /** Disables both buttons and shows a spinner on the confirm button */
  isPending?: boolean;
  /**
   * Runs on confirm. The dialog stays open until the caller closes it
   * (`onOpenChange(false)`), so a failed request can keep it open.
   */
  onConfirm: () => void | Promise<void>;
};

/**
 * Confirmation prompt for destructive or sensitive actions (delete, status
 * change). Controlled: the caller owns `open`, and closes it after success.
 */
export function ConfirmDialog({
  open,
  onOpenChange,
  title,
  description,
  confirmLabel = "تأیید",
  cancelLabel = "انصراف",
  tone = "default",
  isPending = false,
  onConfirm,
}: ConfirmDialogProps) {
  const destructive = tone === "destructive";
  const Icon = destructive ? AlertTriangle : HelpCircle;

  return (
    <AlertDialog
      open={open}
      onOpenChange={(next) => {
        if (isPending && !next) return; // not dismissible while the request runs
        onOpenChange(next);
      }}
    >
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogMedia
            className={cn(
              destructive
                ? "bg-destructive/10 text-destructive"
                : "bg-primary/10 text-primary",
            )}
          >
            <Icon aria-hidden />
          </AlertDialogMedia>
          <AlertDialogTitle>{title}</AlertDialogTitle>
          {description ? (
            <AlertDialogDescription>{description}</AlertDialogDescription>
          ) : null}
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isPending}>{cancelLabel}</AlertDialogCancel>
          <Button
            type="button"
            variant={destructive ? "destructive" : "default"}
            disabled={isPending}
            onClick={() => void onConfirm()}
          >
            {isPending ? <Spinner data-icon="inline-start" aria-label="در حال انجام" /> : null}
            {confirmLabel}
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
