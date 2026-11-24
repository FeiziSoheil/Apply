/**
 * تبدیل عدد صحیح غیرمنفی به حروف فارسی (برای رسیدها).
 * ورودی: تومان (نه ریال).
 */

const ONES = [
  "",
  "یک",
  "دو",
  "سه",
  "چهار",
  "پنج",
  "شش",
  "هفت",
  "هشت",
  "نه",
] as const;
const TEENS = [
  "ده",
  "یازده",
  "دوازده",
  "سیزده",
  "چهارده",
  "پانزده",
  "شانزده",
  "هفده",
  "هجده",
  "نوزده",
] as const;
const TENS = [
  "",
  "",
  "بیست",
  "سی",
  "چهل",
  "پنجاه",
  "شصت",
  "هفتاد",
  "هشتاد",
  "نود",
] as const;
const HUNDREDS = [
  "",
  "صد",
  "دویست",
  "سیصد",
  "چهارصد",
  "پانصد",
  "ششصد",
  "هفتصد",
  "هشتصد",
  "نهصد",
] as const;
const SCALES = ["", "هزار", "میلیون", "میلیارد", "تریلیون"] as const;

function threeDigitsToWords(n: number): string {
  if (n <= 0) return "";
  const parts: string[] = [];
  const h = Math.floor(n / 100);
  const rem = n % 100;
  if (h > 0) parts.push(HUNDREDS[h]!);
  if (rem >= 10 && rem <= 19) {
    parts.push(TEENS[rem - 10]!);
  } else {
    const t = Math.floor(rem / 10);
    const o = rem % 10;
    if (t > 0) parts.push(TENS[t]!);
    if (o > 0) parts.push(ONES[o]!);
  }
  return parts.join(" و ");
}

/** عدد صحیح ≥ ۰ → حروف فارسی */
export function numberToPersianWords(value: number): string {
  if (!Number.isFinite(value) || value < 0 || !Number.isInteger(value)) {
    throw new Error("numberToPersianWords expects a non-negative integer");
  }
  if (value === 0) return "صفر";

  const chunks: string[] = [];
  let remaining = value;
  let scale = 0;
  while (remaining > 0 && scale < SCALES.length) {
    const chunk = remaining % 1000;
    if (chunk > 0) {
      const words = threeDigitsToWords(chunk);
      const scaleLabel = SCALES[scale]!;
      chunks.unshift(scaleLabel ? `${words} ${scaleLabel}` : words);
    }
    remaining = Math.floor(remaining / 1000);
    scale += 1;
  }
  return chunks.join(" و ");
}

/**
 * مبلغ API (ریال) → حروف تومان برای چاپ رسید.
 * @example rialsToPersianTomanWords(450_000_000) → "چهل و پنج میلیون تومان"
 */
export function rialsToPersianTomanWords(rials: number): string {
  const tomans = Math.round(rials / 10);
  return `${numberToPersianWords(tomans)} تومان`;
}
