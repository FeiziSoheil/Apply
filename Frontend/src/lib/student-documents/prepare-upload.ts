import { compressImageFile } from "./compress-image";
import {
  assessImageQuality,
  readImageDataFromBlob,
  type ImageQualityWarning,
} from "./image-quality";
import { mergeImagePagesToPdf } from "./images-to-pdf";
import {
  DEFAULT_STUDENT_MAX_BYTES,
  validateStudentDocumentFile,
} from "./validate-file";

export type PreparedPage = {
  id: string;
  previewUrl: string;
  blob: Blob;
  mimeType: string;
  width: number;
  height: number;
  rotation: 0 | 90 | 180 | 270;
  warnings: ImageQualityWarning[];
};

export type PrepareResult = {
  pages: PreparedPage[];
  /** Soft warnings aggregated */
  warnings: ImageQualityWarning[];
};

function revoke(url: string | null) {
  if (url) URL.revokeObjectURL(url);
}

export function revokePreparedPages(pages: readonly PreparedPage[]) {
  for (const page of pages) revoke(page.previewUrl);
}

/**
 * Validate + compress images; keep PDFs as single page without merge.
 */
export async function prepareFilesForDocument(
  files: readonly File[],
  options: { maxBytes?: number } = {},
): Promise<PrepareResult> {
  const maxBytes = options.maxBytes ?? DEFAULT_STUDENT_MAX_BYTES;
  const pages: PreparedPage[] = [];
  const warnings: ImageQualityWarning[] = [];

  for (const file of files) {
    const invalid = validateStudentDocumentFile(file, { maxBytes });
    if (invalid) throw new Error(invalid);

    if (file.type === "application/pdf") {
      if (files.length > 1) {
        throw new Error(
          "برای چند صفحه، عکس بگیرید یا چند تصویر انتخاب کنید تا در یک PDF ادغام شوند. فایل PDF را جداگانه بفرستید.",
        );
      }
      pages.push({
        id: crypto.randomUUID(),
        previewUrl: URL.createObjectURL(file),
        blob: file,
        mimeType: file.type,
        width: 0,
        height: 0,
        rotation: 0,
        warnings: [],
      });
      continue;
    }

    const compressed = await compressImageFile(file);
    let qualityWarnings: ImageQualityWarning[] = [];
    try {
      const imageData = await readImageDataFromBlob(compressed.blob);
      qualityWarnings = assessImageQuality(imageData);
      warnings.push(...qualityWarnings);
    } catch {
      // soft — ignore quality probe failures
    }

    pages.push({
      id: crypto.randomUUID(),
      previewUrl: URL.createObjectURL(compressed.blob),
      blob: compressed.blob,
      mimeType: compressed.mimeType,
      width: compressed.width,
      height: compressed.height,
      rotation: 0,
      warnings: qualityWarnings,
    });
  }

  return { pages, warnings };
}

/**
 * Build the final File to upload (merge multiple images into one PDF).
 */
export async function buildUploadFile(
  pages: readonly PreparedPage[],
  displayBaseName: string,
): Promise<File> {
  if (pages.length === 0) {
    throw new Error("فایلی برای ارسال انتخاب نشده است.");
  }

  if (pages.length === 1 && pages[0]!.mimeType === "application/pdf") {
    return new File([pages[0]!.blob], `${displayBaseName}.pdf`, {
      type: "application/pdf",
    });
  }

  if (pages.length === 1 && pages[0]!.mimeType.startsWith("image/")) {
    const page = pages[0]!;
    const ext = page.mimeType === "image/png" ? "png" : "jpg";
    return new File([page.blob], `${displayBaseName}.${ext}`, {
      type: page.mimeType,
    });
  }

  const pdfPages = await Promise.all(
    pages.map(async (page) => {
      const buffer = await page.blob.arrayBuffer();
      return {
        bytes: new Uint8Array(buffer),
        mimeType: page.mimeType,
        width: page.width || 1000,
        height: page.height || 1400,
      };
    }),
  );

  return mergeImagePagesToPdf(pdfPages, `${displayBaseName}.pdf`);
}

export async function uploadWithRetry(
  upload: (file: File, signal?: AbortSignal) => Promise<{ id: string }>,
  file: File,
  options: {
    signal?: AbortSignal;
    retries?: number;
    onAttempt?: (attempt: number) => void;
  } = {},
): Promise<{ id: string }> {
  const retries = options.retries ?? 3;
  let lastError: unknown;
  for (let attempt = 1; attempt <= retries; attempt++) {
    if (options.signal?.aborted) throw lastError ?? new Error("آپلود لغو شد.");
    options.onAttempt?.(attempt);
    try {
      return await upload(file, options.signal);
    } catch (error) {
      lastError = error;
      const message = error instanceof Error ? error.message : "";
      const retryable =
        message.includes("ارتباط") ||
        message.includes("شبکه") ||
        message.includes("NETWORK") ||
        (error as { code?: string })?.code === "NETWORK_ERROR";
      if (!retryable || attempt === retries) throw error;
      await new Promise((r) => setTimeout(r, 600 * attempt));
    }
  }
  throw lastError;
}
