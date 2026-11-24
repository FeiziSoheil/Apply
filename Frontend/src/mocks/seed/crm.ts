import type {
  AssignmentRule,
  AuditLog,
  CaseTemplate,
  LostReason,
  MessageTemplate,
  Notification,
  PipelineStage,
  SavedView,
  Tag,
  Task,
} from "@/contracts/crm";
import type {
  CampaignCost,
  CrmDefaultsData,
} from "@/contracts/crm-settings";
import type { Consultant } from "@/contracts/content";
import type { Lead } from "@/contracts/leads";
import type { StudentCase } from "@/contracts/students";
import type { StoredCrmSettings } from "../types";
import { uuidFromKey } from "../utils";
import {
  chance,
  daysAgoBetween,
  iso,
  pick,
  type SeedClock,
} from "./helpers";

export const CRM_SETTINGS_ID = uuidFromKey("crm-settings:meta");

export const TAG_COUNT = 13;
export const LOST_REASON_COUNT = 6;
export const MESSAGE_TEMPLATE_COUNT = 6;
export const ASSIGNMENT_RULE_COUNT = 3;
export const TASK_COUNT = 80;

const PIPELINE_DEFS: readonly {
  key: string;
  title: string;
  kind: PipelineStage["kind"];
  color: PipelineStage["color"];
  wipLimit: number | null;
}[] = [
  { key: "new", title: "جدید", kind: "new", color: "slate", wipLimit: null },
  { key: "first_contact", title: "تماس اول", kind: "open", color: "blue", wipLimit: 40 },
  {
    key: "consultation_done",
    title: "مشاوره انجام شد",
    kind: "open",
    color: "cyan",
    wipLimit: 30,
  },
  {
    key: "evaluation_proposal",
    title: "ارزیابی و پیشنهاد",
    kind: "open",
    color: "violet",
    wipLimit: 25,
  },
  { key: "contract", title: "قرارداد", kind: "open", color: "amber", wipLimit: 15 },
  { key: "converted", title: "تبدیل‌شده", kind: "won", color: "emerald", wipLimit: null },
  { key: "churned", title: "ریزش", kind: "lost", color: "rose", wipLimit: null },
];

const TAG_TITLES = [
  "بورسیه",
  "فوری",
  "VIP",
  "آلمان",
  "کانادا",
  "پزشکی",
  "مهندسی",
  "زبان ضعیف",
  "ارجاعی",
  "نمایشگاه",
  "اینستاگرام",
  "پیگیری سرد",
  "ورودی‌شده از فایل",
] as const;

const LOST_TITLES = [
  "قیمت بالا",
  "انصراف شخصی",
  "پذیرش از موسسه دیگر",
  "عدم پاسخ‌گویی",
  "شرایط زبان",
  "ویزای رد شده",
] as const;

export type CrmSeed = {
  pipelineStages: PipelineStage[];
  lostReasons: LostReason[];
  tags: Tag[];
  assignmentRules: AssignmentRule[];
  messageTemplates: MessageTemplate[];
  caseTemplates: CaseTemplate[];
  campaignCosts: CampaignCost[];
  crmSettings: StoredCrmSettings;
  tasks: Task[];
  notifications: Notification[];
  auditLogs: AuditLog[];
  savedViews: SavedView[];
  /** stage key → stage id */
  stageIdsByKey: Map<string, string>;
  lostReasonIds: string[];
  tagIds: string[];
};

export function buildDefaultCrmDefaultsData(
  initialStageId: string,
): CrmDefaultsData {
  return {
    initialStageId,
    defaultAssigneeId: null,
    businessHours: {
      timezone: "Asia/Tehran",
      days: [
        { weekday: 6, start: "09:00", end: "18:00" }, // شنبه
        { weekday: 0, start: "09:00", end: "18:00" },
        { weekday: 1, start: "09:00", end: "18:00" },
        { weekday: 2, start: "09:00", end: "18:00" },
        { weekday: 3, start: "09:00", end: "18:00" },
      ],
    },
    noActivityDays: 7,
  };
}

export function buildDefaultCampaignCosts(
  clock: SeedClock,
): CampaignCost[] {
  const createdAt = iso(daysAgoBetween(clock, 60, 30));
  return [
    {
      id: uuidFromKey("campaign-cost:0"),
      yearMonth: "2026-09",
      source: "assessment",
      campaign: "fall-intake",
      costRials: 45_000_000,
      createdAt,
      updatedAt: createdAt,
    },
    {
      id: uuidFromKey("campaign-cost:1"),
      yearMonth: "2026-09",
      source: "instagram",
      campaign: null,
      costRials: 12_000_000,
      createdAt,
      updatedAt: createdAt,
    },
  ];
}

