import { z } from "zod";
import {
  messageSchema,
  mobileSchema,
  nameSchema,
  optionalEmailSchema,
} from "./common";

export const contactSchema = z
  .object({
    name: nameSchema,
    mobile: mobileSchema,
    email: optionalEmailSchema,
    message: messageSchema,
  })
  .refine((data) => Boolean(data.email) || Boolean(data.mobile), {
    message: "حداقل یکی از ایمیل یا موبایل را وارد کنید",
    path: ["email"],
  });

export type ContactFormValues = z.infer<typeof contactSchema>;
