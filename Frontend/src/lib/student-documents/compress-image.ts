/** Client-side image compression before student document upload. */

export const MAX_IMAGE_EDGE = 2048;
export const DEFAULT_JPEG_QUALITY = 0.82;

export type CompressImageOptions = {
  maxEdge?: number;
  quality?: number;
  /** Output MIME; default image/jpeg */
  mimeType?: "image/jpeg" | "image/png";
};

export type CompressImageResult = {
  blob: Blob;
  width: number;
  height: number;
  mimeType: string;
};

/**
 * Scale dimensions so the longest edge ≤ maxEdge (no upscale).
 */
export function fitWithinMaxEdge(
  width: number,
  height: number,
  maxEdge: number = MAX_IMAGE_EDGE,
): { width: number; height: number } {
  if (width <= 0 || height <= 0) return { width: 0, height: 0 };
  const longest = Math.max(width, height);
  if (longest <= maxEdge) return { width, height };
  const scale = maxEdge / longest;
  return {
    width: Math.max(1, Math.round(width * scale)),
    height: Math.max(1, Math.round(height * scale)),
  };
}

function loadImageBitmap(file: Blob): Promise<ImageBitmap> {
  return createImageBitmap(file);
}

/**
 * Compress / downscale an image via canvas. PDFs are returned unchanged by callers.
 */
export async function compressImageFile(
  file: Blob,
  options: CompressImageOptions = {},
): Promise<CompressImageResult> {
  const maxEdge = options.maxEdge ?? MAX_IMAGE_EDGE;
  const quality = options.quality ?? DEFAULT_JPEG_QUALITY;
  const mimeType = options.mimeType ?? "image/jpeg";

  const bitmap = await loadImageBitmap(file);
  try {
    const sized = fitWithinMaxEdge(bitmap.width, bitmap.height, maxEdge);
    const canvas = document.createElement("canvas");
    canvas.width = sized.width;
    canvas.height = sized.height;
    const ctx = canvas.getContext("2d");
    if (!ctx) {
      throw new Error("امکان فشرده‌سازی تصویر وجود ندارد.");
    }
    ctx.drawImage(bitmap, 0, 0, sized.width, sized.height);

    const blob = await new Promise<Blob>((resolve, reject) => {
      canvas.toBlob(
        (result) => {
          if (result) resolve(result);
          else reject(new Error("فشرده‌سازی تصویر ناموفق بود."));
        },
        mimeType,
        mimeType === "image/jpeg" ? quality : undefined,
      );
    });

    return {
      blob,
      width: sized.width,
      height: sized.height,
      mimeType: blob.type || mimeType,
    };
  } finally {
    bitmap.close();
  }
}
