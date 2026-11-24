import Highlight from "@tiptap/extension-highlight";

export function createHighlightExtension() {
  return Highlight.extend({
    addKeyboardShortcuts() {
      return {
        "Mod-Shift-h": () => this.editor.commands.toggleHighlight(),
      };
    },
  }).configure({
    multicolor: false,
    HTMLAttributes: {
      class: "bg-warning/30 text-foreground rounded-sm px-0.5",
    },
  });
}
