import Placeholder from "@tiptap/extension-placeholder";

export function createPlaceholderExtension(placeholder: string) {
  return Placeholder.configure({
    placeholder,
    emptyEditorClass: "is-editor-empty",
  });
}
