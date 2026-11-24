import {
  OpenAPIRegistry,
  OpenApiGeneratorV31,
} from "@asteasolutions/zod-to-openapi";
import { SESSION_COOKIE_NAME, SESSION_SECURITY_SCHEME } from "./session";
import { registerAuthRoutes } from "./routes/auth";
import { registerAvailabilityRoutes } from "./routes/availability";
import { registerBookingRoutes } from "./routes/bookings";
import { registerContentRoutes } from "./routes/content";
import {
  RouteRegistrar,
  type EndpointPolicy,
  type RouteSpec,
} from "./routes/helpers";
import { registerCrmRoutes } from "./routes/crm";
import { registerLeadRoutes } from "./routes/leads";
import { registerPaymentRoutes } from "./routes/payments";
import { registerSettingsRoutes } from "./routes/settings";
import { registerStatsRoutes } from "./routes/stats";
import { registerStudentRoutes } from "./routes/students";
import { registerStudentPanelRoutes } from "./routes/student-panel";
import { registerTicketRoutes } from "./routes/tickets";
import { registerUserRoutes } from "./routes/users";

export const API_BASE_PATH = "/api/v1";

export const registry = new OpenAPIRegistry();

// The ONLY public security scheme: an httpOnly session cookie set by the
// backend. There is deliberately no Bearer scheme — the frontend mock API
// uses an in-memory Bearer token internally, but that is not part of the
// contract (see docs/mocking.md).
registry.registerComponent("securitySchemes", SESSION_SECURITY_SCHEME, {
  type: "apiKey",
  in: "cookie",
  name: SESSION_COOKIE_NAME,
  description:
    "کوکی httpOnly با نام `session` که بک‌اند هنگام ورود (`POST /auth/otp/verify` یا `POST /auth/login`) با `Set-Cookie` تنظیم و هنگام خروج پاک می‌کند. کلاینت فقط با `credentials: include` آن را ارسال می‌کند و هرگز مقدارش را نمی‌خواند یا در JS ذخیره نمی‌کند. هدر `Authorization` پذیرفته نمی‌شود.",
});

const registrar = new RouteRegistrar(registry);

registerAuthRoutes(registrar);
registerUserRoutes(registrar);
registerSettingsRoutes(registrar);
registerContentRoutes(registrar);
registerLeadRoutes(registrar);
registerCrmRoutes(registrar);
registerAvailabilityRoutes(registrar);
registerBookingRoutes(registrar);
registerStudentRoutes(registrar);
registerStudentPanelRoutes(registrar);
registerTicketRoutes(registrar);
registerPaymentRoutes(registrar);
registerStatsRoutes(registrar);

/** Auth requirement + allowed roles of every endpoint (backend reference) */
export const endpointPolicies: readonly EndpointPolicy[] = registrar.policies;

/** Every route spec (path, schemas, access) — the mock API derives its handlers from it */
export const endpointSpecs: readonly RouteSpec[] = registrar.specs;

const TAGS: readonly { name: string; description: string }[] = [
  { name: "Auth", description: "احراز هویت و کاربر جاری" },
  { name: "Users", description: "مدیریت کاربران کارمند و نشست‌های حساب" },
  { name: "Settings", description: "تنظیمات موسسه (اطلاعات، تماس، SEO، پیامک)" },
  { name: "Countries", description: "کشورهای مقصد" },
  { name: "Universities", description: "دانشگاه‌ها" },
  { name: "Programs", description: "برنامه‌های تحصیلی" },
  { name: "Services", description: "خدمات موسسه" },
  { name: "Consultants", description: "مشاوران" },
  { name: "Success stories", description: "داستان‌های موفقیت" },
  { name: "Blog", description: "مقاله‌های وبلاگ" },
  { name: "News", description: "اخبار و رویدادها" },
  { name: "FAQ", description: "پرسش‌های متداول" },
  { name: "Leads", description: "سرنخ‌ها، پایپ‌لاین فروش و فعالیت‌ها" },
  { name: "CRM", description: "نماهای ذخیره‌شده و ابزارهای مشترک CRM" },
  { name: "CRM Settings", description: "پایپ‌لاین، تگ، دلیل ریزش، قوانین تخصیص، قالب‌ها" },
  { name: "Tasks", description: "کارها و یادآورها" },
  { name: "Notifications", description: "اعلان‌های کاربر جاری" },
  { name: "Audit", description: "گزارش حسابرسی (فقط admin)" },
  { name: "Reports", description: "گزارش‌های قیف، مشاور، منبع و سری زمانی" },
  { name: "Availability", description: "ساعات کاری مشاوران و تعطیلات سراسری" },
  { name: "Bookings", description: "رزرو وقت مشاوره" },
  { name: "Cases", description: "پرونده‌های دانشجویی و مراحل" },
  { name: "Documents", description: "مدارک پرونده" },
  { name: "Checklist", description: "چک‌لیست مدارک و اقدامات" },
  { name: "Files", description: "آپلود فایل" },
  { name: "Tickets", description: "تیکت‌های پشتیبانی" },
  { name: "Invoices", description: "فاکتورها" },
  { name: "Installments", description: "اقساط و پرداخت" },
  { name: "Student panel", description: "نمای دانشجو، شورت‌لیست، اعلان‌ها و پرداخت پنل" },
  { name: "Announcements", description: "اعلان‌های موسسه (CMS)" },
  { name: "Finance", description: "خلاصه و تراکنش‌های مالی کارکنان" },
  { name: "Stats", description: "آمار داشبورد مدیریت و مشاوران" },
];

/** Build the OpenAPI 3.1 document from the registry */
export function buildOpenApiDocument(): ReturnType<
  OpenApiGeneratorV31["generateDocument"]
> {
  return new OpenApiGeneratorV31(registry.definitions).generateDocument({
    openapi: "3.1.0",
    info: {
      title: "Apply — Student Agency API",
      version: "1.0.0",
      description:
        "قرارداد API موسسه اعزام دانشجو. منبع حقیقت: schemaهای Zod در `src/contracts`. قراردادها در `docs/api-conventions.md` توضیح داده شده‌اند.",
    },
    servers: [{ url: API_BASE_PATH, description: "نسخه ۱" }],
    tags: [...TAGS],
  });
}
