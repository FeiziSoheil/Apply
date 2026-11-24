import { countries } from "@/data/countries";
import { programs } from "@/data/programs";
import { toEurEquivalent } from "@/lib/currency";
import type { AssessmentFormValues } from "@/lib/validations/assessment";
import type { Country, Program } from "@/types";

export type AssessmentRecommendation = {
  program: Program;
  country: Country;
  score: number;
  reasons: string[];
};

/** Convert Iranian GPA (0–20) to approx. 4.0 scale used in mock programs */
function gpaToFourPoint(gpa20: number): number {
  return gpa20 / 5;
}

function scoreProgram(
  program: Program,
  assessment: AssessmentFormValues,
): { score: number; reasons: string[] } {
  let score = 0;
  const reasons: string[] = [];

  if (assessment.targetCountries.includes(program.countrySlug)) {
    score += 40;
    reasons.push("در فهرست کشورهای هدف شماست");
  }

  if (program.degreeLevel === assessment.targetDegree) {
    score += 25;
    reasons.push("هم‌خوان با مقطع هدف");
  }

  const field = assessment.fieldOfStudy.trim().toLowerCase();
  if (
    field &&
    (program.field.toLowerCase().includes(field) ||
      program.nameFa.toLowerCase().includes(field) ||
      field.includes(program.field.toLowerCase()))
  ) {
    score += 20;
    reasons.push("نزدیک به رشته تحصیلی شما");
  }

  const gpa4 = gpaToFourPoint(assessment.gpa);
  if (gpa4 >= program.minGpa) {
    score += 15;
    reasons.push("معدل شما با حداقل مورد نیاز سازگار است");
  } else if (gpa4 >= program.minGpa - 0.3) {
    score += 5;
    reasons.push("معدل نزدیک به حداقل پذیرش");
  }

  // Compare in a common currency: the program and the budget may differ
  const tuitionEur = toEurEquivalent(program.tuition, program.currency);
  const budgetEur = toEurEquivalent(assessment.annualBudget, assessment.currency);
  if (tuitionEur <= budgetEur) {
    score += 15;
    reasons.push("شهریه در محدوده بودجه سالانه");
  } else if (tuitionEur <= budgetEur * 1.2) {
    score += 5;
  }

  if (assessment.needsScholarship && program.hasScholarship) {
    score += 10;
    reasons.push("امکان بورسیه دارد");
  }

  if (assessment.languageStatus !== "none") {
    const req = program.languageRequirement.toLowerCase();
    if (
      (assessment.languageStatus === "ielts" && req.includes("ielts")) ||
      (assessment.languageStatus === "toefl" && req.includes("toefl")) ||
      assessment.languageStatus === "other" ||
      assessment.languageStatus === "duolingo"
    ) {
      score += 8;
      reasons.push("مسیر زبان قابل تطبیق");
    }
  }

  return { score, reasons };
}

/**
 * Rank mock programs/countries for an assessment payload.
 * Pure scoring — swap data source later without touching forms.
 */
export function getAssessmentRecommendations(
  assessment: AssessmentFormValues,
  limit = 3,
): AssessmentRecommendation[] {
  const countryBySlug = new Map(countries.map((c) => [c.slug, c]));

  const ranked = programs
    .map((program) => {
      const country = countryBySlug.get(program.countrySlug);
      if (!country) return null;
      const { score, reasons } = scoreProgram(program, assessment);
      if (score <= 0) return null;
      return { program, country, score, reasons };
    })
    .filter((item): item is AssessmentRecommendation => item !== null)
    .sort((a, b) => b.score - a.score);

  if (ranked.length >= limit) {
    return ranked.slice(0, limit);
  }

  const fallback = programs
    .filter((p) => !ranked.some((r) => r.program.id === p.id))
    .sort((a, b) => {
      const aTarget = assessment.targetCountries.includes(a.countrySlug)
        ? 1
        : 0;
      const bTarget = assessment.targetCountries.includes(b.countrySlug)
        ? 1
        : 0;
      if (bTarget !== aTarget) return bTarget - aTarget;
      return (
        toEurEquivalent(a.tuition, a.currency) -
        toEurEquivalent(b.tuition, b.currency)
      );
    })
    .slice(0, limit - ranked.length)
    .map((program) => {
      const country = countryBySlug.get(program.countrySlug)!;
      return {
        program,
        country,
        score: 1,
        reasons: ["پیشنهاد عمومی بر اساس دادهٔ موجود"],
      };
    });

  return [...ranked, ...fallback].slice(0, limit);
}
