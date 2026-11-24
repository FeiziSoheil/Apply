import { TableKit } from "@tiptap/extension-table";

export function createTableExtension() {
  return TableKit.configure({
    table: {
      resizable: false,
      HTMLAttributes: {
        class: "w-full border-collapse text-sm",
      },
    },
    tableCell: {
      HTMLAttributes: {
        class: "border border-border px-3 py-2 align-top",
      },
    },
    tableHeader: {
      HTMLAttributes: {
        class: "border border-border bg-muted/50 px-3 py-2 text-start font-medium",
      },
    },
  });
}
