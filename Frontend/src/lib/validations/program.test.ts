import { describe, expect, it } from "vitest";
import { programCreateSchema } from "@/contracts/content";
import { buildContentSeed } from "@/mocks/seed/content";
import {
  PROGRAM_FORM_DEFAULTS,
  programFormSchema,
  programToFormValues,
  toProgramPayload,
} from "./program";

const { programs } = buildContentSeed({ now: Date.UTC(2026, 9, 19) });

describe("program admin form", () => {
  it("maps every seeded program to a valid form and contract payload", () => {
    expect(programs.length).toBeGreaterThan(0);
    for (const program of programs) {
      const values = programToFormValues(program);
      expect(programFormSchema.safeParse(values).success).toBe(true);
      const payload = toProgramPayload(values);
      expect(programCreateSchema.safeParse(payload).success).toBe(true);
    }
  });

  it("requires language score when type is not none/other", () => {
    const first = programs[0];
    if (!first) throw new Error("seed has no programs");
    const values = {
      ...programToFormValues(first),
      languageType: "ielts" as const,
      languageMinScore: undefined,
    };
    const result = programFormSchema.safeParse(values);
    expect(result.success).toBe(false);
  });

  it("rejects empty create defaults", () => {
    const result = programFormSchema.safeParse(PROGRAM_FORM_DEFAULTS);
    expect(result.success).toBe(false);
  });
});
