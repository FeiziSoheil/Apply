import {
  RICH_CONTENT_MAX_BYTES,
  RICH_CONTENT_MAX_DEPTH,
  RICH_CONTENT_MAX_NODES,
  emptyRichContentDoc,
  richContentSchema,
  type RichContent,
  type RichNode,
  type RichTextNode,
} from "@/contracts/richcontent";
import type { ZodError } from "zod";

export type ExtractedHeading = {
  level: 2 | 3 | 4;
  text: string;
  /** Stable kebab-ish id derived from plain text */
  id: string;
};

export type ExtractedFaq = {
  question: string;
  answer: string;
};

const ALLOWED_NODE_TYPES = new Set([
  "paragraph",
  "heading",
  "bulletList",
  "orderedList",
  "listItem",
  "blockquote",
  "horizontalRule",
  "table",
  "tableRow",
  "tableHeader",
  "tableCell",
  "image",
  "callout",
  "accordion",
  "steps",
  "ctaButton",
  "videoLink",
  "entityReference",
]);

const ALLOWED_MARK_TYPES = new Set([
  "bold",
  "italic",
  "underline",
  "highlight",
  "link",
]);

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function inlinePlainText(nodes: readonly RichTextNode[] | undefined): string {
  if (!nodes) return "";
  return nodes.map((n) => n.text).join("");
}

