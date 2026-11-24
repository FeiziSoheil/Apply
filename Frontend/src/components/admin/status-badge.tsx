import { Badge } from "@/components/ui/badge";
import type { PublicationStatus } from "@/contracts/content";
import { cn } from "@/lib/utils";

/** Visual tone of a status; each maps to design tokens in `globals.css` */
export type StatusTone =
  | "neutral"
  | "primary"
  | "success"
  | "warning"
  | "danger"
  | "info";

export type StatusDefinition = {
  label: string;
  tone: StatusTone;
};

export type StatusMap<S extends string = string> = Readonly<
  Record<S, StatusDefinition>
>;

const TONE_CLASSES: Record<StatusTone, string> = {
  neutral: "bg-muted text-muted-foreground",
  primary: "bg-primary/10 text-primary",
  success: "bg-success/15 text-success",
  warning: "bg-warning/20 text-warning-foreground",
  danger: "bg-destructive/10 text-destructive",
  info: "bg-info/15 text-info",
};

/** Publication status of editorial content (blog, news, success stories) */
export const PUBLICATION_STATUS_MAP: StatusMap<PublicationStatus> = {
  draft: { label: "پیش‌نویس", tone: "neutral" },
  published: { label: "منتشرشده", tone: "success" },
  scheduled: { label: "زمان‌بندی‌شده", tone: "info" },
};

/** Generic statuses shared by other domains (leads, tickets, bookings …) */
export const COMMON_STATUS_MAP: StatusMap = {
  active: { label: "فعال", tone: "success" },
  inactive: { label: "غیرفعال", tone: "neutral" },
  pending: { label: "در انتظار", tone: "warning" },
  approved: { label: "تأییدشده", tone: "success" },
  rejected: { label: "ردشده", tone: "danger" },
  open: { label: "باز", tone: "info" },
  closed: { label: "بسته", tone: "neutral" },
  ...PUBLICATION_STATUS_MAP,
};

type StatusBadgeProps<S extends string> = {
  status: S;
  /** Status → label & tone; defaults to `COMMON_STATUS_MAP` */
  map?: StatusMap<S> | StatusMap;
  className?: string;
};

/**
 * Colored status pill. Unknown statuses fall back to a neutral badge showing
 * the raw value, so a new backend status never breaks the table.
 */
export function StatusBadge<S extends string>({
  status,
  map = COMMON_STATUS_MAP,
  className,
}: StatusBadgeProps<S>) {
  const definition: StatusDefinition | undefined = (
    map as StatusMap
  )[status];
  const tone = definition?.tone ?? "neutral";
  return (
    <Badge
      variant="outline"
      data-tone={tone}
      className={cn("border-transparent", TONE_CLASSES[tone], className)}
    >
      {definition?.label ?? status}
    </Badge>
  );
}
