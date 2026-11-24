"use client";

import { useEffect, useId, useState } from "react";
import Placeholder from "@tiptap/extension-placeholder";
import { Markdown } from "@tiptap/markdown";
import { EditorContent, useEditor, useEditorState, type Editor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import {
  Bold,
  Heading2,
  Heading3,
  Italic,
  Link2,
  Link2Off,
  List,
  ListOrdered,
  Quote,
  Redo2,
  Strikethrough,
  Undo2,
  type LucideIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Separator } from "@/components/ui/separator";
import { Toggle } from "@/components/ui/toggle";
import { cn } from "@/lib/utils";

type RichTextEditorProps = {
  /** Markdown (the format of `BlogPost.content`) */
  value: string;
  onChange: (markdown: string) => void;
  placeholder?: string;
  disabled?: boolean;
  /** Accessible name of the editing area */
  "aria-label"?: string;
  id?: string;
  "aria-invalid"?: boolean;
  "aria-describedby"?: string;
  className?: string;
};

type ToolDefinition = {
  id: string;
  label: string;
  icon: LucideIcon;
  isActive: (editor: Editor) => boolean;
  run: (editor: Editor) => void;
};

const TOOLS: readonly ToolDefinition[] = [
  {
    id: "bold",
    label: "پررنگ",
    icon: Bold,
    isActive: (editor) => editor.isActive("bold"),
    run: (editor) => editor.chain().focus().toggleBold().run(),
  },
  {
    id: "italic",
    label: "مورب",
    icon: Italic,
    isActive: (editor) => editor.isActive("italic"),
    run: (editor) => editor.chain().focus().toggleItalic().run(),
  },
  {
    id: "strike",
    label: "خط‌خورده",
    icon: Strikethrough,
    isActive: (editor) => editor.isActive("strike"),
    run: (editor) => editor.chain().focus().toggleStrike().run(),
  },
  {
    id: "h2",
    label: "عنوان بزرگ",
    icon: Heading2,
    isActive: (editor) => editor.isActive("heading", { level: 2 }),
    run: (editor) => editor.chain().focus().toggleHeading({ level: 2 }).run(),
  },
  {
    id: "h3",
    label: "عنوان کوچک",
    icon: Heading3,
    isActive: (editor) => editor.isActive("heading", { level: 3 }),
    run: (editor) => editor.chain().focus().toggleHeading({ level: 3 }).run(),
  },
  {
    id: "bulletList",
    label: "فهرست نقطه‌ای",
    icon: List,
    isActive: (editor) => editor.isActive("bulletList"),
    run: (editor) => editor.chain().focus().toggleBulletList().run(),
  },
  {
    id: "orderedList",
    label: "فهرست شماره‌دار",
    icon: ListOrdered,
    isActive: (editor) => editor.isActive("orderedList"),
    run: (editor) => editor.chain().focus().toggleOrderedList().run(),
  },
  {
    id: "blockquote",
    label: "نقل‌قول",
    icon: Quote,
    isActive: (editor) => editor.isActive("blockquote"),
    run: (editor) => editor.chain().focus().toggleBlockquote().run(),
  },
];

function LinkTool({ editor }: { editor: Editor }) {
  const [open, setOpen] = useState(false);
  const [url, setUrl] = useState("");
  const inputId = useId();
  const active = useEditorState({
    editor,
    selector: (context) => context.editor.isActive("link"),
  });

  function apply() {
    const href = url.trim();
    if (!href) return;
    editor.chain().focus().extendMarkRange("link").setLink({ href }).run();
    setOpen(false);
  }

  return (
    <Popover
      open={open}
      onOpenChange={(next) => {
        if (next) setUrl(editor.getAttributes("link").href ?? "");
        setOpen(next);
      }}
    >
      <PopoverTrigger asChild>
        <Toggle size="sm" pressed={active} aria-label="افزودن پیوند">
          <Link2 aria-hidden />
        </Toggle>
      </PopoverTrigger>
      <PopoverContent align="start" className="w-72">
        <label htmlFor={inputId} className="text-sm font-medium">
          نشانی پیوند
        </label>
        <Input
          id={inputId}
          type="url"
          dir="ltr"
          value={url}
          placeholder="https://"
          className="text-start"
          onChange={(event) => setUrl(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter") {
              event.preventDefault();
              apply();
            }
          }}
        />
        <div className="flex gap-2">
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
              حذف پیوند
            </Button>
          ) : null}
        </div>
      </PopoverContent>
    </Popover>
  );
}

function Toolbar({ editor, disabled }: { editor: Editor; disabled?: boolean }) {
  const state = useEditorState({
    editor,
    selector: (context) => ({
      active: TOOLS.filter((tool) => tool.isActive(context.editor)).map((tool) => tool.id),
      canUndo: context.editor.can().undo(),
      canRedo: context.editor.can().redo(),
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
      aria-label="ابزار قالب‌بندی متن"
      aria-disabled={disabled}
      className="flex flex-wrap items-center gap-0.5 border-b bg-muted/40 p-1"
    >
      {TOOLS.map((tool) => (
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
      <LinkTool editor={editor} />
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

/**
 * Right-to-left rich text editor (Tiptap) for long content such as articles.
 * The value is Markdown, matching `BlogPost.content` in the contract.
 * Works with `<FormControl>`: `id` / `aria-*` land on the editable area.
 */
export function RichTextEditor({
  value,
  onChange,
  placeholder = "متن را بنویسید…",
  disabled = false,
  "aria-label": ariaLabel = "ویرایشگر متن",
  id,
  "aria-invalid": ariaInvalid,
  "aria-describedby": ariaDescribedBy,
  className,
}: RichTextEditorProps) {
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: { levels: [2, 3] },
        link: { openOnClick: false, autolink: true },
      }),
      Markdown,
      Placeholder.configure({ placeholder }),
    ],
    content: value,
    contentType: "markdown",
    editable: !disabled,
    immediatelyRender: false, // SSR-safe
    editorProps: {
      attributes: {
        ...(id ? { id } : {}),
        dir: "rtl",
        role: "textbox",
        "aria-multiline": "true",
        "aria-label": ariaLabel,
        ...(ariaInvalid ? { "aria-invalid": "true" } : {}),
        ...(ariaDescribedBy ? { "aria-describedby": ariaDescribedBy } : {}),
        class: "rich-text-content",
      },
    },
    onUpdate: ({ editor: instance }) => onChange(instance.getMarkdown()),
  });

  // Follow external value changes (form reset / loading an entity to edit).
  // Defer setContent: TipTap's ReactRenderer uses flushSync, which React forbids
  // inside lifecycle methods.
  useEffect(() => {
    if (!editor || editor.getMarkdown() === value) return;
    let cancelled = false;
    queueMicrotask(() => {
      if (cancelled || editor.isDestroyed) return;
      editor.commands.setContent(value, {
        contentType: "markdown",
        emitUpdate: false,
      });
    });
    return () => {
      cancelled = true;
    };
  }, [editor, value]);

  useEffect(() => {
    editor?.setEditable(!disabled);
  }, [editor, disabled]);

  return (
    <div
      data-slot="rich-text-editor"
      className={cn(
        "overflow-hidden rounded-lg border border-input bg-transparent transition-colors focus-within:border-ring focus-within:ring-3 focus-within:ring-ring/50 dark:bg-input/30",
        ariaInvalid && "border-destructive ring-3 ring-destructive/20",
        disabled && "opacity-50",
        className,
      )}
    >
      {editor ? <Toolbar editor={editor} disabled={disabled} /> : null}
      <EditorContent editor={editor} />
    </div>
  );
}
