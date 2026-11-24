import type { CrmSettingsTab } from "@/contracts/crm-settings";

export const CRM_SETTINGS_TAB_ITEMS: readonly {
  id: CrmSettingsTab;
  label: string;
  description: string;
}[] = [
  {
    id: "pipeline",
    label: "پایپ‌لاین",
    description: "مراحل کانبان، رنگ، نوع و سقف WIP",
  },
  {
    id: "lostReasons",
    label: "دلایل ریزش",
    description: "دلایل فعال و غیرفعال برای گزارش",
  },
  {
    id: "tags",
    label: "تگ‌ها",
    description: "برچسب‌ها، ادغام و شمارش استفاده",
  },
  {
    id: "assignmentRules",
    label: "قوانین تخصیص",
    description: "اولویت، شرط، راهبرد و شبیه‌ساز",
  },
  {
    id: "messageTemplates",
    label: "قالب پیام‌ها",
    description: "SMS، واتساپ و ایمیل با متغیرها",
  },
  {
    id: "caseTemplates",
    label: "قالب پرونده‌ها",
    description: "مراحل، مدارک و کارهای پیش‌فرض",
  },
  {
    id: "campaignCosts",
    label: "هزینه کمپین‌ها",
    description: "هزینه ماهانه منبع/کمپین به ریال",
  },
  {
    id: "defaults",
    label: "پیش‌فرض‌ها",
    description: "مرحله اولیه، مسئول، ساعات کاری",
  },
] as const;

export const CRM_SETTINGS_TAB_IDS = CRM_SETTINGS_TAB_ITEMS.map((t) => t.id);
