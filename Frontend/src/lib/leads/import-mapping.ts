/** Canonical import field keys the wizard / API understand. */
export const LEAD_IMPORT_FIELD_KEYS = [
  "name",
  "mobile",
  "email",
  "country",
  "source",
  "notes",
  "priority",
] as const;

export type LeadImportFieldKey = (typeof LEAD_IMPORT_FIELD_KEYS)[number];

export const LEAD_IMPORT_FIELD_LABELS: Record<LeadImportFieldKey, string> = {
  name: "نام",
  mobile: "موبایل",
  email: "ایمیل",
  country: "کشور",
  source: "منبع",
  notes: "یادداشت",
  priority: "اولویت",
};

/** Persian + English header aliases → field key */
const HEADER_ALIASES: Record<LeadImportFieldKey, readonly string[]> = {
  name: ["name", "full_name", "fullname", "نام", "نام و نام خانوادگی", "نام‌ونام‌خانوادگی"],
  mobile: [
    "mobile",
    "phone",
    "tel",
    "cellphone",
    "cell",
    "موبایل",
    "تلفن",
    "شماره موبایل",
    "شماره",
    "تلفن همراه",
  ],
  email: ["email", "e-mail", "mail", "ایمیل", "پست الکترونیک", "پست‌الکترونیک"],
  country: [
    "country",
    "target_country",
    "destination",
    "کشور",
    "کشور مقصد",
    "مقصد",
  ],
  source: ["source", "lead_source", "منبع", "منبع لید", "کانال"],
  notes: ["notes", "note", "message", "comment", "یادداشت", "پیام", "توضیحات"],
  priority: ["priority", "اولویت"],
};

function normalizeHeader(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/[_-]+/g, " ")
    .replace(/\s+/g, " ");
}

/** Map a single header cell to a known field, or `null` if unknown. */
export function detectImportField(header: string): LeadImportFieldKey | null {
  const normalized = normalizeHeader(header);
  if (!normalized) return null;
  for (const key of LEAD_IMPORT_FIELD_KEYS) {
    for (const alias of HEADER_ALIASES[key]) {
      if (normalizeHeader(alias) === normalized) return key;
    }
  }
  return null;
}

/**
 * Auto-detect column → field mapping from a header row.
 * First match wins when multiple headers map to the same field.
 */
export function autoDetectColumnMapping(
  headers: readonly string[],
): Record<string, LeadImportFieldKey | ""> {
  const used = new Set<LeadImportFieldKey>();
  const mapping: Record<string, LeadImportFieldKey | ""> = {};
  for (const header of headers) {
    const detected = detectImportField(header);
    if (detected && !used.has(detected)) {
      mapping[header] = detected;
      used.add(detected);
    } else {
      mapping[header] = "";
    }
  }
  return mapping;
}

export const IMPORT_MAPPING_STORAGE_KEY = "admin.leads.importColumnMapping";

export type StoredImportMapping = {
  /** header text → field key (empty string = ignore) */
  byHeader: Record<string, LeadImportFieldKey | "">;
};

export function loadStoredImportMapping(): StoredImportMapping | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(IMPORT_MAPPING_STORAGE_KEY);
    if (!raw) return null;
    const parsed: unknown = JSON.parse(raw);
    if (
      !parsed ||
      typeof parsed !== "object" ||
      !("byHeader" in parsed) ||
      typeof (parsed as StoredImportMapping).byHeader !== "object"
    ) {
      return null;
    }
    return parsed as StoredImportMapping;
  } catch {
    return null;
  }
}

export function saveStoredImportMapping(mapping: Record<string, LeadImportFieldKey | "">): void {
  if (typeof window === "undefined") return;
  const payload: StoredImportMapping = { byHeader: mapping };
  window.localStorage.setItem(IMPORT_MAPPING_STORAGE_KEY, JSON.stringify(payload));
}

/**
 * Prefer stored mapping for known headers; fall back to auto-detect for the rest.
 */
export function resolveColumnMapping(
  headers: readonly string[],
): Record<string, LeadImportFieldKey | ""> {
  const stored = loadStoredImportMapping()?.byHeader ?? {};
  const auto = autoDetectColumnMapping(headers);
  const used = new Set<LeadImportFieldKey>();
  const result: Record<string, LeadImportFieldKey | ""> = {};

  for (const header of headers) {
    const fromStore = stored[header];
    if (
      fromStore &&
      LEAD_IMPORT_FIELD_KEYS.includes(fromStore) &&
      !used.has(fromStore)
    ) {
      result[header] = fromStore;
      used.add(fromStore);
      continue;
    }
    const fromAuto = auto[header];
    if (
      fromAuto &&
      LEAD_IMPORT_FIELD_KEYS.includes(fromAuto) &&
      !used.has(fromAuto)
    ) {
      result[header] = fromAuto;
      used.add(fromAuto);
    } else {
      result[header] = "";
    }
  }
  return result;
}
