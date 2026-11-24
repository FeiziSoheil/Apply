"use client";

import { useId } from "react";
import type { NodeViewProps } from "@tiptap/react";
import { NodeViewWrapper } from "@tiptap/react";
import { Trash2 } from "lucide-react";
import {
  CTA_BUTTON_TYPES,
  type CtaButtonType,
} from "@/contracts/richcontent";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";

const TYPE_LABELS: Record<CtaButtonType, string> = {
  assessment: "ارزیابی",
  booking: "رزرو مشاوره",
  link: "لینک سفارشی",
};

function isInternalPathOrHttps(href: string): boolean {
  if (href.startsWith("/") && !href.startsWith("//")) {
    return href.length <= 500 && !href.includes(" ");
  }
  try {
    return new URL(href).protocol === "https:";
  } catch {
    return false;
  }
}

export function CtaButtonNodeView({
  node,
  updateAttributes,
  deleteNode,
  selected,
}: NodeViewProps) {
  const textId = useId();
  const hrefId = useId();
  const text = typeof node.attrs.text === "string" ? node.attrs.text : "";
  const type = (node.attrs.type as CtaButtonType) ?? "assessment";
  const href = typeof node.attrs.href === "string" ? node.attrs.href : "";
  const hrefInvalid =
    type === "link" && href.trim().length > 0 && !isInternalPathOrHttps(href.trim());
  const hrefMissing = type === "link" && !href.trim();

  const previewHref =
    type === "assessment" ? "/assessment" : type === "booking" ? "/booking" : href || "#";

  return (
    <NodeViewWrapper
      className={cn(
        "my-4 rounded-lg border border-border bg-muted/20 p-3",
        selected && "ring-2 ring-ring",
      )}
      data-drag-handle
    >
      <div className="mb-3 flex flex-wrap items-center gap-2">
        <p className="text-sm font-medium">دکمه فراخوان</p>
        <Button
          type="button"
          size="sm"
          variant="ghost"
          className="ms-auto"
          onClick={deleteNode}
          aria-label="حذف دکمه فراخوان"
        >
          <Trash2 data-icon="inline-start" aria-hidden />
          حذف
        </Button>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor={textId}>متن دکمه</Label>
          <Input
            id={textId}
            value={text}
            maxLength={80}
            onChange={(e) => updateAttributes({ text: e.target.value })}
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor={`${textId}-type`}>نوع</Label>
          <Select
            value={type}
            onValueChange={(value) => {
              if ((CTA_BUTTON_TYPES as readonly string[]).includes(value)) {
                const next = value as CtaButtonType;
                updateAttributes({
                  type: next,
                  href: next === "link" ? href || null : null,
                });
              }
            }}
          >
            <SelectTrigger id={`${textId}-type`} aria-label="نوع دکمه فراخوان">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {CTA_BUTTON_TYPES.map((key) => (
                <SelectItem key={key} value={key}>
                  {TYPE_LABELS[key]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        {type === "link" ? (
          <div className="flex flex-col gap-1.5 sm:col-span-2">
            <Label htmlFor={hrefId}>آدرس (مسیر داخلی یا https)</Label>
            <Input
              id={hrefId}
              dir="ltr"
              className="text-start"
              value={href}
              maxLength={500}
              placeholder="/programs یا https://…"
              aria-invalid={hrefInvalid || hrefMissing}
              onChange={(e) =>
                updateAttributes({ href: e.target.value.trim() || null })
              }
            />
            {hrefMissing ? (
              <p className="text-xs text-destructive" role="status">
                برای نوع لینک، آدرس الزامی است
              </p>
            ) : null}
            {hrefInvalid ? (
              <p className="text-xs text-destructive" role="status">
                فقط مسیر داخلی (/…) یا لینک https مجاز است
              </p>
            ) : null}
          </div>
        ) : null}
      </div>

      <div className="mt-3">
        <span className="inline-flex items-center rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground">
          {text || "متن دکمه"}
        </span>
        <p className="mt-1 text-xs text-muted-foreground" dir="ltr">
          {previewHref}
        </p>
      </div>
    </NodeViewWrapper>
  );
}
