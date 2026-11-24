import type {
  AnnouncementView,
  CaseLinkOption,
  CaseLinkResult,
  StudentCaseView,
  StudentProfile,
  StudentTaskView,
} from "@/contracts/student-panel";
import type { Ticket, TicketMessage, TicketView } from "@/contracts/tickets";
import type { TicketMessageView } from "@/contracts/tickets";
import {
  CASE_STAGES,
  type StudentCase,
} from "@/contracts/students";
import type { MockDb } from "../db";
import { apiError } from "../errors";
import type { MockUser } from "../types";
import { DOCUMENT_TYPE_LABELS, STAGE_LABELS } from "./cases";
import { toIsoDate } from "../utils";

export {
  toDocumentView,
  listDocumentViewsForCase,
  findMyDocumentView,
  uploadStudentDocument,
  documentUploadSettings,
} from "./student-documents";

const NEXT_STEP: Record<string, string> = {
  consultation: "با مشاور هماهنگ کنید و سؤالاتتان را بپرسید.",
  documents: "مدارک ناقص را بارگذاری کنید تا بررسی شوند.",
  application: "فرم‌های اپلای را با راهنمایی مشاور تکمیل کنید.",
  offer: "نتیجه پذیرش را پیگیری کنید و مدارک تکمیلی را بفرستید.",
  visa: "مدارک ویزا را آماده کنید و وقت سفارت را رزرو کنید.",
  departure: "چک‌لیست سفر و هماهنگی‌های قبل از پرواز را انجام دهید.",
};

export function emptyEducation() {
  return {
    highestDegree: null,
    fieldOfStudy: null,
    gpa: null,
    universityName: null,
  };
}

export function toStudentProfile(user: MockUser, db?: MockDb): StudentProfile {
  let assessment = null;
  if (db && user.mobile) {
    const lead = db.leads.find((l) => l.mobile === user.mobile);
    if (lead?.assessment) assessment = lead.assessment;
  }
  return {
    id: user.id,
    name: user.name,
    mobile: user.mobile ?? "09000000000",
    email: user.email ?? null,
    city: user.city ?? null,
    birthDate: user.birthDate ?? null,
    education: user.education ?? emptyEducation(),
    activeCaseId: user.activeCaseId ?? null,
    version: user.version ?? 1,
    assessment,
    onboardingCompleted: user.onboardingCompleted ?? false,
    updatedAt: user.updatedAt,
  };
}

/** Student isolation: unknown / foreign → 404 (never 403). */
export function studentNotFound(what = "مورد درخواستی"): never {
  throw apiError.notFound(what);
}

export function casesForStudent(db: MockDb, studentId: string): StudentCase[] {
  return db.cases.filter((entry) => entry.studentId === studentId);
}

export function requireStudentCase(
  db: MockDb,
  user: MockUser,
  caseId?: string | null,
): StudentCase {
  const mine = casesForStudent(db, user.id);
  if (mine.length === 0) studentNotFound("پرونده");
  if (caseId) {
    const found = mine.find((entry) => entry.id === caseId);
    if (!found) studentNotFound("پرونده");
    return found;
  }
  if (user.activeCaseId) {
    const active = mine.find((entry) => entry.id === user.activeCaseId);
    if (active) return active;
  }
  return mine[0];
}

export function toCaseLinkOption(entry: StudentCase): CaseLinkOption {
  return {
    id: entry.id,
    code: entry.code,
    studentName: entry.studentName,
    currentStageTitle: STAGE_LABELS[entry.currentStage] ?? entry.currentStage,
    targetCountry: entry.targetCountry,
    targetDegree: entry.targetDegree,
  };
}

/**
 * On OTP login: link user to cases/leads matching mobile.
 * Multiple → select; none → CTA consultation message.
 */
