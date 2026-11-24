import { z } from "zod";

const timeOfDay = z
  .string()
  .regex(/^([01]\d|2[0-3]):[0-5]\d$/, "ساعت باید به‌صورت HH:mm باشد");

const timeRange = z
  .object({
    start: timeOfDay,
    end: timeOfDay,
  })
  .refine((range) => range.start < range.end, {
    message: "ساعت پایان باید بعد از ساعت شروع باشد",
    path: ["end"],
  });

export const availabilitySettingsSchema = z.object({
  slotDurationMinutes: z.coerce
    .number({ invalid_type_error: "مدت جلسه را وارد کنید" })
    .int()
    .min(15, "حداقل ۱۵ دقیقه")
    .max(180, "حداکثر ۱۸۰ دقیقه"),
  gapMinutes: z.coerce
    .number({ invalid_type_error: "فاصله را وارد کنید" })
    .int()
    .min(0)
    .max(120),
  maxDailyBookings: z.coerce
    .number({ invalid_type_error: "سقف روزانه را وارد کنید" })
    .int()
    .min(1)
    .max(40),
  weekly: z.array(
    z.object({
      dayOfWeek: z.number().int().min(0).max(6),
      ranges: z.array(timeRange).max(6),
    }),
  ),
});

export type AvailabilitySettingsValues = z.infer<
  typeof availabilitySettingsSchema
>;

export const leaveFormSchema = z
  .object({
    from: z.string().min(1, "تاریخ شروع را انتخاب کنید"),
    to: z.string().min(1, "تاریخ پایان را انتخاب کنید"),
    reason: z.string().trim().max(200).optional(),
  })
  .refine((value) => value.from <= value.to, {
    message: "تاریخ پایان باید بعد از شروع باشد",
    path: ["to"],
  });

export type LeaveFormValues = z.infer<typeof leaveFormSchema>;

export const holidayFormSchema = z.object({
  date: z.string().min(1, "تاریخ را انتخاب کنید"),
  name: z
    .string()
    .trim()
    .min(1, "نام تعطیلی را وارد کنید")
    .max(120, "نام نباید بیشتر از ۱۲۰ حرف باشد"),
});

export type HolidayFormValues = z.infer<typeof holidayFormSchema>;
