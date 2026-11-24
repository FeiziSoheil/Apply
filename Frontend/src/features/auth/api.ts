import type { z } from "zod";
import {
  currentUserSchema,
  otpRequestResultSchema,
  otpRequestSchema,
  otpVerifySchema,
  sessionSchema,
  staffLoginSchema,
} from "@/contracts/auth";
import {
  apiGet,
  apiPost,
  apiPostVoid,
  type RequestOptions,
} from "@/lib/api/client";
import { validateRequest } from "@/lib/api/validate";

/**
 * Every call opts out of the automatic "401 → session expired" reaction:
 * a 401 here is an expected business result (wrong password, anonymous
 * visitor). `AuthProvider` decides what an unauthenticated state means.
 */
const AUTH_OPTIONS: RequestOptions = { skipAuthRedirect: true };

export const authApi = {
  /** Students: send a one-time code to the mobile number */
  requestOtp(body: z.input<typeof otpRequestSchema>, options?: RequestOptions) {
    return apiPost(
      "/auth/otp/request",
      otpRequestResultSchema,
      validateRequest(otpRequestSchema, body),
      { ...AUTH_OPTIONS, ...options },
    );
  },

  /** Students: verify the code and sign in (creates the account if new) */
  verifyOtp(body: z.input<typeof otpVerifySchema>, options?: RequestOptions) {
    return apiPost(
      "/auth/otp/verify",
      sessionSchema,
      validateRequest(otpVerifySchema, body),
      { ...AUTH_OPTIONS, ...options },
    );
  },

  /** Staff (admin, consultant): email + password */
  staffLogin(body: z.input<typeof staffLoginSchema>, options?: RequestOptions) {
    return apiPost(
      "/auth/login",
      sessionSchema,
      validateRequest(staffLoginSchema, body),
      { ...AUTH_OPTIONS, ...options },
    );
  },

  /** Revokes the session; the API client clears its own state on success */
  logout(options?: RequestOptions) {
    return apiPostVoid("/auth/logout", undefined, {
      ...AUTH_OPTIONS,
      ...options,
    });
  },

  getCurrentUser(options?: RequestOptions) {
    return apiGet("/me", currentUserSchema, { ...AUTH_OPTIONS, ...options });
  },
};
