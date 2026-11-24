import { z } from "zod";
import { mobileSchema, nameSchema } from "./common";

export const CONSULTATION_TYPES = ["in_person", "online"] as const;

export type ConsultationType = (typeof CONSULTATION_TYPES)[number];

export const CONSULTATION_TYPE_LABELS: Record<ConsultationType, string> = {
  in_person: "حضوری",
  online: "آنلاین",
};

export const bookingSchema = z.object({
  consultationType: z.enum(CONSULTATION_TYPES, {
    required_error: "نوع مشاوره را انتخاب کنید",
    invalid_type_error: "نوع مشاوره را انتخاب کنید",
  }),
  consultantId: z.string().optional(),
  date: z.date({
    required_error: "تاریخ مشاوره را انتخاب کنید",
    invalid_type_error: "تاریخ مشاوره را انتخاب کنید",
  }),
  timeSlot: z
    .string({ required_error: "ساعت مشاوره را انتخاب کنید" })
    .min(1, "ساعت مشاوره را انتخاب کنید"),
  name: nameSchema,
  mobile: mobileSchema,
  notes: z
    .string()
    .trim()
    .max(1000, "یادداشت نباید بیشتر از ۱۰۰۰ حرف باشد")
    .optional(),
});

export type BookingFormValues = z.infer<typeof bookingSchema>;
