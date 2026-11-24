import { describe, expect, it } from "vitest";
import { parseQuickAddPhrase } from "./parse-quick-add";

describe("parseQuickAddPhrase", () => {
  it("parses simple tomorrow + hour phrases", () => {
    const result = parseQuickAddPhrase("فردا ۱۰ زنگ بزن");
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.title).toContain("زنگ بزن");
    expect(new Date(result.dueAt).getHours()).toBe(10);
  });

  it("falls back for complex phrases", () => {
    const result = parseQuickAddPhrase("فردا با اولویت بالا به لید زنگ بزن");
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.reason).toBe("complex");
  });

  it("rejects empty input", () => {
    const result = parseQuickAddPhrase("   ");
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.reason).toBe("empty");
  });
});
