import { z } from "zod";
import { honeypotSchema, mobileSchema, nameSchema } from "./common";

export const callbackSchema = z.object({
  name: nameSchema,
  mobile: mobileSchema,
  /** Honeypot anti-spam — leave empty */
  website: honeypotSchema,
});

export type CallbackFormValues = z.infer<typeof callbackSchema>;
