import Image from "@tiptap/extension-image";
import { ReactNodeViewRenderer } from "@tiptap/react";
import { ImageNodeView } from "../image-node-view";

export type SetFileImageAttrs = {
  fileId: string;
  src: string;
  alt: string;
  caption?: string | null;
};

declare module "@tiptap/core" {
  interface Commands<ReturnType> {
    fileImage: {
      setFileImage: (attrs: SetFileImageAttrs) => ReturnType;
    };
  }
}

/**
 * Block image stored as fileId (+ alt/caption) per RichContent contract.
 * `src` is editor-only for preview and is stripped on export.
 */
export function createImageExtension() {
  return Image.extend({
    name: "image",
    inline: false,
    group: "block",
    draggable: true,
    selectable: true,
    atom: true,

    addAttributes() {
      return {
        ...this.parent?.(),
        fileId: {
          default: null,
          parseHTML: (element) => element.getAttribute("data-file-id"),
          renderHTML: (attributes: { fileId?: string | null }) => {
            if (!attributes.fileId) return {};
            return { "data-file-id": attributes.fileId };
          },
        },
        caption: {
          default: null,
        },
      };
    },

    parseHTML() {
      return [
        {
          tag: "img[data-file-id]",
        },
        {
          tag: "img[src]",
          getAttrs: () => false, // reject external/pasted imgs without fileId
        },
      ];
    },

    addCommands() {
      return {
        setFileImage:
          (attrs) =>
          ({ commands }) =>
            commands.insertContent({
              type: this.name,
              attrs: {
                fileId: attrs.fileId,
                src: attrs.src,
                alt: attrs.alt,
                caption: attrs.caption ?? null,
              },
            }),
      };
    },

    addNodeView() {
      return ReactNodeViewRenderer(ImageNodeView);
    },
  }).configure({
    allowBase64: false,
    inline: false,
  });
}
