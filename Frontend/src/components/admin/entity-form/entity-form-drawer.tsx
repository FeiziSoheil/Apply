"use client";

import type { FieldValues } from "react-hook-form";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { EntityFormBody, type EntityFormProps } from "./entity-form-body";

/**
 * Create / edit form in a side drawer (full width on mobile). Best for long
 * forms: the fields scroll while the header and the save button stay visible.
 */
export function EntityFormDrawer<TValues extends FieldValues>({
  open,
  onOpenChange,
  title,
  description,
  ...form
}: EntityFormProps<TValues>) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="end"
        className="gap-0 data-[side=end]:w-full data-[side=end]:sm:max-w-2xl"
        onInteractOutside={(event) => event.preventDefault()}
      >
        <EntityFormBody
          {...form}
          onOpenChange={onOpenChange}
          fieldsClassName="px-4 pb-4"
          footerClassName="border-t bg-muted/50 p-4"
          header={
            <SheetHeader className="border-b pe-12">
              <SheetTitle>{title}</SheetTitle>
              <SheetDescription>
                {description ?? "اطلاعات را وارد کنید."}
              </SheetDescription>
            </SheetHeader>
          }
        />
      </SheetContent>
    </Sheet>
  );
}
