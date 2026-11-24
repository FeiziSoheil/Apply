import {
  instituteContactSchema,
  instituteInfoSchema,
  instituteLicensesSchema,
  instituteSeoSchema,
  instituteSettingsSchema,
  instituteSocialSchema,
  licenseBadgeSchema,
  paymentAccountSettingsSchema,
  smsTemplateSchema,
  smsTemplatesReplaceSchema,
} from "../settings";
import { successEnvelope } from "../common";
import { z } from "../zod";
import { requires, type RouteRegistrar } from "./helpers";

const TAG = "Settings";
const ADMIN_ONLY =
  "تنظیمات موسسه؛ فقط admin با مجوز `user:manage`. هر بخش جداگانه ذخیره می‌شود.";

export function registerSettingsRoutes(r: RouteRegistrar): void {
  const settingsResponse = successEnvelope(
    "InstituteSettingsResponse",
    instituteSettingsSchema,
  );
  const infoResponse = successEnvelope("InstituteInfoResponse", instituteInfoSchema);
  const contactResponse = successEnvelope(
    "InstituteContactResponse",
    instituteContactSchema,
  );
  const socialResponse = successEnvelope(
    "InstituteSocialResponse",
    instituteSocialSchema,
  );
  const licensesResponse = successEnvelope(
    "InstituteLicensesResponse",
    z.array(licenseBadgeSchema),
  );
  const seoResponse = successEnvelope("InstituteSeoResponse", instituteSeoSchema);
  const smsResponse = successEnvelope(
    "SmsTemplatesResponse",
    z.array(smsTemplateSchema),
  );

  r.route({
    method: "get",
    path: "/settings/institute",
    tag: TAG,
    operationId: "getInstituteSettings",
    summary: "دریافت تنظیمات موسسه",
    description: ADMIN_ONLY,
    access: requires("user:manage", ["admin"]),
    success: {
      status: 200,
      description: "تنظیمات کامل",
      schema: settingsResponse,
    },
  });

  r.route({
    method: "put",
    path: "/settings/institute/info",
    tag: TAG,
    operationId: "updateInstituteInfo",
    summary: "ذخیره اطلاعات موسسه",
    description: ADMIN_ONLY,
    access: requires("user:manage", ["admin"]),
    body: { schema: instituteInfoSchema },
    success: {
      status: 200,
      description: "اطلاعات ذخیره شد",
      schema: infoResponse,
    },
  });

  r.route({
    method: "put",
    path: "/settings/institute/contact",
    tag: TAG,
    operationId: "updateInstituteContact",
    summary: "ذخیره اطلاعات تماس",
    description: ADMIN_ONLY,
    access: requires("user:manage", ["admin"]),
    body: { schema: instituteContactSchema },
    success: {
      status: 200,
      description: "تماس ذخیره شد",
      schema: contactResponse,
    },
  });

  r.route({
    method: "put",
    path: "/settings/institute/social",
    tag: TAG,
    operationId: "updateInstituteSocial",
    summary: "ذخیره شبکه‌های اجتماعی و پیام‌رسان‌ها",
    description: ADMIN_ONLY,
    access: requires("user:manage", ["admin"]),
    body: { schema: instituteSocialSchema },
    success: {
      status: 200,
      description: "شبکه‌ها ذخیره شد",
      schema: socialResponse,
    },
  });

  r.route({
    method: "put",
    path: "/settings/institute/licenses",
    tag: TAG,
    operationId: "updateInstituteLicenses",
    summary: "ذخیره مجوزها و نشان‌ها",
    description: `${ADMIN_ONLY} تصاویر فقط با \`imageFileId\` (آپلود از \`POST /files\`).`,
    access: requires("user:manage", ["admin"]),
    body: { schema: instituteLicensesSchema },
    success: {
      status: 200,
      description: "مجوزها ذخیره شد",
      schema: licensesResponse,
    },
  });

  r.route({
    method: "put",
    path: "/settings/institute/seo",
    tag: TAG,
    operationId: "updateInstituteSeo",
    summary: "ذخیره SEO پیش‌فرض",
    description: ADMIN_ONLY,
    access: requires("user:manage", ["admin"]),
    body: { schema: instituteSeoSchema },
    success: {
      status: 200,
      description: "SEO ذخیره شد",
      schema: seoResponse,
    },
  });

  r.route({
    method: "put",
    path: "/settings/institute/sms-templates",
    tag: TAG,
    operationId: "updateInstituteSmsTemplates",
    summary: "ذخیره قالب‌های پیامک",
    description:
      `${ADMIN_ONLY} فقط \`body\` هر قالب به‌روز می‌شود؛ \`label\` و \`variables\` سرور‌مدیریت‌شده‌اند. متغیرها مثل \`{name}\` و \`{date}\`.`,
    access: requires("user:manage", ["admin"]),
    body: { schema: smsTemplatesReplaceSchema },
    success: {
      status: 200,
      description: "قالب‌ها ذخیره شد",
      schema: smsResponse,
    },
  });

  r.route({
    method: "put",
    path: "/settings/institute/payment-account",
    tag: TAG,
    operationId: "updateInstitutePaymentAccount",
    summary: "ذخیره حساب کارت‌به‌کارت",
    description: `${ADMIN_ONLY} شماره کارت ۱۶ رقم انگلیسی؛ دانشجو از GET /me/payment-account می‌خواند.`,
    access: requires("user:manage", ["admin"]),
    body: { schema: paymentAccountSettingsSchema },
    success: {
      status: 200,
      description: "حساب ذخیره شد",
      schema: successEnvelope(
        "PaymentAccountSettingsResponse",
        paymentAccountSettingsSchema,
      ),
    },
  });
}
