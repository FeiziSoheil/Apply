import {
  currentUserSchema,
  otpRequestResultSchema,
  otpRequestSchema,
  otpVerifySchema,
  sessionSchema,
  staffLoginSchema,
  updateProfileSchema,
} from "../auth";
import { successEnvelope } from "../common";
import { OTP_MAX_REQUESTS_PER_HOUR, OTP_MAX_VERIFY_ATTEMPTS, SESSION_COOKIE_NAME } from "../session";
import { ANY_USER, PUBLIC, type RouteRegistrar } from "./helpers";

const TAG = "Auth";

export function registerAuthRoutes(r: RouteRegistrar): void {
  const sessionResponse = successEnvelope("SessionResponse", sessionSchema);
  const userResponse = successEnvelope("CurrentUserResponse", currentUserSchema);

  r.route({
    method: "post",
    path: "/auth/otp/request",
    tag: TAG,
    operationId: "requestOtp",
    summary: "ارسال کد یک‌بارمصرف به موبایل",
    description:
      `برای ورود/ثبت‌نام دانشجو. برای جلوگیری از افشای وجود حساب، پاسخ همیشه موفق است. محدودیت نرخ: حداکثر ${OTP_MAX_REQUESTS_PER_HOUR} درخواست در ساعت برای هر شماره. کد ۲ دقیقه اعتبار دارد.`,
    access: PUBLIC,
    body: { schema: otpRequestSchema },
    success: {
      status: 200,
      description: "کد ارسال شد",
      schema: successEnvelope("OtpRequestResponse", otpRequestResultSchema),
    },
  });

  r.route({
    method: "post",
    path: "/auth/otp/verify",
    tag: TAG,
    operationId: "verifyOtp",
    summary: "تأیید کد یک‌بارمصرف و ورود",
    description:
      `در صورت نبود حساب، حساب دانشجو ساخته می‌شود (\`isNewUser: true\`). نشست با \`Set-Cookie: ${SESSION_COOKIE_NAME}=…; HttpOnly\` برقرار می‌شود. کد نامعتبر یا منقضی (بیش از ۲ دقیقه) → \`VALIDATION_ERROR\` با فیلد \`code\`. هر کد حداکثر ${OTP_MAX_VERIFY_ATTEMPTS} بار قابل امتحان است؛ بعد از سومین تلاش ناموفق کد باطل می‌شود و باید کد جدید گرفت.`,
    access: PUBLIC,
    body: { schema: otpVerifySchema },
    success: { status: 200, description: "ورود موفق", schema: sessionResponse },
  });

  r.route({
    method: "post",
    path: "/auth/login",
    tag: TAG,
    operationId: "staffLogin",
    summary: "ورود کارمندان با ایمیل و رمز عبور",
    description: `ویژه نقش‌های admin و consultant. نشست با \`Set-Cookie: ${SESSION_COOKIE_NAME}=…; HttpOnly\` برقرار می‌شود. اعتبارنامه اشتباه → \`UNAUTHORIZED\`.`,
    access: PUBLIC,
    body: { schema: staffLoginSchema },
    success: { status: 200, description: "ورود موفق", schema: sessionResponse },
  });

  r.route({
    method: "post",
    path: "/auth/refresh",
    tag: TAG,
    operationId: "refreshSession",
    summary: "تمدید نشست",
    description:
      "با کوکی `session` (و کوکی refresh سمت بک‌اند) نشست را تمدید و کوکی جدید را با `Set-Cookie` تنظیم می‌کند. بدون بدنه.",
    access: PUBLIC,
    success: { status: 200, description: "نشست تمدید شد", schema: sessionResponse },
  });

  r.route({
    method: "post",
    path: "/auth/logout",
    tag: TAG,
    operationId: "logout",
    summary: "خروج و ابطال نشست",
    description: "نشست را در سرور باطل و کوکی `session` را با `Set-Cookie` (Max-Age=0) پاک می‌کند. بدون بدنه.",
    access: ANY_USER,
    success: { status: 204, description: "خروج انجام شد" },
  });

  r.route({
    method: "get",
    path: "/me",
    tag: TAG,
    operationId: "getCurrentUser",
    summary: "کاربر جاری",
    access: ANY_USER,
    success: { status: 200, description: "کاربر جاری", schema: userResponse },
  });

  r.route({
    method: "patch",
    path: "/me",
    tag: TAG,
    operationId: "updateCurrentUser",
    summary: "ویرایش پروفایل کاربر جاری",
    access: ANY_USER,
    body: { schema: updateProfileSchema },
    success: { status: 200, description: "پروفایل ویرایش شد", schema: userResponse },
    conflict: true,
  });
}
