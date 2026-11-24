import type {
  AssignmentRule,
  CaseTemplate,
  MessageTemplate,
  PipelineStage,
  Tag,
} from "@/contracts/crm";
import type {
  AssignmentRulesSettings,
  AssignmentSimulateInput,
  AssignmentSimulateResult,
  CampaignCostsSettings,
  CaseTemplatesSettings,
  CrmDefaultsData,
  CrmDefaultsSettings,
  CrmSettingsTab,
  LostReasonsSettings,
  MessageTemplatesSettings,
  PipelineSettings,
  PipelineSettingsReplace,
  TagsSettings,
  TagWithUsage,
} from "@/contracts/crm-settings";
import type { LeadSource } from "@/contracts/leads";
import { getDb, type MockDb } from "../db";
import { emitDomainEvent } from "../domain-events";
import { apiError } from "../errors";
import {
  CRM_SETTINGS_ID,
  buildCrmSettingsSeed,
  buildDefaultCampaignCosts,
  buildDefaultCrmDefaultsData,
} from "../seed/crm";
import { createClock } from "../seed/helpers";
import type { StoredCrmSettings } from "../types";
import { newId, nowIso } from "../utils";
import {
  applyAssignmentRules,
  assertKindCoverage,
  assertVersionMatch,
  bumpVersion,
  defaultNewStage,
  resolveAssignmentMatch,
} from "./crm";

export function getCrmSettingsMeta(db: MockDb = getDb()): StoredCrmSettings {
  const meta = db.crmSettings.get(CRM_SETTINGS_ID) ?? db.crmSettings.all()[0];
  if (!meta) throw apiError.internal("تنظیمات CRM seed نشده است");
  return meta;
}

export function requireCrmSettingsVersion(
  request: Request,
  tab: CrmSettingsTab,
  db: MockDb = getDb(),
): StoredCrmSettings {
  const meta = getCrmSettingsMeta(db);
  assertVersionMatch(request, meta.versions[tab]);
  return meta;
}

export function bumpCrmSettingsTab(
  db: MockDb,
  tab: CrmSettingsTab,
  actorId: string | null,
  diff: { before: unknown; after: unknown },
): StoredCrmSettings {
  const meta = getCrmSettingsMeta(db);
  const now = nowIso();
  const next: StoredCrmSettings = {
    ...meta,
    versions: {
      ...meta.versions,
      [tab]: bumpVersion(meta.versions[tab]),
    },
    updatedAtByTab: {
      ...meta.updatedAtByTab,
      [tab]: now,
    },
  };
  const updated = db.crmSettings.update(meta.id, next);
  emitDomainEvent(db, {
    actorId,
    action: "update",
    entityType: "crm_settings",
    entityId: meta.id,
    diff: {
      before: { [tab]: diff.before },
      after: { [tab]: diff.after },
    },
  });
  return updated;
}

function tagUsageCount(db: MockDb, tagId: string): number {
  return db.leads.filter((lead) => lead.tagIds.includes(tagId)).length;
}

export function tagsWithUsage(db: MockDb): TagWithUsage[] {
  return db.tags.all().map((tag) => ({
    ...tag,
    usageCount: tagUsageCount(db, tag.id),
  }));
}

export function hasDefaultAssignmentRule(db: MockDb): boolean {
  return db.assignmentRules
    .all()
    .some(
      (rule) =>
        rule.active &&
        rule.conditions.some((condition) => condition.type === "always"),
    );
}

export function readPipelineSettings(db: MockDb): PipelineSettings {
  const meta = getCrmSettingsMeta(db);
  return {
    version: meta.versions.pipeline,
    updatedAt: meta.updatedAtByTab.pipeline,
    stages: db.pipelineStages.all().sort((a, b) => a.order - b.order),
  };
}

