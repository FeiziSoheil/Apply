import { CASE_STAGES, type ChecklistItem } from "@/contracts/students";
import type {
  Activity,
  ActivityCreate,
  ActivityListQuery,
} from "@/contracts/leads";
import type {
  AdvanceCaseStage,
  ChecklistItemCreate,
  ChecklistItemUpdate,
  DocumentCreate,
  DocumentListQuery,
  DocumentRevert,
  DocumentReview,
  StageUpdate,
  StudentCase,
  StudentCaseCreate,
  StudentCaseListQuery,
  StudentCaseUpdate,
  StudentDocument,
} from "@/contracts/students";
import { defineRoute, type RouteImplementations } from "../contract";
import { getDb, type MockDb } from "../db";
import {
  DOCUMENT_TYPE_LABELS,
  applyStageUpdate,
  buildDefaultChecklist,
  caseCode,
  createStageDefaultTasks,
  deriveCurrentStage,
  emptyStages,
  enrichCase,
  incompleteRequiredDocs,
  isDeadlineWithinDays,
  pushDocumentVersion,
} from "../domain/cases";
import { assertCaseAccess, canAccessCase } from "../domain/access";
import {
  assertVersionMatch,
  bumpVersion,
  wonStage,
  writeAudit,
} from "../domain/crm";
import { getNoActivityDays } from "../domain/crm-settings";
import { emitDomainEvent } from "../domain-events";
import { requireUser } from "../domain/users";
import { apiError } from "../errors";
import type { MockUser } from "../types";
import {
  compact,
  created,
  matchesQuery,
  newId,
  noContent,
  nowIso,
  ok,
  pageResult,
  resolveSort,
  sortItems,
} from "../utils";

type IdParams = { params: { id: string } };

function findCase(db: MockDb, id: string): StudentCase {
  const found = db.cases.get(id);
  if (!found) throw apiError.notFound("پرونده");
  return found;
}

function findDocument(db: MockDb, id: string): StudentDocument {
  const found = db.documents.get(id);
  if (!found) throw apiError.notFound("مدرک");
  return found;
}

