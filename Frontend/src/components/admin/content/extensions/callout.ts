import { Node, mergeAttributes } from "@tiptap/core";
import { ReactNodeViewRenderer } from "@tiptap/react";
import {
  CALLOUT_TYPES,
  type CalloutType,
} from "@/contracts/richcontent";
import { CalloutNodeView } from "../callout-node-view";

declare module "@tiptap/core" {
  interface Commands<ReturnType> {
    callout: {
      setCallout: (attrs?: { type?: CalloutType }) => ReturnType;
    };
  }
}

function isCalloutType(value: unknown): value is CalloutType {
  return (
    typeof value === "string" &&
    (CALLOUT_TYPES as readonly string[]).includes(value)
  );
}

/** Callout block — attrs.type + nested rich-text content (contract `callout`). */
export function createCalloutExtension() {
  return Node.create({
    name: "callout",
    group: "block",
    content: "block+",
    defining: true,
    draggable: true,
    selectable: true,

    addAttributes() {
      return {
        type: {
          default: "info" satisfies CalloutType,
          parseHTML: (element) => {
            const raw = element.getAttribute("data-callout-type");
            return isCalloutType(raw) ? raw : "info";
          },
          renderHTML: (attributes: { type?: CalloutType }) => ({
            "data-callout-type": attributes.type ?? "info",
          }),
        },
      };
    },

    parseHTML() {
      return [{ tag: 'aside[data-type="callout"]' }];
    },

    renderHTML({ HTMLAttributes }) {
      return [
        "aside",
        mergeAttributes(HTMLAttributes, { "data-type": "callout" }),
        0,
      ];
    },

    addCommands() {
      return {
        setCallout:
          (attrs) =>
          ({ commands }) =>
            commands.insertContent({
              type: this.name,
              attrs: { type: attrs?.type ?? "info" },
              content: [{ type: "paragraph" }],
            }),
      };
    },

    addNodeView() {
      return ReactNodeViewRenderer(CalloutNodeView);
    },
  });
}
