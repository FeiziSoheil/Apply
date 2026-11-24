"use client";

import { useId } from "react";
import type { NodeViewProps } from "@tiptap/react";
import { NodeViewWrapper } from "@tiptap/react";
import { Plus, Trash2 } from "lucide-react";
import { SortableList } from "@/components/admin/fields/sortable-list";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import type { StepsItem } from "./extensions/steps";

type StepsItemRow = StepsItem & { key: string };

function withKeys(items: StepsItem[]): StepsItemRow[] {
  return items.map((item, index) => ({
    ...item,
    key: `step-${index}-${item.title.slice(0, 12)}`,
  }));
}

function stripKeys(rows: StepsItemRow[]): StepsItem[] {
  return rows.map(({ title, description }) => ({ title, description }));
}

export function StepsNodeView({
  node,
  updateAttributes,
  deleteNode,
  selected,
}: NodeViewProps) {
  const baseId = useId();
  const items = Array.isArray(node.attrs.items)
    ? (node.attrs.items as StepsItem[])
    : [];
  const rows = withKeys(items);

  function commit(next: StepsItem[]) {
    updateAttributes({ items: next.length ? next : [{ title: "", description: "" }] });
  }

  return (
    <NodeViewWrapper
      className={cn(
        "my-4 rounded-lg border border-border bg-muted/20 p-3",
        selected && "ring-2 ring-ring",
      )}
      data-drag-handle
    >
      <div className="mb-3 flex items-center gap-2">
        <p className="text-sm font-medium text-foreground">مراحل</p>
        <Button
          type="button"
          size="sm"
          variant="ghost"
          className="ms-auto"
          onClick={deleteNode}
          aria-label="حذف بلوک مراحل"
        >
          <Trash2 data-icon="inline-start" aria-hidden />
          حذف
        </Button>
      </div>

      <SortableList
        label="فهرست مراحل"
        items={rows}
        getId={(row) => row.key}
        onReorder={(next) => commit(stripKeys(next))}
        renderItem={(row, { index, dragHandle }) => (
          <div className="flex gap-2 rounded-md border border-border bg-background p-2">
            {dragHandle}
            <span
              className="flex size-7 shrink-0 items-center justify-center rounded-full bg-primary/10 text-sm font-medium text-primary"
              aria-hidden
            >
              {index + 1}
            </span>
            <div className="flex min-w-0 flex-1 flex-col gap-2">
              <div className="flex flex-col gap-1">
                <Label htmlFor={`${baseId}-title-${index}`}>عنوان گام {index + 1}</Label>
                <Input
                  id={`${baseId}-title-${index}`}
                  value={row.title}
                  onChange={(e) => {
                    const next = [...items];
                    next[index] = { ...next[index]!, title: e.target.value };
                    commit(next);
                  }}
                  maxLength={160}
                />
              </div>
              <div className="flex flex-col gap-1">
                <Label htmlFor={`${baseId}-desc-${index}`}>توضیح گام {index + 1}</Label>
                <Textarea
                  id={`${baseId}-desc-${index}`}
                  value={row.description}
                  onChange={(e) => {
                    const next = [...items];
                    next[index] = {
                      ...next[index]!,
                      description: e.target.value,
                    };
                    commit(next);
                  }}
                  maxLength={2000}
                  rows={2}
                />
              </div>
            </div>
            <Button
              type="button"
              size="sm"
              variant="ghost"
              disabled={items.length <= 1}
              onClick={() => commit(items.filter((_, i) => i !== index))}
              aria-label={`حذف گام ${index + 1}`}
            >
              <Trash2 aria-hidden className="size-4" />
            </Button>
          </div>
        )}
      />

      <Button
        type="button"
        size="sm"
        variant="outline"
        className="mt-2"
        disabled={items.length >= 20}
        onClick={() =>
          commit([
            ...items,
            {
              title: `گام ${items.length + 1}`,
              description: "توضیح این گام را بنویسید.",
            },
          ])
        }
      >
        <Plus data-icon="inline-start" aria-hidden />
        افزودن گام
      </Button>
    </NodeViewWrapper>
  );
}
