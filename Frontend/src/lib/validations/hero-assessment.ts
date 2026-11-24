import { z } from "zod";
import { mobileSchema } from "./common";

export const heroAssessmentSchema = z.object({
  degreeLevel: z.enum(
    ["bachelor", "master", "phd", "language", "foundation"],
    {
      required_error: "مقطع تحصیلی را انتخاب کنید",
      invalid_type_error: "مقطع تحصیلی را انتخاب کنید",
    },
  ),
  country: z
    .string({ required_error: "کشور مقصد را انتخاب کنید" })
    .min(1, "کشور مقصد را انتخاب کنید"),
  phone: mobileSchema,
});

export type HeroAssessmentValues = z.infer<typeof heroAssessmentSchema>;
