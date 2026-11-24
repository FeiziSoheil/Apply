import {
  LEAD_IMPORT_TAG_TITLE,
  LEAD_PRIORITIES,
  LEAD_SOURCES,
  MAX_LEAD_EXPORT_ROWS,
  MAX_LEAD_IMPORT_ROWS,
  type Lead,
  type LeadExportFormat,
  type LeadExportQuery,
  type LeadImportBody,
  type LeadImportDuplicateBehavior,
  type LeadImportReport,
  type LeadImportRevertReport,
  type LeadImportRowError,
  type LeadImportRowInput,
  type LeadPriority,
  type LeadSource,
} from "@/contracts/leads";
import {
  LEAD_EXPORT_COLUMN_LABELS,
  leadExportCellValue,
  parseExportColumnsParam,
  type LeadExportColumnKey,
  type LeadExportRowSource,
} from "@/lib/leads/export-columns";
import { buildCsvDocument } from "@/lib/leads/csv-safe";
import { normalizeIranMobile } from "@/lib/leads/normalize-mobile";
import type { MockDb } from "../db";
import { apiError } from "../errors";
import { emitDomainEvent } from "../domain-events";
import {
  applyAssignmentRules,
  defaultNewStage,
  isTerminalKind,
  requireStage,
  bumpVersion,
} from "./crm";
import { newId, nowIso, sleep } from "../utils";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function ensureImportTagId(db: MockDb): string {
  const existing = db.tags.find((tag) => tag.title === LEAD_IMPORT_TAG_TITLE);
  if (existing) return existing.id;
  const now = nowIso();
  const tag = db.tags.insert({
    id: newId(),
    title: LEAD_IMPORT_TAG_TITLE,
    color: "slate",
    createdAt: now,
    updatedAt: now,
  });
  return tag.id;
}

function resolveCountrySlug(
  db: MockDb,
  raw: string | undefined,
): { slug: string | null; error?: string } {
  if (!raw?.trim()) return { slug: null };
  const value = raw.trim();
  const bySlug = db.countries.find((c) => c.slug === value);
  if (bySlug) return { slug: bySlug.slug };
  const byName = db.countries.find(
    (c) => c.nameFa === value || c.nameEn.toLowerCase() === value.toLowerCase(),
  );
  if (byName) return { slug: byName.slug };
  return { slug: null, error: `کشور «${value}» شناخته نشد` };
}

function resolveSource(raw: string | undefined): {
  source: LeadSource;
  error?: string;
} {
  if (!raw?.trim()) return { source: "import" };
  const value = raw.trim().toLowerCase();
  if ((LEAD_SOURCES as readonly string[]).includes(value)) {
    return { source: value as LeadSource };
  }
  return { source: "import", error: `منبع «${raw}» معتبر نیست` };
}

function resolvePriority(raw: string | undefined): {
  priority: LeadPriority;
  error?: string;
} {
  if (!raw?.trim()) return { priority: "normal" };
  const value = raw.trim().toLowerCase();
  const faMap: Record<string, LeadPriority> = {
    کم: "low",
    پایین: "low",
    عادی: "normal",
    متوسط: "normal",
    بالا: "high",
    زیاد: "high",
  };
  if (faMap[raw.trim()]) return { priority: faMap[raw.trim()] };
  if ((LEAD_PRIORITIES as readonly string[]).includes(value)) {
    return { priority: value as LeadPriority };
  }
  return { priority: "normal", error: `اولویت «${raw}» معتبر نیست` };
}

type PreparedRow = {
  row: number;
  name: string;
  mobile: string;
  email: string | null;
  country: string | null;
  source: LeadSource;
  notes: string | null;
  priority: LeadPriority;
  duplicateOf: Lead | null;
  duplicateInFile: boolean;
};

