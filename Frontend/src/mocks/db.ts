import type {
  BlogCategory,
  BlogPost,
  Consultant,
  Country,
  Faq,
  NewsItem,
  Program,
  Service,
  SuccessStory,
  University,
} from "@/contracts/content";
import type {
  ConsultantAvailability,
  GlobalHoliday,
} from "@/contracts/availability";
import type { Booking, BookingChange } from "@/contracts/bookings";
import type {
  AssignmentRule,
  AuditLog,
  CaseTemplate,
  LostReason,
  MessageTemplate,
  Notification,
  NotificationPreferences,
  PipelineStage,
  SavedView,
  Tag,
  Task,
} from "@/contracts/crm";
import type { CampaignCost } from "@/contracts/crm-settings";
import type { Activity, Lead } from "@/contracts/leads";
import type { Announcement } from "@/contracts/student-panel";
import type { Installment, PaymentAttempt } from "@/contracts/payments";
import type {
  ChecklistItem,
  StudentCase,
  StudentDocument,
} from "@/contracts/students";
import type { Ticket, TicketMessage } from "@/contracts/tickets";
import type { PrivacyRequest } from "@/contracts/privacy";
import { isPersistenceEnabled } from "./config";
import { clearSnapshot, readSnapshot, writeSnapshot } from "./persistence";
import { buildSeed } from "./seed";
import { validateSeed } from "./seed/validate";
import {
  createModels,
  createRepo,
  type ModelName,
  type Repo,
} from "./store";
import type {
  MockUser,
  NewsletterSubscription,
  StoredCrmSettings,
  StoredFile,
  StoredInstituteSettings,
  StoredInvoice,
  StoredPaymentPlan,
  StoredShortlist,
} from "./types";

/** Entity type of every collection in the mock db */
export type Collections = {
  users: MockUser;
  instituteSettings: StoredInstituteSettings;
  countries: Country;
  universities: University;
  programs: Program;
  services: Service;
  consultants: Consultant;
  successStories: SuccessStory;
  blogCategories: BlogCategory;
  blogPosts: BlogPost;
  newsItems: NewsItem;
  faqs: Faq;
  leads: Lead;
  activities: Activity;
  bookings: Booking;
  bookingChanges: BookingChange;
  availabilities: ConsultantAvailability;
  holidays: GlobalHoliday;
  cases: StudentCase;
  documents: StudentDocument;
  checklistItems: ChecklistItem;
  files: StoredFile;
  tickets: Ticket;
  ticketMessages: TicketMessage;
  invoices: StoredInvoice;
  installments: Installment;
  paymentPlans: StoredPaymentPlan;
  paymentAttempts: PaymentAttempt;
  announcements: Announcement;
  shortlists: StoredShortlist;
  newsletter: NewsletterSubscription;
  pipelineStages: PipelineStage;
  lostReasons: LostReason;
  tags: Tag;
  tasks: Task;
  assignmentRules: AssignmentRule;
  messageTemplates: MessageTemplate;
  caseTemplates: CaseTemplate;
  campaignCosts: CampaignCost;
  crmSettings: StoredCrmSettings;
  savedViews: SavedView;
  notifications: Notification;
  /** Preferences keyed by userId (`id === userId`) */
  notificationPreferences: NotificationPreferences & { id: string };
  auditLogs: AuditLog;
  privacyRequests: PrivacyRequest;
};

export type CollectionName = keyof Collections;
export type SeedData = { [K in CollectionName]: Collections[K][] };

const MODEL_OF: Record<CollectionName, ModelName> = {
  users: "user",
  instituteSettings: "instituteSettings",
  countries: "country",
  universities: "university",
  programs: "program",
  services: "service",
  consultants: "consultant",
  successStories: "successStory",
  blogCategories: "blogCategory",
  blogPosts: "blogPost",
  newsItems: "newsItem",
  faqs: "faq",
  leads: "lead",
  activities: "activity",
  bookings: "booking",
  bookingChanges: "bookingChange",
  availabilities: "consultantAvailability",
  holidays: "globalHoliday",
  cases: "studentCase",
  documents: "document",
  checklistItems: "checklistItem",
  files: "file",
  tickets: "ticket",
  ticketMessages: "ticketMessage",
  invoices: "invoice",
  installments: "installment",
  paymentPlans: "paymentPlan",
  paymentAttempts: "paymentAttempt",
  announcements: "announcement",
  shortlists: "shortlist",
  newsletter: "newsletter",
  pipelineStages: "pipelineStage",
  lostReasons: "lostReason",
  tags: "tag",
  tasks: "task",
  assignmentRules: "assignmentRule",
  messageTemplates: "messageTemplate",
  caseTemplates: "caseTemplate",
  campaignCosts: "campaignCost",
  crmSettings: "crmSettings",
  savedViews: "savedView",
  notifications: "notification",
  notificationPreferences: "notificationPreferences",
  auditLogs: "auditLog",
  privacyRequests: "privacyRequest",
};

