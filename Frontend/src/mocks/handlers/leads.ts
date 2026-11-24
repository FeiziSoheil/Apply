import type { z } from "zod";
import {
  activitySchema,
  assessmentProfileSchema,
  leadQuickContactSchema,
  newsletterSubscribeSchema,
  type Activity,
  type ActivityCreate,
  type ActivityListQuery,
  type ActivityUpdate,
  type Lead,
  type LeadAssigneeUpdate,
  type LeadConvert,
  type LeadCreate,
  type LeadFromAssessmentCreate,
  type LeadExportQuery,
  type LeadImportBody,
  type LeadImportQuery,
  type LeadListQuery,
  type LeadMerge,
  type LeadSource,
  type LeadStageUpdate,
  type LeadStatusUpdate,
  type LeadUpdate,
} from "@/contracts/leads";
import type { StudentCase } from "@/contracts/students";
import { defineRoute, parseOrThrow, type RouteImplementations } from "../contract";
import { getDb, type MockDb } from "../db";
import {
  buildDefaultChecklist,
  caseCode,
  createStageDefaultTasks,
  deriveCurrentStage,
  emptyStages,
} from "../domain/cases";
import {
  LEGACY_STATUS_TO_STAGE_KEY,
  assertLeadAccess,
  assertVersionMatch,
  bumpVersion,
  findLostReason,
  isTerminalKind,
  requireStage,
  stageByKey,
  wonStage,
  writeAudit,
} from "../domain/crm";
import {
  resolveInitialStageId,
  resolveLeadAssignee,
} from "../domain/crm-settings";
import {
  buildLeadExport,
  revertLeadImport,
  runLeadImport,
} from "../domain/lead-import-export";
import { emitDomainEvent } from "../domain-events";
import { recommendPrograms } from "../domain/recommendations";
import { requireUser } from "../domain/users";
import { apiError } from "../errors";
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

function findLead(db: MockDb, id: string): Lead {
  const lead = db.leads.get(id);
  if (!lead) throw apiError.notFound("سرنخ");
  return lead;
}

function baseLead(
  db: MockDb,
  source: LeadSource,
  now: string,
  extras: {
    targetCountries?: string[];
    utm?: Lead["utm"];
    assignedTo?: string | null;
  } = {},
): Omit<Lead, "name" | "mobile"> {
  const stageId = resolveInitialStageId(db);
  const stage = requireStage(db, stageId);
  const targetCountries = extras.targetCountries ?? [];
  const utm = extras.utm ?? null;
  const assignedTo =
    extras.assignedTo !== undefined
      ? extras.assignedTo
      : resolveLeadAssignee(db, { source, targetCountries, utm });
  return {
    id: newId(),
    source,
    stageId: stage.id,
    stageKind: stage.kind,
    lostReasonId: null,
    email: null,
    preferredContact: null,
    contactPreference: null,
    message: null,
    interestDegree: null,
    interestCountry: targetCountries[0] ?? null,
    targetCountries,
    tagIds: [],
    assessment: null,
    utm,
    assignedTo,
    nextFollowUpAt: null,
    lastActivityAt: now,
    priority: "normal",
    value: null,
    convertedCaseId: null,
    importId: null,
    archived: false,
    version: 1,
    createdAt: now,
    updatedAt: now,
  };
}

function touchActivity(db: MockDb, leadId: string, at: string): void {
  db.leads.update(leadId, { lastActivityAt: at, updatedAt: at });
}

function insertLeadCreatedSideEffects(
  db: MockDb,
  lead: Lead,
  actorId: string | null,
): void {
  emitDomainEvent(db, {
    actorId,
    action: "create",
    entityType: "lead",
    entityId: lead.id,
    notifications: lead.assignedTo
      ? [
          {
            userId: lead.assignedTo,
            type: actorId ? "lead_assigned" : "lead_new",
            title: actorId ? "سرنخ به شما تخصیص یافت" : "سرنخ جدید",
            body: `${lead.name} — ${lead.mobile}`,
            link: `/admin/leads/${lead.id}`,
          },
        ]
      : [],
  });
}

function openLeadWithMobile(db: MockDb, mobile: string): Lead | undefined {
  return db.leads.find(
    (lead) =>
      lead.mobile === mobile &&
      !lead.archived &&
      !isTerminalKind(lead.stageKind),
  );
}

