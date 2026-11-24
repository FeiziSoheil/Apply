import {
  Award,
  FileText,
  GraduationCap,
  Home,
  IdCard,
  Languages,
  type LucideIcon,
  type LucideProps,
} from "lucide-react";

/** Map service icon keys (from mock data) to Lucide components */
const SERVICE_ICONS: Record<string, LucideIcon> = {
  "graduation-cap": GraduationCap,
  passport: IdCard,
  languages: Languages,
  award: Award,
  "file-text": FileText,
  home: Home,
};

/** Allowed Lucide keys for the admin service icon picker */
export const SERVICE_ICON_OPTIONS = [
  { value: "graduation-cap", label: "کلاه فارغ‌التحصیلی" },
  { value: "passport", label: "پاسپورت" },
  { value: "languages", label: "زبان" },
  { value: "award", label: "بورسیه / جایزه" },
  { value: "file-text", label: "مدارک" },
  { value: "home", label: "اقامت" },
] as const;

export type ServiceIconKey = (typeof SERVICE_ICON_OPTIONS)[number]["value"];

export const SERVICE_ICON_KEYS = SERVICE_ICON_OPTIONS.map(
  (option) => option.value,
) as unknown as [ServiceIconKey, ...ServiceIconKey[]];

export function getServiceIcon(name: string): LucideIcon {
  return SERVICE_ICONS[name] ?? GraduationCap;
}

/** Renders the icon for a service icon key (avoids creating components in render) */
export function ServiceIcon({
  name,
  ...props
}: { name: string } & LucideProps) {
  const Icon = SERVICE_ICONS[name] ?? GraduationCap;
  return <Icon {...props} />;
}
