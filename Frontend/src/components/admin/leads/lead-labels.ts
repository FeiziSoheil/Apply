import type { StatusMap, StatusTone } from "@/components/admin/status-badge";
import type { PipelineStageColor, PipelineStageKind } from "@/contracts/crm";
import { PIPELINE_STAGE_KINDS } from "@/contracts/crm";
import type { LeadPriority, LeadSource, LeadStatus } from "@/contracts/leads";
import { LEAD_PRIORITIES, LEAD_SOURCES, LEAD_STATUSES } from "@/contracts/leads";

export const LEAD_STAGE_KIND_MAP: StatusMap<PipelineStageKind> = {
  new: { label: "جدید", tone: "info" },
  open: { label: "در جریان", tone: "primary" },
  won: { label: "تبدیل‌شده", tone: "success" },
  lost: { label: "ریزش", tone: "danger" },
};

const COLOR_TONE: Record<PipelineStageColor, StatusTone> = {
  slate: "neutral",
  blue: "info",
  cyan: "info",
  violet: "primary",
  amber: "warning",
  emerald: "success",
  rose: "danger",
};

export function leadStageTone(
  color: PipelineStageColor | undefined,
  kind: PipelineStageKind,
): StatusTone {
  if (color) return COLOR_TONE[color];
  return LEAD_STAGE_KIND_MAP[kind].tone;
}

/** @deprecated Fixed statuses for legacy status dialog */
export const LEAD_STATUS_MAP: StatusMap<LeadStatus> = {
  new: { label: "جدید", tone: "info" },
  contacted: { label: "تماس اول", tone: "primary" },
  qualified: { label: "مشاوره انجام شد", tone: "success" },
  consultation_scheduled: { label: "مشاوره انجام شد", tone: "warning" },
  proposal_sent: { label: "ارزیابی و پیشنهاد", tone: "primary" },
  won: { label: "تبدیل‌شده", tone: "success" },
  lost: { label: "ریزش", tone: "danger" },
};

export const LEAD_PRIORITY_MAP: StatusMap<LeadPriority> = {
  low: { label: "کم", tone: "neutral" },
  normal: { label: "عادی", tone: "info" },
  high: { label: "بالا", tone: "warning" },
};

export const LEAD_SOURCE_LABELS: Record<LeadSource, string> = {
  assessment: "ارزیابی",
  hero_assessment: "ارزیابی سریع",
  callback: "درخواست تماس",
  contact: "تماس با ما",
  newsletter: "خبرنامه",
  booking: "رزرو",
  manual: "ثبت دستی",
  import: "ورود CSV",
};

export const LEAD_STAGE_KIND_FILTER_OPTIONS = PIPELINE_STAGE_KINDS.map(
  (value) => ({
    value,
    label: LEAD_STAGE_KIND_MAP[value].label,
  }),
);

export const LEAD_STATUS_FILTER_OPTIONS = LEAD_STATUSES.map((value) => ({
  value,
  label: LEAD_STATUS_MAP[value].label,
}));

export const LEAD_SOURCE_FILTER_OPTIONS = LEAD_SOURCES.map((value) => ({
  value,
  label: LEAD_SOURCE_LABELS[value],
}));

export const LEAD_PRIORITY_FILTER_OPTIONS = LEAD_PRIORITIES.map((value) => ({
  value,
  label: LEAD_PRIORITY_MAP[value].label,
}));