export function readLostReasonsSettings(db: MockDb): LostReasonsSettings {
  const meta = getCrmSettingsMeta(db);
  return {
    version: meta.versions.lostReasons,
    updatedAt: meta.updatedAtByTab.lostReasons,
    items: db.lostReasons.all(),
  };
}

export function readTagsSettings(db: MockDb): TagsSettings {
  const meta = getCrmSettingsMeta(db);
  return {
    version: meta.versions.tags,
    updatedAt: meta.updatedAtByTab.tags,
    items: tagsWithUsage(db),
  };
}

export function readAssignmentRulesSettings(
  db: MockDb,
): AssignmentRulesSettings {
  const meta = getCrmSettingsMeta(db);
  return {
    version: meta.versions.assignmentRules,
    updatedAt: meta.updatedAtByTab.assignmentRules,
    items: db.assignmentRules.all().sort((a, b) => a.order - b.order),
    hasDefaultRule: hasDefaultAssignmentRule(db),
  };
}

export function readMessageTemplatesSettings(
  db: MockDb,
): MessageTemplatesSettings {
  const meta = getCrmSettingsMeta(db);
  return {
    version: meta.versions.messageTemplates,
    updatedAt: meta.updatedAtByTab.messageTemplates,
    items: db.messageTemplates.all(),
  };
}

export function readCaseTemplatesSettings(db: MockDb): CaseTemplatesSettings {
  const meta = getCrmSettingsMeta(db);
  return {
    version: meta.versions.caseTemplates,
    updatedAt: meta.updatedAtByTab.caseTemplates,
    items: db.caseTemplates.all(),
  };
}

export function readCampaignCostsSettings(db: MockDb): CampaignCostsSettings {
  const meta = getCrmSettingsMeta(db);
  return {
    version: meta.versions.campaignCosts,
    updatedAt: meta.updatedAtByTab.campaignCosts,
    items: db.campaignCosts
      .all()
      .sort((a, b) =>
        a.yearMonth === b.yearMonth
          ? a.source.localeCompare(b.source)
          : b.yearMonth.localeCompare(a.yearMonth),
      ),
  };
}

export function readCrmDefaultsSettings(db: MockDb): CrmDefaultsSettings {
  const meta = getCrmSettingsMeta(db);
  return {
    version: meta.versions.defaults,
    updatedAt: meta.updatedAtByTab.defaults,
    data: meta.defaults,
  };
}

