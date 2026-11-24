import { formatMoney } from "@/lib/currency";

/** Format annual tuition in its own currency with Persian digits */
export function formatTuition(tuition: number, currency: string): string {
  if (tuition === 0) return "رایگان / دولتی";
  return formatMoney(tuition, currency);
}