function caseActivityBase(
  caseId: string,
  actorId: string | null,
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

function writeCaseActivity(db: MockDb, activity: Activity): Activity {
  db.activities.insert(activity);
  db.cases.update(activity.entityId, { updatedAt: activity.createdAt });
  return activity;
}

function listCases(db: MockDb, user: MockUser, query: StudentCaseListQuery) {
  const filtered = db.cases
    .all()
    .filter((entry) => canAccessCase(user, entry))
    .filter((entry) => !query.status || entry.status === query.status)
    .filter((entry) => !query.stage || entry.currentStage === query.stage)
    .filter((entry) => !query.consultantId || entry.consultantId === query.consultantId)
    .filter((entry) => !query.studentId || entry.studentId === query.studentId)
    .filter((entry) => !query.country || entry.targetCountry === query.country)
    .filter((entry) => matchesQuery(query.q, [entry.code, entry.studentName]))
    .map((entry) => enrichCase(db, entry))
    .filter((entry) => {
      if (!query.docsPendingReview) return true;
      return (entry.pendingReviewDocsCount ?? 0) > 0;
    })
    .filter((entry) => {
      if (query.deadlineWithinDays === undefined) return true;
      return isDeadlineWithinDays(
        entry.nearestDeadline,
        query.deadlineWithinDays,
      );
    })
    .filter((entry) => {
      if (!query.noActivity) return true;
      if (!entry.lastActivityAt) return true;
      const days = getNoActivityDays(db);
      const cutoff = Date.now() - days * 86_400_000;
      return new Date(entry.lastActivityAt).getTime() < cutoff;
    });

  const { sort, order } = resolveSort(query, { sort: "updatedAt", order: "desc" });
  return sortItems(filtered, sort, order, {
    createdAt: (entry) => entry.createdAt,
    updatedAt: (entry) => entry.updatedAt,
    currentStage: (entry) => CASE_STAGES.indexOf(entry.currentStage),
    progressPercent: (entry) => entry.progressPercent ?? 0,
    nearestDeadline: (entry) => entry.nearestDeadline ?? "",
    lastActivityAt: (entry) => entry.lastActivityAt ?? "",
  });
}

function assertProgramsExist(db: MockDb, ids: readonly string[]): void {
  if (ids.some((id) => !db.programs.has(id))) {
    throw apiError.invalidField("programIds", "یکی از برنامه‌های انتخاب‌شده وجود ندارد");
  }
}

function assertCountryExists(db: MockDb, slug: string): void {
  if (!db.countries.find((country) => country.slug === slug)) {
    throw apiError.invalidField("targetCountry", "کشور انتخاب‌شده وجود ندارد");
  }
}

function touchCase(db: MockDb, caseId: string): void {
  db.cases.update(caseId, { updatedAt: nowIso() });
}

function buildCaseActivityFromCreate(
  caseId: string,
  actorId: string,
  body: ActivityCreate,
): Activity {
  const base = caseActivityBase(caseId, actorId);
  switch (body.type) {
    case "note":
      return { ...base, type: "note", body: body.body, pinned: body.pinned ?? false };
    case "call":
      return {
        ...base,
        type: "call",
        direction: body.direction ?? "outbound",
        outcome: body.outcome,
        durationSeconds: body.durationSeconds ?? null,
        body: body.body ?? null,
      };
    case "sms":
      return { ...base, type: "sms", body: body.body };
    case "whatsapp":
      return { ...base, type: "whatsapp", body: body.body };
    case "email":
      return {
        ...base,
        type: "email",
        subject: body.subject ?? null,
        body: body.body,
      };
    case "meeting":
      return {
        ...base,
        type: "meeting",
        startsAt: body.startsAt ?? null,
        body: body.body ?? null,
      };
    default: {
      const _exhaustive: never = body;
      return _exhaustive;
    }
  }
}

export const studentHandlers: RouteImplementations = {
  /* ----- Cases ----- */

  listCases: defineRoute<{ query: StudentCaseListQuery }>(({ user, query }) =>
    pageResult(listCases(getDb(), requireUser(user), query), query),
  ),

  listMyCases: defineRoute(({ user }) => {
    const me = requireUser(user);
    const db = getDb();
    return ok(
      db.cases
        .filter((entry) => entry.studentId === me.id)
        .map((entry) => enrichCase(db, entry)),
    );
  }),

  createCase: defineRoute<{ body: StudentCaseCreate }>(({ user, body }) => {
    const staff = requireUser(user);
    const db = getDb();
    assertCountryExists(db, body.targetCountry);
    assertProgramsExist(db, body.programIds);

    const lead = body.leadId ? db.leads.get(body.leadId) : undefined;
    if (body.leadId && !lead) throw apiError.invalidField("leadId", "سرنخ پیدا نشد");
    if (lead?.convertedCaseId) {
      throw apiError.conflict("این سرنخ قبلاً به پرونده تبدیل شده است");
    }

    const now = nowIso();
    let student: MockUser | undefined = body.studentId
      ? db.users.get(body.studentId)
      : undefined;
    if (body.studentId && student?.role !== "student") {
      throw apiError.invalidField("studentId", "دانشجو پیدا نشد");
    }
    if (!student && lead) {
      student =
        db.users.find((entry) => entry.role === "student" && entry.mobile === lead.mobile) ??
        db.users.insert({
          id: newId(),
          name: lead.name,
          role: "student",
          permissions: [],
          mobile: lead.mobile,
          ...(lead.email ? { email: lead.email } : {}),
          status: "active",
          lastLoginAt: null,
          createdAt: now,
          updatedAt: now,
        });
    }
    if (!student) throw apiError.invalidField("studentId", "دانشجو پیدا نشد");

    const consultantId =
      body.consultantId ?? lead?.assignedTo ?? (staff.role === "consultant" ? staff.id : null);
    if (consultantId && !db.consultants.has(consultantId)) {
      throw apiError.invalidField("consultantId", "مشاور انتخاب‌شده وجود ندارد");
    }

    const template =
      db.caseTemplates.find((tpl) => tpl.countrySlug === body.targetCountry) ??
      db.caseTemplates.find((tpl) => tpl.countrySlug === null);

    const stages = emptyStages().map((entry, index) =>
      index === 0
        ? { ...entry, status: "in_progress" as const, startedAt: now }
        : entry,
    );
    const currentStage = deriveCurrentStage(stages);
    const entity: StudentCase = {
      id: newId(),
      code: caseCode(db.cases.count() + 1),
      status: "active",
      studentId: student.id,
      studentName: student.name,
      consultantId,
      leadId: lead?.id ?? null,
      targetCountry: body.targetCountry,
      targetDegree: body.targetDegree,
      programIds: body.programIds,
      currentStage,
      stageKey: currentStage,
      stages,
      stageHistory: [
        {
          stageKey: currentStage,
          enteredAt: now,
          exitedAt: null,
          actorId: staff.id,
          note: null,
        },
      ],
      templateId: template?.id ?? null,
      version: 1,
      createdAt: now,
      updatedAt: now,
    };
    db.cases.insert(entity);
    db.checklistItems.insertMany(buildDefaultChecklist(entity.id, now));
    createStageDefaultTasks(db, {
      studentCase: entity,
      stageKey: currentStage,
      actorId: staff.id,
      now,
    });
    writeCaseActivity(db, {
      ...caseActivityBase(entity.id, staff.id, now),
      type: "system",
      body: "پرونده ایجاد شد",
    });
    writeAudit(db, {
      actorId: staff.id,
      action: "create",
      entityType: "case",
      entityId: entity.id,
    });
    if (lead) {
      const won = wonStage(db);
      db.leads.update(lead.id, {
        convertedCaseId: entity.id,
        stageId: won.id,
        stageKind: won.kind,
        lostReasonId: null,
        updatedAt: now,
      });
    }
    return created(enrichCase(db, entity));
  }),

  getCase: defineRoute<IdParams>(({ user, params }) => {
    const db = getDb();
    const entity = findCase(db, params.id);
    assertCaseAccess(requireUser(user), entity);
    return ok(enrichCase(db, entity));
  }),

  updateCase: defineRoute<IdParams & { body: StudentCaseUpdate }>(
    ({ user, params, body, request }) => {
      const staff = requireUser(user);
      const db = getDb();
      const entity = findCase(db, params.id);
      assertCaseAccess(staff, entity);
      assertVersionMatch(request, entity.version);
      if (body.targetCountry) assertCountryExists(db, body.targetCountry);
      if (body.programIds) assertProgramsExist(db, body.programIds);
      if (body.consultantId && !db.consultants.has(body.consultantId)) {
        throw apiError.invalidField("consultantId", "مشاور انتخاب‌شده وجود ندارد");
      }
      if (
        staff.role === "consultant" &&
        body.consultantId !== undefined &&
        body.consultantId !== staff.id
      ) {
        throw apiError.forbidden(
          "مشاور نمی‌تواند پرونده را به مشاور دیگری منتقل کند",
        );
      }
      const updated = db.cases.update(entity.id, {
        ...compact(body),
        version: bumpVersion(entity.version),
        updatedAt: nowIso(),
      });
      writeAudit(db, {
        actorId: staff.id,
        action: "update",
        entityType: "case",
        entityId: entity.id,
        diff: { before: compact(body) ? { ...compact(body) } : null, after: compact(body) },
      });
      writeCaseActivity(db, {
        ...caseActivityBase(entity.id, staff.id),
        type: "field_change",
        diff: {
          before: {},
          after: { ...compact(body) },
        },
        body: "پرونده ویرایش شد",
      });
      return ok(enrichCase(db, updated));
    },
  ),

  updateCaseStage: defineRoute<{
    params: { id: string; stage: StudentCase["currentStage"] };
    body: StageUpdate;
  }>(({ user, params, body, request }) => {
    const staff = requireUser(user);
    const db = getDb();
    const entity = findCase(db, params.id);
    assertCaseAccess(staff, entity);
    assertVersionMatch(request, entity.version, false);
    if (entity.status === "closed") {
      throw apiError.conflict("پرونده بسته شده و قابل ویرایش نیست");
    }
    const now = nowIso();
    const stages = applyStageUpdate(
      entity.stages,
      params.stage,
      body.status,
      body.note,
      now,
    );
    const currentStage = deriveCurrentStage(stages);
    const updated = db.cases.update(entity.id, {
      stages,
      currentStage,
      stageKey: currentStage,
      version: bumpVersion(entity.version),
      updatedAt: now,
    });
    writeAudit(db, {
      actorId: staff.id,
      action: "stage_change",
      entityType: "case",
      entityId: entity.id,
    });
    return ok(enrichCase(db, updated));
  }),

  advanceCaseStage: defineRoute<IdParams & { body: AdvanceCaseStage }>(
    ({ user, params, body, request }) => {
      const staff = requireUser(user);
      const db = getDb();
      const entity = findCase(db, params.id);
      assertCaseAccess(staff, entity);
      assertVersionMatch(request, entity.version);
      if (entity.status === "closed") {
        throw apiError.conflict("پرونده بسته شده و قابل ویرایش نیست");
      }
      const now = nowIso();
      const currentIndex = CASE_STAGES.indexOf(entity.currentStage);
      const nextKey =
        body.toStageKey ??
        CASE_STAGES[Math.min(currentIndex + 1, CASE_STAGES.length - 1)];
      if (!CASE_STAGES.includes(nextKey as (typeof CASE_STAGES)[number])) {
        throw apiError.invalidField("toStageKey", "مرحله نامعتبر است");
      }
      if (nextKey === entity.currentStage) {
        throw apiError.conflict("پرونده از قبل در همین مرحله است");
      }
      const nextStage = nextKey as StudentCase["currentStage"];

      const incomplete = incompleteRequiredDocs(db, entity.id, entity.currentStage);
      if (incomplete.length > 0) {
        if (!body.overrideIncomplete) {
          throw apiError.conflict(
            "مدارک الزامی این مرحله هنوز تأیید نشده‌اند",
            {
              documents: incomplete.map((item) => item.title),
            },
          );
        }
        if (staff.role !== "admin") {
          throw apiError.forbidden("فقط مدیر می‌تواند الزامات مرحله را نادیده بگیرد");
        }
      }

      // Mark current stage completed, then open next
      let stages = applyStageUpdate(
        entity.stages,
        entity.currentStage,
        "completed",
        body.note,
        now,
      );
      stages = applyStageUpdate(stages, nextStage, "in_progress", body.note, now);

      const history = [
        ...entity.stageHistory.map((entry) =>
          entry.exitedAt ? entry : { ...entry, exitedAt: now },
        ),
        {
          stageKey: nextStage,
          enteredAt: now,
          exitedAt: null,
          actorId: staff.id,
          note: body.overrideIncomplete
            ? `نادیده گرفتن الزامات: ${body.overrideReason}`
            : (body.note ?? null),
        },
      ];
      const updated = db.cases.update(entity.id, {
        stages,
        currentStage: deriveCurrentStage(stages),
        stageKey: nextStage,
        stageHistory: history,
        version: bumpVersion(entity.version),
        updatedAt: now,
      });

      createStageDefaultTasks(db, {
        studentCase: updated,
        stageKey: nextStage,
        actorId: staff.id,
        now,
      });

      writeCaseActivity(db, {
        ...caseActivityBase(entity.id, staff.id, now),
        type: "system",
        body: body.overrideIncomplete
          ? `مرحله به ${nextStage} پیش رفت (نادیده گرفتن الزامات)`
          : `مرحله به ${nextStage} پیش رفت`,
      });
      writeAudit(db, {
        actorId: staff.id,
        action: "stage_change",
        entityType: "case",
        entityId: entity.id,
        diff: {
          before: { stage: entity.currentStage },
          after: {
            stage: nextStage,
            override: body.overrideIncomplete ?? false,
            overrideReason: body.overrideReason ?? null,
          },
        },
      });
      return ok(enrichCase(db, updated));
    },
  ),

  listCaseActivities: defineRoute<
    IdParams & { query: ActivityListQuery }
  >(({ user, params, query }) => {
    const db = getDb();
    assertCaseAccess(requireUser(user), findCase(db, params.id));
    const items = db.activities
      .filter(
        (activity) =>
          activity.entityType === "case" && activity.entityId === params.id,
      )
      .filter((activity) => !query.type || activity.type === query.type);
    const { sort, order } = resolveSort(query, {
      sort: "createdAt",
      order: "desc",
    });
    return pageResult(
      sortItems(items, sort, order, {
        createdAt: (activity) => activity.createdAt,
      }),
      query,
    );
  }),

  createCaseActivity: defineRoute<IdParams & { body: ActivityCreate }>(
    ({ user, params, body }) => {
      const staff = requireUser(user);
      const db = getDb();
      assertCaseAccess(staff, findCase(db, params.id));
      const activity = writeCaseActivity(
        db,
        buildCaseActivityFromCreate(params.id, staff.id, body),
      );
      writeAudit(db, {
        actorId: staff.id,
        action: "create",
        entityType: "activity",
        entityId: activity.id,
      });
      return created(activity);
    },
  ),

  /* ----- Documents ----- */

  listCaseDocuments: defineRoute<IdParams & { query: DocumentListQuery }>(
    ({ user, params, query }) => {
      const db = getDb();
      assertCaseAccess(requireUser(user), findCase(db, params.id));
      const items = db.documents
        .filter((document) => document.caseId === params.id)
        .filter((document) => !query.type || document.type === query.type)
        .filter((document) => !query.status || document.status === query.status)
        .filter((document) => matchesQuery(query.q, [document.title, document.fileName]));
      const { sort, order } = resolveSort(query, { sort: "createdAt", order: "desc" });
      return pageResult(
        sortItems(items, sort, order, {
          createdAt: (document) => document.createdAt,
          status: (document) => document.status,
        }),
        query,
      );
    },
  ),

  createCaseDocument: defineRoute<IdParams & { body: DocumentCreate }>(
    ({ user, params, body }) => {
      const actor = requireUser(user);
      const db = getDb();
      const entity = findCase(db, params.id);
      assertCaseAccess(actor, entity);

      const file = db.files.get(body.fileId);
      if (!file) throw apiError.invalidField("fileId", "فایل آپلودشده پیدا نشد");

      let item: ChecklistItem | undefined;
      if (body.checklistItemId) {
        item = db.checklistItems.get(body.checklistItemId);
        if (!item || item.caseId !== entity.id) {
          throw apiError.invalidField("checklistItemId", "آیتم چک‌لیست پیدا نشد");
        }
        if (item.documentId) {
          const existing = db.documents.get(item.documentId);
          if (existing?.status === "approved") {
            throw apiError.conflict(
              "مدرک تأییدشده قفل است؛ ابتدا باید توسط مدیر بازگردانی شود",
            );
          }
          if (existing) {
            const nowReplace = nowIso();
            const versions = pushDocumentVersion(existing);
            const replaced = db.documents.update(existing.id, {
              status: "uploaded",
              rejectionReason: null,
              rejectReason: null,
              fileId: file.id,
              fileUrl: file.url,
              fileName: file.name, // already UUID-based from POST /files
              fileSize: file.size,
              mimeType: file.mimeType,
              uploadedBy: actor.id,
              reviewedBy: null,
              reviewedAt: null,
              versions,
              version: bumpVersion(existing.version),
              updatedAt: nowReplace,
            });
            db.checklistItems.update(item.id, {
              documentId: replaced.id,
              done: true,
              updatedAt: nowReplace,
            });
            emitDomainEvent(db, {
              actorId: actor.id,
              action: "update",
              entityType: "document",
              entityId: replaced.id,
              activity: {
                ...caseActivityBase(entity.id, actor.id, nowReplace),
                type: "document_event",
                documentId: replaced.id,
                event: "reuploaded",
                body: `نسخه جدید «${replaced.title}» بارگذاری شد`,
              },
              notifications:
                entity.consultantId && actor.role === "student"
                  ? [
                      {
                        userId: entity.consultantId,
                        type: "document_uploaded",
                        title: "مدرک جدید بارگذاری شد",
                        body: `${entity.studentName}: ${replaced.title}`,
                        link: `/admin/cases/${entity.id}`,
                      },
                    ]
                  : [],
              now: nowReplace,
            });
            touchCase(db, entity.id);
            return created(replaced);
          }
        }
      }

      const now = nowIso();
      const document = db.documents.insert({
        id: newId(),
        caseId: entity.id,
        type: body.type,
        title: body.title ?? DOCUMENT_TYPE_LABELS[body.type],
        status: "uploaded",
        custom: body.custom ?? !body.checklistItemId,
        checklistItemId: body.checklistItemId ?? null,
        rejectionReason: null,
        rejectReason: null,
        fileId: file.id,
        fileUrl: file.url,
        fileName: file.name,
        fileSize: file.size,
        mimeType: file.mimeType,
        uploadedBy: actor.id,
        reviewedBy: null,
        reviewedAt: null,
        versions: [],
        version: 1,
        createdAt: now,
        updatedAt: now,
      });
      if (item) {
        db.checklistItems.update(item.id, {
          documentId: document.id,
          done: true,
          updatedAt: now,
        });
      }
      emitDomainEvent(db, {
        actorId: actor.id,
        action: "create",
        entityType: "document",
        entityId: document.id,
        activity: {
          ...caseActivityBase(entity.id, actor.id, now),
          type: "document_event",
          documentId: document.id,
          event: "uploaded",
          body: `مدرک «${document.title}» بارگذاری شد`,
        },
        notifications:
          entity.consultantId && actor.id !== entity.consultantId
            ? [
                {
                  userId: entity.consultantId,
                  type: "document_uploaded",
                  title: "مدرک جدید بارگذاری شد",
                  body: `${entity.studentName}: ${document.title}`,
                  link: `/admin/cases/${entity.id}`,
                },
              ]
            : [],
        now,
      });
      touchCase(db, entity.id);
      return created(document);
    },
  ),

  getDocument: defineRoute<IdParams>(({ user, params }) => {
    const db = getDb();
    const document = findDocument(db, params.id);
    assertCaseAccess(requireUser(user), findCase(db, document.caseId));
    return ok(document);
  }),

  deleteDocument: defineRoute<IdParams>(({ user, params }) => {
    const actor = requireUser(user);
    const db = getDb();
    const document = findDocument(db, params.id);
    const studentCase = findCase(db, document.caseId);
    assertCaseAccess(actor, studentCase);

    if (document.status === "approved") {
      throw apiError.conflict(
        "مدرک تأییدشده قفل است؛ ابتدا باید توسط مدیر بازگردانی شود",
      );
    }

    if (actor.role === "student") {
      if (document.uploadedBy !== actor.id) throw apiError.forbidden();
      if (
        document.status !== "pending" &&
        document.status !== "uploaded" &&
        document.status !== "rejected" &&
        document.status !== "not_uploaded"
      ) {
        throw apiError.conflict("این مدرک قابل حذف نیست");
      }
    } else if (actor.role !== "admin") {
      throw apiError.forbidden("فقط مدیر می‌تواند مدرک را حذف کند");
    }

    const now = nowIso();
    for (const item of db.checklistItems.filter(
      (entry) => entry.documentId === document.id,
    )) {
      db.checklistItems.update(item.id, {
        documentId: null,
        done: false,
        updatedAt: now,
      });
    }
    db.documents.remove(document.id);
    writeCaseActivity(db, {
      ...caseActivityBase(studentCase.id, actor.id),
      type: "document_event",
      documentId: document.id,
      event: "deleted",
      body: `مدرک «${document.title}» حذف شد`,
    });
    writeAudit(db, {
      actorId: actor.id,
      action: "delete",
      entityType: "document",
      entityId: document.id,
    });
    return noContent();
  }),

  reviewDocument: defineRoute<IdParams & { body: DocumentReview }>(
    ({ user, params, body, request }) => {
      const staff = requireUser(user);
      const db = getDb();
      const document = findDocument(db, params.id);
      const studentCase = findCase(db, document.caseId);
      assertCaseAccess(staff, studentCase);
      assertVersionMatch(request, document.version, false);
      if (document.status !== "pending" && document.status !== "uploaded") {
        throw apiError.conflict("فقط مدارک در انتظار بررسی قابل بررسی هستند");
      }
      const now = nowIso();
      const rejectReason =
        body.status === "rejected" ? (body.rejectionReason ?? null) : null;
      const reviewed = db.documents.update(document.id, {
        status: body.status,
        rejectionReason: rejectReason,
        rejectReason,
        reviewedBy: staff.id,
        reviewedAt: now,
        version: bumpVersion(document.version),
        updatedAt: now,
      });
      if (body.status === "rejected") {
        for (const item of db.checklistItems.filter(
          (entry) => entry.documentId === document.id,
        )) {
          db.checklistItems.update(item.id, { done: false, updatedAt: now });
        }
      } else {
        for (const item of db.checklistItems.filter(
          (entry) => entry.documentId === document.id,
        )) {
          db.checklistItems.update(item.id, { done: true, updatedAt: now });
        }
      }

      emitDomainEvent(db, {
        actorId: staff.id,
        action: "update",
        entityType: "document",
        entityId: document.id,
        diff: {
          before: { status: document.status },
          after: { status: body.status, rejectionReason: rejectReason },
        },
        activity: {
          ...caseActivityBase(studentCase.id, staff.id, now),
          type: "document_event",
          documentId: document.id,
          event: body.status,
          body:
            body.status === "approved"
              ? `مدرک «${document.title}» تأیید شد`
              : `مدرک «${document.title}» رد شد: ${rejectReason}`,
        },
        notifications: [
          {
            userId: studentCase.studentId,
            type:
              body.status === "approved"
                ? "document_approved"
                : "document_rejected",
            title:
              body.status === "approved" ? "مدرک تأیید شد" : "مدرک رد شد",
            body:
              body.status === "approved"
                ? `مدرک «${document.title}» تأیید شد.`
                : `مدرک «${document.title}» رد شد. دلیل: ${rejectReason}`,
            link: `/panel/documents`,
          },
        ],
        now,
      });

      if (body.status === "rejected" && rejectReason) {
        writeCaseActivity(db, {
          ...caseActivityBase(studentCase.id, staff.id, now),
          type: "email",
          subject: `رد مدرک: ${document.title}`,
          body: `سلام ${studentCase.studentName}،\n\nمدرک «${document.title}» رد شد.\nدلیل: ${rejectReason}\n\nلطفاً نسخه اصلاح‌شده را بارگذاری کنید.`,
        });
      }

      touchCase(db, studentCase.id);
      return ok(reviewed);
    },
  ),

  revertDocument: defineRoute<IdParams & { body: DocumentRevert }>(
    ({ user, params, body, request }) => {
      const staff = requireUser(user);
      if (staff.role !== "admin") {
        throw apiError.forbidden("فقط مدیر می‌تواند مدرک تأییدشده را بازگردانی کند");
      }
      const db = getDb();
      const document = findDocument(db, params.id);
      const studentCase = findCase(db, document.caseId);
      assertVersionMatch(request, document.version);
      if (document.status !== "approved") {
        throw apiError.conflict("فقط مدرک تأییدشده قابل بازگردانی است");
      }
      const now = nowIso();
      const reverted = db.documents.update(document.id, {
        status: "uploaded",
        reviewedBy: null,
        reviewedAt: null,
        rejectionReason: null,
        rejectReason: null,
        version: bumpVersion(document.version),
        updatedAt: now,
      });
      for (const item of db.checklistItems.filter(
        (entry) => entry.documentId === document.id,
      )) {
        db.checklistItems.update(item.id, { done: false, updatedAt: now });
      }
      writeCaseActivity(db, {
        ...caseActivityBase(studentCase.id, staff.id),
        type: "document_event",
        documentId: document.id,
        event: "reverted",
        body: `تأیید مدرک «${document.title}» لغو شد: ${body.reason}`,
      });
      writeAudit(db, {
        actorId: staff.id,
        action: "update",
        entityType: "document",
        entityId: document.id,
        diff: {
          before: { status: "approved" },
          after: { status: "uploaded", reason: body.reason },
        },
      });
      return ok(reverted);
    },
  ),

  /* ----- Checklist ----- */

  getCaseChecklist: defineRoute<IdParams>(({ user, params }) => {
    const db = getDb();
    assertCaseAccess(requireUser(user), findCase(db, params.id));
    const items = db.checklistItems
      .filter((item) => item.caseId === params.id)
      .sort((a, b) => CASE_STAGES.indexOf(a.stage) - CASE_STAGES.indexOf(b.stage));
    return ok({
      caseId: params.id,
      items,
      totalCount: items.length,
      doneCount: items.filter((item) => item.done).length,
    });
  }),

  createChecklistItem: defineRoute<IdParams & { body: ChecklistItemCreate }>(
    ({ user, params, body }) => {
      const staff = requireUser(user);
      const db = getDb();
      const entity = findCase(db, params.id);
      assertCaseAccess(staff, entity);
      const now = nowIso();
      const item = db.checklistItems.insert({
        id: newId(),
        caseId: entity.id,
        stage: body.stage,
        title: body.title,
        description: body.description ?? null,
        documentType: body.documentType ?? null,
        required: body.required,
        done: false,
        documentId: null,
        dueDate: body.dueDate ?? null,
        createdAt: now,
        updatedAt: now,
      });
      touchCase(db, entity.id);
      return created(item);
    },
  ),

  updateChecklistItem: defineRoute<{
    params: { id: string; itemId: string };
    body: ChecklistItemUpdate;
  }>(({ user, params, body }) => {
    const actor = requireUser(user);
    const db = getDb();
    assertCaseAccess(actor, findCase(db, params.id));
    const item = db.checklistItems.get(params.itemId);
    if (!item || item.caseId !== params.id) throw apiError.notFound("آیتم چک‌لیست");

    const patch = compact(body);
    if (actor.role === "student" && Object.keys(patch).some((key) => key !== "done")) {
      throw apiError.forbidden("دانشجو فقط می‌تواند وضعیت انجام‌شدن آیتم را تغییر دهد");
    }
    return ok(db.checklistItems.update(item.id, { ...patch, updatedAt: nowIso() }));
  }),

  deleteChecklistItem: defineRoute<{ params: { id: string; itemId: string } }>(
    ({ user, params }) => {
      const staff = requireUser(user);
      const db = getDb();
      assertCaseAccess(staff, findCase(db, params.id));
      const item = db.checklistItems.get(params.itemId);
      if (!item || item.caseId !== params.id) throw apiError.notFound("آیتم چک‌لیست");
      db.checklistItems.remove(item.id);
      return noContent();
    },
  ),
};