export function replacePipelineSettings(
  db: MockDb,
  request: Request,
  actorId: string | null,
  body: PipelineSettingsReplace,
): PipelineSettings {
  requireCrmSettingsVersion(request, "pipeline", db);
  const before = readPipelineSettings(db);
  const now = nowIso();
  const existingIds = new Set(db.pipelineStages.all().map((s) => s.id));
  const keptIds = new Set(
    body.stages.filter((s) => s.id).map((s) => s.id as string),
  );

  const removed = [...existingIds].filter((id) => !keptIds.has(id));
  for (const removedId of removed) {
    const leadCount = db.leads.filter(
      (lead) => lead.stageId === removedId && !lead.archived,
    ).length;
    if (leadCount > 0) {
      const targetId = body.migrateLeads[removedId];
      if (!targetId) {
        throw apiError.conflict(
          "سرنخ‌هایی در این مرحله هستند؛ مرحله مقصد را برای انتقال مشخص کنید",
          { migrateLeads: [`برای مرحله ${removedId} مقصد لازم است`] },
        );
      }
      if (!keptIds.has(targetId) && !existingIds.has(targetId)) {
        throw apiError.invalidField(
          "migrateLeads",
          "مرحله مقصد برای انتقال لیدها معتبر نیست",
        );
      }
      if (targetId === removedId) {
        throw apiError.invalidField(
          "migrateLeads",
          "مرحله مقصد نمی‌تواند همان مرحله حذف‌شده باشد",
        );
      }
      for (const lead of db.leads.all()) {
        if (lead.stageId !== removedId) continue;
        const target =
          db.pipelineStages.get(targetId) ??
          // may already be replaced below — use draft kind from body
          null;
        const draft = body.stages.find((s) => s.id === targetId);
        const kind = target?.kind ?? draft?.kind;
        if (!kind) {
          throw apiError.invalidField("migrateLeads", "مرحله مقصد پیدا نشد");
        }
        db.leads.update(lead.id, {
          stageId: targetId,
          stageKind: kind,
          updatedAt: now,
          lastActivityAt: now,
          version: bumpVersion(lead.version),
        });
      }
    }
    db.pipelineStages.remove(removedId);
  }

  const nextStages: PipelineStage[] = [];
  for (const draft of body.stages) {
    if (draft.id && existingIds.has(draft.id) && keptIds.has(draft.id)) {
      const updated = db.pipelineStages.update(draft.id, {
        key: draft.key,
        title: draft.title,
        order: draft.order,
        color: draft.color ?? "slate",
        kind: draft.kind,
        wipLimit: draft.wipLimit ?? null,
        updatedAt: now,
      });
      nextStages.push(updated);
    } else {
      const created = db.pipelineStages.insert({
        id: draft.id && !existingIds.has(draft.id) ? draft.id : newId(),
        key: draft.key,
        title: draft.title,
        order: draft.order,
        color: draft.color ?? "slate",
        kind: draft.kind,
        wipLimit: draft.wipLimit ?? null,
        createdAt: now,
        updatedAt: now,
      });
      nextStages.push(created);
    }
  }

  const keys = nextStages.map((s) => s.key);
  if (new Set(keys).size !== keys.length) {
    throw apiError.conflict("کلید مرحله تکراری است");
  }
  assertKindCoverage(nextStages);

  // Fix stageKind on migrated leads after stages exist
  for (const lead of db.leads.all()) {
    const stage = db.pipelineStages.get(lead.stageId);
    if (stage && lead.stageKind !== stage.kind) {
      db.leads.update(lead.id, { stageKind: stage.kind });
    }
  }

  const afterStages = db.pipelineStages
    .all()
    .sort((a, b) => a.order - b.order);
  bumpCrmSettingsTab(db, "pipeline", actorId, {
    before: before.stages,
    after: afterStages,
  });
  return readPipelineSettings(db);
}

export function replaceLostReasons(
  db: MockDb,
  request: Request,
  actorId: string | null,
  items: { id?: string; title: string; active?: boolean }[],
): LostReasonsSettings {
  requireCrmSettingsVersion(request, "lostReasons", db);
  const before = readLostReasonsSettings(db);
  const now = nowIso();
  const existing = new Map(db.lostReasons.all().map((r) => [r.id, r]));
  const kept = new Set(items.filter((i) => i.id).map((i) => i.id as string));

  for (const id of existing.keys()) {
    if (kept.has(id)) continue;
    if (db.leads.find((lead) => lead.lostReasonId === id)) {
      throw apiError.conflict("این دلیل به سرنخ‌هایی متصل است و قابل حذف نیست");
    }
    db.lostReasons.remove(id);
  }

  for (const draft of items) {
    if (draft.id && existing.has(draft.id)) {
      db.lostReasons.update(draft.id, {
        title: draft.title,
        active: draft.active ?? true,
        updatedAt: now,
      });
    } else {
      db.lostReasons.insert({
        id: newId(),
        title: draft.title,
        active: draft.active ?? true,
        createdAt: now,
        updatedAt: now,
      });
    }
  }

  const after = db.lostReasons.all();
  bumpCrmSettingsTab(db, "lostReasons", actorId, {
    before: before.items,
    after,
  });
  return readLostReasonsSettings(db);
}

