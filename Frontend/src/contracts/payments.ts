import {
  auditFields,
  idSchema,
  isoDateSchema,
  isoDateTimeSchema,
  listQuerySchema,
  rialsSchema,
} from "./common";
import { z } from "./zod";

/**
 * Invoice-level payment status.
 * Installments use `installmentStatusSchema` (no partially_paid / refunded).
 */
export const PAYMENT_STATUSES = [
  "pending",
  "partially_paid",
  "paid",
  "overdue",
  "cancelled",
  "refunded",
] as const;
export const paymentStatusSchema = z
  .enum(PAYMENT_STATUSES)
  .openapi("PaymentStatus");
export type PaymentStatus = z.infer<typeof paymentStatusSchema>;

export const INSTALLMENT_STATUSES = [
  "pending",
  "paid",
  "overdue",
  "awaiting_verification",
  "cancelled",
] as const;
export const installmentStatusSchema = z
  .enum(INSTALLMENT_STATUSES)
  .openapi("InstallmentStatus");
export type InstallmentStatus = z.infer<typeof installmentStatusSchema>;

/** Stored payment method on an installment after success / mark-paid */
export const PAYMENT_METHODS = [
  "gateway",
  "card_to_card",
  "bank_transfer",
  "cash",
] as const;
export const paymentMethodSchema = z
  .enum(PAYMENT_METHODS)
  .openapi("PaymentMethod");
export type PaymentMethod = z.infer<typeof paymentMethodSchema>;

export const PAYMENT_ATTEMPT_METHODS = [
  "gateway",
  "card_to_card",
  "cash",
] as const;
export const paymentAttemptMethodSchema = z
  .enum(PAYMENT_ATTEMPT_METHODS)
  .openapi("PaymentAttemptMethod");
export type PaymentAttemptMethod = z.infer<typeof paymentAttemptMethodSchema>;

export const PAYMENT_ATTEMPT_STATUSES = [
  "initiated",
  "succeeded",
  "failed",
  "cancelled",
  "awaiting_verification",
] as const;
export const paymentAttemptStatusSchema = z
  .enum(PAYMENT_ATTEMPT_STATUSES)
  .openapi("PaymentAttemptStatus");
export type PaymentAttemptStatus = z.infer<typeof paymentAttemptStatusSchema>;

/* -------------------------------------------------------------------------- */
/*  Installment                                                               */
/* -------------------------------------------------------------------------- */

export const installmentSchema = z
  .object({
    id: idSchema,
    invoiceId: idSchema.nullable().optional(),
    paymentPlanId: idSchema.nullable().optional(),
    sequence: z.number().int().min(1).describe("شماره قسط (از ۱)"),
    title: z.string().min(1).max(120).default("قسط"),
    amount: rialsSchema,
    dueDate: isoDateSchema,
    status: installmentStatusSchema,
    paidAt: isoDateTimeSchema.nullable(),
    paymentMethod: paymentMethodSchema.nullable(),
    paymentRef: z
      .string()
      .max(120)
      .nullable()
      .describe("شناسه پیگیری / ref تراکنش"),
    ...auditFields,
  })
  .openapi("Installment");
export type Installment = z.infer<typeof installmentSchema>;

export const installmentInputSchema = z
  .object({
    title: z.string().trim().min(1).max(120).optional(),
    amount: rialsSchema.refine(
      (value) => value > 0,
      "مبلغ قسط باید بیشتر از صفر باشد",
    ),
    dueDate: isoDateSchema,
  })
  .openapi("InstallmentInput");
export type InstallmentInput = z.infer<typeof installmentInputSchema>;

export const installmentPlanSchema = z
  .object({
    installments: z.array(installmentInputSchema).min(1).max(24),
  })
  .openapi("InstallmentPlan");
export type InstallmentPlan = z.infer<typeof installmentPlanSchema>;

export const installmentUpdateSchema = z
  .object({
    title: z.string().trim().min(1).max(120),
    amount: rialsSchema,
    dueDate: isoDateSchema,
    status: installmentStatusSchema,
  })
  .partial()
  .openapi("InstallmentUpdate");
