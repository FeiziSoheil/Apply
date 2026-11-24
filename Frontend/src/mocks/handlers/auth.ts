import type {
  OtpRequest,
  OtpVerify,
  StaffLogin,
  UpdateProfile,
} from "@/contracts/auth";
import type { CaseLinkResult } from "@/contracts/student-panel";
import {
  OTP_EXPIRES_IN_SECONDS,
  OTP_MAX_REQUESTS_PER_HOUR,
  OTP_MAX_VERIFY_ATTEMPTS,
  OTP_RESEND_AFTER_SECONDS,
  DEMO_ACCOUNTS,
} from "../config";
import { defineRoute, type RouteImplementations } from "../contract";
import { getDb } from "../db";
import { resolveCaseLinkOnLogin } from "../domain/student-panel";
import { emptyEducation } from "../domain/student-panel";
import { toCurrentUser, requireUser } from "../domain/users";
import { apiError } from "../errors";
import {
  clearedSessionCookie,
  issueSession,
  otpStore,
  readAccessToken,
  readRefreshToken,
  revokeAccessToken,
  revokeRefreshToken,
  rotateRefreshToken,
  sessionHeaders,
} from "../session";
import { HOUR_MS, newId, noContent, nowIso, ok } from "../utils";
import type { MockUser } from "../types";

/** Fixed OTP of the mock SMS gateway (also returned in the `x-mock-otp` header) */
const MOCK_OTP = DEMO_ACCOUNTS.student.otp;

function sessionResult(
  user: MockUser,
  options?: { isNewUser?: boolean; caseLink?: CaseLinkResult },
) {
  const issued = issueSession(user, { isNewUser: options?.isNewUser });
  return ok(
    {
      ...issued.session,
      ...(options?.caseLink ? { caseLink: options.caseLink } : {}),
    },
    { headers: sessionHeaders(issued) },
  );
}

export const authHandlers: RouteImplementations = {
  requestOtp: defineRoute<{ body: OtpRequest }>(({ body, request }) => {
    const { otps, otpRequests } = otpStore();
    const now = Date.now();
    const recent = (otpRequests.get(body.mobile) ?? []).filter(
      (at) => now - at < HOUR_MS,
    );
    if (
      body.mobile === "09124294290" ||
      request?.headers?.get?.("x-mock-rate-limit") === "otp" ||
      recent.length >= OTP_MAX_REQUESTS_PER_HOUR
    ) {
      const retryAfter = recent[0]
        ? Math.max(1, Math.ceil((recent[0] + HOUR_MS - now) / 1000))
        : 30;
      throw apiError.rateLimited(retryAfter);
    }
    otpRequests.set(body.mobile, [...recent, now]);
    otps.set(body.mobile, {
      code: MOCK_OTP,
      expiresAt: now + OTP_EXPIRES_IN_SECONDS * 1000,
      attempts: 0, // a new request replaces the code and resets the attempts
    });
    // Dev convenience: the "SMS" is visible in the response headers
    return ok(
      {
        expiresInSeconds: OTP_EXPIRES_IN_SECONDS,
        resendAfterSeconds: OTP_RESEND_AFTER_SECONDS,
      },
      { headers: { "x-mock-otp": MOCK_OTP } },
    );
  }),

  verifyOtp: defineRoute<{ body: OtpVerify }>(({ body }) => {
    const { otps } = otpStore();
    const pending = otps.get(body.mobile);
    if (!pending || pending.expiresAt <= Date.now()) {
      otps.delete(body.mobile);
      throw apiError.invalidField(
        "code",
        "کد تأیید منقضی شده است؛ کد جدید دریافت کنید",
      );
    }
    if (body.code !== pending.code) {
      pending.attempts += 1;
      if (pending.attempts >= OTP_MAX_VERIFY_ATTEMPTS) {
        otps.delete(body.mobile); // out of attempts: the code is dead
        throw apiError.invalidField(
          "code",
          "تعداد تلاش‌های مجاز تمام شد؛ کد جدید دریافت کنید",
        );
      }
      throw apiError.invalidField("code", "کد تأیید نامعتبر است");
    }
    otps.delete(body.mobile);

    const db = getDb();
    const existing = db.users.find(
      (user) => user.role === "student" && user.mobile === body.mobile,
    );
    if (existing) {
      const lastLoginAt = nowIso();
      const updated = db.users.update(existing.id, {
        lastLoginAt,
        updatedAt: lastLoginAt,
      });
      const caseLink = resolveCaseLinkOnLogin(db, updated);
      const refreshed = db.users.get(updated.id) ?? updated;
      return sessionResult(refreshed, { isNewUser: false, caseLink });
    }

    const createdAt = nowIso();
    const created = db.users.insert({
      id: newId(),
      name: `دانشجو ${body.mobile.slice(-4)}`,
      role: "student",
      permissions: [],
      mobile: body.mobile,
      status: "active",
      lastLoginAt: createdAt,
      createdAt,
      updatedAt: createdAt,
      city: null,
      birthDate: null,
      education: emptyEducation(),
      activeCaseId: null,
    });
    const caseLink = resolveCaseLinkOnLogin(db, created);
    const refreshed = db.users.get(created.id) ?? created;
    return sessionResult(refreshed, { isNewUser: true, caseLink });
  }),

  staffLogin: defineRoute<{ body: StaffLogin }>(({ body }) => {
    const db = getDb();
    const user = db.users.find(
      (entry) =>
        entry.role !== "student" &&
        entry.email === body.email &&
        entry.password === body.password,
    );
    if (!user) throw apiError.unauthorized("ایمیل یا رمز عبور اشتباه است");
    if (user.status === "inactive") {
      throw apiError.unauthorized("حساب کاربری غیرفعال است");
    }
    const lastLoginAt = nowIso();
    const updated = db.users.update(user.id, {
      lastLoginAt,
      updatedAt: lastLoginAt,
    });
    return sessionResult(updated);
  }),

  refreshSession: defineRoute(({ request }) => {
    const user = rotateRefreshToken(readRefreshToken(request));
    if (!user) throw apiError.unauthorized("نشست منقضی شده است؛ دوباره وارد شوید");
    return sessionResult(user);
  }),

  logout: defineRoute(({ request }) => {
    revokeRefreshToken(readRefreshToken(request));
    revokeAccessToken(readAccessToken(request));
    return noContent({ headers: { "set-cookie": clearedSessionCookie() } });
  }),

  getCurrentUser: defineRoute(({ user }) =>
    ok(toCurrentUser(requireUser(user))),
  ),

  updateCurrentUser: defineRoute<{ body: UpdateProfile }>(({ user, body }) => {
    const current = requireUser(user);
    const db = getDb();
    if (body.email) {
      const taken = db.users.find(
        (entry) => entry.id !== current.id && entry.email === body.email,
      );
      if (taken) {
        throw apiError.conflict("این ایمیل قبلاً استفاده شده است", {
          email: ["این ایمیل قبلاً استفاده شده است"],
        });
      }
    }
    const updated = db.users.update(current.id, {
      ...(body.name ? { name: body.name } : {}),
      ...(body.email ? { email: body.email } : {}),
      updatedAt: nowIso(),
    });
    return ok(toCurrentUser(updated));
  }),
};