export function buildCrmSettingsSeed(
  clock: SeedClock,
  consultants: readonly Consultant[],
  countrySlugs: readonly string[],
): CrmSeed {
  const createdAt = iso(daysAgoBetween(clock, 200, 180));
  const pipelineStages: PipelineStage[] = PIPELINE_DEFS.map((def, index) => ({
    id: uuidFromKey(`pipeline:${def.key}`),
    key: def.key,
    title: def.title,
    order: index,
    color: def.color,
    kind: def.kind,
    wipLimit: def.wipLimit,
    createdAt,
    updatedAt: createdAt,
  }));
  const stageIdsByKey = new Map(
    pipelineStages.map((stage) => [stage.key, stage.id] as const),
  );

  const lostReasons: LostReason[] = LOST_TITLES.map((title, index) => ({
    id: uuidFromKey(`lost-reason:${index}`),
    title,
    active: true,
    createdAt,
    updatedAt: createdAt,
  }));

  const colors = [
    "slate",
    "blue",
    "cyan",
    "violet",
    "amber",
    "emerald",
    "rose",
  ] as const;
  const tags: Tag[] = TAG_TITLES.map((title, index) => ({
    id: uuidFromKey(`tag:${index}`),
    title,
    color: colors[index % colors.length],
    createdAt,
    updatedAt: createdAt,
  }));

  const consultantIds = consultants.map((c) => c.id);
  const assignmentRules: AssignmentRule[] = [
    {
      id: uuidFromKey("assignment-rule:0"),
      order: 0,
      active: true,
      conditions: [{ type: "target_country", countrySlug: countrySlugs[0] ?? "germany" }],
      strategy: "fixed",
      consultantIds: consultantIds.slice(0, 1),
      createdAt,
      updatedAt: createdAt,
    },
    {
      id: uuidFromKey("assignment-rule:1"),
      order: 1,
      active: true,
      conditions: [{ type: "source", source: "assessment" }],
      strategy: "round_robin",
      consultantIds: consultantIds.slice(0, Math.min(3, consultantIds.length)),
      createdAt,
      updatedAt: createdAt,
    },
    {
      id: uuidFromKey("assignment-rule:2"),
      order: 2,
      active: true,
      conditions: [{ type: "always" }],
      strategy: "least_loaded",
      consultantIds: consultantIds.slice(0, Math.min(4, consultantIds.length)),
      createdAt,
      updatedAt: createdAt,
    },
  ];

  const messageTemplates: MessageTemplate[] = [
    {
      id: uuidFromKey("msg-tpl:0"),
      channel: "sms",
      title: "یادآوری مشاوره",
      body: "سلام {name}، مشاوره شما در {date} ساعت {time} با {consultant} برگزار می‌شود.",
      active: true,
      createdAt,
      updatedAt: createdAt,
    },
    {
      id: uuidFromKey("msg-tpl:1"),
      channel: "whatsapp",
      title: "پیگیری اولیه",
      body: "سلام {name}، ممنون از ثبت‌نام. برای کشور {country} آماده‌ایم کمک کنیم.",
      active: true,
      createdAt,
      updatedAt: createdAt,
    },
    {
      id: uuidFromKey("msg-tpl:2"),
      channel: "email",
      title: "ارسال پیشنهاد",
      body: "سلام {name}، پیشنهاد تحصیلی شما آماده است. مشاور: {consultant}.",
      active: true,
      createdAt,
      updatedAt: createdAt,
    },
    {
      id: uuidFromKey("msg-tpl:3"),
      channel: "sms",
      title: "تولد قرارداد",
      body: "{name} عزیز، قرارداد شما ثبت شد. تاریخ: {date}.",
      active: false,
      createdAt,
      updatedAt: createdAt,
    },
    {
      id: uuidFromKey("msg-tpl:4"),
      channel: "ticket",
      title: "درخواست مدارک",
      body: "سلام {name}، برای ادامه پرونده لطفاً مدارک ناقص را از پنل بارگذاری کنید. موضوع: {subject} ({ticket_code}).",
      active: true,
      createdAt,
      updatedAt: createdAt,
    },
    {
      id: uuidFromKey("msg-tpl:5"),
      channel: "ticket",
      title: "پیگیری پرداخت",
      body: "سلام {name}، قسط معوق دارید. در صورت نیاز همین‌جا پیام بگذارید. مشاور: {consultant}.",
      active: true,
      createdAt,
      updatedAt: createdAt,
    },
  ];

  const caseTemplates: CaseTemplate[] = [
    {
      id: uuidFromKey("case-tpl:generic"),
      countrySlug: null,
      title: "قالب عمومی پرونده",
      stages: [
        {
          key: "consultation",
          title: "مشاوره",
          order: 0,
          requiredDocuments: [],
          defaultTasks: [{ title: "جلسه معارفه", dueOffsetDays: 3 }],
        },
        {
          key: "documents",
          title: "مدارک",
          order: 1,
          requiredDocuments: [
            { key: "passport", title: "پاسپورت", required: true },
            { key: "transcript", title: "ریز نمرات", required: true },
          ],
          defaultTasks: [{ title: "جمع‌آوری مدارک", dueOffsetDays: 14 }],
        },
        {
          key: "application",
          title: "اپلای",
          order: 2,
          requiredDocuments: [
            { key: "motivation_letter", title: "انگیزه‌نامه", required: true },
          ],
          defaultTasks: [{ title: "ارسال اپلیکیشن", dueOffsetDays: 21 }],
        },
        {
          key: "offer",
          title: "پذیرش",
          order: 3,
          requiredDocuments: [],
          defaultTasks: [],
        },
        {
          key: "visa",
          title: "ویزا",
          order: 4,
          requiredDocuments: [
            { key: "bank_statement", title: "تمکن مالی", required: true },
          ],
          defaultTasks: [{ title: "وقت سفارت", dueOffsetDays: 30 }],
        },
        {
          key: "departure",
          title: "اعزام",
          order: 5,
          requiredDocuments: [],
          defaultTasks: [{ title: "هماهنگی پرواز", dueOffsetDays: 14 }],
        },
      ],
      createdAt,
      updatedAt: createdAt,
    },
    ...countrySlugs.slice(0, 5).map((slug) => ({
      id: uuidFromKey(`case-tpl:${slug}`),
      countrySlug: slug,
      title: `قالب پرونده ${slug}`,
      stages: [
        {
          key: "consultation",
          title: "مشاوره",
          order: 0,
          requiredDocuments: [],
          defaultTasks: [{ title: `بررسی شرایط ${slug}`, dueOffsetDays: 2 }],
        },
        {
          key: "documents",
          title: "مدارک",
          order: 1,
          requiredDocuments: [
            { key: "passport", title: "پاسپورت", required: true },
            { key: "language_certificate", title: "مدرک زبان", required: true },
          ],
          defaultTasks: [{ title: "چک‌لیست مدارک کشور", dueOffsetDays: 10 }],
        },
        {
          key: "application",
          title: "اپلای",
          order: 2,
          requiredDocuments: [],
          defaultTasks: [{ title: "ثبت اپلیکیشن", dueOffsetDays: 20 }],
        },
        {
          key: "visa",
          title: "ویزا",
          order: 3,
          requiredDocuments: [
            { key: "visa", title: "ویزا", required: false },
          ],
          defaultTasks: [],
        },
      ],
      createdAt,
      updatedAt: createdAt,
    })),
  ];

  const newStageId = stageIdsByKey.get("new") ?? pipelineStages[0]!.id;
  const defaults = buildDefaultCrmDefaultsData(newStageId);
  const campaignCosts = buildDefaultCampaignCosts(clock);
  const crmSettings: StoredCrmSettings = {
    id: CRM_SETTINGS_ID,
    versions: {
      pipeline: 1,
      lostReasons: 1,
      tags: 1,
      assignmentRules: 1,
      messageTemplates: 1,
      caseTemplates: 1,
      campaignCosts: 1,
      defaults: 1,
    },
    updatedAtByTab: {
      pipeline: createdAt,
      lostReasons: createdAt,
      tags: createdAt,
      assignmentRules: createdAt,
      messageTemplates: createdAt,
      caseTemplates: createdAt,
      campaignCosts: createdAt,
      defaults: createdAt,
    },
    defaults,
  };

  return {
    pipelineStages,
    lostReasons,
    tags,
    assignmentRules,
    messageTemplates,
    caseTemplates,
    campaignCosts,
    crmSettings,
    tasks: [],
    notifications: [],
    auditLogs: [],
    savedViews: [],
    stageIdsByKey,
    lostReasonIds: lostReasons.map((r) => r.id),
    tagIds: tags.map((t) => t.id),
  };
}

