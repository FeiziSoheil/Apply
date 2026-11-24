/**
 * Student document views + upload helpers (isolation → 404, no staff fields).
 */
import type {
  DocumentStageGroup,
  DocumentUploadSettings,
  DocumentView,
  DocumentViewsPayload,
} from "@/contracts/student-panel";
import type {
  CaseStage,
  ChecklistItem,
  DocumentType,
  StudentCase,
  StudentDocument,
} from "@/contracts/students";
import { CASE_STAGES } from "@/contracts/students";
import type { MockDb } from "../db";
import { emitDomainEvent } from "../domain-events";
import { apiError } from "../errors";
import type { MockUser, StoredFile } from "../types";
import {
  bumpVersion,
} from "./crm";
import {
  DOCUMENT_TYPE_LABELS,
  STAGE_LABELS,
  pushDocumentVersion,
} from "./cases";
import {
  requireStudentCase,
  studentNotFound,
} from "./student-panel";
import { newId, nowIso } from "../utils";

import { signMockFileUrl } from "../handlers/files";

export const STUDENT_MAX_UPLOAD_BYTES = 10 * 1024 * 1024;
export const STUDENT_ALLOWED_MIME = [
  "image/jpeg",
  "image/png",
  "application/pdf",
] as const;

export const DEFAULT_REVIEW_ETA_MESSAGE =
  "معمولاً ظرف یک روز کاری بررسی می‌شود";

/** Short expiration for signed student file links (15 minutes) */
const SIGNED_URL_TTL_MS = 15 * 60 * 1000;

const DOC_PREP: Record<DocumentType, string> = {
  passport: "اسکن رنگی صفحه اول پاسپورت با کیفیت خوانا (PDF یا JPG).",
  national_id: "تصویر پشت و روی کارت ملی یا شناسنامه عکس‌دار.",
  photo: "عکس پرسنلی زمینه روشن، بدون عینک دودی.",
  transcript: "ریزنمرات رسمی با مهر دانشگاه؛ در صورت نیاز ترجمه.",
  degree_certificate: "مدرک فارغ‌التحصیلی یا گواهی موقت معتبر.",
  language_certificate: "مدرک زبان معتبر (مثل IELTS/TOEFL) با تاریخ اعتبار.",
  cv: "رزومه به‌روز به زبان انگلیسی، حداکثر دو صفحه.",
  motivation_letter: "انگیزه‌نامه شخصی متناسب با رشته و دانشگاه هدف.",
  recommendation_letter: "توصیه‌نامه روی سربرگ با امضای استاد یا کارفرما.",
  bank_statement: "تمکن مالی بانکی با موجودی و تاریخ به‌روز.",
  admission_letter: "نامه پذیرش رسمی دانشگاه (در صورت دریافت).",
  visa: "ویزای صادرشده یا رسید درخواست ویزا.",
  other: "طبق توضیح مشاور، فایل خواسته‌شده را بارگذاری کنید.",
};

const DOC_SAMPLE: Partial<Record<DocumentType, string>> = {
  passport: "همه صفحات دارای مهر یا اطلاعات را در یک فایل بفرستید.",
  national_id: "پشت و رو را جدا یا در یک PDF ادغام کنید.",
  photo: "نمونه: پس‌زمینه سفید، صورت روبه‌دوربین.",
  transcript: "ترجمه رسمی در صورت نیاز دانشگاه هدف.",
};

function mimeExt(mime: string | null | undefined): string {
  if (mime === "application/pdf") return "pdf";
  if (mime === "image/png") return "png";
  if (mime === "image/jpeg") return "jpg";
  return "file";
}

/** Display name only — never the student's original filename */
export function safeDisplayFileName(
  type: DocumentType,
  mime: string | null | undefined,
): string {
  return `${DOCUMENT_TYPE_LABELS[type]}.${mimeExt(mime)}`;
}

export function signedMockUrl(
  fileId: string,
  storageKey: string,
  origin: string,
  expiresAt: string,
  userId?: string | null,
): string {
  const exp = Date.parse(expiresAt);
  const uid = userId ?? "";
  const sig = uid ? signMockFileUrl(fileId, uid, exp) : "mock";
  const userParam = uid ? `&uid=${encodeURIComponent(uid)}` : "";
  return `${origin}/mock-files/${fileId}/${encodeURIComponent(storageKey)}?exp=${exp}${userParam}&sig=${sig}`;
}

