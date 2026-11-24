import type {
  AssignmentCondition,
  AssignmentRule,
  AuditAction,
  AuditDiff,
  AuditLog,
  LostReason,
  Notification,
  NotificationType,
  PipelineStage,
  PipelineStageKind,
  Tag,
} from "@/contracts/crm";
import type { Lead, LeadSource, Utm } from "@/contracts/leads";
import type { MockDb } from "../db";
import { deliverNotification, emitDomainEvent } from "../domain-events";
import { apiError } from "../errors";
import type { MockUser } from "../types";
import { newId, nowIso } from "../utils";

/* -------------------------------------------------------------------------- */
/*  Default pipeline keys (seed + legacy status mapping)                      */
/* -------------------------------------------------------------------------- */

export const DEFAULT_STAGE_KEYS = [
  "new",
  "first_contact",
  "consultation_done",
  "evaluation_proposal",
  "contract",
  "converted",
  "churned",
] as const;

export type DefaultStageKey = (typeof DEFAULT_STAGE_KEYS)[number];

/** Map legacy fixed LeadStatus → default pipeline stage key */
export const LEGACY_STATUS_TO_STAGE_KEY: Record<string, DefaultStageKey> = {
  new: "new",
  contacted: "first_contact",
  qualified: "consultation_done",
  consultation_scheduled: "consultation_done",
  proposal_sent: "evaluation_proposal",
  won: "converted",
  lost: "churned",
};

export function stagesByKind(db: MockDb): Map<PipelineStageKind, PipelineStage[]> {
  const map = new Map<PipelineStageKind, PipelineStage[]>();
  for (const stage of db.pipelineStages.all()) {
    const list = map.get(stage.kind) ?? [];
    list.push(stage);
    map.set(stage.kind, list);
  }
  return map;
}

export function requireStage(db: MockDb, stageId: string): PipelineStage {
  const stage = db.pipelineStages.get(stageId);
  if (!stage) throw apiError.invalidField("stageId", "مرحله پایپ‌لاین پیدا نشد");
  return stage;
}

export function stageByKey(db: MockDb, key: string): PipelineStage | undefined {
  return db.pipelineStages.find((stage) => stage.key === key);
}

export function defaultNewStage(db: MockDb): PipelineStage {
  const stage =
    stageByKey(db, "new") ??
    db.pipelineStages
      .all()
      .filter((entry) => entry.kind === "new")
      .sort((a, b) => a.order - b.order)[0];
  if (!stage) throw apiError.internal("مرحله پیش‌فرض new در پایپ‌لاین یافت نشد");
  return stage;
}

export function wonStage(db: MockDb): PipelineStage {
  const stage =
    stageByKey(db, "converted") ??
    db.pipelineStages
      .all()
      .filter((entry) => entry.kind === "won")
      .sort((a, b) => a.order - b.order)[0];
  if (!stage) throw apiError.internal("مرحله won در پایپ‌لاین یافت نشد");
  return stage;
}

/** Ensure at least one stage remains for every kind after a mutate */
export function assertKindCoverage(
  stages: readonly PipelineStage[],
  message = "حداقل یک مرحله از هر نوع (new / open / won / lost) باید وجود داشته باشد",
): void {
  for (const kind of ["new", "open", "won", "lost"] as const) {
    if (!stages.some((stage) => stage.kind === kind)) {
      throw apiError.conflict(message, { kind: [`هیچ مرحله‌ای از نوع ${kind} باقی نمانده`] });
    }
  }
}

/* -------------------------------------------------------------------------- */
/*  Optimistic concurrency                                                    */
/* -------------------------------------------------------------------------- */

