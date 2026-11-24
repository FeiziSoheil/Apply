import { idSchema } from "./common";
import { z } from "./zod";

/* -------------------------------------------------------------------------- */
/*  Limits                                                                    */
/* -------------------------------------------------------------------------- */

export const RICH_CONTENT_MAX_DEPTH = 4;
export const RICH_CONTENT_MAX_NODES = 500;
export const RICH_CONTENT_MAX_BYTES = 200 * 1024;

/* -------------------------------------------------------------------------- */
/*  Marks                                                                     */
/* -------------------------------------------------------------------------- */

const ALLOWED_LINK_PROTOCOLS = new Set(["http:", "https:", "mailto:", "tel:"]);

function isAllowedLinkHref(href: string): boolean {
  try {
    if (href.startsWith("mailto:") || href.startsWith("tel:")) {
      return href.length > 7;
    }
    const url = new URL(href);
    return ALLOWED_LINK_PROTOCOLS.has(url.protocol);
  } catch {
    return false;
  }
}

export const richMarkSchema = z.discriminatedUnion("type", [
  z.object({ type: z.literal("bold") }).strict(),
  z.object({ type: z.literal("italic") }).strict(),
  z.object({ type: z.literal("underline") }).strict(),
  z.object({ type: z.literal("highlight") }).strict(),
  z
    .object({
      type: z.literal("link"),
      attrs: z
        .object({
          href: z
            .string()
            .min(1)
            .max(2000)
            .refine(isAllowedLinkHref, {
              message:
                "لینک فقط با پروتکل‌های http، https، mailto یا tel مجاز است",
            }),
          target: z.enum(["_blank", "_self"]).optional(),
          rel: z.string().max(120).optional(),
        })
        .strict(),
    })
    .strict(),
]);
export type RichMark = z.infer<typeof richMarkSchema>;

/* -------------------------------------------------------------------------- */
/*  Types                                                                     */
/* -------------------------------------------------------------------------- */

export const CALLOUT_TYPES = ["info", "warning", "success", "danger"] as const;
export const calloutTypeSchema = z.enum(CALLOUT_TYPES).openapi("CalloutType");
export type CalloutType = z.infer<typeof calloutTypeSchema>;

export const CTA_BUTTON_TYPES = ["assessment", "booking", "link"] as const;
export const ctaButtonTypeSchema = z
  .enum(CTA_BUTTON_TYPES)
  .openapi("CtaButtonType");
export type CtaButtonType = z.infer<typeof ctaButtonTypeSchema>;

export const ENTITY_REFERENCE_TYPES = [
  "country",
  "university",
  "program",
  "service",
  "blog-post",
] as const;
export const entityReferenceTypeSchema = z
  .enum(ENTITY_REFERENCE_TYPES)
  .openapi("EntityReferenceType");
export type EntityReferenceType = z.infer<typeof entityReferenceTypeSchema>;

export type RichTextNode = {
  type: "text";
  text: string;
  marks?: RichMark[];
};

export type RichContent = {
  type: "doc";
  content?: RichNode[];
};

export type RichNode =
  | { type: "paragraph"; content?: RichTextNode[] }
  | {
      type: "heading";
      attrs: { level: 2 | 3 | 4 };
      content?: RichTextNode[];
    }
  | { type: "bulletList"; content: Array<Extract<RichNode, { type: "listItem" }>> }
  | {
      type: "orderedList";
      content: Array<Extract<RichNode, { type: "listItem" }>>;
    }
  | { type: "listItem"; content?: RichNode[] }
  | { type: "blockquote"; content?: RichNode[] }
  | { type: "horizontalRule" }
  | {
      type: "table";
      content: Array<Extract<RichNode, { type: "tableRow" }>>;
    }
  | {
      type: "tableRow";
      content: Array<Extract<RichNode, { type: "tableHeader" | "tableCell" }>>;
    }
  | { type: "tableHeader"; content?: RichNode[] }
  | { type: "tableCell"; content?: RichNode[] }
  | {
      type: "image";
      attrs: { fileId: string; alt: string; caption?: string };
    }
  | {
      type: "callout";
      attrs: { type: CalloutType };
      content?: RichNode[];
    }
  | {
      type: "accordion";
      attrs: { items: Array<{ question: string; answer: RichContent }> };
    }
  | {
      type: "steps";
      attrs: { items: Array<{ title: string; description: string }> };
    }
  | {
      type: "ctaButton";
      attrs: { text: string; type: CtaButtonType; href?: string };
    }
  | { type: "videoLink"; attrs: { href: string } }
  | {
      type: "entityReference";
      attrs: { entityType: EntityReferenceType; entityId: string };
    };

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

/* -------------------------------------------------------------------------- */
/*  Zod schemas (lazy recursion)                                              */
/* -------------------------------------------------------------------------- */

