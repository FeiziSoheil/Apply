"use client";

import { useId, useState } from "react";
import type { Editor } from "@tiptap/react";
import { useEditorState } from "@tiptap/react";
import {
  Bold,
  Heading2,
  Heading3,
  Heading4,
  Highlighter,
  ImageIcon,
  Italic,
  Link2,
  Link2Off,
  List,
  ListOrdered,
  Minus,
  Quote,
  Redo2,
  Table,
  Underline as UnderlineIcon,
  Undo2,
  type LucideIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Separator } from "@/components/ui/separator";
import { Toggle } from "@/components/ui/toggle";
import { isAllowedEditorHref } from "../extensions/link";

type ToolDef = {
  id: string;
  label: string;
  icon: LucideIcon;
  isActive: (editor: Editor) => boolean;
  run: (editor: Editor) => void;
};

const MARK_TOOLS: readonly ToolDef[] = [
  {
    id: "bold",
    label: "پررنگ",
    icon: Bold,
    isActive: (e) => e.isActive("bold"),
    run: (e) => e.chain().focus().toggleBold().run(),
  },
  {
    id: "italic",
    label: "مورب",
    icon: Italic,
    isActive: (e) => e.isActive("italic"),
    run: (e) => e.chain().focus().toggleItalic().run(),
  },
  {
    id: "underline",
    label: "زیرخط",
    icon: UnderlineIcon,
    isActive: (e) => e.isActive("underline"),
    run: (e) => e.chain().focus().toggleUnderline().run(),
  },
  {
    id: "highlight",
    label: "هایلایت",
    icon: Highlighter,
    isActive: (e) => e.isActive("highlight"),
    run: (e) => e.chain().focus().toggleHighlight().run(),
  },
];

const BLOCK_TOOLS: readonly ToolDef[] = [
  {
    id: "h2",
    label: "عنوان ۲",
    icon: Heading2,
    isActive: (e) => e.isActive("heading", { level: 2 }),
    run: (e) => e.chain().focus().toggleHeading({ level: 2 }).run(),
  },
  {
    id: "h3",
    label: "عنوان ۳",
    icon: Heading3,
    isActive: (e) => e.isActive("heading", { level: 3 }),
    run: (e) => e.chain().focus().toggleHeading({ level: 3 }).run(),
  },
  {
    id: "h4",
    label: "عنوان ۴",
    icon: Heading4,
    isActive: (e) => e.isActive("heading", { level: 4 }),
    run: (e) => e.chain().focus().toggleHeading({ level: 4 }).run(),
  },
  {
    id: "bulletList",
    label: "فهرست نقطه‌ای",
    icon: List,
    isActive: (e) => e.isActive("bulletList"),
    run: (e) => e.chain().focus().toggleBulletList().run(),
  },
  {
    id: "orderedList",
    label: "فهرست شماره‌دار",
    icon: ListOrdered,
    isActive: (e) => e.isActive("orderedList"),
    run: (e) => e.chain().focus().toggleOrderedList().run(),
  },
  {
    id: "blockquote",
    label: "نقل‌قول",
    icon: Quote,
    isActive: (e) => e.isActive("blockquote"),
    run: (e) => e.chain().focus().toggleBlockquote().run(),
  },
];