export function replaceTags(
  db: MockDb,
  request: Request,
  actorId: string | null,
  items: { id?: string; title: string; color?: Tag["color"] }[],
): TagsSettings {
  requireCrmSettingsVersion(request, "tags", db);
  const before = readTagsSettings(db);
  const now = nowIso();
  const existing = new Map(db.tags.all().map((t) => [t.id, t]));
  const kept = new Set(items.filter((i) => i.id).map((i) => i.id as string));

  for (const id of existing.keys()) {
    if (kept.has(id)) continue;
    for (const lead of db.leads.all()) {
      if (!lead.tagIds.includes(id)) continue;
      db.leads.update(lead.id, {
        tagIds: lead.tagIds.filter((tagId) => tagId !== id),
      });
    }
    db.tags.remove(id);
  }

  const titles = new Set<string>();
  for (const draft of items) {
    if (titles.has(draft.title)) {
      throw apiError.conflict("برچسب تکراری است");
    }
    titles.add(draft.title);
    if (draft.id && existing.has(draft.id)) {
      db.tags.update(draft.id, {
        title: draft.title,
        color: draft.color ?? "slate",
        updatedAt: now,
      });
    } else {
      db.tags.insert({
        id: newId(),
        title: draft.title,
        color: draft.color ?? "slate",
        createdAt: now,
        updatedAt: now,
      });
    }
  }

  bumpCrmSettingsTab(db, "tags", actorId, {
    before: before.items,
    after: tagsWithUsage(db),
  });
  return readTagsSettings(db);
}

export function mergeTags(
  db: MockDb,
  actorId: string | null,
  sourceId: string,
  targetId: string,
): TagWithUsage {
  const source = db.tags.get(sourceId);
  const target = db.tags.get(targetId);
  if (!source || !target) throw apiError.notFound("برچسب");
  const before = readTagsSettings(db);

  for (const lead of db.leads.all()) {
    if (!lead.tagIds.includes(sourceId)) continue;
    const next = new Set(lead.tagIds.filter((id) => id !== sourceId));
    next.add(targetId);
    db.leads.update(lead.id, { tagIds: [...next] });
  }
  db.tags.remove(sourceId);

  bumpCrmSettingsTab(db, "tags", actorId, {
    before: before.items,
    after: tagsWithUsage(db),
  });
  const merged = db.tags.get(targetId);
  if (!merged) throw apiError.notFound("برچسب");
  return { ...merged, usageCount: tagUsageCount(db, targetId) };
}

export function replaceAssignmentRules(
  db: MockDb,
  request: Request,
  actorId: string | null,
  items: {
    id?: string;
    order: number;
    active?: boolean;
    conditions: AssignmentRule["conditions"];
    strategy: AssignmentRule["strategy"];
    consultantIds: string[];
  }[],
): AssignmentRulesSettings {
  requireCrmSettingsVersion(request, "assignmentRules", db);
  const before = readAssignmentRulesSettings(db);
  const now = nowIso();
  const existing = new Map(db.assignmentRules.all().map((r) => [r.id, r]));
  const kept = new Set(items.filter((i) => i.id).map((i) => i.id as string));

  for (const id of existing.keys()) {
    if (!kept.has(id)) db.assignmentRules.remove(id);
  }

  for (const draft of items) {
    if (draft.id && existing.has(draft.id)) {
      db.assignmentRules.update(draft.id, {
        order: draft.order,
        active: draft.active ?? true,
        conditions: draft.conditions,
        strategy: draft.strategy,
        consultantIds: draft.consultantIds,
        updatedAt: now,
      });
    } else {
      db.assignmentRules.insert({
        id: newId(),
        order: draft.order,
        active: draft.active ?? true,
        conditions: draft.conditions,
        strategy: draft.strategy,
        consultantIds: draft.consultantIds,
        createdAt: now,
        updatedAt: now,
      });
    }
  }

  bumpCrmSettingsTab(db, "assignmentRules", actorId, {
    before: before.items,
    after: db.assignmentRules.all(),
  });
  return readAssignmentRulesSettings(db);
}

