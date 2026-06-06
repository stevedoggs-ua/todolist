import { describe, it, expect } from "vitest";
import { normalizeDueDate } from "./dates";

const TODAY = "2026-06-06"; // Saturday

describe("normalizeDueDate", () => {
  it("passes through a valid ISO date", () => {
    expect(normalizeDueDate("2026-06-10", TODAY)).toBe("2026-06-10");
  });

  it("resolves english 'today'/'tomorrow'", () => {
    expect(normalizeDueDate("today", TODAY)).toBe("2026-06-06");
    expect(normalizeDueDate("tomorrow", TODAY)).toBe("2026-06-07");
  });

  it("resolves ukrainian 'сьогодні'/'завтра'", () => {
    expect(normalizeDueDate("сьогодні", TODAY)).toBe("2026-06-06");
    expect(normalizeDueDate("завтра", TODAY)).toBe("2026-06-07");
  });

  it("returns null for unparseable input", () => {
    expect(normalizeDueDate("колись", TODAY)).toBeNull();
    expect(normalizeDueDate(null, TODAY)).toBeNull();
  });
});