function receipt(lead: Pick<Lead, "id" | "createdAt">) {
  return { id: lead.id, createdAt: lead.createdAt };
}

function applyStageChange(
  db: MockDb,
  lead: Lead,
  stageId: string,
  actorId: string | null,
  options: { lostReasonId?: string; note?: string | null },
): Lead {
  const toStage = requireStage(db, stageId);
  if (isTerminalKind(lead.stageKind)) {
    throw apiError.conflict("وضعیت سرنخ‌های نهایی (won / lost) قابل تغییر نیست");
  }
  if (lead.stageId === stageId) {
    throw apiError.conflict("سرنخ از قبل در همین مرحله است");
  }
  let lostReasonId: string | null = null;
  if (toStage.kind === "lost") {
    if (!options.lostReasonId) {
      throw apiError.invalidField("lostReasonId", "دلیل ریزش هنگام ورود به مرحله lost الزامی است");
    }
    findLostReason(db, options.lostReasonId);
    lostReasonId = options.lostReasonId;
  }
  const now = nowIso();
  const updated = db.leads.update(lead.id, {
    stageId: toStage.id,
    stageKind: toStage.kind,
    lostReasonId,
    version: bumpVersion(lead.version),
    lastActivityAt: now,
    updatedAt: now,
  });
  db.activities.insert({
    id: newId(),
    entityType: "lead",
    entityId: lead.id,
    leadId: lead.id,
    actorId,
    authorId: actorId,
    createdAt: now,
    type: "stage_change",
    fromStageId: lead.stageId,
    toStageId: toStage.id,
    lostReasonId,
    body: options.note ?? null,
  });
  writeAudit(db, {
    actorId,
    action: "stage_change",
    entityType: "lead",
    entityId: lead.id,
    diff: {
      before: { stageId: lead.stageId, stageKind: lead.stageKind },
      after: { stageId: toStage.id, stageKind: toStage.kind, lostReasonId },
    },
  });
  return updated;
}

function normalizeSearchDigits(value: string): string {
  return value
    .replace(/[۰-۹]/g, (digit) => String("۰۱۲۳۴۵۶۷۸۹".indexOf(digit)))
    .replace(/[٠-٩]/g, (digit) => String("٠١٢٣٤٥٦٧٨٩".indexOf(digit)));
}

function filterLeads(
  db: MockDb,
  query: LeadListQuery | LeadExportQuery,
  staffId: string | null,
): Lead[] {
  const from = query.createdFrom ? new Date(query.createdFrom).getTime() : null;
  const to = query.createdTo ? new Date(query.createdTo).getTime() : null;
  const legacyStageId =
    query.status && LEGACY_STATUS_TO_STAGE_KEY[query.status]
      ? stageByKey(db, LEGACY_STATUS_TO_STAGE_KEY[query.status])?.id
      : undefined;
  const stageIds = query.stageIds?.length
    ? new Set(query.stageIds)
    : query.stageId
      ? new Set([query.stageId])
      : null;
  const inactiveCutoff =
    query.inactiveDays !== undefined
      ? Date.now() - query.inactiveDays * 86_400_000
      : null;
  const now = Date.now();
  const qNormalized = query.q ? normalizeSearchDigits(query.q.trim()) : "";

  return db.leads
    .all()
    .filter((lead) => staffId === null || lead.assignedTo === staffId)
    .filter((lead) =>
      query.archived === undefined ? !lead.archived : lead.archived === query.archived,
    )
    .filter((lead) => !stageIds || stageIds.has(lead.stageId))
    .filter((lead) => !query.stageKind || lead.stageKind === query.stageKind)
    .filter((lead) => !legacyStageId || lead.stageId === legacyStageId)
    .filter((lead) => !query.source || lead.source === query.source)
    .filter((lead) => !query.assignedTo || lead.assignedTo === query.assignedTo)
    .filter(
      (lead) =>
        query.unassigned === undefined ||
        (lead.assignedTo === null) === query.unassigned,
    )
    .filter(
      (lead) =>
        !query.country ||
        lead.interestCountry === query.country ||
        lead.targetCountries.includes(query.country) ||
        (lead.assessment?.targetCountries.includes(query.country) ?? false),
    )
    .filter((lead) => !query.tagId || lead.tagIds.includes(query.tagId))
    .filter((lead) => !query.priority || lead.priority === query.priority)
    .filter((lead) => from === null || new Date(lead.createdAt).getTime() >= from)
    .filter((lead) => to === null || new Date(lead.createdAt).getTime() <= to)
    .filter((lead) => !query.mobile || lead.mobile === query.mobile)
    .filter(
      (lead) =>
        !query.utmCampaign || lead.utm?.campaign === query.utmCampaign,
    )
    .filter((lead) => {
      if (inactiveCutoff === null) return true;
      return new Date(lead.lastActivityAt).getTime() < inactiveCutoff;
    })
    .filter((lead) => {
      if (!query.overdueFollowUp) return true;
      return (
        lead.nextFollowUpAt !== null &&
        new Date(lead.nextFollowUpAt).getTime() < now
      );
    })
    .filter((lead) => {
      if (!qNormalized) return true;
      return matchesQuery(qNormalized, [
        lead.name,
        lead.mobile,
        normalizeSearchDigits(lead.mobile),
        lead.email,
        lead.message,
      ]);
    });
}