export function resolveCaseLinkOnLogin(
  db: MockDb,
  user: MockUser,
): CaseLinkResult {
  const byStudent = casesForStudent(db, user.id);
  const leadMatches = db.leads.filter((lead) => lead.mobile === user.mobile);
  const caseFromLeads = leadMatches
    .map((lead) => db.cases.find((entry) => entry.leadId === lead.id))
    .filter((entry): entry is StudentCase => Boolean(entry));

  const unmatchedByMobile = db.cases.filter(
    (entry) =>
      entry.studentId !== user.id &&
      (db.users.get(entry.studentId)?.mobile === user.mobile ||
        (entry.leadId
          ? db.leads.get(entry.leadId)?.mobile === user.mobile
          : false)),
  );

  const candidates = new Map<string, StudentCase>();
  for (const entry of [...byStudent, ...caseFromLeads, ...unmatchedByMobile]) {
    candidates.set(entry.id, entry);
  }
  const list = [...candidates.values()];

  for (const entry of list) {
    if (entry.studentId !== user.id) {
      db.cases.update(entry.id, {
        studentId: user.id,
        studentName: user.name,
        updatedAt: new Date().toISOString(),
      });
    }
  }

  if (list.length === 0) {
    db.users.update(user.id, { activeCaseId: null });
    return {
      status: "none",
      message: "پرونده‌ای پیدا نشد",
      cases: [],
      activeCaseId: null,
    };
  }

  if (list.length === 1) {
    const only = list[0];
    db.users.update(user.id, { activeCaseId: only.id });
    return {
      status: "linked",
      cases: [toCaseLinkOption(only)],
      activeCaseId: only.id,
    };
  }

  const activeStillValid =
    user.activeCaseId && list.some((entry) => entry.id === user.activeCaseId);
  if (!activeStillValid) {
    db.users.update(user.id, { activeCaseId: null });
  }
  return {
    status: "select",
    message: "چند پرونده مرتبط پیدا شد؛ یکی را انتخاب کنید",
    cases: list.map(toCaseLinkOption),
    activeCaseId: activeStillValid ? user.activeCaseId! : null,
  };
}

export function toStudentCaseView(
  db: MockDb,
  studentCase: StudentCase,
): StudentCaseView {
  const currentKey = studentCase.stageKey ?? studentCase.currentStage;
  const stageIndex = CASE_STAGES.indexOf(studentCase.currentStage);
  const stages = CASE_STAGES.map((key, index) => ({
    key,
    title: STAGE_LABELS[key],
    status:
      index < stageIndex
        ? ("done" as const)
        : index === stageIndex
          ? ("current" as const)
          : ("upcoming" as const),
  }));

  const consultant = studentCase.consultantId
    ? db.consultants.get(studentCase.consultantId)
    : null;
  const staffUser = studentCase.consultantId
    ? db.users.get(studentCase.consultantId)
    : null;
  const deadlines = db.checklistItems
    .filter(
      (item) =>
        item.caseId === studentCase.id &&
        !item.done &&
        item.dueDate !== null,
    )
    .map((item) => ({ title: item.title, dueDate: item.dueDate! }))
    .sort((a, b) => a.dueDate.localeCompare(b.dueDate))
    .slice(0, 5);

  const stageHistory = [...(studentCase.stageHistory ?? [])]
    .sort((a, b) => a.enteredAt.localeCompare(b.enteredAt))
    .map((entry) => ({
      stageKey: entry.stageKey,
      stageTitle:
        STAGE_LABELS[entry.stageKey as keyof typeof STAGE_LABELS] ??
        entry.stageKey,
      enteredAt: entry.enteredAt,
    }));

  const country = db.countries.find(
    (row) => row.slug === studentCase.targetCountry,
  );
  const program =
    (studentCase.programIds ?? [])
      .map((id) => db.programs.get(id))
      .find((row) => row !== undefined) ?? null;
  const university = program
    ? db.universities.find((row) => row.slug === program.universitySlug)
    : null;

  const recentUpdates: StudentCaseView["recentUpdates"] = [];
  for (const doc of db.documents.filter(
    (row) => row.caseId === studentCase.id && row.status === "approved",
  )) {
    recentUpdates.push({
      id: `doc-approved:${doc.id}`,
      title: `مدرک ${doc.title || DOCUMENT_TYPE_LABELS[doc.type]} تأیید شد`,
      occurredAt: doc.updatedAt,
    });
  }
  for (const entry of stageHistory.slice(-3)) {
    recentUpdates.push({
      id: `stage:${entry.stageKey}:${entry.enteredAt}`,
      title: `ورود به مرحلهٔ ${entry.stageTitle}`,
      occurredAt: entry.enteredAt,
    });
  }
  recentUpdates.sort((a, b) => b.occurredAt.localeCompare(a.occurredAt));

  return {
    id: studentCase.id,
    code: studentCase.code,
    currentStageKey: currentKey,
    currentStageTitle: STAGE_LABELS[studentCase.currentStage] ?? currentKey,
    stages,
    progressPercent: studentCase.progressPercent ?? 0,
    advisor: consultant
      ? {
          name: consultant.name,
          photoFileId: null,
          photoUrl: consultant.photo.startsWith("http")
            ? consultant.photo
            : null,
          publicPhone: staffUser?.mobile ?? null,
          publicEmail: staffUser?.email ?? null,
        }
      : null,
    deadlines,
    nextStepHint: NEXT_STEP[studentCase.currentStage] ?? "با مشاور خود هماهنگ کنید.",
    lastUpdated: studentCase.updatedAt,
    targetCountry: studentCase.targetCountry,
    targetDegree: studentCase.targetDegree,
    stageHistory,
    targetProgram: {
      countrySlug: studentCase.targetCountry,
      countryName: country?.nameFa ?? null,
      degree: studentCase.targetDegree,
      programTitle: program?.nameFa ?? null,
      universityName: university?.nameFa ?? null,
      languageRequirement: program?.languageRequirement ?? null,
      minGpa: program?.minGpa ?? null,
      duration: program?.duration ?? null,
    },
    recentUpdates: recentUpdates.slice(0, 5),
  };
}