export function simulateAssignment(
  db: MockDb,
  input: AssignmentSimulateInput,
): AssignmentSimulateResult {
  const source = (input.source ?? "manual") as LeadSource;
  const targetCountries = input.targetCountry ? [input.targetCountry] : [];
  const utm = input.utmCampaign ? { campaign: input.utmCampaign } : null;

  const match = resolveAssignmentMatch(db, {
    source,
    targetCountries,
    utm,
  });

  if (match) {
    const consultant = db.consultants.get(match.consultantId);
    return {
      matched: true,
      ruleId: match.rule.id,
      ruleOrder: match.rule.order,
      strategy: match.rule.strategy,
      consultantId: match.consultantId,
      consultantName: consultant?.name ?? null,
      usedDefaultAssignee: false,
    };
  }

  const defaults = getCrmSettingsMeta(db).defaults;
  if (defaults.defaultAssigneeId) {
    const consultant = db.consultants.get(defaults.defaultAssigneeId);
    return {
      matched: false,
      ruleId: null,
      ruleOrder: null,
      strategy: null,
      consultantId: defaults.defaultAssigneeId,
      consultantName: consultant?.name ?? null,
      usedDefaultAssignee: true,
    };
  }

  return {
    matched: false,
    ruleId: null,
    ruleOrder: null,
    strategy: null,
    consultantId: null,
    consultantName: null,
    usedDefaultAssignee: false,
  };
}

export function replaceMessageTemplates(
  db: MockDb,
  request: Request,
  actorId: string | null,
  items: {
    id?: string;
    channel: MessageTemplate["channel"];
    title: string;
    body: string;
    active?: boolean;
  }[],
): MessageTemplatesSettings {
  requireCrmSettingsVersion(request, "messageTemplates", db);
  const before = readMessageTemplatesSettings(db);
  const now = nowIso();
  const existing = new Map(db.messageTemplates.all().map((t) => [t.id, t]));
  const kept = new Set(items.filter((i) => i.id).map((i) => i.id as string));

  for (const id of existing.keys()) {
    if (!kept.has(id)) db.messageTemplates.remove(id);
  }

  for (const draft of items) {
    if (draft.id && existing.has(draft.id)) {
      db.messageTemplates.update(draft.id, {
        channel: draft.channel,
        title: draft.title,
        body: draft.body,
        active: draft.active ?? true,
        updatedAt: now,
      });
    } else {
      db.messageTemplates.insert({
        id: newId(),
        channel: draft.channel,
        title: draft.title,
        body: draft.body,
        active: draft.active ?? true,
        createdAt: now,
        updatedAt: now,
      });
    }
  }

  bumpCrmSettingsTab(db, "messageTemplates", actorId, {
    before: before.items,
    after: db.messageTemplates.all(),
  });
  return readMessageTemplatesSettings(db);
}

