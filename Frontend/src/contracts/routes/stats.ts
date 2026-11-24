import { successEnvelope } from "../common";
import { adminStatsQuerySchema, adminStatsSchema } from "../stats";
import { STAFF_ROLES } from "../auth";
import { requires, type RouteRegistrar } from "./helpers";

const TAG = "Stats";
const SCOPE =
  "نقش consultant فقط آمار سرنخ‌ها، رزروها و پرونده‌های اختصاص‌یافته به خودش را می‌بیند؛ admin همه را.";

export function registerStatsRoutes(r: RouteRegistrar): void {
  r.route({
    method: "get",
    path: "/admin/stats",
    tag: TAG,
    operationId: "getAdminStats",
    summary: "آمار داشبورد مدیریت",
    description:
      `کارت‌های KPI، روند سرنخ، منابع UTM، قیف فروش، لیست نیازمند اقدام و برنامه امروز. ` +
      `پارامتر \`rangeDays\` بازهٔ مقایسه و نمودارها را تنظیم می‌کند (۷ / ۳۰ / ۹۰). ${SCOPE}`,
    access: requires("lead:read", STAFF_ROLES),
    query: adminStatsQuerySchema,
    success: {
      status: 200,
      description: "آمار داشبورد",
      schema: successEnvelope("AdminStatsResponse", adminStatsSchema),
    },
  });
}
