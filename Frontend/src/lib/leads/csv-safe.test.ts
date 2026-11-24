import { describe, expect, it } from "vitest";
import {
  buildCsvDocument,
  escapeCsvInjection,
  formatCsvCell,
} from "./csv-safe";

describe("escapeCsvInjection", () => {
  it("prefixes formula-like cells", () => {
    expect(escapeCsvInjection("=CMD()")).toBe("'=CMD()");
    expect(escapeCsvInjection("+1234")).toBe("'+1234");
    expect(escapeCsvInjection("-1+1")).toBe("'-1+1");
    expect(escapeCsvInjection("@SUM(A1)")).toBe("'@SUM(A1)");
    expect(escapeCsvInjection("\tTAB")).toBe("'\tTAB");
  });

  it("leaves safe cells unchanged", () => {
    expect(escapeCsvInjection("علی")).toBe("علی");
    expect(escapeCsvInjection("0912")).toBe("0912");
    expect(escapeCsvInjection("hello")).toBe("hello");
  });
});

describe("formatCsvCell / buildCsvDocument", () => {
  it("quotes and escapes quotes", () => {
    expect(formatCsvCell('a"b')).toBe('"a""b"');
  });

  it("builds BOM-prefixed CSV", () => {
    const csv = buildCsvDocument(["name", "note"], [["Ali", "=1+1"]]);
    expect(csv.startsWith("\uFEFF")).toBe(true);
    expect(csv).toContain("\"'=1+1\"");
  });
});
