import type { z } from "zod";
import { currentUserSchema, updateProfileSchema } from "@/contracts/auth";
import {
  changePasswordSchema,
  inviteUserResultSchema,
  inviteUserSchema,
  resetPasswordResultSchema,
  staffUserSchema,
  updateStaffUserSchema,
  userSessionSchema,
  type StaffUserListQuery,
} from "@/contracts/users";
import {
  apiDelete,
  apiGet,
  apiGetPage,
  apiPatch,
  apiPost,
  apiPostVoid,
  segment,
  type RequestOptions,
} from "@/lib/api/client";
import { validateRequest } from "@/lib/api/validate";
import { z as zod } from "zod";

const sessionsSchema = zod.array(userSessionSchema);

export type StaffUserListFilters = Partial<StaffUserListQuery>;

const userPath = (id: string) => `/users/${segment(id)}`;

export const usersApi = {
  list(filters?: StaffUserListFilters, options?: RequestOptions) {
    return apiGetPage("/users", staffUserSchema, {
      ...options,
      query: filters,
    });
  },

  invite(
    body: z.input<typeof inviteUserSchema>,
    options?: RequestOptions,
  ) {
    return apiPost(
      "/users/invite",
      inviteUserResultSchema,
      validateRequest(inviteUserSchema, body),
      options,
    );
  },

  update(
    id: string,
    body: z.input<typeof updateStaffUserSchema>,
    options?: RequestOptions,
  ) {
    return apiPatch(
      userPath(id),
      staffUserSchema,
      validateRequest(updateStaffUserSchema, body),
      options,
    );
  },

  resetPassword(id: string, options?: RequestOptions) {
    return apiPost(
      `${userPath(id)}/reset-password`,
      resetPasswordResultSchema,
      undefined,
      options,
    );
  },

  listMySessions(options?: RequestOptions) {
    return apiGet("/me/sessions", sessionsSchema, options);
  },

  revokeMySession(id: string, options?: RequestOptions) {
    return apiDelete(`/me/sessions/${segment(id)}`, options);
  },

  revokeOtherSessions(options?: RequestOptions) {
    return apiPostVoid("/me/sessions/revoke-others", undefined, options);
  },

  changePassword(
    body: z.input<typeof changePasswordSchema>,
    options?: RequestOptions,
  ) {
    return apiPostVoid(
      "/me/change-password",
      validateRequest(changePasswordSchema, body),
      options,
    );
  },

  updateProfile(
    body: z.input<typeof updateProfileSchema>,
    options?: RequestOptions,
  ) {
    return apiPatch(
      "/me",
      currentUserSchema,
      validateRequest(updateProfileSchema, body),
      options,
    );
  },
};