function LinkPopover({ editor, disabled }: { editor: Editor; disabled?: boolean }) {
  const [open, setOpen] = useState(false);
  const [url, setUrl] = useState("");
  const [error, setError] = useState<string | null>(null);
  const inputId = useId();
  const active = useEditorState({
    editor,
    selector: (ctx) => ctx.editor.isActive("link"),
  });

  function apply() {
    const href = url.trim();
    if (!href) {
      setError("آدرس پیوند الزامی است");
      return;
    }
    if (!isAllowedEditorHref(href)) {
      setError("فقط http، https، mailto یا tel مجاز است");
      return;
    }
    const external = href.startsWith("http://") || href.startsWith("https://");
    editor
      .chain()
      .focus()
      .extendMarkRange("link")
      .setLink({
        href,
        target: external ? "_blank" : undefined,
        rel: external ? "noopener noreferrer" : undefined,
      })
      .run();
    setError(null);
    setOpen(false);
  }

  return (
    <Popover
      open={open}
      onOpenChange={(next) => {
        if (next) {
          setUrl(editor.getAttributes("link").href ?? "");
          setError(null);
        }
        setOpen(next);
      }}
    >
      <PopoverTrigger asChild>
        <Toggle size="sm" pressed={active} disabled={disabled} aria-label="پیوند">
          <Link2 aria-hidden />
        </Toggle>
      </PopoverTrigger>
      <PopoverContent align="start" className="w-80">
        <label htmlFor={inputId} className="text-sm font-medium">
          نشانی پیوند
        </label>
        <Input
          id={inputId}
          dir="ltr"
          value={url}
          placeholder="https:// یا mailto: یا tel:"
          className="mt-1.5 text-start"
          aria-invalid={Boolean(error)}
          onChange={(e) => setUrl(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              apply();
            }
          }}
        />
        {error ? (
          <p className="mt-1 text-xs text-destructive" role="alert">
            {error}
          </p>
        ) : (
          <p className="mt-1 text-xs text-muted-foreground">
            پروتکل‌های مجاز: http، https، mailto، tel
          </p>
        )}
        <div className="mt-3 flex gap-2">
          <Button type="button" size="sm" onClick={apply}>
            اعمال
          </Button>
          {active ? (
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={() => {
                editor.chain().focus().extendMarkRange("link").unsetLink().run();
                setOpen(false);
              }}
            >
              <Link2Off data-icon="inline-start" aria-hidden />
              حذف
            </Button>
          ) : null}
        </div>
      </PopoverContent>
    </Popover>
  );
}

function TableTools({ editor, disabled }: { editor: Editor; disabled?: boolean }) {
  const inTable = useEditorState({
    editor,
    selector: (ctx) => ctx.editor.isActive("table"),
  });

  if (!inTable) return null;

  return (
    <>
      <Separator orientation="vertical" className="mx-1 h-5" />
      <Button
        type="button"
        size="sm"
        variant="ghost"
        disabled={disabled}
        onClick={() => editor.chain().focus().addRowBefore().run()}
        aria-label="افزودن ردیف بالا"
      >
        ردیف↑
      </Button>
      <Button
        type="button"
        size="sm"
        variant="ghost"
        disabled={disabled}
        onClick={() => editor.chain().focus().addRowAfter().run()}
        aria-label="افزودن ردیف پایین"
      >
        ردیف↓
      </Button>
      <Button
        type="button"
        size="sm"
        variant="ghost"
        disabled={disabled}
        onClick={() => editor.chain().focus().deleteRow().run()}
        aria-label="حذف ردیف"
      >
        حذف ردیف
      </Button>
      <Button
        type="button"
        size="sm"
        variant="ghost"
        disabled={disabled}
        onClick={() => editor.chain().focus().addColumnBefore().run()}
        aria-label="افزودن ستون قبل"
      >
        ستون←
      </Button>
      <Button
        type="button"
        size="sm"
        variant="ghost"
        disabled={disabled}
        onClick={() => editor.chain().focus().addColumnAfter().run()}
        aria-label="افزودن ستون بعد"
      >
        ستون→
      </Button>
      <Button
        type="button"
        size="sm"
        variant="ghost"
        disabled={disabled}
        onClick={() => editor.chain().focus().deleteColumn().run()}
        aria-label="حذف ستون"
      >
        حذف ستون
      </Button>
      <Button
        type="button"
        size="sm"
        variant="ghost"
        disabled={disabled}
        onClick={() => editor.chain().focus().toggleHeaderRow().run()}
        aria-label="ردیف عنوان"
      >
        ردیف عنوان
      </Button>
      <Button
        type="button"
        size="sm"
        variant="ghost"
        disabled={disabled}
        onClick={() => editor.chain().focus().deleteTable().run()}
        aria-label="حذف جدول"
      >
        حذف جدول
      </Button>
    </>
  );
}

