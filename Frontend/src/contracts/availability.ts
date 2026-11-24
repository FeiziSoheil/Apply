import { auditFields, idSchema, isoDateSchema } from "./common";
import { z } from "./zod";

/**
 * Weekday as in JavaScript `Date#getUTCDay` / Tehran calendar weekday:
 * `0` = یکشنبه … `5` = جمعه … `6` = شنبه.
 * جمعه به‌طور پیش‌فرض تعطیل است.
 */
export const WEEKDAYS = [0, 1, 2, 3, 4, 5, 6] as const;
export const weekdaySchema = z
  .number()
  .int()
  .min(0)
  .max(6)
  .openapi({ example: 6, description: "۰=یکشنبه … ۵=جمعه … ۶=شنبه" });
export type Weekday = (typeof WEEKDAYS)[number];

/** ساعت محلی تهران به‌صورت `HH:mm` (۲۴ ساعته) */
export const timeOfDaySchema = z
  .string()
  .regex(/^([01]\d|2[0-3]):[0-5]\d$/, "ساعت باید به‌صورت HH:mm باشد")
  .openapi({ example: "09:00" });
export type TimeOfDay = z.infer<typeof timeOfDaySchema>;

export const timeRangeSchema = z
  .object({
    start: timeOfDaySchema.describe("شروع بازه (شامل)"),
    end: timeOfDaySchema.describe("پایان بازه (غیرشامل)"),
  })
  .refine((range) => range.start < range.end, {
    message: "ساعت پایان باید بعد از ساعت شروع باشد",
    path: ["end"],
  })
  .openapi("AvailabilityTimeRange");
export type AvailabilityTimeRange = z.infer<typeof timeRangeSchema>;

export const dayScheduleSchema = z
  .object({
    dayOfWeek: weekdaySchema,
    ranges: z
      .array(timeRangeSchema)
      .max(6, "حداکثر ۶ بازه در روز مجاز است")
      .default([]),
  })
  .openapi("DaySchedule");
export type DaySchedule = z.infer<typeof dayScheduleSchema>;

export const leaveExceptionSchema = z
  .object({
    id: idSchema,
    from: isoDateSchema.describe("اولین روز مرخصی (شامل)"),
    to: isoDateSchema.describe("آخرین روز مرخصی (شامل)"),
    reason: z.string().trim().max(200).nullable(),
  })
  .refine((leave) => leave.from <= leave.to, {
    message: "تاریخ پایان مرخصی باید بعد از شروع باشد",
    path: ["to"],
  })
  .openapi("AvailabilityLeave");
export type AvailabilityLeave = z.infer<typeof leaveExceptionSchema>;

export const leaveCreateSchema = z
  .object({
    from: isoDateSchema,
    to: isoDateSchema,
    reason: z.string().trim().max(200).optional(),
  })
  .refine((leave) => leave.from <= leave.to, {
    message: "تاریخ پایان مرخصی باید بعد از شروع باشد",
    path: ["to"],
  })
  .openapi("AvailabilityLeaveCreate");
export type AvailabilityLeaveCreate = z.infer<typeof leaveCreateSchema>;

/**
 * روز ویژه: بازه‌های سفارشی برای یک تاریخ (جایگزین برنامه هفتگی).
 * `ranges` خالی = آن روز تعطیل است (حتی اگر جمعه نباشد).
 */
export const specialDayExceptionSchema = z
  .object({
    id: idSchema,
    date: isoDateSchema,
    ranges: z.array(timeRangeSchema).max(6),
    note: z.string().trim().max(200).nullable(),
  })
  .openapi("AvailabilitySpecialDay");
export type AvailabilitySpecialDay = z.infer<typeof specialDayExceptionSchema>;

export const specialDayCreateSchema = z
  .object({
    date: isoDateSchema,
    ranges: z.array(timeRangeSchema).max(6),
    note: z.string().trim().max(200).optional(),
  })
  .openapi("AvailabilitySpecialDayCreate");
export type AvailabilitySpecialDayCreate = z.infer<typeof specialDayCreateSchema>;

export const consultantAvailabilitySchema = z
  .object({
    id: idSchema.describe("معمولاً برابر consultantId (یک‌به‌یک)"),
    consultantId: idSchema,
    weekly: z
      .array(dayScheduleSchema)
      .min(1)
      .max(7)
      .describe("برنامه هفتگی؛ روزهای غایب معادل بازه خالی‌اند"),
    slotDurationMinutes: z
      .number()
      .int()
      .min(15, "مدت جلسه حداقل ۱۵ دقیقه است")
      .max(180, "مدت جلسه حداکثر ۱۸۰ دقیقه است")
      .openapi({ example: 60 }),
    gapMinutes: z
      .number()
      .int()
      .min(0)
      .max(120)
      .openapi({ example: 0, description: "فاصله بین پایان یک جلسه و شروع بعدی" }),
    maxDailyBookings: z
      .number()
      .int()
      .min(1)
      .max(40)
      .openapi({ example: 8 }),
    leaves: z.array(leaveExceptionSchema),
    specialDays: z.array(specialDayExceptionSchema),
    ...auditFields,
  })
  .openapi("ConsultantAvailability");
export type ConsultantAvailability = z.infer<typeof consultantAvailabilitySchema>;

/** جایگزینی تنظیمات هفتگی و ظرفیت (مرخصی/روز ویژه جداگانه مدیریت می‌شوند) */
export const consultantAvailabilityUpsertSchema = z
  .object({
    weekly: z.array(dayScheduleSchema).min(1).max(7),
    slotDurationMinutes: z.number().int().min(15).max(180),
    gapMinutes: z.number().int().min(0).max(120),
    maxDailyBookings: z.number().int().min(1).max(40),
  })
  .openapi("ConsultantAvailabilityUpsert");
export type ConsultantAvailabilityUpsert = z.infer<
  typeof consultantAvailabilityUpsertSchema
>;

export const globalHolidaySchema = z
  .object({
    id: idSchema,
    date: isoDateSchema,
    name: z.string().trim().min(1).max(120),
  })
  .openapi("GlobalHoliday");
export type GlobalHoliday = z.infer<typeof globalHolidaySchema>;

export const globalHolidayCreateSchema = z
  .object({
    date: isoDateSchema,
    name: z.string().trim().min(1, "نام تعطیلی را وارد کنید").max(120),
  })
  .openapi("GlobalHolidayCreate");
export type GlobalHolidayCreate = z.infer<typeof globalHolidayCreateSchema>;

export const globalHolidaysReplaceSchema = z
  .object({
    holidays: z.array(globalHolidayCreateSchema).max(200),
  })
  .openapi("GlobalHolidaysReplace");
export type GlobalHolidaysReplace = z.infer<typeof globalHolidaysReplaceSchema>;

/** برنامه پیش‌فرض: شنبه تا پنجشنبه ۹–۱۳ و ۱۴–۱۸؛ جمعه تعطیل */
export function defaultWeeklySchedule(): DaySchedule[] {
  const workRanges: AvailabilityTimeRange[] = [
    { start: "09:00", end: "13:00" },
    { start: "14:00", end: "18:00" },
  ];
  return WEEKDAYS.map((dayOfWeek) => ({
    dayOfWeek,
    ranges: dayOfWeek === 5 ? [] : workRanges,
  }));
}
