import { roleSchema } from "./auth";
import {
  auditFields,
  idSchema,
  isoDateTimeSchema,
  listQuerySchema,
  queryBooleanSchema,
} from "./common";
import { z } from "./zod";

export const TICKET_CATEGORIES = [
  "documents",
  "payment",
  "visa",
  "apply",
  "technical",
  "other",
] as const;
export const ticketCategorySchema = z
  .enum(TICKET_CATEGORIES)
  .openapi("TicketCategory");
export type TicketCategory = z.infer<typeof ticketCategorySchema>;

export const TICKET_PRIORITIES = ["low", "normal", "high", "urgent"] as const;
export const ticketPrioritySchema = z
  .enum(TICKET_PRIORITIES)
  .openapi("TicketPriority");
export type TicketPriority = z.infer<typeof ticketPrioritySchema>;

/**
 * open — تازه ایجاد / فعال
 * waiting_staff — منتظر پاسخ کارکنان
 * waiting_student — منتظر پاسخ دانشجو
 * closed — بسته
 */
export const TICKET_STATUSES = [
  "open",
  "waiting_staff",
  "waiting_student",
  "closed",
] as const;
export const ticketStatusSchema = z
  .enum(TICKET_STATUSES)
  .openapi("TicketStatus");
export type TicketStatus = z.infer<typeof ticketStatusSchema>;

export const ticketAttachmentSchema = z
  .object({
    fileId: idSchema,
    url: z.string().url(),
    name: z.string(),
    size: z.number().int().min(0),
    mimeType: z.string(),
  })
  .openapi("TicketAttachment");
export type TicketAttachment = z.infer<typeof ticketAttachmentSchema>;

export const ticketSchema = z
  .object({
    id: idSchema,
    code: z.string().openapi({ example: "TK-10024" }),
    subject: z.string().min(1).max(160),
    category: ticketCategorySchema,
    priority: ticketPrioritySchema,
    status: ticketStatusSchema,
    createdBy: idSchema,
    createdByName: z.string(),
    assignedTo: idSchema.nullable().describe("شناسه کاربر کارمند (staff)"),
    /** Alias: relatedCaseId */
    caseId: idSchema.nullable(),
    relatedCaseId: idSchema
      .nullable()
      .optional()
      .describe("Alias of caseId برای قرارداد پنل دانشجو"),
    messageCount: z.number().int().min(0),
    lastMessageAt: isoDateTimeSchema,
    /** پیش‌نمایش آخرین پیام غیرداخلی (برای فهرست گفتگو) */
    lastMessagePreview: z.string().max(200).nullable().optional(),
    /** تعداد پیام‌های خوانده‌نشده برای بینندهٔ فعلی */
    unreadCount: z.number().int().min(0).optional(),
    closedAt: isoDateTimeSchema.nullable(),
    firstResponseAt: isoDateTimeSchema.nullable(),
    slaDueAt: isoDateTimeSchema.nullable(),
    rating: z.number().int().min(1).max(5).nullable(),
    ratingComment: z.string().max(500).nullable(),
    ...auditFields,
  })
  .openapi("Ticket");
export type Ticket = z.infer<typeof ticketSchema>;

export const MESSAGE_AUTHOR_TYPES = ["student", "staff", "system"] as const;
export const messageAuthorTypeSchema = z
  .enum(MESSAGE_AUTHOR_TYPES)
  .openapi("MessageAuthorType");
export type MessageAuthorType = z.infer<typeof messageAuthorTypeSchema>;

export const ticketMessageSchema = z
  .object({
    id: idSchema,
    ticketId: idSchema,
    authorId: idSchema.nullable(),
    authorName: z.string(),
    authorRole: roleSchema.nullable(),
    authorType: messageAuthorTypeSchema,
    body: z
      .string()
      .min(1)
      .max(5000)
      .describe("متن ساده؛ بدون HTML"),
    attachments: z.array(ticketAttachmentSchema),
    attachmentIds: z
      .array(idSchema)
      .optional()
      .describe("شناسه‌های فایل پیوست (ورودی/آینه)"),
    internal: z
      .boolean()
      .describe("یادداشت داخلی؛ فقط برای کارمندان؛ هرگز به دانشجو برنمی‌گردد"),
    readAt: isoDateTimeSchema.nullable(),
    createdAt: isoDateTimeSchema,
  })
  .openapi("TicketMessage");
