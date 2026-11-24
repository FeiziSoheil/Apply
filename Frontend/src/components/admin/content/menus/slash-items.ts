import type { Editor, Range } from "@tiptap/core";
import type { LucideIcon } from "lucide-react";
import {
  AlertTriangle,
  Heading2,
  Heading3,
  Heading4,
  ImageIcon,
  Link2,
  List,
  ListChecks,
  ListOrdered,
  Minus,
  MousePointerClick,
  Quote,
  Table,
  TextCursorInput,
  Video,
} from "lucide-react";

export type SlashItem = {
  id: string;
  title: string;
  description: string;
  /** Persian keywords for search */
  keywords: string[];
  icon: LucideIcon;
  command: (editor: Editor, range: Range) => void;
};

function deleteRange(editor: Editor, range: Range) {
  editor.chain().focus().deleteRange(range).run();
}

export const SLASH_ITEMS: readonly SlashItem[] = [
  {
    id: "paragraph",
    title: "پاراگراف",
    description: "متن ساده",
    keywords: ["پاراگراف", "متن", "paragraph", "text"],
    icon: TextCursorInput,
    command: (editor, range) => {
      deleteRange(editor, range);
      editor.chain().focus().setParagraph().run();
    },
  },
  {
    id: "h2",
    title: "عنوان ۲",
    description: "سرتیتر بزرگ",
    keywords: ["عنوان", "سرتیتر", "heading", "h2"],
    icon: Heading2,
    command: (editor, range) => {
      deleteRange(editor, range);
      editor.chain().focus().toggleHeading({ level: 2 }).run();
    },
  },
  {
    id: "h3",
    title: "عنوان ۳",
    description: "سرتیتر متوسط",
    keywords: ["عنوان", "سرتیتر", "heading", "h3"],
    icon: Heading3,
    command: (editor, range) => {
      deleteRange(editor, range);
      editor.chain().focus().toggleHeading({ level: 3 }).run();
    },
  },
  {
    id: "h4",
    title: "عنوان ۴",
    description: "سرتیتر کوچک",
    keywords: ["عنوان", "سرتیتر", "heading", "h4"],
    icon: Heading4,
    command: (editor, range) => {
      deleteRange(editor, range);
      editor.chain().focus().toggleHeading({ level: 4 }).run();
    },
  },
  {
    id: "bulletList",
    title: "فهرست نقطه‌ای",
    description: "لیست با نشانه‌گذاری",
    keywords: ["لیست", "فهرست", "bullet", "list"],
    icon: List,
    command: (editor, range) => {
      deleteRange(editor, range);
      editor.chain().focus().toggleBulletList().run();
    },
  },
  {
    id: "orderedList",
    title: "فهرست شماره‌دار",
    description: "لیست شماره‌گذاری‌شده",
    keywords: ["لیست", "شماره", "ordered", "list"],
    icon: ListOrdered,
    command: (editor, range) => {
      deleteRange(editor, range);
      editor.chain().focus().toggleOrderedList().run();
    },
  },
  {
    id: "blockquote",
    title: "نقل‌قول",
    description: "بلوک نقل‌قول",
    keywords: ["نقل", "قول", "quote", "blockquote"],
    icon: Quote,
    command: (editor, range) => {
      deleteRange(editor, range);
      editor.chain().focus().toggleBlockquote().run();
    },
  },
  {
    id: "hr",
    title: "خط جداکننده",
    description: "خط افقی",
    keywords: ["خط", "جداکننده", "hr", "divider"],
    icon: Minus,
    command: (editor, range) => {
      deleteRange(editor, range);
      editor.chain().focus().setHorizontalRule().run();
    },
  },
  {
    id: "table",
    title: "جدول",
    description: "جدول ۳×۳ با ردیف عنوان",
    keywords: ["جدول", "table"],
    icon: Table,
    command: (editor, range) => {
      deleteRange(editor, range);
      editor
        .chain()
        .focus()
        .insertTable({ rows: 3, cols: 3, withHeaderRow: true })
        .run();
    },
  },
  {
    id: "image",
    title: "تصویر",
    description: "آپلود تصویر از فایل",
    keywords: ["تصویر", "عکس", "image", "photo"],
    icon: ImageIcon,
    command: (editor, range) => {
      deleteRange(editor, range);
      editor.commands.setMeta("contentEditor", { openImagePicker: true });
      // Fallback: dispatch custom event the editor listens for
      window.dispatchEvent(
        new CustomEvent("content-editor:request-image", {
          detail: { editorId: editor.view.dom.id },
        }),
      );
    },
  },
  {
    id: "callout",
    title: "کادر توجه",
    description: "اطلاعات، هشدار، موفقیت یا خطر",
    keywords: ["کادر", "توجه", "هشدار", "callout", "info", "warning"],
    icon: AlertTriangle,
    command: (editor, range) => {
      deleteRange(editor, range);
      editor.chain().focus().setCallout({ type: "info" }).run();
    },
  },
  {
    id: "accordion",
    title: "پرسش و پاسخ",
    description: "آکاردئون سوال و جواب",
    keywords: ["پرسش", "پاسخ", "آکاردئون", "faq", "accordion"],
    icon: List,
    command: (editor, range) => {
      deleteRange(editor, range);
      editor.chain().focus().setAccordion().run();
    },
  },
  {
    id: "steps",
    title: "مراحل",
    description: "فهرست گام‌به‌گام شماره‌دار",
    keywords: ["مراحل", "گام", "steps", "process"],
    icon: ListChecks,
    command: (editor, range) => {
      deleteRange(editor, range);
      editor.chain().focus().setSteps().run();
    },
  },
  {
    id: "ctaButton",
    title: "دکمه فراخوان",
    description: "ارزیابی، رزرو یا لینک",
    keywords: ["دکمه", "فراخوان", "cta", "assessment", "booking"],
    icon: MousePointerClick,
    command: (editor, range) => {
      deleteRange(editor, range);
      editor.chain().focus().setCtaButton().run();
    },
  },
  {
    id: "videoLink",
    title: "لینک ویدیو",
    description: "کارت لینک https بدون embed",
    keywords: ["ویدیو", "ویدئو", "video", "youtube"],
    icon: Video,
    command: (editor, range) => {
      deleteRange(editor, range);
      editor.chain().focus().setVideoLink().run();
    },
  },
  {
    id: "entityReference",
    title: "ارجاع موجودیت",
    description: "کشور، دانشگاه، رشته، خدمت یا مقاله",
    keywords: [
      "ارجاع",
      "موجودیت",
      "کشور",
      "دانشگاه",
      "entity",
      "reference",
    ],
    icon: Link2,
    command: (editor, range) => {
      deleteRange(editor, range);
      editor.chain().focus().setEntityReference().run();
    },
  },
];

export function filterSlashItems(query: string): SlashItem[] {
  const q = query.trim().toLowerCase();
  if (!q) return [...SLASH_ITEMS];
  return SLASH_ITEMS.filter((item) => {
    const hay = [item.title, item.description, ...item.keywords]
      .join(" ")
      .toLowerCase();
    return hay.includes(q);
  });
}
