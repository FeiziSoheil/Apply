import { consultants } from "@/data/consultants";
import { mockDelay } from "@/lib/mock-delay";
import type { Consultant } from "@/types";

export async function getConsultants(): Promise<Consultant[]> {
  "use cache";
  await mockDelay();
  return consultants;
}

/** Compatibility alias used by /team page */
export async function getTeamMembers(): Promise<Consultant[]> {
  return getConsultants();
}
