import {
  auditFields,
  idSchema,
  isoDateSchema,
  isoDateTimeSchema,
  listQuerySchema,
  mobileSchema,
  personNameSchema,
} from "./common";
import { z } from "./zod";

export const CONSULTATION_TYPES = ["in_person", "online"] as const;
export const consultationTypeSchema = z
  .enum(CONSULTATION_TYPES)
  .openapi("ConsultationType");
export type ConsultationType = z.infer<typeof consultationTypeSchema>;

export const BOOKING_STATUSES = [
  "pending",
  "confirmed",
  "completed",
  "cancelled",
  "no_show",
] as const;
export const bookingStatusSchema = z
  .enum(BOOKING_STATUSES)
  .openapi("BookingStatus");
export type BookingStatus = z.infer<typeof bookingStatusSchema>;

export const CANCELLED_BY = ["customer", "staff", "system"] as const;

export const bookingSchema = z
  .object({
    id: idSchema,
    code: z
      .string()
      .openapi({ example: "BK-LZ4K8Q", description: "کد پیگیری قابل نمایش" }),
    status: bookingStatusSchema,
    consultationType: consultationTypeSchema,
    consultantId: idSchema.nullable(),
    startsAt: isoDateTimeSchema,
    endsAt: isoDateTimeSchema,
    name: z.string().min(1).max(80),
    mobile: mobileSchema,
    notes: z.string().max(1000).nullable().describe("یادداشت متقاضی (عمومی)"),
    internalNotes: z
      .string()
      .max(2000)
      .nullable()
      .describe("یادداشت داخلی کارمندان"),
    userId: idSchema.nullable().describe("کاربر لاگین‌شده (در صورت وجود)"),
    leadId: idSchema.nullable(),
    cancelledBy: z.enum(CANCELLED_BY).nullable(),
    cancellationReason: z.string().max(500).nullable(),
    cancelledAt: isoDateTimeSchema.nullable(),
    ...auditFields,
  })
  .openapi("Booking");
export type Booking = z.infer<typeof bookingSchema>;

export const BOOKING_CHANGE_ACTIONS = [
  "created",
  "status_changed",
  "rescheduled",
  "reassigned",
  "notes_updated",
  "cancelled",
  "reminder_sent",
] as const;
export const bookingChangeActionSchema = z
  .enum(BOOKING_CHANGE_ACTIONS)
  .openapi("BookingChangeAction");
export type BookingChangeAction = z.infer<typeof bookingChangeActionSchema>;

export const bookingChangeSchema = z
  .object({
    id: idSchema,
    bookingId: idSchema,
    at: isoDateTimeSchema,
    byUserId: idSchema.nullable(),
    byName: z.string().min(1).max(80),
    action: bookingChangeActionSchema,
    detail: z.string().max(500).nullable(),
  })
  .openapi("BookingChange");
export type BookingChange = z.infer<typeof bookingChangeSchema>;

/** Receipt returned to a guest who just booked (no PII echo needed) */
export const bookingReceiptSchema = bookingSchema
  .pick({
    id: true,
    code: true,
    status: true,
    consultationType: true,
    consultantId: true,
    startsAt: true,
    endsAt: true,
  })
  .openapi("BookingReceipt");
export type BookingReceipt = z.infer<typeof bookingReceiptSchema>;

/* -------------------------------------------------------------------------- */
/*  Slots                                                                     */
/* -------------------------------------------------------------------------- */

export const timeSlotSchema = z
  .object({
    startsAt: isoDateTimeSchema,
    endsAt: isoDateTimeSchema,
    consultantId: idSchema,
    available: z.boolean(),
  })
  .openapi("TimeSlot");
export type TimeSlot = z.infer<typeof timeSlotSchema>;

export const slotsQuerySchema = z.object({
  date: isoDateSchema.describe("روز مورد نظر (به وقت تهران)"),
  consultationType: consultationTypeSchema.optional(),
  consultantId: idSchema.optional(),
});
export type SlotsQuery = z.infer<typeof slotsQuerySchema>;

/* -------------------------------------------------------------------------- */
/*  Commands                                                                  */
/* -------------------------------------------------------------------------- */

export const bookingCreateSchema = z
  .object({
    consultationType: consultationTypeSchema,
    consultantId: idSchema
      .optional()
      .describe("در صورت خالی بودن، سیستم مشاور آزاد را تخصیص می‌دهد"),
    startsAt: isoDateTimeSchema.describe("باید یکی از startsAt اسلات‌های آزاد باشد"),
    name: personNameSchema,
    mobile: mobileSchema,
    notes: z
      .string()
      .trim()
      .max(1000, "یادداشت نباید بیشتر از ۱۰۰۰ حرف باشد")
      .optional(),
  })
  .openapi("BookingCreate");
export type BookingCreate = z.infer<typeof bookingCreateSchema>;

export const bookingCancelSchema = z
  .object({ reason: z.string().trim().max(500).optional() })
  .openapi("BookingCancel");
export type BookingCancel = z.infer<typeof bookingCancelSchema>;

export const bookingStatusUpdateSchema = z
  .object({
    status: z.enum(["pending", "confirmed", "completed", "cancelled", "no_show"]),
  })
  .openapi("BookingStatusUpdate");
export type BookingStatusUpdate = z.infer<typeof bookingStatusUpdateSchema>;

/**
 * ویرایش جزئی رزرو توسط کارمند: جابه‌جایی اسلات، تغییر مشاور (فقط admin)،
 * یادداشت داخلی. تداخل زمانی مشاور → `CONFLICT`.
 */
export const bookingPatchSchema = z
  .object({
    startsAt: isoDateTimeSchema.optional(),
    consultantId: idSchema.optional(),
    consultationType: consultationTypeSchema.optional(),
    internalNotes: z.string().trim().max(2000).nullable().optional(),
    notes: z.string().trim().max(1000).nullable().optional(),
  })
  .refine(
    (body) =>
      body.startsAt !== undefined ||
      body.consultantId !== undefined ||
      body.consultationType !== undefined ||
      body.internalNotes !== undefined ||
      body.notes !== undefined,
    { message: "حداقل یک فیلد برای به‌روزرسانی لازم است" },
  )
  .openapi("BookingPatch");
export type BookingPatch = z.infer<typeof bookingPatchSchema>;

/** ایجاد دستی رزرو توسط کارمند (همان فیلدهای عمومی + امکان وضعیت اولیه) */
export const bookingStaffCreateSchema = bookingCreateSchema
  .extend({
    status: z.enum(["pending", "confirmed"]).default("confirmed"),
    internalNotes: z.string().trim().max(2000).optional(),
    leadId: idSchema.optional(),
  })
  .openapi("BookingStaffCreate");
export type BookingStaffCreate = z.infer<typeof bookingStaffCreateSchema>;

export const BOOKING_SORT_FIELDS = ["startsAt", "createdAt"] as const;
export const bookingListQuerySchema = listQuerySchema(BOOKING_SORT_FIELDS, {
  status: bookingStatusSchema.optional(),
  consultantId: idSchema.optional(),
  consultationType: consultationTypeSchema.optional(),
  from: isoDateTimeSchema.optional(),
  to: isoDateTimeSchema.optional(),
});
export type BookingListQuery = z.infer<typeof bookingListQuerySchema>;
