import {
  bookingCancelSchema,
  bookingChangeSchema,
  bookingCreateSchema,
  bookingListQuerySchema,
  bookingPatchSchema,
  bookingReceiptSchema,
  bookingSchema,
  bookingStaffCreateSchema,
  bookingStatusUpdateSchema,
  slotsQuerySchema,
  timeSlotSchema,
} from "../bookings";
import { idParamSchema, paginatedEnvelope, successEnvelope } from "../common";
import { z } from "../zod";
import { STAFF_ROLES } from "../auth";
import { PUBLIC, requires, type RouteRegistrar } from "./helpers";

const TAG = "Bookings";
const OWNERSHIP =
  "دانشجو فقط رزروهای خودش، consultant فقط رزروهای خودش و admin همه را می‌بیند.";
const REASSIGN =
  "تغییر مشاور (`consultantId`) فقط برای نقش admin مجاز است؛ مشاور فقط وضعیت و یادداشت رزروهای خودش را تغییر می‌دهد.";

export function registerBookingRoutes(r: RouteRegistrar): void {
  const bookingResponse = successEnvelope("BookingResponse", bookingSchema);

  r.route({
    method: "get",
    path: "/bookings/slots",
    tag: TAG,
    operationId: "listBookingSlots",
    summary: "اسلات‌های زمانی مشاوره در یک روز",
    description:
      "همه اسلات‌های روز را با `available` برمی‌گرداند. زمان‌ها UTC هستند؛ روز بر اساس وقت تهران (Asia/Tehran) تعیین می‌شود.",
    access: PUBLIC,
    query: slotsQuerySchema,
    success: {
      status: 200,
      description: "فهرست اسلات‌ها",
      schema: successEnvelope("TimeSlotsResponse", z.array(timeSlotSchema)),
    },
  });

  r.route({
    method: "post",
    path: "/bookings",
    tag: TAG,
    operationId: "createBooking",
    summary: "رزرو وقت مشاوره",
    description:
      "برای مهمان و کاربر لاگین‌شده. اسلات پرشده → `CONFLICT`. در صورت نبود `consultantId`، مشاور آزاد تخصیص می‌یابد.",
    access: PUBLIC,
    body: { schema: bookingCreateSchema },
    success: {
      status: 201,
      description: "رزرو ثبت شد",
      schema: successEnvelope("BookingReceiptResponse", bookingReceiptSchema),
    },
    conflict: true,
  });

  r.route({
    method: "get",
    path: "/bookings",
    tag: TAG,
    operationId: "listBookings",
    summary: "فهرست رزروها",
    description: OWNERSHIP,
    access: requires("booking:read", STAFF_ROLES),
    query: bookingListQuerySchema,
    success: {
      status: 200,
      description: "فهرست صفحه‌بندی‌شده رزروها",
      schema: paginatedEnvelope("BookingsPage", bookingSchema),
    },
  });

  r.route({
    method: "get",
    path: "/me/bookings",
    tag: TAG,
    operationId: "listMyBookings",
    summary: "رزروهای من",
    access: requires("booking:read", ["student"]),
    query: bookingListQuerySchema,
    success: {
      status: 200,
      description: "فهرست رزروهای کاربر جاری",
      schema: paginatedEnvelope("MyBookingsPage", bookingSchema),
    },
  });

  r.route({
    method: "get",
    path: "/bookings/{id}",
    tag: TAG,
    operationId: "getBooking",
    summary: "دریافت رزرو",
    description: OWNERSHIP,
    access: requires("booking:read"),
    params: idParamSchema,
    success: { status: 200, description: "رزرو", schema: bookingResponse },
  });

  r.route({
    method: "post",
    path: "/bookings/{id}/cancel",
    tag: TAG,
    operationId: "cancelBooking",
    summary: "لغو رزرو",
    description:
      "فقط رزروهای `pending` و `confirmed` که شروع نشده‌اند قابل لغو هستند؛ در غیر این صورت `CONFLICT`.",
    access: requires("booking:write"),
    params: idParamSchema,
    body: { schema: bookingCancelSchema },
    success: { status: 200, description: "رزرو لغو شد", schema: bookingResponse },
    conflict: true,
  });

  r.route({
    method: "patch",
    path: "/bookings/{id}/status",
    tag: TAG,
    operationId: "updateBookingStatus",
    summary: "تغییر وضعیت رزرو",
    description: OWNERSHIP,
    access: requires("booking:manage", STAFF_ROLES),
    params: idParamSchema,
    body: { schema: bookingStatusUpdateSchema },
    success: { status: 200, description: "وضعیت تغییر کرد", schema: bookingResponse },
    conflict: true,
  });

  r.route({
    method: "patch",
    path: "/bookings/{id}",
    tag: TAG,
    operationId: "patchBooking",
    summary: "جابه‌جایی اسلات / تغییر مشاور / یادداشت داخلی",
    description: `${OWNERSHIP} ${REASSIGN} تداخل زمانی مشاور → \`CONFLICT\`.`,
    access: requires("booking:manage", STAFF_ROLES),
    params: idParamSchema,
    body: { schema: bookingPatchSchema },
    success: { status: 200, description: "رزرو به‌روز شد", schema: bookingResponse },
    conflict: true,
  });

  r.route({
    method: "post",
    path: "/bookings/staff",
    tag: TAG,
    operationId: "createStaffBooking",
    summary: "ایجاد دستی رزرو توسط کارمند",
    description:
      "از تقویم مدیریتی. تداخل زمانی → `CONFLICT`. مشاور آزاد در صورت نبود `consultantId`.",
    access: requires("booking:write", STAFF_ROLES),
    body: { schema: bookingStaffCreateSchema },
    success: {
      status: 201,
      description: "رزرو ثبت شد",
      schema: bookingResponse,
    },
    conflict: true,
  });

  r.route({
    method: "get",
    path: "/bookings/{id}/history",
    tag: TAG,
    operationId: "listBookingHistory",
    summary: "تاریخچه تغییرات رزرو",
    description: OWNERSHIP,
    access: requires("booking:read", STAFF_ROLES),
    params: idParamSchema,
    success: {
      status: 200,
      description: "فهرست تغییرات (جدیدترین اول)",
      schema: successEnvelope(
        "BookingHistoryResponse",
        z.array(bookingChangeSchema),
      ),
    },
  });

  r.route({
    method: "post",
    path: "/bookings/{id}/remind",
    tag: TAG,
    operationId: "sendBookingReminder",
    summary: "ارسال یادآوری به متقاضی",
    description:
      "در این نسخه فقط ثبت در تاریخچه و پاسخ موفق؛ ارسال واقعی پیامک/ایمیل بعداً وصل می‌شود.",
    access: requires("booking:manage", STAFF_ROLES),
    params: idParamSchema,
    success: {
      status: 200,
      description: "یادآوری ثبت شد",
      schema: bookingResponse,
    },
    conflict: true,
  });
}
