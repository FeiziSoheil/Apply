import type {
  ContentSection,
  ContentSectionInput,
  RichContent,
  RichNode,
} from "@/contracts/richcontent";
import { paragraphDoc } from "@/contracts/richcontent";
import { seededSectionsFor, type ContentTemplateKind } from "@/lib/content-templates";

export function textParagraph(text: string): RichNode {
  return {
    type: "paragraph",
    content: [{ type: "text", text }],
  };
}

export function headingNode(level: 2 | 3 | 4, text: string): RichNode {
  return {
    type: "heading",
    attrs: { level },
    content: [{ type: "text", text }],
  };
}

export function bulletList(items: string[]): RichNode {
  return {
    type: "bulletList",
    content: items.map((item) => ({
      type: "listItem" as const,
      content: [textParagraph(item)],
    })),
  };
}

export function doc(...nodes: RichNode[]): RichContent {
  return { type: "doc", content: nodes };
}

/** Sample blocks so seed data covers every custom node type at least once. */
export function sampleTable(): RichNode {
  return {
    type: "table",
    content: [
      {
        type: "tableRow",
        content: [
          {
            type: "tableHeader",
            content: [textParagraph("مورد")],
          },
          {
            type: "tableHeader",
            content: [textParagraph("مقدار تقریبی")],
          },
        ],
      },
      {
        type: "tableRow",
        content: [
          { type: "tableCell", content: [textParagraph("اجاره ماهانه")] },
          { type: "tableCell", content: [textParagraph("۴۰۰–۷۰۰ یورو")] },
        ],
      },
      {
        type: "tableRow",
        content: [
          { type: "tableCell", content: [textParagraph("حمل‌ونقل")] },
          { type: "tableCell", content: [textParagraph("۴۹–۸۰ یورو")] },
        ],
      },
    ],
  };
}

export function sampleCallout(
  type: "info" | "warning" | "success" | "danger",
  text: string,
): RichNode {
  return {
    type: "callout",
    attrs: { type },
    content: [textParagraph(text)],
  };
}

export function sampleAccordion(
  items: Array<{ question: string; answer: string }>,
): RichNode {
  return {
    type: "accordion",
    attrs: {
      items: items.map((item) => ({
        question: item.question,
        answer: paragraphDoc(item.answer),
      })),
    },
  };
}

export function sampleSteps(
  items: Array<{ title: string; description: string }>,
): RichNode {
  return {
    type: "steps",
    attrs: { items },
  };
}

export function sampleCta(
  text: string,
  type: "assessment" | "booking" | "link",
  href?: string,
): RichNode {
  return {
    type: "ctaButton",
    attrs: href ? { text, type, href } : { text, type },
  };
}

export function sampleVideo(href: string): RichNode {
  return { type: "videoLink", attrs: { href } };
}

export function sampleEntityRef(
  entityType: "country" | "university" | "program" | "service" | "blog-post",
  entityId: string,
): RichNode {
  return {
    type: "entityReference",
    attrs: { entityType, entityId },
  };
}

export function markdownishToDoc(markdown: string): RichContent {
  const lines = markdown.replace(/\r\n/g, "\n").trim().split("\n");
  const nodes: RichNode[] = [];
  let listBuffer: string[] = [];

  const flushList = () => {
    if (listBuffer.length) {
      nodes.push(bulletList(listBuffer));
      listBuffer = [];
    }
  };

  for (const raw of lines) {
    const line = raw.trim();
    if (!line) {
      flushList();
      continue;
    }
    if (line.startsWith("## ")) {
      flushList();
      nodes.push(headingNode(2, line.slice(3)));
      continue;
    }
    if (line.startsWith("### ")) {
      flushList();
      nodes.push(headingNode(3, line.slice(4)));
      continue;
    }
    if (line.startsWith("- ") || line.startsWith("* ")) {
      listBuffer.push(line.slice(2));
      continue;
    }
    if (/^\d+\.\s/.test(line)) {
      listBuffer.push(line.replace(/^\d+\.\s/, ""));
      continue;
    }
    flushList();
    nodes.push(textParagraph(line));
  }
  flushList();
  return nodes.length ? doc(...nodes) : paragraphDoc("");
}

export function buildSectionInputs(
  kind: ContentTemplateKind,
  copy: Record<string, string | string[] | undefined>,
): ContentSectionInput[] {
  return seededSectionsFor(kind, copy);
}

export function assignSectionIds(
  inputs: ContentSectionInput[],
  idFor: (anchor: string, index: number) => string,
): ContentSection[] {
  return inputs.map((section, index) => ({
    ...section,
    id: idFor(section.anchor, index),
  }));
}
