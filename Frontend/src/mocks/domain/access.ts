import type { StudentCase } from "@/contracts/students";
import type { MockUser } from "../types";
import { apiError } from "../errors";

/** admin: everything · consultant: assigned cases · student: own case */
export function canAccessCase(user: MockUser, studentCase: StudentCase): boolean {
  if (user.role === "admin") return true;
  if (user.role === "consultant") return studentCase.consultantId === user.id;
  return studentCase.studentId === user.id;
}

export function assertCaseAccess(user: MockUser, studentCase: StudentCase): void {
  if (!canAccessCase(user, studentCase)) throw apiError.forbidden();
}
