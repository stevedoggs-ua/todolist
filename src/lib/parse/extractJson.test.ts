import { describe, it, expect } from "vitest";
import { extractJsonArray } from "./extractJson";

describe("extractJsonArray", () => {
  it("parses a clean array", () => {
    expect(extractJsonArray('[{"title":"a"}]')).toEqual([{ title: "a" }]);
  });

  it("strips ```json fences", () => {
    const text = "```json\n[{\"title\":\"a\"}]\n```";
    expect(extractJsonArray(text)).toEqual([{ title: "a" }]);
  });

  it("finds an array inside surrounding prose", () => {
    const text = 'Here you go: [{"title":"a"},{"title":"b"}] done.';
    expect(extractJsonArray(text)).toEqual([{ title: "a" }, { title: "b" }]);
  });

  it("returns null for non-json", () => {
    expect(extractJsonArray("sorry, no tasks")).toBeNull();
  });
});