function validateRow(
  db: MockDb,
  input: LeadImportRowInput,
  seenMobiles: Map<string, number>,
): { ok: PreparedRow | null; errors: LeadImportRowError | null } {
  const fields: Record<string, string[]> = {};
  const push = (field: string, message: string) => {
    fields[field] = [...(fields[field] ?? []), message];
  };

  const name = input.name?.trim() ?? "";
  if (name.length < 3) push("name", "نام باید حداقل ۳ حرف باشد");
  if (name.length > 80) push("name", "نام نباید بیشتر از ۸۰ حرف باشد");

  const mobileRaw = input.mobile?.trim() ?? "";
  const mobile = normalizeIranMobile(mobileRaw);
  if (!mobile) push("mobile", "شماره موبایل معتبر نیست (مثال: 09123456789)");

  let email: string | null = null;
  if (input.email?.trim()) {
    const normalized = input.email.trim().toLowerCase();
    if (!EMAIL_RE.test(normalized)) push("email", "ایمیل معتبر نیست");
    else email = normalized;
  }

  const countryResult = resolveCountrySlug(db, input.country);
  if (countryResult.error) push("country", countryResult.error);

  // فایل می‌تواند ستون منبع داشته باشد؛ موجودیت همیشه `source=import` می‌گیرد.
  void resolveSource(input.source);

  const priorityResult = resolvePriority(input.priority);
  if (priorityResult.error) push("priority", priorityResult.error);

  let duplicateInFile = false;
  if (mobile) {
    const prev = seenMobiles.get(mobile);
    if (prev !== undefined) {
      duplicateInFile = true;
      push("mobile", `تکراری داخل فایل (سطر ${prev})`);
    } else {
      seenMobiles.set(mobile, input.row);
    }
  }

  const duplicateOf =
    mobile && !duplicateInFile
      ? db.leads.find(
          (lead) =>
            lead.mobile === mobile &&
            !lead.archived &&
            !isTerminalKind(lead.stageKind),
        ) ?? null
      : null;

  if (Object.keys(fields).length > 0) {
    return { ok: null, errors: { row: input.row, fields } };
  }

  return {
    ok: {
      row: input.row,
      name,
      mobile: mobile!,
      email,
      country: countryResult.slug,
      source: "import",
      notes: input.notes?.trim() || null,
      priority: priorityResult.priority,
      duplicateOf,
      duplicateInFile: false,
    },
    errors: null,
  };
}

function applyDuplicateBehavior(
  row: PreparedRow,
  behavior: LeadImportDuplicateBehavior,
): { action: "create" | "update" | "reject"; error?: LeadImportRowError } {
  if (!row.duplicateOf) return { action: "create" };
  if (behavior === "create") return { action: "create" };
  if (behavior === "update") return { action: "update" };
  return {
    action: "reject",
    error: {
      row: row.row,
      fields: {
        mobile: [
          `سرنخ تکراری با ${row.duplicateOf.name} (${row.duplicateOf.mobile})`,
        ],
      },
    },
  };
}

