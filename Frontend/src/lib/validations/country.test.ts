import { describe, expect, it } from "vitest";
import { countryCreateSchema } from "@/contracts/content";
import { buildContentSeed } from "@/mocks/seed/content";
import {
  COUNTRY_FORM_DEFAULTS,
  countryFormSchema,
  countryToFormValues,
  toCountryPayload,
} from "./country";

const { countries } = buildContentSeed({ now: Date.UTC(2026, 9, 19) });

describe("country admin form", () => {
  it("maps every seeded country to a valid form and a contract-valid payload", () => {
    expect(countries.length).toBeGreaterThan(0);
    for (const country of countries) {
      const values = countryToFormValues(country);
      expect(countryFormSchema.safeParse(values).success).toBe(true);
      const payload = toCountryPayload(values);
      expect(countryCreateSchema.safeParse(payload).success).toBe(true);
    }
  });

  it("rejects an empty create form with Persian messages", () => {
    const result = countryFormSchema.safeParse(COUNTRY_FORM_DEFAULTS);
    expect(result.success).toBe(false);
    if (result.success) return;
    const messages = result.error.issues.map((issue) => issue.message);
    expect(messages).toContain("نام فارسی را وارد کنید");
    expect(messages).toContain("قاره را انتخاب کنید");
    expect(messages).toContain("هزینه زندگی را وارد کنید");
  });

  it("keeps default country sections on create payload", () => {
    const first = countries[0];
    if (!first) throw new Error("seed has no countries");
    const values = countryToFormValues(first);
    const payload = toCountryPayload(values);
    expect(payload.sections.length).toBeGreaterThan(0);
    expect(payload.sections[0]?.anchor).toBeTruthy();
  });

  it("rejects an invalid slug", () => {
    const first = countries[0];
    if (!first) throw new Error("seed has no countries");
    const result = countryFormSchema.safeParse({
      ...countryToFormValues(first),
      slug: "New Zealand",
    });
    expect(result.success).toBe(false);
  });
});
