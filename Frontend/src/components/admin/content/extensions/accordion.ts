import { Node, mergeAttributes } from "@tiptap/core";
import { ReactNodeViewRenderer } from "@tiptap/react";
import { emptyRichContentDoc, type RichContent } from "@/contracts/richcontent";
import { AccordionNodeView } from "../accordion-node-view";

export type AccordionItem = { question: string; answer: RichContent };

declare module "@tiptap/core" {
  interface Commands<ReturnType> {
    accordion: {
      setAccordion: (attrs?: { items?: AccordionItem[] }) => ReturnType;
    };
  }
}

const DEFAULT_ITEMS: AccordionItem[] = [
  {
    question: "سوال متداول",
    answer: emptyRichContentDoc(),
  },
];

/** FAQ accordion — attrs.items with RichContent answers (contract `accordion`). */
export function createAccordionExtension() {
  return Node.create({
    name: "accordion",
    group: "block",
    atom: true,
    draggable: true,
    selectable: true,

    addAttributes() {
      return {
        items: {
          default: DEFAULT_ITEMS,
          parseHTML: (element) => {
            const raw = element.getAttribute("data-items");
            if (!raw) return DEFAULT_ITEMS;
            try {
              const parsed: unknown = JSON.parse(raw);
              return Array.isArray(parsed) ? parsed : DEFAULT_ITEMS;
            } catch {
              return DEFAULT_ITEMS;
            }
          },
          renderHTML: (attributes: { items?: AccordionItem[] }) => ({
            "data-items": JSON.stringify(attributes.items ?? DEFAULT_ITEMS),
          }),
        },
      };
    },

    parseHTML() {
      return [{ tag: 'div[data-type="accordion"]' }];
    },

    renderHTML({ HTMLAttributes }) {
      return [
        "div",
        mergeAttributes(HTMLAttributes, { "data-type": "accordion" }),
      ];
    },

    addCommands() {
      return {
        setAccordion:
          (attrs) =>
          ({ commands }) =>
            commands.insertContent({
              type: this.name,
              attrs: { items: attrs?.items ?? DEFAULT_ITEMS },
            }),
      };
    },

    addNodeView() {
      return ReactNodeViewRenderer(AccordionNodeView);
    },
  });
}
