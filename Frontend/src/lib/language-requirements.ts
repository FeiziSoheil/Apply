import type { LanguageRequirementType } from "@/types";

export const LANGUAGE_REQUIREMENT_TYPES = [
  "ielts",
  "toefl",
  "testdaf",
  "none",
  "other",
] as const satisfies readonly LanguageRequirementType[];

export const LANGUAGE_REQUIREMENT_TYPE_LABELS: Record<
  LanguageRequirementType,
  string
> = {
  ielts: "آیلتس (IELTS)",
  toefl: "تافل (TOEFL)",
  testdaf: "TestDaF",
  none: "بدون مدرک زبان",
  other: "سایر",
};

export function isLanguageRequirementType(
  value: string,
): value is LanguageRequirementType {
  return (LANGUAGE_REQUIREMENT_TYPES as readonly string[]).includes(value);
}

/** Classify a free-text language requirement for filtering */
export function classifyLanguageRequirement(
  requirement: string,
): LanguageRequirementType {
  const normalized = requirement.trim().toLowerCase();
  if (!normalized || normalized === "ندارد") return "none";
  if (normalized.includes("testdaf")) return "testdaf";
  if (normalized.includes("ielts")) return "ielts";
  if (normalized.includes("toefl")) return "toefl";
  return "other";
}

export function matchesLanguageRequirementType(
  requirement: string,
  type: LanguageRequirementType,
): boolean {
  const normalized = requirement.trim().toLowerCase();

  switch (type) {
    case "ielts":
      return normalized.includes("ielts");
    case "toefl":
      return normalized.includes("toefl");
    case "testdaf":
      return normalized.includes("testdaf");
    case "none":
      return !normalized || normalized === "ندارد";
    case "other":
      return (
        !!normalized &&
        normalized !== "ندارد" &&
        !normalized.includes("ielts") &&
        !normalized.includes("toefl") &&
        !normalized.includes("testdaf")
      );
  }
}

const SCORE_PATTERN = /(\d+(?:[./]\d+)?)\s*$/;

/** Split a free-text requirement into type + optional minimum score for admin forms */
export function parseLanguageRequirement(requirement: string): {
  type: LanguageRequirementType;
  minScore: number | undefined;
} {
  const type = classifyLanguageRequirement(requirement);
  if (type === "none") return { type, minScore: undefined };
  const match = requirement.trim().match(SCORE_PATTERN);
  if (!match?.[1]) return { type, minScore: undefined };
  const raw = match[1].replace("/", ".");
  const score = Number.parseFloat(raw);
  return {
    type,
    minScore: Number.isFinite(score) ? score : undefined,
  };
}

/** Serialize admin language fields back to the contract `languageRequirement` string */
export function formatLanguageRequirement(
  type: LanguageRequirementType,
  minScore: number | undefined,
  otherText?: string,
): string {
  switch (type) {
    case "none":
      return "ندارد";
    case "ielts":
      return minScore !== undefined ? `IELTS ${minScore}` : "IELTS";
    case "toefl":
      return minScore !== undefined ? `TOEFL ${minScore}` : "TOEFL";
    case "testdaf":
      return minScore !== undefined ? `TestDaF ${minScore}` : "TestDaF";
    case "other": {
      const text = otherText?.trim();
      if (text) return text;
      return minScore !== undefined ? String(minScore) : "سایر";
    }
  }
}
