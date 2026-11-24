/**
 * Central CRM domain-event emitter.
 *
 * Every mutating CRM flow (lead / task / case / document / user / settings)
 * MUST call `emitDomainEvent` so Activity + Notification + AuditLog stay in
 * one place. Handlers must not duplicate writeAudit/notify/activity inserts.
 */
import type { Activity } from "@/contracts/leads";
import {
  AUDIT_SENSITIVE_FIELDS,
  NOTIFICATION_TYPES,
  type AuditAction,
  type AuditDiff,
  type AuditLog,
  type Notification,
  type NotificationPreferences,
  type NotificationType,
  type NotificationTypePreference,
} from "@/contracts/crm";
import type { MockDb } from "./db";
import { newId, nowIso } from "./utils";

export { AUDIT_SENSITIVE_FIELDS };

const SENSITIVE_SET = new Set<string>(AUDIT_SENSITIVE_FIELDS);

export type DomainNotificationInput = {
  userId: string;
  type: NotificationType;
  title: string;
  body: string;
  link: string;
};

export type DomainEventInput = {
  actorId: string | null;
  action: AuditAction;
  entityType: string;
  entityId: string | null;
  /** Raw before/after; sensitive keys are stripped before persist */
  diff?: AuditDiff | null;
  ip?: string | null;
  /** Optional timeline activity already shaped for insert */
  activity?: Activity | null;
  /** Optional in-app notifications (respect user preferences) */
  notifications?: readonly DomainNotificationInput[];
  now?: string;
};

export type DomainEventResult = {
  audit: AuditLog;
  activity: Activity | null;
  notifications: Notification[];
};

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

/** Recursively strip sensitive keys from a diff map value. */
export function sanitizeAuditValue(value: unknown): unknown {
  if (Array.isArray(value)) {
    return value.map(sanitizeAuditValue);
  }
  if (!isPlainObject(value)) return value;
  const out: Record<string, unknown> = {};
  for (const [key, nested] of Object.entries(value)) {
    if (SENSITIVE_SET.has(key)) continue;
    out[key] = sanitizeAuditValue(nested);
  }
  return out;
}

export function sanitizeAuditRecord(
  record: Record<string, unknown> | null | undefined,
): Record<string, unknown> | null {
  if (!record) return null;
  return sanitizeAuditValue(record) as Record<string, unknown>;
}

export function sanitizeAuditDiff(diff: AuditDiff | null | undefined): AuditDiff | null {
  if (!diff) return null;
  return {
    before: sanitizeAuditRecord(diff.before),
    after: sanitizeAuditRecord(diff.after),
  };
}

export function defaultNotificationPreferences(
  userId: string,
  now = nowIso(),
): NotificationPreferences {
  return {
    userId,
    preferences: NOTIFICATION_TYPES.map(
      (type): NotificationTypePreference => ({
        type,
        inApp: true,
        sms: false,
      }),
    ),
    updatedAt: now,
  };
}

export function getNotificationPreferences(
  db: MockDb,
  userId: string,
): NotificationPreferences {
  const existing = db.notificationPreferences.get(userId);
  if (existing) return existing;
  const created = defaultNotificationPreferences(userId);
  db.notificationPreferences.insert({ ...created, id: userId });
  return created;
}

export function upsertNotificationPreferences(
  db: MockDb,
  userId: string,
  preferences: readonly NotificationTypePreference[],
): NotificationPreferences {
  const now = nowIso();
  const byType = new Map(preferences.map((p) => [p.type, p]));
  const merged: NotificationTypePreference[] = NOTIFICATION_TYPES.map(
    (type) =>
      byType.get(type) ?? {
        type,
        inApp: true,
        sms: false,
      },
  );
  const entry: NotificationPreferences & { id: string } = {
    id: userId,
    userId,
    preferences: merged,
    updatedAt: now,
  };
  if (db.notificationPreferences.has(userId)) {
    return db.notificationPreferences.update(userId, entry);
  }
  db.notificationPreferences.insert(entry);
  return entry;
}

function allowsInApp(
  prefs: NotificationPreferences,
  type: NotificationType,
): boolean {
  const row = prefs.preferences.find((p) => p.type === type);
  return row?.inApp !== false;
}

/**
 * Persist a single Notification if the user has in-app enabled for the type.
 * SMS preference is stored for UI only — no SMS is sent in the mock.
 */
export function deliverNotification(
  db: MockDb,
  input: DomainNotificationInput,
  now = nowIso(),
): Notification | null {
  const prefs = getNotificationPreferences(db, input.userId);
  if (!allowsInApp(prefs, input.type)) return null;
  const entry: Notification = {
    id: newId(),
    userId: input.userId,
    type: input.type,
    title: input.title,
    body: input.body,
    link: input.link,
    readAt: null,
    createdAt: now,
  };
  db.notifications.insert(entry);
  return entry;
}

export function writeAuditLog(
  db: MockDb,
  input: {
    actorId: string | null;
    action: AuditAction;
    entityType: string;
    entityId: string | null;
    diff?: AuditDiff | null;
    ip?: string | null;
    now?: string;
  },
): AuditLog {
  const entry: AuditLog = {
    id: newId(),
    actorId: input.actorId,
    action: input.action,
    entityType: input.entityType,
    entityId: input.entityId,
    diff: sanitizeAuditDiff(input.diff),
    ip: input.ip ?? null,
    createdAt: input.now ?? nowIso(),
  };
  db.auditLogs.insert(entry);
  return entry;
}

/**
 * Single entry-point for CRM side-effects after a successful mutation.
 */
export function emitDomainEvent(
  db: MockDb,
  input: DomainEventInput,
): DomainEventResult {
  const now = input.now ?? nowIso();
  let activity: Activity | null = null;
  if (input.activity) {
    const toInsert = { ...input.activity, createdAt: input.activity.createdAt || now };
    db.activities.insert(toInsert);
    activity = toInsert;
    if (toInsert.entityType === "lead") {
      db.leads.update(toInsert.entityId, {
        lastActivityAt: now,
        updatedAt: now,
      });
    } else if (toInsert.entityType === "case") {
      db.cases.update(toInsert.entityId, { updatedAt: now });
    }
  }

  const notifications: Notification[] = [];
  for (const n of input.notifications ?? []) {
    const created = deliverNotification(db, n, now);
    if (created) notifications.push(created);
  }

  const audit = writeAuditLog(db, {
    actorId: input.actorId,
    action: input.action,
    entityType: input.entityType,
    entityId: input.entityId,
    diff: input.diff,
    ip: input.ip,
    now,
  });

  return { audit, activity, notifications };
}
