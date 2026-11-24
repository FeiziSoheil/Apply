"use client";

import { useId } from "react";
import type { NodeViewProps } from "@tiptap/react";
import { NodeViewWrapper } from "@tiptap/react";
import { ExternalLink, Trash2, Video } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

function isHttpsOnly(href: string): boolean {
  try {
    return new URL(href).protocol === "https:";
  } catch {
    return false;
  }
}

function displayTitle(href: string): string {
  try {
    const url = new URL(href);
    return url.hostname.replace(/^www\./, "") || "ویدیو";
  } catch {
    return "ویدیو";
  }
}

export function VideoLinkNodeView({
  node,
  updateAttributes,
  deleteNode,
  selected,
}: NodeViewProps) {
  const hrefId = useId();
  const href = typeof node.attrs.href === "string" ? node.attrs.href : "";
  const valid = href.trim().length > 0 && isHttpsOnly(href.trim());
  const title = displayTitle(href);

  return (
    <NodeViewWrapper
      className={cn(
        "my-4 overflow-hidden rounded-lg border border-border bg-muted/20",
        selected && "ring-2 ring-ring",
      )}
      data-drag-handle
    >
      <div className="flex items-start gap-3 p-3">
        <div className="flex size-12 shrink-0 items-center justify-center rounded-md bg-primary/10 text-primary">
          <Video aria-hidden className="size-6" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="mb-2 flex flex-wrap items-center gap-2">
            <p className="text-sm font-medium text-foreground">{title}</p>
            {valid ? (
              <a
                href={href}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-xs text-primary underline-offset-4 hover:underline"
                onClick={(e) => e.stopPropagation()}
              >
                مشاهده ویدیو
                <ExternalLink aria-hidden className="size-3" />
              </a>
            ) : null}
            <Button
              type="button"
              size="sm"
              variant="ghost"
              className="ms-auto"
              onClick={deleteNode}
              aria-label="حذف لینک ویدیو"
            >
              <Trash2 data-icon="inline-start" aria-hidden />
              حذف
            </Button>
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor={hrefId}>آدرس ویدیو (فقط https)</Label>
            <Input
              id={hrefId}
              dir="ltr"
              className="text-start"
              value={href}
              maxLength={500}
              placeholder="https://…"
              aria-invalid={!valid}
              onChange={(e) => updateAttributes({ href: e.target.value.trim() })}
            />
            {!valid ? (
              <p className="text-xs text-destructive" role="status">
                لینک ویدیو فقط با https مجاز است
              </p>
            ) : null}
            <p className="text-xs text-muted-foreground">
              بدون embed خارجی — فقط کارت لینک.
            </p>
          </div>
        </div>
      </div>
    </NodeViewWrapper>
  );
}
