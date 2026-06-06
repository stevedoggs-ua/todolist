import { extractJsonArray } from "./extractJson";
import { ParsedTaskSchema, type ParsedTask } from "./schema";
import { normalizeDueDate } from "./dates";

export interface ParseResult {
  ok: boolean;       // true if model JSON parsed; false if fallback used
  tasks: ParsedTask[];
}

function fallback(rawInput: string, modelText: string): ParseResult {
  return {
    ok: false,
    tasks: [{ title: (rawInput || modelText || "Нова задача").slice(0, 200), priority: 4,
              duration_min: null, due_date: null, due_time: null }],
  };
}

export function parseModelOutput(
  modelText: string,
  today: string,
  rawInput = "",
): ParseResult {
  const arr = extractJsonArray(modelText);
  if (!arr) return fallback(rawInput, modelText);

  const tasks: ParsedTask[] = [];
  for (const raw of arr) {
    // Normalize relative/leftover dates ("today"/"завтра") to ISO BEFORE schema
    // validation, so the strict ISO regex passes and a garbage date just drops
    // to null instead of discarding the whole task.
    const item: Record<string, unknown> =
      raw && typeof raw === "object" ? { ...(raw as Record<string, unknown>) } : {};
    if (typeof item.due_date === "string") {
      item.due_date = normalizeDueDate(item.due_date, today);
    }
    const parsed = ParsedTaskSchema.safeParse(item);
    if (parsed.success) tasks.push(parsed.data);
  }

  if (tasks.length === 0) return fallback(rawInput, "");
  return { ok: true, tasks };
}
