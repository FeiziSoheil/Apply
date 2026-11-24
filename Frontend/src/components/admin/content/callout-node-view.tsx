"use client";

import { useId } from "react";
import type { NodeViewProps } from "@tiptap/react";
import { NodeViewContent, NodeViewWrapper } from "@tiptap/react";
import {
  AlertTriangle,
  CheckCircle2,
  Info,
  Trash2,
  XCircle,
} from "lucide-react";
import { CALLOUT_TYPES, type CalloutType } from "@/contracts/richcontent";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";

const CALLOUT_META: Record<
  CalloutType,
  { label: string; icon: typeof Info; shell: string; iconClass: string }
> = {
  info: {
    label: "اطلاعات",
    icon: Info,
    shell: "border-info/40 bg-info/5",
    iconClass: "text-info",
  },
  warning: {
    label: "هشدار",
    icon: AlertTriangle,
    shell: "border-warning/40 bg-warning/10",
    iconClass: "text-warning-foreground",
  },
  success: {
    label: "موفقیت",
    icon: CheckCircle2,
    shell: "border-success/40 bg-success/5",
    iconClass: "text-success",
  },
  danger: {
    label: "خطر",
    icon: XCircle,
    shell: "border-destructive/40 bg-destructive/5",
    iconClass: "text-destructive",
  },
};

export function CalloutNodeView({
  node,
  updateAttributes,
  deleteNode,
  selected,
}: NodeViewProps) {
  const typeId = useId();
  const type = (node.attrs.type as CalloutType) ?? "info";
  const meta = CALLOUT_META[type] ?? CALLOUT_META.info;
  const Icon = meta.icon;

  return (
    <NodeViewWrapper
      as="aside"
      className={cn(
        "my-4 rounded-lg border p-3",
        meta.shell,
        selected && "ring-2 ring-ring",
      )}
      data-drag-handle
    >
      <div className="mb-2 flex flex-wrap items-center gap-2">
        <Icon aria-hidden className={cn("size-4 shrink-0", meta.iconClass)} />
        <Label className="sr-only" htmlFor={typeId}>
          نوع کادر توجه
        </Label>
        <Select
          value={type}
          onValueChange={(value) => {
            if ((CALLOUT_TYPES as readonly string[]).includes(value)) {
              updateAttributes({ type: value as CalloutType });
            }
          }}
        >
          <SelectTrigger
            id={typeId}
            size="sm"
            className="w-36 bg-background/80"
            aria-label="نوع کادر توجه"
          >
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {CALLOUT_TYPES.map((key) => (
              <SelectItem key={key} value={key}>
                {CALLOUT_META[key].label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button
          type="button"
          size="sm"
          variant="ghost"
          className="ms-auto"
          onClick={deleteNode}
          aria-label="حذف کادر توجه"
        >
          <Trash2 data-icon="inline-start" aria-hidden />
          حذف
        </Button>
      </div>
      <NodeViewContent className="callout-content min-w-0 text-sm leading-relaxed outline-none" />
    </NodeViewWrapper>
  );
}
