import type { z } from "zod";
import {
  announcementViewSchema,
  caseLinkResultSchema,
  documentViewSchema,
  documentViewsPayloadSchema,
  selectCaseSchema,
  shortlistSchema,
  shortlistPutSchema,
  shortlistMergeSchema,
  shortlistConsultationRequestSchema,
  shortlistCompareSchema,
  studentMobileChangeRequestSchema,
  studentMobileChangeVerifySchema,
  studentCaseViewSchema,
  studentDocumentUploadSchema,
  studentPaymentSummarySchema,
  studentProfileSchema,
  studentProfileUpdateSchema,
  studentTaskViewSchema,
} from "@/contracts/student-panel";
import {
  privacyRequestSchema,
  privacyRequestCreateSchema,
  privacyRequestProcessSchema,
  type PrivacyRequestListQuery,
} from "@/contracts/privacy";
import {
  installmentSchema,
  invoiceSchema,
  paymentAttemptSchema,
  studentInstallmentPaySchema,
  studentPayResultSchema,
} from "@/contracts/payments";
import { paymentAccountSettingsSchema } from "@/contracts/settings";
import {
  ticketCreateSchema,
  ticketListQuerySchema,
  ticketMessageCreateSchema,
  ticketMessageViewSchema,
  ticketRatingSchema,
  ticketViewSchema,
} from "@/contracts/tickets";
import { z as zod } from "@/contracts/zod";
import {
  apiGet,
  apiGetPage,
  apiPatch,
  apiPost,
  apiPut,
  segment,
  type RequestOptions,
} from "@/lib/api/client";
import type { ListFilters } from "@/lib/api/types";
import { validateRequest } from "@/lib/api/validate";

export type MyTicketListFilters = ListFilters<typeof ticketListQuerySchema>;

const taskViewsSchema = zod.array(studentTaskViewSchema);
const announcementViewsSchema = zod.array(announcementViewSchema);
const myTicketDetailSchema = zod.object({
  ticket: ticketViewSchema,
  messages: zod.array(ticketMessageViewSchema),
});
const studentMessageBodySchema = ticketMessageCreateSchema.omit({
  internal: true,
});
const EMPTY_BODY = {};
const ticketPath = (id: string) => `/me/tickets/${segment(id)}`;

