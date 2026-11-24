import { createElement, type ReactNode } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { afterEach, describe, expect, it, vi } from "vitest";
import type { RichContent, RichNode } from "@/contracts/richcontent";
import {
  doc,
  headingNode,
  sampleAccordion,
  sampleCallout,
  sampleCta,
  sampleEntityRef,
  sampleSteps,
  sampleTable,
  sampleVideo,
  textParagraph,
} from "@/lib/richcontent/builders";
import { createHeadingIdAllocator } from "@/lib/richcontent";
import { EntityReferenceCardView } from "./entity-reference-card-view";
import type { RichRenderContext } from "./render-context";
import { SharedRichNodes } from "./shared-nodes";

vi.mock("next/image", () => ({
  default: function MockImage({
    alt,
    src,
  }: {
    alt: string;
    src: string;
  }) {
    return createElement("img", { alt, src: String(src) });
  },
}));

vi.mock("next/link", () => ({
  default: function MockLink({
    href,
    children,
  }: {
    href: string;
    children: ReactNode;
  }) {
    return createElement("a", { href }, children);
  },
}));

vi.mock("./accordion-block", () => ({
  AccordionBlock: function MockAccordion({
    items,
  }: {
    items: Array<{ question: string; answer: ReactNode }>;
  }) {
    return createElement(
      "div",
      { "data-testid": "accordion" },
      items.map((item) =>
        createElement(
          "div",
          { key: item.question },
          createElement("h4", null, item.question),
          item.answer,
        ),
      ),
    );
  },
}));

function renderDoc(
  content: RichContent,
  options?: {
    resolveEntity?: RichRenderContext["resolveEntity"];
    resolveFileUrl?: RichRenderContext["resolveFileUrl"];
  },
): string {
  const ctx: RichRenderContext = {
    headingId: createHeadingIdAllocator(),
    resolveFileUrl:
      options?.resolveFileUrl ??
      ((fileId) => (fileId ? `/resolved/${fileId}` : null)),
    resolveEntity: options?.resolveEntity,
    warnUnknown: true,
  };

  function renderInner(inner: RichContent) {
    return createElement(SharedRichNodes, {
      nodes: inner.content,
      ctx,
      renderEntity: (attrs) => {
        const model = options?.resolveEntity?.(
          attrs.entityType,
          attrs.entityId,
        );
        if (!model) return null;
        return createElement(EntityReferenceCardView, { model });
      },
      renderDoc: renderInner,
    });
  }

  return renderToStaticMarkup(
    createElement("div", null, renderInner(content)),
  );
}

describe("RichContent SharedRichNodes", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("renders core and custom node types", () => {
    const content = doc(
      textParagraph("پاراگراف نمونه"),
      headingNode(2, "عنوان بخش"),
      headingNode(3, "زیرعنوان"),
      {
        type: "bulletList",
        content: [
          {
            type: "listItem",
            content: [textParagraph("مورد یک")],
          },
        ],
      },
      {
        type: "orderedList",
        content: [
          {
            type: "listItem",
            content: [textParagraph("مورد دو")],
          },
        ],
      },
      {
        type: "blockquote",
        content: [textParagraph("نقل‌قول")],
      },
      { type: "horizontalRule" },
      sampleTable(),
      {
        type: "image",
        attrs: {
          fileId: "file-1",
          alt: "تصویر تست",
          caption: "زیرنویس",
        },
      },
      sampleCallout("warning", "هشدار مهم"),
      sampleAccordion([{ question: "سؤال؟", answer: "پاسخ." }]),
      sampleSteps([
        { title: "گام ۱", description: "توضیح گام" },
      ]),
      sampleCta("ارزیابی", "assessment"),
      sampleCta("رزرو", "booking"),
      sampleCta("لینک داخلی", "link", "/services"),
      sampleVideo("https://www.youtube.com/watch?v=abc"),
      sampleEntityRef("country", "country-germany"),
    );

    const html = renderDoc(content, {
      resolveEntity: (entityType, entityId) =>
        entityType === "country" && entityId === "country-germany"
          ? {
              entityType,
              id: entityId,
              href: "/countries/germany",
              title: "آلمان",
              description: "خلاصه",
            }
          : null,
    });

    expect(html).toContain("پاراگراف نمونه");
    expect(html).toContain('id="عنوان-بخش"');
    expect(html).toContain("مورد یک");
    expect(html).toContain("نقل‌قول");
    expect(html).toContain("اجاره ماهانه");
    expect(html).toContain('alt="تصویر تست"');
    expect(html).toContain("زیرنویس");
    expect(html).toContain("هشدار مهم");
    expect(html).toContain("سؤال؟");
    expect(html).toContain("گام ۱");
    expect(html).toContain('href="/assessment"');
    expect(html).toContain('href="/booking"');
    expect(html).toContain('href="/services"');
    expect(html).toContain("youtube.com");
    expect(html).toContain("آلمان");
    expect(html).toContain('href="/countries/germany"');
  });

  it("skips unknown nodes and warns in development", () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    const unknown = { type: "magicBlock" } as unknown as RichNode;
    const content: RichContent = {
      type: "doc",
      content: [textParagraph("قبل"), unknown, textParagraph("بعد")],
    };

    const html = renderDoc(content);
    expect(html).toContain("قبل");
    expect(html).toContain("بعد");
    expect(html).not.toContain("magicBlock");
    expect(warn).toHaveBeenCalled();
    warn.mockRestore();
  });

  it("renders nothing for missing entityReference", () => {
    const content = doc(sampleEntityRef("university", "deleted-id"));
    const html = renderDoc(content, {
      resolveEntity: () => null,
    });
    expect(html).toBe("<div></div>");
  });

  it("skips image when fileId cannot be resolved", () => {
    const content: RichContent = {
      type: "doc",
      content: [
        {
          type: "image",
          attrs: { fileId: "missing", alt: "x" },
        },
      ],
    };
    const html = renderDoc(content, {
      resolveFileUrl: () => null,
    });
    expect(html).toBe("<div></div>");
  });
});
