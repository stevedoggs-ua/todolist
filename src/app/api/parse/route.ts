import { NextResponse, type NextRequest } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { buildSystemPrompt } from "@/lib/parse/prompt";
import { parseModelOutput } from "@/lib/parse/parseTasks";

// Latency-sensitive extraction → Sonnet 4.6 (fast, capable, cheap).
// Swap to "claude-opus-4-8" for maximum quality at higher latency/cost.
const PARSE_MODEL = "claude-sonnet-4-6";

// Forced structured output: Claude MUST call this tool, so we always get a
// typed task list instead of fragile free-text JSON.
const EXTRACT_TOOL: Anthropic.Tool = {
  name: "extract_tasks",
  description: "Записати структуровані задачі, виокремлені з brain-dump користувача.",
  input_schema: {
    type: "object",
    additionalProperties: false,
    properties: {
      tasks: {
        type: "array",
        description: "Атомарні задачі у порядку згадування.",
        items: {
          type: "object",
          additionalProperties: false,
          properties: {
            title: { type: "string", description: "Коротка назва: дієслово на початку, з великої літери, без паразитів." },
            priority: { type: "integer", enum: [1, 2, 3, 4], description: "1 терміново+важливо … 4 колись/необовʼязкове." },
            duration_min: { type: ["integer", "null"], description: "Реалістична оцінка у хвилинах за типом дії, або null." },
            due_date: { type: ["string", "null"], description: "РРРР-ММ-ДД — лише якщо в тексті є дата; інакше null." },
            due_time: { type: ["string", "null"], description: "ГГ:ХХ (24год) — лише якщо згадано час; інакше null." },
          },
          required: ["title", "priority", "duration_min", "due_date", "due_time"],
        },
      },
    },
    required: ["tasks"],
  },
};

function hasRealKey(): boolean {
  const k = process.env.ANTHROPIC_API_KEY;
  return !!k && !k.startsWith("placeholder");
}

export async function POST(request: NextRequest) {
  const { text, today, timezone = "Europe/Kyiv", source = "text" } =
    (await request.json()) as { text: string; today: string; timezone?: string; source?: string };

  if (!text || text.trim().length < 3) {
    return NextResponse.json({ ok: false, ai: false, tasks: [], error: "empty" }, { status: 400 });
  }

  // No real key yet → tell the client to fall back to local splitting.
  if (!hasRealKey()) {
    return NextResponse.json({ ok: false, ai: false, tasks: [] });
  }

  try {
    const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY! });
    const system = buildSystemPrompt(today, timezone);

    const msg = await client.messages.create({
      model: PARSE_MODEL,
      max_tokens: 2048,
      // Cache the (stable, per-day) system prompt so repeated parses are cheaper/faster.
      system: [{ type: "text", text: system, cache_control: { type: "ephemeral" } }],
      tools: [EXTRACT_TOOL],
      tool_choice: { type: "tool", name: "extract_tasks" },
      messages: [{ role: "user", content: text }],
    });

    const block = msg.content.find((b) => b.type === "tool_use");
    const input = (block && block.type === "tool_use" ? block.input : null) as { tasks?: unknown[] } | null;
    const arr = Array.isArray(input?.tasks) ? input!.tasks : [];

    // Re-validate + normalize dates through the tested pure pipeline.
    const result = parseModelOutput(JSON.stringify(arr), today, text);
    return NextResponse.json({ ok: result.ok, ai: true, tasks: result.tasks, source });
  } catch {
    // AI call failed — client falls back to local splitting; no input is lost.
    return NextResponse.json({ ok: false, ai: true, tasks: [], error: "ai_failed" });
  }
}
