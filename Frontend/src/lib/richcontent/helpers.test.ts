import { describe, expect, it } from "vitest";
import type { RichContent } from "@/contracts/richcontent";
import {
  emptyDoc,
  estimateReadingTime,
  extractFaqs,
  extractHeadings,
  richContentToPlainText,
  sanitizeRichContent,
  validateRichContent,
} from "./helpers";

describe("validateRichContent", () => {
  it("accepts a simple paragraph doc", () => {
    const doc: RichContent = {
      type: "doc",
      content: [
        {
          type: "paragraph",
          content: [{ type: "text", text: "سلام" }],
        },
      ],
    };
    const result = validateRichContent(doc);
    expect(result.ok).toBe(true);
  });

  it("rejects illegal node types", () => {
    const result = validateRichContent({
      type: "doc",
      content: [{ type: "codeBlock", content: [] }],
    });
    expect(result.ok).toBe(false);
  });

  it("rejects forbidden link protocol (javascript:)", () => {
    const result = validateRichContent({
      type: "doc",
      content: [
        {
          type: "paragraph",
          content: [
            {
              type: "text",
              text: "بد",
              marks: [
                {
                  type: "link",
                  attrs: { href: "javascript:alert(1)" },
                },
              ],
            },
          ],
        },
      ],
    });
    expect(result.ok).toBe(false);
  });

  it("rejects excessive nesting depth", () => {
    const deep: RichContent = {
      type: "doc",
      content: [
        {
          type: "blockquote",
          content: [
            {
              type: "blockquote",
              content: [
                {
                  type: "blockquote",
                  content: [
                    {
                      type: "blockquote",
                      content: [
                        {
                          type: "blockquote",
                          content: [
                            {
                              type: "paragraph",
                              content: [{ type: "text", text: "خیلی عمیق" }],
                            },
                          ],
                        },
                      ],
                    },
                  ],
                },
              ],
            },
          ],
        },
      ],
    };
    const result = validateRichContent(deep);
    expect(result.ok).toBe(false);
  });
});

describe("richcontent helpers", () => {
  it("converts to plain text and estimates reading time", () => {
    const doc: RichContent = {
      type: "doc",
      content: [
        {
          type: "heading",
          attrs: { level: 2 },
          content: [{ type: "text", text: "عنوان" }],
        },
        {
          type: "paragraph",
          content: [{ type: "text", text: "متن نمونه برای خواندن." }],
        },
      ],
    };
    expect(richContentToPlainText(doc)).toContain("عنوان");
    expect(estimateReadingTime(doc)).toBeGreaterThanOrEqual(1);
    expect(extractHeadings(doc)).toEqual([
      expect.objectContaining({ level: 2, text: "عنوان" }),
    ]);
  });

  it("extracts faqs from accordion", () => {
    const doc: RichContent = {
      type: "doc",
      content: [
        {
          type: "accordion",
          attrs: {
            items: [
              {
                question: "سؤال؟",
                answer: {
                  type: "doc",
                  content: [
                    {
                      type: "paragraph",
                      content: [{ type: "text", text: "پاسخ" }],
                    },
                  ],
                },
              },
            ],
          },
        },
      ],
    };
    expect(extractFaqs(doc)).toEqual([{ question: "سؤال؟", answer: "پاسخ" }]);
  });

  it("sanitize strips illegal nodes", () => {
    const cleaned = sanitizeRichContent({
      type: "doc",
      content: [
        { type: "paragraph", content: [{ type: "text", text: "ok" }] },
        { type: "script", attrs: {} },
      ],
    });
    expect(cleaned.content?.every((n) => n.type === "paragraph")).toBe(true);
    expect(emptyDoc().type).toBe("doc");
  });
});
