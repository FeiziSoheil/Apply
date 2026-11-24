/**
 * CSV / spreadsheet formula-injection guard.
 * Cells that start with `=`, `+`, `-`, `@`, tab, or CR get a leading apostrophe
 * so Excel/LibreOffice treat them as plain text.
 */
export function escapeCsvInjection(value: string): string {
  if (
    value.startsWith("=") ||
    value.startsWith("+") ||
    value.startsWith("-") ||
    value.startsWith("@") ||
    value.startsWith("\t") ||
    value.startsWith("\r")
  ) {
    return `'${value}`;
  }
  return value;
}

/** Quote a CSV cell (RFC-style) after applying injection protection. */
export function formatCsvCell(value: string | number | null | undefined): string {
  const raw = value === null || value === undefined ? "" : String(value);
  const safe = escapeCsvInjection(raw);
  return `"${safe.replaceAll('"', '""')}"`;
}

/** Join cells into one CSV line (no trailing newline). */
export function formatCsvRow(cells: readonly (string | number | null | undefined)[]): string {
  return cells.map(formatCsvCell).join(",");
}

/** UTF-8 BOM prefix for Excel-friendly CSV downloads. */
export const CSV_UTF8_BOM = "\uFEFF";

export function buildCsvDocument(
  header: readonly string[],
  rows: readonly (readonly (string | number | null | undefined)[])[],
): string {
  const lines = [formatCsvRow(header), ...rows.map((row) => formatCsvRow(row))];
  return `${CSV_UTF8_BOM}${lines.join("\n")}`;
}
