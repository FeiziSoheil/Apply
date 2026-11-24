import { CURRENCY_LABELS_FA, FX_RATES } from "@/lib/constants";
import { formatNumber } from "@/lib/format";

/** Default currency of educational amounts (matches the contract default) */
export const DEFAULT_CURRENCY = "EUR";

/** Persian name of an ISO 4217 code; unknown codes fall back to the code itself */
export function getCurrencyLabel(currency: string): string {
  return (CURRENCY_LABELS_FA as Record<string, string>)[currency] ?? currency;
}

/**
 * مبالغ تحصیلی (شهریه و …) با ارز ISO.
 * برای ریال/تومان پنل و CRM از `formatMoney` در `@/lib/format` استفاده کنید.
 */
export function formatCurrencyMoney(amount: number, currency: string): string {
  return `${formatNumber(amount)} ${getCurrencyLabel(currency)}`;
}

/** @deprecated از `formatCurrencyMoney` استفاده کنید؛ `formatMoney` در `@/lib/format` برای ریال است */
export function formatMoney(amount: number, currency: string): string {
  return formatCurrencyMoney(amount, currency);
}

/**
 * EUR-equivalent of an amount, used only to compare / filter / sort amounts
 * that are stored in different currencies (tuition filters, «cheapest» sort,
 * budget matching). Unknown currencies are returned unchanged.
 */
export function toEurEquivalent(amount: number, currency: string): number {
  const rates = FX_RATES as Record<string, number>;
  const from = rates[currency];
  if (from === undefined || currency === DEFAULT_CURRENCY) return amount;
  return (amount * from) / FX_RATES.EUR;
}
