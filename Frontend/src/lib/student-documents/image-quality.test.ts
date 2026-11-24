import { describe, expect, it } from "vitest";
import {
  assessImageQuality,
  laplacianVariance,
  meanLuminance,
} from "./image-quality";

function solidRgba(
  width: number,
  height: number,
  r: number,
  g: number,
  b: number,
): Uint8ClampedArray {
  const data = new Uint8ClampedArray(width * height * 4);
  for (let i = 0; i < data.length; i += 4) {
    data[i] = r;
    data[i + 1] = g;
    data[i + 2] = b;
    data[i + 3] = 255;
  }
  return data;
}

describe("image quality heuristics", () => {
  it("detects dark images", () => {
    const data = solidRgba(20, 20, 10, 10, 10);
    const warnings = assessImageQuality({ data, width: 20, height: 20 });
    expect(warnings.some((w) => w.code === "dark")).toBe(true);
  });

  it("does not flag bright solid as dark", () => {
    const data = solidRgba(20, 20, 200, 200, 200);
    const mean = meanLuminance(data);
    expect(mean).toBeGreaterThan(100);
    const warnings = assessImageQuality(
      { data, width: 20, height: 20 },
      { blurVarianceThreshold: 0 },
    );
    expect(warnings.some((w) => w.code === "dark")).toBe(false);
  });

  it("laplacianVariance is near zero for flat gray", () => {
    const gray = new Float64Array(25).fill(128);
    expect(laplacianVariance(gray, 5, 5)).toBeLessThan(1);
  });

  it("flags flat image as blurry", () => {
    const data = solidRgba(40, 40, 180, 180, 180);
    const warnings = assessImageQuality({ data, width: 40, height: 40 });
    expect(warnings.some((w) => w.code === "blurry")).toBe(true);
  });
});
