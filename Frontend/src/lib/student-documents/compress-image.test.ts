import { describe, expect, it } from "vitest";
import { fitWithinMaxEdge, MAX_IMAGE_EDGE } from "./compress-image";

describe("fitWithinMaxEdge", () => {
  it("does not upscale small images", () => {
    expect(fitWithinMaxEdge(800, 600, MAX_IMAGE_EDGE)).toEqual({
      width: 800,
      height: 600,
    });
  });

  it("scales landscape so longest edge = max", () => {
    expect(fitWithinMaxEdge(4096, 2048, 2048)).toEqual({
      width: 2048,
      height: 1024,
    });
  });

  it("scales portrait so longest edge = max", () => {
    expect(fitWithinMaxEdge(1000, 4000, 2048)).toEqual({
      width: 512,
      height: 2048,
    });
  });

  it("handles zero", () => {
    expect(fitWithinMaxEdge(0, 10)).toEqual({ width: 0, height: 0 });
  });
});
