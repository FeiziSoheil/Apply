import type { Continent, CostBand } from "@/types";

export const CONTINENT_LABELS: Record<Continent, string> = {
  europe: "اروپا",
  "north-america": "آمریکای شمالی",
  asia: "آسیا",
  oceania: "اقیانوسیه",
};

export const COST_BAND_LABELS: Record<CostBand, string> = {
  low: "ارزان",
  medium: "متوسط",
  high: "گران",
};

export const CONTINENT_OPTIONS = (
  Object.entries(CONTINENT_LABELS) as [Continent, string][]
).map(([value, label]) => ({ value, label }));

export const COST_BAND_OPTIONS = (
  Object.entries(COST_BAND_LABELS) as [CostBand, string][]
).map(([value, label]) => ({ value, label }));

export function isContinent(value: string): value is Continent {
  return value in CONTINENT_LABELS;
}

export function isCostBand(value: string): value is CostBand {
  return value in COST_BAND_LABELS;
}
