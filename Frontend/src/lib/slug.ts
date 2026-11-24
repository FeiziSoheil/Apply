/**
 * Persian → Latin transliteration and kebab-case slug helpers for CMS forms.
 * Intentionally simple (common letters only); editors can always override.
 */

const PERSIAN_TO_LATIN: Record<string, string> = {
  ا: "a",
  آ: "a",
  ب: "b",
  پ: "p",
  ت: "t",
  ث: "s",
  ج: "j",
  چ: "ch",
  ح: "h",
  خ: "kh",
  د: "d",
  ذ: "z",
  ر: "r",
  ز: "z",
  ژ: "zh",
  س: "s",
  ش: "sh",
  ص: "s",
  ض: "z",
  ط: "t",
  ظ: "z",
  ع: "a",
  غ: "gh",
  ف: "f",
  ق: "gh",
  ک: "k",
  ك: "k",
  گ: "g",
  ل: "l",
  م: "m",
  ن: "n",
  و: "v",
  ه: "h",
  ی: "y",
  ي: "y",
  ء: "",
  ئ: "y",
  ؤ: "v",
  أ: "a",
  إ: "e",
  ة: "h",
  " ": "-",
};

/** Zero-width non-joiner → hyphen separator */
const ZWNJ = "\u200c";

/** ASCII kebab-case: lowercase letters, digits, single hyphens */
export const SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

/** Transliterate Persian/Arabic letters, then normalize to kebab-case */
export function slugify(input: string): string {
  const mapped = Array.from(input.trim().toLowerCase())
    .map((char) => {
      if (/[a-z0-9]/.test(char)) return char;
      if (char === ZWNJ) return "-";
      if (PERSIAN_TO_LATIN[char] !== undefined) return PERSIAN_TO_LATIN[char];
      if (/[\s_/\\.,;:?!()[\]{}«»"'`~+]/.test(char)) return "-";
      return "";
    })
    .join("");

  return mapped
    .replace(/-+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 120);
}

export function isValidSlug(value: string): boolean {
  return SLUG_PATTERN.test(value);
}