export type InstallmentUpdate = z.infer<typeof installmentUpdateSchema>;

/** Legacy online pay (kept for staff paths that still use authority verify) */
export const installmentPaySchema = z
  .object({
    callbackUrl: z.string().url().describe("آدرس بازگشت از درگاه"),
  })
  .openapi("InstallmentPay");
export type InstallmentPay = z.infer<typeof installmentPaySchema>;

export const studentInstallmentPaySchema = z
  .object({
    method: paymentAttemptMethodSchema,
    callbackUrl: z
      .string()
      .url()
      .optional()
      .describe("برای method=gateway؛ آدرس بازگشت پنل"),
    receiptFileId: idSchema
      .optional()
      .describe("برای method=card_to_card؛ رسید آپلودشده"),
  })
  .superRefine((data, ctx) => {
    if (data.method === "gateway" && !data.callbackUrl) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["callbackUrl"],
        message: "آدرس بازگشت از درگاه الزامی است",
      });
    }
    if (data.method === "card_to_card" && !data.receiptFileId) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["receiptFileId"],
        message: "فایل رسید کارت‌به‌کارت الزامی است",
      });
    }
  })
  .openapi("StudentInstallmentPay");
export type StudentInstallmentPay = z.infer<typeof studentInstallmentPaySchema>;

export const paymentIntentSchema = z
  .object({
    authority: z.string().describe("شناسه تراکنش درگاه"),
    paymentUrl: z.string().url().describe("آدرس هدایت کاربر به درگاه"),
    expiresAt: isoDateTimeSchema,
  })
  .openapi("PaymentIntent");
export type PaymentIntent = z.infer<typeof paymentIntentSchema>;

export const studentPayResultSchema = z
  .object({
    paymentId: idSchema,
    status: paymentAttemptStatusSchema,
    gatewayUrl: z.string().url().nullable(),
  })
  .openapi("StudentPayResult");
export type StudentPayResult = z.infer<typeof studentPayResultSchema>;

export const paymentVerifySchema = z
  .object({
    authority: z.string().min(1),
    gatewayStatus: z.enum(["OK", "NOK"]),
  })
  .openapi("PaymentVerify");
export type PaymentVerify = z.infer<typeof paymentVerifySchema>;

/** Mock-gateway callback is display-only; final status comes from GET /me/payments/{id} */
export const mockGatewayResolveSchema = z
  .object({
    outcome: z.enum(["success", "fail", "cancel"]),
  })
  .openapi("MockGatewayResolve");
export type MockGatewayResolve = z.infer<typeof mockGatewayResolveSchema>;

export const installmentMarkPaidSchema = z
  .object({
    paymentMethod: z.enum(["card_to_card", "bank_transfer", "cash"]),
    paymentRef: z.string().trim().min(1).max(120).optional(),
    paidAt: isoDateTimeSchema.optional(),
  })
  .openapi("InstallmentMarkPaid");
export type InstallmentMarkPaid = z.infer<typeof installmentMarkPaidSchema>;

export const paymentVerifyStaffSchema = z
  .object({
    decision: z.enum(["approve", "reject"]),
    note: z.string().trim().max(500).optional(),
  })
  .superRefine((data, ctx) => {
    if (data.decision === "reject" && !data.note?.trim()) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["note"],
        message: "دلیل رد الزامی است",
      });
    }
  })
  .openapi("PaymentVerifyStaff");
export type PaymentVerifyStaff = z.infer<typeof paymentVerifyStaffSchema>;

export const installmentCancelSchema = z
  .object({
    reason: z.string().trim().min(3).max(500),
  })
  .openapi("InstallmentCancel");
export type InstallmentCancel = z.infer<typeof installmentCancelSchema>;

/* -------------------------------------------------------------------------- */
/*  Payment attempt                                                           */
/* -------------------------------------------------------------------------- */

export const paymentAttemptSchema = z
  .object({
    id: idSchema,
    installmentId: idSchema,
    caseId: idSchema,
    studentId: idSchema,
    method: paymentAttemptMethodSchema,
    status: paymentAttemptStatusSchema,
    gatewayRef: z.string().max(120).nullable(),
    receiptFileId: idSchema.nullable(),
    amount: rialsSchema,
    createdAt: isoDateTimeSchema,
    updatedAt: isoDateTimeSchema,
  })
  .openapi("PaymentAttempt");
