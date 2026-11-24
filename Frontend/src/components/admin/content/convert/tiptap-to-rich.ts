import type { JSONContent } from "@tiptap/core";
import type {
  CalloutType,
  CtaButtonType,
  EntityReferenceType,
  RichContent,
  RichMark,
  RichNode,
  RichTextNode,
} from "@/contracts/richcontent";
import {
  CALLOUT_TYPES,
  CTA_BUTTON_TYPES,
  ENTITY_REFERENCE_TYPES,
  emptyRichContentDoc,
  richContentSchema,
} from "@/contracts/richcontent";
import { emptyDoc } from "@/lib/richcontent";

type AccordionItem = Extract<
  RichNode,
  { type: "accordion" }
>["attrs"]["items"][number];

const ALLOWED_LINK_PROTOCOLS = new Set(["http:", "https:", "mailto:", "tel:"]);

function isAllowedHref(href: string): boolean {
  try {
    if (href.startsWith("mailto:") || href.startsWith("tel:")) {
      return href.length > 7;
    }
    return ALLOWED_LINK_PROTOCOLS.has(new URL(href).protocol);
  } catch {
    return false;
  }
}

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

function isHttpsOnly(href: string): boolean {
  try {
    return new URL(href).protocol === "https:";
  } catch {
    return false;
  }
}

function isCalloutType(value: unknown): value is CalloutType {
  return (
    typeof value === "string" &&
    (CALLOUT_TYPES as readonly string[]).includes(value)
  );
}

function isCtaType(value: unknown): value is CtaButtonType {
  return (
    typeof value === "string" &&
    (CTA_BUTTON_TYPES as readonly string[]).includes(value)
  );
}

function isEntityType(value: unknown): value is EntityReferenceType {
  return (
    typeof value === "string" &&
    (ENTITY_REFERENCE_TYPES as readonly string[]).includes(value)
  );
}

function markFromTiptap(mark: NonNullable<JSONContent["marks"]>[number]): RichMark | null {
  if (!mark.type) return null;
  switch (mark.type) {
    case "bold":
    case "italic":
    case "underline":
    case "highlight":
      return { type: mark.type };
    case "link": {
      const href = typeof mark.attrs?.href === "string" ? mark.attrs.href : "";
      if (!href || !isAllowedHref(href)) return null;
      const target =
        mark.attrs?.target === "_blank" || mark.attrs?.target === "_self"
          ? mark.attrs.target
          : undefined;
      const rel = typeof mark.attrs?.rel === "string" ? mark.attrs.rel : undefined;
      return {
        type: "link",
        attrs: {
          href,
          ...(target ? { target } : {}),
          ...(rel ? { rel } : {}),
        },
      };
    }
    default:
      return null;
  }
}

function textFromTiptap(nodes: JSONContent[] | undefined): RichTextNode[] | undefined {
  if (!nodes?.length) return undefined;
  const out: RichTextNode[] = [];
  for (const node of nodes) {
    if (node.type !== "text" || typeof node.text !== "string") continue;
    const marks = node.marks
      ?.map(markFromTiptap)
      .filter((m): m is RichMark => m !== null);
    out.push({
      type: "text",
      text: node.text,
      ...(marks?.length ? { marks } : {}),
    });
  }
  return out.length ? out : undefined;
}

function headingLevel(attrs: JSONContent["attrs"]): 2 | 3 | 4 | null {
  const level = attrs?.level;
  if (level === 2 || level === 3 || level === 4) return level;
  return null;
}

function parseAccordionItems(raw: unknown): AccordionItem[] | null {
  if (!Array.isArray(raw) || raw.length === 0) return null;
  const items: AccordionItem[] = [];
  for (const entry of raw) {
    if (!entry || typeof entry !== "object") return null;
    const question =
      "question" in entry && typeof entry.question === "string"
        ? entry.question.trim()
        : "";
    if (!question) return null;
    const answerRaw = "answer" in entry ? entry.answer : emptyRichContentDoc();
    const parsed = richContentSchema.safeParse(answerRaw);
    if (!parsed.success) return null;
    items.push({ question, answer: parsed.data });
  }
  return items;
}

type StepsItem = { title: string; description: string };

function parseStepsItems(raw: unknown): StepsItem[] | null {
  if (!Array.isArray(raw) || raw.length === 0) return null;
  const items: StepsItem[] = [];
  for (const entry of raw) {
    if (!entry || typeof entry !== "object") return null;
    const title =
      "title" in entry && typeof entry.title === "string" ? entry.title.trim() : "";
    const description =
      "description" in entry && typeof entry.description === "string"
        ? entry.description.trim()
        : "";
    if (!title || !description) return null;
    items.push({ title, description });
  }
  return items;
}