export function buildStudentTasks(
  db: MockDb,
  user: MockUser,
  studentCase: StudentCase,
): StudentTaskView[] {
  const tasks: StudentTaskView[] = [];
  const today = toIsoDate(new Date());

  for (const item of db.checklistItems.filter(
    (row) => row.caseId === studentCase.id && !row.done,
  )) {
    const overdue = item.dueDate !== null && item.dueDate < today;
    tasks.push({
      id: `checklist:${item.id}`,
      kind: item.documentType ? "upload_document" : "fill_form",
      title: item.title,
      description: item.description,
      status: overdue ? "overdue" : "todo",
      dueDate: item.dueDate,
      actionHref: "/panel/documents",
      relatedId: item.documentId,
    });
  }

  for (const doc of db.documents.filter(
    (row) =>
      row.caseId === studentCase.id &&
      (row.status === "not_uploaded" ||
        row.status === "rejected" ||
        row.status === "pending"),
  )) {
    if (tasks.some((task) => task.relatedId === doc.id)) continue;
    tasks.push({
      id: `doc:${doc.id}`,
      kind: "upload_document",
      title:
        doc.status === "rejected"
          ? `اصلاح ${doc.title}`
          : `بارگذاری ${doc.title}`,
      description:
        doc.status === "rejected"
          ? (doc.rejectionReason ?? "مدرک رد شده؛ لطفاً دوباره بفرستید.")
          : null,
      status: "todo",
      dueDate: null,
      actionHref: "/panel/documents",
      relatedId: doc.id,
    });
  }

  const invoices = db.invoices.filter((invoice) => invoice.studentId === user.id);
  for (const invoice of invoices) {
    for (const installment of db.installments.filter(
      (row) => row.invoiceId === invoice.id,
    )) {
      if (
        installment.status === "paid" ||
        installment.status === "cancelled"
      ) {
        continue;
      }
      const overdue =
        installment.status === "overdue" ||
        (installment.status === "pending" && installment.dueDate < today);
      tasks.push({
        id: `inst:${installment.id}`,
        kind: "pay_installment",
        title: installment.title || `پرداخت قسط ${installment.sequence}`,
        description: null,
        status: overdue ? "overdue" : "todo",
        dueDate: installment.dueDate,
        actionHref: "/panel/payments",
        relatedId: installment.id,
      });
    }
  }

  for (const booking of db.bookings.filter(
    (row) =>
      row.userId === user.id &&
      (row.status === "confirmed" || row.status === "pending"),
  )) {
    tasks.push({
      id: `booking:${booking.id}`,
      kind: "attend_session",
      title: "حضور در جلسه مشاوره",
      description: null,
      status: "todo",
      dueDate: booking.startsAt.slice(0, 10),
      actionHref: "/panel/bookings",
      relatedId: booking.id,
    });
  }

  return tasks.slice(0, 40);
}

export function toTicketView(ticket: Ticket): TicketView {
  return {
    ...ticket,
    relatedCaseId: ticket.relatedCaseId ?? ticket.caseId,
  };
}

export function toTicketMessageView(message: TicketMessage): TicketMessageView {
  return {
    id: message.id,
    ticketId: message.ticketId,
    authorId: message.authorId,
    authorName: message.authorName,
    authorType: message.authorType,
    body: message.body,
    attachments: message.attachments,
    attachmentIds: message.attachmentIds,
    readAt: message.readAt,
    createdAt: message.createdAt,
  };
}

export function toAnnouncementView(
  row: {
    id: string;
    title: string;
    body: string;
    publishedAt: string | null;
  },
): AnnouncementView | null {
  if (!row.publishedAt) return null;
  return {
    id: row.id,
    title: row.title,
    body: row.body,
    publishedAt: row.publishedAt,
  };
}

export function assertStudentOwnsTicket(
  user: MockUser,
  ticket: Ticket | undefined,
): Ticket {
  if (!ticket || ticket.createdBy !== user.id) studentNotFound("تیکت");
  return ticket;
}
