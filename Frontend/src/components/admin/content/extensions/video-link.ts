import { Node, mergeAttributes } from "@tiptap/core";
import { ReactNodeViewRenderer } from "@tiptap/react";
import { VideoLinkNodeView } from "../video-link-node-view";

declare module "@tiptap/core" {
  interface Commands<ReturnType> {
    videoLink: {
      setVideoLink: (attrs?: { href?: string }) => ReturnType;
    };
  }
}

const DEFAULT_HREF = "https://example.com/video";

/** External video URL card — href https only (contract `videoLink`). */
export function createVideoLinkExtension() {
  return Node.create({
    name: "videoLink",
    group: "block",
    atom: true,
    draggable: true,
    selectable: true,

    addAttributes() {
      return {
        href: {
          default: DEFAULT_HREF,
          parseHTML: (element) =>
            element.getAttribute("data-href") ?? DEFAULT_HREF,
          renderHTML: (attributes: { href?: string }) => ({
            "data-href": attributes.href ?? DEFAULT_HREF,
          }),
        },
      };
    },

    parseHTML() {
      return [{ tag: 'div[data-type="videoLink"]' }];
    },

    renderHTML({ HTMLAttributes }) {
      return [
        "div",
        mergeAttributes(HTMLAttributes, { "data-type": "videoLink" }),
      ];
    },

    addCommands() {
      return {
        setVideoLink:
          (attrs) =>
          ({ commands }) =>
            commands.insertContent({
              type: this.name,
              attrs: { href: attrs?.href ?? DEFAULT_HREF },
            }),
      };
    },

    addNodeView() {
      return ReactNodeViewRenderer(VideoLinkNodeView);
    },
  });
}
