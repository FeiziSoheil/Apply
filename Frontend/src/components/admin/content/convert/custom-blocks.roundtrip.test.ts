import { describe, expect, it } from "vitest";
import {
  paragraphDoc,
  type RichContent,
  type RichNode,
} from "@/contracts/richcontent";
import { validateRichContent } from "@/lib/richcontent";
import { richContentToTiptap } from "./rich-to-tiptap";
import { tiptapToRichContent } from "./tiptap-to-rich";

function wrap(node: RichNode): RichContent {
  return { type: "doc", content: [node] };
}

function roundTrip(doc: RichContent): RichContent {
  const tiptap = richContentToTiptap(doc);
  return tiptapToRichContent(tiptap);
}

describe("custom RichContent blocks round-trip", () => {
  it("callout preserves type and nested paragraph", () => {
    const doc = wrap({
      type: "callout",
      attrs: { type: "warning" },
      content: [
        {
          type: "paragraph",
          content: [{ type: "text", text: "متن هشدار" }],
        },
      ],
    });
    expect(validateRichContent(doc).ok).toBe(true);
    expect(roundTrip(doc)).toEqual(doc);
  });

  it("accordion preserves questions and RichContent answers", () => {
    const doc = wrap({
      type: "accordion",
      attrs: {
        items: [
          {
            question: "سوال یک؟",
            answer: paragraphDoc("پاسخ یک"),
          },
          {
            question: "سوال دو؟",
            answer: {
              type: "doc",
              content: [
                {
                  type: "paragraph",
                  content: [
                    { type: "text", text: "پاسخ " },
                    {
                      type: "text",
                      marks: [{ type: "bold" }],
                      text: "پررنگ",
                    },
                  ],
                },
              ],
            },
          },
        ],
      },
    });
    expect(validateRichContent(doc).ok).toBe(true);
    expect(roundTrip(doc)).toEqual(doc);
  });

  it("steps preserves ordered items", () => {
    const doc = wrap({
      type: "steps",
      attrs: {
        items: [
          { title: "گام ۱", description: "توضیح اول" },
          { title: "گام ۲", description: "توضیح دوم" },
        ],
      },
    });
    expect(validateRichContent(doc).ok).toBe(true);
    expect(roundTrip(doc)).toEqual(doc);
  });

  it("ctaButton assessment omits href", () => {
    const doc = wrap({
      type: "ctaButton",
      attrs: { text: "ارزیابی", type: "assessment" },
    });
    expect(validateRichContent(doc).ok).toBe(true);
    expect(roundTrip(doc)).toEqual(doc);
  });

  it("ctaButton link keeps https href", () => {
    const doc = wrap({
      type: "ctaButton",
      attrs: {
        text: "سایت",
        type: "link",
        href: "https://example.com/path",
      },
    });
    expect(validateRichContent(doc).ok).toBe(true);
    expect(roundTrip(doc)).toEqual(doc);
  });

  it("ctaButton link keeps internal path", () => {
    const doc = wrap({
      type: "ctaButton",
      attrs: { text: "برنامه‌ها", type: "link", href: "/programs" },
    });
    expect(validateRichContent(doc).ok).toBe(true);
    expect(roundTrip(doc)).toEqual(doc);
  });

  it("videoLink preserves https href", () => {
    const doc = wrap({
      type: "videoLink",
      attrs: { href: "https://example.com/watch" },
    });
    expect(validateRichContent(doc).ok).toBe(true);
    expect(roundTrip(doc)).toEqual(doc);
  });

  it("entityReference preserves type and id", () => {
    const doc = wrap({
      type: "entityReference",
      attrs: {
        entityType: "country",
        entityId: "3f2b8c4e-6a1d-4e0b-9c57-8d2f1a7b9e10",
      },
    });
    expect(validateRichContent(doc).ok).toBe(true);
    expect(roundTrip(doc)).toEqual(doc);
  });
});