type ContentToolbarProps = {
  editor: Editor;
  disabled?: boolean;
  onRequestImage: () => void;
};

export function ContentToolbar({
  editor,
  disabled,
  onRequestImage,
}: ContentToolbarProps) {
  const state = useEditorState({
    editor,
    selector: (ctx) => ({
      active: [...MARK_TOOLS, ...BLOCK_TOOLS]
        .filter((t) => t.isActive(ctx.editor))
        .map((t) => t.id),
      canUndo: ctx.editor.can().undo(),
      canRedo: ctx.editor.can().redo(),
    }),
    equalityFn: (a, b) =>
      b !== null &&
      a.canUndo === b.canUndo &&
      a.canRedo === b.canRedo &&
      a.active.join() === b.active.join(),
  });

  return (
    <div
      role="toolbar"
      aria-label="نوار ابزار ویرایشگر محتوا"
      aria-disabled={disabled}
      className="sticky top-0 z-10 flex max-w-full flex-wrap items-center gap-0.5 overflow-x-auto border-b border-border bg-muted/40 p-1"
    >
      {MARK_TOOLS.map((tool) => (
        <Toggle
          key={tool.id}
          size="sm"
          disabled={disabled}
          pressed={state.active.includes(tool.id)}
          onPressedChange={() => tool.run(editor)}
          aria-label={tool.label}
          title={tool.label}
        >
          <tool.icon aria-hidden />
        </Toggle>
      ))}
      <LinkPopover editor={editor} disabled={disabled} />
      <Separator orientation="vertical" className="mx-1 h-5" />
      {BLOCK_TOOLS.map((tool) => (
        <Toggle
          key={tool.id}
          size="sm"
          disabled={disabled}
          pressed={state.active.includes(tool.id)}
          onPressedChange={() => tool.run(editor)}
          aria-label={tool.label}
          title={tool.label}
        >
          <tool.icon aria-hidden />
        </Toggle>
      ))}
      <Button
        type="button"
        size="icon-sm"
        variant="ghost"
        disabled={disabled}
        onClick={() => editor.chain().focus().setHorizontalRule().run()}
        aria-label="خط جداکننده"
        title="خط جداکننده"
      >
        <Minus aria-hidden />
      </Button>
      <Button
        type="button"
        size="icon-sm"
        variant="ghost"
        disabled={disabled}
        onClick={() =>
          editor
            .chain()
            .focus()
            .insertTable({ rows: 3, cols: 3, withHeaderRow: true })
            .run()
        }
        aria-label="درج جدول"
        title="جدول"
      >
        <Table aria-hidden />
      </Button>
      <Button
        type="button"
        size="icon-sm"
        variant="ghost"
        disabled={disabled}
        onClick={onRequestImage}
        aria-label="درج تصویر"
        title="تصویر"
      >
        <ImageIcon aria-hidden />
      </Button>
      <TableTools editor={editor} disabled={disabled} />
      <Separator orientation="vertical" className="mx-1 h-5" />
      <Button
        type="button"
        variant="ghost"
        size="icon-sm"
        disabled={disabled || !state.canUndo}
        onClick={() => editor.chain().focus().undo().run()}
        aria-label="بازگردانی"
      >
        <Undo2 aria-hidden />
      </Button>
      <Button
        type="button"
        variant="ghost"
        size="icon-sm"
        disabled={disabled || !state.canRedo}
        onClick={() => editor.chain().focus().redo().run()}
        aria-label="انجام دوباره"
      >
        <Redo2 aria-hidden />
      </Button>
    </div>
  );
}
