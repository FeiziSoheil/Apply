"use client";

import type { FieldValues } from "react-hook-form";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { EntityFormBody, type EntityFormProps } from "./entity-form-body";

type EntityFormDialogProps<TValues extends FieldValues> =
  EntityFormProps<TValues> & {
    /** Dialog width: `md` (default) or `lg` for longer forms */
    size?: "md" | "lg";
  };

/**
 * Create / edit form in a centered dialog (use for short forms).
 * For long forms prefer `EntityFormDrawer`.
 *
 * Controlled by the page: render one instance per domain and set `open` +
 * `defaultValues` (empty for create, the entity for edit).
 */
export function EntityFormDialog<TValues extends FieldValues>({
  open,
  onOpenChange,
  title,
  description,
  size = "md",
  ...form
}: EntityFormDialogProps<TValues>) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className={cn(
          "max-h-[calc(100dvh-2rem)] grid-rows-[minmax(0,1fr)]",
          size === "lg" ? "sm:max-w-2xl" : "sm:max-w-lg",
        )}
        onInteractOutside={(event) => event.preventDefault()}
      >
        <EntityFormBody
          {...form}
          onOpenChange={onOpenChange}
          header={
            <DialogHeader>
              <DialogTitle>{title}</DialogTitle>
              <DialogDescription>{description ?? "اطلاعات را وارد کنید."}</DialogDescription>
            </DialogHeader>
          }
        />
      </DialogContent>
    </Dialog>
  );
}
