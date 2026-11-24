import type { StatusMap } from "@/components/admin/status-badge";
import {
  CASE_STAGES,
  CASE_STATUSES,
  type CaseStage,
  type CaseStatus,
} from "@/contracts/students";

export const CASE_STATUS_MAP: StatusMap<CaseStatus> = {
  active: { label: "فعال", tone: "success" },
  on_hold: { label: "متوقف", tone: "warning" },
  closed: { label: "بسته", tone: "neutral" },
};

export const CASE_STAGE_LABELS: Record<CaseStage, string> = {
  consultation: "مشاوره",
  documents: "مدارک",
  application: "اپلای",
  offer: "پذیرش",
  visa: "ویزا",
  departure: "اعزام",
};

export const CASE_STATUS_FILTER_OPTIONS = CASE_STATUSES.map((value) => ({
  value,
  label: CASE_STATUS_MAP[value].label,
}));

export const CASE_STAGE_FILTER_OPTIONS = CASE_STAGES.map((value) => ({
  value,
  label: CASE_STAGE_LABELS[value],
}));
