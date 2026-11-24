"use client";

import {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useState,
} from "react";
import type { Editor, Range } from "@tiptap/core";
import { cn } from "@/lib/utils";
import { filterSlashItems, type SlashItem } from "./slash-items";

export type SlashMenuHandle = {
  onKeyDown: (props: { event: KeyboardEvent }) => boolean;
};

type SlashMenuProps = {
  editor: Editor;
  range: Range;
  query: string;
  items?: SlashItem[];
  command: (item: SlashItem) => void;
};

export const SlashMenu = forwardRef<SlashMenuHandle, SlashMenuProps>(
  function SlashMenu({ query, command }, ref) {
    const items = filterSlashItems(query);
    const [selected, setSelected] = useState(0);

    useEffect(() => {
      setSelected(0);
    }, [query]);

    useImperativeHandle(ref, () => ({
      onKeyDown: ({ event }) => {
        if (event.key === "ArrowDown") {
          event.preventDefault();
          setSelected((i) => (i + 1) % Math.max(items.length, 1));
          return true;
        }
        if (event.key === "ArrowUp") {
          event.preventDefault();
          setSelected((i) => (i - 1 + items.length) % Math.max(items.length, 1));
          return true;
        }
        if (event.key === "Enter") {
          event.preventDefault();
          const item = items[selected];
          if (item) command(item);
          return true;
        }
        return false;
      },
    }));

    if (!items.length) {
      return (
        <div
          role="listbox"
          aria-label="فهرست دستورات اسلش"
          className="w-64 rounded-lg border border-border bg-popover p-3 text-sm text-muted-foreground shadow-md"
        >
          موردی یافت نشد
        </div>
      );
    }

    return (
      <div
        role="listbox"
        aria-label="فهرست دستورات اسلش"
        className="max-h-72 w-64 overflow-y-auto rounded-lg border border-border bg-popover p-1 shadow-md"
      >
        {items.map((item, index) => (
          <button
            key={item.id}
            type="button"
            role="option"
            aria-selected={index === selected}
            className={cn(
              "flex w-full items-start gap-2 rounded-md px-2 py-1.5 text-start text-sm",
              index === selected
                ? "bg-accent text-accent-foreground"
                : "hover:bg-muted",
            )}
            onMouseEnter={() => setSelected(index)}
            onClick={() => command(item)}
          >
            <item.icon className="mt-0.5 size-4 shrink-0" aria-hidden />
            <span className="min-w-0">
              <span className="block font-medium">{item.title}</span>
              <span className="block text-xs text-muted-foreground">
                {item.description}
              </span>
            </span>
          </button>
        ))}
      </div>
    );
  },
);
