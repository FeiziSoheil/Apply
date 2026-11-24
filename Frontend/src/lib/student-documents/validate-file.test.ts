import { describe, expect, it } from "vitest";
import {
  DEFAULT_STUDENT_MAX_BYTES,
  extensionForMime,
  formatBytesFa,
  isAllowedStudentDocMime,
  validateStudentDocumentFile,
} from "./validate-file";

describe("validateStudentDocumentFile", () => {
  it("accepts jpg/png/pdf within size", () => {
    expect(
      validateStudentDocumentFile({
        name: "a.jpg",
        type: "image/jpeg",
        size: 1000,
      }),
    ).toBeNull();
    expect(
      validateStudentDocumentFile({
        name: "a.png",
        type: "image/png",
        size: 1000,
      }),
    ).toBeNull();
    expect(
      validateStudentDocumentFile({
        name: "a.pdf",
        type: "application/pdf",
        size: 1000,
      }),
    ).toBeNull();
  });

  it("rejects disallowed mime with Persian message", () => {
    const message = validateStudentDocumentFile({
      name: "a.webp",
      type: "image/webp",
      size: 1000,
    });
    expect(message).toMatch(/JPG|PNG|PDF/);
  });

  it("rejects oversized files", () => {
    const message = validateStudentDocumentFile({
      name: "big.pdf",
      type: "application/pdf",
      size: DEFAULT_STUDENT_MAX_BYTES + 1,
    });
    expect(message).toMatch(/حجم فایل/);
  });

  it("rejects empty files", () => {
    expect(
      validateStudentDocumentFile({
        name: "empty.pdf",
        type: "application/pdf",
        size: 0,
      }),
    ).toMatch(/خالی/);
  });
});

describe("helpers", () => {
  it("isAllowedStudentDocMime", () => {
    expect(isAllowedStudentDocMime("image/jpeg")).toBe(true);
    expect(isAllowedStudentDocMime("image/webp")).toBe(false);
  });

  it("extensionForMime + formatBytesFa", () => {
    expect(extensionForMime("image/jpeg")).toBe("jpg");
    expect(formatBytesFa(2048)).toMatch(/کیلوبایت/);
  });
});