export async function runLeadImport(
  db: MockDb,
  actorId: string,
  body: LeadImportBody,
): Promise<LeadImportReport> {
  if (body.rows.length > MAX_LEAD_IMPORT_ROWS) {
    throw apiError.validation(
      {
        rows: [
          `حداکثر ${MAX_LEAD_IMPORT_ROWS.toLocaleString("fa-IR")} سطر مجاز است`,
        ],
      },
      "تعداد سطرهای فایل بیش از حد مجاز است",
    );
  }

  if (body.rows.length >= 200 && process.env.NEXT_PUBLIC_API_MOCK_DELAY !== "off") {
    await sleep(Math.min(2_500, 400 + body.rows.length));
  }

  const importId = newId();
  const dryRun = body.dryRun;
  const behavior = body.duplicateBehavior;
  const stage = body.stageId
    ? requireStage(db, body.stageId)
    : defaultNewStage(db);
  if (body.assignedTo && !db.consultants.has(body.assignedTo)) {
    throw apiError.invalidField("assignedTo", "مشاور انتخاب‌شده وجود ندارد");
  }

  const importTagId = ensureImportTagId(db);
  const seenMobiles = new Map<string, number>();
  const errors: LeadImportRowError[] = [];
  const prepared: PreparedRow[] = [];

  let duplicateRows = 0;

  for (const input of body.rows) {
    const { ok, errors: rowError } = validateRow(db, input, seenMobiles);
    if (rowError) {
      errors.push(rowError);
      if (
        rowError.fields.mobile?.some((msg: string) => msg.includes("تکراری"))
      ) {
        duplicateRows += 1;
      }
      continue;
    }
    if (ok) prepared.push(ok);
  }

  let createdRows = 0;
  let updatedRows = 0;
  let rejectedRows = errors.length;

  const actionable: Array<{
    row: PreparedRow;
    action: "create" | "update";
  }> = [];

  for (const row of prepared) {
    if (row.duplicateOf) duplicateRows += 1;
    const decision = applyDuplicateBehavior(row, behavior);
    if (decision.action === "reject") {
      rejectedRows += 1;
      if (decision.error) errors.push(decision.error);
      continue;
    }
    actionable.push({ row, action: decision.action });
  }

  const validRows = actionable.length;

  if (!dryRun) {
    const now = nowIso();
    for (const { row, action } of actionable) {
      if (action === "update" && row.duplicateOf) {
        const existing = row.duplicateOf;
        const tagIds = existing.tagIds.includes(importTagId)
          ? existing.tagIds
          : [...existing.tagIds, importTagId];
        const targetCountries = row.country
          ? Array.from(new Set([...existing.targetCountries, row.country]))
          : existing.targetCountries;
        db.leads.update(existing.id, {
          name: row.name,
          email: row.email ?? existing.email,
          message: row.notes ?? existing.message,
          priority: row.priority,
          interestCountry: row.country ?? existing.interestCountry,
          targetCountries,
          tagIds,
          importId,
          version: bumpVersion(existing.version),
          updatedAt: now,
          lastActivityAt: now,
        });
        emitDomainEvent(db, {
          actorId,
          action: "update",
          entityType: "lead",
          entityId: existing.id,
          activity: {
            id: newId(),
            entityType: "lead",
            entityId: existing.id,
            leadId: existing.id,
            actorId,
            authorId: actorId,
            createdAt: now,
            type: "system",
            body: `به‌روزرسانی از ورود فایل (${importId})`,
          },
          diff: {
            before: { name: existing.name, mobile: existing.mobile },
            after: { name: row.name, importId },
          },
        });
        updatedRows += 1;
        continue;
      }

      const assignedTo =
        body.assignedTo !== undefined
          ? body.assignedTo
          : applyAssignmentRules(db, {
              source: "import",
              targetCountries: row.country ? [row.country] : [],
              utm: null,
            });

      const lead: Lead = {
        id: newId(),
        source: "import",
        stageId: stage.id,
        stageKind: stage.kind,
        lostReasonId: null,
        name: row.name,
        mobile: row.mobile,
        email: row.email,
        preferredContact: null,
        contactPreference: null,
        message: row.notes,
        interestDegree: null,
        interestCountry: row.country,
        targetCountries: row.country ? [row.country] : [],
        tagIds: [importTagId],
        assessment: null,
        utm: null,
        assignedTo,
        nextFollowUpAt: null,
        lastActivityAt: now,
        priority: row.priority,
        value: null,
        convertedCaseId: null,
        importId,
        archived: false,
        version: 1,
        createdAt: now,
        updatedAt: now,
      };
      db.leads.insert(lead);
      emitDomainEvent(db, {
        actorId,
        action: "create",
        entityType: "lead",
        entityId: lead.id,
        activity: {
          id: newId(),
          entityType: "lead",
          entityId: lead.id,
          leadId: lead.id,
          actorId,
          authorId: actorId,
          createdAt: now,
          type: "system",
          body: `ایجاد از ورود فایل (${importId})`,
        },
        notifications: assignedTo
          ? [
              {
                userId: assignedTo,
                type: "lead_assigned",
                title: "سرنخ واردشده به شما تخصیص یافت",
                body: `${lead.name} — ${lead.mobile}`,
                link: `/admin/leads/${lead.id}`,
              },
            ]
          : [],
        diff: { before: null, after: { importId, source: "import" } },
      });
      createdRows += 1;
    }
  } else {
    createdRows = actionable.filter((a) => a.action === "create").length;
    updatedRows = actionable.filter((a) => a.action === "update").length;
  }

  emitDomainEvent(db, {
    actorId,
    action: "import",
    entityType: "lead",
    entityId: null,
    diff: {
      before: null,
      after: {
        dryRun,
        importId,
        totalRows: body.rows.length,
        createdRows,
        updatedRows,
        rejectedRows,
        duplicateRows,
      },
    },
  });

  return {
    importId,
    dryRun,
    totalRows: body.rows.length,
    validRows,
    importedRows: createdRows + updatedRows,
    createdRows,
    updatedRows,
    rejectedRows,
    duplicateRows,
    errors: errors.sort((a, b) => a.row - b.row),
  };
}

