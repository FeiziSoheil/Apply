"use client";

import type { Editor } from "@tiptap/react";
import { BubbleMenu } from "@tiptap/react/menus";
import {
  Bold,
  Highlighter,
  Italic,
  Link2,
  Underline as UnderlineIcon,
} from "lucide-react";
import { useEditorState } from "@tiptap/react";
import { Toggle } from "@/components/ui/toggle";
import { Separator } from "@/components/ui/separator";

type EditorBubbleMenuProps = {
  editor: Editor;
  onLink: () => void;
};

export function EditorBubbleMenu({ editor, onLink }: EditorBubbleMenuProps) {
  const state = useEditorState({
    editor,
    selector: (ctx) => ({
      bold: ctx.editor.isActive("bold"),
      italic: ctx.editor.isActive("italic"),
      underline: ctx.editor.isActive("underline"),
      highlight: ctx.editor.isActive("highlight"),
      link: ctx.editor.isActive("link"),
    }),
  });

  return (
    <BubbleMenu
      editor={editor}
      options={{ placement: "top", offset: 8 }}
      shouldShow={({ editor: ed, state: editorState }) => {
        const { empty } = editorState.selection;
        if (empty || !ed.isEditable) return false;
        if (ed.isActive("image")) return false;
        return ed.state.selection.from !== ed.state.selection.to;
      }}
    >
      <div
        role="toolbar"
        aria-label="قالب‌بندی متن انتخاب‌شده"
        className="flex items-center gap-0.5 rounded-lg border border-border bg-popover p-1 shadow-md"
      >
        <Toggle
          size="sm"
          pressed={state.bold}
          onPressedChange={() => editor.chain().focus().toggleBold().run()}
          aria-label="پررنگ"
        >
          <Bold aria-hidden />
        </Toggle>
        <Toggle
          size="sm"
          pressed={state.italic}
          onPressedChange={() => editor.chain().focus().toggleItalic().run()}
          aria-label="مورب"
        >
          <Italic aria-hidden />
        </Toggle>
        <Toggle
          size="sm"
          pressed={state.underline}
          onPressedChange={() => editor.chain().focus().toggleUnderline().run()}
          aria-label="زیرخط"
        >
          <UnderlineIcon aria-hidden />
        </Toggle>
        <Toggle
          size="sm"
          pressed={state.highlight}
          onPressedChange={() => editor.chain().focus().toggleHighlight().run()}
          aria-label="هایلایت"
        >
          <Highlighter aria-hidden />
        </Toggle>
        <Separator orientation="vertical" className="mx-0.5 h-5" />
        <Toggle
          size="sm"
          pressed={state.link}
          onPressedChange={onLink}
          aria-label="پیوند"
        >
          <Link2 aria-hidden />
        </Toggle>
      </div>
    </BubbleMenu>
  );
}
