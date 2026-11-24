import {
  consultantAvailabilitySchema,
  consultantAvailabilityUpsertSchema,
  globalHolidayCreateSchema,
  globalHolidaySchema,
  globalHolidaysReplaceSchema,
  leaveCreateSchema,
  leaveExceptionSchema,
  specialDayCreateSchema,
  specialDayExceptionSchema,
} from "../availability";
import { idParamSchema, successEnvelope } from "../common";
import { z } from "../zod";
import { ADMIN, requires, type RouteRegistrar } from "./helpers";

const TAG = "Availability";
const MANAGE =
  "تنظیمات ساعات کاری و تعطیلات؛ فقط admin (`user:manage`). مشاوران از طریق اسلات‌های رزرو اثر آن را می‌بینند.";

export function registerAvailabilityRoutes(r: RouteRegistrar): void {
  const availabilityResponse = successEnvelope(
    "ConsultantAvailabilityResponse",
    consultantAvailabilitySchema,
  );
  const holidayResponse = successEnvelope("GlobalHolidayResponse", globalHolidaySchema);

  r.route({
    method: "get",
    path: "/availability",
    tag: TAG,
    operationId: "listConsultantAvailabilities",
    summary: "فهرست ساعات کاری همه مشاوران",
    description: MANAGE,
    access: requires("user:manage", ["admin"]),
    success: {
      status: 200,
      description: "فهرست تنظیمات",
      schema: successEnvelope(
        "ConsultantAvailabilitiesResponse",
        z.array(consultantAvailabilitySchema),
      ),
    },
  });

  r.route({
    method: "get",
    path: "/availability/holidays",
    tag: TAG,
    operationId: "listGlobalHolidays",
    summary: "تعطیلات سراسری",
    access: requires("user:manage", ["admin"]),
    success: {
      status: 200,
      description: "فهرست تعطیلات",
      schema: successEnvelope("GlobalHolidaysResponse", z.array(globalHolidaySchema)),
    },
  });

  r.route({
    method: "put",
    path: "/availability/holidays",
    tag: TAG,
    operationId: "replaceGlobalHolidays",
    summary: "جایگزینی کامل تعطیلات سراسری",
    access: ADMIN,
    body: { schema: globalHolidaysReplaceSchema },
    success: {
      status: 200,
      description: "تعطیلات به‌روز شد",
      schema: successEnvelope("GlobalHolidaysResponse", z.array(globalHolidaySchema)),
    },
  });

  r.route({
    method: "post",
    path: "/availability/holidays",
    tag: TAG,
    operationId: "createGlobalHoliday",
    summary: "افزودن تعطیلی سراسری",
    access: ADMIN,
    body: { schema: globalHolidayCreateSchema },
    success: {
      status: 201,
      description: "تعطیلی اضافه شد",
      schema: holidayResponse,
    },
    conflict: true,
  });

  r.route({
    method: "delete",
    path: "/availability/holidays/{id}",
    tag: TAG,
    operationId: "deleteGlobalHoliday",
    summary: "حذف تعطیلی سراسری",
    access: ADMIN,
    params: idParamSchema,
    success: { status: 204, description: "حذف شد" },
  });

  r.route({
    method: "get",
    path: "/availability/{consultantId}",
    tag: TAG,
    operationId: "getConsultantAvailability",
    summary: "ساعات کاری یک مشاور",
    description: MANAGE,
    access: requires("user:manage", ["admin"]),
    params: z.object({ consultantId: idParamSchema.shape.id }),
    success: {
      status: 200,
      description: "تنظیمات مشاور",
      schema: availabilityResponse,
    },
  });

  r.route({
    method: "put",
    path: "/availability/{consultantId}",
    tag: TAG,
    operationId: "upsertConsultantAvailability",
    summary: "ذخیره برنامه هفتگی و ظرفیت مشاور",
    description:
      "مرخصی و روزهای ویژه را تغییر نمی‌دهد. مشاور ناموجود → `NOT_FOUND`.",
    access: ADMIN,
    params: z.object({ consultantId: idParamSchema.shape.id }),
    body: { schema: consultantAvailabilityUpsertSchema },
    success: {
      status: 200,
      description: "ذخیره شد",
      schema: availabilityResponse,
    },
  });

  r.route({
    method: "post",
    path: "/availability/{consultantId}/leaves",
    tag: TAG,
    operationId: "createAvailabilityLeave",
    summary: "ثبت مرخصی مشاور",
    access: ADMIN,
    params: z.object({ consultantId: idParamSchema.shape.id }),
    body: { schema: leaveCreateSchema },
    success: {
      status: 201,
      description: "مرخصی ثبت شد",
      schema: successEnvelope("AvailabilityLeaveResponse", leaveExceptionSchema),
    },
  });

  r.route({
    method: "delete",
    path: "/availability/{consultantId}/leaves/{leaveId}",
    tag: TAG,
    operationId: "deleteAvailabilityLeave",
    summary: "حذف مرخصی",
    access: ADMIN,
    params: z.object({
      consultantId: idParamSchema.shape.id,
      leaveId: idParamSchema.shape.id,
    }),
    success: { status: 204, description: "حذف شد" },
  });

  r.route({
    method: "post",
    path: "/availability/{consultantId}/special-days",
    tag: TAG,
    operationId: "createAvailabilitySpecialDay",
    summary: "ثبت روز ویژه (بازه سفارشی)",
    access: ADMIN,
    params: z.object({ consultantId: idParamSchema.shape.id }),
    body: { schema: specialDayCreateSchema },
    success: {
      status: 201,
      description: "روز ویژه ثبت شد",
      schema: successEnvelope(
        "AvailabilitySpecialDayResponse",
        specialDayExceptionSchema,
      ),
    },
    conflict: true,
  });

  r.route({
    method: "delete",
    path: "/availability/{consultantId}/special-days/{specialDayId}",
    tag: TAG,
    operationId: "deleteAvailabilitySpecialDay",
    summary: "حذف روز ویژه",
    access: ADMIN,
    params: z.object({
      consultantId: idParamSchema.shape.id,
      specialDayId: idParamSchema.shape.id,
    }),
    success: { status: 204, description: "حذف شد" },
  });
}
