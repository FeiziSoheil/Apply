import { PERMISSIONS } from "@/lib/rbac/permissions";
import { emailSchema, idSchema, mobileSchema } from "./common";
import { OTP_EXPIRES_IN_SECONDS } from "./session";
import { caseLinkResultSchema } from "./student-panel";
import { z } from "./zod";

/* -------------------------------------------------------------------------- */
/*  Roles & permissions                                                       */
/* -------------------------------------------------------------------------- */

export const ROLES = ["admin", "consultant", "student"] as const;
export const roleSchema = z.enum(ROLES).openapi("Role");
export type Role = z.infer<typeof roleSchema>;

export const STAFF_ROLES = ["admin", "consultant"] as const satisfies readonly Role[];
export const ALL_ROLES = ROLES;

// Catalog lives in `src/lib/rbac/permissions.ts` (dependency-free, shared with the UI)
export { PERMISSIONS };

export const permissionSchema = z.enum(PERMISSIONS).openapi("Permission");
export type Permission = z.infer<typeof permissionSchema>;

/* -------------------------------------------------------------------------- */
/*  OTP login (students)                                                      */
/* -------------------------------------------------------------------------- */

export const otpRequestSchema = z
  .object({ mobile: mobileSchema })
  .openapi("OtpRequest");
export type OtpRequest = z.infer<typeof otpRequestSchema>;

export const otpRequestResultSchema = z
  .object({
    expiresInSeconds: z.number().int().min(1).openapi({ example: OTP_EXPIRES_IN_SECONDS }),
    resendAfterSeconds: z.number().int().min(0).openapi({ example: 60 }),
  })
  .openapi("OtpRequestResult");
export type OtpRequestResult = z.infer<typeof otpRequestResultSchema>;

export const otpVerifySchema = z
  .object({
    mobile: mobileSchema,
    code: z
      .string({ required_error: "کد تأیید را وارد کنید" })
      .regex(/^\d{6}$/, "کد تأیید باید ۶ رقم باشد")
      .openapi({ example: "123456" }),
  })
  .openapi("OtpVerify");
export type OtpVerify = z.infer<typeof otpVerifySchema>;

/* -------------------------------------------------------------------------- */
/*  Staff login (email + password)                                            */
/* -------------------------------------------------------------------------- */

export const staffLoginSchema = z
  .object({
    email: emailSchema,
    password: z
      .string({ required_error: "رمز عبور را وارد کنید" })
      .min(8, "رمز عبور باید حداقل ۸ کاراکتر باشد")
      .max(128, "رمز عبور نباید بیشتر از ۱۲۸ کاراکتر باشد"),
  })
  .openapi("StaffLogin");
export type StaffLogin = z.infer<typeof staffLoginSchema>;

/* -------------------------------------------------------------------------- */
/*  Current user & session                                                    */
/* -------------------------------------------------------------------------- */

export const currentUserSchema = z
  .object({
    id: idSchema,
    name: z.string().min(1).max(80),
    role: roleSchema,
    permissions: z.array(permissionSchema),
    mobile: mobileSchema.optional(),
    email: emailSchema.optional(),
  })
  .openapi("CurrentUser");
export type CurrentUser = z.infer<typeof currentUserSchema>;

/**
 * Body of a successful login. The session itself travels in the httpOnly
 * `session` cookie (`Set-Cookie`, see `SESSION_COOKIE_NAME`); no token is ever
 * returned in the body, so the SPA has nothing to store.
 */
export const sessionSchema = z
  .object({
    expiresIn: z
      .number()
      .int()
      .min(1)
      .describe("اعتبار نشست (کوکی `session`) به ثانیه"),
    isNewUser: z
      .boolean()
      .optional()
      .describe("در ورود با OTP: حساب جدید ساخته شده است"),
    /** فقط پس از OTP: نتیجه اتصال موبایل به پرونده */
    caseLink: caseLinkResultSchema.optional(),
    user: currentUserSchema,
  })
  .openapi("Session");
export type Session = z.infer<typeof sessionSchema>;

export const updateProfileSchema = z
  .object({
    name: z.string().trim().min(3).max(80).optional(),
    email: emailSchema.optional(),
  })
  .openapi("UpdateProfile");
export type UpdateProfile = z.infer<typeof updateProfileSchema>;
