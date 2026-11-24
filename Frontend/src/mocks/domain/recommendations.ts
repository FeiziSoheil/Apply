import type { AssessmentRecommendation, AssessmentProfile } from "@/contracts/leads";
import type { Program } from "@/contracts/content";
import { toEurEquivalent } from "@/lib/currency";

const GPA_SCALE_RATIO = 4 / 20;

/** Light-weight matching used by `POST /leads/assessment` (top 5 programs) */
export function recommendPrograms(
  profile: AssessmentProfile,
  programs: readonly Program[],
): AssessmentRecommendation[] {
  const gpaOnFourScale = profile.gpa * GPA_SCALE_RATIO;

  const scored = programs
    .filter((program) => program.degreeLevel === profile.targetDegree)
    .map((program) => {
      const reasons: string[] = [];
      let score = 40;

      if (profile.targetCountries.includes(program.countrySlug)) {
        score += 25;
        reasons.push("در کشور مقصد انتخابی شما قرار دارد");
      }
      if (
        toEurEquivalent(program.tuition, program.currency) <=
        toEurEquivalent(profile.annualBudget, profile.currency)
      ) {
        score += 15;
        reasons.push("شهریه در محدوده بودجه شماست");
      }
      if (gpaOnFourScale >= program.minGpa) {
        score += 12;
        reasons.push("معدل شما شرط حداقل معدل برنامه را پوشش می‌دهد");
      }
      if (profile.needsScholarship && program.hasScholarship) {
        score += 8;
        reasons.push("امکان بورسیه دارد");
      }
      return { programId: program.id, score: Math.min(100, score), reasons };
    })
    .filter((item) => item.score >= 55)
    .sort((a, b) => b.score - a.score);

  return scored.slice(0, 5);
}