export const richTextNodeSchema: z.ZodType<RichTextNode> = z
  .object({
    type: z.literal("text"),
    text: z.string().max(50_000),
    marks: z.array(richMarkSchema).max(10).optional(),
  })
  .strict();

const inlineContentSchema = z.array(richTextNodeSchema).max(200);

/**
 * OpenAPI cannot introspect ZodLazy unions; nodes are documented as opaque
 * objects. Runtime validation remains the strict whitelist below.
 */
const richNodeOpenApi = {
  type: "object" as const,
  additionalProperties: true,
  description:
    "نود TipTap سفیدفهرست‌شده (paragraph، heading، list، table، callout، …)",
};

export const richNodeSchema: z.ZodType<RichNode> = z.lazy(() => {
  const children = z.array(richNodeSchema).max(50);

  const listItem = z
    .object({
      type: z.literal("listItem"),
      content: children.optional(),
    })
    .strict();

  const tableCell = z.union([
    z
      .object({
        type: z.literal("tableHeader"),
        content: children.optional(),
      })
      .strict(),
    z
      .object({
        type: z.literal("tableCell"),
        content: children.optional(),
      })
      .strict(),
  ]);

  const tableRow = z
    .object({
      type: z.literal("tableRow"),
      content: z.array(tableCell).min(1).max(20),
    })
    .strict();

  return z.union([
    z
      .object({
        type: z.literal("paragraph"),
        content: inlineContentSchema.optional(),
      })
      .strict(),
    z
      .object({
        type: z.literal("heading"),
        attrs: z
          .object({
            level: z.union([z.literal(2), z.literal(3), z.literal(4)]),
          })
          .strict(),
        content: inlineContentSchema.optional(),
      })
      .strict(),
    z
      .object({
        type: z.literal("bulletList"),
        content: z.array(listItem).min(1).max(100),
      })
      .strict(),
    z
      .object({
        type: z.literal("orderedList"),
        content: z.array(listItem).min(1).max(100),
      })
      .strict(),
    listItem,
    z
      .object({
        type: z.literal("blockquote"),
        content: children.optional(),
      })
      .strict(),
    z.object({ type: z.literal("horizontalRule") }).strict(),
    z
      .object({
        type: z.literal("table"),
        content: z.array(tableRow).min(1).max(50),
      })
      .strict(),
    tableRow,
    z
      .object({
        type: z.literal("tableHeader"),
        content: children.optional(),
      })
      .strict(),
    z
      .object({
        type: z.literal("tableCell"),
        content: children.optional(),
      })
      .strict(),
    z
      .object({
        type: z.literal("image"),
        attrs: z
          .object({
            fileId: idSchema,
            alt: z.string().min(1).max(300),
            caption: z.string().max(500).optional(),
          })
          .strict(),
      })
      .strict(),
    z
      .object({
        type: z.literal("callout"),
        attrs: z.object({ type: calloutTypeSchema }).strict(),
        content: children.optional(),
      })
      .strict(),
    z
      .object({
        type: z.literal("accordion"),
        attrs: z
          .object({
            items: z
              .array(
                z
                  .object({
                    question: z.string().min(1).max(300),
                    answer: richContentSchema,
                  })
                  .strict(),
              )
              .min(1)
              .max(30),
          })
          .strict(),
      })
      .strict(),
    z
      .object({
        type: z.literal("steps"),
        attrs: z
          .object({
            items: z
              .array(
                z
                  .object({
                    title: z.string().min(1).max(160),
                    description: z.string().min(1).max(2000),
                  })
                  .strict(),
              )
              .min(1)
              .max(20),
          })
          .strict(),
      })
      .strict(),
    z
      .object({
        type: z.literal("ctaButton"),
        attrs: z
          .object({
            text: z.string().min(1).max(80),
            type: ctaButtonTypeSchema,
            href: z
              .string()
              .max(500)
              .refine(isInternalPathOrHttps, {
                message: "آدرس دکمه فقط مسیر داخلی یا لینک https مجاز است",
              })
              .optional(),
          })
          .strict()
          .superRefine((attrs, ctx) => {
            if (attrs.type === "link" && !attrs.href) {
              ctx.addIssue({
                code: z.ZodIssueCode.custom,
                message: "برای دکمهٔ لینک، href الزامی است",
                path: ["href"],
              });
            }
          }),
      })
      .strict(),
    z
      .object({
        type: z.literal("videoLink"),
        attrs: z
          .object({
            href: z
              .string()
              .min(1)
              .max(500)
              .refine(isHttpsOnly, {
                message: "لینک ویدیو فقط با https مجاز است",
              }),
          })
          .strict(),
      })
      .strict(),
    z
      .object({
        type: z.literal("entityReference"),
        attrs: z
          .object({
            entityType: entityReferenceTypeSchema,
            entityId: idSchema,
          })
          .strict(),
      })
      .strict(),
  ]);
}).openapi(richNodeOpenApi);