function fileExpiresAt(from = Date.now()): string {
  return new Date(from + SIGNED_URL_TTL_MS).toISOString();
}

function toFileRef(
  fileId: string,
  fileUrl: string | null | undefined,
  type: DocumentType,
  fileSize: number | null | undefined,
  mimeType: string | null | undefined,
  origin?: string,
  userId?: string | null,
): DocumentView["file"] {
  const expiresAt = fileExpiresAt();
  const storageKey = `${fileId}.${mimeExt(mimeType)}`;
  const downloadUrl =
    origin != null
      ? signedMockUrl(fileId, storageKey, origin, expiresAt, userId)
      : (fileUrl ?? signedMockUrl(fileId, storageKey, "http://localhost", expiresAt, userId));
  return {
    fileId,
    downloadUrl,
    expiresAt,
    fileName: safeDisplayFileName(type, mimeType),
    fileSize: fileSize ?? null,
    mimeType: mimeType ?? null,
  };
}

function stageGroupFor(
  stage: CaseStage | string,
  currentStage: CaseStage,
): DocumentStageGroup {
  const stageIndex = CASE_STAGES.indexOf(stage as CaseStage);
  const currentIndex = CASE_STAGES.indexOf(currentStage);
  if (stageIndex < 0 || currentIndex < 0) return "other";
  if (stageIndex === currentIndex) return "current";
  if (stageIndex === currentIndex + 1) return "upcoming";
  return "other";
}

export function documentUploadSettings(): DocumentUploadSettings {
  return {
    maxUploadBytes: STUDENT_MAX_UPLOAD_BYTES,
    allowedMimeTypes: [...STUDENT_ALLOWED_MIME],
    reviewEtaMessage: DEFAULT_REVIEW_ETA_MESSAGE,
  };
}

type ViewContext = {
  required: boolean;
  stageKey: string;
  stageTitle: string;
  stageGroup: DocumentStageGroup;
  checklistItemId: string | null;
  origin?: string;
  studentId?: string;
};

export function toDocumentView(
  doc: StudentDocument,
  ctx: ViewContext,
): DocumentView {
  const locked = doc.status === "approved";
  const canReplace =
    !locked &&
    (doc.status === "not_uploaded" ||
      doc.status === "rejected" ||
      doc.status === "pending" ||
      doc.status === "uploaded");

  const file =
    doc.fileId != null
      ? toFileRef(
          doc.fileId,
          doc.fileUrl,
          doc.type,
          doc.fileSize,
          doc.mimeType,
          ctx.origin,
          ctx.studentId,
        )
      : null;

  return {
    /** Stable for checklist-linked docs so UI ids survive first upload */
    id: ctx.checklistItemId ?? doc.id,
    type: doc.type,
    title: doc.title || DOCUMENT_TYPE_LABELS[doc.type],
    required: ctx.required,
    status: doc.status,
    rejectionReason:
      doc.status === "rejected"
        ? (doc.rejectionReason ?? doc.rejectReason ?? null)
        : null,
    file,
    versions: (doc.versions ?? []).map((version) => ({
      version: version.version,
      uploadedAt: version.uploadedAt,
      status: version.status,
      file: version.fileId
        ? toFileRef(
            version.fileId,
            version.fileUrl,
            doc.type,
            version.fileSize,
            version.mimeType,
            ctx.origin,
            ctx.studentId,
          )
        : null,
    })),
    prepGuide: DOC_PREP[doc.type],
    prepFormats: ["JPG", "PNG", "PDF"],
    prepMaxSizeBytes: STUDENT_MAX_UPLOAD_BYTES,
    prepSampleHint: DOC_SAMPLE[doc.type] ?? null,
    stageKey: ctx.stageKey,
    stageTitle: ctx.stageTitle,
    stageGroup: ctx.stageGroup,
    checklistItemId: ctx.checklistItemId,
    reviewedAt: doc.reviewedAt,
    locked,
    canReplace,
    updatedAt: doc.updatedAt,
  };
}