export const studentPanelApi = {
  getCaseLink(options?: RequestOptions) {
    return apiGet("/me/case-link", caseLinkResultSchema, options);
  },

  selectCase(
    body: z.input<typeof selectCaseSchema>,
    options?: RequestOptions,
  ) {
    return apiPost(
      "/me/case-link/select",
      caseLinkResultSchema,
      validateRequest(selectCaseSchema, body),
      options,
    );
  },

  getCase(options?: RequestOptions) {
    return apiGet("/me/case", studentCaseViewSchema, options);
  },

  listDocuments(options?: RequestOptions) {
    return apiGet("/me/documents", documentViewsPayloadSchema, options);
  },

  getDocument(id: string, options?: RequestOptions) {
    return apiGet(`/me/documents/${id}`, documentViewSchema, options);
  },

  uploadDocument(
    body: z.input<typeof studentDocumentUploadSchema>,
    options?: RequestOptions,
  ) {
    return apiPost(
      "/me/documents/upload",
      documentViewSchema,
      validateRequest(studentDocumentUploadSchema, body),
      options,
    );
  },

  listTasks(options?: RequestOptions) {
    return apiGet("/me/tasks", taskViewsSchema, options);
  },

  listAnnouncements(options?: RequestOptions) {
    return apiGet("/me/announcements", announcementViewsSchema, options);
  },

  getProfile(options?: RequestOptions) {
    return apiGet("/me/profile", studentProfileSchema, options);
  },

  updateProfile(
    body: z.input<typeof studentProfileUpdateSchema>,
    options?: RequestOptions,
  ) {
    return apiPatch(
      "/me/profile",
      studentProfileSchema,
      validateRequest(studentProfileUpdateSchema, body),
      options,
    );
  },

  listTickets(filters?: MyTicketListFilters, options?: RequestOptions) {
    return apiGetPage("/me/tickets", ticketViewSchema, {
      ...options,
      query: filters,
    });
  },

  createTicket(
    body: z.input<typeof ticketCreateSchema>,
    options?: RequestOptions,
  ) {
    return apiPost(
      "/me/tickets",
      ticketViewSchema,
      validateRequest(ticketCreateSchema, body),
      options,
    );
  },

  getTicket(id: string, options?: RequestOptions) {
    return apiGet(ticketPath(id), myTicketDetailSchema, options);
  },

  createTicketMessage(
    id: string,
    body: z.input<typeof studentMessageBodySchema>,
    options?: RequestOptions,
  ) {
    return apiPost(
      `${ticketPath(id)}/messages`,
      ticketMessageViewSchema,
      validateRequest(studentMessageBodySchema, body),
      options,
    );
  },

  closeTicket(id: string, options?: RequestOptions) {
    return apiPost(`${ticketPath(id)}/close`, ticketViewSchema, EMPTY_BODY, options);
  },

  reopenTicket(id: string, options?: RequestOptions) {
    return apiPost(
      `${ticketPath(id)}/reopen`,
      ticketViewSchema,
      EMPTY_BODY,
      options,
    );
  },

  rateTicket(
    id: string,
    body: z.input<typeof ticketRatingSchema>,
    options?: RequestOptions,
  ) {
    return apiPost(
      `${ticketPath(id)}/rating`,
      ticketViewSchema,
      validateRequest(ticketRatingSchema, body),
      options,
    );
  },

  getPaymentSummary(options?: RequestOptions) {
    return apiGet(
      "/me/payments/summary",
      studentPaymentSummarySchema,
      options,
    );
  },

  listInstallments(options?: RequestOptions) {
    return apiGet("/me/installments", zod.array(installmentSchema), options);
  },

  payInstallment(
    id: string,
    body: z.input<typeof studentInstallmentPaySchema>,
    options?: RequestOptions,
  ) {
    return apiPost(
      `/me/installments/${segment(id)}/pay`,
      studentPayResultSchema,
      validateRequest(studentInstallmentPaySchema, body),
      options,
    );
  },

  getPaymentAccount(options?: RequestOptions) {
    return apiGet(
      "/me/payment-account",
      paymentAccountSettingsSchema,
      options,
    );
  },

  getPayment(id: string, options?: RequestOptions) {
    return apiGet(
      `/me/payments/${segment(id)}`,
      paymentAttemptSchema,
      options,
    );
  },

  listInvoices(options?: RequestOptions) {
    return apiGet("/me/invoices", zod.array(invoiceSchema), options);
  },

  getInvoice(id: string, options?: RequestOptions) {
    return apiGet(`/me/invoices/${segment(id)}`, invoiceSchema, options);
  },

  getShortlist(options?: RequestOptions) {
    return apiGet("/me/shortlist", shortlistSchema, options);
  },

  putShortlist(
    body: z.input<typeof shortlistPutSchema>,
    options?: RequestOptions,
  ) {
    return apiPut(
      "/me/shortlist",
      shortlistSchema,
      validateRequest(shortlistPutSchema, body),
      options,
    );
  },

  mergeShortlist(
    body: z.input<typeof shortlistMergeSchema>,
    options?: RequestOptions,
  ) {
    return apiPost(
      "/me/shortlist/merge",
      shortlistSchema,
      validateRequest(shortlistMergeSchema, body),
      options,
    );
  },

  consultShortlist(
    body: z.input<typeof shortlistConsultationRequestSchema>,
    options?: RequestOptions,
  ) {
    return apiPost(
      "/me/shortlist/consult",
      zod.object({ ticketId: zod.string(), message: zod.string() }),
      validateRequest(shortlistConsultationRequestSchema, body),
      options,
    );
  },

  compareShortlist(options?: RequestOptions) {
    return apiGet(
      "/me/shortlist/compare",
      shortlistCompareSchema,
      options,
    );
  },

  requestMobileChange(
    body: z.input<typeof studentMobileChangeRequestSchema>,
    options?: RequestOptions,
  ) {
    return apiPost(
      "/me/mobile/request",
      zod.object({ message: zod.string(), expiresIn: zod.number() }),
      validateRequest(studentMobileChangeRequestSchema, body),
      options,
    );
  },

  verifyMobileChange(
    body: z.input<typeof studentMobileChangeVerifySchema>,
    options?: RequestOptions,
  ) {
    return apiPost(
      "/me/mobile/verify",
      studentProfileSchema,
      validateRequest(studentMobileChangeVerifySchema, body),
      options,
    );
  },

  listMyPrivacyRequests(options?: RequestOptions) {
    return apiGet(
      "/me/privacy-requests",
      zod.array(privacyRequestSchema),
      options,
    );
  },

  createPrivacyRequest(
    body: z.input<typeof privacyRequestCreateSchema>,
    options?: RequestOptions,
  ) {
    return apiPost(
      "/me/privacy-requests",
      privacyRequestSchema,
      validateRequest(privacyRequestCreateSchema, body),
      options,
    );
  },

  getMyExportData(options?: RequestOptions) {
    return apiGet("/me/export-data", zod.any(), options);
  },

  listAdminPrivacyRequests(
    filters?: Partial<PrivacyRequestListQuery>,
    options?: RequestOptions,
  ) {
    return apiGetPage("/admin/privacy-requests", privacyRequestSchema, {
      ...options,
      query: filters,
    });
  },

  processAdminPrivacyRequest(
    id: string,
    body: z.input<typeof privacyRequestProcessSchema>,
    options?: RequestOptions,
  ) {
    return apiPost(
      `/admin/privacy-requests/${segment(id)}/process`,
      privacyRequestSchema,
      validateRequest(privacyRequestProcessSchema, body),
      options,
    );
  },
};
