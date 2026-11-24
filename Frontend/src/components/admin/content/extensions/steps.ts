import { Node, mergeAttributes } from "@tiptap/core";
import { ReactNodeViewRenderer } from "@tiptap/react";
import { StepsNodeView } from "../steps-node-view";

export type StepsItem = { title: string; description: string };

declare module "@tiptap/core" {
  interface Commands<ReturnType> {
    steps: {
      setSteps: (attrs?: { items?: StepsItem[] }) => ReturnType;
    };
  }
}

const DEFAULT_ITEMS: StepsItem[] = [
  { title: "گام اول", description: "توضیح کوتاه این گام را بنویسید." },
];

/** Numbered steps list — attrs.items (contract `steps`). */
export function createStepsExtension() {
  return Node.create({
    name: "steps",
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
          renderHTML: (attributes: { items?: StepsItem[] }) => ({
            "data-items": JSON.stringify(attributes.items ?? DEFAULT_ITEMS),
          }),
        },
      };
    },

    parseHTML() {
      return [{ tag: 'div[data-type="steps"]' }];
    },

    renderHTML({ HTMLAttributes }) {
      return [
        "div",
        mergeAttributes(HTMLAttributes, { "data-type": "steps" }),
      ];
    },

    addCommands() {
      return {
        setSteps:
          (attrs) =>
          ({ commands }) =>
            commands.insertContent({
              type: this.name,
              attrs: { items: attrs?.items ?? DEFAULT_ITEMS },
            }),
      };
    },

    addNodeView() {
      return ReactNodeViewRenderer(StepsNodeView);
    },
  });
}
