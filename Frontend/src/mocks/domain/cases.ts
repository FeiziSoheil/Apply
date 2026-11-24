import type { CaseTemplate, Task } from "@/contracts/crm";
import {
  CASE_STAGES,
  type CaseStage,
  type CaseStageState,
  type ChecklistItem,
  type DocumentType,
  type StageStatus,
  type StudentCase,
  type StudentDocument,
} from "@/contracts/students";
import type { MockDb } from "../db";
import { apiError } from "../errors";
import { newId, nowIso, uuidFromKey } from "../utils";
import { emitTaskSideEffects } from "./tasks";

export const STAGE_LABELS: Record<CaseStage, string> = {
  consultation: "مشاوره",
  documents: "مدارک",
  application: "اپلای",
  offer: "پذیرش",
  visa: "ویزا",
  departure: "اعزام",
};

export const DOCUMENT_TYPE_LABELS: Record<DocumentType, string> = {
  passport: "پاسپورت",
  national_id: "کارت ملی",
  photo: "عکس پرسنلی",
  transcript: "ریز نمرات",
  degree_certificate: "مدرک تحصیلی",
  language_certificate: "مدرک زبان",
  cv: "رزومه",
  motivation_letter: "انگیزه‌نامه",
  recommendation_letter: "توصیه‌نامه",
  bank_statement: "گواهی تمکن مالی",
  admission_letter: "نامه پذیرش",
  visa: "ویزا",
  other: "سایر مدارک",
};

/** Case code, e.g. `CS-1405-0042` (1405 = current Jalali year) */
export function caseCode(sequence: number): string {
  return `CS-1405-${String(sequence).padStart(4, "0")}`;
}

export function emptyStages(): CaseStageState[] {
  return CASE_STAGES.map((stage) => ({
    stage,
    status: "not_started",
    startedAt: null,
    completedAt: null,
    note: null,
  }));
}

/** Stage that is `in_progress`, else the first unfinished one, else the last */
export function deriveCurrentStage(stages: readonly CaseStageState[]): CaseStage {
  const active = stages.find((entry) => entry.status === "in_progress");
  if (active) return active.stage;
  const next = stages.find((entry) => entry.status !== "completed");
  return next ? next.stage : CASE_STAGES[CASE_STAGES.length - 1];
}

/** Returns the new stage list or throws `CONFLICT` for an illegal transition */
export function applyStageUpdate(
  stages: readonly CaseStageState[],
  stage: CaseStage,
  status: StageStatus,
  note: string | undefined,
  now: string,
): CaseStageState[] {
  const index = CASE_STAGES.indexOf(stage);
  const previousDone = stages
    .slice(0, index)
    .every((entry) => entry.status === "completed");

  if ((status === "in_progress" || status === "completed") && !previousDone) {
    throw apiError.conflict(
      "ابتدا باید مراحل قبلی پرونده تکمیل شوند",
      { stage: ["مراحل قبلی هنوز تکمیل نشده‌اند"] },
    );
  }

  return stages.map((entry) => {
    if (entry.stage !== stage) return entry;
    return {
      ...entry,
      status,
      startedAt:
        status === "not_started"
          ? null
          : (entry.startedAt ?? now),
      completedAt: status === "completed" ? now : null,
      note: note ?? entry.note,
    };
  });
}

type ChecklistTemplate = {
  stage: CaseStage;
  title: string;
  description: string | null;
  documentType: DocumentType | null;
  required: boolean;
};

