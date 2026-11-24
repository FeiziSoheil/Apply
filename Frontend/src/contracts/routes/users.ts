import {
  changePasswordSchema,
  inviteUserResultSchema,
  inviteUserSchema,
  resetPasswordResultSchema,
  staffUserListQuerySchema,
  staffUserSchema,
  updateStaffUserSchema,
  userSessionSchema,
} from "../users";
import { idParamSchema, paginatedEnvelope, successEnvelope } from "../common";
import { z } from "../zod";
import { ANY_USER, requires, STAFF, type RouteRegistrar } from "./helpers";

const TAG = "Users";
const MANAGE =
  "مدیریت حساب‌های کارمند (admin و consultant)؛ نیازمند `user:manage`.";

export function registerUserRoutes(r: RouteRegistrar): void {
  const staffUserResponse = successEnvelope("StaffUserResponse", staffUserSchema);
  const inviteResponse = successEnvelope(
    "InviteUserResponse",
    inviteUserResultSchema,
  );
  const resetResponse = successEnvelope(
    "ResetPasswordResponse",
    resetPasswordResultSchema,
  );

  r.route({
    method: "get",
    path: "/users",
    tag: TAG,
    operationId: "listStaffUsers",
    summary: "فهرست کاربران کارمند",
    description: `${MANAGE} فقط نقش‌های admin و consultant؛ دانشجویان در این فهرست نیستند.`,
    access: requires("user:manage", ["admin"]),
    query: staffUserListQuerySchema,
    success: {
      status: 200,
      description: "فهرست صفحه‌بندی‌شده",
      schema: paginatedEnvelope("StaffUsersPage", staffUserSchema),
    },
  });

  r.route({
    method: "post",
    path: "/users/invite",
    tag: TAG,
    operationId: "inviteStaffUser",
    summary: "دعوت کاربر کارمند",
    description:
      `${MANAGE} حساب جدید با رمز موقت ساخته می‌شود؛ رمز فقط در همین پاسخ برمی‌گردد. ایمیل تکراری → \`CONFLICT\`.`,
    access: requires("user:manage", ["admin"]),
    body: { schema: inviteUserSchema },
    success: {
      status: 201,
      description: "کاربر دعوت شد",
      schema: inviteResponse,
    },
    conflict: true,
  });

  r.route({
    method: "patch",
    path: "/users/{id}",
    tag: TAG,
    operationId: "updateStaffUser",
    summary: "ویرایش نقش یا وضعیت کاربر",
    description:
      `${MANAGE} مدیر نمی‌تواند نقش یا وضعیت خودش را تغییر دهد. غیرفعال‌کردن یا تنزل آخرین مدیر فعال → \`CONFLICT\` با پیام فارسی.`,
    access: requires("user:manage", ["admin"]),
    params: idParamSchema,
    body: { schema: updateStaffUserSchema },
    success: {
      status: 200,
      description: "کاربر ویرایش شد",
      schema: staffUserResponse,
    },
    conflict: true,
  });

  r.route({
    method: "post",
    path: "/users/{id}/reset-password",
    tag: TAG,
    operationId: "resetStaffUserPassword",
    summary: "بازنشانی رمز عبور کاربر",
    description: `${MANAGE} رمز موقت جدید صادر می‌شود و فقط در پاسخ برمی‌گردد.`,
    access: requires("user:manage", ["admin"]),
    params: idParamSchema,
    success: {
      status: 200,
      description: "رمز بازنشانی شد",
      schema: resetResponse,
    },
  });

  r.route({
    method: "get",
    path: "/me/sessions",
    tag: TAG,
    operationId: "listMySessions",
    summary: "نشست‌های فعال کاربر جاری",
    description: "فهرست نشست‌های فعال حساب؛ فیلد `current` نشست درخواست جاری را مشخص می‌کند.",
    access: ANY_USER,
    success: {
      status: 200,
      description: "نشست‌ها",
      schema: successEnvelope(
        "UserSessionsResponse",
        z.array(userSessionSchema),
      ),
    },
  });

  r.route({
    method: "delete",
    path: "/me/sessions/{id}",
    tag: TAG,
    operationId: "revokeMySession",
    summary: "خروج از نشست مشخص",
    access: ANY_USER,
    params: idParamSchema,
    success: { status: 204, description: "نشست با موفقیت باطل شد" },
  });

  r.route({
    method: "post",
    path: "/me/sessions/revoke-others",
    tag: TAG,
    operationId: "revokeOtherSessions",
    summary: "خروج از همه دستگاه‌های دیگر",
    access: ANY_USER,
    success: { status: 204, description: "همه نشست‌های دیگر باطل شدند" },
  });

  r.route({
    method: "post",
    path: "/me/change-password",
    tag: TAG,
    operationId: "changeMyPassword",
    summary: "تغییر رمز عبور کاربر جاری",
    description:
      "ویژه حساب‌های دارای رمز (کارمندان). رمز فعلی اشتباه → `VALIDATION_ERROR`. قدرت رمز جدید با schema قدرت رمز اعتبارسنجی می‌شود.",
    access: STAFF,
    body: { schema: changePasswordSchema },
    success: { status: 204, description: "رمز عبور تغییر کرد" },
  });
}