export type PaymentAttempt = z.infer<typeof paymentAttemptSchema>;

/* -------------------------------------------------------------------------- */
/*  Payment plan (case-level)                                                 */
/* -------------------------------------------------------------------------- */

export const paymentPlanSchema = z
  .object({
    id: idSchema,
    caseId: idSchema,
    total: rialsSchema,
    installments: z.array(installmentSchema),
    ...auditFields,
  })
  .openapi("PaymentPlan");
export type PaymentPlan = z.infer<typeof paymentPlanSchema>;

export const paymentPlanCreateSchema = z
  .object({
    total: rialsSchema.refine((v) => v > 0, "مبلغ کل باید بیشتر از صفر باشد"),
    installments: z.array(installmentInputSchema).min(1).max(24),
    /** اختیاری: صدور فاکتور هم‌زمان */
    invoiceTitle: z.string().trim().min(1).max(160).optional(),
  })
  .refine(
    (data) =>
      data.installments.reduce((sum, item) => sum + item.amount, 0) ===
      data.total,
    { path: ["installments"], message: "مجموع اقساط باید برابر مبلغ کل باشد" },
  )
  .openapi("PaymentPlanCreate");
export type PaymentPlanCreate = z.infer<typeof paymentPlanCreateSchema>;

/* -------------------------------------------------------------------------- */
/*  Invoice                                                                   */
/* -------------------------------------------------------------------------- */

export const invoiceItemSchema = z
  .object({
    title: z.string().min(1).max(160),
    quantity: z.number().int().min(1),
    unitAmount: rialsSchema,
    amount: rialsSchema.describe("quantity × unitAmount"),
  })
  .openapi("InvoiceItem");
export type InvoiceItem = z.infer<typeof invoiceItemSchema>;

export const invoiceItemInputSchema = invoiceItemSchema
  .omit({ amount: true })
  .openapi("InvoiceItemInput");

export const invoiceSchema = z
  .object({
    id: idSchema,
    number: z.string().openapi({ example: "INV-1405-00123" }),
    caseId: idSchema,
    studentId: idSchema,
    title: z.string().min(1).max(160),
    description: z.string().max(1000).nullable(),
    currency: z.literal("IRR"),
    items: z.array(invoiceItemSchema).min(1),
    subtotal: rialsSchema,
    discount: rialsSchema,
    tax: rialsSchema,
    total: rialsSchema.describe("subtotal − discount + tax"),
    paidAmount: rialsSchema,
    status: paymentStatusSchema,
    issuedAt: isoDateTimeSchema,
    dueDate: isoDateSchema.nullable(),
    paidAt: isoDateTimeSchema.nullable(),
    installments: z.array(installmentSchema),
    ...auditFields,
  })
  .openapi("Invoice");
export type Invoice = z.infer<typeof invoiceSchema>;

export const invoiceCreateSchema = z
  .object({
    caseId: idSchema,
    title: z.string().trim().min(1).max(160),
    description: z.string().trim().max(1000).optional(),
    items: z.array(invoiceItemInputSchema).min(1).max(50),
    discount: rialsSchema.default(0),
    tax: rialsSchema.default(0),
    dueDate: isoDateSchema.optional(),
    installments: z
      .array(installmentInputSchema)
      .max(24)
      .optional()
      .describe("مجموع اقساط باید برابر total باشد"),
  })
  .openapi("InvoiceCreate");
export type InvoiceCreate = z.infer<typeof invoiceCreateSchema>;

export const invoiceCancelSchema = z
  .object({ reason: z.string().trim().min(3).max(500) })
  .openapi("InvoiceCancel");
export type InvoiceCancel = z.infer<typeof invoiceCancelSchema>;

