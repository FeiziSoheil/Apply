import {
  emailSchema,
  idSchema,
  isoDateTimeSchema,
  listQuerySchema,
  personNameSchema,
} from "./common";
import { STAFF_ROLES } from "./auth";
import { z } from "./zod";

/* -------------------------------------------------------------------------- */
/*  Password strength (shared by change / invite / reset)                      */
/* -------------------------------------------------------------------------- */

/**
 * Strong password for staff accounts. Used by `changePassword` and documented
 * for temporary passwords issued by invite / reset (mock generates compliant ones).
 */
export const passwordStrengthSchema = z
  .string({ required_error: "رمز عبور را وارد کنید" })
  .min(8, "رمز عبور باید حداقل ۸ کاراکتر باشد")
  .max(128, "رمز عبور نباید بیشتر از ۱۲۸ کاراکتر باشد")
  .regex(/[a-z]/, "رمز عبور باید حداقل یک حرف کوچک انگلیسی داشته باشد")
  .regex(/[A-Z]/, "رمز عبور باید حداقل یک حرف بزرگ انگلیسی داشته باشد")
  .regex(/\d/, "رمز عبور باید حداقل یک رقم داشته باشد")
  .regex(/[^A-Za-z0-9]/, "رمز عبور باید حداقل یک کاراکتر ویژه داشته باشد");

export type PasswordStrength = z.infer<typeof passwordStrengthSchema>;

/* -------------------------------------------------------------------------- */
/*  Staff account (admin list)                                                */
/* -------------------------------------------------------------------------- */

export const USER_STATUSES = ["active", "inactive"] as const;
export const userStatusSchema = z.enum(USER_STATUSES).openapi("UserStatus");
export type UserStatus = z.infer<typeof userStatusSchema>;

/** Roles that can be invited / listed under `/users` (not students) */
export const staffRoleSchema = z
  .enum(STAFF_ROLES)
  .openapi("StaffRole");
export type StaffRole = z.infer<typeof staffRoleSchema>;

export const staffUserSchema = z
  .object({
    id: idSchema,
    name: z.string().min(1).max(80),
    email: emailSchema,
    role: staffRoleSchema,
    status: userStatusSchema,
    lastLoginAt: isoDateTimeSchema.nullable(),
    createdAt: isoDateTimeSchema,
    updatedAt: isoDateTimeSchema,
  })
  .openapi("StaffUser");
export type StaffUser = z.infer<typeof staffUserSchema>;

export const staffUserListQuerySchema = listQuerySchema(
  ["name", "email", "role", "status", "lastLoginAt", "createdAt"] as const,
  {
    role: staffRoleSchema.optional(),
    status: userStatusSchema.optional(),
  },
).openapi("StaffUserListQuery");
export type StaffUserListQuery = z.infer<typeof staffUserListQuerySchema>;

export const inviteUserSchema = z
  .object({
    name: personNameSchema,
    email: emailSchema,
    role: staffRoleSchema,
  })
  .openapi("InviteUser");
export type InviteUser = z.infer<typeof inviteUserSchema>;

/** Invite / reset response: account + one-time temporary password (mock only) */
export const inviteUserResultSchema = z
  .object({
    user: staffUserSchema,
    temporaryPassword: z
      .string()
      .min(8)
      .describe("رمز موقت یک‌بارمصرف؛ فقط در پاسخ ایجاد/بازنشانی برمی‌گردد"),
  })
  .openapi("InviteUserResult");
export type InviteUserResult = z.infer<typeof inviteUserResultSchema>;

export const updateStaffUserSchema = z
  .object({
    role: staffRoleSchema.optional(),
    status: userStatusSchema.optional(),
  })
  .refine((body) => body.role !== undefined || body.status !== undefined, {
    message: "حداقل یکی از فیلدهای نقش یا وضعیت را ارسال کنید",
  })
  .openapi("UpdateStaffUser");
export type UpdateStaffUser = z.infer<typeof updateStaffUserSchema>;

export const resetPasswordResultSchema = z
  .object({
    temporaryPassword: z.string().min(8),
  })
  .openapi("ResetPasswordResult");
export type ResetPasswordResult = z.infer<typeof resetPasswordResultSchema>;

/* -------------------------------------------------------------------------- */
/*  Profile: password & sessions                                              */
/* -------------------------------------------------------------------------- */

export const changePasswordSchema = z
  .object({
    currentPassword: z
      .string({ required_error: "رمز عبور فعلی را وارد کنید" })
      .min(1, "رمز عبور فعلی را وارد کنید"),
    newPassword: passwordStrengthSchema,
  })
  .refine((body) => body.currentPassword !== body.newPassword, {
    message: "رمز عبور جدید باید با رمز فعلی متفاوت باشد",
    path: ["newPassword"],
  })
  .openapi("ChangePassword");
export type ChangePassword = z.infer<typeof changePasswordSchema>;

export const userSessionSchema = z
  .object({
    id: idSchema,
    createdAt: isoDateTimeSchema,
    lastSeenAt: isoDateTimeSchema,
    ipAddress: z.string().min(1).max(64),
    userAgent: z.string().min(1).max(300),
    current: z.boolean().describe("نشست درخواست جاری"),
  })
  .openapi("UserSession");
export type UserSession = z.infer<typeof userSessionSchema>;
