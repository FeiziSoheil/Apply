import type {
  AssignmentRuleCreate,
  AssignmentRuleUpdate,
  AuditDiff,
  AuditLog,
  AuditLogListQuery,
  CaseTemplateCreate,
  CaseTemplateUpdate,
  LostReasonCreate,
  LostReasonUpdate,
  MessageTemplateCreate,
  MessageTemplateUpdate,
  NotificationBulkRead,
  NotificationListQuery,
  NotificationPreferencesUpdate,
  PipelineStageCreate,
  PipelineStageReorder,
  PipelineStageUpdate,
  RenderTemplateInput,
  ReportRangeQuery,
  SavedViewCreate,
  SavedViewListQuery,
  SavedViewUpdate,
  TagCreate,
  TagUpdate,
  TaskBulkComplete,
  TaskCountsQuery,
  TaskCreate,
  TaskListQuery,
  TaskSnooze,
  TaskUpdate,
  TimeseriesReportQuery,
} from "@/contracts/crm";
import {
  extractTemplateVariables,
  renderTemplate,
} from "@/contracts/crm";
import { defineRoute, type RouteImplementations } from "../contract";
import { getDb, type MockDb } from "../db";
import {
  assertKindCoverage,
  assertVersionMatch,
  bumpVersion,
} from "../domain/crm";
import {
  copyCaseTemplate,
  mergeTags,
  readAssignmentRulesSettings,
  readCampaignCostsSettings,
  readCaseTemplatesSettings,
  readCrmDefaultsSettings,
  readLostReasonsSettings,
  readMessageTemplatesSettings,
  readPipelineSettings,
  readTagsSettings,
  replaceAssignmentRules,
  replaceCampaignCosts,
  replaceCaseTemplates,
  replaceCrmDefaults,
  replaceLostReasons,
  replaceMessageTemplates,
  replacePipelineSettings,
  replaceTags,
  resetCrmSettingsTab,
  simulateAssignment,
} from "../domain/crm-settings";
import {
  emitDomainEvent,
  getNotificationPreferences,
  upsertNotificationPreferences,
} from "../domain-events";
import type {
  AssignmentRulesSettingsReplace,
  AssignmentSimulateInput,
  CampaignCostsSettingsReplace,
  CaseTemplateCopy,
  CaseTemplatesSettingsReplace,
  CrmDefaultsSettingsReplace,
  LostReasonsSettingsReplace,
  MessageTemplatesSettingsReplace,
  PipelineSettingsReplace,
  TagMerge,
  TagsSettingsReplace,
} from "@/contracts/crm-settings";
import {
  assertTaskAccess,
  clearLeadFollowUpIfMatched,
  computeTaskCounts,
  emitTaskSideEffects,
  matchesDueFilter,
  processTaskReminders,
  resolveSnoozeUntil,
  scopeTaskAssigneeId,
} from "../domain/tasks";
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

function scopeConsultantId(
  userId: string,
  role: string,
  requested?: string,
): string | undefined {
  if (role === "consultant") return userId;
  return requested;
}

function inRange(iso: string, from: string, to: string): boolean {
  const ms = new Date(iso).getTime();
  return ms >= new Date(from).getTime() && ms <= new Date(to).getTime();
}

function filterAuditLogs(db: MockDb, query: AuditLogListQuery): AuditLog[] {
  return db.auditLogs
    .all()
    .filter((log) => !query.actorId || log.actorId === query.actorId)
    .filter((log) => !query.entityType || log.entityType === query.entityType)
    .filter((log) => !query.entityId || log.entityId === query.entityId)
    .filter((log) => !query.action || log.action === query.action)
    .filter((log) => !query.from || new Date(log.createdAt) >= new Date(query.from))
    .filter((log) => !query.to || new Date(log.createdAt) <= new Date(query.to))
    .filter((log) =>
      matchesQuery(query.q, [
        log.id,
        log.entityId,
        log.entityType,
        log.action,
        log.actorId,
      ]),
    );
}

function summarizeAuditDiff(diff: AuditDiff | null): string {
  if (!diff) return "";
  const keys = new Set([
    ...Object.keys(diff.before ?? {}),
    ...Object.keys(diff.after ?? {}),
  ]);
  return [...keys].slice(0, 12).join("|");
}

