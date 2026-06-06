import { describe, it, expect } from "vitest";
import { ParsedTaskSchema, ParsedTaskArraySchema } from "./schema";

describe("ParsedTaskSchema", () => {
  it("accepts a valid task", () => {
    const ok = ParsedTaskSchema.safeParse({
      title: "Написати Анні",
      priority: 1,
      duration_min: 15,
      due_date: "2026-06-07",
      due_time: "15:00",
    });
    expect(ok.success).toBe(true);
  });

  it("rejects priority out of range", () => {
    const bad = ParsedTaskSchema.safeParse({ title: "x", priority: 9 });
    expect(bad.success).toBe(false);
  });

  it("coerces missing optional fields to null", () => {
    const r = ParsedTaskSchema.parse({ title: "x", priority: 3 });
    expect(r.duration_min).toBeNull();
    expect(r.due_date).toBeNull();
    expect(r.due_time).toBeNull();
  });

  it("rejects empty title", () => {
    expect(ParsedTaskSchema.safeParse({ title: "", priority: 2 }).success).toBe(false);
  });

  it("array schema validates a list", () => {
    const r = ParsedTaskArraySchema.safeParse([{ title: "a", priority: 2 }]);
    expect(r.success).toBe(true);
  });
});
