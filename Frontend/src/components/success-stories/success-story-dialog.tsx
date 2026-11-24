"use client";

import Image from "next/image";
import { Play } from "lucide-react";
import type { SuccessStory } from "@/types";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { toPersianDigits } from "@/lib/format";

type SuccessStoryDialogProps = {
  story: SuccessStory | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export function SuccessStoryDialog({
  story,
  open,
  onOpenChange,
}: SuccessStoryDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        {story ? (
          <>
            <DialogHeader>
              <DialogTitle>{story.studentName}</DialogTitle>
              <DialogDescription>
                {story.university} — {story.country} · {story.field} (
                {toPersianDigits(story.year)})
              </DialogDescription>
            </DialogHeader>

            {story.photo ? (
              <div className="relative mx-auto size-20 overflow-hidden rounded-full bg-muted">
                <Image
                  src={story.photo}
                  alt={`عکس ${story.studentName}`}
                  fill
                  className="object-cover"
                  sizes="80px"
                />
              </div>
            ) : null}

            <blockquote className="border-s-2 border-primary ps-4 text-sm text-foreground">
              «{story.quote}»
            </blockquote>

            {story.body ? (
              <p className="text-sm leading-7 text-muted-foreground">
                {story.body}
              </p>
            ) : null}

            {story.videoUrl ? (
              <div
                className="flex aspect-video flex-col items-center justify-center gap-2 rounded-xl bg-muted text-muted-foreground"
                role="img"
                aria-label="پیش‌نمایش ویدیو داستان موفقیت"
              >
                <span className="flex size-14 items-center justify-center rounded-full bg-primary text-primary-foreground">
                  <Play className="size-6 ms-0.5" aria-hidden />
                </span>
                <p className="text-sm">ویدیو به‌زودی در دسترس قرار می‌گیرد</p>
              </div>
            ) : null}
          </>
        ) : null}
      </DialogContent>
    </Dialog>
  );
}
