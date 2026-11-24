/** Client-side validation for student document uploads (Persian messages). */

export const STUDENT_DOC_MIME_TYPES = [
  "image/jpeg",
  "image/png",
  "application/pdf",
] as const;

export type StudentDocMime = (typeof STUDENT_DOC_MIME_TYPES)[number];

export const DEFAULT_STUDENT_MAX_BYTES = 10 * 1024 * 1024;

const MIME_LABEL: Record<string, string> = {
  "image/jpeg": "JPG",
  "image/png": "PNG",
  "application/pdf": "PDF",
};

export function formatBytesFa(bytes: number): string {
  if (bytes < 1024) return `${bytes} بایت`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} کیلوبایت`;
  const mb = Math.round((bytes / (1024 * 1024)) * 10) / 10;
  return `${mb} مگابایت`;
}

export function isAllowedStudentDocMime(mime: string): mime is StudentDocMime {
  return (STUDENT_DOC_MIME_TYPES as readonly string[]).includes(mime);
}

/**
 * Returns a Persian error message, or `null` if the file is acceptable.
 */
export function validateStudentDocumentFile(
  file: { name: string; type: string; size: number },
  options: {
    maxBytes?: number;
    accept?: readonly string[];
  } = {},
): string | null {
  const maxBytes = options.maxBytes ?? DEFAULT_STUDENT_MAX_BYTES;
  const accept = options.accept ?? STUDENT_DOC_MIME_TYPES;

  if (!file.type || !accept.includes(file.type)) {
    const labels = accept.map((mime) => MIME_LABEL[mime] ?? mime).join("، ");
    return `فقط فایل‌های ${labels} پذیرفته می‌شوند.`;
  }
  if (file.size <= 0) {
    return "فایل خالی است. لطفاً فایل دیگری انتخاب کنید.";
  }
  if (file.size > maxBytes) {
    return `حجم فایل نباید بیشتر از ${formatBytesFa(maxBytes)} باشد.`;
  }
  return null;
}

/** Extension from MIME for safe display names (never use original filename). */
export function extensionForMime(mime: string): string {
  if (mime === "application/pdf") return "pdf";
  if (mime === "image/png") return "png";
  if (mime === "image/jpeg") return "jpg";
  return "bin";
}
