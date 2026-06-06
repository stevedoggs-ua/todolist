export function buildSystemPrompt(today: string, timezone: string): string {
  return [
    "You convert a messy brain-dump into a structured task list.",
    `Today is ${today} in timezone ${timezone}. Resolve relative dates against this.`,
    "Return ONLY a JSON array, no prose, no code fences.",
    "Each item: {title, priority, duration_min, due_date, due_time}.",
    "Rules:",
    "- Split the input into atomic tasks (one action each).",
    "- priority: 1-4. must-do => 1 or 2, nice-to-have => 3 or 4.",
    "- duration_min: integer minutes if inferable, else null.",
    "- due_date: ISO yyyy-mm-dd ONLY if explicitly mentioned, else null.",
    "- due_time: 24h HH:mm ONLY if explicitly mentioned, else null.",
    "- Keep task titles in the same language as the input (Ukrainian).",
    "If there are no real tasks, return [].",
  ].join("\n");
}
