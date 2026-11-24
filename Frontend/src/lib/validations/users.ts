import { z } from "zod";
import { emailSchema, nameSchema } from "./common";
import { passwordStrengthSchema } from "@/contracts/users";
import { STAFF_ROLES } from "@/contracts/auth";

export const inviteUserFormSchema = z.object({
  name: nameSchema,
  email: emailSchema,
  role: z.enum(STAFF_ROLES, {
    required_error: "نقش را انتخاب کنید",
  }),
});

export type InviteUserFormValues = z.infer<typeof inviteUserFormSchema>;

export const editRoleFormSchema = z.object({
  role: z.enum(STAFF_ROLES, {
    required_error: "نقش را انتخاب کنید",
  }),
});

export type EditRoleFormValues = z.infer<typeof editRoleFormSchema>;

export const profileNameFormSchema = z.object({
  name: nameSchema,
});

export type ProfileNameFormValues = z.infer<typeof profileNameFormSchema>;

export const changePasswordFormSchema = z
  .object({
    currentPassword: z
      .string({ required_error: "رمز عبور فعلی را وارد کنید" })
      .min(1, "رمز عبور فعلی را وارد کنید"),
    newPassword: passwordStrengthSchema,
    confirmPassword: z
      .string({ required_error: "تکرار رمز عبور را وارد کنید" })
      .min(1, "تکرار رمز عبور را وارد کنید"),
  })
  .refine((values) => values.newPassword === values.confirmPassword, {
    message: "تکرار رمز عبور با رمز جدید یکسان نیست",
    path: ["confirmPassword"],
  })
  .refine((values) => values.currentPassword !== values.newPassword, {
    message: "رمز عبور جدید باید با رمز فعلی متفاوت باشد",
    path: ["newPassword"],
  });

export type ChangePasswordFormValues = z.infer<typeof changePasswordFormSchema>;