export const INVOICE_SORT_FIELDS = ["issuedAt", "dueDate", "total"] as const;
export const invoiceListQuerySchema = listQuerySchema(INVOICE_SORT_FIELDS, {
  status: paymentStatusSchema.optional(),
  caseId: idSchema.optional(),
  studentId: idSchema.optional(),
  dueFrom: isoDateSchema.optional(),
  dueTo: isoDateSchema.optional(),
});
export type InvoiceListQuery = z.infer<typeof invoiceListQuerySchema>;

export const installmentListQuerySchema = listQuerySchema(
  ["dueDate", "createdAt"],
  {
    status: installmentStatusSchema.optional(),
    invoiceId: idSchema.optional(),
    paymentPlanId: idSchema.optional(),
    dueTo: isoDateSchema.optional(),
  },
);
export type InstallmentListQuery = z.infer<typeof installmentListQuerySchema>;

/* -------------------------------------------------------------------------- */
/*  Staff finance                                                             */
/* -------------------------------------------------------------------------- */

export const financeSummarySchema = z
  .object({
    totalInvoiced: rialsSchema,
    totalPaid: rialsSchema,
    totalOverdue: rialsSchema,
    awaitingVerificationCount: z.number().int().min(0),
    openInstallmentCount: z.number().int().min(0),
  })
  .openapi("FinanceSummary");
export type FinanceSummary = z.infer<typeof financeSummarySchema>;

export const financeTransactionSchema = z
  .object({
    id: idSchema,
    code: z.string().max(40).describe("کد نمایشی تراکنش"),
    kind: z.enum(["payment_attempt", "installment_mark"]),
    caseId: idSchema,
    studentId: idSchema,
    studentName: z.string().max(120),
    installmentId: idSchema.nullable(),
    installmentTitle: z.string().max(120).nullable(),
    amount: rialsSchema,
    method: paymentMethodSchema.nullable(),
    status: z.string(),
    occurredAt: isoDateTimeSchema,
    ref: z.string().nullable(),
    receiptFileId: idSchema.nullable().optional(),
  })
  .openapi("FinanceTransaction");
export type FinanceTransaction = z.infer<typeof financeTransactionSchema>;

export const financeTransactionListQuerySchema = listQuerySchema(
  ["occurredAt", "amount"],
  {
    caseId: idSchema.optional(),
    studentId: idSchema.optional(),
    method: paymentMethodSchema.optional(),
    status: z.string().trim().min(1).max(40).optional(),
    from: isoDateSchema.optional(),
    to: isoDateSchema.optional(),
    awaitingVerification: z.coerce.boolean().optional(),
  },
);
export type FinanceTransactionListQuery = z.infer<
  typeof financeTransactionListQuerySchema
>;

export const financeReportQuerySchema = z
  .object({
    from: isoDateSchema,
    to: isoDateSchema,
  })
  .openapi("FinanceReportQuery");
export type FinanceReportQuery = z.infer<typeof financeReportQuerySchema>;

export const financeOverdueItemSchema = z
  .object({
    installmentId: idSchema,
    caseId: idSchema,
    studentId: idSchema,
    studentName: z.string().max(120),
    title: z.string().max(120),
    amount: rialsSchema,
    dueDate: isoDateSchema,
  })
  .openapi("FinanceOverdueItem");
export type FinanceOverdueItem = z.infer<typeof financeOverdueItemSchema>;

export const financeForecastItemSchema = z
  .object({
    dueDate: isoDateSchema,
    amount: rialsSchema,
    count: z.number().int().min(0),
  })
  .openapi("FinanceForecastItem");
export type FinanceForecastItem = z.infer<typeof financeForecastItemSchema>;

export const financeReportSchema = z
  .object({
    from: isoDateSchema,
    to: isoDateSchema,
    receivedRevenue: rialsSchema,
    overdueTotal: rialsSchema,
    overdueItems: z.array(financeOverdueItemSchema),
    forecast30Days: z.array(financeForecastItemSchema),
    forecastTotal: rialsSchema,
  })
  .openapi("FinanceReport");
export type FinanceReport = z.infer<typeof financeReportSchema>;

export const installmentRemindersResultSchema = z
  .object({
    created: z.number().int().min(0),
  })
  .openapi("InstallmentRemindersResult");
export type InstallmentRemindersResult = z.infer<
  typeof installmentRemindersResultSchema
>;
