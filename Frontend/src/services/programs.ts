import { countries } from "@/data/countries";
import { programs } from "@/data/programs";
import { universities } from "@/data/universities";
import {
  classifyLanguageRequirement,
  matchesLanguageRequirementType,
} from "@/lib/language-requirements";
import { toEurEquivalent } from "@/lib/currency";
import { mockDelay } from "@/lib/mock-delay";
import { paginate } from "@/lib/pagination";
import type {
  LanguageRequirementType,
  PaginatedResult,
  Program,
  ProgramFilters,
  ProgramSort,
} from "@/types";

export type ProgramListItem = Program & {
  universityNameFa: string;
  countryNameFa: string;
};

function sortPrograms(
  items: Program[],
  sort: ProgramSort = "relevant",
): Program[] {
  const sorted = [...items];

  switch (sort) {
    case "cheapest":
      return sorted.sort(
        (a, b) =>
          toEurEquivalent(a.tuition, a.currency) -
          toEurEquivalent(b.tuition, b.currency),
      );
    case "nearest_deadline":
      return sorted.sort(
        (a, b) =>
          new Date(a.deadline).getTime() - new Date(b.deadline).getTime(),
      );
    case "relevant":
    default:
      return sorted;
  }
}

function filterPrograms(filters: ProgramFilters = {}): Program[] {
  const search = filters.search?.trim().toLowerCase();
  const language = filters.language?.trim().toLowerCase();

  return programs.filter((program) => {
    if (filters.country && program.countrySlug !== filters.country) {
      return false;
    }
    if (filters.university && program.universitySlug !== filters.university) {
      return false;
    }
    if (filters.degreeLevel && program.degreeLevel !== filters.degreeLevel) {
      return false;
    }
    if (filters.field && program.field !== filters.field) {
      return false;
    }
    if (
      filters.hasScholarship !== undefined &&
      program.hasScholarship !== filters.hasScholarship
    ) {
      return false;
    }
    if (
      filters.minTuition !== undefined &&
      toEurEquivalent(program.tuition, program.currency) < filters.minTuition
    ) {
      return false;
    }
    if (
      filters.maxTuition !== undefined &&
      toEurEquivalent(program.tuition, program.currency) > filters.maxTuition
    ) {
      return false;
    }
    if (filters.intake && !program.intakes.includes(filters.intake)) {
      return false;
    }
    if (
      filters.languageType &&
      !matchesLanguageRequirementType(
        program.languageRequirement,
        filters.languageType,
      )
    ) {
      return false;
    }
    if (language && !program.languageRequirement.toLowerCase().includes(language)) {
      return false;
    }
    if (search) {
      const university = universities.find(
        (u) => u.slug === program.universitySlug,
      );
      const country = countries.find((c) => c.slug === program.countrySlug);
      const haystack =
        `${program.nameFa} ${program.field} ${program.universitySlug} ${university?.nameFa ?? ""} ${country?.nameFa ?? ""}`.toLowerCase();
      if (!haystack.includes(search)) {
        return false;
      }
    }
    return true;
  });
}

function toListItem(program: Program): ProgramListItem {
  const university = universities.find((u) => u.slug === program.universitySlug);
  const country = countries.find((c) => c.slug === program.countrySlug);

  return {
    ...program,
    universityNameFa: university?.nameFa ?? program.universitySlug,
    countryNameFa: country?.nameFa ?? program.countrySlug,
  };
}

export async function getPrograms(
  filters: ProgramFilters = {},
): Promise<PaginatedResult<ProgramListItem>> {
  "use cache";
  await mockDelay();
  const filtered = filterPrograms(filters);
  const sorted = sortPrograms(filtered, filters.sort);
  const page = paginate(sorted, filters);
  return {
    ...page,
    items: page.items.map(toListItem),
  };
}

export async function getProgramBySlug(slug: string): Promise<Program | null> {
  "use cache";
  await mockDelay();
  return programs.find((p) => p.slug === slug) ?? null;
}

export async function getSimilarPrograms(
  program: Program,
  limit = 3,
): Promise<ProgramListItem[]> {
  "use cache";
  await mockDelay();

  const scored = programs
    .filter((p) => p.slug !== program.slug)
    .map((p) => {
      let score = 0;
      if (p.field === program.field) score += 3;
      if (p.degreeLevel === program.degreeLevel) score += 2;
      if (p.countrySlug === program.countrySlug) score += 1;
      if (p.universitySlug === program.universitySlug) score += 1;
      return { program: p, score };
    })
    .filter((item) => item.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map((item) => toListItem(item.program));

  return scored;
}

export async function getProgramFields(): Promise<string[]> {
  "use cache";
  await mockDelay();
  return [...new Set(programs.map((p) => p.field))].sort((a, b) =>
    a.localeCompare(b, "fa"),
  );
}

export async function getProgramIntakes(): Promise<string[]> {
  "use cache";
  await mockDelay();
  return [...new Set(programs.flatMap((p) => p.intakes))].sort((a, b) =>
    a.localeCompare(b, "fa"),
  );
}

export async function getProgramLanguageTypes(): Promise<
  LanguageRequirementType[]
> {
  "use cache";
  await mockDelay();
  const present = new Set(
    programs.map((p) => classifyLanguageRequirement(p.languageRequirement)),
  );
  const order: LanguageRequirementType[] = [
    "ielts",
    "toefl",
    "testdaf",
    "none",
    "other",
  ];
  return order.filter((type) => present.has(type));
}