const CHECKLIST_TEMPLATE: readonly ChecklistTemplate[] = [
  { stage: "consultation", title: "تکمیل فرم ارزیابی", description: "اطلاعات تحصیلی و اهداف خود را ثبت کنید.", documentType: null, required: true },
  { stage: "consultation", title: "شرکت در جلسه مشاوره", description: "جلسه اولیه با مشاور اختصاصی.", documentType: null, required: true },
  { stage: "documents", title: "اسکن پاسپورت", description: "تمام صفحات دارای مهر یا اطلاعات.", documentType: "passport", required: true },
  { stage: "documents", title: "کارت ملی", description: null, documentType: "national_id", required: true },
  { stage: "documents", title: "عکس پرسنلی", description: "پس‌زمینه سفید، ابعاد ۳×۴.", documentType: "photo", required: true },
  { stage: "documents", title: "ریز نمرات رسمی", description: "ترجمه رسمی و مهر شده.", documentType: "transcript", required: true },
  { stage: "documents", title: "مدرک تحصیلی", description: null, documentType: "degree_certificate", required: true },
  { stage: "documents", title: "مدرک زبان", description: "آیلتس، تافل یا معادل.", documentType: "language_certificate", required: true },
  { stage: "documents", title: "رزومه (CV)", description: null, documentType: "cv", required: true },
  { stage: "documents", title: "انگیزه‌نامه", description: null, documentType: "motivation_letter", required: true },
  { stage: "documents", title: "توصیه‌نامه", description: "حداقل یک توصیه‌نامه دانشگاهی.", documentType: "recommendation_letter", required: false },
  { stage: "application", title: "ثبت‌نام در پرتال دانشگاه", description: null, documentType: null, required: true },
  { stage: "application", title: "گواهی تمکن مالی", description: null, documentType: "bank_statement", required: true },
  { stage: "offer", title: "دریافت نامه پذیرش", description: null, documentType: "admission_letter", required: true },
  { stage: "visa", title: "تکمیل فرم ویزا", description: null, documentType: null, required: true },
  { stage: "visa", title: "دریافت ویزای تحصیلی", description: null, documentType: "visa", required: true },
  { stage: "departure", title: "رزرو بلیت پرواز", description: null, documentType: null, required: false },
  { stage: "departure", title: "بیمه مسافرتی", description: null, documentType: null, required: true },
];

/**
 * Default checklist created with every case. `seedKey` makes ids stable for
 * seed data; runtime cases pass `undefined` and get random UUIDs.
 */
export function buildDefaultChecklist(
  caseId: string,
  now: string,
  seedKey?: string,
): ChecklistItem[] {
  return CHECKLIST_TEMPLATE.map((item, index) => ({
    id: seedKey ? uuidFromKey(`${seedKey}:checklist:${index}`) : newId(),
    caseId,
    stage: item.stage,
    title: item.title,
    description: item.description,
    documentType: item.documentType,
    required: item.required,
    done: false,
    documentId: null,
    dueDate: null,
    createdAt: now,
    updatedAt: now,
  }));
}

const DAY_MS = 24 * 60 * 60 * 1000;

/** Create default tasks for a template stage (dueOffsetDays from now). */
export function createStageDefaultTasks(
  db: MockDb,
  input: {
    studentCase: StudentCase;
    stageKey: string;
    actorId: string;
    now?: string;
  },
): Task[] {
  const now = input.now ?? nowIso();
  const template = input.studentCase.templateId
    ? db.caseTemplates.get(input.studentCase.templateId)
    : undefined;
  const resolved =
    template ??
    db.caseTemplates.find(
      (tpl) => tpl.countrySlug === input.studentCase.targetCountry,
    ) ??
    db.caseTemplates.find((tpl) => tpl.countrySlug === null);

  const stage = resolved?.stages.find((entry) => entry.key === input.stageKey);
  if (!stage || stage.defaultTasks.length === 0) return [];

  const assigneeId =
    input.studentCase.consultantId ?? input.actorId;
  if (!assigneeId) return [];

  const created: Task[] = [];
  for (const def of stage.defaultTasks) {
    const dueAt = new Date(
      new Date(now).getTime() + def.dueOffsetDays * DAY_MS,
    ).toISOString();
    const task = db.tasks.insert({
      id: newId(),
      title: def.title,
      description: null,
      dueAt,
      remindAt: null,
      status: "open",
      priority: "normal",
      assigneeId,
      relatedType: "case",
      relatedId: input.studentCase.id,
      completedAt: null,
      createdBy: input.actorId,
      version: 1,
      createdAt: now,
      updatedAt: now,
    });
    emitTaskSideEffects(db, {
      actorId: input.actorId,
      action: "create",
      task,
      after: { title: task.title, dueAt: task.dueAt },
      activityType: "task_created",
      now,
    });
    created.push(task);
  }
  return created;
}

