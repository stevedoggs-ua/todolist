import { NextResponse, type NextRequest } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { createClient } from "@/lib/supabase/server";
import { buildSystemPrompt } from "@/lib/parse/prompt";
import { parseModelOutput } from "@/lib/parse/parseTasks";

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const { text, today, timezone = "Europe/Kyiv", source = "text" } =
    (await request.json()) as { text: string; today: string; timezone?: string; source?: string };

  if (!text || text.trim().length < 3) {
    return NextResponse.json({ error: "empty" }, { status: 400 });
  }

  const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY! });
  const system = buildSystemPrompt(today, timezone);

  const callModel = async () => {
    const msg = await client.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 1024,
      system,
      messages: [{ role: "user", content: text }],
    });
    const block = msg.content[0];
    return block && block.type === "text" ? block.text : "";
  };

  try {
    let result = parseModelOutput(await callModel(), today, text);
    if (!result.ok) result = parseModelOutput(await callModel(), today, text); // one retry
    return NextResponse.json({ ok: result.ok, tasks: result.tasks, source });
  } catch {
    const fallback = parseModelOutput("", today, text);
    return NextResponse.json({ ok: false, tasks: fallback.tasks, source }, { status: 200 });
  }
}
