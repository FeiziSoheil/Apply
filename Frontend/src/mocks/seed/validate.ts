import { currentUserSchema } from "@/contracts/auth";
import { fileAssetSchema } from "@/contracts/common";
import { instituteSettingsSchema } from "@/contracts/settings";
import {
  consultantAvailabilitySchema,
  globalHolidaySchema,
} from "@/contracts/availability";
import { bookingChangeSchema, bookingSchema } from "@/contracts/bookings";
import {
  blogCategorySchema,
  blogPostSchema,
  consultantSchema,
  countrySchema,
  faqSchema,
  newsItemSchema,
  programSchema,
  serviceSchema,
  successStorySchema,
  universitySchema,
} from "@/contracts/content";
import {
  assignmentRuleSchema,
  auditLogSchema,
  caseTemplateSchema,
  lostReasonSchema,
  messageTemplateSchema,
  notificationPreferencesSchema,
  notificationSchema,
  pipelineStageSchema,
  savedViewSchema,
  tagSchema,
  taskSchema,
} from "@/contracts/crm";
import {
  campaignCostSchema,
  crmDefaultsDataSchema,
  crmSettingsTabSchema,
} from "@/contracts/crm-settings";
import { activitySchema, leadSchema } from "@/contracts/leads";
import {
  installmentSchema,
  invoiceSchema,
  paymentAttemptSchema,
  paymentPlanSchema,
} from "@/contracts/payments";
import { announcementSchema } from "@/contracts/student-panel";
import { privacyRequestSchema } from "@/contracts/privacy";
import {
  checklistItemSchema,
  documentSchema,
  studentCaseSchema,
} from "@/contracts/students";
import { ticketMessageSchema, ticketSchema } from "@/contracts/tickets";
import { z } from "@/contracts/zod";
import type { CollectionName, SeedData } from "../db";
import { toCurrentUser } from "../domain/users";

const storedCrmSettingsSchema = z.object({
  id: z.string().uuid(),
  versions: z.record(crmSettingsTabSchema, z.number().int().min(1)),
  updatedAtByTab: z.record(crmSettingsTabSchema, z.string().datetime()),
  defaults: crmDefaultsDataSchema,
});

export class MockSeedError extends Error {
  constructor(readonly problems: string[]) {
    super(
      `[mock] The seed data violates the API contract (src/contracts):\n  - ${problems.join("\n  - ")}`,
    );
    this.name = "MockSeedError";
  }
}

type Check = { schema: z.ZodTypeAny; project?: (item: never) => unknown };

const storedInvoiceSchema = invoiceSchema.omit({ installments: true });

const CHECKS: Partial<Record<CollectionName, Check>> = {
  users: {
    schema: currentUserSchema,
    project: (item) => toCurrentUser(item),
  },
  instituteSettings: { schema: instituteSettingsSchema },
  countries: { schema: countrySchema },
  universities: { schema: universitySchema },
  programs: { schema: programSchema },
  services: { schema: serviceSchema },
  consultants: { schema: consultantSchema },
  successStories: { schema: successStorySchema },
  blogCategories: { schema: blogCategorySchema },
  blogPosts: { schema: blogPostSchema },
  newsItems: { schema: newsItemSchema },
  faqs: { schema: faqSchema },
  leads: { schema: leadSchema },
  activities: { schema: activitySchema },
  bookings: { schema: bookingSchema },
  bookingChanges: { schema: bookingChangeSchema },
  availabilities: { schema: consultantAvailabilitySchema },
  holidays: { schema: globalHolidaySchema },
  cases: { schema: studentCaseSchema },
  documents: { schema: documentSchema },
  checklistItems: { schema: checklistItemSchema },
  files: { schema: fileAssetSchema },
  tickets: { schema: ticketSchema },
  ticketMessages: { schema: ticketMessageSchema },
  invoices: { schema: storedInvoiceSchema },
  installments: { schema: installmentSchema },
  paymentPlans: {
    schema: paymentPlanSchema.omit({ installments: true }),
  },
  paymentAttempts: { schema: paymentAttemptSchema },
  announcements: { schema: announcementSchema },
  shortlists: {
    schema: z.object({
      id: z.string().uuid(),
      items: z.array(
        z.object({
          id: z.string().uuid(),
          programId: z.string().uuid().nullable(),
          universityId: z.string().uuid().nullable(),
          addedAt: z.string().datetime(),
        }),
      ),
      updatedAt: z.string().datetime(),
    }),
  },
  pipelineStages: { schema: pipelineStageSchema },
  lostReasons: { schema: lostReasonSchema },
  tags: { schema: tagSchema },
  tasks: { schema: taskSchema },
  assignmentRules: { schema: assignmentRuleSchema },
  messageTemplates: { schema: messageTemplateSchema },
  caseTemplates: { schema: caseTemplateSchema },
  campaignCosts: { schema: campaignCostSchema },
  crmSettings: { schema: storedCrmSettingsSchema },
  savedViews: { schema: savedViewSchema },
  notifications: { schema: notificationSchema },
  notificationPreferences: {
    schema: notificationPreferencesSchema.extend({
      id: z.string().uuid(),
    }),
  },
  auditLogs: { schema: auditLogSchema },
  privacyRequests: { schema: privacyRequestSchema },
};

const MAX_PROBLEMS = 12;

/** Validate every seeded entity with its contract schema; throws on any violation */
export function validateSeed(seed: SeedData): void {
  const problems: string[] = [];

  for (const [name, check] of Object.entries(CHECKS) as [CollectionName, Check][]) {
    const items = seed[name] as unknown;
    if (!Array.isArray(items)) {
      problems.push(`${name}: expected an array, got ${items === null ? "null" : typeof items}`);
      if (problems.length >= MAX_PROBLEMS) throw new MockSeedError(problems);
      continue;
    }
    for (const item of items as readonly { id?: string }[]) {
      const value = check.project ? check.project(item as never) : item;
      const result = check.schema.safeParse(value);
      if (result.success) continue;
      const id = item.id ?? "?";
      const issue = result.error.issues[0];
      problems.push(`${name}[${id}] ${issue.path.join(".") || "(root)"}: ${issue.message}`);
      if (problems.length >= MAX_PROBLEMS) throw new MockSeedError(problems);
    }
  }

  // Referential integrity the schemas cannot express
  const ids = {
    cases: new Set(seed.cases.map((entry) => entry.id)),
    users: new Set(seed.users.map((entry) => entry.id)),
    files: new Set(seed.files.map((entry) => entry.id)),
  };
  for (const document of seed.documents) {
    if (!ids.cases.has(document.caseId)) {
      problems.push(`documents[${document.id}] references missing case ${document.caseId}`);
    }
    if (document.fileId && !ids.files.has(document.fileId)) {
      problems.push(`documents[${document.id}] references missing file ${document.fileId}`);
    }
  }
  for (const invoice of seed.invoices) {
    if (!ids.cases.has(invoice.caseId)) {
      problems.push(`invoices[${invoice.id}] references missing case ${invoice.caseId}`);
    }
  }
  for (const entry of seed.cases) {
    if (!ids.users.has(entry.studentId)) {
      problems.push(`cases[${entry.id}] references missing student ${entry.studentId}`);
    }
  }
  if (problems.length > 0) throw new MockSeedError(problems.slice(0, MAX_PROBLEMS));
}
