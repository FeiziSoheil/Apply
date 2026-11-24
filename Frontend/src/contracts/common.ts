import { z } from "./zod";

/* -------------------------------------------------------------------------- */
/*  Primitive building blocks                                                 */
/* -------------------------------------------------------------------------- */

/** Resource identifier — always a UUID (v4/v7) */
export const idSchema = z
  .string()
  .uuid("شناسه نامعتبر است")
  .openapi({ example: "3f2b8c4e-6a1d-4e0b-9c57-8d2f1a7b9e10" });

/** ISO 8601 timestamp in UTC, e.g. `2026-10-18T20:25:00.000Z` */
export const isoDateTimeSchema = z
  .string()
  .datetime({ message: "تاریخ و زمان باید به‌صورت ISO 8601 (UTC) باشد" })
  .openapi({ example: "2026-10-18T20:25:00.000Z" });

/** ISO 8601 calendar date, e.g. `2026-10-18` */
export const isoDateSchema = z
  .string()
  .date("تاریخ باید به‌صورت YYYY-MM-DD باشد")
  .openapi({ example: "2026-10-18" });

/** Lowercase ASCII kebab-case slug */
export const slugSchema = z
  .string()
  .min(1)
  .max(120)
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "اسلاگ نامعتبر است")
  .openapi({ example: "tu-munich" });

/** Query for `GET /{resource}/slug-available` */
export const slugAvailabilityQuerySchema = z
  .object({
    slug: slugSchema,
    /** When editing, exclude the current entity so its own slug stays available */
    excludeId: idSchema.optional(),
  })
  .openapi("SlugAvailabilityQuery");
export type SlugAvailabilityQuery = z.infer<typeof slugAvailabilityQuerySchema>;

/** Result of a slug uniqueness check */
export const slugAvailabilitySchema = z
  .object({
    slug: slugSchema,
    available: z.boolean(),
  })
  .openapi("SlugAvailability");
export type SlugAvailability = z.infer<typeof slugAvailabilitySchema>;

/** Iranian mobile in normalized form (English digits) */
export const mobileSchema = z
  .string({ required_error: "شماره موبایل را وارد کنید" })
  .trim()
  .regex(/^09\d{9}$/, "شماره موبایل معتبر وارد کنید (مثال: 09123456789)")
  .openapi({ example: "09123456789" });

export const emailSchema = z
  .string({ required_error: "ایمیل را وارد کنید" })
  .trim()
  .toLowerCase()
  .email("ایمیل معتبر وارد کنید")
  .max(120, "ایمیل نباید بیشتر از ۱۲۰ کاراکتر باشد")
  .openapi({ example: "user@example.com" });

export const personNameSchema = z
  .string({ required_error: "نام را وارد کنید" })
  .trim()
  .min(3, "نام باید حداقل ۳ حرف باشد")
  .max(80, "نام نباید بیشتر از ۸۰ حرف باشد");

/** Money in IRR — always a non-negative integer number of rials */
export const rialsSchema = z
  .number()
  .int("مبلغ باید عدد صحیح (ریال) باشد")
  .min(0, "مبلغ نمی‌تواند منفی باشد")
  .openapi({ example: 150_000_000, description: "مبلغ به ریال (عدد صحیح)" });

/**
 * ISO 4217 alphabetic currency code of an educational amount (tuition, cost of
 * living, budget). Defaults to EUR. Payment / invoice money is always IRR
 * (`rialsSchema`) and does not use this.
 */
export const currencyCodeSchema = z
  .string()
  .regex(/^[A-Z]{3}$/, "کد ارز باید سه حرف بزرگ انگلیسی (ISO 4217) باشد")
  .default("EUR")
  .describe("کد ارز ISO 4217 (پیش‌فرض EUR)")
  .openapi({ example: "EUR" });

/** Fields managed by the server on every persisted entity */
export const auditFields = {
  createdAt: isoDateTimeSchema,
  updatedAt: isoDateTimeSchema,
} as const;

/** Mask used with `.omit()` to derive Create inputs from entity schemas */
export const SERVER_FIELDS = {
  id: true,
  createdAt: true,
  updatedAt: true,
} as const;

/* -------------------------------------------------------------------------- */
/*  Uploaded files                                                            */
/* -------------------------------------------------------------------------- */

export const fileAssetSchema = z
  .object({
    id: idSchema,
    url: z.string().url(),
    name: z.string().min(1).max(255),
    size: z.number().int().min(0).describe("اندازه به بایت"),
    mimeType: z.string().min(1).max(120),
    createdAt: isoDateTimeSchema,
  })
  .openapi("FileAsset");

export type FileAsset = z.infer<typeof fileAssetSchema>;

export const uploadFileBodySchema = z
  .object({
    file: z.string().openapi({ type: "string", format: "binary" }),
  })
  .openapi("UploadFileBody");

/* -------------------------------------------------------------------------- */
/*  Errors                                                                    */
/* -------------------------------------------------------------------------- */

