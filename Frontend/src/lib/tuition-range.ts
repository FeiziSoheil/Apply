/** Shared tuition filter bounds (annual EUR) */
export const TUITION_RANGE = {
  min: 0,
  max: 65000,
  step: 1000,
} as const;

export function isDefaultTuitionRange(
  minTuition: number | null | undefined,
  maxTuition: number | null | undefined,
): boolean {
  const min = minTuition ?? TUITION_RANGE.min;
  const max = maxTuition ?? TUITION_RANGE.max;
  return min <= TUITION_RANGE.min && max >= TUITION_RANGE.max;
}
