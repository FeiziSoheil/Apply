import {
  MAX_LEAD_IMPORT_FILE_BYTES,
  MAX_LEAD_IMPORT_ROWS,
} from "@/contracts/leads";

export type SheetTable = {
  /** Original header cells (row 1) */
  headers: string[];
  /** Data rows as parallel string arrays (same length as headers) */
  rows: string[][];
  /** Total data rows before truncation */
  totalDataRows: number;
};

export type SheetReadError = {
  code: "too_large" | "empty" | "invalid" | "too_many_rows" | "unknown_format";
  message: string;
};

function isSheetReadError(value: unknown): value is SheetReadError {
  return (
    typeof value === "object" &&
    value !== null &&
    "code" in value &&
    "message" in value
  );
}

function cellToString(value: unknown): string {
  if (value === null || value === undefined) return "";
  if (typeof value === "string") return value.trim();
  if (typeof value === "number" || typeof value === "boolean") {
    return String(value);
  }
  if (value instanceof Date) return value.toISOString();
  return String(value).trim();
}

function normalizeMatrix(matrix: unknown[][]): SheetTable | SheetReadError {
  if (matrix.length === 0) {
    return { code: "empty", message: "فایل خالی است یا هدر ندارد." };
  }
  const headers = (matrix[0] ?? []).map(cellToString);
  if (headers.every((h) => !h)) {
    return { code: "empty", message: "ردیف هدر نامعتبر است." };
  }
  const dataRows = matrix.slice(1).map((row) => {
    const cells = headers.map((_, index) => cellToString(row[index]));
    return cells;
  });
  const nonEmpty = dataRows.filter((row) => row.some((cell) => cell !== ""));
  if (nonEmpty.length === 0) {
    return { code: "empty", message: "هیچ سطر داده‌ای در فایل پیدا نشد." };
  }
  if (nonEmpty.length > MAX_LEAD_IMPORT_ROWS) {
    return {
      code: "too_many_rows",
      message: `تعداد سطرها از سقف ${MAX_LEAD_IMPORT_ROWS.toLocaleString("fa-IR")} بیشتر است.`,
    };
  }
  return {
    headers,
    rows: nonEmpty,
    totalDataRows: nonEmpty.length,
  };
}

/**
 * Read CSV or XLSX (SheetJS) into a header + rows table.
 * Enforces 5 MB / 5 000-row guardrails with Persian messages.
 */
export async function readSheetFile(
  file: File,
): Promise<SheetTable | SheetReadError> {
  if (file.size > MAX_LEAD_IMPORT_FILE_BYTES) {
    return {
      code: "too_large",
      message: `حجم فایل از سقف ${(MAX_LEAD_IMPORT_FILE_BYTES / (1024 * 1024)).toLocaleString("fa-IR")} مگابایت بیشتر است.`,
    };
  }

  const name = file.name.toLowerCase();
  const isCsv = name.endsWith(".csv") || file.type.includes("csv");
  const isXlsx =
    name.endsWith(".xlsx") ||
    name.endsWith(".xls") ||
    file.type.includes("spreadsheet") ||
    file.type.includes("excel");

  if (!isCsv && !isXlsx) {
    return {
      code: "unknown_format",
      message: "فقط فایل‌های CSV یا Excel (XLSX) پشتیبانی می‌شوند.",
    };
  }

  try {
    const XLSX = await import("xlsx");
    const buffer = await file.arrayBuffer();
    const workbook = XLSX.read(buffer, { type: "array", raw: false });
    const first = workbook.SheetNames[0];
    if (!first) {
      return { code: "empty", message: "فایل برگه‌ای برای خواندن ندارد." };
    }
    const sheet = workbook.Sheets[first];
    if (!sheet) {
      return { code: "empty", message: "برگه اول فایل خالی است." };
    }
    const matrix = XLSX.utils.sheet_to_json<(string | number | boolean | null)[]>(
      sheet,
      { header: 1, defval: "", blankrows: false },
    );
    return normalizeMatrix(matrix as unknown[][]);
  } catch (error) {
    if (isSheetReadError(error)) return error;
    return {
      code: "invalid",
      message: "خواندن فایل ناموفق بود. قالب را بررسی کنید یا از نمونه استفاده کنید.",
    };
  }
}

/** Build a sample CSV (UTF-8 BOM) for the download button. */
export function buildLeadImportSampleCsv(): string {
  const lines = [
    "نام,موبایل,ایمیل,کشور,منبع,یادداشت,اولویت",
    "علی نمونه,09121234567,ali@example.com,germany,manual,یادداشت تست,normal",
    "سارا تکراری,09121234567,sara@example.com,canada,,تکراری داخل فایل,high",
    "نامعتبر,,bad-email,nowhere,unknown,خطاهای اعتبارسنجی,urgent",
    "رضا +۹۸,+989121111111,,,از نرمال‌سازی موبایل,",
  ];
  return `\uFEFF${lines.join("\n")}`;
}

export function downloadBlob(filename: string, blob: Blob): void {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
}

export function downloadTextFile(
  filename: string,
  content: string,
  mime = "text/csv;charset=utf-8",
): void {
  downloadBlob(filename, new Blob([content], { type: mime }));
}

export async function downloadBase64Xlsx(
  filename: string,
  base64: string,
): Promise<void> {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i += 1) {
    bytes[i] = binary.charCodeAt(i);
  }
  downloadBlob(
    filename,
    new Blob([bytes], {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    }),
  );
}
