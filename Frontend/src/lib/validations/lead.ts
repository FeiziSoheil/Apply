import { z } from "zod";
import { mobileSchema, nameSchema, optionalEmailSchema } from "./common";

export const createLeadFormSchema = z.object({
  name: nameSchema,
  mobile: mobileSchema,
  email: optionalEmailSchema,
  message: z
    .string()
    .trim()
    .max(2000, "پیام نباید بیشتر از ۲۰۰۰ حرف باشد")
    .optional()
    .or(z.literal("")),
});

export type CreateLeadFormValues = z.infer<typeof createLeadFormSchema>;

export const CREATE_LEAD_DEFAULTS: CreateLeadFormValues = {
  name: "",
  mobile: "",
  email: "",
  message: "",
};

export const leadStatusFormSchema = z
  .object({
    status: z.enum([
      "new",
      "contacted",
      "qualified",
      "consultation_scheduled",
      "proposal_sent",
      "won",
      "lost",
    ]),
    lostReason: z.string().trim().max(500).optional().or(z.literal("")),
    note: z.string().trim().max(1000).optional().or(z.literal("")),
  })
  .refine((data) => data.status !== "lost" || Boolean(data.lostReason?.trim()), {
    path: ["lostReason"],
    message: "دلیل از دست رفتن سرنخ را وارد کنید",
  });

export type LeadStatusFormValues = z.infer<typeof leadStatusFormSchema>;