export function resolveCaseTemplate(
  db: MockDb,
  studentCase: StudentCase,
): CaseTemplate | undefined {
  if (studentCase.templateId) {
    const byId = db.caseTemplates.get(studentCase.templateId);
    if (byId) return byId;
  }
  return (
    db.caseTemplates.find(
      (tpl) => tpl.countrySlug === studentCase.targetCountry,
    ) ?? db.caseTemplates.find((tpl) => tpl.countrySlug === null)
  );
}

/** Required docs for current stage that are not approved. */
export function incompleteRequiredDocs(
  db: MockDb,
  caseId: string,
  stage: CaseStage,
): ChecklistItem[] {
  return db.checklistItems
    .filter(
      (item) =>
        item.caseId === caseId && item.stage === stage && item.required,
    )
    .filter((item) => {
      if (!item.documentType) return !item.done;
      if (!item.documentId) return true;
      const doc = db.documents.get(item.documentId);
      return !doc || doc.status !== "approved";
    });
}

export type CaseProgressStats = {
  progressPercent: number;
  incompleteDocsCount: number;
  pendingReviewDocsCount: number;
  nearestDeadline: string | null;
  lastActivityAt: string | null;
  assigneeName: string | null;
};

export function computeCaseStats(
  db: MockDb,
  studentCase: StudentCase,
): CaseProgressStats {
  const items = db.checklistItems.filter(
    (item) => item.caseId === studentCase.id,
  );
  const total = items.length;
  const done = items.filter((item) => item.done).length;
  const progressPercent =
    total === 0 ? 0 : Math.round((done / total) * 100);

  const docs = db.documents.filter((doc) => doc.caseId === studentCase.id);
  const incompleteDocsCount = items.filter((item) => {
    if (!item.required || !item.documentType) return false;
    if (!item.documentId) return true;
    const doc = db.documents.get(item.documentId);
    return !doc || doc.status !== "approved";
  }).length;

  const pendingReviewDocsCount = docs.filter(
    (doc) => doc.status === "pending" || doc.status === "uploaded",
  ).length;

  const openDeadlines = items
    .filter((item) => !item.done && item.dueDate)
    .map((item) => item.dueDate!)
    .sort();
  const nearestDeadline = openDeadlines[0] ?? null;

  const activities = db.activities
    .filter(
      (activity) =>
        activity.entityType === "case" &&
        activity.entityId === studentCase.id,
    )
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  const lastActivityAt = activities[0]?.createdAt ?? null;

  let assigneeName: string | null = null;
  if (studentCase.consultantId) {
    const consultant = db.consultants.get(studentCase.consultantId);
    const user = db.users.get(studentCase.consultantId);
    assigneeName = consultant?.name ?? user?.name ?? null;
  }

  return {
    progressPercent,
    incompleteDocsCount,
    pendingReviewDocsCount,
    nearestDeadline,
    lastActivityAt,
    assigneeName,
  };
}

export function enrichCase(
  db: MockDb,
  studentCase: StudentCase,
): StudentCase {
  return { ...studentCase, ...computeCaseStats(db, studentCase) };
}

export function addDaysIsoDate(fromIso: string, days: number): string {
  const d = new Date(`${fromIso}T00:00:00.000Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

export function isDeadlineWithinDays(
  deadline: string | null | undefined,
  withinDays: number,
  today = nowIso().slice(0, 10),
): boolean {
  if (!deadline) return false;
  const end = addDaysIsoDate(today, withinDays);
  return deadline >= today && deadline <= end;
}

export function pushDocumentVersion(
  document: StudentDocument,
): StudentDocument["versions"] {
  if (!document.fileId) return document.versions ?? [];
  return [
    ...(document.versions ?? []),
    {
      version: document.version,
      fileId: document.fileId,
      fileUrl: document.fileUrl ?? null,
      fileName: document.fileName ?? null,
      fileSize: document.fileSize ?? null,
      mimeType: document.mimeType ?? null,
      uploadedBy: document.uploadedBy ?? null,
      uploadedAt: document.updatedAt,
      status: document.status,
    },
  ];
}
