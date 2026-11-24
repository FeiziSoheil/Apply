"use client";

import type { z } from "zod";
import type {
  otpRequestSchema,
  otpVerifySchema,
  staffLoginSchema,
} from "@/contracts/auth";
import {
  useApiMutation,
  type ApiMutationOptions,
} from "@/lib/api/use-api-mutation";
import { authApi } from "./api";

type OtpRequestResult = Awaited<ReturnType<typeof authApi.requestOtp>>;
type Session = Awaited<ReturnType<typeof authApi.verifyOtp>>;

export function useRequestOtp(
  options?: ApiMutationOptions<OtpRequestResult, z.input<typeof otpRequestSchema>>,
) {
  return useApiMutation({
    mutationFn: (body: z.input<typeof otpRequestSchema>) =>
      authApi.requestOtp(body),
    options,
  });
}

export function useVerifyOtp(
  options?: ApiMutationOptions<Session, z.input<typeof otpVerifySchema>>,
) {
  return useApiMutation({
    mutationFn: (body: z.input<typeof otpVerifySchema>) =>
      authApi.verifyOtp(body),
    options,
  });
}

export function useStaffLogin(
  options?: ApiMutationOptions<Session, z.input<typeof staffLoginSchema>>,
) {
  return useApiMutation({
    mutationFn: (body: z.input<typeof staffLoginSchema>) =>
      authApi.staffLogin(body),
    options,
  });
}

export function useLogout(options?: ApiMutationOptions<void, void>) {
  return useApiMutation({
    mutationFn: () => authApi.logout(),
    options,
  });
}
