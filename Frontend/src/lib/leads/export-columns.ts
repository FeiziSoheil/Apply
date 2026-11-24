import { formatJalaliDate } from "@/lib/format";

export const LEAD_EXPORT_COLUMN_KEYS = [
  "id",
  "name",
  "mobile",
  "email",
  "stageId",
  "stageKind",
  "source",
  "priority",
  "assignedTo",
  "interestCountry",
  "targetCountries",
  "tagIds",
  "message",
  "importId",
  "createdAt",
  "createdAtJalali",
  "updatedAt",
  "updatedAtJalali",
  "lastActivityAt",
  "lastActivityAtJalali",
  "nextFollowUpAt",
  "nextFollowUpAtJalali",
] as const;

export type LeadExportColumnKey = (typeof LEAD_EXPORT_COLUMN_KEYS)[number];

export const LEAD_EXPORT_COLUMN_LABELS: Record<LeadExportColumnKey, string> = {
  id: "شناسه",
  name: "نام",
  mobile: "موبایل",
  email: "ایمیل",
  stageId: "شناسه مرحله",
  stageKind: "نوع مرحله",
  source: "منبع",
  priority: "اولویت",
  assignedTo: "مسئول",
  interestCountry: "کشور علاقه‌مندی",
  targetCountries: "کشورهای مقصد",
  tagIds: "تگ‌ها",
  message: "پیام",
  importId: "شناسه ورود",
  createdAt: "ایجاد (ISO)",
  createdAtJalali: "ایجاد (شمسی)",
  updatedAt: "به‌روزرسانی (ISO)",
  updatedAtJalali: "به‌روزرسانی (شمسی)",
  lastActivityAt: "آخرین فعالیت (ISO)",
  lastActivityAtJalali: "آخرین فعالیت (شمسی)",
  nextFollowUpAt: "پیگیری بعدی (ISO)",
  nextFollowUpAtJalali: "پیگیری بعدی (شمسی)",
};

export const DEFAULT_LEAD_EXPORT_COLUMNS: readonly LeadExportColumnKey[] = [
  "name",
  "mobile",
  "email",
  "stageKind",
  "source",
  "assignedTo",
  "createdAt",
  "createdAtJalali",
];

export const LEAD_EXPORT_COLUMNS_STORAGE_KEY = "admin.leads.exportColumns";

export type LeadExportRowSource = {
  id: string;
  name: string;
  mobile: string;
  email: string | null;
  stageId: string;
  stageKind: string;
  source: string;
  priority: string;
  assignedTo: string | null;
  interestCountry: string | null;
  targetCountries: readonly string[];
  tagIds: readonly string[];
  message: string | null;
  importId: string | null;
  createdAt: string;
  updatedAt: string;
  lastActivityAt: string;
  nextFollowUpAt: string | null;
};

function jalaliOrEmpty(iso: string | null | undefined): string {
  if (!iso) return "";
  try {
    return formatJalaliDate(iso, "yyyy/MM/dd HH:mm");
  } catch {
    return "";
  }
}

export function leadExportCellValue(
  lead: LeadExportRowSource,
  column: LeadExportColumnKey,
): string {
  switch (column) {
    case "id":
      return lead.id;
    case "name":
      return lead.name;
    case "mobile":
      return lead.mobile;
    case "email":
      return lead.email ?? "";
    case "stageId":
      return lead.stageId;
    case "stageKind":
      return lead.stageKind;
    case "source":
      return lead.source;
    case "priority":
      return lead.priority;
    case "assignedTo":
      return lead.assignedTo ?? "";
    case "interestCountry":
      return lead.interestCountry ?? "";
    case "targetCountries":
      return lead.targetCountries.join("|");
    case "tagIds":
      return lead.tagIds.join("|");
    case "message":
      return lead.message ?? "";
    case "importId":
      return lead.importId ?? "";
    case "createdAt":
      return lead.createdAt;
    case "createdAtJalali":
      return jalaliOrEmpty(lead.createdAt);
    case "updatedAt":
      return lead.updatedAt;
    case "updatedAtJalali":
      return jalaliOrEmpty(lead.updatedAt);
    case "lastActivityAt":
      return lead.lastActivityAt;
    case "lastActivityAtJalali":
      return jalaliOrEmpty(lead.lastActivityAt);
    case "nextFollowUpAt":
      return lead.nextFollowUpAt ?? "";
    case "nextFollowUpAtJalali":
      return jalaliOrEmpty(lead.nextFollowUpAt);
    default: {
      const _exhaustive: never = column;
      return _exhaustive;
    }
  }
}

export function parseExportColumnsParam(
  raw: string | undefined,
): LeadExportColumnKey[] {
  if (!raw?.trim()) return [...DEFAULT_LEAD_EXPORT_COLUMNS];
  const allowed = new Set<string>(LEAD_EXPORT_COLUMN_KEYS);
  const parsed = raw
    .split(",")
    .map((part) => part.trim())
    .filter((part): part is LeadExportColumnKey => allowed.has(part));
  return parsed.length > 0 ? parsed : [...DEFAULT_LEAD_EXPORT_COLUMNS];
}

export function loadStoredExportColumns(): LeadExportColumnKey[] | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(LEAD_EXPORT_COLUMNS_STORAGE_KEY);
    if (!raw) return null;
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return null;
    const allowed = new Set<string>(LEAD_EXPORT_COLUMN_KEYS);
    const cols = parsed.filter(
      (item): item is LeadExportColumnKey =>
        typeof item === "string" && allowed.has(item),
    );
    return cols.length > 0 ? cols : null;
  } catch {
    return null;
  }
}

export function saveStoredExportColumns(columns: readonly LeadExportColumnKey[]): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(
    LEAD_EXPORT_COLUMNS_STORAGE_KEY,
    JSON.stringify(columns),
  );
}