export function buildCrmActivitySeed(input: {
  clock: SeedClock;
  leads: readonly Lead[];
  cases: readonly StudentCase[];
  consultants: readonly Consultant[];
  adminId: string;
  crm: CrmSeed;
}): Pick<
  CrmSeed,
  "tasks" | "notifications" | "auditLogs" | "savedViews"
> {
  const { clock, leads, cases, consultants, adminId } = input;
  const tasks: Task[] = [];
  const notifications: Notification[] = [];
  const auditLogs: AuditLog[] = [];

  for (let i = 0; i < TASK_COUNT; i += 1) {
    const assignee = pick(consultants);
    const relatedLead = chance(0.7) ? pick(leads) : null;
    const relatedCase =
      !relatedLead && chance(0.5) && cases.length > 0 ? pick(cases) : null;
    const overdue = i < 20;
    const dueMs = overdue
      ? daysAgoBetween(clock, 14, 1)
      : daysAgoBetween(clock, 0, -14);
    const status = overdue
      ? chance(0.3)
        ? "done"
        : "open"
      : pick(["open", "open", "done", "cancelled"] as const);
    const createdMs = daysAgoBetween(clock, 30, 1);
    tasks.push({
      id: uuidFromKey(`task:${i}`),
      title: pick([
        "تماس پیگیری",
        "ارسال پیشنهاد",
        "بررسی مدارک",
        "هماهنگی جلسه",
        "یادآوری قرارداد",
      ]),
      description: chance(0.4) ? "پیگیری طبق توافق قبلی" : null,
      dueAt: iso(dueMs),
      remindAt: chance(0.3) ? iso(dueMs - 3_600_000) : null,
      status,
      priority: pick(["low", "normal", "high"] as const),
      assigneeId: assignee.id,
      relatedType: relatedLead ? "lead" : relatedCase ? "case" : "none",
      relatedId: relatedLead?.id ?? relatedCase?.id ?? null,
      completedAt: status === "done" ? iso(Math.min(dueMs, clock.now - 60_000)) : null,
      createdBy: adminId,
      version: 1,
      createdAt: iso(createdMs),
      updatedAt: iso(createdMs),
    });
  }

  const sampleLeads = leads.filter((l) => l.assignedTo).slice(0, 25);
  sampleLeads.forEach((lead, index) => {
    if (!lead.assignedTo) return;
    notifications.push({
      id: uuidFromKey(`notif:lead:${index}`),
      userId: lead.assignedTo,
      type: index % 2 === 0 ? "lead_assigned" : "lead_new",
      title: index % 2 === 0 ? "سرنخ به شما تخصیص یافت" : "سرنخ جدید",
      body: `${lead.name} — ${lead.mobile}`,
      link: `/admin/leads/${lead.id}`,
      readAt: chance(0.4) ? iso(daysAgoBetween(clock, 5, 0)) : null,
      createdAt: lead.createdAt,
    });
  });

  tasks
    .filter((t) => t.status === "open")
    .slice(0, 15)
    .forEach((task, index) => {
      notifications.push({
        id: uuidFromKey(`notif:task:${index}`),
        userId: task.assigneeId,
        type: "task_due",
        title: "یادآوری کار",
        body: task.title,
        link: `/admin/tasks?highlight=${task.id}`,
        readAt: null,
        createdAt: task.createdAt,
      });
    });

  for (let i = 0; i < 40; i += 1) {
    const lead = pick(leads);
    auditLogs.push({
      id: uuidFromKey(`audit:${i}`),
      actorId: chance(0.85) ? pick(consultants).id : adminId,
      action: pick([
        "create",
        "update",
        "assign",
        "stage_change",
        "merge",
        "import",
        "export",
      ] as const),
      entityType: "lead",
      entityId: lead.id,
      diff: chance(0.5)
        ? {
            before: { priority: "normal" },
            after: { priority: lead.priority },
          }
        : null,
      ip: chance(0.3) ? "127.0.0.1" : null,
      createdAt: iso(daysAgoBetween(clock, 60, 0)),
    });
  }

  const savedViews: SavedView[] = [
    {
      id: uuidFromKey("saved-view:0"),
      ownerId: adminId,
      resource: "leads",
      title: "بدون مسئول",
      filters: { unassigned: true },
      sort: "createdAt",
      columns: ["name", "mobile", "stageId", "source"],
      shared: true,
      createdAt: iso(daysAgoBetween(clock, 40, 30)),
      updatedAt: iso(daysAgoBetween(clock, 40, 30)),
    },
    {
      id: uuidFromKey("saved-view:1"),
      ownerId: consultants[0]?.id ?? adminId,
      resource: "tasks",
      title: "سررسید گذشته من",
      filters: { due: "overdue", status: "open" },
      sort: "dueAt",
      columns: null,
      shared: false,
      createdAt: iso(daysAgoBetween(clock, 20, 10)),
      updatedAt: iso(daysAgoBetween(clock, 20, 10)),
    },
  ];

  return { tasks, notifications, auditLogs, savedViews };
}