export const leadHandlers: RouteImplementations = {
  createLeadFromAssessment: defineRoute<{ body: LeadFromAssessmentCreate }>(({ body }) => {
    const db = getDb();
    const now = nowIso();
    const profile = parseOrThrow(assessmentProfileSchema, body);
    const preferred =
      body.preferredContact ?? body.contactPreference;
    const lead: Lead = {
      ...baseLead(db, "assessment", now, {
        targetCountries: profile.targetCountries,
        utm: body.utm ?? null,
      }),
      name: body.name,
      mobile: body.mobile,
      email: body.email ?? null,
      preferredContact: preferred,
      contactPreference: preferred,
      interestDegree: profile.targetDegree,
      interestCountry: profile.targetCountries[0] ?? null,
      assessment: profile,
      utm: body.utm ?? null,
    };
    db.leads.insert(lead);
    insertLeadCreatedSideEffects(db, lead, null);
    return created({
      ...receipt(lead),
      recommendations: recommendPrograms(profile, db.programs.all()),
    });
  }),

  createLeadQuickContact: defineRoute<{ body: unknown }>(
    ({ body }) => {
      const db = getDb();
      if (
        body &&
        typeof body === "object" &&
        "website" in body &&
        typeof body.website === "string" &&
        body.website.length > 0
      ) {
        return created({ id: newId(), createdAt: nowIso() });
      }
      const input = parseOrThrow(leadQuickContactSchema, body);
      const now = nowIso();
      const targetCountries = input.country ? [input.country] : [];
      const lead: Lead = {
        ...baseLead(db, input.source, now, {
          targetCountries,
          utm: input.utm ?? null,
        }),
        name: input.name ?? "بازدیدکننده سایت",
        mobile: input.mobile,
        email: input.email ?? null,
        message: input.message ?? null,
        interestDegree: input.degreeLevel ?? null,
        interestCountry: input.country ?? null,
        utm: input.utm ?? null,
      };
      db.leads.insert(lead);
      insertLeadCreatedSideEffects(db, lead, null);
      return created(receipt(lead));
    },
    { rawBody: true },
  ),

  subscribeNewsletter: defineRoute<{
    body: z.output<typeof newsletterSubscribeSchema>;
  }>(({ body }) => {
    const db = getDb();
    const duplicate = db.newsletter.find(
      (entry) =>
        Boolean(body.mobile && entry.mobile === body.mobile) ||
        Boolean(body.email && entry.email === body.email),
    );
    if (!duplicate) {
      const now = nowIso();
      db.newsletter.insert({
        id: newId(),
        ...(body.mobile ? { mobile: body.mobile } : {}),
        ...(body.email ? { email: body.email } : {}),
        createdAt: now,
      });
      if (body.mobile && !openLeadWithMobile(db, body.mobile)) {
        const lead: Lead = {
          ...baseLead(db, "newsletter", now, { utm: body.utm ?? null }),
          name: "عضو خبرنامه",
          mobile: body.mobile,
          email: body.email ?? null,
          utm: body.utm ?? null,
        };
        db.leads.insert(lead);
        insertLeadCreatedSideEffects(db, lead, null);
      }
    }
    return noContent();
  }),

  importLeads: defineRoute<{
    query: LeadImportQuery;
    body: LeadImportBody;
  }>(async ({ user, query, body }) => {
    const staff = requireUser(user);
    const dryRun = query.dryRun ?? body.dryRun ?? true;
    const report = await runLeadImport(getDb(), staff.id, {
      ...body,
      dryRun,
    });
    return ok(report);
  }),

  revertLeadImport: defineRoute<{ params: { importId: string } }>(
    ({ user, params }) => {
      const staff = requireUser(user);
      if (staff.role !== "admin") {
        throw apiError.forbidden("بازگردانی ورودی فقط برای مدیر مجاز است");
      }
      return ok(revertLeadImport(getDb(), staff.id, params.importId));
    },
  ),

  exportLeads: defineRoute<{ query: LeadExportQuery }>(async ({ user, query }) => {
    const staff = requireUser(user);
    const db = getDb();
    const staffId = staff.role === "consultant" ? staff.id : null;
    const rows = filterLeads(db, query, staffId);
    const result = await buildLeadExport(rows, query, query.format ?? "csv");
    emitDomainEvent(db, {
      actorId: staff.id,
      action: "export",
      entityType: "lead",
      entityId: null,
      diff: {
        before: null,
        after: {
          count: result.rowCount,
          format: result.format,
          columns: query.columns ?? null,
        },
      },
    });
    return ok(result);
  }),

  listLeads: defineRoute<{ query: LeadListQuery }>(({ user, query }) => {
    const staff = requireUser(user);
    const staffId = staff.role === "consultant" ? staff.id : null;
    const filtered = filterLeads(getDb(), query, staffId);
    const { sort, order } = resolveSort(query, { sort: "createdAt", order: "desc" });
    return pageResult(
      sortItems(filtered, sort, order, {
        createdAt: (lead) => lead.createdAt,
        updatedAt: (lead) => lead.updatedAt,
        lastActivityAt: (lead) => lead.lastActivityAt,
        nextFollowUpAt: (lead) => lead.nextFollowUpAt ?? "",
        priority: (lead) => ({ low: 0, normal: 1, high: 2 })[lead.priority],
        stageId: (lead) => lead.stageId,
      }),
      query,
    );
  }),

  createLead: defineRoute<{ body: LeadCreate }>(({ user, body }) => {
    const staff = requireUser(user);
    const db = getDb();
    if (openLeadWithMobile(db, body.mobile)) {
      throw apiError.conflict("برای این شماره موبایل سرنخ فعالی وجود دارد", {
        mobile: ["سرنخ فعالی با این شماره ثبت شده است"],
      });
    }
    if (body.assignedTo && !db.consultants.has(body.assignedTo)) {
      throw apiError.invalidField("assignedTo", "مشاور انتخاب‌شده وجود ندارد");
    }
    const now = nowIso();
    const preferred = body.preferredContact ?? null;
    const explicitAssignee =
      body.assignedTo ?? (staff.role === "consultant" ? staff.id : undefined);
    const lead: Lead = {
      ...baseLead(db, "manual", now, {
        targetCountries: body.targetCountries ?? [],
        assignedTo: explicitAssignee,
      }),
      name: body.name,
      mobile: body.mobile,
      email: body.email ?? null,
      message: body.message ?? null,
      preferredContact: preferred,
      contactPreference: preferred,
      tagIds: body.tagIds ?? [],
      priority: body.priority ?? "normal",
      value: body.value ?? null,
      nextFollowUpAt: body.nextFollowUpAt ?? null,
    };
    db.leads.insert(lead);
    insertLeadCreatedSideEffects(db, lead, staff.id);
    return created(lead);
  }),

  getLead: defineRoute<IdParams>(({ user, params }) => {
    const lead = findLead(getDb(), params.id);
    assertLeadAccess(requireUser(user), lead);
    return ok(lead);
  }),

  updateLead: defineRoute<IdParams & { body: LeadUpdate }>(
    ({ user, params, body, request }) => {
      const staff = requireUser(user);
      const db = getDb();
      const lead = findLead(db, params.id);
      assertLeadAccess(staff, lead);
      assertVersionMatch(request, lead.version);
      const preferred =
        body.preferredContact !== undefined
          ? body.preferredContact
          : body.contactPreference !== undefined
            ? body.contactPreference
            : undefined;
      const now = nowIso();
      const updated = db.leads.update(lead.id, {
        ...compact(body),
        ...(preferred !== undefined
          ? { preferredContact: preferred, contactPreference: preferred }
          : {}),
        version: bumpVersion(lead.version),
        updatedAt: now,
      });
      db.activities.insert({
        id: newId(),
        entityType: "lead",
        entityId: lead.id,
        leadId: lead.id,
        actorId: staff.id,
        authorId: staff.id,
        createdAt: now,
        type: "field_change",
        diff: { before: compact(body), after: compact(body) },
        body: null,
      });
      writeAudit(db, {
        actorId: staff.id,
        action: "update",
        entityType: "lead",
        entityId: lead.id,
      });
      return ok(updated);
    },
  ),

  deleteLead: defineRoute<IdParams>(({ user, params }) => {
    const staff = requireUser(user);
    const db = getDb();
    const lead = findLead(db, params.id);
    if (lead.convertedCaseId) {
      throw apiError.conflict("این سرنخ به پرونده دانشجو تبدیل شده و قابل حذف نیست");
    }
    db.activities.removeWhere(
      (activity) =>
        activity.entityId === lead.id || activity.leadId === lead.id,
    );
    db.leads.remove(lead.id);
    writeAudit(db, {
      actorId: staff.id,
      action: "delete",
      entityType: "lead",
      entityId: lead.id,
    });
    return noContent();
  }),

  updateLeadStage: defineRoute<IdParams & { body: LeadStageUpdate }>(
    ({ user, params, body, request }) => {
      const staff = requireUser(user);
      const db = getDb();
      const lead = findLead(db, params.id);
      assertLeadAccess(staff, lead);
      assertVersionMatch(request, lead.version);
      return ok(
        applyStageChange(db, lead, body.stageId, staff.id, {
          lostReasonId: body.lostReasonId,
          note: body.note,
        }),
      );
    },
  ),

  updateLeadStatus: defineRoute<IdParams & { body: LeadStatusUpdate }>(
    ({ user, params, body, request }) => {
      const staff = requireUser(user);
      const db = getDb();
      const lead = findLead(db, params.id);
      assertLeadAccess(staff, lead);
      assertVersionMatch(request, lead.version, false);
      const key = LEGACY_STATUS_TO_STAGE_KEY[body.status];
      const stage = key ? stageByKey(db, key) : undefined;
      if (!stage) throw apiError.invalidField("status", "وضعیت به مرحله معتبر نگاشت نشد");
      let lostReasonId = body.lostReasonId;
      if (body.status === "lost" && !lostReasonId) {
        const match = db.lostReasons.find(
          (reason) => reason.active && reason.title === body.lostReason,
        );
        lostReasonId = match?.id ?? db.lostReasons.all().find((r) => r.active)?.id;
      }
      return ok(
        applyStageChange(db, lead, stage.id, staff.id, {
          lostReasonId,
          note: body.note ?? body.lostReason,
        }),
      );
    },
  ),

  assignLead: defineRoute<IdParams & { body: LeadAssigneeUpdate }>(
    ({ user, params, body, request }) => {
      const staff = requireUser(user);
      const db = getDb();
      const lead = findLead(db, params.id);
      assertVersionMatch(request, lead.version, false);
      if (body.assigneeId && !db.consultants.has(body.assigneeId)) {
        throw apiError.invalidField("assigneeId", "مشاور انتخاب‌شده وجود ندارد");
      }
      const now = nowIso();
      const updated = db.leads.update(lead.id, {
        assignedTo: body.assigneeId,
        version: bumpVersion(lead.version),
        lastActivityAt: now,
        updatedAt: now,
      });
      emitDomainEvent(db, {
        actorId: staff.id,
        action: "assign",
        entityType: "lead",
        entityId: lead.id,
        diff: {
          before: { assignedTo: lead.assignedTo },
          after: { assignedTo: body.assigneeId },
        },
        activity: {
          id: newId(),
          entityType: "lead",
          entityId: lead.id,
          leadId: lead.id,
          actorId: staff.id,
          authorId: staff.id,
          createdAt: now,
          type: "assignment",
          fromAssigneeId: lead.assignedTo,
          toAssigneeId: body.assigneeId,
          body: null,
        },
        notifications: body.assigneeId
          ? [
              {
                userId: body.assigneeId,
                type: "lead_assigned",
                title: "سرنخ به شما تخصیص یافت",
                body: `${lead.name} — ${lead.mobile}`,
                link: `/admin/leads/${lead.id}`,
              },
            ]
          : [],
        now,
      });
      return ok(updated);
    },
  ),

  convertLeadToCase: defineRoute<IdParams & { body: LeadConvert }>(
    ({ user, params, body }) => {
      const staff = requireUser(user);
      const db = getDb();
      const lead = findLead(db, params.id);
      assertLeadAccess(staff, lead);
      if (lead.convertedCaseId) {
        throw apiError.conflict("این سرنخ قبلاً به پرونده تبدیل شده است");
      }
      if (lead.stageKind === "lost") {
        throw apiError.conflict("سرنخ ازدست‌رفته قابل تبدیل نیست");
      }
      if (!db.countries.find((country) => country.slug === body.targetCountry)) {
        throw apiError.invalidField("targetCountry", "کشور انتخاب‌شده وجود ندارد");
      }
      const unknownProgram = body.programIds.find((id) => !db.programs.has(id));
      if (unknownProgram) {
        throw apiError.invalidField("programIds", "یکی از برنامه‌های انتخاب‌شده وجود ندارد");
      }
      const consultantId =
        body.consultantId ??
        lead.assignedTo ??
        (staff.role === "consultant" ? staff.id : null);
      if (consultantId && !db.consultants.has(consultantId)) {
        throw apiError.invalidField("consultantId", "مشاور انتخاب‌شده وجود ندارد");
      }

      const now = nowIso();
      const student =
        db.users.find(
          (entry) => entry.role === "student" && entry.mobile === lead.mobile,
        ) ??
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

      const template =
        db.caseTemplates.find((tpl) => tpl.countrySlug === body.targetCountry) ??
        db.caseTemplates.find((tpl) => tpl.countrySlug === null);

      const stages = emptyStages().map((entry, index) =>
        index === 0
          ? { ...entry, status: "in_progress" as const, startedAt: now }
          : entry,
      );
      const currentStage = deriveCurrentStage(stages);
      const studentCase: StudentCase = {
        id: newId(),
        code: caseCode(db.cases.count() + 1),
        status: "active",
        studentId: student.id,
        studentName: student.name,
        consultantId,
        leadId: lead.id,
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
      db.cases.insert(studentCase);
      db.checklistItems.insertMany(buildDefaultChecklist(studentCase.id, now));
      createStageDefaultTasks(db, {
        studentCase,
        stageKey: currentStage,
        actorId: staff.id,
        now,
      });
      db.activities.insert({
        id: newId(),
        entityType: "case",
        entityId: studentCase.id,
        actorId: staff.id,
        authorId: staff.id,
        createdAt: now,
        type: "system",
        body: "پرونده از تبدیل سرنخ ایجاد شد",
      });
      writeAudit(db, {
        actorId: staff.id,
        action: "create",
        entityType: "case",
        entityId: studentCase.id,
      });

      const won = wonStage(db);
      if (lead.stageId !== won.id) {
        applyStageChange(db, lead, won.id, staff.id, {
          note: "تبدیل به پرونده دانشجو",
        });
      }
      db.leads.update(lead.id, {
        convertedCaseId: studentCase.id,
        assignedTo: lead.assignedTo ?? consultantId,
        updatedAt: now,
      });
      return created(studentCase);
    },
  ),

  listLeadDuplicates: defineRoute<IdParams>(({ user, params }) => {
    const staff = requireUser(user);
    const db = getDb();
    const lead = findLead(db, params.id);
    assertLeadAccess(staff, lead);
    const duplicates = db.leads
      .all()
      .filter((other) => other.id !== lead.id && !other.archived)
      .filter(
        (other) =>
          other.mobile === lead.mobile ||
          (Boolean(lead.email) && other.email === lead.email),
      );
    return ok({ leads: duplicates });
  }),

  mergeLead: defineRoute<IdParams & { body: LeadMerge }>(
    ({ user, params, body }) => {
      const staff = requireUser(user);
      const db = getDb();
      const source = findLead(db, params.id);
      const target = findLead(db, body.targetId);
      if (source.id === target.id) {
        throw apiError.conflict("نمی‌توان سرنخ را با خودش ادغام کرد");
      }
      if (source.archived) {
        throw apiError.conflict("سرنخ مبدأ قبلاً بایگانی شده است");
      }
      const now = nowIso();
      const tagIds = [...new Set([...target.tagIds, ...source.tagIds])];
      db.activities
        .filter(
          (activity) =>
            activity.entityId === source.id || activity.leadId === source.id,
        )
        .forEach((activity) => {
          db.activities.update(activity.id, {
            entityId: target.id,
            leadId: target.id,
          } as Partial<Activity>);
        });
      db.tasks
        .filter(
          (task) => task.relatedType === "lead" && task.relatedId === source.id,
        )
        .forEach((task) => {
          db.tasks.update(task.id, { relatedId: target.id });
        });
      db.bookings
        .filter((booking) => booking.leadId === source.id)
        .forEach((booking) => {
          db.bookings.update(booking.id, { leadId: target.id });
        });
      const updated = db.leads.update(target.id, {
        tagIds,
        version: bumpVersion(target.version),
        lastActivityAt: now,
        updatedAt: now,
        email: target.email ?? source.email,
        assignedTo: target.assignedTo ?? source.assignedTo,
      });
      db.leads.update(source.id, {
        archived: true,
        updatedAt: now,
        version: bumpVersion(source.version),
      });
      writeAudit(db, {
        actorId: staff.id,
        action: "merge",
        entityType: "lead",
        entityId: target.id,
        diff: {
          before: { sourceId: source.id },
          after: { targetId: target.id },
        },
      });
      return ok(updated);
    },
  ),

  listLeadActivities: defineRoute<IdParams & { query: ActivityListQuery }>(
    ({ user, params, query }) => {
      const db = getDb();
      const lead = findLead(db, params.id);
      assertLeadAccess(requireUser(user), lead);
      const items = db.activities
        .filter(
          (activity) =>
            activity.entityId === lead.id || activity.leadId === lead.id,
        )
        .filter((activity) => !query.type || activity.type === query.type)
        .filter((activity) =>
          matchesQuery(query.q, [
            "body" in activity ? (activity.body ?? null) : null,
          ]),
        );
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
    },
  ),

  createLeadActivity: defineRoute<IdParams & { body: ActivityCreate }>(
    ({ user, params, body }) => {
      const staff = requireUser(user);
      const db = getDb();
      const lead = findLead(db, params.id);
      assertLeadAccess(staff, lead);
      const now = nowIso();
      const base = {
        id: newId(),
        entityType: "lead" as const,
        entityId: lead.id,
        leadId: lead.id,
        actorId: staff.id,
        authorId: staff.id,
        createdAt: now,
      };
      let activity: Activity;
      switch (body.type) {
        case "note":
          activity = {
            ...base,
            type: "note",
            body: body.body,
            pinned: body.pinned ?? false,
          };
          break;
        case "call":
          activity = {
            ...base,
            type: "call",
            direction: body.direction ?? "outbound",
            outcome: body.outcome,
            durationSeconds: body.durationSeconds ?? null,
            body: body.body ?? null,
          };
          break;
        case "sms":
        case "whatsapp":
          activity = { ...base, type: body.type, body: body.body };
          break;
        case "email":
          activity = {
            ...base,
            type: "email",
            subject: body.subject ?? null,
            body: body.body,
          };
          break;
        case "meeting":
          activity = {
            ...base,
            type: "meeting",
            startsAt: body.startsAt ?? null,
            body: body.body ?? null,
          };
          break;
        default:
          throw apiError.validation({ type: ["نوع فعالیت پشتیبانی نمی‌شود"] });
      }
      db.activities.insert(activity);
      touchActivity(db, lead.id, now);
      return created(activitySchema.parse(activity));
    },
  ),

  updateActivity: defineRoute<IdParams & { body: ActivityUpdate }>(
    ({ user, params, body }) => {
      const staff = requireUser(user);
      const db = getDb();
      const activity = db.activities.get(params.id);
      if (!activity) throw apiError.notFound("فعالیت");
      if (activity.type !== "note") {
        throw apiError.conflict("فقط یادداشت قابل ویرایش است");
      }
      const actorId = activity.actorId ?? activity.authorId;
      if (staff.role !== "admin" && actorId !== staff.id) {
        throw apiError.forbidden();
      }
      const updated = db.activities.update(activity.id, {
        ...(body.body !== undefined ? { body: body.body } : {}),
        ...(body.pinned !== undefined ? { pinned: body.pinned } : {}),
      } as Partial<Activity>);
      return ok(activitySchema.parse(updated));
    },
  ),

  deleteActivity: defineRoute<IdParams>(({ user, params }) => {
    const staff = requireUser(user);
    if (staff.role !== "admin") throw apiError.forbidden();
    const db = getDb();
    if (!db.activities.remove(params.id)) throw apiError.notFound("فعالیت");
    return noContent();
  }),
};
