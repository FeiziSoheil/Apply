import type { Consultant } from "@/contracts/content";
import { DEMO_ACCOUNTS } from "../config";
import type { MockUser } from "../types";
import { uuidFromKey } from "../utils";
import { iso, persianMobile, type SeedClock } from "./helpers";
import { DAY_MS } from "../utils";

export const ADMIN_USER_ID = uuidFromKey("user:admin");

/**
 * Staff accounts: one admin plus one consultant account per consultant
 * profile. The account id equals `Consultant.id`, so `lead.assignedTo`
 * (a consultant id) and `ticket.assignedTo` (a staff user id) are the same.
 */
export function buildStaffUsers(
  clock: SeedClock,
  consultants: readonly Consultant[],
): MockUser[] {
  const createdAt = iso(clock.now - 400 * DAY_MS);
  const updatedAt = createdAt;
  const admin: MockUser = {
    id: ADMIN_USER_ID,
    name: "مدیر سامانه",
    role: "admin",
    permissions: [],
    mobile: "09121110000",
    email: DEMO_ACCOUNTS.admin.email,
    password: DEMO_ACCOUNTS.admin.password,
    status: "active",
    lastLoginAt: iso(clock.now - 2 * DAY_MS),
    createdAt,
    updatedAt,
  };

  const consultantUsers: MockUser[] = consultants.map((consultant, index) => ({
    id: consultant.id,
    name: consultant.name,
    role: "consultant",
    permissions: [],
    mobile: persianMobile(),
    email: `consultant${index + 1}@apply.example`,
    password: DEMO_ACCOUNTS.consultant.password,
    status: "active",
    lastLoginAt: iso(clock.now - (index + 1) * DAY_MS),
    createdAt,
    updatedAt,
  }));

  return [admin, ...consultantUsers];
}
