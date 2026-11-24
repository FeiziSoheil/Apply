import type { DegreeLevel } from "@/types";

export const DEGREE_LEVELS: readonly DegreeLevel[] = [
  "bachelor",
  "master",
  "phd",
  "language",
  "foundation",
] as const;

export const DEGREE_LEVEL_LABELS: Record<DegreeLevel, string> = {
  bachelor: "کارشناسی",
  master: "کارشناسی ارشد",
  phd: "دکتری",
  language: "دوره زبان",
  foundation: "فاندیشن",
};

export function isDegreeLevel(value: string): value is DegreeLevel {
  return (DEGREE_LEVELS as readonly string[]).includes(value);
}
