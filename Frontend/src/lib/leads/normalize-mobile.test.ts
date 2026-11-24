import { describe, expect, it } from "vitest";
import { normalizeIranMobile } from "./normalize-mobile";

describe("normalizeIranMobile", () => {
  it("keeps already-normalized mobiles", () => {
    expect(normalizeIranMobile("09123456789")).toBe("09123456789");
  });

  it("converts Persian digits", () => {
    expect(normalizeIranMobile("۰۹۱۲۳۴۵۶۷۸۹")).toBe("09123456789");
  });

  it("normalizes +98 and 0098 prefixes", () => {
    expect(normalizeIranMobile("+989123456789")).toBe("09123456789");
    expect(normalizeIranMobile("00989123456789")).toBe("09123456789");
    expect(normalizeIranMobile("989123456789")).toBe("09123456789");
  });

  it("prefixes bare 9xxxxxxxxx", () => {
    expect(normalizeIranMobile("9123456789")).toBe("09123456789");
  });

  it("strips spaces and dashes", () => {
    expect(normalizeIranMobile("0912 345-6789")).toBe("09123456789");
  });

  it("returns null for invalid values", () => {
    expect(normalizeIranMobile("")).toBeNull();
    expect(normalizeIranMobile("12345")).toBeNull();
    expect(normalizeIranMobile("08123456789")).toBeNull();
  });
});
