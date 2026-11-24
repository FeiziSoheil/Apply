"use client";

import type { ReactNode } from "react";
import type { RichContent } from "@/contracts/richcontent";
import { RichContentRenderer } from "@/components/shared/richcontent";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";

type RichContentPreviewSheetProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title?: string;
  description?: ReactNode;
  doc: RichContent;
  previewPath?: string;
};

/** Public-style RichContent preview in a side sheet (same pattern as sections). */
export function RichContentPreviewSheet({
  open,
  onOpenChange,
  title = "پیش‌نمایش محتوا",
  description,
  doc,
  previewPath,
}: RichContentPreviewSheetProps) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="end"
        className="flex w-full flex-col sm:max-w-xl"
        aria-describedby={undefined}
      >
        <SheetHeader>
          <SheetTitle>{title}</SheetTitle>
          <SheetDescription>
            {description ??
              "رندر همان ویجت‌های سایت عمومی روی پیش‌نویس فعلی فرم."}
            {previewPath ? (
              <>
                {" "}
                صفحهٔ منتشرشده:{" "}
                <a
                  href={`${previewPath}${previewPath.includes("?") ? "&" : "?"}preview=1`}
                  className="font-mono text-xs text-primary underline-offset-4 hover:underline"
                  dir="ltr"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  {previewPath}?preview=1
                </a>
              </>
            ) : null}
          </SheetDescription>
        </SheetHeader>
        <div className="min-h-0 flex-1 overflow-y-auto px-4 pb-6">
          <article className="prose prose-neutral max-w-none dark:prose-invert">
            <RichContentRenderer doc={doc} />
          </article>
        </div>
      </SheetContent>
    </Sheet>
  );
}
