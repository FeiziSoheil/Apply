import { z } from "../zod";
import {
  idParamSchema,
  paginatedEnvelope,
  successEnvelope,
} from "../common";
import {
  announcementCreateSchema,
  announcementListQuerySchema,
  announcementSchema,
  announcementUpdateSchema,
  announcementViewSchema,
  caseLinkResultSchema,
  documentViewSchema,
  documentViewsPayloadSchema,
  selectCaseSchema,
  studentDocumentUploadSchema,
  shortlistCompareSchema,
  shortlistConsultationRequestSchema,
  shortlistMergeSchema,
  shortlistPutSchema,
  shortlistSchema,
  studentCaseViewSchema,
  studentMobileChangeRequestSchema,
  studentMobileChangeVerifySchema,
  studentPaymentSummarySchema,
  studentProfileSchema,
  studentProfileUpdateSchema,
  studentTaskViewSchema,
} from "../student-panel";
import {
  privacyRequestCreateSchema,
  privacyRequestListQuerySchema,
  privacyRequestProcessSchema,
  privacyRequestSchema,
} from "../privacy";
import {
  mockGatewayResolveSchema,
  paymentAttemptSchema,
  paymentPlanCreateSchema,
  paymentPlanSchema,
  studentInstallmentPaySchema,
  studentPayResultSchema,
  installmentCancelSchema,
  installmentSchema,
  installmentUpdateSchema,
  installmentRemindersResultSchema,
  invoiceSchema,
  paymentVerifyStaffSchema,
  financeSummarySchema,
  financeReportQuerySchema,
  financeReportSchema,
  financeTransactionListQuerySchema,
  financeTransactionSchema,
} from "../payments";
import { paymentAccountSettingsSchema } from "../settings";
import {
  ticketCreateSchema,
  ticketListQuerySchema,
  ticketMessageCreateSchema,
  ticketMessageViewSchema,
  ticketRatingSchema,
  ticketViewSchema,
} from "../tickets";
import { otpRequestResultSchema } from "../auth";
import { STAFF_ROLES } from "../auth";
import { ANY_USER, requires, type RouteRegistrar } from "./helpers";

const PANEL = "Student panel";
const ANNOUNCEMENTS = "Announcements";
const FINANCE = "Finance";
const ADMIN = "Admin";
const STUDENT_ONLY = ["student"] as const;

/**
 * Student-facing `/me/*` views + staff announcement/finance extensions.
 * Ownership: foreign resource ids always → 404 (never 403) for students.
 */