function hasNonSystemActivity(db: MockDb, leadId: string): boolean {
  return db.activities
    .all()
    .some(
      (activity) =>
        (activity.entityId === leadId || activity.leadId === leadId) &&
        activity.type !== "system",
    );
}

export function revertLeadImport(
  db: MockDb,
  actorId: string,
  importId: string,
): LeadImportRevertReport {
  const leads = db.leads
    .all()
    .filter((lead) => lead.importId === importId && !lead.archived);
  if (leads.length === 0) {
    throw apiError.notFound("ورودی فایل");
  }

  let deletedCount = 0;
  let skippedCount = 0;

  for (const lead of leads) {
    if (hasNonSystemActivity(db, lead.id)) {
      skippedCount += 1;
      continue;
    }
    for (const activity of db.activities
      .all()
      .filter(
        (item) => item.entityId === lead.id || item.leadId === lead.id,
      )) {
      db.activities.remove(activity.id);
    }
    db.leads.remove(lead.id);
    deletedCount += 1;
  }

  emitDomainEvent(db, {
    actorId,
    action: "delete",
    entityType: "lead",
    entityId: null,
    diff: {
      before: { importId, count: leads.length },
      after: { deletedCount, skippedCount },
    },
  });

  return { importId, deletedCount, skippedCount };
}

function toExportSource(lead: Lead): LeadExportRowSource {
  return {
    id: lead.id,
    name: lead.name,
    mobile: lead.mobile,
    email: lead.email,
    stageId: lead.stageId,
    stageKind: lead.stageKind,
    source: lead.source,
    priority: lead.priority,
    assignedTo: lead.assignedTo,
    interestCountry: lead.interestCountry,
    targetCountries: lead.targetCountries,
    tagIds: lead.tagIds,
    message: lead.message,
    importId: lead.importId ?? null,
    createdAt: lead.createdAt,
    updatedAt: lead.updatedAt,
    lastActivityAt: lead.lastActivityAt,
    nextFollowUpAt: lead.nextFollowUpAt,
  };
}

export async function buildLeadExport(
  leads: readonly Lead[],
  query: LeadExportQuery,
  format: LeadExportFormat,
): Promise<{
  format: LeadExportFormat;
  content: string;
  filename: string;
  rowCount: number;
}> {
  if (leads.length > MAX_LEAD_EXPORT_ROWS) {
    throw apiError.validation(
      {
        rows: [
          `تعداد نتایج (${leads.length.toLocaleString("fa-IR")}) از سقف ${MAX_LEAD_EXPORT_ROWS.toLocaleString("fa-IR")} سطر بیشتر است. فیلترها را محدودتر کنید.`,
        ],
      },
      "تعداد سطرهای خروجی بیش از حد مجاز است",
    );
  }

  if (leads.length >= 5_000 && process.env.NEXT_PUBLIC_API_MOCK_DELAY !== "off") {
    await sleep(Math.min(2_000, 300 + Math.floor(leads.length / 20)));
  }

  const columns = parseExportColumnsParam(query.columns);
  const header = columns.map((col) => LEAD_EXPORT_COLUMN_LABELS[col]);
  const matrix = leads.map((lead) => {
    const source = toExportSource(lead);
    return columns.map((col) => leadExportCellValue(source, col));
  });

  const stamp = nowIso().slice(0, 10);
  if (format === "csv") {
    return {
      format: "csv",
      content: buildCsvDocument(header, matrix),
      filename: `leads-${stamp}.csv`,
      rowCount: leads.length,
    };
  }

  const XLSX = await import("xlsx");
  const sheetData = [header, ...matrix];
  const sheet = XLSX.utils.aoa_to_sheet(sheetData);
  const book = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(book, sheet, "Leads");
  const base64 = XLSX.write(book, {
    type: "base64",
    bookType: "xlsx",
  }) as string;
  return {
    format: "xlsx",
    content: base64,
    filename: `leads-${stamp}.xlsx`,
    rowCount: leads.length,
  };
}

export type { LeadExportColumnKey };