function placeholderView(
  item: ChecklistItem,
  studentCase: StudentCase,
): DocumentView {
  const type = item.documentType!;
  const stageKey = item.stage;
  return {
    id: item.id,
    type,
    title: item.title || DOCUMENT_TYPE_LABELS[type],
    required: item.required,
    status: "not_uploaded",
    rejectionReason: null,
    file: null,
    versions: [],
    prepGuide: DOC_PREP[type],
    prepFormats: ["JPG", "PNG", "PDF"],
    prepMaxSizeBytes: STUDENT_MAX_UPLOAD_BYTES,
    prepSampleHint: DOC_SAMPLE[type] ?? item.description,
    stageKey,
    stageTitle: STAGE_LABELS[stageKey] ?? stageKey,
    stageGroup: stageGroupFor(stageKey, studentCase.currentStage),
    checklistItemId: item.id,
    reviewedAt: null,
    locked: false,
    canReplace: true,
    updatedAt: item.updatedAt,
  };
}

function contextForDoc(
  db: MockDb,
  doc: StudentDocument,
  studentCase: StudentCase,
  origin?: string,
): ViewContext {
  const item =
    (doc.checklistItemId
      ? db.checklistItems.get(doc.checklistItemId)
      : undefined) ??
    db.checklistItems.find((entry) => entry.documentId === doc.id);

  const stageKey = item?.stage ?? studentCase.currentStage;
  return {
    required: item?.required ?? true,
    stageKey,
    stageTitle: STAGE_LABELS[stageKey as CaseStage] ?? stageKey,
    stageGroup: stageGroupFor(stageKey, studentCase.currentStage),
    checklistItemId: item?.id ?? doc.checklistItemId ?? null,
    origin,
    studentId: studentCase.studentId,
  };
}

export function listDocumentViewsForCase(
  db: MockDb,
  studentCase: StudentCase,
  origin?: string,
): DocumentViewsPayload {
  const checklist = db.checklistItems.filter(
    (item) => item.caseId === studentCase.id && item.documentType !== null,
  );
  const docs = db.documents.filter((doc) => doc.caseId === studentCase.id);
  const byChecklist = new Map(
    docs
      .filter((doc) => doc.checklistItemId)
      .map((doc) => [doc.checklistItemId as string, doc]),
  );
  const linkedIds = new Set(
    checklist.map((item) => item.documentId).filter(Boolean) as string[],
  );

  const items: DocumentView[] = [];

  for (const item of checklist) {
    const linked =
      (item.documentId ? db.documents.get(item.documentId) : undefined) ??
      byChecklist.get(item.id);
    if (linked) {
      items.push(
        toDocumentView(linked, contextForDoc(db, linked, studentCase, origin)),
      );
    } else {
      items.push(placeholderView(item, studentCase));
    }
  }

  for (const doc of docs) {
    if (linkedIds.has(doc.id)) continue;
    if (doc.checklistItemId && byChecklist.has(doc.checklistItemId)) continue;
    if (items.some((entry) => entry.id === doc.id)) continue;
    items.push(
      toDocumentView(doc, contextForDoc(db, doc, studentCase, origin)),
    );
  }

  const requiredItems = items.filter((item) => item.required);
  const approvedRequired = requiredItems.filter(
    (item) => item.status === "approved",
  ).length;

  return {
    items,
    progress: {
      approvedRequired,
      totalRequired: requiredItems.length,
    },
    settings: documentUploadSettings(),
  };
}

export function findMyDocumentView(
  db: MockDb,
  user: MockUser,
  id: string,
  origin?: string,
): DocumentView {
  const studentCase = requireStudentCase(db, user);
  const payload = listDocumentViewsForCase(db, studentCase, origin);
  const found = payload.items.find((item) => item.id === id);
  if (!found) studentNotFound("مدرک");
  return found;
}

function caseActivityBase(
  caseId: string,
  actorId: string,
  now = nowIso(),
) {
  return {
    id: newId(),
    entityType: "case" as const,
    entityId: caseId,
    actorId,
    authorId: actorId,
    createdAt: now,
  };
}

function applyFileToDocument(
  db: MockDb,
  existing: StudentDocument,
  file: StoredFile,
  actor: MockUser,
  now: string,
): StudentDocument {
  if (existing.status === "approved") {
    throw apiError.conflict(
      "این مدرک تأیید شده و قفل است. برای تغییر با مشاور تماس بگیرید.",
    );
  }
  const versions = pushDocumentVersion(existing);
  return db.documents.update(existing.id, {
    status: "uploaded",
    rejectionReason: null,
    rejectReason: null,
    fileId: file.id,
    fileUrl: file.url,
    fileName: safeDisplayFileName(existing.type, file.mimeType),
    fileSize: file.size,
    mimeType: file.mimeType,
    uploadedBy: actor.id,
    reviewedBy: null,
    reviewedAt: null,
    versions,
    version: bumpVersion(existing.version),
    updatedAt: now,
  });
}

