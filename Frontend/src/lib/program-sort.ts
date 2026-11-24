import type { ProgramSort } from "@/types";

export const PROGRAM_SORTS = [
  "relevant",
  "cheapest",
  "nearest_deadline",
] as const satisfies readonly ProgramSort[];

export const PROGRAM_SORT_LABELS: Record<ProgramSort, string> = {
  relevant: "مرتبط‌ترین",
  cheapest: "ارزان‌ترین شهریه",
  nearest_deadline: "نزدیک‌ترین مهلت",
};

export function isProgramSort(value: string): value is ProgramSort {
  return (PROGRAM_SORTS as readonly string[]).includes(value);
}