function nodeFromTiptap(node: JSONContent): RichNode | null {
  switch (node.type) {
    case "paragraph":
      return { type: "paragraph", content: textFromTiptap(node.content) };
    case "heading": {
      const level = headingLevel(node.attrs);
      if (!level) return null;
      return {
        type: "heading",
        attrs: { level },
        content: textFromTiptap(node.content),
      };
    }
    case "bulletList":
    case "orderedList": {
      const items = node.content
        ?.map(nodeFromTiptap)
        .filter((n): n is Extract<RichNode, { type: "listItem" }> => n?.type === "listItem");
      if (!items?.length) return null;
      return { type: node.type, content: items };
    }
    case "listItem":
      return {
        type: "listItem",
        content: node.content
          ?.map(nodeFromTiptap)
          .filter((n): n is RichNode => n !== null),
      };
    case "blockquote":
      return {
        type: "blockquote",
        content: node.content
          ?.map(nodeFromTiptap)
          .filter((n): n is RichNode => n !== null),
      };
    case "horizontalRule":
      return { type: "horizontalRule" };
    case "table": {
      const rows = node.content
        ?.map(nodeFromTiptap)
        .filter((n): n is Extract<RichNode, { type: "tableRow" }> => n?.type === "tableRow");
      if (!rows?.length) return null;
      return { type: "table", content: rows };
    }
    case "tableRow": {
      const cells = node.content
        ?.map(nodeFromTiptap)
        .filter(
          (n): n is Extract<RichNode, { type: "tableHeader" | "tableCell" }> =>
            n?.type === "tableHeader" || n?.type === "tableCell",
        );
      if (!cells?.length) return null;
      return { type: "tableRow", content: cells };
    }
    case "tableHeader":
    case "tableCell":
      return {
        type: node.type,
        content: node.content
          ?.map(nodeFromTiptap)
          .filter((n): n is RichNode => n !== null),
      };
    case "image": {
      const fileId = typeof node.attrs?.fileId === "string" ? node.attrs.fileId : "";
      const alt = typeof node.attrs?.alt === "string" ? node.attrs.alt.trim() : "";
      const captionRaw =
        typeof node.attrs?.caption === "string" ? node.attrs.caption.trim() : "";
      if (!fileId || !alt) return null;
      return {
        type: "image",
        attrs: {
          fileId,
          alt,
          ...(captionRaw ? { caption: captionRaw } : {}),
        },
      };
    }
    case "callout": {
      const type = isCalloutType(node.attrs?.type) ? node.attrs.type : "info";
      const content = node.content
        ?.map(nodeFromTiptap)
        .filter((n): n is RichNode => n !== null);
      return {
        type: "callout",
        attrs: { type },
        ...(content?.length ? { content } : {}),
      };
    }
    case "accordion": {
      const items = parseAccordionItems(node.attrs?.items);
      if (!items) return null;
      return { type: "accordion", attrs: { items } };
    }
    case "steps": {
      const items = parseStepsItems(node.attrs?.items);
      if (!items) return null;
      return { type: "steps", attrs: { items } };
    }
    case "ctaButton": {
      const text =
        typeof node.attrs?.text === "string" ? node.attrs.text.trim() : "";
      const type = isCtaType(node.attrs?.type) ? node.attrs.type : null;
      if (!text || !type) return null;
      const hrefRaw =
        typeof node.attrs?.href === "string" ? node.attrs.href.trim() : "";
      if (type === "link") {
        if (!hrefRaw || !isInternalPathOrHttps(hrefRaw)) return null;
        return { type: "ctaButton", attrs: { text, type, href: hrefRaw } };
      }
      return { type: "ctaButton", attrs: { text, type } };
    }
    case "videoLink": {
      const href =
        typeof node.attrs?.href === "string" ? node.attrs.href.trim() : "";
      if (!href || !isHttpsOnly(href)) return null;
      return { type: "videoLink", attrs: { href } };
    }
    case "entityReference": {
      const entityType = isEntityType(node.attrs?.entityType)
        ? node.attrs.entityType
        : null;
      const entityId =
        typeof node.attrs?.entityId === "string" ? node.attrs.entityId : "";
      if (!entityType || !entityId) return null;
      return {
        type: "entityReference",
        attrs: { entityType, entityId },
      };
    }
    default:
      return null;
  }
}

/**
 * TipTap JSON → contract RichContent (whitelist including custom blocks).
 * Images without alt/fileId and invalid custom attrs are dropped.
 */
export function tiptapToRichContent(doc: JSONContent): RichContent {
  if (doc.type !== "doc") return emptyDoc();
  const content = doc.content
    ?.map(nodeFromTiptap)
    .filter((n): n is RichNode => n !== null);
  return {
    type: "doc",
    content: content?.length ? content : [{ type: "paragraph" }],
  };
}