export type TicketMessage = z.infer<typeof ticketMessageSchema>;

/** Student-safe ticket (no internal-only fields beyond public ticket shape) */
export const ticketViewSchema = ticketSchema
  .omit({ relatedCaseId: true })
  .extend({
    relatedCaseId: idSchema.nullable(),
  })
  .openapi("TicketView");
export type TicketView = z.infer<typeof ticketViewSchema>;

export const ticketMessageViewSchema = ticketMessageSchema
  .omit({ internal: true, authorRole: true })
  .openapi("TicketMessageView");
export type TicketMessageView = z.infer<typeof ticketMessageViewSchema>;

export const ticketCreateSchema = z
  .object({
    subject: z.string().trim().min(3, "موضوع را وارد کنید").max(160),
    category: ticketCategorySchema,
    priority: ticketPrioritySchema.default("normal"),
    caseId: idSchema.optional(),
    relatedCaseId: idSchema.optional(),
    body: z.string().trim().min(5, "متن پیام را وارد کنید").max(5000),
    attachmentIds: z.array(idSchema).max(5).default([]),
  })
  .openapi("TicketCreate");
export type TicketCreate = z.infer<typeof ticketCreateSchema>;

/** Staff-only changes */
export const ticketUpdateSchema = z
  .object({
    status: ticketStatusSchema,
    priority: ticketPrioritySchema,
    category: ticketCategorySchema,
    assignedTo: idSchema.nullable(),
    slaDueAt: isoDateTimeSchema.nullable(),
  })
  .partial()
  .openapi("TicketUpdate");
export type TicketUpdate = z.infer<typeof ticketUpdateSchema>;

export const ticketMessageCreateSchema = z
  .object({
    body: z.string().trim().min(1, "متن پیام را وارد کنید").max(5000),
    attachmentIds: z.array(idSchema).max(5).default([]),
    internal: z
      .boolean()
      .default(false)
      .describe("فقط کارمندان می‌توانند true بفرستند"),
  })
  .openapi("TicketMessageCreate");
export type TicketMessageCreate = z.infer<typeof ticketMessageCreateSchema>;

export const ticketRatingSchema = z
  .object({
    rating: z.number().int().min(1).max(5),
    ratingComment: z.string().trim().max(500).optional(),
  })
  .openapi("TicketRating");
export type TicketRating = z.infer<typeof ticketRatingSchema>;

export const TICKET_SORT_FIELDS = [
  "lastMessageAt",
  "createdAt",
  "priority",
  "slaDueAt",
] as const;
export const ticketListQuerySchema = listQuerySchema(TICKET_SORT_FIELDS, {
  status: ticketStatusSchema.optional(),
  category: ticketCategorySchema.optional(),
  priority: ticketPrioritySchema.optional(),
  assignedTo: idSchema.optional(),
  caseId: idSchema.optional(),
  /** فقط تیکت‌هایی که SLA گذشته */
  slaOverdue: queryBooleanSchema.optional(),
  /** منتظر پاسخ کارکنان (waiting_staff) */
  unanswered: queryBooleanSchema.optional(),
  /** بدون مسئول */
  unassigned: queryBooleanSchema.optional(),
});
export type TicketListQuery = z.infer<typeof ticketListQuerySchema>;

/** پنجرهٔ بازگشایی تیکت توسط دانشجو پس از بستن (روز) */
export const STUDENT_TICKET_REOPEN_DAYS = 7;

export const messageListQuerySchema = listQuerySchema(["createdAt"]);
export type MessageListQuery = z.infer<typeof messageListQuerySchema>;
