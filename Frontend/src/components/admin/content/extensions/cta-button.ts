import { Node, mergeAttributes } from "@tiptap/core";
import { ReactNodeViewRenderer } from "@tiptap/react";
import {
  CTA_BUTTON_TYPES,
  type CtaButtonType,
} from "@/contracts/richcontent";
import { CtaButtonNodeView } from "../cta-button-node-view";

export type CtaButtonAttrs = {
  text: string;
  type: CtaButtonType;
  href?: string | null;
};

declare module "@tiptap/core" {
  interface Commands<ReturnType> {
    ctaButton: {
      setCtaButton: (attrs?: Partial<CtaButtonAttrs>) => ReturnType;
    };
  }
}

function isCtaType(value: unknown): value is CtaButtonType {
  return (
    typeof value === "string" &&
    (CTA_BUTTON_TYPES as readonly string[]).includes(value)
  );
}

const DEFAULT_ATTRS: CtaButtonAttrs = {
  text: "شروع ارزیابی رایگان",
  type: "assessment",
  href: null,
};

/** CTA button — assessment | booking | link (contract `ctaButton`). */
export function createCtaButtonExtension() {
  return Node.create({
    name: "ctaButton",
    group: "block",
    atom: true,
    draggable: true,
    selectable: true,

    addAttributes() {
      return {
        text: {
          default: DEFAULT_ATTRS.text,
        },
        type: {
          default: DEFAULT_ATTRS.type,
          parseHTML: (element) => {
            const raw = element.getAttribute("data-cta-type");
            return isCtaType(raw) ? raw : "assessment";
          },
          renderHTML: (attributes: { type?: CtaButtonType }) => ({
            "data-cta-type": attributes.type ?? "assessment",
          }),
        },
        href: {
          default: null,
        },
      };
    },

    parseHTML() {
      return [{ tag: 'div[data-type="ctaButton"]' }];
    },

    renderHTML({ HTMLAttributes }) {
      return [
        "div",
        mergeAttributes(HTMLAttributes, { "data-type": "ctaButton" }),
      ];
    },

    addCommands() {
      return {
        setCtaButton:
          (attrs) =>
          ({ commands }) =>
            commands.insertContent({
              type: this.name,
              attrs: {
                text: attrs?.text ?? DEFAULT_ATTRS.text,
                type: attrs?.type ?? DEFAULT_ATTRS.type,
                href: attrs?.href ?? null,
              },
            }),
      };
    },

    addNodeView() {
      return ReactNodeViewRenderer(CtaButtonNodeView);
    },
  });
}
