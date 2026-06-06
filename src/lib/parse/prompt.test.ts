import { describe, it, expect } from "vitest";
import { buildSystemPrompt } from "./prompt";

describe("buildSystemPrompt", () => {
  const p = buildSystemPrompt("2026-06-06", "Europe/Kyiv");
  it("includes today and timezone", () => {
    expect(p).toContain("2026-06-06");
    expect(p).toContain("Europe/Kyiv");
  });
  it("instructs JSON-only output and priority mapping", () => {
    expect(p.toLowerCase()).toContain("json");
    expect(p).toMatch(/must/i);
    expect(p).toMatch(/nice/i);
  });
});
