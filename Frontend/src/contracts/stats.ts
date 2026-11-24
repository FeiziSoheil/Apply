import {
  idSchema,
  isoDateSchema,
  isoDateTimeSchema,
} from "./common";
import { bookingStatusSchema, consultationTypeSchema } from "./bookings";
import { pipelineStageKindSchema } from "./crm";
import { z } from "./zod";

/* -------------------------------------------------------------------------- */
/*  Query                                                                     */
/* -------------------------------------------------------------------------- */

export const STATS_RANGE_DAYS = [7, 30, 90] as const;
export type StatsRangeDays = (typeof STATS_RANGE_DAYS)[number];

const rangeDaysLiteral = z.union([
  z.literal(7),
  z.literal(30),
  z.literal(90),
]);

/** `rangeDays=7|30|90` — پیش‌فرض ۳۰ */
export const adminStatsQuerySchema = z
  .object({
    rangeDays: z.coerce
      .number({ invalid_type_error: "بازه زمانی نامعتبر است" })
      .int("بازه زمانی باید عدد صحیح باشد")
      .pipe(rangeDaysLiteral)
      .default(30)
      .describe("بازه آماری به روز (۷، ۳۰ یا ۹۰)"),
  })
  .openapi("AdminStatsQuery");
export type AdminStatsQuery = z.infer<typeof adminStatsQuerySchema>;

/* -------------------------------------------------------------------------- */
/*  Shared metric & chart points                                              */
/* -------------------------------------------------------------------------- */

/** یک KPI با مقایسه نسبت به دورهٔ هم‌طول قبلی */
export const statsMetricSchema = z
  .object({
    value: z.number().describe("مقدار دورهٔ جاری"),
    previousValue: z.number().describe("مقدار دورهٔ قبلی هم‌طول"),
    /** درصد تغییر؛ اگر دوره قبل صفر باشد `null` */
    changePercent: z.number().nullable(),
  })
  .openapi("StatsMetric");
export type StatsMetric = z.infer<typeof statsMetricSchema>;

export const leadTrendPointSchema = z
  .object({
    date: isoDateSchema.describe("روز میلادی (وقت تهران)"),
    count: z.number().int().nonnegative(),
  })
  .openapi("LeadTrendPoint");
export type LeadTrendPoint = z.infer<typeof leadTrendPointSchema>;

export const utmSourcePointSchema = z
  .object({
    source: z
      .string()
      .min(1)
      .max(100)
      .describe("utm.source یا «بدون UTM»"),
    count: z.number().int().nonnegative(),
  })
  .openapi("UtmSourcePoint");
export type UtmSourcePoint = z.infer<typeof utmSourcePointSchema>;

export const funnelStageSchema = z
  .object({
    stageKind: pipelineStageKindSchema,
    label: z.string().min(1).max(80).describe("برچسب فارسی kind مرحله"),
    count: z.number().int().nonnegative(),
  })
  .openapi("FunnelStage");
export type FunnelStage = z.infer<typeof funnelStageSchema>;

export const ACTION_ITEM_KINDS = ["stale_lead", "today_booking"] as const;
export const actionItemKindSchema = z
  .enum(ACTION_ITEM_KINDS)
  .openapi("ActionItemKind");

export const statsActionItemSchema = z
  .object({
    id: idSchema,
    kind: actionItemKindSchema,
    title: z.string().min(1).max(120),
    description: z.string().min(1).max(300),
    href: z.string().min(1).max(200).describe("مسیر نسبی پنل"),
    at: isoDateTimeSchema.nullable(),
  })
  .openapi("StatsActionItem");
export type StatsActionItem = z.infer<typeof statsActionItemSchema>;

export const scheduleItemSchema = z
  .object({
    id: idSchema,
    startsAt: isoDateTimeSchema,
    endsAt: isoDateTimeSchema,
    name: z.string().min(1).max(80),
    status: bookingStatusSchema,
    consultationType: consultationTypeSchema,
  })
  .openapi("StatsScheduleItem");
export type StatsScheduleItem = z.infer<typeof scheduleItemSchema>;

/* -------------------------------------------------------------------------- */
/*  Response                                                                  */
/* -------------------------------------------------------------------------- */

/**
 * آمار داشبورد ادمین/مشاور.
 * مشاور فقط دادهٔ اختصاص‌یافته به خودش را می‌بیند؛ ادمین همه را.
 */
export const adminStatsSchema = z
  .object({
    rangeDays: rangeDaysLiteral,
    generatedAt: isoDateTimeSchema,
    cards: z
      .object({
        newLeads: statsMetricSchema.describe(
          "سرنخ‌های ایجادشده در بازهٔ انتخابی",
        ),
        todayBookings: statsMetricSchema.describe(
          "رزروهای امروز (وقت تهران)؛ تغییر نسبت به دیروز",
        ),
        conversionRate: statsMetricSchema.describe(
          "نرخ تبدیل (٪) = won در بازه / سرنخ‌های بازه × ۱۰۰",
        ),
        activeCases: statsMetricSchema.describe(
          "پرونده‌های فعال فعلی؛ تغییر نسبت به تعداد فعال در پایان دوره قبل",
        ),
      })
      .openapi("AdminStatsCards"),
    leadTrend: z
      .array(leadTrendPointSchema)
      .describe("تعداد سرنخ جدید به‌ازای هر روز بازه"),
    utmSources: z
      .array(utmSourcePointSchema)
      .describe("توزیع utm.source سرنخ‌های بازه"),
    funnel: z
      .array(funnelStageSchema)
      .describe("قیف وضعیت سرنخ‌های ایجادشده در بازه"),
    actionItems: z
      .array(statsActionItemSchema)
      .describe(
        "نیازمند اقدام: سرنخ بدون پیگیری >۲ روز و رزروهای امروز",
      ),
    todaySchedule: z
      .array(scheduleItemSchema)
      .describe("برنامهٔ امروز (وقت تهران)، برای مشاور محدود به خودش"),
  })
  .openapi("AdminStats");
export type AdminStats = z.infer<typeof adminStatsSchema>;
