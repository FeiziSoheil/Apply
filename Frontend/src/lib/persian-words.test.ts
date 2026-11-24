import { describe, expect, it } from "vitest";
import {
  numberToPersianWords,
  rialsToPersianTomanWords,
} from "./persian-words";

describe("numberToPersianWords", () => {
  it("handles zero and small numbers", () => {
    expect(numberToPersianWords(0)).toBe("صفر");
    expect(numberToPersianWords(15)).toBe("پانزده");
    expect(numberToPersianWords(21)).toBe("بیست و یک");
  });

  it("handles thousands and millions", () => {
    expect(numberToPersianWords(1000)).toBe("یک هزار");
    expect(numberToPersianWords(45_000_000)).toBe("چهل و پنج میلیون");
  });
});

describe("rialsToPersianTomanWords", () => {
  it("converts rials to toman words", () => {
    expect(rialsToPersianTomanWords(450_000_000)).toBe(
      "چهل و پنج میلیون تومان",
    );
  });
});