export function replaceCaseTemplates(
  db: MockDb,
  request: Request,
  actorId: string | null,
  items: {
    id?: string;
    countrySlug?: string | null;
    title: string;
    stages: CaseTemplate["stages"];
  }[],
): CaseTemplatesSettings {
  requireCrmSettingsVersion(request, "caseTemplates", db);
  const before = readCaseTemplatesSettings(db);
  const now = nowIso();
  const existing = new Map(db.caseTemplates.all().map((t) => [t.id, t]));
  const kept = new Set(items.filter((i) => i.id).map((i) => i.id as string));

  for (const id of existing.keys()) {
    if (kept.has(id)) continue;
    if (db.cases.find((entry) => entry.templateId === id)) {
      throw apiError.conflict(
        "پرونده‌هایی با این قالب وجود دارد؛ ابتدا پرونده‌ها را مهاجرت دهید یا قالب را نگه دارید",
      );
    }
    db.caseTemplates.remove(id);
  }

  for (const draft of items) {
    const payload = {
      countrySlug: draft.countrySlug ?? null,
      title: draft.title,
      stages: draft.stages,
      updatedAt: now,
    };
    if (draft.id && existing.has(draft.id)) {
      const prev = existing.get(draft.id)!;
      const removedStageKeys = prev.stages
        .map((s) => s.key)
        .filter((key) => !draft.stages.some((s) => s.key === key));
      if (removedStageKeys.length > 0) {
        const activeOnStage = db.cases.find(
          (entry) =>
            entry.templateId === draft.id &&
            removedStageKeys.includes(entry.currentStage),
        );
        if (activeOnStage) {
          throw apiError.conflict(
            "حذف مرحله‌ای که پرونده فعال دارد ممکن نیست؛ ابتدا پرونده‌ها را به مرحله دیگر منتقل کنید",
            {
              stages: [
                `مرحله «${removedStageKeys.join("، ")}» دارای پرونده فعال است`,
              ],
            },
          );
        }
      }
      db.caseTemplates.update(draft.id, payload);
    } else {
      db.caseTemplates.insert({
        id: newId(),
        ...payload,
        createdAt: now,
      });
    }
  }

  bumpCrmSettingsTab(db, "caseTemplates", actorId, {
    before: before.items,
    after: db.caseTemplates.all(),
  });
  return readCaseTemplatesSettings(db);
}

export function copyCaseTemplate(
  db: MockDb,
  actorId: string | null,
  sourceId: string,
  countrySlug: string | null,
  title?: string,
): CaseTemplate {
  const source = db.caseTemplates.get(sourceId);
  if (!source) throw apiError.notFound("قالب پرونده");
  const now = nowIso();
  const created = db.caseTemplates.insert({
    id: newId(),
    countrySlug,
    title: title ?? `${source.title} (کپی)`,
    stages: source.stages.map((stage) => ({ ...stage })),
    createdAt: now,
    updatedAt: now,
  });
  bumpCrmSettingsTab(db, "caseTemplates", actorId, {
    before: null,
    after: created,
  });
  return created;
}

export function replaceCampaignCosts(
  db: MockDb,
  request: Request,
  actorId: string | null,
  items: {
    id?: string;
    yearMonth: string;
    source: string;
    campaign: string | null;
    costRials: number;
  }[],
): CampaignCostsSettings {
  requireCrmSettingsVersion(request, "campaignCosts", db);
  const before = readCampaignCostsSettings(db);
  const now = nowIso();
  const existing = new Map(db.campaignCosts.all().map((c) => [c.id, c]));
  const kept = new Set(items.filter((i) => i.id).map((i) => i.id as string));

  for (const id of existing.keys()) {
    if (!kept.has(id)) db.campaignCosts.remove(id);
  }

  for (const draft of items) {
    if (draft.id && existing.has(draft.id)) {
      db.campaignCosts.update(draft.id, {
        yearMonth: draft.yearMonth,
        source: draft.source,
        campaign: draft.campaign,
        costRials: draft.costRials,
        updatedAt: now,
      });
    } else {
      db.campaignCosts.insert({
        id: newId(),
        yearMonth: draft.yearMonth,
        source: draft.source,
        campaign: draft.campaign,
        costRials: draft.costRials,
        createdAt: now,
        updatedAt: now,
      });
    }
  }

  bumpCrmSettingsTab(db, "campaignCosts", actorId, {
    before: before.items,
    after: db.campaignCosts.all(),
  });
  return readCampaignCostsSettings(db);
}

export function replaceCrmDefaults(
  db: MockDb,
  request: Request,
  actorId: string | null,
  data: CrmDefaultsData,
): CrmDefaultsSettings {
  requireCrmSettingsVersion(request, "defaults", db);
  const before = readCrmDefaultsSettings(db);
  if (!db.pipelineStages.has(data.initialStageId)) {
    throw apiError.invalidField("initialStageId", "مرحله اولیه معتبر نیست");
  }
  if (
    data.defaultAssigneeId &&
    !db.consultants.has(data.defaultAssigneeId)
  ) {
    throw apiError.invalidField(
      "defaultAssigneeId",
      "مشاور پیش‌فرض معتبر نیست",
    );
  }
  const meta = getCrmSettingsMeta(db);
  db.crmSettings.update(meta.id, { defaults: data });
  bumpCrmSettingsTab(db, "defaults", actorId, {
    before: before.data,
    after: data,
  });
  return readCrmDefaultsSettings(db);
}

