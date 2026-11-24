import type { AuthArea } from "./routes";
import type { Role } from "@/contracts/auth";

export const ROLE_LABELS: Record<Role, string> = {
  admin: "مدیر",
  consultant: "مشاور",
  student: "دانشجو",
};

/** Persian name of each protected area */
export const AREA_LABELS: Record<AuthArea, string> = {
  admin: "پنل مدیریت",
  panel: "پنل دانشجو",
};
