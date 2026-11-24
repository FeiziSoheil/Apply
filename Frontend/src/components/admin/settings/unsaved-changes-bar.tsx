"use client";

import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";

type UnsavedChangesBarProps = {
  visible: boolean;
  isSaving?: boolean;
  onSave: () => void;
  onDiscard: () => void;
  saveLabel?: string;
};

/** Sticky bar when a settings tab form is dirty */
export function UnsavedChangesBar({
  visible,
  isSaving,
  onSave,
  onDiscard,
  saveLabel = "ذخیره تغییرات",
}: UnsavedChangesBarProps) {
  if (!visible) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      className="sticky bottom-4 z-20 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border bg-background/95 px-4 py-3 shadow-md backdrop-blur supports-backdrop-filter:bg-background/80"
    >
      <p className="text-sm font-medium">تغییرات ذخیره‌نشده دارید</p>
      <div className="flex items-center gap-2">
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={isSaving}
          onClick={onDiscard}
        >
          لغو
        </Button>
        <Button type="button" size="sm" disabled={isSaving} onClick={onSave}>
          {isSaving ? (
            <Loader2 className="size-4 animate-spin" aria-hidden />
          ) : null}
          {saveLabel}
        </Button>
      </div>
    </div>
  );
}
