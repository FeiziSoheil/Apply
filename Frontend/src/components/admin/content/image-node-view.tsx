"use client";

import { useId, useState } from "react";
import type { NodeViewProps } from "@tiptap/react";
import { NodeViewWrapper } from "@tiptap/react";
import { ImageIcon, Pencil } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

export function ImageNodeView({ node, updateAttributes, selected }: NodeViewProps) {
  const altId = useId();
  const captionId = useId();
  const [open, setOpen] = useState(false);
  const [altDraft, setAltDraft] = useState(String(node.attrs.alt ?? ""));
  const [captionDraft, setCaptionDraft] = useState(String(node.attrs.caption ?? ""));

  const src = typeof node.attrs.src === "string" ? node.attrs.src : "";
  const alt = typeof node.attrs.alt === "string" ? node.attrs.alt : "";
  const caption = typeof node.attrs.caption === "string" ? node.attrs.caption : "";
  const missingAlt = !alt.trim();

  function openEditor() {
    setAltDraft(alt);
    setCaptionDraft(caption);
    setOpen(true);
  }

  function saveMeta() {
    const nextAlt = altDraft.trim();
    updateAttributes({
      alt: nextAlt,
      caption: captionDraft.trim() || null,
    });
    setOpen(false);
  }

  return (
    <NodeViewWrapper
      as="figure"
      className={cn(
        "my-4 overflow-hidden rounded-lg border border-border bg-muted/20",
        selected && "ring-2 ring-ring",
        missingAlt && "border-warning",
      )}
      data-drag-handle
    >
      {src ? (
        // eslint-disable-next-line @next/next/no-img-element -- mock/local file URLs from upload handler
        <img src={src} alt={alt || "تصویر بدون متن جایگزین"} className="h-auto max-w-full" />
      ) : (
        <div className="flex aspect-video items-center justify-center gap-2 text-sm text-muted-foreground">
          <ImageIcon aria-hidden className="size-5" />
          تصویر (پیش‌نمایش در دسترس نیست)
        </div>
      )}

      <figcaption className="flex flex-wrap items-center gap-2 border-t border-border px-3 py-2 text-sm">
        <span className="min-w-0 flex-1 text-muted-foreground">
          {caption || (missingAlt ? "متن جایگزین الزامی است" : alt)}
        </span>
        {missingAlt ? (
          <span className="text-xs text-warning-foreground" role="status">
            هشدار: alt خالی است — ذخیرهٔ سند رد می‌شود یا تصویر حذف می‌شود
          </span>
        ) : null}
        <Button
          type="button"
          size="sm"
          variant="outline"
          onClick={openEditor}
          aria-label="ویرایش متن جایگزین و توضیح تصویر"
        >
          <Pencil data-icon="inline-start" aria-hidden />
          ویرایش
        </Button>
      </figcaption>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>تنظیمات تصویر</DialogTitle>
          </DialogHeader>
          <div className="flex flex-col gap-3">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor={altId}>متن جایگزین (الزامی)</Label>
              <Input
                id={altId}
                value={altDraft}
                onChange={(e) => setAltDraft(e.target.value)}
                aria-required
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor={captionId}>توضیح (اختیاری)</Label>
              <Input
                id={captionId}
                value={captionDraft}
                onChange={(e) => setCaptionDraft(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              انصراف
            </Button>
            <Button type="button" onClick={saveMeta} disabled={!altDraft.trim()}>
              ذخیره
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </NodeViewWrapper>
  );
}