export const crmHandlers: RouteImplementations = {
  /* ----- Versioned CRM settings ----- */

  getPipelineSettings: defineRoute(() => ok(readPipelineSettings(getDb()))),

  replacePipelineSettings: defineRoute<{
    body: PipelineSettingsReplace;
  }>(({ user, body, request }) => {
    const actor = requireUser(user);
    return ok(replacePipelineSettings(getDb(), request, actor.id, body));
  }),

  resetPipelineSettings: defineRoute(
    ({ user, request }) => {
      const actor = requireUser(user);
      return ok(resetCrmSettingsTab(getDb(), request, actor.id, "pipeline"));
    },
  ),

  getLostReasonsSettings: defineRoute(() =>
    ok(readLostReasonsSettings(getDb())),
  ),

  replaceLostReasonsSettings: defineRoute<{
    body: LostReasonsSettingsReplace;
  }>(({ user, body, request }) => {
    const actor = requireUser(user);
    return ok(replaceLostReasons(getDb(), request, actor.id, body.items));
  }),

  resetLostReasonsSettings: defineRoute(
    ({ user, request }) => {
      const actor = requireUser(user);
      return ok(resetCrmSettingsTab(getDb(), request, actor.id, "lostReasons"));
    },
  ),

  getTagsSettings: defineRoute(() => ok(readTagsSettings(getDb()))),

  replaceTagsSettings: defineRoute<{
    body: TagsSettingsReplace;
  }>(({ user, body, request }) => {
    const actor = requireUser(user);
    return ok(replaceTags(getDb(), request, actor.id, body.items));
  }),

  resetTagsSettings: defineRoute(({ user, request }) => {
    const actor = requireUser(user);
    return ok(resetCrmSettingsTab(getDb(), request, actor.id, "tags"));
  }),

  mergeTags: defineRoute<{ body: TagMerge }>(({ user, body }) => {
    const actor = requireUser(user);
    return ok(mergeTags(getDb(), actor.id, body.sourceId, body.targetId));
  }),

  getAssignmentRulesSettings: defineRoute(() =>
    ok(readAssignmentRulesSettings(getDb())),
  ),

  replaceAssignmentRulesSettings: defineRoute<{
    body: AssignmentRulesSettingsReplace;
  }>(({ user, body, request }) => {
    const actor = requireUser(user);
    return ok(replaceAssignmentRules(getDb(), request, actor.id, body.items));
  }),

  resetAssignmentRulesSettings: defineRoute(
    ({ user, request }) => {
      const actor = requireUser(user);
      return ok(
        resetCrmSettingsTab(getDb(), request, actor.id, "assignmentRules"),
      );
    },
  ),

  simulateAssignmentRule: defineRoute<{ body: AssignmentSimulateInput }>(
    ({ body }) => ok(simulateAssignment(getDb(), body)),
  ),

  getMessageTemplatesSettings: defineRoute(() =>
    ok(readMessageTemplatesSettings(getDb())),
  ),

  replaceMessageTemplatesSettings: defineRoute<{
    body: MessageTemplatesSettingsReplace;
  }>(({ user, body, request }) => {
    const actor = requireUser(user);
    return ok(
      replaceMessageTemplates(getDb(), request, actor.id, body.items),
    );
  }),

  resetMessageTemplatesSettings: defineRoute(
    ({ user, request }) => {
      const actor = requireUser(user);
      return ok(
        resetCrmSettingsTab(getDb(), request, actor.id, "messageTemplates"),
      );
    },
  ),

  getCaseTemplatesSettings: defineRoute(() =>
    ok(readCaseTemplatesSettings(getDb())),
  ),

  replaceCaseTemplatesSettings: defineRoute<{
    body: CaseTemplatesSettingsReplace;
  }>(({ user, body, request }) => {
    const actor = requireUser(user);
    return ok(replaceCaseTemplates(getDb(), request, actor.id, body.items));
  }),

  resetCaseTemplatesSettings: defineRoute(
    ({ user, request }) => {
      const actor = requireUser(user);
      return ok(
        resetCrmSettingsTab(getDb(), request, actor.id, "caseTemplates"),
      );
    },
  ),

  copyCaseTemplate: defineRoute<{ body: CaseTemplateCopy }>(
    ({ user, body }) => {
      const actor = requireUser(user);
      return created(
        copyCaseTemplate(
          getDb(),
          actor.id,
          body.sourceId,
          body.countrySlug,
          body.title,
        ),
      );
    },
  ),

  getCampaignCostsSettings: defineRoute(() =>
    ok(readCampaignCostsSettings(getDb())),
  ),

  replaceCampaignCostsSettings: defineRoute<{
    body: CampaignCostsSettingsReplace;
  }>(({ user, body, request }) => {
    const actor = requireUser(user);
    return ok(replaceCampaignCosts(getDb(), request, actor.id, body.items));
  }),

  resetCampaignCostsSettings: defineRoute(
    ({ user, request }) => {
      const actor = requireUser(user);
      return ok(
        resetCrmSettingsTab(getDb(), request, actor.id, "campaignCosts"),
      );
    },
  ),

  getCrmDefaultsSettings: defineRoute(() =>
    ok(readCrmDefaultsSettings(getDb())),
  ),

  replaceCrmDefaultsSettings: defineRoute<{
    body: CrmDefaultsSettingsReplace;
  }>(({ user, body, request }) => {
    const actor = requireUser(user);
    return ok(replaceCrmDefaults(getDb(), request, actor.id, body));
  }),

  resetCrmDefaultsSettings: defineRoute(
    ({ user, request }) => {
      const actor = requireUser(user);
      return ok(resetCrmSettingsTab(getDb(), request, actor.id, "defaults"));
    },
  ),

  /* ----- Pipeline ----- */

  listPipelineStages: defineRoute(() => {
    const stages = getDb()
      .pipelineStages.all()
      .sort((a, b) => a.order - b.order);
    return ok(stages);
  }),

  createPipelineStage: defineRoute<{ body: PipelineStageCreate }>(({ body }) => {
    const db = getDb();
    if (db.pipelineStages.find((s) => s.key === body.key)) {
      throw apiError.conflict("کلید مرحله تکراری است", {
        key: ["این کلید قبلاً استفاده شده"],
      });
    }
    const now = nowIso();
    const order =
      body.order ??
      Math.max(0, ...db.pipelineStages.all().map((s) => s.order)) + 1;
    return created(
      db.pipelineStages.insert({
        id: newId(),
        key: body.key,
        title: body.title,
        order,
        color: body.color ?? "slate",
        kind: body.kind,
        wipLimit: body.wipLimit ?? null,
        createdAt: now,
        updatedAt: now,
      }),
    );
  }),

  updatePipelineStage: defineRoute<IdParams & { body: PipelineStageUpdate }>(
    ({ params, body }) => {
      const db = getDb();
      const stage = db.pipelineStages.get(params.id);
      if (!stage) throw apiError.notFound("مرحله");
      const next = {
        ...stage,
        ...compact(body),
        updatedAt: nowIso(),
      };
      const others = db.pipelineStages
        .all()
        .map((entry) => (entry.id === stage.id ? next : entry));
      assertKindCoverage(others);
      return ok(db.pipelineStages.update(stage.id, next));
    },
  ),

  deletePipelineStage: defineRoute<IdParams>(({ params }) => {
    const db = getDb();
    const stage = db.pipelineStages.get(params.id);
    if (!stage) throw apiError.notFound("مرحله");
    if (db.leads.find((lead) => lead.stageId === stage.id && !lead.archived)) {
      throw apiError.conflict("سرنخ‌هایی در این مرحله هستند و قابل حذف نیست");
    }
    const remaining = db.pipelineStages.all().filter((s) => s.id !== stage.id);
    assertKindCoverage(remaining);
    db.pipelineStages.remove(stage.id);
    return noContent();
  }),

  reorderPipelineStages: defineRoute<{ body: PipelineStageReorder }>(
    ({ body }) => {
      const db = getDb();
      const now = nowIso();
      for (const item of body.items) {
        if (!db.pipelineStages.has(item.id)) continue;
        db.pipelineStages.update(item.id, { order: item.order, updatedAt: now });
      }
      return ok(
        db.pipelineStages.all().sort((a, b) => a.order - b.order),
      );
    },
  ),

  /* ----- Lost reasons / tags ----- */

  listLostReasons: defineRoute(() => ok(getDb().lostReasons.all())),

  createLostReason: defineRoute<{ body: LostReasonCreate }>(({ body }) => {
    const now = nowIso();
    return created(
      getDb().lostReasons.insert({
        id: newId(),
        title: body.title,
        active: body.active ?? true,
        createdAt: now,
        updatedAt: now,
      }),
    );
  }),

  updateLostReason: defineRoute<IdParams & { body: LostReasonUpdate }>(
    ({ params, body }) => {
      const db = getDb();
      const reason = db.lostReasons.get(params.id);
      if (!reason) throw apiError.notFound("دلیل ریزش");
      return ok(
        db.lostReasons.update(reason.id, {
          ...compact(body),
          updatedAt: nowIso(),
        }),
      );
    },
  ),

  deleteLostReason: defineRoute<IdParams>(({ params }) => {
    const db = getDb();
    if (db.leads.find((lead) => lead.lostReasonId === params.id)) {
      throw apiError.conflict("این دلیل به سرنخ‌هایی متصل است");
    }
    if (!db.lostReasons.remove(params.id)) throw apiError.notFound("دلیل ریزش");
    return noContent();
  }),

  listTags: defineRoute(() => ok(getDb().tags.all())),

  createTag: defineRoute<{ body: TagCreate }>(({ body }) => {
    const db = getDb();
    if (db.tags.find((tag) => tag.title === body.title)) {
      throw apiError.conflict("برچسب تکراری است");
    }
    const now = nowIso();
    return created(
      db.tags.insert({
        id: newId(),
        title: body.title,
        color: body.color ?? "slate",
        createdAt: now,
        updatedAt: now,
      }),
    );
  }),

  updateTag: defineRoute<IdParams & { body: TagUpdate }>(({ params, body }) => {
    const db = getDb();
    const tag = db.tags.get(params.id);
    if (!tag) throw apiError.notFound("برچسب");
    return ok(db.tags.update(tag.id, { ...compact(body), updatedAt: nowIso() }));
  }),

  deleteTag: defineRoute<IdParams>(({ params }) => {
    const db = getDb();
    db.leads.all().forEach((lead) => {
      if (!lead.tagIds.includes(params.id)) return;
      db.leads.update(lead.id, {
        tagIds: lead.tagIds.filter((id) => id !== params.id),
      });
    });
    if (!db.tags.remove(params.id)) throw apiError.notFound("برچسب");
    return noContent();
  }),

  /* ----- Assignment rules ----- */

  listAssignmentRules: defineRoute(() =>
    ok(
      getDb()
        .assignmentRules.all()
        .sort((a, b) => a.order - b.order),
    ),
  ),

  createAssignmentRule: defineRoute<{ body: AssignmentRuleCreate }>(
    ({ body }) => {
      const db = getDb();
      const now = nowIso();
      return created(
        db.assignmentRules.insert({
          id: newId(),
          order:
            body.order ??
            Math.max(0, ...db.assignmentRules.all().map((r) => r.order)) + 1,
          active: body.active ?? true,
          conditions: body.conditions,
          strategy: body.strategy,
          consultantIds: body.consultantIds,
          createdAt: now,
          updatedAt: now,
        }),
      );
    },
  ),

  updateAssignmentRule: defineRoute<
    IdParams & { body: AssignmentRuleUpdate }
  >(({ params, body }) => {
    const db = getDb();
    const rule = db.assignmentRules.get(params.id);
    if (!rule) throw apiError.notFound("قانون تخصیص");
    return ok(
      db.assignmentRules.update(rule.id, {
        ...compact(body),
        updatedAt: nowIso(),
      }),
    );
  }),

  deleteAssignmentRule: defineRoute<IdParams>(({ params }) => {
    if (!getDb().assignmentRules.remove(params.id)) {
      throw apiError.notFound("قانون تخصیص");
    }
    return noContent();
  }),

  /* ----- Message templates ----- */

  listMessageTemplates: defineRoute(() => ok(getDb().messageTemplates.all())),

  createMessageTemplate: defineRoute<{ body: MessageTemplateCreate }>(
    ({ body }) => {
      const now = nowIso();
      return created(
        getDb().messageTemplates.insert({
          id: newId(),
          channel: body.channel,
          title: body.title,
          body: body.body,
          active: body.active ?? true,
          createdAt: now,
          updatedAt: now,
        }),
      );
    },
  ),

  updateMessageTemplate: defineRoute<
    IdParams & { body: MessageTemplateUpdate }
  >(({ params, body }) => {
    const db = getDb();
    const tpl = db.messageTemplates.get(params.id);
    if (!tpl) throw apiError.notFound("قالب");
    return ok(
      db.messageTemplates.update(tpl.id, {
        ...compact(body),
        updatedAt: nowIso(),
      }),
    );
  }),

  deleteMessageTemplate: defineRoute<IdParams>(({ params }) => {
    if (!getDb().messageTemplates.remove(params.id)) {
      throw apiError.notFound("قالب");
    }
    return noContent();
  }),

  renderMessageTemplate: defineRoute<{ body: RenderTemplateInput }>(
    ({ body }) => {
      const db = getDb();
      let text = body.body;
      if (body.templateId) {
        const tpl = db.messageTemplates.get(body.templateId);
        if (!tpl) throw apiError.invalidField("templateId", "قالب پیدا نشد");
        text = tpl.body;
      }
      if (!text) throw apiError.invalidField("body", "متن قالب خالی است");
      const used = extractTemplateVariables(text);
      const result = renderTemplate(text, body.variables);
      // Ensure declared vars without values are reported
      for (const variable of used) {
        if (
          (body.variables[variable] === undefined ||
            body.variables[variable] === "") &&
          !result.missingVariables.includes(variable)
        ) {
          result.missingVariables.push(variable);
        }
      }
      return ok(result);
    },
  ),

  /* ----- Case templates ----- */

  listCaseTemplates: defineRoute(() => ok(getDb().caseTemplates.all())),

  createCaseTemplate: defineRoute<{ body: CaseTemplateCreate }>(({ body }) => {
    const now = nowIso();
    return created(
      getDb().caseTemplates.insert({
        id: newId(),
        countrySlug: body.countrySlug ?? null,
        title: body.title,
        stages: body.stages,
        createdAt: now,
        updatedAt: now,
      }),
    );
  }),

  updateCaseTemplate: defineRoute<IdParams & { body: CaseTemplateUpdate }>(
    ({ params, body }) => {
      const db = getDb();
      const tpl = db.caseTemplates.get(params.id);
      if (!tpl) throw apiError.notFound("قالب پرونده");
      return ok(
        db.caseTemplates.update(tpl.id, {
          ...compact(body),
          updatedAt: nowIso(),
        }),
      );
    },
  ),

  deleteCaseTemplate: defineRoute<IdParams>(({ params }) => {
    const db = getDb();
    if (db.cases.find((entry) => entry.templateId === params.id)) {
      throw apiError.conflict("پرونده‌هایی با این قالب وجود دارد");
    }
    if (!db.caseTemplates.remove(params.id)) throw apiError.notFound("قالب پرونده");
    return noContent();
  }),

  /* ----- Tasks ----- */

  listTasks: defineRoute<{ query: TaskListQuery }>(({ user, query }) => {
    const staff = requireUser(user);
    const assigneeFilter = scopeTaskAssigneeId(staff, query.assigneeId);

    let items = getDb().tasks.all();
    items = items
      .filter((task) => !assigneeFilter || task.assigneeId === assigneeFilter)
      .filter((task) => !query.status || task.status === query.status)
      .filter((task) => !query.priority || task.priority === query.priority)
      .filter(
        (task) => !query.relatedType || task.relatedType === query.relatedType,
      )
      .filter((task) => !query.relatedId || task.relatedId === query.relatedId)
      .filter((task) => matchesQuery(query.q, [task.title, task.description]));

    if (query.due) {
      items = items.filter((task) =>
        matchesDueFilter(task, query.due!, undefined, query.dueFrom, query.dueTo),
      );
    }

    const { sort, order } = resolveSort(query, { sort: "dueAt", order: "asc" });
    return pageResult(
      sortItems(items, sort, order, {
        dueAt: (task) => task.dueAt,
        createdAt: (task) => task.createdAt,
        priority: (task) => ({ low: 0, normal: 1, high: 2 })[task.priority],
        status: (task) => task.status,
      }),
      query,
    );
  }),

  getTaskCounts: defineRoute<{ query: TaskCountsQuery }>(({ user, query }) => {
    const staff = requireUser(user);
    const assigneeFilter = scopeTaskAssigneeId(staff, query.assigneeId);
    let items = getDb().tasks.all();
    if (assigneeFilter) {
      items = items.filter((task) => task.assigneeId === assigneeFilter);
    }
    return ok(computeTaskCounts(items));
  }),

  createTask: defineRoute<{ body: TaskCreate }>(({ user, body }) => {
    const staff = requireUser(user);
    const db = getDb();
    if (staff.role === "consultant" && body.assigneeId !== staff.id) {
      throw apiError.forbidden("مشاور فقط می‌تواند کار را به خودش تخصیص دهد");
    }
    if (!db.consultants.has(body.assigneeId) && !db.users.has(body.assigneeId)) {
      throw apiError.invalidField("assigneeId", "مسئول کار پیدا نشد");
    }
    const now = nowIso();
    const task = db.tasks.insert({
      id: newId(),
      title: body.title,
      description: body.description ?? null,
      dueAt: body.dueAt,
      remindAt: body.remindAt ?? null,
      status: "open",
      priority: body.priority ?? "normal",
      assigneeId: body.assigneeId,
      relatedType: body.relatedType ?? "none",
      relatedId: body.relatedId ?? null,
      completedAt: null,
      createdBy: staff.id,
      version: 1,
      createdAt: now,
      updatedAt: now,
    });
    emitTaskSideEffects(db, {
      actorId: staff.id,
      action: "create",
      task,
      after: { title: task.title, dueAt: task.dueAt, assigneeId: task.assigneeId },
      activityType: "task_created",
      now,
      notifications:
        body.assigneeId !== staff.id
          ? [
              {
                userId: body.assigneeId,
                type: "task_assigned",
                title: "کار جدید به شما تخصیص یافت",
                body: task.title,
                link: `/admin/tasks?highlight=${task.id}`,
              },
            ]
          : [],
    });
    return created(task);
  }),

  getTask: defineRoute<IdParams>(({ user, params }) => {
    const staff = requireUser(user);
    const task = getDb().tasks.get(params.id);
    if (!task) throw apiError.notFound("کار");
    assertTaskAccess(staff, task);
    return ok(task);
  }),

  updateTask: defineRoute<IdParams & { body: TaskUpdate }>(
    ({ user, params, body, request }) => {
      const staff = requireUser(user);
      const db = getDb();
      const task = db.tasks.get(params.id);
      if (!task) throw apiError.notFound("کار");
      assertTaskAccess(staff, task);
      assertVersionMatch(request, task.version);
      if (
        staff.role === "consultant" &&
        body.assigneeId !== undefined &&
        body.assigneeId !== staff.id
      ) {
        throw apiError.forbidden("مشاور فقط می‌تواند کار را به خودش تخصیص دهد");
      }
      const now = nowIso();
      const patch = compact(body);
      const updated = db.tasks.update(task.id, {
        ...patch,
        version: bumpVersion(task.version),
        updatedAt: now,
      });
      const assignedAway =
        body.assigneeId &&
        body.assigneeId !== task.assigneeId &&
        body.assigneeId !== staff.id;
      emitTaskSideEffects(db, {
        actorId: staff.id,
        action: "update",
        task: updated,
        before: patch as Record<string, unknown>,
        after: patch as Record<string, unknown>,
        notifications: assignedAway
          ? [
              {
                userId: body.assigneeId!,
                type: "task_assigned",
                title: "کار به شما تخصیص یافت",
                body: updated.title,
                link: `/admin/tasks?highlight=${updated.id}`,
              },
            ]
          : [],
      });
      return ok(updated);
    },
  ),

  deleteTask: defineRoute<IdParams>(({ user, params }) => {
    const staff = requireUser(user);
    const db = getDb();
    const task = db.tasks.get(params.id);
    if (!task) throw apiError.notFound("کار");
    assertTaskAccess(staff, task);
    emitTaskSideEffects(db, {
      actorId: staff.id,
      action: "delete",
      task,
      before: { title: task.title },
    });
    db.tasks.remove(task.id);
    return noContent();
  }),

  completeTask: defineRoute<IdParams>(({ user, params }) => {
    const staff = requireUser(user);
    const db = getDb();
    const task = db.tasks.get(params.id);
    if (!task) throw apiError.notFound("کار");
    assertTaskAccess(staff, task);
    if (task.status !== "open") {
      throw apiError.conflict("فقط کارهای باز قابل تکمیل هستند");
    }
    const now = nowIso();
    const updated = db.tasks.update(task.id, {
      status: "done",
      completedAt: now,
      version: bumpVersion(task.version),
      updatedAt: now,
    });
    clearLeadFollowUpIfMatched(db, task, now);
    emitTaskSideEffects(db, {
      actorId: staff.id,
      action: "update",
      task: updated,
      before: { status: "open" },
      after: { status: "done" },
      activityType: "task_done",
      now,
    });
    return ok(updated);
  }),

  bulkCompleteTasks: defineRoute<{ body: TaskBulkComplete }>(({ user, body }) => {
    const staff = requireUser(user);
    const db = getDb();
    const now = nowIso();
    const completed: ReturnType<typeof db.tasks.get>[] = [];
    for (const id of body.ids) {
      const task = db.tasks.get(id);
      if (!task) continue;
      try {
        assertTaskAccess(staff, task);
      } catch {
        continue;
      }
      if (task.status !== "open") continue;
      const updated = db.tasks.update(task.id, {
        status: "done",
        completedAt: now,
        version: bumpVersion(task.version),
        updatedAt: now,
      });
      clearLeadFollowUpIfMatched(db, task, now);
      emitTaskSideEffects(db, {
        actorId: staff.id,
        action: "update",
        task: updated,
        before: { status: "open" },
        after: { status: "done" },
        activityType: "task_done",
        now,
      });
      completed.push(updated);
    }
    return ok(completed);
  }),

  snoozeTask: defineRoute<IdParams & { body: TaskSnooze }>(
    ({ user, params, body, request }) => {
      const staff = requireUser(user);
      const db = getDb();
      const task = db.tasks.get(params.id);
      if (!task) throw apiError.notFound("کار");
      assertTaskAccess(staff, task);
      assertVersionMatch(request, task.version);
      if (task.status !== "open") {
        throw apiError.conflict("فقط کارهای باز قابل تعویق هستند");
      }
      const until = resolveSnoozeUntil(body);
      const previousDue = new Date(task.dueAt).getTime();
      const nextDue = new Date(until).getTime();
      const delta = nextDue - previousDue;
      const remindAt =
        task.remindAt !== null
          ? new Date(new Date(task.remindAt).getTime() + delta).toISOString()
          : null;
      const now = nowIso();
      const updated = db.tasks.update(task.id, {
        dueAt: until,
        remindAt,
        version: bumpVersion(task.version),
        updatedAt: now,
      });
      emitTaskSideEffects(db, {
        actorId: staff.id,
        action: "update",
        task: updated,
        before: { dueAt: task.dueAt },
        after: { dueAt: until },
      });
      return ok(updated);
    },
  ),

  processTaskReminders: defineRoute(({ user }) => {
    requireUser(user);
    const created = processTaskReminders(getDb());
    return ok({ created });
  }),

  /* ----- Saved views ----- */

  listSavedViews: defineRoute<{ query: SavedViewListQuery }>(({ user, query }) => {
    const staff = requireUser(user);
    const items = getDb()
      .savedViews.all()
      .filter(
        (view) =>
          view.ownerId === staff.id || view.shared || staff.role === "admin",
      )
      .filter((view) => !query.resource || view.resource === query.resource)
      .filter(
        (view) =>
          query.shared === undefined || view.shared === query.shared,
      )
      .filter((view) => matchesQuery(query.q, [view.title]));
    const { sort, order } = resolveSort(query, {
      sort: "createdAt",
      order: "desc",
    });
    return pageResult(
      sortItems(items, sort, order, {
        createdAt: (view) => view.createdAt,
        title: (view) => view.title,
      }),
      query,
    );
  }),

  createSavedView: defineRoute<{ body: SavedViewCreate }>(({ user, body }) => {
    const staff = requireUser(user);
    const now = nowIso();
    return created(
      getDb().savedViews.insert({
        id: newId(),
        ownerId: staff.id,
        resource: body.resource,
        title: body.title,
        filters: body.filters ?? {},
        sort: body.sort ?? null,
        columns: body.columns ?? null,
        shared: body.shared ?? false,
        createdAt: now,
        updatedAt: now,
      }),
    );
  }),

  updateSavedView: defineRoute<IdParams & { body: SavedViewUpdate }>(
    ({ user, params, body }) => {
      const staff = requireUser(user);
      const db = getDb();
      const view = db.savedViews.get(params.id);
      if (!view) throw apiError.notFound("نما");
      if (view.ownerId !== staff.id && staff.role !== "admin") {
        throw apiError.forbidden();
      }
      return ok(
        db.savedViews.update(view.id, {
          ...compact(body),
          updatedAt: nowIso(),
        }),
      );
    },
  ),

  deleteSavedView: defineRoute<IdParams>(({ user, params }) => {
    const staff = requireUser(user);
    const db = getDb();
    const view = db.savedViews.get(params.id);
    if (!view) throw apiError.notFound("نما");
    if (view.ownerId !== staff.id && staff.role !== "admin") {
      throw apiError.forbidden();
    }
    db.savedViews.remove(view.id);
    return noContent();
  }),

  /* ----- Notifications ----- */

  listMyNotifications: defineRoute<{ query: NotificationListQuery }>(
    ({ user, query }) => {
      const staff = requireUser(user);
      const items = getDb()
        .notifications.all()
        .filter((n) => n.userId === staff.id)
        .filter(
          (n) =>
            query.unread === undefined ||
            (query.unread ? n.readAt === null : n.readAt !== null),
        )
        .filter((n) => !query.type || n.type === query.type);
      const { sort, order } = resolveSort(query, {
        sort: "createdAt",
        order: "desc",
      });
      return pageResult(
        sortItems(items, sort, order, {
          createdAt: (n) => n.createdAt,
        }),
        query,
      );
    },
  ),

  getUnreadNotificationCount: defineRoute(({ user }) => {
    const staff = requireUser(user);
    const count = getDb().notifications.filter(
      (n) => n.userId === staff.id && n.readAt === null,
    ).length;
    return ok({ count });
  }),

  markNotificationRead: defineRoute<IdParams>(({ user, params }) => {
    const staff = requireUser(user);
    const db = getDb();
    const n = db.notifications.get(params.id);
    if (!n || n.userId !== staff.id) throw apiError.notFound("اعلان");
    return ok(
      db.notifications.update(n.id, {
        readAt: n.readAt ?? nowIso(),
      }),
    );
  }),

  markAllNotificationsRead: defineRoute(({ user }) => {
    const staff = requireUser(user);
    const db = getDb();
    const now = nowIso();
    db.notifications
      .filter((n) => n.userId === staff.id && n.readAt === null)
      .forEach((n) => db.notifications.update(n.id, { readAt: now }));
    return noContent();
  }),

  bulkMarkNotificationsRead: defineRoute<{ body: NotificationBulkRead }>(
    ({ user, body }) => {
      const staff = requireUser(user);
      const db = getDb();
      const now = nowIso();
      const updated = body.ids
        .map((id) => {
          const n = db.notifications.get(id);
          if (!n || n.userId !== staff.id) return null;
          return db.notifications.update(n.id, {
            readAt: n.readAt ?? now,
          });
        })
        .filter((n): n is NonNullable<typeof n> => n !== null);
      return ok(updated);
    },
  ),

  getMyNotificationPreferences: defineRoute(({ user }) => {
    const staff = requireUser(user);
    const prefs = getNotificationPreferences(getDb(), staff.id);
    return ok({
      userId: prefs.userId,
      preferences: prefs.preferences,
      updatedAt: prefs.updatedAt,
    });
  }),

  updateMyNotificationPreferences: defineRoute<{
    body: NotificationPreferencesUpdate;
  }>(({ user, body }) => {
    const staff = requireUser(user);
    const prefs = upsertNotificationPreferences(
      getDb(),
      staff.id,
      body.preferences,
    );
    return ok({
      userId: prefs.userId,
      preferences: prefs.preferences,
      updatedAt: prefs.updatedAt,
    });
  }),

  /* ----- Audit ----- */

  listAuditLogs: defineRoute<{ query: AuditLogListQuery }>(({ query }) => {
    const items = filterAuditLogs(getDb(), query);
    const { sort, order } = resolveSort(query, {
      sort: "createdAt",
      order: "desc",
    });
    return pageResult(
      sortItems(items, sort, order, { createdAt: (log) => log.createdAt }),
      query,
    );
  }),

  exportAuditLogs: defineRoute<{ query: AuditLogListQuery }>(
    ({ user, query }) => {
      const staff = requireUser(user);
      const db = getDb();
      const rows = filterAuditLogs(db, query).slice(0, 50_000);
      const header =
        "id,createdAt,actorId,action,entityType,entityId,diffSummary\n";
      const csv =
        "\uFEFF" +
        header +
        rows
          .map((log) =>
            [
              log.id,
              log.createdAt,
              log.actorId ?? "",
              log.action,
              log.entityType,
              log.entityId ?? "",
              summarizeAuditDiff(log.diff),
            ]
              .map((cell) => `"${String(cell).replaceAll('"', '""')}"`)
              .join(","),
          )
          .join("\n");
      emitDomainEvent(db, {
        actorId: staff.id,
        action: "export",
        entityType: "audit_log",
        entityId: null,
        diff: { before: null, after: { count: rows.length } },
      });
      return ok(csv);
    },
  ),

  /* ----- Reports ----- */

  getFunnelReport: defineRoute<{ query: ReportRangeQuery }>(({ user, query }) => {
    const staff = requireUser(user);
    const db = getDb();
    const consultantId = scopeConsultantId(
      staff.id,
      staff.role,
      query.consultantId,
    );
    const leads = db.leads
      .all()
      .filter((lead) => !lead.archived)
      .filter((lead) => inRange(lead.createdAt, query.from, query.to))
      .filter((lead) => !consultantId || lead.assignedTo === consultantId);

    const stages = db.pipelineStages
      .all()
      .sort((a, b) => a.order - b.order)
      .map((stage) => {
        const inStage = leads.filter((lead) => lead.stageId === stage.id);
        return {
          stageId: stage.id,
          key: stage.key,
          title: stage.title,
          kind: stage.kind,
          count: inStage.length,
          valueRials: inStage.reduce((sum, lead) => sum + (lead.value ?? 0), 0),
        };
      });
    const won = leads.filter((l) => l.stageKind === "won").length;
    return ok({
      from: query.from,
      to: query.to,
      stages,
      conversionRate: leads.length === 0 ? 0 : won / leads.length,
    });
  }),

  getConsultantsReport: defineRoute<{ query: ReportRangeQuery }>(
    ({ user, query }) => {
      const staff = requireUser(user);
      const db = getDb();
      const consultantId = scopeConsultantId(
        staff.id,
        staff.role,
        query.consultantId,
      );
      const consultants = db.consultants
        .all()
        .filter((c) => !consultantId || c.id === consultantId);
      const rows = consultants.map((consultant) => {
        const leads = db.leads
          .all()
          .filter((lead) => lead.assignedTo === consultant.id)
          .filter((lead) => inRange(lead.createdAt, query.from, query.to));
        const won = leads.filter((l) => l.stageKind === "won").length;
        const lost = leads.filter((l) => l.stageKind === "lost").length;
        return {
          consultantId: consultant.id,
          name: consultant.name,
          leadsAssigned: leads.length,
          leadsWon: won,
          leadsLost: lost,
          openTasks: db.tasks.filter(
            (t) => t.assigneeId === consultant.id && t.status === "open",
          ).length,
          conversionRate: leads.length === 0 ? 0 : won / leads.length,
        };
      });
      return ok({ from: query.from, to: query.to, rows });
    },
  ),

  getSourcesReport: defineRoute<{ query: ReportRangeQuery }>(({ user, query }) => {
    const staff = requireUser(user);
    const consultantId = scopeConsultantId(
      staff.id,
      staff.role,
      query.consultantId,
    );
    const leads = getDb()
      .leads.all()
      .filter((lead) => !lead.archived)
      .filter((lead) => inRange(lead.createdAt, query.from, query.to))
      .filter((lead) => !consultantId || lead.assignedTo === consultantId);
    const bySource = new Map<string, typeof leads>();
    for (const lead of leads) {
      const list = bySource.get(lead.source) ?? [];
      list.push(lead);
      bySource.set(lead.source, list);
    }
    const rows = [...bySource.entries()].map(([source, group]) => {
      const won = group.filter((l) => l.stageKind === "won").length;
      const lost = group.filter((l) => l.stageKind === "lost").length;
      return {
        source,
        count: group.length,
        won,
        lost,
        conversionRate: group.length === 0 ? 0 : won / group.length,
      };
    });
    return ok({ from: query.from, to: query.to, rows });
  }),

  getTimeseriesReport: defineRoute<{ query: TimeseriesReportQuery }>(
    ({ user, query }) => {
      const staff = requireUser(user);
      const db = getDb();
      const consultantId = scopeConsultantId(
        staff.id,
        staff.role,
        query.consultantId,
      );
      const fromMs = new Date(query.from).getTime();
      const toMs = new Date(query.to).getTime();
      const step =
        query.granularity === "month"
          ? 30 * 86_400_000
          : query.granularity === "week"
            ? 7 * 86_400_000
            : 86_400_000;

      const points: { bucketStart: string; value: number }[] = [];
      for (let cursor = fromMs; cursor <= toMs; cursor += step) {
        const bucketEnd = Math.min(cursor + step, toMs + 1);
        let value = 0;
        if (
          query.metric === "leads_created" ||
          query.metric === "leads_won" ||
          query.metric === "leads_lost"
        ) {
          value = db.leads
            .all()
            .filter((lead) => !consultantId || lead.assignedTo === consultantId)
            .filter((lead) => {
              const ms = new Date(lead.createdAt).getTime();
              if (ms < cursor || ms >= bucketEnd) return false;
              if (query.metric === "leads_won") return lead.stageKind === "won";
              if (query.metric === "leads_lost") return lead.stageKind === "lost";
              return true;
            }).length;
        } else if (query.metric === "tasks_done") {
          value = db.tasks
            .all()
            .filter((task) => !consultantId || task.assigneeId === consultantId)
            .filter((task) => {
              if (!task.completedAt) return false;
              const ms = new Date(task.completedAt).getTime();
              return ms >= cursor && ms < bucketEnd;
            }).length;
        } else {
          value = db.bookings
            .all()
            .filter(
              (booking) =>
                !consultantId || booking.consultantId === consultantId,
            )
            .filter((booking) => {
              const ms = new Date(booking.createdAt).getTime();
              return ms >= cursor && ms < bucketEnd;
            }).length;
        }
        points.push({ bucketStart: new Date(cursor).toISOString(), value });
      }

      return ok({
        metric: query.metric,
        granularity: query.granularity ?? "day",
        from: query.from,
        to: query.to,
        points,
      });
    },
  ),

  getTicketsReport: defineRoute<{ query: ReportRangeQuery }>(
    ({ user, query }) => {
      const staff = requireUser(user);
      const db = getDb();
      const consultantId = scopeConsultantId(
        staff.id,
        staff.role,
        query.consultantId,
      );
      const tickets = db.tickets
        .all()
        .filter((ticket) => inRange(ticket.createdAt, query.from, query.to))
        .filter((ticket) => {
          if (!consultantId) return true;
          if (ticket.assignedTo === consultantId) return true;
          if (!ticket.caseId) return false;
          return db.cases.get(ticket.caseId)?.consultantId === consultantId;
        });

      const closed = tickets.filter((ticket) => ticket.status === "closed");
      const open = tickets.filter((ticket) => ticket.status !== "closed");
      const withFirst = tickets.filter((ticket) => ticket.firstResponseAt);
      const avgFirstResponseMs =
        withFirst.length === 0
          ? null
          : withFirst.reduce((sum, ticket) => {
              const start = new Date(ticket.createdAt).getTime();
              const end = new Date(ticket.firstResponseAt!).getTime();
              return sum + Math.max(0, end - start);
            }, 0) / withFirst.length;
      const rated = tickets.filter((ticket) => ticket.rating !== null);
      const avgRating =
        rated.length === 0
          ? null
          : rated.reduce((sum, ticket) => sum + (ticket.rating ?? 0), 0) /
            rated.length;

      return ok({
        from: query.from,
        to: query.to,
        totalTickets: tickets.length,
        closedTickets: closed.length,
        openTickets: open.length,
        avgFirstResponseMs,
        avgRating,
        ratedCount: rated.length,
      });
    },
  ),
};
