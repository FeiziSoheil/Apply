import { normalizeDigits } from "@/lib/validations/common";

const IRANIAN_MOBILE_REGEX = /^09\d{9}$/;

/**
 * Normalize Iranian mobiles to `09xxxxxxxxx` (English digits).
 * Accepts Persian/Arabic digits, `+98`, `0098`, `98…`, and bare `9…`.
 * Returns `null` when the value cannot be normalized to a valid mobile.
 */
export function normalizeIranMobile(raw: string): string | null {
  let value = normalizeDigits(raw.trim()).replace(/[\s\-().]/g, "");
  if (!value) return null;

  if (value.startsWith("+98")) {
    value = `0${value.slice(3)}`;
  } else if (value.startsWith("0098")) {
    value = `0${value.slice(4)}`;
  } else if (value.startsWith("98") && value.length === 12) {
    value = `0${value.slice(2)}`;
  } else if (value.startsWith("9") && value.length === 10) {
    value = `0${value}`;
  }

  return IRANIAN_MOBILE_REGEX.test(value) ? value : null;
}

/** Throws a Persian message when normalization fails (forms / import rows). */
export function requireNormalizedIranMobile(raw: string): string {
  const normalized = normalizeIranMobile(raw);
  if (!normalized) {
    throw new Error("شماره موبایل معتبر وارد کنید (مثال: 09123456789)");
  }
  return normalized;
}
