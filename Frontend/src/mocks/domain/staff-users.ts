import type { StaffUser } from "@/contracts/users";
import type { MockUser } from "../types";
import { apiError } from "../errors";
import { isStaff } from "./users";

/** Public staff-list projection (never leaks password) */
export function toStaffUser(user: MockUser): StaffUser {
  if (!isStaff(user) || !user.email) {
    throw apiError.internal("toStaffUser called with a non-staff account");
  }
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role === "admin" ? "admin" : "consultant",
    status: user.status,
    lastLoginAt: user.lastLoginAt,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
  };
}

export function assertStaffAccount(user: MockUser | undefined): MockUser {
  if (!user || !isStaff(user)) throw apiError.notFound("کاربر");
  return user;
}

/** Count of active admins (optionally excluding one id) */
export function countActiveAdmins(
  users: readonly MockUser[],
  excludeId?: string,
): number {
  return users.filter(
    (user) =>
      user.role === "admin" &&
      user.status === "active" &&
      user.id !== excludeId,
  ).length;
}

/** Generate a temporary password that satisfies `passwordStrengthSchema` */
export function generateTemporaryPassword(): string {
  const cryptoApi = globalThis.crypto;
  const suffix =
    cryptoApi && typeof cryptoApi.randomUUID === "function"
      ? cryptoApi.randomUUID().replace(/-/g, "").slice(0, 8)
      : String(Date.now());
  return `Tmp@${suffix}A1`;
}