export function registerStudentPanelRoutes(r: RouteRegistrar): void {
  /* ----- Profile & case link ----- */

  r.route({
    method: "get",
    path: "/me/profile",
    tag: PANEL,
    operationId: "getMyProfile",
    summary: "پروفایل دانشجو",
    access: requires("student:read", STUDENT_ONLY),
    success: {
      status: 200,
      description: "پروفایل",
      schema: successEnvelope("StudentProfileResponse", studentProfileSchema),
    },
  });

  r.route({
    method: "patch",
    path: "/me/profile",
    tag: PANEL,
    operationId: "updateMyProfile",
    summary: "ویرایش پروفایل دانشجو",
    description:
      "نام، ایمیل، شهر، تاریخ تولد و اطلاعات تحصیلی. تغییر موبایل فقط با OTP روی شماره جدید.",
    access: requires("student:write", STUDENT_ONLY),
    body: { schema: studentProfileUpdateSchema },
    success: {
      status: 200,
      description: "پروفایل به‌روز شد",
      schema: successEnvelope("StudentProfileUpdateResponse", studentProfileSchema),
    },
    conflict: true,
  });

  r.route({
    method: "post",
    path: "/me/profile/mobile/request",
    tag: PANEL,
    operationId: "requestMyMobileChange",
    summary: "درخواست تغییر موبایل (ارسال OTP به شماره جدید)",
    access: requires("student:write", STUDENT_ONLY),
    body: { schema: studentMobileChangeRequestSchema },
    success: {
      status: 200,
      description: "کد ارسال شد",
      schema: successEnvelope("MobileChangeOtpResponse", otpRequestResultSchema),
    },
  });

  r.route({
    method: "post",
    path: "/me/profile/mobile/verify",
    tag: PANEL,
    operationId: "verifyMyMobileChange",
    summary: "تأیید OTP و اعمال موبایل جدید",
    access: requires("student:write", STUDENT_ONLY),
    body: { schema: studentMobileChangeVerifySchema },
    success: {
      status: 200,
      description: "موبایل به‌روز شد",
      schema: successEnvelope("MobileChangeVerifyResponse", studentProfileSchema),
    },
    conflict: true,
  });

  r.route({
    method: "get",
    path: "/me/case-link",
    tag: PANEL,
    operationId: "getMyCaseLink",
    summary: "وضعیت اتصال به پرونده",
    access: requires("student:read", STUDENT_ONLY),
    success: {
      status: 200,
      description: "نتیجه اتصال",
      schema: successEnvelope("CaseLinkResponse", caseLinkResultSchema),
    },
  });

  r.route({
    method: "post",
    path: "/me/case-link/select",
    tag: PANEL,
    operationId: "selectMyCase",
    summary: "انتخاب پرونده وقتی چند پرونده مرتبط است",
    access: requires("student:write", STUDENT_ONLY),
    body: { schema: selectCaseSchema },
    success: {
      status: 200,
      description: "پرونده انتخاب شد",
      schema: successEnvelope("SelectCaseResponse", caseLinkResultSchema),
    },
    conflict: true,
  });

  /* ----- Case / docs / tasks views ----- */

  r.route({
    method: "get",
    path: "/me/case",
    tag: PANEL,
    operationId: "getMyCaseView",
    summary: "نمای پرونده دانشجو (StudentCaseView)",
    description:
      "اسکیمای جدا از StudentCase کارکنان؛ بدون یادداشت داخلی/امتیاز/ارزش لید.",
    access: requires("student:read", STUDENT_ONLY),
    success: {
      status: 200,
      description: "پرونده",
      schema: successEnvelope("StudentCaseViewResponse", studentCaseViewSchema),
    },
  });

  r.route({
    method: "get",
    path: "/me/documents",
    tag: PANEL,
    operationId: "listMyDocumentViews",
    summary: "مدارک من (DocumentView + پیشرفت + تنظیمات آپلود)",
    access: requires("student:read", STUDENT_ONLY),
    success: {
      status: 200,
      description: "فهرست مدارک",
      schema: successEnvelope(
        "DocumentViewsResponse",
        documentViewsPayloadSchema,
      ),
    },
  });

  r.route({
    method: "get",
    path: "/me/documents/{id}",
    tag: PANEL,
    operationId: "getMyDocumentView",
    summary: "جزئیات مدرک من",
    description: "مدرک دیگران → ۴۰۴.",
    access: requires("student:read", STUDENT_ONLY),
    params: idParamSchema,
    success: {
      status: 200,
      description: "مدرک",
      schema: successEnvelope("DocumentViewResponse", documentViewSchema),
    },
  });

  r.route({
    method: "post",
    path: "/me/documents/upload",
    tag: PANEL,
    operationId: "uploadMyDocument",
    summary: "بارگذاری یا جایگزینی مدرک",
    description:
      "ابتدا `POST /files`. مدرک تأییدشده قفل است. پس از آپلود وضعیت awaiting review (`uploaded`) می‌شود و مشاور پرونده مطلع می‌گردد.",
    access: requires("document:upload", STUDENT_ONLY),
    body: { schema: studentDocumentUploadSchema },
    success: {
      status: 200,
      description: "مدرک به‌روز شد",
      schema: successEnvelope("DocumentViewUploadResponse", documentViewSchema),
    },
  });

  r.route({
    method: "get",
    path: "/me/tasks",
    tag: PANEL,
    operationId: "listMyStudentTasks",
    summary: "کارهای شما (مشتق از مدارک/اقساط/رزرو — نه Task کارکنان)",
    access: requires("student:read", STUDENT_ONLY),
    success: {
      status: 200,
      description: "فهرست کارها",
      schema: successEnvelope(
        "StudentTasksResponse",
        z.array(studentTaskViewSchema),
      ),
    },
  });

  /* ----- Tickets (/me) ----- */

  r.route({
    method: "get",
    path: "/me/tickets",
    tag: PANEL,
    operationId: "listMyTickets",
    summary: "تیکت‌های من",
    access: requires("ticket:read", STUDENT_ONLY),
    query: ticketListQuerySchema,
    success: {
      status: 200,
      description: "فهرست",
      schema: paginatedEnvelope("MyTicketsPage", ticketViewSchema),
    },
  });

  r.route({
    method: "post",
    path: "/me/tickets",
    tag: PANEL,
    operationId: "createMyTicket",
    summary: "ثبت تیکت جدید",
    access: requires("ticket:write", STUDENT_ONLY),
    body: { schema: ticketCreateSchema },
    success: {
      status: 201,
      description: "تیکت ایجاد شد",
      schema: successEnvelope("MyTicketResponse", ticketViewSchema),
    },
  });

  r.route({
    method: "get",
    path: "/me/tickets/{id}",
    tag: PANEL,
    operationId: "getMyTicket",
    summary: "جزئیات تیکت من",
    description: "تیکت دیگران → ۴۰۴. پیام‌های internal هرگز برنمی‌گردند.",
    access: requires("ticket:read", STUDENT_ONLY),
    params: idParamSchema,
    success: {
      status: 200,
      description: "تیکت + پیام‌های قابل‌مشاهده",
      schema: successEnvelope(
        "MyTicketDetailResponse",
        z.object({
          ticket: ticketViewSchema,
          messages: z.array(ticketMessageViewSchema),
        }),
      ),
    },
  });

  r.route({
    method: "post",
    path: "/me/tickets/{id}/messages",
    tag: PANEL,
    operationId: "createMyTicketMessage",
    summary: "ارسال پیام در تیکت من",
    description:
      "هدر اختیاری `Idempotency-Key` برای جلوگیری از ارسال تکراری. تیکت بسته → CONFLICT.",
    access: requires("ticket:write", STUDENT_ONLY),
    params: idParamSchema,
    body: { schema: ticketMessageCreateSchema.omit({ internal: true }) },
    success: {
      status: 201,
      description: "پیام ارسال شد",
      schema: successEnvelope("MyTicketMessageResponse", ticketMessageViewSchema),
    },
    conflict: true,
  });

  r.route({
    method: "post",
    path: "/me/tickets/{id}/close",
    tag: PANEL,
    operationId: "closeMyTicket",
    summary: "بستن تیکت من",
    access: requires("ticket:write", STUDENT_ONLY),
    params: idParamSchema,
    body: { schema: z.object({}).strict() },
    success: {
      status: 200,
      description: "بسته شد",
      schema: successEnvelope("MyTicketCloseResponse", ticketViewSchema),
    },
    conflict: true,
  });

  r.route({
    method: "post",
    path: "/me/tickets/{id}/reopen",
    tag: PANEL,
    operationId: "reopenMyTicket",
    summary: "بازگشایی تیکت من",
    description:
      "فقط تا ۷ روز پس از بستن. پس از آن → CONFLICT. وضعیت به waiting_staff برمی‌گردد.",
    access: requires("ticket:write", STUDENT_ONLY),
    params: idParamSchema,
    body: { schema: z.object({}).strict() },
    success: {
      status: 200,
      description: "بازگشایی شد",
      schema: successEnvelope("MyTicketReopenResponse", ticketViewSchema),
    },
    conflict: true,
  });

  r.route({
    method: "post",
    path: "/me/tickets/{id}/rating",
    tag: PANEL,
    operationId: "rateMyTicket",
    summary: "امتیاز به تیکت بسته‌شده",
    access: requires("ticket:write", STUDENT_ONLY),
    params: idParamSchema,
    body: { schema: ticketRatingSchema },
    success: {
      status: 200,
      description: "امتیاز ثبت شد",
      schema: successEnvelope("MyTicketRatingResponse", ticketViewSchema),
    },
    conflict: true,
  });

  /* ----- Payments (/me) ----- */

  r.route({
    method: "get",
    path: "/me/payments/summary",
    tag: PANEL,
    operationId: "getMyPaymentSummary",
    summary: "خلاصه پرداخت‌های من (مبالغ ریال)",
    access: requires("payment:read", STUDENT_ONLY),
    success: {
      status: 200,
      description: "خلاصه",
      schema: successEnvelope(
        "StudentPaymentSummaryResponse",
        studentPaymentSummarySchema,
      ),
    },
  });

  r.route({
    method: "get",
    path: "/me/installments",
    tag: PANEL,
    operationId: "listMyInstallments",
    summary: "اقساط من",
    access: requires("payment:read", STUDENT_ONLY),
    success: {
      status: 200,
      description: "اقساط",
      schema: successEnvelope(
        "MyInstallmentsResponse",
        z.array(installmentSchema),
      ),
    },
  });

  r.route({
    method: "post",
    path: "/me/installments/{id}/pay",
    tag: PANEL,
    operationId: "payMyInstallment",
    summary: "شروع پرداخت قسط",
    description:
      "مبلغ فقط از سرور (قسط) محاسبه می‌شود؛ کلاینت amount ارسال نکند. gateway → paymentId + gatewayUrl. card_to_card → awaiting_verification با رسید. هدر اختیاری Idempotency-Key. وضعیت نهایی فقط از GET /me/payments/{id}.",
    access: requires("payment:write", STUDENT_ONLY),
    params: idParamSchema,
    body: { schema: studentInstallmentPaySchema },
    success: {
      status: 201,
      description: "تراکنش ایجاد شد",
      schema: successEnvelope("StudentPayResultResponse", studentPayResultSchema),
    },
    conflict: true,
  });

  r.route({
    method: "get",
    path: "/me/payment-account",
    tag: PANEL,
    operationId: "getMyPaymentAccount",
    summary: "اطلاعات کارت‌به‌کارت موسسه",
    description: "شماره کارت و نام صاحب حساب برای واریز کارت‌به‌کارت.",
    access: requires("payment:read", STUDENT_ONLY),
    success: {
      status: 200,
      description: "حساب پرداخت",
      schema: successEnvelope(
        "StudentPaymentAccountResponse",
        paymentAccountSettingsSchema,
      ),
    },
  });

  r.route({
    method: "get",
    path: "/me/payments/{id}",
    tag: PANEL,
    operationId: "getMyPayment",
    summary: "وضعیت تلاش پرداخت (منبع حقیقت پس از callback)",
    description:
      "پارامترهای query در callback فقط نمایشی‌اند؛ همیشه این endpoint را برای وضعیت نهایی بخوانید.",
    access: requires("payment:read", STUDENT_ONLY),
    params: idParamSchema,
    success: {
      status: 200,
      description: "تلاش پرداخت",
      schema: successEnvelope("PaymentAttemptResponse", paymentAttemptSchema),
    },
  });

  r.route({
    method: "get",
    path: "/me/invoices",
    tag: PANEL,
    operationId: "listMyInvoices",
    summary: "فاکتورهای من",
    access: requires("payment:read", STUDENT_ONLY),
    success: {
      status: 200,
      description: "فاکتورها",
      schema: successEnvelope("MyInvoicesResponse", z.array(invoiceSchema)),
    },
  });

  r.route({
    method: "get",
    path: "/me/invoices/{id}",
    tag: PANEL,
    operationId: "getMyInvoice",
    summary: "جزئیات فاکتور من",
    access: requires("payment:read", STUDENT_ONLY),
    params: idParamSchema,
    success: {
      status: 200,
      description: "فاکتور",
      schema: successEnvelope("MyInvoiceResponse", invoiceSchema),
    },
  });

  /* ----- Mock gateway (mock-only contract) ----- */

  r.route({
    method: "post",
    path: "/mock-gateway/{id}/resolve",
    tag: PANEL,
    operationId: "resolveMockGateway",
    summary: "نتیجه درگاه آزمایشی (موفق / ناموفق / انصراف)",
    description:
      "فقط محیط mock. UI صفحه `/mock-gateway/{paymentId}` این را صدا می‌زند؛ وضعیت نهایی در PaymentAttempt ذخیره می‌شود.",
    access: ANY_USER,
    params: idParamSchema,
    body: { schema: mockGatewayResolveSchema },
    success: {
      status: 200,
      description: "وضعیت نهایی تلاش پرداخت",
      schema: successEnvelope("MockGatewayResolveResponse", paymentAttemptSchema),
    },
    conflict: true,
  });

  /* ----- Shortlist ----- */

  r.route({
    method: "get",
    path: "/me/shortlist",
    tag: PANEL,
    operationId: "getMyShortlist",
    summary: "لیست کوتاه من",
    access: requires("student:read", STUDENT_ONLY),
    success: {
      status: 200,
      description: "شورت‌لیست",
      schema: successEnvelope("ShortlistResponse", shortlistSchema),
    },
  });

  r.route({
    method: "put",
    path: "/me/shortlist",
    tag: PANEL,
    operationId: "putMyShortlistItem",
    summary: "افزودن برنامه یا دانشگاه به شورت‌لیست",
    access: requires("student:write", STUDENT_ONLY),
    body: { schema: shortlistPutSchema },
    success: {
      status: 200,
      description: "به‌روز شد",
      schema: successEnvelope("ShortlistPutResponse", shortlistSchema),
    },
  });

  r.route({
    method: "delete",
    path: "/me/shortlist",
    tag: PANEL,
    operationId: "deleteMyShortlistItem",
    summary: "حذف از شورت‌لیست",
    access: requires("student:write", STUDENT_ONLY),
    body: { schema: shortlistPutSchema },
    success: {
      status: 200,
      description: "حذف شد",
      schema: successEnvelope("ShortlistDeleteResponse", shortlistSchema),
    },
  });

  r.route({
    method: "get",
    path: "/me/shortlist/compare",
    tag: PANEL,
    operationId: "compareMyShortlist",
    summary: "مقایسه آیتم‌های شورت‌لیست",
    access: requires("student:read", STUDENT_ONLY),
    success: {
      status: 200,
      description: "مقایسه",
      schema: successEnvelope("ShortlistCompareResponse", shortlistCompareSchema),
    },
  });

  r.route({
    method: "post",
    path: "/me/shortlist/merge",
    tag: PANEL,
    operationId: "mergeMyShortlist",
    summary: "ادغام علاقه‌مندی‌های مهمان با حساب",
    access: requires("student:write", STUDENT_ONLY),
    body: { schema: shortlistMergeSchema },
    success: {
      status: 200,
      description: "ادغام شد",
      schema: successEnvelope("ShortlistMergeResponse", shortlistSchema),
    },
  });

  r.route({
    method: "post",
    path: "/me/shortlist/consult",
    tag: PANEL,
    operationId: "requestShortlistConsultation",
    summary: "درخواست مشاوره درباره برنامه‌های شورت‌لیست",
    access: requires("student:write", STUDENT_ONLY),
    body: { schema: shortlistConsultationRequestSchema },
    success: {
      status: 201,
      description: "درخواست مشاوره ثبت شد",
      schema: successEnvelope(
        "ShortlistConsultResponse",
        z.object({ ticketId: z.string().nullable(), message: z.string() }),
      ),
    },
  });

  /* ----- Announcements (student + CMS admin) ----- */

  r.route({
    method: "get",
    path: "/me/announcements",
    tag: PANEL,
    operationId: "listMyAnnouncements",
    summary: "اعلان‌های موسسه برای من",
    access: requires("student:read", STUDENT_ONLY),
    success: {
      status: 200,
      description: "اعلان‌ها",
      schema: successEnvelope(
        "AnnouncementViewsResponse",
        z.array(announcementViewSchema),
      ),
    },
  });

  r.route({
    method: "get",
    path: "/announcements",
    tag: ANNOUNCEMENTS,
    operationId: "listAnnouncements",
    summary: "فهرست اعلان‌ها (ادمین محتوا)",
    access: requires("content:read", STAFF_ROLES),
    query: announcementListQuerySchema,
    success: {
      status: 200,
      description: "فهرست",
      schema: paginatedEnvelope("AnnouncementsPage", announcementSchema),
    },
  });

  r.route({
    method: "post",
    path: "/announcements",
    tag: ANNOUNCEMENTS,
    operationId: "createAnnouncement",
    summary: "ایجاد اعلان",
    access: requires("content:write", ["admin"]),
    body: { schema: announcementCreateSchema },
    success: {
      status: 201,
      description: "ایجاد شد",
      schema: successEnvelope("AnnouncementResponse", announcementSchema),
    },
  });

  r.route({
    method: "get",
    path: "/announcements/{id}",
    tag: ANNOUNCEMENTS,
    operationId: "getAnnouncement",
    summary: "دریافت اعلان",
    access: requires("content:read", STAFF_ROLES),
    params: idParamSchema,
    success: {
      status: 200,
      description: "اعلان",
      schema: successEnvelope("AnnouncementGetResponse", announcementSchema),
    },
  });

  r.route({
    method: "patch",
    path: "/announcements/{id}",
    tag: ANNOUNCEMENTS,
    operationId: "updateAnnouncement",
    summary: "ویرایش اعلان",
    access: requires("content:write", ["admin"]),
    params: idParamSchema,
    body: { schema: announcementUpdateSchema },
    success: {
      status: 200,
      description: "ویرایش شد",
      schema: successEnvelope("AnnouncementUpdateResponse", announcementSchema),
    },
  });

  r.route({
    method: "delete",
    path: "/announcements/{id}",
    tag: ANNOUNCEMENTS,
    operationId: "deleteAnnouncement",
    summary: "حذف اعلان",
    access: requires("content:delete", ["admin"]),
    params: idParamSchema,
    success: { status: 204, description: "حذف شد" },
  });

  /* ----- Staff finance (S5) ----- */

  r.route({
    method: "post",
    path: "/cases/{id}/payment-plan",
    tag: FINANCE,
    operationId: "createCasePaymentPlan",
    summary: "تعریف برنامه پرداخت پرونده",
    access: requires("payment:manage", ["admin"]),
    params: idParamSchema,
    body: { schema: paymentPlanCreateSchema },
    success: {
      status: 201,
      description: "برنامه ثبت شد",
      schema: successEnvelope("PaymentPlanResponse", paymentPlanSchema),
    },
    conflict: true,
  });

  r.route({
    method: "patch",
    path: "/installments/{id}",
    tag: FINANCE,
    operationId: "updateInstallment",
    summary: "ویرایش قسط",
    access: requires("payment:manage", ["admin"]),
    params: idParamSchema,
    body: { schema: installmentUpdateSchema },
    success: {
      status: 200,
      description: "قسط ویرایش شد",
      schema: successEnvelope("InstallmentUpdateResponse", installmentSchema),
    },
    conflict: true,
  });

  r.route({
    method: "post",
    path: "/installments/{id}/cancel",
    tag: FINANCE,
    operationId: "cancelInstallment",
    summary: "لغو قسط با دلیل",
    description: "قسط پرداخت‌شده قابل لغو نیست → CONFLICT. Activity + Audit ثبت می‌شود.",
    access: requires("payment:manage", ["admin"]),
    params: idParamSchema,
    body: { schema: installmentCancelSchema },
    success: {
      status: 200,
      description: "قسط لغو شد",
      schema: successEnvelope("InstallmentCancelResponse", installmentSchema),
    },
    conflict: true,
  });

  r.route({
    method: "post",
    path: "/payments/{id}/verify",
    tag: FINANCE,
    operationId: "verifyPaymentAttempt",
    summary: "تأیید یا رد پرداخت کارت‌به‌کارت",
    description:
      "رد با note الزامی است؛ دانشجو اعلان و پیام دریافت می‌کند. تأیید → قسط paid.",
    access: requires("payment:manage", ["admin"]),
    params: idParamSchema,
    body: { schema: paymentVerifyStaffSchema },
    success: {
      status: 200,
      description: "نتیجه بررسی",
      schema: successEnvelope(
        "PaymentAttemptVerifyResponse",
        paymentAttemptSchema,
      ),
    },
    conflict: true,
  });

  r.route({
    method: "get",
    path: "/finance/summary",
    tag: FINANCE,
    operationId: "getFinanceSummary",
    summary: "خلاصه مالی",
    description:
      "مشاور فقط پرونده‌های اختصاص‌یافته؛ admin همه. مجوز `payment:read` (معادل finance:read).",
    access: requires("payment:read", STAFF_ROLES),
    success: {
      status: 200,
      description: "خلاصه",
      schema: successEnvelope("FinanceSummaryResponse", financeSummarySchema),
    },
  });

  r.route({
    method: "get",
    path: "/finance/transactions",
    tag: FINANCE,
    operationId: "listFinanceTransactions",
    summary: "فهرست تراکنش‌های مالی",
    description: "فیلتر روش/وضعیت/بازه/دانشجو. مشاور فقط دانشجویان خود.",
    access: requires("payment:read", STAFF_ROLES),
    query: financeTransactionListQuerySchema,
    success: {
      status: 200,
      description: "تراکنش‌ها",
      schema: paginatedEnvelope(
        "FinanceTransactionsPage",
        financeTransactionSchema,
      ),
    },
  });

  r.route({
    method: "get",
    path: "/finance/report",
    tag: FINANCE,
    operationId: "getFinanceReport",
    summary: "گزارش مالی ساده",
    description:
      "درآمد دریافتی بازه، معوقات، پیش‌بینی ۳۰ روز. مشاور فقط پرونده‌های خود.",
    access: requires("payment:read", STAFF_ROLES),
    query: financeReportQuerySchema,
    success: {
      status: 200,
      description: "گزارش",
      schema: successEnvelope("FinanceReportResponse", financeReportSchema),
    },
  });

  r.route({
    method: "get",
    path: "/finance/report.csv",
    tag: FINANCE,
    operationId: "exportFinanceReportCsv",
    summary: "خروجی CSV گزارش مالی",
    description: "هر export یک Audit با action=export ثبت می‌کند.",
    access: requires("payment:read", STAFF_ROLES),
    query: financeReportQuerySchema,
    success: {
      status: 200,
      description: "CSV",
      schema: successEnvelope(
        "FinanceReportCsvResponse",
        z.object({ csv: z.string(), filename: z.string() }),
      ),
    },
  });

  r.route({
    method: "post",
    path: "/finance/process-installment-reminders",
    tag: FINANCE,
    operationId: "processInstallmentReminders",
    summary: "یادآوری سررسید اقساط (mock)",
    description:
      "فقط mock/local: برای اقساط باز ۳ و ۱ روز قبل از dueDate اعلان installment_due می‌سازد (الگوی C5).",
    access: requires("payment:manage", ["admin"]),
    success: {
      status: 200,
      description: "تعداد اعلان‌های ساخته‌شده",
      schema: successEnvelope(
        "InstallmentRemindersResponse",
        installmentRemindersResultSchema,
      ),
    },
  });

  /* ----- Privacy & Data Requests ----- */

  r.route({
    method: "get",
    path: "/me/privacy-requests",
    tag: PANEL,
    operationId: "listMyPrivacyRequests",
    summary: "درخواست‌های حریم خصوصی من",
    access: requires("student:read", STUDENT_ONLY),
    success: {
      status: 200,
      description: "فهرست درخواست‌ها",
      schema: successEnvelope(
        "MyPrivacyRequestsResponse",
        z.array(privacyRequestSchema),
      ),
    },
  });

  r.route({
    method: "post",
    path: "/me/privacy-requests",
    tag: PANEL,
    operationId: "createMyPrivacyRequest",
    summary: "ثبت درخواست خروجی داده یا حذف حساب",
    access: requires("student:write", STUDENT_ONLY),
    body: { schema: privacyRequestCreateSchema },
    success: {
      status: 201,
      description: "درخواست ثبت شد",
      schema: successEnvelope("PrivacyRequestResponse", privacyRequestSchema),
    },
  });

  r.route({
    method: "get",
    path: "/me/export-data",
    tag: PANEL,
    operationId: "getMyExportData",
    summary: "دریافت نسخه داده‌های من (JSON)",
    access: requires("student:read", STUDENT_ONLY),
    success: {
      status: 200,
      description: "داده‌های کامل دانشجو",
      schema: successEnvelope(
        "MyExportDataResponse",
        z.object({
          exportedAt: z.string(),
          profile: studentProfileSchema,
          data: z.record(z.unknown()),
        }),
      ),
    },
  });

  r.route({
    method: "get",
    path: "/admin/privacy-requests",
    tag: ADMIN,
    operationId: "listPrivacyRequests",
    summary: "مدیریت درخواست‌های حریم خصوصی و داده‌ها",
    access: requires("user:manage", ["admin"]),
    query: privacyRequestListQuerySchema,
    success: {
      status: 200,
      description: "فهرست درخواست‌ها",
      schema: paginatedEnvelope("PrivacyRequestsPage", privacyRequestSchema),
    },
  });

  r.route({
    method: "post",
    path: "/admin/privacy-requests/{id}/process",
    tag: ADMIN,
    operationId: "processPrivacyRequest",
    summary: "بررسی و پردازش درخواست حریم خصوصی",
    access: requires("user:manage", ["admin"]),
    params: idParamSchema,
    body: { schema: privacyRequestProcessSchema },
    success: {
      status: 200,
      description: "درخواست پردازش شد",
      schema: successEnvelope(
        "PrivacyRequestProcessResponse",
        privacyRequestSchema,
      ),
    },
  });
}
