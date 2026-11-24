import { describe, expect, it } from "vitest";
import { universityCreateSchema } from "@/contracts/content";
import { buildContentSeed } from "@/mocks/seed/content";
import {
  UNIVERSITY_FORM_DEFAULTS,
  universityFormSchema,
  universityToFormValues,
  toUniversityPayload,
} from "./university";

const { universities } = buildContentSeed({ now: Date.UTC(2026, 9, 19) });

describe("university admin form", () => {
  it("maps every seeded university to a valid form and contract payload", () => {
    expect(universities.length).toBeGreaterThan(0);
    for (const university of universities) {
      const values = universityToFormValues(university);
      expect(universityFormSchema.safeParse(values).success).toBe(true);
      const payload = toUniversityPayload(values);
      expect(universityCreateSchema.safeParse(payload).success).toBe(true);
    }
  });

  it("rejects an empty create form with Persian messages", () => {
    const result = universityFormSchema.safeParse(UNIVERSITY_FORM_DEFAULTS);
    expect(result.success).toBe(false);
    if (result.success) return;
    const messages = result.error.issues.map((issue) => issue.message);
    expect(messages).toContain("نام فارسی را وارد کنید");
    expect(messages).toContain("کشور را وارد کنید");
  });

  it("defaults to university section templates on create", () => {
    const sections = UNIVERSITY_FORM_DEFAULTS.sections ?? [];
    expect(sections.length).toBe(3);
    expect(sections.map((s) => s?.anchor)).toEqual([
      "intro",
      "facilities",
      "student-life",
    ]);
  });
});

