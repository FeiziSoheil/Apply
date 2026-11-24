import { faker } from "@faker-js/faker/locale/fa";
import type { Pagination, ResponseMeta } from "./types";
import {
  LATENCY_RANGE_MS,
  SLOW_SCENARIO_DELAY_MS,
  isLatencyEnabled,
} from "./config";

/* -------------------------------------------------------------------------- */
/*  Latency                                                                   */
/* -------------------------------------------------------------------------- */

export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export function randomBetween(min: number, max: number): number {
  return Math.floor(min + Math.random() * (max - min + 1));
}

/** Simulated network latency (200–600 ms; 8 s for the `slow` scenario) */
export async function simulateLatency(slow = false): Promise<void> {
  if (slow) {
    await sleep(SLOW_SCENARIO_DELAY_MS);
    return;
  }
  if (!isLatencyEnabled()) return;
  await sleep(randomBetween(LATENCY_RANGE_MS.min, LATENCY_RANGE_MS.max));
}

/* -------------------------------------------------------------------------- */
/*  Identifiers & time                                                        */
/* -------------------------------------------------------------------------- */

/** Fresh UUID for entities created at runtime (never collides with seed ids) */
export function newId(): string {
  const cryptoApi = globalThis.crypto;
  if (cryptoApi && typeof cryptoApi.randomUUID === "function") {
    return cryptoApi.randomUUID();
  }
  return faker.string.uuid();
}

export function nowIso(): string {
  return new Date().toISOString();
}

/** cyrb128-style hash → four 32-bit words */
function hashWords(input: string): [number, number, number, number] {
  let h1 = 1779033703;
  let h2 = 3144134277;
  let h3 = 1013904242;
  let h4 = 2773480762;
  for (let i = 0; i < input.length; i += 1) {
    const k = input.charCodeAt(i);
    h1 = h2 ^ Math.imul(h1 ^ k, 597399067);
    h2 = h3 ^ Math.imul(h2 ^ k, 2869860233);
    h3 = h4 ^ Math.imul(h3 ^ k, 951274213);
    h4 = h1 ^ Math.imul(h4 ^ k, 2716044179);
  }
  h1 = Math.imul(h3 ^ (h1 >>> 18), 597399067);
  h2 = Math.imul(h4 ^ (h2 >>> 22), 2869860233);
  h3 = Math.imul(h1 ^ (h3 >>> 17), 951274213);
  h4 = Math.imul(h2 ^ (h4 >>> 19), 2716044179);
  return [
    (h1 ^ h2 ^ h3 ^ h4) >>> 0,
    (h2 ^ h1) >>> 0,
    (h3 ^ h1) >>> 0,
    (h4 ^ h1) >>> 0,
  ];
}

