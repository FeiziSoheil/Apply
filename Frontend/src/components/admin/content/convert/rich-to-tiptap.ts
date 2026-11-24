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
} from "@/contracts/richcontent";

export type ResolveFileUrl = (fileId: string) => string | undefined;

function marksToTiptap(marks: RichTextNode["marks"]): JSONContent["marks"] {
  if (!marks?.length) return undefined;
  return marks.map((mark: RichMark) => {
    if (mark.type === "link") {
      return {
        type: "link",
        attrs: {
          href: mark.attrs.href,
          target: mark.attrs.target ?? null,
          rel: mark.attrs.rel ?? null,
        },
      };
    }
    return { type: mark.type };
  });
}

function textToTiptap(nodes: RichTextNode[] | undefined): JSONContent[] | undefined {
  if (!nodes?.length) return undefined;
  return nodes.map((node) => ({
    type: "text",
    text: node.text,
    marks: marksToTiptap(node.marks),
  }));
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

function nodeToTiptap(
  node: RichNode,
  resolveFileUrl?: ResolveFileUrl,
): JSONContent | null {
  switch (node.type) {
    case "paragraph":
      return { type: "paragraph", content: textToTiptap(node.content) };
    case "heading":
      return {
        type: "heading",
        attrs: { level: node.attrs.level },
        content: textToTiptap(node.content),
      };
    case "bulletList":
    case "orderedList":
      return {
        type: node.type,
        content: node.content
          .map((item) => nodeToTiptap(item, resolveFileUrl))
          .filter((n): n is JSONContent => n !== null),
      };
    case "listItem":
      return {
        type: "listItem",
        content: node.content
          ?.map((child) => nodeToTiptap(child, resolveFileUrl))
          .filter((n): n is JSONContent => n !== null),
      };
    case "blockquote":
      return {
        type: "blockquote",
        content: node.content
          ?.map((child) => nodeToTiptap(child, resolveFileUrl))
          .filter((n): n is JSONContent => n !== null),
      };
    case "horizontalRule":
      return { type: "horizontalRule" };
    case "table":
      return {
        type: "table",
        content: node.content
          .map((row) => nodeToTiptap(row, resolveFileUrl))
          .filter((n): n is JSONContent => n !== null),
      };
    case "tableRow":
      return {
        type: "tableRow",
        content: node.content
          .map((cell) => nodeToTiptap(cell, resolveFileUrl))
          .filter((n): n is JSONContent => n !== null),
      };
    case "tableHeader":
    case "tableCell":
      return {
        type: node.type,
        content: node.content
          ?.map((child) => nodeToTiptap(child, resolveFileUrl))
          .filter((n): n is JSONContent => n !== null),
      };
    case "image": {
      const src = resolveFileUrl?.(node.attrs.fileId) ?? "";
      return {
        type: "image",
        attrs: {
          fileId: node.attrs.fileId,
          alt: node.attrs.alt,
          caption: node.attrs.caption ?? null,
          src,
        },
      };
    }
    case "callout":
      return {
        type: "callout",
        attrs: {
          type: isCalloutType(node.attrs.type) ? node.attrs.type : "info",
        },
        content: node.content?.length
          ? node.content
              .map((child) => nodeToTiptap(child, resolveFileUrl))
              .filter((n): n is JSONContent => n !== null)
          : [{ type: "paragraph" }],
      };
    case "accordion":
      return {
        type: "accordion",
        attrs: { items: node.attrs.items },
      };
    case "steps":
      return {
        type: "steps",
        attrs: { items: node.attrs.items },
      };
    case "ctaButton":
      return {
        type: "ctaButton",
        attrs: {
          text: node.attrs.text,
          type: isCtaType(node.attrs.type) ? node.attrs.type : "assessment",
          href: node.attrs.href ?? null,
        },
      };
    case "videoLink":
      return {
        type: "videoLink",
        attrs: { href: node.attrs.href },
      };
    case "entityReference":
      return {
        type: "entityReference",
        attrs: {
          entityType: isEntityType(node.attrs.entityType)
            ? node.attrs.entityType
            : "country",
          entityId: node.attrs.entityId,
        },
      };
    default:
      return null;
  }
}

/** Convert contract RichContent → TipTap JSONContent (including custom blocks). */
export function richContentToTiptap(
  doc: RichContent,
  resolveFileUrl?: ResolveFileUrl,
): JSONContent {
  const content = doc.content
    ?.map((node) => nodeToTiptap(node, resolveFileUrl))
    .filter((n): n is JSONContent => n !== null);

  return {
    type: "doc",
    content: content?.length ? content : [{ type: "paragraph" }],
  };
}
