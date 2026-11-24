"use client";

import type { z } from "zod";
import type { updateProfileSchema } from "@/contracts/auth";
import type {
  changePasswordSchema,
  inviteUserSchema,
  updateStaffUserSchema,
} from "@/contracts/users";
import { authKeys } from "@/features/auth/keys";
import {
  useApiMutation,
  type ApiMutationOptions,
} from "@/lib/api/use-api-mutation";
import { usersApi } from "./api";
import { userKeys } from "./keys";

type InviteResult = Awaited<ReturnType<typeof usersApi.invite>>;
type StaffUser = Awaited<ReturnType<typeof usersApi.update>>;
type ResetResult = Awaited<ReturnType<typeof usersApi.resetPassword>>;
type Profile = Awaited<ReturnType<typeof usersApi.updateProfile>>;

export function useInviteStaffUser(
  options?: ApiMutationOptions<InviteResult, z.input<typeof inviteUserSchema>>,
) {
  return useApiMutation({
    mutationFn: (body) => usersApi.invite(body),
    invalidates: () => [userKeys.lists()],
    options,
  });
}

type UpdateVars = {
  id: string;
  body: z.input<typeof updateStaffUserSchema>;
};

export function useUpdateStaffUser(
  options?: ApiMutationOptions<StaffUser, UpdateVars>,
) {
  return useApiMutation({
    mutationFn: ({ id, body }: UpdateVars) => usersApi.update(id, body),
    invalidates: () => [userKeys.lists()],
    options,
  });
}

export function useResetStaffPassword(
  options?: ApiMutationOptions<ResetResult, string>,
) {
  return useApiMutation({
    mutationFn: (id: string) => usersApi.resetPassword(id),
    options,
  });
}

export function useChangePassword(
  options?: ApiMutationOptions<void, z.input<typeof changePasswordSchema>>,
) {
  return useApiMutation({
    mutationFn: (body) => usersApi.changePassword(body),
    options,
  });
}

export function useUpdateProfile(
  options?: ApiMutationOptions<Profile, z.input<typeof updateProfileSchema>>,
) {
  return useApiMutation({
    mutationFn: (body) => usersApi.updateProfile(body),
    invalidates: () => [authKeys.me()],
    options,
  });
}

export function useRevokeMySession(options?: ApiMutationOptions<void, string>) {
  return useApiMutation({
    mutationFn: (id: string) => usersApi.revokeMySession(id),
    invalidates: () => [userKeys.sessions()],
    options,
  });
}

export function useRevokeOtherSessions(
  options?: ApiMutationOptions<void, void>,
) {
  return useApiMutation({
    mutationFn: () => usersApi.revokeOtherSessions(),
    invalidates: () => [userKeys.sessions()],
    options,
  });
}
