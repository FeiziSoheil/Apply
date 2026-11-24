import { z } from "zod";
import {
  TASK_PRIORITIES,
  TASK_RELATED_TYPES,
} from "@/contracts/crm";

export const REMINDER_OFFSETS = [
  "none",
  "15m",
  "1h",
  "1d",
  "custom",
] as const;
export type ReminderOffset = (typeof REMINDER_OFFSETS)[number];

export const taskFormSchema = z
  .object({
    title: z
      .string()
      .trim()
      .min(1, "عنوان کار الزامی است")
      .max(160, "عنوان نباید بیشتر از ۱۶۰ حرف باشد"),
    description: z
      .string()
      .trim()
      .max(2000, "توضیحات نباید بیشتر از ۲۰۰۰ حرف باشد")
      .optional()
      .or(z.literal("")),
    dueAt: z.string().min(1, "سررسید الزامی است"),
    reminderOffset: z.enum(REMINDER_OFFSETS),
    remindAtCustom: z.string().optional().or(z.literal("")),
    priority: z.enum(TASK_PRIORITIES),
    assigneeId: z.string().min(1, "مسئول کار را انتخاب کنید"),
    relatedType: z.enum(TASK_RELATED_TYPES),
    relatedId: z.string().optional().or(z.literal("")),
  })
  .superRefine((data, ctx) => {
    if (data.relatedType !== "none" && !data.relatedId?.trim()) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["relatedId"],
        message: "موجودیت مرتبط را انتخاب کنید",
      });
    }
    if (data.reminderOffset === "custom" && !data.remindAtCustom?.trim()) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["remindAtCustom"],
        message: "زمان یادآور سفارشی را وارد کنید",
      });
    }
  });

export type TaskFormValues = z.infer<typeof taskFormSchema>;

export const TASK_FORM_DEFAULTS: TaskFormValues = {
  title: "",
  description: "",
  dueAt: "",
  reminderOffset: "none",
  remindAtCustom: "",
  priority: "normal",
  assigneeId: "",
  relatedType: "none",
  relatedId: "",
};

export function resolveRemindAt(
  dueAt: string,
  offset: ReminderOffset,
  custom?: string,
): string | undefined {
  if (offset === "none") return undefined;
  if (offset === "custom") return custom || undefined;
  const dueMs = new Date(dueAt).getTime();
  if (Number.isNaN(dueMs)) return undefined;
  const deltas: Record<"15m" | "1h" | "1d", number> = {
    "15m": 15 * 60_000,
    "1h": 3_600_000,
    "1d": 86_400_000,
  };
  return new Date(dueMs - deltas[offset]).toISOString();
}