/** Rebuild one tab from seed defaults (keeps other tabs). */
export function resetCrmSettingsTab(
  db: MockDb,
  request: Request,
  actorId: string | null,
  tab: CrmSettingsTab,
): unknown {
  requireCrmSettingsVersion(request, tab, db);
  const consultants = db.consultants.all();
  const countrySlugs = db.countries.all().map((c) => c.slug);
  const seed = buildCrmSettingsSeed(createClock(), consultants, countrySlugs);
  const now = nowIso();

  switch (tab) {
    case "pipeline": {
      const before = readPipelineSettings(db);
      const newKeyToId = new Map(
        seed.pipelineStages.map((s) => [s.key, s.id] as const),
      );
      const fallbackId = seed.pipelineStages[0]!.id;
      for (const lead of db.leads.all()) {
        const stage = db.pipelineStages.get(lead.stageId);
        const targetId =
          (stage ? newKeyToId.get(stage.key) : undefined) ?? fallbackId;
        const target = seed.pipelineStages.find((s) => s.id === targetId)!;
        db.leads.update(lead.id, {
          stageId: target.id,
          stageKind: target.kind,
        });
      }
      for (const stage of db.pipelineStages.all()) {
        db.pipelineStages.remove(stage.id);
      }
      for (const stage of seed.pipelineStages) {
        db.pipelineStages.insert(stage);
      }
      const meta = getCrmSettingsMeta(db);
      if (!seed.pipelineStages.some((s) => s.id === meta.defaults.initialStageId)) {
        db.crmSettings.update(meta.id, {
          defaults: {
            ...meta.defaults,
            initialStageId: seed.stageIdsByKey.get("new") ?? fallbackId,
          },
        });
      }
      bumpCrmSettingsTab(db, "pipeline", actorId, {
        before: before.stages,
        after: seed.pipelineStages,
      });
      return readPipelineSettings(db);
    }
    case "lostReasons": {
      const before = readLostReasonsSettings(db);
      const firstId = seed.lostReasons[0]?.id;
      for (const lead of db.leads.all()) {
        if (!lead.lostReasonId) continue;
        if (!seed.lostReasons.some((r) => r.id === lead.lostReasonId)) {
          db.leads.update(lead.id, { lostReasonId: firstId ?? null });
        }
      }
      for (const reason of db.lostReasons.all()) db.lostReasons.remove(reason.id);
      for (const reason of seed.lostReasons) db.lostReasons.insert(reason);
      bumpCrmSettingsTab(db, "lostReasons", actorId, {
        before: before.items,
        after: seed.lostReasons,
      });
      return readLostReasonsSettings(db);
    }
    case "tags": {
      const before = readTagsSettings(db);
      for (const lead of db.leads.all()) {
        db.leads.update(lead.id, {
          tagIds: lead.tagIds.filter((id) =>
            seed.tags.some((tag) => tag.id === id),
          ),
        });
      }
      for (const tag of db.tags.all()) db.tags.remove(tag.id);
      for (const tag of seed.tags) db.tags.insert(tag);
      bumpCrmSettingsTab(db, "tags", actorId, {
        before: before.items,
        after: tagsWithUsage(db),
      });
      return readTagsSettings(db);
    }
    case "assignmentRules": {
      const before = readAssignmentRulesSettings(db);
      for (const rule of db.assignmentRules.all()) {
        db.assignmentRules.remove(rule.id);
      }
      for (const rule of seed.assignmentRules) db.assignmentRules.insert(rule);
      bumpCrmSettingsTab(db, "assignmentRules", actorId, {
        before: before.items,
        after: seed.assignmentRules,
      });
      return readAssignmentRulesSettings(db);
    }
    case "messageTemplates": {
      const before = readMessageTemplatesSettings(db);
      for (const tpl of db.messageTemplates.all()) {
        db.messageTemplates.remove(tpl.id);
      }
      for (const tpl of seed.messageTemplates) db.messageTemplates.insert(tpl);
      bumpCrmSettingsTab(db, "messageTemplates", actorId, {
        before: before.items,
        after: seed.messageTemplates,
      });
      return readMessageTemplatesSettings(db);
    }
    case "caseTemplates": {
      const before = readCaseTemplatesSettings(db);
      const seedIds = new Set(seed.caseTemplates.map((t) => t.id));
      for (const tpl of db.caseTemplates.all()) {
        if (db.cases.find((c) => c.templateId === tpl.id) && !seedIds.has(tpl.id)) {
          throw apiError.conflict(
            "قالب‌های دارای پرونده فعال قابل بازنشانی کامل نیستند؛ ابتدا پرونده‌ها را مهاجرت دهید",
          );
        }
      }
      for (const tpl of db.caseTemplates.all()) {
        if (!db.cases.find((c) => c.templateId === tpl.id)) {
          db.caseTemplates.remove(tpl.id);
        }
      }
      for (const tpl of seed.caseTemplates) {
        if (db.caseTemplates.has(tpl.id)) {
          db.caseTemplates.update(tpl.id, {
            title: tpl.title,
            countrySlug: tpl.countrySlug,
            stages: tpl.stages,
            updatedAt: now,
          });
        } else {
          db.caseTemplates.insert(tpl);
        }
      }
      bumpCrmSettingsTab(db, "caseTemplates", actorId, {
        before: before.items,
        after: db.caseTemplates.all(),
      });
      return readCaseTemplatesSettings(db);
    }
    case "campaignCosts": {
      const before = readCampaignCostsSettings(db);
      for (const cost of db.campaignCosts.all()) {
        db.campaignCosts.remove(cost.id);
      }
      const costs = buildDefaultCampaignCosts(createClock());
      for (const cost of costs) db.campaignCosts.insert(cost);
      bumpCrmSettingsTab(db, "campaignCosts", actorId, {
        before: before.items,
        after: costs,
      });
      return readCampaignCostsSettings(db);
    }
    case "defaults": {
      const before = readCrmDefaultsSettings(db);
      const initial = defaultNewStage(db).id;
      const data = buildDefaultCrmDefaultsData(initial);
      const meta = getCrmSettingsMeta(db);
      db.crmSettings.update(meta.id, { defaults: data });
      bumpCrmSettingsTab(db, "defaults", actorId, {
        before: before.data,
        after: data,
      });
      return readCrmDefaultsSettings(db);
    }
    default:
      throw apiError.invalidField("tab", "تب تنظیمات نامعتبر است");
  }
}

/** Resolve assignee for new leads: rules first, then CRM defaults. */
export function resolveLeadAssignee(
  db: MockDb,
  ctx: {
    source: LeadSource;
    targetCountries: readonly string[];
    utm: Parameters<typeof applyAssignmentRules>[1]["utm"];
  },
): string | null {
  const fromRules = applyAssignmentRules(db, ctx);
  if (fromRules) return fromRules;
  return getCrmSettingsMeta(db).defaults.defaultAssigneeId;
}

export function resolveInitialStageId(db: MockDb): string {
  const meta = getCrmSettingsMeta(db);
  if (db.pipelineStages.has(meta.defaults.initialStageId)) {
    return meta.defaults.initialStageId;
  }
  return defaultNewStage(db).id;
}

export function getNoActivityDays(db: MockDb): number {
  return getCrmSettingsMeta(db).defaults.noActivityDays;
}
