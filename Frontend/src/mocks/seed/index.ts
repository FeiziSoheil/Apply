import type { SeedData } from "../db";
import { buildAvailabilitySeed } from "./availability";
import { buildBookingSeed } from "./bookings";
import { buildContentSeed } from "./content";
import { buildCrmActivitySeed, buildCrmSettingsSeed } from "./crm";
import { SEED_VALUE, createClock, faker } from "./helpers";
import { buildLeadSeed } from "./leads";
import { buildPaymentSeed } from "./payments";
import { buildInstituteSettings } from "./settings";
import { buildStaffUsers } from "./staff";
import {
  buildAnnouncementSeed,
  buildPaymentAttemptSeed,
  buildShortlistSeed,
} from "./student-panel";
import { buildStudentSeed } from "./students";
import { buildTicketSeed } from "./tickets";

/**
 * Build the full seed: the existing `src/data` content plus faker (`fa`
 * locale) people and activity — ~150 leads, ~40 students with cases,
 * documents, checklists, ~60 bookings, ~50 tickets, invoices and installments,
 * plus CRM pipeline / tasks / notifications / audit.
 */
export function buildSeed(): SeedData {
  faker.seed(SEED_VALUE);
  const clock = createClock();

  const content = buildContentSeed(clock);
  const staff = buildStaffUsers(clock, content.consultants);
  const countrySlugs = content.countries.map((country) => country.slug);
  const adminId = staff.find((user) => user.role === "admin")?.id ?? staff[0].id;

  const crmSettings = buildCrmSettingsSeed(clock, content.consultants, countrySlugs);
  const leadSeed = buildLeadSeed(
    clock,
    content.consultants,
    countrySlugs,
    crmSettings,
  );
  const studentSeed = buildStudentSeed({
    clock,
    leads: leadSeed.leads,
    convertedCaseIds: leadSeed.convertedCaseIds,
    consultants: content.consultants,
    programs: content.programs,
    countrySlugs,
  });
  const crmActivity = buildCrmActivitySeed({
    clock,
    leads: leadSeed.leads,
    cases: studentSeed.cases,
    consultants: content.consultants,
    adminId,
    crm: crmSettings,
  });
  const availabilitySeed = buildAvailabilitySeed({
    clock,
    consultants: content.consultants,
  });
  const bookings = buildBookingSeed({
    clock,
    consultants: content.consultants,
    students: studentSeed.users,
    cases: studentSeed.cases,
    leads: leadSeed.leads,
  });
  const ticketSeed = buildTicketSeed({
    clock,
    students: studentSeed.users,
    cases: studentSeed.cases,
    consultants: content.consultants,
  });
  const paymentSeed = buildPaymentSeed({
    clock,
    cases: studentSeed.cases,
    services: content.services,
  });

  const announcements = buildAnnouncementSeed(clock, countrySlugs);
  const shortlists = buildShortlistSeed(
    studentSeed.users,
    content.programs,
    content.universities,
  );
  const paymentAttempts = buildPaymentAttemptSeed(
    paymentSeed.installments,
    paymentSeed.invoices,
    studentSeed.cases,
  );

  // Entities created at runtime must get fresh ids, not the seeded sequence
  faker.seed();

  return {
    users: [...staff, ...studentSeed.users],
    instituteSettings: [buildInstituteSettings(clock)],
    countries: content.countries,
    universities: content.universities,
    programs: content.programs,
    services: content.services,
    consultants: content.consultants,
    successStories: content.successStories,
    blogCategories: content.blogCategories,
    blogPosts: content.blogPosts,
    newsItems: content.newsItems,
    faqs: content.faqs,
    leads: leadSeed.leads,
    activities: leadSeed.activities,
    bookings,
    bookingChanges: [],
    availabilities: availabilitySeed.availabilities,
    holidays: availabilitySeed.holidays,
    cases: studentSeed.cases,
    documents: studentSeed.documents,
    checklistItems: studentSeed.checklistItems,
    files: [...studentSeed.files, ...ticketSeed.files],
    tickets: ticketSeed.tickets,
    ticketMessages: ticketSeed.messages,
    invoices: paymentSeed.invoices,
    installments: paymentSeed.installments,
    paymentPlans: [],
    paymentAttempts,
    announcements,
    shortlists,
    newsletter: [],
    pipelineStages: crmSettings.pipelineStages,
    lostReasons: crmSettings.lostReasons,
    tags: crmSettings.tags,
    tasks: crmActivity.tasks,
    assignmentRules: crmSettings.assignmentRules,
    messageTemplates: crmSettings.messageTemplates,
    caseTemplates: crmSettings.caseTemplates,
    campaignCosts: crmSettings.campaignCosts,
    crmSettings: [crmSettings.crmSettings],
    savedViews: crmActivity.savedViews,
    notifications: crmActivity.notifications,
    notificationPreferences: [],
    auditLogs: crmActivity.auditLogs,
    privacyRequests: [],
  };
}
