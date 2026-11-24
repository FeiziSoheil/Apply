import { idParamSchema, paginatedEnvelope, successEnvelope } from "../common";
import {
  installmentListQuerySchema,
  installmentMarkPaidSchema,
  installmentPaySchema,
  installmentPlanSchema,
  installmentSchema,
  invoiceCancelSchema,
  invoiceCreateSchema,
  invoiceListQuerySchema,
  invoiceSchema,
  paymentIntentSchema,
  paymentVerifySchema,
} from "../payments";
import { requires, type RouteRegistrar } from "./helpers";

const INVOICES = "Invoices";
const INSTALLMENTS = "Installments";
const OWNERSHIP = "دانشجو فقط موارد مربوط به خودش را می‌بیند؛ admin همه را.";

export function registerPaymentRoutes(r: RouteRegistrar): void {
  const invoiceResponse = successEnvelope("InvoiceResponse", invoiceSchema);
  const installmentResponse = successEnvelope(
    "InstallmentResponse",
    installmentSchema,
  );

  /* ----- Invoices ----- */

  r.route({
    method: "get",
    path: "/invoices",
    tag: INVOICES,
    operationId: "listInvoices",
    summary: "فهرست فاکتورها",
    description: OWNERSHIP,
    access: requires("payment:read"),
    query: invoiceListQuerySchema,
    success: {
      status: 200,
      description: "فهرست صفحه‌بندی‌شده فاکتورها",
      schema: paginatedEnvelope("InvoicesPage", invoiceSchema),
    },
  });

  r.route({
    method: "post",
    path: "/invoices",
    tag: INVOICES,
    operationId: "createInvoice",
    summary: "صدور فاکتور",
    description:
      "مبالغ همگی ریال (عدد صحیح) هستند. اگر `installments` ارسال شود، مجموع آن باید دقیقاً برابر `total` باشد.",
    access: requires("payment:manage"),
    body: { schema: invoiceCreateSchema },
    success: { status: 201, description: "فاکتور صادر شد", schema: invoiceResponse },
    conflict: true,
  });

  r.route({
    method: "get",
    path: "/invoices/{id}",
    tag: INVOICES,
    operationId: "getInvoice",
    summary: "دریافت فاکتور (همراه با اقساط)",
    description: OWNERSHIP,
    access: requires("payment:read"),
    params: idParamSchema,
    success: { status: 200, description: "فاکتور", schema: invoiceResponse },
  });

  r.route({
    method: "post",
    path: "/invoices/{id}/cancel",
    tag: INVOICES,
    operationId: "cancelInvoice",
    summary: "ابطال فاکتور",
    description: "فاکتور دارای پرداخت موفق قابل ابطال نیست → `CONFLICT`.",
    access: requires("payment:manage"),
    params: idParamSchema,
    body: { schema: invoiceCancelSchema },
    success: { status: 200, description: "فاکتور ابطال شد", schema: invoiceResponse },
    conflict: true,
  });

  r.route({
    method: "put",
    path: "/invoices/{id}/installments",
    tag: INVOICES,
    operationId: "replaceInvoiceInstallments",
    summary: "تعریف / جایگزینی برنامه اقساط",
    description:
      "همه اقساط پرداخت‌نشده را جایگزین می‌کند. مجموع اقساط (به‌علاوه پرداخت‌شده‌ها) باید برابر `total` باشد.",
    access: requires("payment:manage"),
    params: idParamSchema,
    body: { schema: installmentPlanSchema },
    success: { status: 200, description: "برنامه اقساط ثبت شد", schema: invoiceResponse },
    conflict: true,
  });

  /* ----- Installments ----- */

  r.route({
    method: "get",
    path: "/installments",
    tag: INSTALLMENTS,
    operationId: "listInstallments",
    summary: "فهرست اقساط",
    description: OWNERSHIP,
    access: requires("payment:read"),
    query: installmentListQuerySchema,
    success: {
      status: 200,
      description: "فهرست صفحه‌بندی‌شده اقساط",
      schema: paginatedEnvelope("InstallmentsPage", installmentSchema),
    },
  });

  r.route({
    method: "get",
    path: "/installments/{id}",
    tag: INSTALLMENTS,
    operationId: "getInstallment",
    summary: "دریافت قسط",
    description: OWNERSHIP,
    access: requires("payment:read"),
    params: idParamSchema,
    success: { status: 200, description: "قسط", schema: installmentResponse },
  });

  r.route({
    method: "post",
    path: "/installments/{id}/pay",
    tag: INSTALLMENTS,
    operationId: "payInstallment",
    summary: "شروع پرداخت آنلاین قسط",
    description: "کاربر باید به `paymentUrl` هدایت شود. قسط پرداخت‌شده یا لغوشده → `CONFLICT`.",
    access: requires("payment:write", ["student"]),
    params: idParamSchema,
    body: { schema: installmentPaySchema },
    success: {
      status: 201,
      description: "تراکنش ایجاد شد",
      schema: successEnvelope("PaymentIntentResponse", paymentIntentSchema),
    },
    conflict: true,
  });

  r.route({
    method: "post",
    path: "/installments/{id}/mark-paid",
    tag: INSTALLMENTS,
    operationId: "markInstallmentPaid",
    summary: "ثبت دستی پرداخت قسط (کارت‌به‌کارت / حواله / نقدی)",
    access: requires("payment:manage"),
    params: idParamSchema,
    body: { schema: installmentMarkPaidSchema },
    success: { status: 200, description: "قسط پرداخت‌شده ثبت شد", schema: installmentResponse },
    conflict: true,
  });

  r.route({
    method: "post",
    path: "/payments/verify",
    tag: INSTALLMENTS,
    operationId: "verifyPayment",
    summary: "تأیید پرداخت پس از بازگشت از درگاه",
    description: "idempotent است؛ فراخوانی مجدد با همان `authority` همان نتیجه را برمی‌گرداند.",
    access: requires("payment:write", ["student"]),
    body: { schema: paymentVerifySchema },
    success: { status: 200, description: "نتیجه تأیید", schema: installmentResponse },
    conflict: true,
  });
}
