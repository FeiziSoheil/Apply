/**
 * Soft (non-blocking) heuristics for blurry / dark student document photos.
 * Operates on raw ImageData so it is easy to unit-test without DOM.
 */

export type ImageQualityWarning = {
  code: "dark" | "blurry";
  message: string;
};

export type ImageQualityOptions = {
  /** Mean luminance 0–255 below this → dark warning (default 45) */
  darkMeanThreshold?: number;
  /**
   * Laplacian variance below this → blurry warning (default 80).
   * Higher = sharper.
   */
  blurVarianceThreshold?: number;
};

/** Mean of R channel approx luminance for grayscale sample. */
export function meanLuminance(data: Uint8ClampedArray): number {
  let sum = 0;
  const pixels = data.length / 4;
  if (pixels === 0) return 0;
  for (let i = 0; i < data.length; i += 4) {
    // Rec. 601 luma
    sum += 0.299 * data[i]! + 0.587 * data[i + 1]! + 0.114 * data[i + 2]!;
  }
  return sum / pixels;
}

/**
 * Approximate Laplacian variance on a downsampled gray grid.
 * `gray` is row-major width×height, values 0–255.
 */
export function laplacianVariance(
  gray: Float64Array,
  width: number,
  height: number,
): number {
  if (width < 3 || height < 3) return 0;
  const values: number[] = [];
  for (let y = 1; y < height - 1; y++) {
    for (let x = 1; x < width - 1; x++) {
      const i = y * width + x;
      const lap =
        -gray[i - width]! -
        gray[i - 1]! -
        gray[i + 1]! -
        gray[i + width]! +
        4 * gray[i]!;
      values.push(lap);
    }
  }
  if (values.length === 0) return 0;
  let mean = 0;
  for (const v of values) mean += v;
  mean /= values.length;
  let variance = 0;
  for (const v of values) {
    const d = v - mean;
    variance += d * d;
  }
  return variance / values.length;
}

/** Build gray buffer from ImageData (full or sampled). */
export function imageDataToGray(
  data: Uint8ClampedArray,
  width: number,
  height: number,
  sampleStep = 1,
): { gray: Float64Array; width: number; height: number } {
  const sw = Math.max(1, Math.floor(width / sampleStep));
  const sh = Math.max(1, Math.floor(height / sampleStep));
  const gray = new Float64Array(sw * sh);
  let gi = 0;
  for (let y = 0; y < sh; y++) {
    for (let x = 0; x < sw; x++) {
      const sx = Math.min(width - 1, x * sampleStep);
      const sy = Math.min(height - 1, y * sampleStep);
      const i = (sy * width + sx) * 4;
      gray[gi++] =
        0.299 * data[i]! + 0.587 * data[i + 1]! + 0.114 * data[i + 2]!;
    }
  }
  return { gray, width: sw, height: sh };
}

/**
 * Returns soft warnings (never blocks upload). Empty = looks OK.
 */
export function assessImageQuality(
  imageData: { data: Uint8ClampedArray; width: number; height: number },
  options: ImageQualityOptions = {},
): ImageQualityWarning[] {
  const darkMeanThreshold = options.darkMeanThreshold ?? 45;
  const blurVarianceThreshold = options.blurVarianceThreshold ?? 80;
  const warnings: ImageQualityWarning[] = [];

  const mean = meanLuminance(imageData.data);
  if (mean < darkMeanThreshold) {
    warnings.push({
      code: "dark",
      message:
        "این عکس کمی تاریک به نظر می‌رسد. در نور بهتر دوباره بگیرید تا خواناتر باشد.",
    });
  }

  const step =
    Math.max(imageData.width, imageData.height) > 800 ? 2 : 1;
  const { gray, width, height } = imageDataToGray(
    imageData.data,
    imageData.width,
    imageData.height,
    step,
  );
  const variance = laplacianVariance(gray, width, height);
  if (variance < blurVarianceThreshold) {
    warnings.push({
      code: "blurry",
      message:
        "عکس ممکن است تار باشد. دستتان را ثابت نگه دارید یا از فاصله مناسب عکس بگیرید.",
    });
  }

  return warnings;
}

/** Browser helper: read File/Blob into ImageData via canvas. */
export async function readImageDataFromBlob(
  blob: Blob,
): Promise<{ data: Uint8ClampedArray; width: number; height: number }> {
  const bitmap = await createImageBitmap(blob);
  try {
    const maxSide = 640;
    const scale = Math.min(1, maxSide / Math.max(bitmap.width, bitmap.height));
    const w = Math.max(1, Math.round(bitmap.width * scale));
    const h = Math.max(1, Math.round(bitmap.height * scale));
    const canvas = document.createElement("canvas");
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext("2d", { willReadFrequently: true });
    if (!ctx) throw new Error("امکان بررسی کیفیت تصویر نیست.");
    ctx.drawImage(bitmap, 0, 0, w, h);
    const imageData = ctx.getImageData(0, 0, w, h);
    return {
      data: imageData.data,
      width: imageData.width,
      height: imageData.height,
    };
  } finally {
    bitmap.close();
  }
}
