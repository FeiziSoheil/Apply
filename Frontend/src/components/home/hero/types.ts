export type HeroCountryOption = {
  slug: string;
  nameFa: string;
  flagEmoji?: string;
};

/** IATA-like codes for boarding-pass route display */
export const COUNTRY_IATA: Record<string, string> = {
  germany: "DE",
  canada: "CA",
  italy: "IT",
  hungary: "HU",
  australia: "AU",
  turkey: "TR",
  malaysia: "MY",
  netherlands: "NL",
};

export function getCountryIata(slug: string): string {
  return COUNTRY_IATA[slug] ?? slug.slice(0, 3).toUpperCase();
}
