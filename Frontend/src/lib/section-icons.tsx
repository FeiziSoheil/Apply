import type { LucideIcon } from "lucide-react";
import {
  BookOpen,
  Briefcase,
  Building2,
  CheckCircle,
  ClipboardCheck,
  FileText,
  Globe,
  GraduationCap,
  Home,
  Info,
  MapPin,
  Plane,
  Sparkles,
  Stamp,
  Users,
  Wallet,
} from "lucide-react";
import {
  SECTION_ICON_KEYS,
  type SectionIcon,
} from "@/contracts/richcontent";

/** Lucide components for every allow-listed section icon key. */
export const SECTION_ICON_MAP: Record<SectionIcon, LucideIcon> = {
  sparkles: Sparkles,
  wallet: Wallet,
  "clipboard-check": ClipboardCheck,
  stamp: Stamp,
  briefcase: Briefcase,
  home: Home,
  "building-2": Building2,
  "book-open": BookOpen,
  users: Users,
  info: Info,
  "graduation-cap": GraduationCap,
  globe: Globe,
  "map-pin": MapPin,
  "check-circle": CheckCircle,
  "file-text": FileText,
  plane: Plane,
};

export const SECTION_ICON_OPTIONS: readonly {
  value: SectionIcon;
  label: string;
  Icon: LucideIcon;
}[] = SECTION_ICON_KEYS.map((key) => ({
  value: key,
  label: key,
  Icon: SECTION_ICON_MAP[key],
}));

export function SectionIconGlyph({
  name,
  className,
}: {
  name: SectionIcon | undefined;
  className?: string;
}) {
  if (!name) return null;
  const Icon = SECTION_ICON_MAP[name];
  return <Icon className={className} aria-hidden />;
}
