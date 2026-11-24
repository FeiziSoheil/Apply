import { Node, mergeAttributes } from "@tiptap/core";
import { ReactNodeViewRenderer } from "@tiptap/react";
import {
  ENTITY_REFERENCE_TYPES,
  type EntityReferenceType,
} from "@/contracts/richcontent";
import { EntityReferenceNodeView } from "../entity-reference-node-view";

/** Placeholder id until the editor picks a real entity (valid UUID shape). */
export const ENTITY_REF_PLACEHOLDER_ID =
  "00000000-0000-4000-8000-000000000000";

declare module "@tiptap/core" {
  interface Commands<ReturnType> {
    entityReference: {
      setEntityReference: (attrs?: {
        entityType?: EntityReferenceType;
        entityId?: string;
      }) => ReturnType;
    };
  }
}

function isEntityType(value: unknown): value is EntityReferenceType {
  return (
    typeof value === "string" &&
    (ENTITY_REFERENCE_TYPES as readonly string[]).includes(value)
  );
}

/** Cross-content entity card — entityType + entityId (contract `entityReference`). */
export function createEntityReferenceExtension() {
  return Node.create({
    name: "entityReference",
    group: "block",
    atom: true,
    draggable: true,
    selectable: true,

    addAttributes() {
      return {
        entityType: {
          default: "country" satisfies EntityReferenceType,
          parseHTML: (element) => {
            const raw = element.getAttribute("data-entity-type");
            return isEntityType(raw) ? raw : "country";
          },
          renderHTML: (attributes: { entityType?: EntityReferenceType }) => ({
            "data-entity-type": attributes.entityType ?? "country",
          }),
        },
        entityId: {
          default: ENTITY_REF_PLACEHOLDER_ID,
          parseHTML: (element) =>
            element.getAttribute("data-entity-id") ?? ENTITY_REF_PLACEHOLDER_ID,
          renderHTML: (attributes: { entityId?: string }) => ({
            "data-entity-id": attributes.entityId ?? ENTITY_REF_PLACEHOLDER_ID,
          }),
        },
      };
    },

    parseHTML() {
      return [{ tag: 'div[data-type="entityReference"]' }];
    },

    renderHTML({ HTMLAttributes }) {
      return [
        "div",
        mergeAttributes(HTMLAttributes, { "data-type": "entityReference" }),
      ];
    },

    addCommands() {
      return {
        setEntityReference:
          (attrs) =>
          ({ commands }) =>
            commands.insertContent({
              type: this.name,
              attrs: {
                entityType: attrs?.entityType ?? "country",
                entityId: attrs?.entityId ?? ENTITY_REF_PLACEHOLDER_ID,
              },
            }),
      };
    },

    addNodeView() {
      return ReactNodeViewRenderer(EntityReferenceNodeView);
    },
  });
}