/** Deterministic, valid UUID v4 derived from a string key (stable seed ids) */
export function uuidFromKey(key: string): string {
  const hex = hashWords(key)
    .map((word) => word.toString(16).padStart(8, "0"))
    .join("");
  const variant = ((parseInt(hex[16], 16) & 0x3) | 0x8).toString(16);
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-4${hex.slice(13, 16)}-${variant}${hex.slice(17, 20)}-${hex.slice(20, 32)}`;
}

export const DAY_MS = 86_400_000;
export const HOUR_MS = 3_600_000;
export const MINUTE_MS = 60_000;

export function addDays(date: Date, days: number): Date {
  return new Date(date.getTime() + days * DAY_MS);
}

/** `YYYY-MM-DD` (UTC) of a date */
export function toIsoDate(date: Date): string {
  return date.toISOString().slice(0, 10);
}

/* -------------------------------------------------------------------------- */
/*  Text search                                                               */
/* -------------------------------------------------------------------------- */

const DIGIT_MAP: Record<string, string> = {
  "۰": "0", "۱": "1", "۲": "2", "۳": "3", "۴": "4",
  "۵": "5", "۶": "6", "۷": "7", "۸": "8", "۹": "9",
  "٠": "0", "١": "1", "٢": "2", "٣": "3", "٤": "4",
  "٥": "5", "٦": "6", "٧": "7", "٨": "8", "٩": "9",
};

/** Lower-case, unify Arabic/Persian letter variants and digits */
export function normalizeText(value: string): string {
  return value
    .replace(/[۰-۹٠-٩]/g, (digit) => DIGIT_MAP[digit] ?? digit)
    .replace(/ي/g, "ی")
    .replace(/ك/g, "ک")
    .replace(/\u200c/g, " ")
    .toLowerCase()
    .trim();
}

/** `true` when `q` is empty or every word of it occurs in one of the fields */
export function matchesQuery(
  q: string | undefined,
  fields: ReadonlyArray<string | null | undefined>,
): boolean {
  if (!q) return true;
  const needle = normalizeText(q);
  if (!needle) return true;
  const haystack = normalizeText(fields.filter(Boolean).join(" "));
  return needle.split(/\s+/).every((word) => haystack.includes(word));
}

/* -------------------------------------------------------------------------- */
/*  Sorting                                                                   */
/* -------------------------------------------------------------------------- */

export type SortValue = string | number | null | undefined;
export type SortAccessors<T> = Readonly<Record<string, (item: T) => SortValue>>;

function compareValues(a: SortValue, b: SortValue): number {
  if (a == null && b == null) return 0;
  if (a == null) return 1; // nulls last
  if (b == null) return -1;
  if (typeof a === "number" && typeof b === "number") return a - b;
  return String(a).localeCompare(String(b), "fa");
}

/** Stable sort; `null`/`undefined` values always go last regardless of order */
export function sortItems<T>(
  items: readonly T[],
  sort: string | undefined,
  order: "asc" | "desc",
  accessors: SortAccessors<T>,
): T[] {
  const accessor = sort ? accessors[sort] : undefined;
  if (!accessor) return [...items];
  const direction = order === "desc" ? -1 : 1;
  return items
    .map((item, index) => ({ item, index }))
    .sort((left, right) => {
      const a = accessor(left.item);
      const b = accessor(right.item);
      if (a == null || b == null) return compareValues(a, b);
      return compareValues(a, b) * direction || left.index - right.index;
    })
    .map(({ item }) => item);
}

/**
 * Sort params: when the client sent no `sort`, use the resource default
 * (e.g. newest first) — the schema's `order` default alone cannot tell
 * "asc by default" from "asc requested".
 */
export function resolveSort(
  requested: { sort?: string; order: "asc" | "desc" },
  fallback: { sort: string; order: "asc" | "desc" },
): { sort: string; order: "asc" | "desc" } {
  if (requested.sort) return { sort: requested.sort, order: requested.order };
  return fallback;
}

/* -------------------------------------------------------------------------- */
/*  Pagination                                                                */
/* -------------------------------------------------------------------------- */

export function paginate<T>(
  items: readonly T[],
  params: { page: number; pageSize: number },
): { items: T[]; pagination: Pagination } {
  const total = items.length;
  const totalPages = total === 0 ? 0 : Math.ceil(total / params.pageSize);
  const start = (params.page - 1) * params.pageSize;
  return {
    items: items.slice(start, start + params.pageSize),
    pagination: {
      page: params.page,
      pageSize: params.pageSize,
      total,
      totalPages,
    },
  };
}

/* -------------------------------------------------------------------------- */
/*  Handler results                                                           */
/* -------------------------------------------------------------------------- */

/** What a handler returns; the route runner wraps it in the envelope */
export type ApiResult = {
  status: 200 | 201 | 202 | 204;
  data?: unknown;
  meta?: ResponseMeta;
  headers?: Record<string, string>;
};

export const ok = (data: unknown, extra?: Partial<ApiResult>): ApiResult => ({
  status: 200,
  data,
  ...extra,
});

export const created = (
  data: unknown,
  extra?: Partial<ApiResult>,
): ApiResult => ({ status: 201, data, ...extra });

export const noContent = (extra?: Partial<ApiResult>): ApiResult => ({
  status: 204,
  ...extra,
});

/** Paginated list result: `{ data: items, meta: { pagination } }` */
export function pageResult<T>(
  items: readonly T[],
  params: { page: number; pageSize: number },
): ApiResult {
  const { items: slice, pagination } = paginate(items, params);
  return { status: 200, data: slice, meta: { pagination } };
}

/* -------------------------------------------------------------------------- */
/*  Misc                                                                      */
/* -------------------------------------------------------------------------- */

export function pick<T extends object, K extends keyof T>(
  source: T,
  keys: readonly K[],
): Pick<T, K> {
  const result = {} as Pick<T, K>;
  for (const key of keys) result[key] = source[key];
  return result;
}

/** Drop keys whose value is `undefined` (so `Partial` patches merge cleanly) */
export function compact<T extends object>(source: T): Partial<T> {
  return Object.fromEntries(
    Object.entries(source).filter(([, value]) => value !== undefined),
  ) as Partial<T>;
}
