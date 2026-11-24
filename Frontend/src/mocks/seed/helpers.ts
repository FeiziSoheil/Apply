import { faker } from "@faker-js/faker/locale/fa";
import { DAY_MS, HOUR_MS } from "../utils";

export { faker };

export const SEED_VALUE = 1405_10_19;

/** Reference "now" of one seed run (all timestamps are relative to it) */
export type SeedClock = { now: number };

export function createClock(): SeedClock {
  return { now: Date.now() };
}

export function iso(ms: number): string {
  return new Date(ms).toISOString();
}

/** Random instant between `fromDaysAgo` and `toDaysAgo` days before now */
export function daysAgoBetween(
  clock: SeedClock,
  fromDaysAgo: number,
  toDaysAgo: number,
): number {
  const from = clock.now - fromDaysAgo * DAY_MS;
  const to = clock.now - toDaysAgo * DAY_MS;
  return Math.round(faker.number.int({ min: Math.min(from, to), max: Math.max(from, to) }));
}

/** `ms + delta`, but never later than `now - 1 minute` */
export function clampToNow(clock: SeedClock, ms: number): number {
  return Math.min(ms, clock.now - 60_000);
}

export function afterHours(
  clock: SeedClock,
  base: number,
  minHours: number,
  maxHours: number,
): number {
  return clampToNow(
    clock,
    base + faker.number.int({ min: minHours * 60, max: maxHours * 60 }) * (HOUR_MS / 60),
  );
}

/** Iranian mobile: `09` + operator (2 digits) + 7 digits */
export function persianMobile(): string {
  const operator = faker.helpers.arrayElement([
    "12", "13", "14", "15", "16", "17", "18", "19", "10", "11",
    "30", "33", "35", "36", "37", "38", "39", "90", "91", "92", "93",
  ]);
  return `09${operator}${faker.string.numeric(7)}`;
}

/** ASCII-only email (faker's `fa` locale would produce Persian local parts) */
export function asciiEmail(prefix = "user"): string {
  return `${prefix}.${faker.string.alphanumeric({ length: 6, casing: "lower" })}@example.com`;
}

/** Full Persian name with at least 3 characters (contract `personNameSchema`) */
export function persianName(): string {
  for (let attempt = 0; attempt < 10; attempt += 1) {
    const name = `${faker.person.firstName()} ${faker.person.lastName()}`.trim();
    if (name.length >= 3 && name.length <= 80) return name;
  }
  return "کاربر آزمایشی";
}

export function pick<T>(items: readonly T[]): T {
  return faker.helpers.arrayElement(items);
}

export function chance(probability: number): boolean {
  return faker.number.float({ min: 0, max: 1 }) < probability;
}

export function weighted<T>(entries: ReadonlyArray<{ value: T; weight: number }>): T {
  return faker.helpers.weightedArrayElement(entries);
}

/** Persian filler sentences for messages / notes */
export const MESSAGE_POOL = [
  "سلام، برای ادامه تحصیل در مقطع ارشد مشاوره می‌خواستم؛ لطفاً با من تماس بگیرید.",
  "می‌خواهم درباره شرایط پذیرش و هزینه‌های تحصیل در آلمان اطلاعات بگیرم.",
  "آیا برای دانشجویان با معدل زیر ۱۵ هم امکان اپلای وجود دارد؟",
  "لطفاً درباره بورسیه‌های موجود برای کانادا و مدارک مورد نیاز راهنمایی کنید.",
  "قبلاً ارزیابی را انجام داده‌ام و می‌خواهم جلسه مشاوره حضوری رزرو کنم.",
  "برای ویزای تحصیلی ایتالیا چه مدارکی لازم است و چقدر زمان می‌برد؟",
  "هزینه خدمات شما برای پذیرش دکتری چقدر است؟ امکان پرداخت اقساطی هست؟",
  "ساعات تماس مناسب برای من بعدازظهرهاست؛ لطفاً هماهنگ کنید.",
] as const;

export const NOTE_POOL = [
  "تماس اولیه گرفته شد؛ مشتری علاقه‌مند به آلمان است.",
  "مدارک اولیه درخواست شد، منتظر ارسال مشتری هستیم.",
  "مشتری بودجه محدودی دارد؛ بورسیه پیشنهاد شد.",
  "پیگیری مجدد برای فردا ساعت ۱۰ هماهنگ شد.",
  "مشتری نیاز به مشاوره درباره مدرک زبان دارد.",
  "پیشنهاد بسته خدمات ارسال شد.",
  "مشتری پس از مقایسه با موسسه دیگر تصمیم می‌گیرد.",
] as const;

export const LOST_REASONS = [
  "بودجه کافی ندارد",
  "از موسسه دیگری خدمات گرفت",
  "منصرف شد",
  "پاسخگو نبود",
] as const;
