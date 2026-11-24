import type { ColumnDef, RowData } from "@tanstack/react-table";

declare module "@tanstack/react-table" {
  // The type parameters must match the library declaration exactly
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  interface ColumnMeta<TData extends RowData, TValue> {
    /** Persian label: column-visibility menu and the mobile card row label */
    label?: string;
    /**
     * Mobile card behaviour (< md):
     * `title` = card heading, `hidden` = not shown, default = label/value row
     */
    mobile?: "title" | "hidden";
    /** Extra classes for the `<th>` and `<td>` of the column (table layout) */
    className?: string;
  }
}

export const SELECT_COLUMN_ID = "select";
export const ACTIONS_COLUMN_ID = "actions";

/** Persian label of a column: `meta.label`, else a string header, else the id */
export function getColumnLabel<TData extends RowData, TValue>(column: {
  id: string;
  columnDef: ColumnDef<TData, TValue>;
}): string {
  const { meta, header } = column.columnDef;
  if (meta?.label) return meta.label;
  return typeof header === "string" ? header : column.id;
}
