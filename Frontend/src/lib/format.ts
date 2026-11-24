import { format as formatJalali } from "date-fns-jalali";

const PERSIAN_DIGIT_MAP: Record<string, string> = {
  "0": "۰",
  "1": "۱",
  "2": "۲",
  "3": "۳",
  "4": "۴",
  "5": "۵",
  "6": "۶",
  "7": "۷",
  "8": "۸",
  "9": "۹",
};

/** Convert English (and Arabic-Indic) digits to Persian digits */
export function toPersianDigits(value: string | number): string {
  return String(value).replace(/[0-9]/g, (digit) => PERSIAN_DIGIT_MAP[digit] ?? digit);
}

/** Format number with Persian digits and thousand separators */
export function formatNumber(value: number): string {
  return new Intl.NumberFormat("fa-IR").format(value);
}

/**
 * Format price in تومان with Persian digits and thousand separators.
 * @example formatPrice(1250000) → "۱٬۲۵۰٬۰۰۰ تومان"
 */
export function formatPrice(value: number, currency = "تومان"): string {
  return `${formatNumber(value)} ${currency}`;
}

/**
 * نمایش مبلغ API (ریال صحیح) به‌صورت تومان — همیشه واحد را نشان می‌دهد.
 * تنها formatter پول پنل دانشجو / CRM مالی.
 * @example formatMoney(450_000_000) → "۴۵٬۰۰۰٬۰۰۰ تومان"
 */
export function formatMoney(rials: number): string {
  return formatPrice(Math.round(rials / 10));
}

/** @deprecated از `formatMoney` استفاده کنید */
export function formatRialsAsToman(rials: number): string {
  return formatMoney(rials);
}

/** Format a Date or ISO string as Jalali calendar date with Persian digits */
export function formatJalaliDate(
  date: Date | string,
  pattern = "yyyy/MM/dd",
): string {
  const d = typeof date === "string" ? new Date(date) : date;
  return toPersianDigits(formatJalali(d, pattern));
}

/**
 * Relative Persian time label (e.g. «۲ روز پیش»، «همین الان»).
 * Uses calendar days in local time; future dates → «به‌زودی».
 */
export function formatRelativeFa(
  date: Date | string,
  now: Date = new Date(),
): string {
  const target = typeof date === "string" ? new Date(date) : date;
  const diffMs = now.getTime() - target.getTime();
  if (Number.isNaN(diffMs)) return "—";
  if (diffMs < 0) return "به‌زودی";
  const minutes = Math.floor(diffMs / 60_000);
  if (minutes < 1) return "همین الان";
  if (minutes < 60) return `${toPersianDigits(minutes)} دقیقه پیش`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${toPersianDigits(hours)} ساعت پیش`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${toPersianDigits(days)} روز پیش`;
  const months = Math.floor(days / 30);
  if (months < 12) return `${toPersianDigits(months)} ماه پیش`;
  return `${toPersianDigits(Math.floor(months / 12))} سال پیش`;
}
