import { describe, it, expect } from "vitest";
import { parseModelOutput } from "./parseTasks";

const TODAY = "2026-06-06";

describe("parseModelOutput", () => {
  it("returns validated tasks and normalizes dates", () => {
    const text = '[{"title":"Дзвінок","priority":1,"duration_min":15,"due_date":"today","due_time":"15:00"}]';
    const r = parseModelOutput(text, TODAY);
    expect(r.ok).toBe(true);
    expect(r.tasks).toHaveLength(1);
    expect(r.tasks[0]).toMatchObject({
      title: "Дзвінок", priority: 1, duration_min: 15,
      due_date: "2026-06-06", due_time: "15:00",
    });
  });

  it("drops invalid tasks but keeps valid ones", () => {
    const text = '[{"title":"ok","priority":2},{"priority":3}]';
    const r = parseModelOutput(text, TODAY);
    expect(r.ok).toBe(true);
    expect(r.tasks).toHaveLength(1);
    expect(r.tasks[0].title).toBe("ok");
  });

  it("falls back to raw text as a single task when no json", () => {
    const r = parseModelOutput("sorry no json here", TODAY, "купити молоко");
    expect(r.ok).toBe(false);
    expect(r.tasks).toHaveLength(1);
    expect(r.tasks[0].title).toBe("купити молоко");
    expect(r.tasks[0].priority).toBe(4);
  });
});
