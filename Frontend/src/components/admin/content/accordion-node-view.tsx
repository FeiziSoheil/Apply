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
import {
  emptyRichContentDoc,
  paragraphDoc,
  type RichContent,
} from "@/contracts/richcontent";
import { richContentToPlainText } from "@/lib/richcontent";
import { cn } from "@/lib/utils";
import type { AccordionItem } from "./extensions/accordion";

type AccordionRow = AccordionItem & { key: string };

function withKeys(items: AccordionItem[]): AccordionRow[] {
  return items.map((item, index) => ({
    ...item,
    key: `faq-${index}-${item.question.slice(0, 16)}`,
  }));
}

function stripKeys(rows: AccordionRow[]): AccordionItem[] {
  return rows.map(({ question, answer }) => ({ question, answer }));
}

function answerFromPlain(text: string): RichContent {
  const trimmed = text.trim();
  return trimmed ? paragraphDoc(trimmed) : emptyRichContentDoc();
}

export function AccordionNodeView({
  node,
  updateAttributes,
  deleteNode,
  selected,
}: NodeViewProps) {
  const baseId = useId();
  const items = Array.isArray(node.attrs.items)
    ? (node.attrs.items as AccordionItem[])
    : [];
  const rows = withKeys(items);

  function commit(next: AccordionItem[]) {
    updateAttributes({
      items: next.length
        ? next
        : [{ question: "", answer: emptyRichContentDoc() }],
    });
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
        <p className="text-sm font-medium text-foreground">پرسش و پاسخ</p>
        <Button
          type="button"
          size="sm"
          variant="ghost"
          className="ms-auto"
          onClick={deleteNode}
          aria-label="حذف آکاردئون"
        >
          <Trash2 data-icon="inline-start" aria-hidden />
          حذف
        </Button>
      </div>

      <SortableList
        label="فهرست پرسش و پاسخ"
        items={rows}
        getId={(row) => row.key}
        onReorder={(next) => commit(stripKeys(next))}
        renderItem={(row, { index, dragHandle }) => (
          <div className="flex gap-2 rounded-md border border-border bg-background p-2">
            {dragHandle}
            <div className="flex min-w-0 flex-1 flex-col gap-2">
              <div className="flex flex-col gap-1">
                <Label htmlFor={`${baseId}-q-${index}`}>سوال {index + 1}</Label>
                <Input
                  id={`${baseId}-q-${index}`}
                  value={row.question}
                  onChange={(e) => {
                    const next = [...items];
                    next[index] = { ...next[index]!, question: e.target.value };
                    commit(next);
                  }}
                  maxLength={300}
                />
              </div>
              <div className="flex flex-col gap-1">
                <Label htmlFor={`${baseId}-a-${index}`}>پاسخ {index + 1}</Label>
                <Textarea
                  id={`${baseId}-a-${index}`}
                  value={richContentToPlainText(row.answer)}
                  onChange={(e) => {
                    const next = [...items];
                    next[index] = {
                      ...next[index]!,
                      answer: answerFromPlain(e.target.value),
                    };
                    commit(next);
                  }}
                  rows={3}
                  aria-describedby={`${baseId}-a-hint-${index}`}
                />
                <p
                  id={`${baseId}-a-hint-${index}`}
                  className="text-xs text-muted-foreground"
                >
                  پاسخ به‌صورت متن ساده ذخیره می‌شود (RichContent پاراگراف).
                </p>
              </div>
            </div>
            <Button
              type="button"
              size="sm"
              variant="ghost"
              disabled={items.length <= 1}
              onClick={() => commit(items.filter((_, i) => i !== index))}
              aria-label={`حذف آیتم ${index + 1}`}
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
        disabled={items.length >= 30}
        onClick={() =>
          commit([
            ...items,
            {
              question: "سوال جدید",
              answer: paragraphDoc("پاسخ را بنویسید."),
            },
          ])
        }
      >
        <Plus data-icon="inline-start" aria-hidden />
        افزودن سوال
      </Button>
    </NodeViewWrapper>
  );
}