export const richContentSchema: z.ZodType<RichContent> = z
  .object({
    type: z.literal("doc"),
    content: z.array(richNodeSchema).max(RICH_CONTENT_MAX_NODES).optional(),
  })
  .strict()
  .superRefine(assertRichContentLimits)
  .openapi("RichContent");

function countNodes(doc: RichContent): number {
  let count = 0;
  const walkNodes = (nodes: readonly RichNode[] | undefined) => {
    if (!nodes) return;
    for (const node of nodes) {
      count += 1;
      if ("content" in node && Array.isArray(node.content)) {
        const child = node.content[0];
        if (child && typeof child === "object" && "type" in child) {
          if (child.type === "text") continue;
          walkNodes(node.content as RichNode[]);
        }
      }
      if (node.type === "accordion") {
        for (const item of node.attrs.items) {
          walkNodes(item.answer.content);
        }
      }
    }
  };
  walkNodes(doc.content);
  return count;
}

function maxDepthOf(doc: RichContent): number {
  let max = 0;
  const walk = (nodes: readonly RichNode[] | undefined, depth: number) => {
    if (!nodes) return;
    max = Math.max(max, depth);
    for (const node of nodes) {
      if ("content" in node && Array.isArray(node.content)) {
        const first = node.content[0];
        if (first && typeof first === "object" && "type" in first && first.type !== "text") {
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

function assertRichContentLimits(doc: RichContent, ctx: z.RefinementCtx): void {
  const serialized = JSON.stringify(doc);
  if (serialized.length > RICH_CONTENT_MAX_BYTES) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: `حجم محتوا بیش از ${RICH_CONTENT_MAX_BYTES} بایت است`,
    });
  }
  if (countNodes(doc) > RICH_CONTENT_MAX_NODES) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: `تعداد نودها بیش از ${RICH_CONTENT_MAX_NODES} است`,
    });
  }
  if (maxDepthOf(doc) > RICH_CONTENT_MAX_DEPTH) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: `عمق تودرتویی بیش از ${RICH_CONTENT_MAX_DEPTH} است`,
    });
  }
}

/* -------------------------------------------------------------------------- */
/*  Sections                                                                  */
/* -------------------------------------------------------------------------- */

export const SECTION_ICON_KEYS = [
  "sparkles",
  "wallet",
  "clipboard-check",
  "stamp",
  "briefcase",
  "home",
  "building-2",
  "book-open",
  "users",
  "info",
  "graduation-cap",
  "globe",
  "map-pin",
  "check-circle",
  "file-text",
  "plane",
] as const;
export const sectionIconSchema = z
  .enum(SECTION_ICON_KEYS)
  .openapi("SectionIcon");
export type SectionIcon = z.infer<typeof sectionIconSchema>;

export const sectionAnchorSchema = z
  .string()
  .min(1)
  .max(80)
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "انکر باید ASCII kebab-case باشد");

export const MAX_SECTIONS = 20;

export const contentSectionSchema = z
  .object({
    id: idSchema,
    title: z.string().min(1).max(120),
    anchor: sectionAnchorSchema,
    icon: sectionIconSchema.optional(),
    visible: z.boolean(),
    content: richContentSchema,
  })
  .strict()
  .openapi("ContentSection");
export type ContentSection = z.infer<typeof contentSectionSchema>;

export const contentSectionInputSchema = contentSectionSchema
  .omit({ id: true })
  .openapi("ContentSectionInput");
export type ContentSectionInput = z.infer<typeof contentSectionInputSchema>;

function uniqueAnchors<T extends { anchor: string }>(
  sections: T[],
  ctx: z.RefinementCtx,
) {
  const seen = new Set<string>();
  sections.forEach((section, index) => {
    if (seen.has(section.anchor)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "انکر بخش‌ها باید یکتا باشد",
        path: [index, "anchor"],
      });
    }
    seen.add(section.anchor);
  });
}

export const contentSectionsSchema = z
  .array(contentSectionSchema)
  .max(MAX_SECTIONS)
  .superRefine(uniqueAnchors)
  .openapi("ContentSections");

export const contentSectionsInputSchema = z
  .array(contentSectionInputSchema)
  .max(MAX_SECTIONS)
  .superRefine(uniqueAnchors)
  .openapi("ContentSectionsInput");

/** Empty TipTap doc */
export function emptyRichContentDoc(): RichContent {
  return { type: "doc", content: [{ type: "paragraph" }] };
}

/** Paragraph-only helper for seed / templates */
export function paragraphDoc(...paragraphs: string[]): RichContent {
  return {
    type: "doc",
    content: paragraphs.map((text) => ({
      type: "paragraph" as const,
      content: text ? [{ type: "text" as const, text }] : undefined,
    })),
  };
}