/**
 * Student upload / replace. Notifies case consultant + writes Activity.
 * Never logs original filenames (fileId only in audit).
 */
function resolveChecklistItem(
  db: MockDb,
  studentCase: StudentCase,
  input: { documentId?: string; checklistItemId?: string },
): ChecklistItem | undefined {
  if (input.checklistItemId) {
    const item = db.checklistItems.get(input.checklistItemId);
    if (!item || item.caseId !== studentCase.id || !item.documentType) {
      studentNotFound("مدرک");
    }
    return item;
  }
  if (input.documentId) {
    const asChecklist = db.checklistItems.get(input.documentId);
    if (
      asChecklist &&
      asChecklist.caseId === studentCase.id &&
      asChecklist.documentType
    ) {
      return asChecklist;
    }
  }
  return undefined;
}

export function uploadStudentDocument(
  db: MockDb,
  user: MockUser,
  input: {
    fileId: string;
    documentId?: string;
    checklistItemId?: string;
  },
  origin?: string,
): DocumentView {
  const studentCase = requireStudentCase(db, user);
  const file = db.files.get(input.fileId);
  if (!file) throw apiError.invalidField("fileId", "فایل آپلودشده پیدا نشد");
  if (file.ownerId && file.ownerId !== user.id) {
    studentNotFound("فایل");
  }

  const now = nowIso();
  let document: StudentDocument | null = null;
  let item = resolveChecklistItem(db, studentCase, input);

  if (input.documentId) {
    const existing = db.documents.get(input.documentId);
    if (existing && existing.caseId === studentCase.id) {
      document = applyFileToDocument(db, existing, file, user, now);
      item =
        (document.checklistItemId
          ? db.checklistItems.get(document.checklistItemId)
          : undefined) ??
        db.checklistItems.find((entry) => entry.documentId === document!.id) ??
        item;
    }
  }

  if (!document && item?.documentId) {
    const existing = db.documents.get(item.documentId);
    if (existing) {
      document = applyFileToDocument(db, existing, file, user, now);
    }
  }

  if (!document) {
    if (!item?.documentType) studentNotFound("مدرک");
    document = db.documents.insert({
      id: newId(),
      caseId: studentCase.id,
      type: item.documentType,
      title: item.title || DOCUMENT_TYPE_LABELS[item.documentType],
      status: "uploaded",
      custom: false,
      checklistItemId: item.id,
      rejectionReason: null,
      rejectReason: null,
      fileId: file.id,
      fileUrl: file.url,
      fileName: safeDisplayFileName(item.documentType, file.mimeType),
      fileSize: file.size,
      mimeType: file.mimeType,
      uploadedBy: user.id,
      reviewedBy: null,
      reviewedAt: null,
      versions: [],
      version: 1,
      createdAt: now,
      updatedAt: now,
    });
  }

  if (item) {
    db.checklistItems.update(item.id, {
      documentId: document.id,
      done: true,
      updatedAt: now,
    });
  }

  const isReplace = (document.versions?.length ?? 0) > 0;
  emitDomainEvent(db, {
    actorId: user.id,
    action: isReplace ? "update" : "create",
    entityType: "document",
    entityId: document.id,
    diff: {
      before: null,
      after: { status: "uploaded", fileId: file.id },
    },
    activity: {
      ...caseActivityBase(studentCase.id, user.id, now),
      type: "document_event",
      documentId: document.id,
      event: isReplace ? "reuploaded" : "uploaded",
      body: isReplace
        ? `نسخه جدید «${document.title}» بارگذاری شد`
        : `مدرک «${document.title}» بارگذاری شد`,
    },
    notifications: studentCase.consultantId
      ? [
          {
            userId: studentCase.consultantId,
            type: "document_uploaded",
            title: "مدرک جدید بارگذاری شد",
            body: `${studentCase.studentName}: ${document.title}`,
            link: `/admin/cases/${studentCase.id}`,
          },
        ]
      : [],
    now,
  });

  db.cases.update(studentCase.id, { updatedAt: now });

  return toDocumentView(
    document,
    contextForDoc(db, document, studentCase, origin),
  );
}
