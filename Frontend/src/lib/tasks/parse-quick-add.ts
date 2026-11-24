/**
 * Lightweight Persian phrase parser for task quick-add.
 * Handles simple patterns like «فردا ۱۰ زنگ بزن» / «پس‌فردا تماس».
 * Complex phrases return `ok: false` so the UI opens the full form.
 */

export type QuickAddParseResult =
  | {
      ok: true;
      title: string;
      dueAt: string;
    }
  | {
      ok: false;
      reason: "empty" | "complex" | "unparsed";
      titleHint: string;
    };

const COMPLEX_HINTS =
  /اولویت|یادآور|توضیح|مسئول|مرتبط|لید|پرونده|رزرو|بالا|پایین/i;

const RELATIVE_DAY: Array<{ pattern: RegExp; offsetDays: number }> = [
  { pattern: /پس\s*فردا|پسفردا/, offsetDays: 2 },
  { pattern: /فردا/, offsetDays: 1 },
  { pattern: /امروز/, offsetDays: 0 },
];

const HOUR_PATTERN =
  /(?:ساعت\s*)?([۰-۹0-9]{1,2})(?::([۰-۹0-9]{2}))?(?:\s*(صبح|عصر|شب))?/;

function toEnglishDigits(value: string): string {
  return value
    .replace(/[۰-۹]/g, (d) => String("۰۱۲۳۴۵۶۷۸۹".indexOf(d)))
    .replace(/[٠-٩]/g, (d) => String("٠١٢٣٤٥٦٧٨٩".indexOf(d)));
}

function startOfLocalDay(base = new Date()): Date {
  const d = new Date(base);
  d.setHours(0, 0, 0, 0);
  return d;
}

function buildDueAt(offsetDays: number, hour: number, minute: number): string {
  const d = startOfLocalDay();
  d.setDate(d.getDate() + offsetDays);
  d.setHours(hour, minute, 0, 0);
  return d.toISOString();
}

/**
 * Parse a quick-add phrase. Returns a due datetime + cleaned title when simple.
 */
export function parseQuickAddPhrase(raw: string): QuickAddParseResult {
  const trimmed = raw.trim();
  if (!trimmed) return { ok: false, reason: "empty", titleHint: "" };
  if (COMPLEX_HINTS.test(trimmed) || trimmed.includes("\n")) {
    return { ok: false, reason: "complex", titleHint: trimmed };
  }

  const normalized = toEnglishDigits(trimmed);
  let remaining = normalized;
  let offsetDays: number | null = null;

  for (const entry of RELATIVE_DAY) {
    if (entry.pattern.test(remaining)) {
      offsetDays = entry.offsetDays;
      remaining = remaining.replace(entry.pattern, " ").trim();
      break;
    }
  }

  let hour = 10;
  let minute = 0;
  const hourMatch = remaining.match(HOUR_PATTERN);
  if (hourMatch) {
    hour = Number(hourMatch[1]);
    minute = hourMatch[2] ? Number(hourMatch[2]) : 0;
    const period = hourMatch[3];
    if (period === "عصر" || period === "شب") {
      if (hour < 12) hour += 12;
    }
    if (hour > 23 || minute > 59) {
      return { ok: false, reason: "unparsed", titleHint: trimmed };
    }
    remaining = remaining.replace(hourMatch[0], " ").trim();
  }

  const title = remaining.replace(/\s+/g, " ").trim();
  if (!title || title.length < 2) {
    return { ok: false, reason: "unparsed", titleHint: trimmed };
  }

  // Relative day is required for auto-create; otherwise fall back to form
  if (offsetDays === null) {
    return { ok: false, reason: "unparsed", titleHint: trimmed };
  }

  return {
    ok: true,
    title,
    dueAt: buildDueAt(offsetDays, hour, minute),
  };
}