export function readIfMatch(request: Request): number | null {
  const raw = request.headers.get("if-match")?.trim();
  if (!raw) return null;
  const stripped = raw.replace(/^W\//, "").replaceAll('"', "");
  const parsed = Number(stripped);
  return Number.isInteger(parsed) && parsed >= 1 ? parsed : null;
}

export function assertVersionMatch(
  request: Request,
  currentVersion: number,
  required = true,
): void {
  const matched = readIfMatch(request);
  if (matched === null) {
    if (required) {
      throw apiError.validation({
        "If-Match": ["هدر If-Match با نسخه فعلی الزامی است"],
      });
    }
    return;
  }
  if (matched !== currentVersion) {
    throw apiError.versionMismatch(currentVersion);
  }
}

export function bumpVersion(version: number): number {
  return version + 1;
}

/* -------------------------------------------------------------------------- */
/*  Assignment                                                                */
/* -------------------------------------------------------------------------- */

function matchesCondition(
  condition: AssignmentCondition,
  ctx: {
    source: LeadSource;
    targetCountries: readonly string[];
    utm: Utm | null;
  },
): boolean {
  switch (condition.type) {
    case "always":
      return true;
    case "target_country":
      return ctx.targetCountries.includes(condition.countrySlug);
    case "source":
      return ctx.source === condition.source;
    case "utm_campaign":
      return ctx.utm?.campaign === condition.campaign;
    default:
      return false;
  }
}

export function pickConsultantForRule(
  db: MockDb,
  rule: AssignmentRule,
): string | null {
  const ids = rule.consultantIds.filter((id) => db.consultants.has(id));
  if (ids.length === 0) return null;

  if (rule.strategy === "fixed") return ids[0] ?? null;

  if (rule.strategy === "least_loaded") {
    let best = ids[0];
    let bestCount = Number.POSITIVE_INFINITY;
    for (const id of ids) {
      const count = db.leads.filter(
        (lead) =>
          lead.assignedTo === id &&
          lead.stageKind !== "won" &&
          lead.stageKind !== "lost" &&
          !lead.archived,
      ).length;
      if (count < bestCount) {
        best = id;
        bestCount = count;
      }
    }
    return best;
  }

  // round_robin — rotate by total assigned count among candidates
  const counts = ids.map((id) => ({
    id,
    count: db.leads.filter((lead) => lead.assignedTo === id).length,
  }));
  counts.sort((a, b) => a.count - b.count);
  return counts[0]?.id ?? null;
}

export function resolveAssignmentMatch(
  db: MockDb,
  ctx: {
    source: LeadSource;
    targetCountries: readonly string[];
    utm: Utm | null;
  },
): { rule: AssignmentRule; consultantId: string } | null {
  const rules = db.assignmentRules
    .all()
    .filter((rule) => rule.active)
    .sort((a, b) => a.order - b.order);

  for (const rule of rules) {
    const ok = rule.conditions.every((condition) =>
      matchesCondition(condition, ctx),
    );
    if (!ok) continue;
    const consultantId = pickConsultantForRule(db, rule);
    if (consultantId) return { rule, consultantId };
  }
  return null;
}

export function applyAssignmentRules(
  db: MockDb,
  ctx: {
    source: LeadSource;
    targetCountries: readonly string[];
    utm: Utm | null;
  },
): string | null {
  return resolveAssignmentMatch(db, ctx)?.consultantId ?? null;
}

/* -------------------------------------------------------------------------- */
/*  Audit & notifications                                                     */
/* -------------------------------------------------------------------------- */

/** Prefer a single `emitDomainEvent` call that also carries activity/notifications. */
export function writeAudit(
  db: MockDb,
  input: {
    actorId: string | null;
    action: AuditAction;
    entityType: string;
    entityId: string | null;
    diff?: AuditDiff | null;
    ip?: string | null;
  },
): AuditLog {
  return emitDomainEvent(db, input).audit;
}

/** Prefer `emitDomainEvent` for new mutation paths. */
export function notify(
  db: MockDb,
  input: {
    userId: string;
    type: NotificationType;
    title: string;
    body: string;
    link: string;
  },
): Notification {
  const created = deliverNotification(db, input);
  if (created) return created;
  return {
    id: newId(),
    userId: input.userId,
    type: input.type,
    title: input.title,
    body: input.body,
    link: input.link,
    readAt: null,
    createdAt: nowIso(),
  };
}

export function assertLeadAccess(user: MockUser, lead: Lead): void {
  if (user.role === "consultant" && lead.assignedTo !== user.id) {
    throw apiError.forbidden();
  }
}

export function isTerminalKind(kind: PipelineStageKind): boolean {
  return kind === "won" || kind === "lost";
}

export function findLostReason(db: MockDb, id: string): LostReason {
  const reason = db.lostReasons.get(id);
  if (!reason || !reason.active) {
    throw apiError.invalidField("lostReasonId", "دلیل ریزش معتبر نیست");
  }
  return reason;
}

export function resolveTags(db: MockDb, tagIds: readonly string[]): Tag[] {
  return tagIds
    .map((id) => db.tags.get(id))
    .filter((tag): tag is Tag => Boolean(tag));
}