export const ERROR_CODES = [
  "VALIDATION_ERROR",
  "UNAUTHORIZED",
  "FORBIDDEN",
  "NOT_FOUND",
  "CONFLICT",
  "RATE_LIMITED",
  "INTERNAL",
] as const;

export const errorCodeSchema = z.enum(ERROR_CODES).openapi("ErrorCode");
export type ErrorCode = z.infer<typeof errorCodeSchema>;

/** HTTP status that each error code maps to */
export const ERROR_HTTP_STATUS = {
  VALIDATION_ERROR: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  RATE_LIMITED: 429,
  INTERNAL: 500,
} as const satisfies Record<ErrorCode, number>;

/**
 * Machine-readable conflict reason. Clients branch on this (not on `message`).
 * - `version_mismatch`: optimistic concurrency failed (`If-Match` ≠ current `version`)
 */
export const CONFLICT_REASONS = ["version_mismatch"] as const;
export const conflictReasonSchema = z
  .enum(CONFLICT_REASONS)
  .openapi("ConflictReason");
export type ConflictReason = z.infer<typeof conflictReasonSchema>;

export const errorResponseSchema = z
  .object({
    error: z.object({
      code: errorCodeSchema,
      message: z.string().describe("پیام قابل نمایش به کاربر (فارسی)"),
      fields: z
        .record(z.string(), z.array(z.string()))
        .optional()
        .describe("خطاهای هر فیلد؛ کلید = مسیر فیلد (مثلاً `address.city`)"),
      reason: conflictReasonSchema
        .optional()
        .describe("دلیل ماشین‌خوان تعارض؛ فقط برای `CONFLICT`"),
      currentVersion: z
        .number()
        .int()
        .min(1)
        .optional()
        .describe(
          "نسخه فعلی منبع وقتی `reason = version_mismatch`؛ کلاینت باید با این نسخه UI را تازه کند",
        ),
    }),
  })
  .openapi("ErrorResponse");

export type ErrorResponse = z.infer<typeof errorResponseSchema>;

/** Optimistic concurrency: entity versions start at 1 and increment on each write */
export const versionSchema = z
  .number()
  .int()
  .min(1)
  .openapi({ example: 1, description: "نسخه هم‌زمانی (شروع از ۱)" });

/* -------------------------------------------------------------------------- */
/*  Envelopes & pagination                                                    */
/* -------------------------------------------------------------------------- */

export const paginationSchema = z
  .object({
    page: z.number().int().min(1),
    pageSize: z.number().int().min(1).max(100),
    total: z.number().int().min(0),
    totalPages: z.number().int().min(0),
  })
  .openapi("Pagination");

export type Pagination = z.infer<typeof paginationSchema>;

export const responseMetaSchema = z
  .object({
    pagination: paginationSchema.optional(),
    requestId: z.string().optional(),
  })
  .openapi("ResponseMeta");

/** `{ data, meta? }` success envelope */
export function successEnvelope<T extends z.ZodTypeAny>(name: string, data: T) {
  return z.object({ data, meta: responseMetaSchema.optional() }).openapi(name);
}

/** `{ data: T[], meta: { pagination } }` list envelope */
export function paginatedEnvelope<T extends z.ZodTypeAny>(
  name: string,
  item: T,
) {
  return z
    .object({
      data: z.array(item),
      meta: z.object({ pagination: paginationSchema }),
    })
    .openapi(name);
}

export const SORT_ORDERS = ["asc", "desc"] as const;
export const sortOrderSchema = z.enum(SORT_ORDERS).openapi("SortOrder");
export type SortOrder = z.infer<typeof sortOrderSchema>;

export const DEFAULT_PAGE_SIZE = 20;
export const MAX_PAGE_SIZE = 100;

/** Query params shared by every list endpoint */
export const listParamsSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce
    .number()
    .int()
    .min(1)
    .max(MAX_PAGE_SIZE)
    .default(DEFAULT_PAGE_SIZE),
  q: z.string().trim().max(100).optional().describe("جست‌وجوی متنی"),
  sort: z.string().optional().describe("نام فیلد مرتب‌سازی"),
  order: sortOrderSchema.default("asc"),
});

export type ListParams = z.infer<typeof listParamsSchema>;

/**
 * Build the list query schema of a resource: common params, a typed `sort`
 * enum limited to `sortFields`, plus resource-specific filters.
 */
export function listQuerySchema<
  const S extends readonly [string, ...string[]],
  F extends z.ZodRawShape = Record<never, never>,
>(sortFields: S, filters?: F) {
  return listParamsSchema.extend({
    sort: z.enum(sortFields).optional().describe("نام فیلد مرتب‌سازی"),
    ...(filters ?? ({} as F)),
  });
}

/** Boolean query parameter encoded as `"true"` / `"false"` */
export const queryBooleanSchema = z
  .enum(["true", "false"])
  .transform((value) => value === "true");

export const idParamSchema = z.object({ id: idSchema });
export const slugParamSchema = z.object({ slug: slugSchema });