export function slugifyHeading(text: string): string {
  const ascii = text
    .trim()
    .toLowerCase()
    .replace(/[^\w\u0600-\u06FF\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .slice(0, 80);
  return ascii || "heading";
}

/** Allocate unique heading ids matching `extractHeadings` (for anchors / TOC). */
export function createHeadingIdAllocator(): (text: string) => string {
  const seen = new Map<string, number>();
  return (text: string) => {
    let id = slugifyHeading(text);
    const count = seen.get(id) ?? 0;
    seen.set(id, count + 1);
    if (count > 0) id = `${id}-${count + 1}`;
    return id;
  };
}

function walkPlain(
  nodes: readonly RichNode[] | undefined,
  parts: string[],
): void {
  if (!nodes) return;
  for (const node of nodes) {
    switch (node.type) {
      case "paragraph":
      case "heading":
        parts.push(inlinePlainText(node.content));
        break;
      case "bulletList":
      case "orderedList":
      case "blockquote":
      case "callout":
        walkPlain(node.content, parts);
        break;
      case "listItem":
      case "tableHeader":
      case "tableCell":
        walkPlain(node.content, parts);
        break;
      case "table":
        walkPlain(node.content, parts);
        break;
      case "tableRow":
        walkPlain(node.content, parts);
        break;
      case "image":
        parts.push(node.attrs.caption ?? node.attrs.alt);
        break;
      case "accordion":
        for (const item of node.attrs.items) {
          parts.push(item.question);
          walkPlain(item.answer.content, parts);
        }
        break;
      case "steps":
        for (const step of node.attrs.items) {
          parts.push(step.title, step.description);
        }
        break;
      case "ctaButton":
        parts.push(node.attrs.text);
        break;
      case "videoLink":
      case "entityReference":
      case "horizontalRule":
        break;
      default:
        break;
    }
  }
}

function countNodes(doc: RichContent): number {
  let count = 0;
  const walk = (nodes: readonly RichNode[] | undefined) => {
    if (!nodes) return;
    for (const node of nodes) {
      count += 1;
      if ("content" in node && Array.isArray(node.content)) {
        const first = node.content[0];
        if (
          first &&
          typeof first === "object" &&
          "type" in first &&
          first.type !== "text"
        ) {
          walk(node.content as RichNode[]);
        }
      }
      if (node.type === "accordion") {
        for (const item of node.attrs.items) {
          walk(item.answer.content);
        }
      }
    }
  };
  walk(doc.content);
  return count;
}

function maxDepth(doc: RichContent): number {
  let max = 0;
  const walk = (nodes: readonly RichNode[] | undefined, depth: number) => {
    if (!nodes) return;
    max = Math.max(max, depth);
    for (const node of nodes) {
      if ("content" in node && Array.isArray(node.content)) {
        const first = node.content[0];
        if (
          first &&
          typeof first === "object" &&
          "type" in first &&
          first.type !== "text"
        ) {
          walk(node.content as RichNode[], depth + 1);
        }
      }
      if (node.type === "accordion") {
        for (const item of node.attrs.items) {
          walk(item.answer.content, depth + 1);
        }
      }
    }
  };
  walk(doc.content, 1);
  return max;
}

function isAllowedLinkHref(href: string): boolean {
  try {
    if (href.startsWith("mailto:") || href.startsWith("tel:")) {
      return href.length > 7;
    }
    const url = new URL(href);
    return ["http:", "https:", "mailto:", "tel:"].includes(url.protocol);
  } catch {
    return false;
  }
}

function sanitizeMarks(
  marks: RichTextNode["marks"],
): RichTextNode["marks"] | undefined {
  if (!marks?.length) return undefined;
  const next = marks.filter((mark) => {
    if (!ALLOWED_MARK_TYPES.has(mark.type)) return false;
    if (mark.type === "link") return isAllowedLinkHref(mark.attrs.href);
    return true;
  });
  return next.length ? next : undefined;
}

function sanitizeTextNodes(
  nodes: RichTextNode[] | undefined,
): RichTextNode[] | undefined {
  if (!nodes) return undefined;
  return nodes.map((n) => ({
    type: "text" as const,
    text: n.text,
    marks: sanitizeMarks(n.marks),
  }));
}

function sanitizeNodes(
  nodes: RichNode[] | undefined,
  depth: number,
): RichNode[] | undefined {
  if (!nodes || depth > RICH_CONTENT_MAX_DEPTH) return undefined;
  const out: RichNode[] = [];
  for (const node of nodes) {
    if (!ALLOWED_NODE_TYPES.has(node.type)) continue;
    switch (node.type) {
      case "paragraph":
        out.push({ type: "paragraph", content: sanitizeTextNodes(node.content) });
        break;
      case "heading":
        out.push({
          type: "heading",
          attrs: { level: node.attrs.level },
          content: sanitizeTextNodes(node.content),
        });
        break;
      case "bulletList":
      case "orderedList": {
        const items = sanitizeNodes(node.content, depth + 1)?.filter(
          (n): n is Extract<RichNode, { type: "listItem" }> =>
            n.type === "listItem",
        );
        if (items?.length) out.push({ type: node.type, content: items });
        break;
      }
      case "listItem":
        out.push({
          type: "listItem",
          content: sanitizeNodes(node.content, depth + 1),
        });
        break;
      case "blockquote":
      case "callout":
        out.push({
          ...node,
          content: sanitizeNodes(node.content, depth + 1),
        } as RichNode);
        break;
      case "horizontalRule":
        out.push({ type: "horizontalRule" });
        break;
      case "table": {
        const rows = sanitizeNodes(node.content, depth + 1)?.filter(
          (n): n is Extract<RichNode, { type: "tableRow" }> =>
            n.type === "tableRow",
        );
        if (rows?.length) out.push({ type: "table", content: rows });
        break;
      }
      case "tableRow": {
        const cells = sanitizeNodes(node.content, depth + 1)?.filter(
          (
            n,
          ): n is Extract<RichNode, { type: "tableHeader" | "tableCell" }> =>
            n.type === "tableHeader" || n.type === "tableCell",
        );
        if (cells?.length) out.push({ type: "tableRow", content: cells });
        break;
      }
      case "tableHeader":
      case "tableCell":
        out.push({
          type: node.type,
          content: sanitizeNodes(node.content, depth + 1),
        });
        break;
      case "image":
        out.push(node);
        break;
      case "accordion":
        out.push({
          type: "accordion",
          attrs: {
            items: node.attrs.items.map((item) => ({
              question: item.question,
              answer: sanitizeRichContent(item.answer),
            })),
          },
        });
        break;
      case "steps":
      case "ctaButton":
      case "videoLink":
      case "entityReference":
        out.push(node);
        break;
      default:
        break;
    }
  }
  return out.length ? out : undefined;
}

/** Validate against the contract schema (strict whitelist + limits). */
export function validateRichContent(
  value: unknown,
):
  | { ok: true; data: RichContent }
  | { ok: false; error: ZodError } {
  const result = richContentSchema.safeParse(value);
  if (result.success) return { ok: true, data: result.data };
  return { ok: false, error: result.error };
}

/** Flatten to plain text for SEO / RAG. */
export function richContentToPlainText(doc: RichContent): string {
  const parts: string[] = [];
  walkPlain(doc.content, parts);
  return parts
    .map((p) => p.trim())
    .filter(Boolean)
    .join("\n")
    .replace(/\n{3,}/g, "\n\n");
}

/** Headings for table-of-contents. */
export function extractHeadings(doc: RichContent): ExtractedHeading[] {
  const headings: ExtractedHeading[] = [];
  const allocId = createHeadingIdAllocator();
  const walk = (nodes: readonly RichNode[] | undefined) => {
    if (!nodes) return;
    for (const node of nodes) {
      if (node.type === "heading") {
        const text = inlinePlainText(node.content).trim();
        if (!text) continue;
        headings.push({ level: node.attrs.level, text, id: allocId(text) });
      }
      if ("content" in node && Array.isArray(node.content)) {
        const first = node.content[0];
        if (
          first &&
          typeof first === "object" &&
          "type" in first &&
          first.type !== "text"
        ) {
          walk(node.content as RichNode[]);
        }
      }
      if (node.type === "accordion") {
        for (const item of node.attrs.items) {
          walk(item.answer.content);
        }
      }
    }
  };
  walk(doc.content);
  return headings;
}

/** Accordion items → FAQ JSON-LD shape (plain strings). */
export function extractFaqs(doc: RichContent): ExtractedFaq[] {
  const faqs: ExtractedFaq[] = [];
  const walk = (nodes: readonly RichNode[] | undefined) => {
    if (!nodes) return;
    for (const node of nodes) {
      if (node.type === "accordion") {
        for (const item of node.attrs.items) {
          faqs.push({
            question: item.question,
            answer: richContentToPlainText(item.answer),
          });
        }
      }
      if ("content" in node && Array.isArray(node.content)) {
        const first = node.content[0];
        if (
          first &&
          typeof first === "object" &&
          "type" in first &&
          first.type !== "text"
        ) {
          walk(node.content as RichNode[]);
        }
      }
    }
  };
  walk(doc.content);
  return faqs;
}

/** Collect FAQ accordion items from one or more RichContent docs / sections. */
export function extractFaqsFromContents(
  docs: ReadonlyArray<RichContent | undefined | null>,
): ExtractedFaq[] {
  return docs.flatMap((doc) => (doc ? extractFaqs(doc) : []));
}

/** Rough reading time in minutes (Persian ~200 words/min). */
export function estimateReadingTime(doc: RichContent): number {
  const text = richContentToPlainText(doc);
  const words = text.split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.ceil(words / 200));
}

export function emptyDoc(): RichContent {
  return emptyRichContentDoc();
}

/** True when the doc has no meaningful plain text (empty paragraphs only). */
export function isRichContentEmpty(doc: RichContent | undefined | null): boolean {
  if (!doc) return true;
  return richContentToPlainText(doc).trim().length === 0;
}

/**
 * Strip illegal nodes/marks and clamp depth. Always returns a valid-shaped doc
 * (may be empty). Does not re-run full zod validation.
 */
export function sanitizeRichContent(value: unknown): RichContent {
  if (!isRecord(value) || value.type !== "doc") {
    return emptyDoc();
  }
  const content = Array.isArray(value.content)
    ? sanitizeNodes(value.content as RichNode[], 1)
    : undefined;
  const doc: RichContent = { type: "doc", content };
  if (
    JSON.stringify(doc).length > RICH_CONTENT_MAX_BYTES ||
    countNodes(doc) > RICH_CONTENT_MAX_NODES ||
    maxDepth(doc) > RICH_CONTENT_MAX_DEPTH
  ) {
    return emptyDoc();
  }
  return doc;
}