const COLLECTION_NAMES = Object.keys(MODEL_OF) as CollectionName[];

/** True when every collection key is present and an array (stale snapshots often miss new tables). */
export function isCompleteSeed(data: unknown): data is SeedData {
  if (!data || typeof data !== "object") return false;
  const record = data as Record<string, unknown>;
  return COLLECTION_NAMES.every((name) => Array.isArray(record[name]));
}

export type MockDb = { [K in CollectionName]: Repo<Collections[K]> } & {
  /** Drop everything and re-seed (also clears the persisted snapshot) */
  reset(): void;
  /** Plain copy of all collections */
  snapshot(): SeedData;
  /** Schedule a localStorage write (no-op unless persistence is enabled) */
  persist(): void;
  /** Immediately flush any pending snapshot write to storage */
  flush(): void;
};

function createDb(): MockDb {
  const models = createModels();
  const repos = {} as { [K in CollectionName]: Repo<Collections[K]> };
  for (const name of COLLECTION_NAMES) {
    // Each key maps to its own entity type; the assignment is per-key sound.
    (repos as Record<CollectionName, Repo<{ id: string }>>)[name] = createRepo(
      models,
      MODEL_OF[name],
    );
  }

  const load = (data: SeedData) => {
    if (!isCompleteSeed(data)) {
      const bad = COLLECTION_NAMES.find(
        (name) => !Array.isArray((data as Record<string, unknown>)?.[name]),
      );
      throw new Error(
        `[mock] seed is incomplete: collection "${bad ?? "?"}" is missing or not an array`,
      );
    }
    for (const name of COLLECTION_NAMES) {
      const repo = repos[name] as Repo<{ id: string }>;
      repo.clear();
      repo.insertMany(data[name]);
    }
  };

  const snapshot = (): SeedData => {
    const result = {} as Record<CollectionName, unknown[]>;
    for (const name of COLLECTION_NAMES) result[name] = repos[name].dump();
    return result as SeedData;
  };

  let saveTimer: ReturnType<typeof setTimeout> | undefined;

  const db: MockDb = {
    ...repos,
    snapshot,
    reset() {
      clearSnapshot();
      const seed = buildSeed();
      validateSeed(seed);
      load(seed);
    },
    persist() {
      if (!isPersistenceEnabled()) return;
      clearTimeout(saveTimer);
      saveTimer = setTimeout(() => {
        saveTimer = undefined;
        writeSnapshot(snapshot());
      }, 150);
    },
    flush() {
      if (!isPersistenceEnabled()) return;
      if (saveTimer !== undefined) {
        clearTimeout(saveTimer);
        saveTimer = undefined;
      }
      writeSnapshot(snapshot());
    },
  };

  if (typeof window !== "undefined") {
    window.addEventListener("beforeunload", () => {
      db.flush();
    });
  }

  const restored = readSnapshot<SeedData>();
  if (restored && isCompleteSeed(restored)) {
    load(restored);
  } else {
    // Incomplete / pre-migration snapshots (e.g. missing blogCategories) → fresh seed
    if (restored) clearSnapshot();
    const seed = buildSeed();
    validateSeed(seed); // fails loudly if the seed violates the contract
    load(seed);
  }
  return db;
}

type GlobalWithDb = typeof globalThis & { __applyMockDb?: MockDb };

/** Lazy singleton; survives HMR / module re-evaluation via `globalThis` */
export function getDb(): MockDb {
  const holder = globalThis as GlobalWithDb;
  holder.__applyMockDb ??= createDb();
  return holder.__applyMockDb;
}

/** Re-seed the db (used by the dev panel and tests) */
export function resetDb(): MockDb {
  const db = getDb();
  db.reset();
  return db;
}
