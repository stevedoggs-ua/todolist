# AI Day Planner Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a mobile-first AI day planner where a user brain-dumps (voice/text), Claude turns it into structured tasks (priority, duration, due date), and the user triages them into Inbox / Today / Upcoming / Projects with a "Focus of the day" (1–3 essential tasks).

**Architecture:** Next.js (App Router, TypeScript) on Vercel. Supabase provides Auth (Google OAuth + email magic-link) and Postgres with Row Level Security. Voice transcription runs in-browser via the Web Speech API (no key). A single serverless route `/api/parse` calls the Claude API server-side to convert raw text into a validated JSON array of tasks. The parse logic is split into pure, fully-tested functions (date resolution, JSON extraction, schema validation) separate from the network call.

**Tech Stack:** Next.js 14+ (App Router), TypeScript, Tailwind CSS, Supabase (`@supabase/supabase-js`, `@supabase/ssr`), Anthropic SDK (`@anthropic-ai/sdk`), Zod (schema validation), Vitest + React Testing Library (tests).

**Reference spec:** `docs/superpowers/specs/2026-06-06-ai-day-planner-design.md`

---

## File Structure

```
src/
  app/
    layout.tsx                 # Root layout, fonts, providers
    globals.css                # Tailwind + design tokens (CSS vars)
    login/page.tsx             # Login screen (Google + magic-link)
    auth/callback/route.ts     # Supabase OAuth/magic-link callback
    (app)/                     # Authenticated group (guarded by middleware)
      layout.tsx               # App shell + bottom tab bar
      capture/page.tsx         # Capture (text + mic)
      inbox/page.tsx           # Inbox + triage
      today/page.tsx           # Today + Focus of the day
      upcoming/page.tsx        # Upcoming grouped by date
      projects/page.tsx        # Projects list
    api/parse/route.ts         # Serverless: text -> Claude -> tasks JSON
  lib/
    parse/
      dates.ts                 # resolveDueDate(): relative -> ISO date
      schema.ts                # Zod schema + ParsedTask type
      extractJson.ts           # pull JSON array out of model text
      parseTasks.ts            # orchestrates schema validation + fallback
      prompt.ts                # buildSystemPrompt(today, tz)
    supabase/
      client.ts                # browser client
      server.ts                # server client (cookies)
      middleware.ts            # session refresh helper
    db/
      tasks.ts                 # task CRUD (typed)
      projects.ts              # project CRUD (typed)
    types.ts                   # DB row types (Task, Project, Profile)
    voice/useSpeech.ts         # Web Speech API hook
    analytics.ts               # track(event, props) thin wrapper
  components/
    BottomNav.tsx
    TaskCard.tsx
    PriorityDot.tsx
    Chip.tsx
    Checkbox.tsx
    MicButton.tsx
    Toast.tsx
    Skeleton.tsx
    Onboarding.tsx
middleware.ts                  # Next.js middleware (auth guard)
supabase/migrations/0001_init.sql
.env.local.example
vitest.config.ts
```

**Responsibility boundaries:** `lib/parse/*` are pure functions (no network, no Supabase) — fully unit-tested. `lib/db/*` wrap Supabase queries with typed signatures. `app/api/parse/route.ts` is the only place that calls Claude. UI components are presentational; pages own data fetching.

---

## Task 1: Project scaffold (Next.js + TS + Tailwind + Vitest)

**Files:**
- Create: `package.json`, `tsconfig.json`, `next.config.mjs`, `tailwind.config.ts`, `postcss.config.mjs`, `vitest.config.ts`, `src/app/globals.css`, `src/app/layout.tsx`, `src/app/page.tsx`

- [ ] **Step 1: Scaffold the app**

Run:
```bash
npx create-next-app@latest . --typescript --tailwind --app --eslint --src-dir --import-alias "@/*" --no-turbopack
```
Expected: project files created in current directory.

- [ ] **Step 2: Install runtime + test dependencies**

Run:
```bash
npm install @supabase/supabase-js @supabase/ssr @anthropic-ai/sdk zod
npm install -D vitest @vitejs/plugin-react jsdom @testing-library/react @testing-library/jest-dom
```
Expected: dependencies added, no errors.

- [ ] **Step 3: Add Vitest config**

Create `vitest.config.ts`:
```ts
import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import path from "node:path";

export default defineConfig({
  plugins: [react()],
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: ["./vitest.setup.ts"],
  },
  resolve: { alias: { "@": path.resolve(__dirname, "./src") } },
});
```

Create `vitest.setup.ts`:
```ts
import "@testing-library/jest-dom/vitest";
```

Add to `package.json` "scripts": `"test": "vitest run"`, `"test:watch": "vitest"`.

- [ ] **Step 4: Sanity test**

Create `src/lib/parse/__smoke__.test.ts`:
```ts
import { describe, it, expect } from "vitest";
describe("smoke", () => {
  it("runs", () => { expect(1 + 1).toBe(2); });
});
```

Run: `npm test`
Expected: 1 passing test.

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "chore: scaffold next.js app with tailwind and vitest"
```

---

## Task 2: Supabase schema, RLS, and signup trigger

**Files:**
- Create: `supabase/migrations/0001_init.sql`
- Create: `.env.local.example`

- [ ] **Step 1: Write the migration**

Create `supabase/migrations/0001_init.sql`:
```sql
-- profiles
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text,
  onboarding_done boolean not null default false,
  timezone text not null default 'Europe/Kyiv',
  created_at timestamptz not null default now()
);

-- projects
create table public.projects (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  name text not null,
  color text not null default 'gray',
  is_inbox boolean not null default false,
  created_at timestamptz not null default now()
);

-- tasks
create table public.tasks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  project_id uuid references public.projects(id) on delete set null,
  title text not null,
  priority int not null default 4 check (priority between 1 and 4),
  duration_min int,
  due_date date,
  due_time time,
  is_done boolean not null default false,
  is_focus boolean not null default false,
  focus_date date,
  recurrence text,
  source text not null default 'manual' check (source in ('voice','text','manual')),
  created_at timestamptz not null default now(),
  completed_at timestamptz
);

create index tasks_user_due on public.tasks(user_id, due_date);
create index tasks_user_focus on public.tasks(user_id, focus_date, is_focus);

-- RLS
alter table public.profiles enable row level security;
alter table public.projects enable row level security;
alter table public.tasks enable row level security;

create policy "own profile" on public.profiles
  for all using (id = auth.uid()) with check (id = auth.uid());
create policy "own projects" on public.projects
  for all using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "own tasks" on public.tasks
  for all using (user_id = auth.uid()) with check (user_id = auth.uid());

-- on signup: create profile + default Inbox project
create function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, display_name)
  values (new.id, coalesce(new.raw_user_meta_data->>'name', new.email));
  insert into public.projects (user_id, name, is_inbox, color)
  values (new.id, 'Inbox', true, 'gray');
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
```

- [ ] **Step 2: Apply the migration**

Apply via Supabase SQL editor (paste the file) OR Supabase CLI:
```bash
supabase db push
```
Expected: tables `profiles`, `projects`, `tasks` exist; RLS enabled; trigger present.

- [ ] **Step 3: Create env example**

Create `.env.local.example`:
```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
ANTHROPIC_API_KEY=
```
Copy to `.env.local` and fill with real values (do NOT commit `.env.local`).

- [ ] **Step 4: Verify trigger manually**

In Supabase Auth, create a test user. Query: `select * from public.projects;`
Expected: one row `Inbox` with `is_inbox = true` for the new user.

- [ ] **Step 5: Commit**

```bash
git add supabase/migrations/0001_init.sql .env.local.example
git commit -m "feat: supabase schema, rls, and signup trigger"
```

---

## Task 3: Shared types

**Files:**
- Create: `src/lib/types.ts`

- [ ] **Step 1: Define DB row types**

Create `src/lib/types.ts`:
```ts
export type Priority = 1 | 2 | 3 | 4;
export type TaskSource = "voice" | "text" | "manual";

export interface Task {
  id: string;
  user_id: string;
  project_id: string | null;
  title: string;
  priority: Priority;
  duration_min: number | null;
  due_date: string | null;   // ISO yyyy-mm-dd
  due_time: string | null;   // HH:mm
  is_done: boolean;
  is_focus: boolean;
  focus_date: string | null; // ISO yyyy-mm-dd
  recurrence: string | null;
  source: TaskSource;
  created_at: string;
  completed_at: string | null;
}

export interface Project {
  id: string;
  user_id: string;
  name: string;
  color: string;
  is_inbox: boolean;
  created_at: string;
}

export interface Profile {
  id: string;
  display_name: string | null;
  onboarding_done: boolean;
  timezone: string;
  created_at: string;
}
```

- [ ] **Step 2: Commit**

```bash
git add src/lib/types.ts
git commit -m "feat: shared db row types"
```

---

## Task 4: Parse — Zod schema (TDD)

**Files:**
- Create: `src/lib/parse/schema.ts`
- Test: `src/lib/parse/schema.test.ts`

- [ ] **Step 1: Write the failing test**

Create `src/lib/parse/schema.test.ts`:
```ts
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
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/lib/parse/schema.test.ts`
Expected: FAIL — cannot find module `./schema`.

- [ ] **Step 3: Write the schema**

Create `src/lib/parse/schema.ts`:
```ts
import { z } from "zod";

export const ParsedTaskSchema = z.object({
  title: z.string().trim().min(1),
  priority: z.number().int().min(1).max(4),
  duration_min: z.number().int().positive().nullable().default(null),
  due_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).nullable().default(null),
  due_time: z.string().regex(/^\d{2}:\d{2}$/).nullable().default(null),
});

export type ParsedTask = z.infer<typeof ParsedTaskSchema>;

export const ParsedTaskArraySchema = z.array(ParsedTaskSchema);
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/lib/parse/schema.test.ts`
Expected: PASS (5 tests).

- [ ] **Step 5: Commit**

```bash
git add src/lib/parse/schema.ts src/lib/parse/schema.test.ts
git commit -m "feat: parsed-task zod schema with tests"
```

---

## Task 5: Parse — extract JSON from model output (TDD)

**Files:**
- Create: `src/lib/parse/extractJson.ts`
- Test: `src/lib/parse/extractJson.test.ts`

- [ ] **Step 1: Write the failing test**

Create `src/lib/parse/extractJson.test.ts`:
```ts
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
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/lib/parse/extractJson.test.ts`
Expected: FAIL — module not found.

- [ ] **Step 3: Write the implementation**

Create `src/lib/parse/extractJson.ts`:
```ts
export function extractJsonArray(text: string): unknown[] | null {
  if (!text) return null;
  let s = text.trim();
  // strip code fences
  s = s.replace(/^```(?:json)?/i, "").replace(/```$/i, "").trim();
  // try direct parse
  const tryParse = (candidate: string): unknown[] | null => {
    try {
      const v = JSON.parse(candidate);
      return Array.isArray(v) ? v : null;
    } catch {
      return null;
    }
  };
  const direct = tryParse(s);
  if (direct) return direct;
  // fallback: slice from first '[' to last ']'
  const start = s.indexOf("[");
  const end = s.lastIndexOf("]");
  if (start !== -1 && end !== -1 && end > start) {
    return tryParse(s.slice(start, end + 1));
  }
  return null;
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/lib/parse/extractJson.test.ts`
Expected: PASS (4 tests).

- [ ] **Step 5: Commit**

```bash
git add src/lib/parse/extractJson.ts src/lib/parse/extractJson.test.ts
git commit -m "feat: extract json array from model output with tests"
```

---

## Task 6: Parse — relative date resolution (TDD)

**Files:**
- Create: `src/lib/parse/dates.ts`
- Test: `src/lib/parse/dates.test.ts`

This normalizes any `due_date` the model emits. The model is instructed to return absolute ISO dates, but this guards against relative leftovers ("today"/"tomorrow"/"завтра"/"сьогодні") using a known `today` reference.

- [ ] **Step 1: Write the failing test**

Create `src/lib/parse/dates.test.ts`:
```ts
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
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/lib/parse/dates.test.ts`
Expected: FAIL — module not found.

- [ ] **Step 3: Write the implementation**

Create `src/lib/parse/dates.ts`:
```ts
function addDays(iso: string, days: number): string {
  const d = new Date(iso + "T00:00:00Z");
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

const ISO = /^\d{4}-\d{2}-\d{2}$/;

export function normalizeDueDate(value: string | null, today: string): string | null {
  if (!value) return null;
  const v = value.trim().toLowerCase();
  if (ISO.test(v)) return v;
  if (v === "today" || v === "сьогодні") return today;
  if (v === "tomorrow" || v === "завтра") return addDays(today, 1);
  return null;
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/lib/parse/dates.test.ts`
Expected: PASS (4 tests).

- [ ] **Step 5: Commit**

```bash
git add src/lib/parse/dates.ts src/lib/parse/dates.test.ts
git commit -m "feat: relative due-date normalization with tests"
```

---

## Task 7: Parse — orchestrator with fallback (TDD)

**Files:**
- Create: `src/lib/parse/parseTasks.ts`
- Test: `src/lib/parse/parseTasks.test.ts`

- [ ] **Step 1: Write the failing test**

Create `src/lib/parse/parseTasks.test.ts`:
```ts
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
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/lib/parse/parseTasks.test.ts`
Expected: FAIL — module not found.

- [ ] **Step 3: Write the implementation**

Create `src/lib/parse/parseTasks.ts`:
```ts
import { extractJsonArray } from "./extractJson";
import { ParsedTaskSchema, type ParsedTask } from "./schema";
import { normalizeDueDate } from "./dates";

export interface ParseResult {
  ok: boolean;       // true if model JSON parsed; false if fallback used
  tasks: ParsedTask[];
}

export function parseModelOutput(
  modelText: string,
  today: string,
  rawInput = "",
): ParseResult {
  const arr = extractJsonArray(modelText);
  if (!arr) {
    return {
      ok: false,
      tasks: [{ title: (rawInput || modelText).slice(0, 200), priority: 4,
                duration_min: null, due_date: null, due_time: null }],
    };
  }
  const tasks: ParsedTask[] = [];
  for (const item of arr) {
    const parsed = ParsedTaskSchema.safeParse(item);
    if (parsed.success) {
      tasks.push({ ...parsed.data, due_date: normalizeDueDate(parsed.data.due_date, today) });
    }
  }
  if (tasks.length === 0) {
    return {
      ok: false,
      tasks: [{ title: (rawInput || "Нова задача").slice(0, 200), priority: 4,
                duration_min: null, due_date: null, due_time: null }],
    };
  }
  return { ok: true, tasks };
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/lib/parse/parseTasks.test.ts`
Expected: PASS (3 tests).

- [ ] **Step 5: Commit**

```bash
git add src/lib/parse/parseTasks.ts src/lib/parse/parseTasks.test.ts
git commit -m "feat: parse orchestrator with schema validation and raw fallback"
```

---

## Task 8: Parse — system prompt builder (TDD)

**Files:**
- Create: `src/lib/parse/prompt.ts`
- Test: `src/lib/parse/prompt.test.ts`

- [ ] **Step 1: Write the failing test**

Create `src/lib/parse/prompt.test.ts`:
```ts
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
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/lib/parse/prompt.test.ts`
Expected: FAIL — module not found.

- [ ] **Step 3: Write the implementation**

Create `src/lib/parse/prompt.ts`:
```ts
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
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/lib/parse/prompt.test.ts`
Expected: PASS (2 tests).

- [ ] **Step 5: Commit**

```bash
git add src/lib/parse/prompt.ts src/lib/parse/prompt.test.ts
git commit -m "feat: claude system prompt builder with tests"
```

---

## Task 9: Supabase clients + auth middleware

**Files:**
- Create: `src/lib/supabase/client.ts`, `src/lib/supabase/server.ts`, `src/lib/supabase/middleware.ts`, `middleware.ts`

- [ ] **Step 1: Browser client**

Create `src/lib/supabase/client.ts`:
```ts
import { createBrowserClient } from "@supabase/ssr";

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  );
}
```

- [ ] **Step 2: Server client**

Create `src/lib/supabase/server.ts`:
```ts
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

export async function createClient() {
  const cookieStore = await cookies();
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => cookieStore.getAll(),
        setAll: (toSet) => {
          try { toSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options)); }
          catch { /* called from a Server Component; ignore */ }
        },
      },
    },
  );
}
```

- [ ] **Step 3: Middleware session refresh + guard**

Create `src/lib/supabase/middleware.ts`:
```ts
import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export async function updateSession(request: NextRequest) {
  let response = NextResponse.next({ request });
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => request.cookies.getAll(),
        setAll: (toSet) => {
          toSet.forEach(({ name, value }) => request.cookies.set(name, value));
          response = NextResponse.next({ request });
          toSet.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
        },
      },
    },
  );
  const { data: { user } } = await supabase.auth.getUser();
  const path = request.nextUrl.pathname;
  const isAuthRoute = path.startsWith("/login") || path.startsWith("/auth");
  if (!user && !isAuthRoute) {
    return NextResponse.redirect(new URL("/login", request.url));
  }
  if (user && path === "/login") {
    return NextResponse.redirect(new URL("/today", request.url));
  }
  return response;
}
```

Create `middleware.ts` (project root):
```ts
import { type NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";

export async function middleware(request: NextRequest) {
  return await updateSession(request);
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)"],
};
```

- [ ] **Step 4: Verify build**

Run: `npm run build`
Expected: build succeeds (no type errors in supabase files).

- [ ] **Step 5: Commit**

```bash
git add src/lib/supabase middleware.ts
git commit -m "feat: supabase browser/server clients and auth middleware"
```

---

## Task 10: Login screen + auth callback

**Files:**
- Create: `src/app/login/page.tsx`, `src/app/auth/callback/route.ts`

- [ ] **Step 1: Login page**

Create `src/app/login/page.tsx`:
```tsx
"use client";
import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

export default function LoginPage() {
  const supabase = createClient();
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const redirectTo = typeof window !== "undefined" ? `${window.location.origin}/auth/callback` : undefined;

  const google = () => supabase.auth.signInWithOAuth({ provider: "google", options: { redirectTo } });
  const magic = async () => {
    await supabase.auth.signInWithOtp({ email, options: { emailRedirectTo: redirectTo } });
    setSent(true);
  };

  return (
    <main className="min-h-screen flex flex-col justify-center gap-6 px-6">
      <h1 className="text-2xl font-semibold">Вивали все з голови</h1>
      <button onClick={google}
        className="h-14 rounded-xl bg-black text-white text-base font-medium">
        Увійти через Google
      </button>
      <div className="flex flex-col gap-3">
        <input type="email" inputMode="email" placeholder="email@приклад.com"
          value={email} onChange={(e) => setEmail(e.target.value)}
          className="h-14 rounded-xl border px-4 text-base" />
        <button onClick={magic} disabled={!email}
          className="h-14 rounded-xl border text-base font-medium disabled:opacity-40">
          Надіслати магічне посилання
        </button>
        {sent && <p className="text-sm text-green-600">Перевір пошту — там посилання для входу.</p>}
      </div>
    </main>
  );
}
```

- [ ] **Step 2: Auth callback route**

Create `src/app/auth/callback/route.ts`:
```ts
import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  if (code) {
    const supabase = await createClient();
    await supabase.auth.exchangeCodeForSession(code);
  }
  return NextResponse.redirect(`${origin}/today`);
}
```

- [ ] **Step 3: Configure Supabase Auth providers**

In Supabase dashboard: enable Google OAuth (set client id/secret) and Email. Add the local + Vercel callback URLs to allowed redirect URLs: `http://localhost:3000/auth/callback` and `https://<your-vercel-domain>/auth/callback`.

- [ ] **Step 4: Manual verify**

Run: `npm run dev`, open `/login`, send magic-link to a real inbox, click it.
Expected: redirected to `/today` (will 404 until Task 12 — acceptable here; check no auth error in console).

- [ ] **Step 5: Commit**

```bash
git add src/app/login src/app/auth
git commit -m "feat: login screen with google and magic-link, auth callback"
```

---

## Task 11: Design tokens + base UI components

**Files:**
- Modify: `src/app/globals.css`
- Create: `src/components/PriorityDot.tsx`, `src/components/Chip.tsx`, `src/components/Checkbox.tsx`, `src/components/Skeleton.tsx`, `src/components/Toast.tsx`
- Test: `src/components/PriorityDot.test.tsx`

- [ ] **Step 1: Add design tokens**

Append to `src/app/globals.css`:
```css
:root {
  --bg: #ffffff; --surface: #f7f7f5; --surface-2: #efeeea;
  --text-primary: #1c1c1c; --text-secondary: #5c5c5c; --text-tertiary: #9a9a9a;
  --accent: #e8542a;
  --p1: #d8412f; --p2: #e8842a; --p3: #2a6fe8; --p4: #9a9a9a;
  --success: #2e9e5b; --danger: #d8412f;
}
@media (prefers-color-scheme: dark) {
  :root {
    --bg: #1a1a18; --surface: #232320; --surface-2: #2d2d29;
    --text-primary: #f2f2ef; --text-secondary: #b5b5b0; --text-tertiary: #7a7a76;
  }
}
html, body { background: var(--bg); color: var(--text-primary); }
@media (prefers-reduced-motion: reduce) {
  * { animation: none !important; transition: none !important; }
}
```

- [ ] **Step 2: Write the failing test (PriorityDot)**

Create `src/components/PriorityDot.test.tsx`:
```tsx
import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { PriorityDot } from "./PriorityDot";

describe("PriorityDot", () => {
  it("has an accessible label per priority", () => {
    render(<PriorityDot priority={1} />);
    expect(screen.getByLabelText("Пріоритет 1")).toBeInTheDocument();
  });
});
```

- [ ] **Step 3: Run test to verify it fails**

Run: `npx vitest run src/components/PriorityDot.test.tsx`
Expected: FAIL — module not found.

- [ ] **Step 4: Implement components**

Create `src/components/PriorityDot.tsx`:
```tsx
import type { Priority } from "@/lib/types";
const COLOR: Record<Priority, string> = { 1: "var(--p1)", 2: "var(--p2)", 3: "var(--p3)", 4: "var(--p4)" };
export function PriorityDot({ priority }: { priority: Priority }) {
  return <span role="img" aria-label={`Пріоритет ${priority}`}
    style={{ background: COLOR[priority] }}
    className="inline-block w-3 h-3 rounded-full shrink-0" />;
}
```

Create `src/components/Chip.tsx`:
```tsx
export function Chip({ children }: { children: React.ReactNode }) {
  return <span className="text-[13px] px-2 py-0.5 rounded-lg"
    style={{ background: "var(--surface-2)", color: "var(--text-secondary)" }}>{children}</span>;
}
```

Create `src/components/Checkbox.tsx`:
```tsx
export function Checkbox({ checked, onChange, label }:
  { checked: boolean; onChange: () => void; label: string }) {
  return (
    <button aria-label={label} aria-pressed={checked} onClick={onChange}
      className="w-12 h-12 flex items-center justify-center shrink-0">
      <span className="w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all"
        style={{ borderColor: checked ? "var(--success)" : "var(--text-tertiary)",
                 background: checked ? "var(--success)" : "transparent" }}>
        {checked && <span className="text-white text-sm">✓</span>}
      </span>
    </button>
  );
}
```

Create `src/components/Skeleton.tsx`:
```tsx
export function Skeleton() {
  return <div className="h-16 rounded-xl mb-2 animate-pulse" style={{ background: "var(--surface-2)" }} />;
}
```

Create `src/components/Toast.tsx`:
```tsx
"use client";
export function Toast({ message, action, onAction }:
  { message: string; action?: string; onAction?: () => void }) {
  return (
    <div role="status" className="fixed left-4 right-4 bottom-24 z-50 rounded-xl px-4 py-3 flex items-center justify-between"
      style={{ background: "var(--text-primary)", color: "var(--bg)" }}>
      <span className="text-sm">{message}</span>
      {action && <button onClick={onAction} className="text-sm font-medium underline">{action}</button>}
    </div>
  );
}
```

- [ ] **Step 5: Run test to verify it passes**

Run: `npx vitest run src/components/PriorityDot.test.tsx`
Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add src/app/globals.css src/components
git commit -m "feat: design tokens and base ui components"
```

---

## Task 12: App shell + bottom navigation

**Files:**
- Create: `src/app/(app)/layout.tsx`, `src/components/BottomNav.tsx`
- Test: `src/components/BottomNav.test.tsx`

- [ ] **Step 1: Write the failing test**

Create `src/components/BottomNav.test.tsx`:
```tsx
import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { BottomNav } from "./BottomNav";

vi.mock("next/navigation", () => ({ usePathname: () => "/today" }));

describe("BottomNav", () => {
  it("renders the four tabs", () => {
    render(<BottomNav />);
    ["Capture", "Today", "Upcoming", "Inbox"].forEach((t) =>
      expect(screen.getByText(t)).toBeInTheDocument());
  });
  it("marks current tab", () => {
    render(<BottomNav />);
    expect(screen.getByRole("link", { name: /Today/ })).toHaveAttribute("aria-current", "page");
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/components/BottomNav.test.tsx`
Expected: FAIL — module not found.

- [ ] **Step 3: Implement BottomNav**

Create `src/components/BottomNav.tsx`:
```tsx
"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";

const TABS = [
  { href: "/capture", label: "Capture", icon: "＋" },
  { href: "/today", label: "Today", icon: "◷" },
  { href: "/upcoming", label: "Upcoming", icon: "▦" },
  { href: "/inbox", label: "Inbox", icon: "▤" },
];

export function BottomNav() {
  const path = usePathname();
  return (
    <nav className="fixed bottom-0 left-0 right-0 border-t flex justify-around pb-[env(safe-area-inset-bottom)]"
      style={{ background: "var(--bg)" }}>
      {TABS.map((t) => {
        const active = path === t.href;
        return (
          <Link key={t.href} href={t.href} aria-current={active ? "page" : undefined}
            className="flex flex-col items-center gap-0.5 py-2 w-16 min-h-12"
            style={{ color: active ? "var(--accent)" : "var(--text-secondary)" }}>
            <span className="text-xl leading-none">{t.icon}</span>
            <span className="text-[11px]">{t.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
```

- [ ] **Step 4: Implement authenticated layout**

Create `src/app/(app)/layout.tsx`:
```tsx
import { BottomNav } from "@/components/BottomNav";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen pb-20">
      <div className="max-w-md mx-auto px-4">{children}</div>
      <BottomNav />
    </div>
  );
}
```

- [ ] **Step 5: Run test to verify it passes**

Run: `npx vitest run src/components/BottomNav.test.tsx`
Expected: PASS (2 tests).

- [ ] **Step 6: Commit**

```bash
git add "src/app/(app)/layout.tsx" src/components/BottomNav.tsx src/components/BottomNav.test.tsx
git commit -m "feat: app shell and bottom navigation"
```

---

## Task 13: DB access layer (tasks + projects)

**Files:**
- Create: `src/lib/db/tasks.ts`, `src/lib/db/projects.ts`

These wrap Supabase queries with typed signatures, used by client pages. Use the browser client.

- [ ] **Step 1: Projects access**

Create `src/lib/db/projects.ts`:
```ts
import { createClient } from "@/lib/supabase/client";
import type { Project } from "@/lib/types";

export async function listProjects(): Promise<Project[]> {
  const sb = createClient();
  const { data, error } = await sb.from("projects").select("*").order("is_inbox", { ascending: false });
  if (error) throw error;
  return data as Project[];
}

export async function getInboxProject(): Promise<Project | null> {
  const sb = createClient();
  const { data } = await sb.from("projects").select("*").eq("is_inbox", true).maybeSingle();
  return (data as Project) ?? null;
}
```

- [ ] **Step 2: Tasks access**

Create `src/lib/db/tasks.ts`:
```ts
import { createClient } from "@/lib/supabase/client";
import type { Task } from "@/lib/types";

type NewTask = Pick<Task, "title" | "priority"> &
  Partial<Pick<Task, "duration_min" | "due_date" | "due_time" | "project_id" | "source">>;

export async function insertTasks(rows: NewTask[]): Promise<Task[]> {
  const sb = createClient();
  const { data: { user } } = await sb.auth.getUser();
  if (!user) throw new Error("Not authenticated");
  const payload = rows.map((r) => ({ ...r, user_id: user.id }));
  const { data, error } = await sb.from("tasks").insert(payload).select("*");
  if (error) throw error;
  return data as Task[];
}

export async function listInbox(): Promise<Task[]> {
  const sb = createClient();
  const { data, error } = await sb.from("tasks")
    .select("*").is("due_date", null).eq("is_done", false)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data as Task[];
}

export async function listToday(today: string): Promise<Task[]> {
  const sb = createClient();
  const { data, error } = await sb.from("tasks")
    .select("*").lte("due_date", today)
    .order("is_focus", { ascending: false }).order("priority", { ascending: true });
  if (error) throw error;
  return data as Task[];
}

export async function listUpcoming(today: string): Promise<Task[]> {
  const sb = createClient();
  const { data, error } = await sb.from("tasks")
    .select("*").gt("due_date", today).eq("is_done", false)
    .order("due_date", { ascending: true });
  if (error) throw error;
  return data as Task[];
}

export async function updateTask(id: string, patch: Partial<Task>): Promise<void> {
  const sb = createClient();
  const { error } = await sb.from("tasks").update(patch).eq("id", id);
  if (error) throw error;
}

export async function deleteTask(id: string): Promise<void> {
  const sb = createClient();
  const { error } = await sb.from("tasks").delete().eq("id", id);
  if (error) throw error;
}

export async function setDone(id: string, done: boolean): Promise<void> {
  await updateTask(id, { is_done: done, completed_at: done ? new Date().toISOString() : null });
}

export async function countFocus(focusDate: string): Promise<number> {
  const sb = createClient();
  const { count } = await sb.from("tasks").select("*", { count: "exact", head: true })
    .eq("is_focus", true).eq("focus_date", focusDate);
  return count ?? 0;
}
```

- [ ] **Step 3: Verify build**

Run: `npm run build`
Expected: build succeeds.

- [ ] **Step 4: Commit**

```bash
git add src/lib/db
git commit -m "feat: typed supabase access layer for tasks and projects"
```

---

## Task 14: /api/parse route

**Files:**
- Create: `src/app/api/parse/route.ts`

- [ ] **Step 1: Implement the route**

Create `src/app/api/parse/route.ts`:
```ts
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

  let modelText = "";
  try {
    modelText = await callModel();
    let result = parseModelOutput(modelText, today, text);
    if (!result.ok) result = parseModelOutput(await callModel(), today, text); // one retry
    return NextResponse.json({ ok: result.ok, tasks: result.tasks, source });
  } catch (e) {
    const fallback = parseModelOutput("", today, text);
    return NextResponse.json({ ok: false, tasks: fallback.tasks, source }, { status: 200 });
  }
}
```

- [ ] **Step 2: Manual verify with auth**

Run `npm run dev`, log in, then in the browser console on an app page:
```js
fetch("/api/parse", { method: "POST", headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ text: "написати Анні, дзвінок завтра о 15", today: "2026-06-06" }) })
  .then(r => r.json()).then(console.log);
```
Expected: `{ ok: true, tasks: [...] }` with ≥1 structured task; the "дзвінок" task has `due_date` and `due_time`.

- [ ] **Step 3: Commit**

```bash
git add src/app/api/parse/route.ts
git commit -m "feat: /api/parse route calling claude with validation and retry"
```

---

## Task 15: Capture screen (text → parse → Inbox)

**Files:**
- Create: `src/app/(app)/capture/page.tsx`, `src/lib/analytics.ts`

- [ ] **Step 1: Analytics shim**

Create `src/lib/analytics.ts`:
```ts
export function track(event: string, props: Record<string, unknown> = {}) {
  if (typeof window !== "undefined") console.log("[track]", event, props);
}
```

- [ ] **Step 2: Capture page**

Create `src/app/(app)/capture/page.tsx`:
```tsx
"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { insertTasks } from "@/lib/db/tasks";
import { track } from "@/lib/analytics";

function todayIso() { return new Date().toISOString().slice(0, 10); }

export default function CapturePage() {
  const router = useRouter();
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const submit = async (source: "text" | "voice") => {
    if (text.trim().length < 3) { setError("Напиши трохи більше 🙂"); return; }
    setLoading(true); setError("");
    track("capture_started", { source });
    try {
      const res = await fetch("/api/parse", { method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text, today: todayIso(), source }) });
      const data = await res.json();
      await insertTasks((data.tasks ?? []).map((t: any) => ({ ...t, source })));
      track(data.ok ? "parse_succeeded" : "parse_failed", { count: data.tasks?.length ?? 0 });
      router.push("/inbox");
    } catch {
      setError("Щось пішло не так. Спробуй ще раз.");
    } finally { setLoading(false); }
  };

  return (
    <main className="pt-8 flex flex-col gap-4 min-h-[70vh]">
      <h1 className="text-2xl font-semibold">Що в голові?</h1>
      <textarea value={text} onChange={(e) => setText(e.target.value)} disabled={loading}
        placeholder="напр.: написати Анні, доробити презу, дзвінок о 15…"
        className="flex-1 min-h-48 rounded-xl border p-4 text-base resize-none"
        style={{ background: "var(--surface)" }} />
      {error && <p className="text-sm" style={{ color: "var(--danger)" }}>{error}</p>}
      <button onClick={() => submit("text")} disabled={loading}
        className="h-14 rounded-xl text-white text-base font-medium disabled:opacity-50"
        style={{ background: "var(--accent)" }}>
        {loading ? "AI розбирає…" : "Розкласти на задачі"}
      </button>
    </main>
  );
}
```

- [ ] **Step 3: Manual verify**

Run `npm run dev`, log in, go to `/capture`, type "написати Анні, дзвінок завтра о 15", submit.
Expected: redirect to `/inbox`; tasks appear after Task 16.

- [ ] **Step 4: Commit**

```bash
git add "src/app/(app)/capture/page.tsx" src/lib/analytics.ts
git commit -m "feat: capture screen with text brain-dump and parse flow"
```

---

## Task 16: Inbox screen + triage + TaskCard

**Files:**
- Create: `src/app/(app)/inbox/page.tsx`, `src/components/TaskCard.tsx`

- [ ] **Step 1: TaskCard component**

Create `src/components/TaskCard.tsx`:
```tsx
"use client";
import type { Task } from "@/lib/types";
import { PriorityDot } from "./PriorityDot";
import { Chip } from "./Chip";

export function TaskCard({ task, actions }:
  { task: Task; actions?: React.ReactNode }) {
  return (
    <div className="flex items-start gap-3 p-3 rounded-xl mb-2" style={{ background: "var(--surface)" }}>
      <PriorityDot priority={task.priority} />
      <div className="flex-1 min-w-0">
        <p className="text-base" style={{ color: "var(--text-primary)" }}>{task.title}</p>
        <div className="flex gap-2 mt-1 flex-wrap">
          {task.duration_min && <Chip>{task.duration_min} хв</Chip>}
          {task.due_date && <Chip>{task.due_date}{task.due_time ? ` ${task.due_time}` : ""}</Chip>}
        </div>
      </div>
      {actions}
    </div>
  );
}
```

- [ ] **Step 2: Inbox page with triage**

Create `src/app/(app)/inbox/page.tsx`:
```tsx
"use client";
import { useEffect, useState } from "react";
import { listInbox, updateTask, deleteTask } from "@/lib/db/tasks";
import { TaskCard } from "@/components/TaskCard";
import { Skeleton } from "@/components/Skeleton";
import { track } from "@/lib/analytics";
import type { Task } from "@/lib/types";

function todayIso() { return new Date().toISOString().slice(0, 10); }

export default function InboxPage() {
  const [tasks, setTasks] = useState<Task[] | null>(null);
  const load = () => listInbox().then(setTasks).catch(() => setTasks([]));
  useEffect(() => { load(); }, []);

  const toToday = async (t: Task) => {
    setTasks((cur) => cur?.filter((x) => x.id !== t.id) ?? null);
    await updateTask(t.id, { due_date: todayIso() });
    track("task_triaged", { action: "today" });
  };
  const remove = async (t: Task) => {
    setTasks((cur) => cur?.filter((x) => x.id !== t.id) ?? null);
    await deleteTask(t.id);
    track("task_triaged", { action: "delete" });
  };

  if (tasks === null) return <div className="pt-8">{[0,1,2].map((i) => <Skeleton key={i} />)}</div>;
  if (tasks.length === 0)
    return <main className="pt-8 text-center" style={{ color: "var(--text-secondary)" }}>
      <h1 className="text-2xl font-semibold mb-2" style={{ color: "var(--text-primary)" }}>Inbox</h1>
      <p>Чисто. Натисни ＋ і вивали все, що в голові.</p>
    </main>;

  return (
    <main className="pt-8">
      <h1 className="text-2xl font-semibold mb-4">Inbox</h1>
      {tasks.map((t) => (
        <TaskCard key={t.id} task={t} actions={
          <div className="flex flex-col gap-2">
            <button onClick={() => toToday(t)} aria-label="В день"
              className="w-12 h-12 rounded-lg" style={{ background: "var(--surface-2)" }}>📅</button>
            <button onClick={() => remove(t)} aria-label="Видалити"
              className="w-12 h-12 rounded-lg" style={{ background: "var(--surface-2)" }}>🗑</button>
          </div>
        } />
      ))}
    </main>
  );
}
```

- [ ] **Step 3: Manual verify**

Run `npm run dev`. After a capture, `/inbox` shows the generated tasks. Tap "В день" → task disappears (moves to Today). Tap delete → task disappears.
Expected: behaviors as described; refresh keeps state (persisted in Supabase).

- [ ] **Step 4: Commit**

```bash
git add src/components/TaskCard.tsx "src/app/(app)/inbox/page.tsx"
git commit -m "feat: inbox screen with task triage"
```

---

## Task 17: Today screen + complete + Focus of the day

**Files:**
- Create: `src/app/(app)/today/page.tsx`

- [ ] **Step 1: Today page**

Create `src/app/(app)/today/page.tsx`:
```tsx
"use client";
import { useEffect, useState } from "react";
import { listToday, setDone, updateTask, countFocus } from "@/lib/db/tasks";
import { TaskCard } from "@/components/TaskCard";
import { Checkbox } from "@/components/Checkbox";
import { Skeleton } from "@/components/Skeleton";
import { Toast } from "@/components/Toast";
import { track } from "@/lib/analytics";
import type { Task } from "@/lib/types";

function todayIso() { return new Date().toISOString().slice(0, 10); }
const FOCUS_LIMIT = 3;

export default function TodayPage() {
  const today = todayIso();
  const [tasks, setTasks] = useState<Task[] | null>(null);
  const [toast, setToast] = useState("");
  const load = () => listToday(today).then(setTasks).catch(() => setTasks([]));
  useEffect(() => { load(); }, []);

  const focus = (tasks ?? []).filter((t) => t.is_focus && t.focus_date === today);
  const rest = (tasks ?? []).filter((t) => !(t.is_focus && t.focus_date === today));
  const focusDone = focus.filter((t) => t.is_done).length;

  const toggle = async (t: Task) => {
    const done = !t.is_done;
    setTasks((cur) => cur?.map((x) => x.id === t.id ? { ...x, is_done: done } : x) ?? null);
    await setDone(t.id, done);
    if (done) track("task_completed", {});
  };

  const toggleFocus = async (t: Task) => {
    if (!t.is_focus) {
      const n = await countFocus(today);
      if (n >= FOCUS_LIMIT) { setToast("Фокус — це максимум 3. Прибери щось, щоб додати нове."); return; }
      setTasks((cur) => cur?.map((x) => x.id === t.id ? { ...x, is_focus: true, focus_date: today } : x) ?? null);
      await updateTask(t.id, { is_focus: true, focus_date: today });
      track("focus_set", {});
    } else {
      setTasks((cur) => cur?.map((x) => x.id === t.id ? { ...x, is_focus: false, focus_date: null } : x) ?? null);
      await updateTask(t.id, { is_focus: false, focus_date: null });
    }
  };

  if (tasks === null) return <div className="pt-8">{[0,1,2].map((i) => <Skeleton key={i} />)}</div>;

  const row = (t: Task) => (
    <div key={t.id} className="flex items-center gap-1">
      <Checkbox checked={t.is_done} onChange={() => toggle(t)} label={`Виконати: ${t.title}`} />
      <div className="flex-1"><TaskCard task={t} actions={
        <button onClick={() => toggleFocus(t)} aria-label="У фокус" className="w-12 h-12"
          style={{ color: t.is_focus ? "var(--accent)" : "var(--text-tertiary)" }}>★</button>
      } /></div>
    </div>
  );

  return (
    <main className="pt-8">
      <h1 className="text-2xl font-semibold">Today</h1>
      <p className="text-sm mb-4" style={{ color: "var(--text-secondary)" }}>
        Фокус: {focusDone} з {focus.length} · Всього: {tasks.filter(t=>t.is_done).length} з {tasks.length} зроблено
      </p>

      <h2 className="text-lg font-medium mb-2">🎯 Фокус дня</h2>
      {focus.length === 0
        ? <p className="text-sm mb-4" style={{ color: "var(--text-tertiary)" }}>Обери 1–3 головні задачі на сьогодні (★).</p>
        : <div className="mb-4">{focus.map(row)}</div>}
      {focus.length > 0 && focusDone === focus.length &&
        <p className="text-sm mb-4" style={{ color: "var(--success)" }}>Головне на сьогодні — зроблено 🎯</p>}

      <h2 className="text-lg font-medium mb-2">Решта</h2>
      {rest.length === 0
        ? <p className="text-sm" style={{ color: "var(--text-tertiary)" }}>На сьогодні більше нічого 🎉</p>
        : rest.map(row)}

      {toast && <Toast message={toast} action="Ок" onAction={() => setToast("")} />}
    </main>
  );
}
```

- [ ] **Step 2: Manual verify**

Triage some tasks to Today (Task 16). On `/today`: tap ★ on up to 3 tasks → they move to Focus; tap ★ on a 4th → toast appears, blocked. Check a task → strikes through / counter updates. Complete all focus tasks → success line appears.
Expected: all behaviors work; reload persists state.

- [ ] **Step 3: Commit**

```bash
git add "src/app/(app)/today/page.tsx"
git commit -m "feat: today screen with completion and focus-of-the-day"
```

---

## Task 18: Upcoming screen (grouped by date)

**Files:**
- Create: `src/app/(app)/upcoming/page.tsx`

- [ ] **Step 1: Upcoming page**

Create `src/app/(app)/upcoming/page.tsx`:
```tsx
"use client";
import { useEffect, useState } from "react";
import { listUpcoming } from "@/lib/db/tasks";
import { TaskCard } from "@/components/TaskCard";
import { Skeleton } from "@/components/Skeleton";
import type { Task } from "@/lib/types";

function todayIso() { return new Date().toISOString().slice(0, 10); }

export default function UpcomingPage() {
  const [tasks, setTasks] = useState<Task[] | null>(null);
  useEffect(() => { listUpcoming(todayIso()).then(setTasks).catch(() => setTasks([])); }, []);

  if (tasks === null) return <div className="pt-8">{[0,1].map((i) => <Skeleton key={i} />)}</div>;

  const groups = tasks.reduce<Record<string, Task[]>>((acc, t) => {
    const k = t.due_date ?? "—"; (acc[k] ||= []).push(t); return acc;
  }, {});

  return (
    <main className="pt-8">
      <h1 className="text-2xl font-semibold mb-4">Upcoming</h1>
      {Object.keys(groups).length === 0 && (
        <p className="text-sm" style={{ color: "var(--text-tertiary)" }}>Поки нічого не заплановано наперед.</p>
      )}
      {Object.entries(groups).map(([date, list]) => (
        <section key={date} className="mb-5">
          <h2 className="text-lg font-medium mb-2">{date}</h2>
          {list.map((t) => <TaskCard key={t.id} task={t} />)}
        </section>
      ))}
    </main>
  );
}
```

- [ ] **Step 2: Manual verify**

Create a task with a future date (e.g. capture "дзвінок у пʼятницю"). Visit `/upcoming`.
Expected: task grouped under its date.

- [ ] **Step 3: Commit**

```bash
git add "src/app/(app)/upcoming/page.tsx"
git commit -m "feat: upcoming screen grouped by date"
```

---

## Task 19: Projects screen

**Files:**
- Create: `src/app/(app)/projects/page.tsx`

- [ ] **Step 1: Projects page**

Create `src/app/(app)/projects/page.tsx`:
```tsx
"use client";
import { useEffect, useState } from "react";
import { listProjects } from "@/lib/db/projects";
import { Skeleton } from "@/components/Skeleton";
import type { Project } from "@/lib/types";

export default function ProjectsPage() {
  const [projects, setProjects] = useState<Project[] | null>(null);
  useEffect(() => { listProjects().then(setProjects).catch(() => setProjects([])); }, []);

  if (projects === null) return <div className="pt-8">{[0,1].map((i) => <Skeleton key={i} />)}</div>;

  return (
    <main className="pt-8">
      <h1 className="text-2xl font-semibold mb-4">Projects</h1>
      {projects.map((p) => (
        <div key={p.id} className="flex items-center gap-3 p-3 rounded-xl mb-2" style={{ background: "var(--surface)" }}>
          <span className="w-3 h-3 rounded-full" style={{ background: p.color }} />
          <span className="text-base">{p.name}</span>
        </div>
      ))}
    </main>
  );
}
```

- [ ] **Step 2: Manual verify**

Visit `/projects`.
Expected: at least the default "Inbox" project shows.

- [ ] **Step 3: Commit**

```bash
git add "src/app/(app)/projects/page.tsx"
git commit -m "feat: projects list screen"
```

---

## Task 20: Voice capture (Web Speech API)

**Files:**
- Create: `src/lib/voice/useSpeech.ts`, `src/components/MicButton.tsx`
- Modify: `src/app/(app)/capture/page.tsx`
- Test: `src/lib/voice/useSpeech.test.ts`

- [ ] **Step 1: Write the failing test (support detection)**

Create `src/lib/voice/useSpeech.test.ts`:
```ts
import { describe, it, expect } from "vitest";
import { isSpeechSupported } from "./useSpeech";

describe("isSpeechSupported", () => {
  it("returns false when no SpeechRecognition on window", () => {
    expect(isSpeechSupported({} as any)).toBe(false);
  });
  it("returns true when webkitSpeechRecognition exists", () => {
    expect(isSpeechSupported({ webkitSpeechRecognition: function () {} } as any)).toBe(true);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/lib/voice/useSpeech.test.ts`
Expected: FAIL — module not found.

- [ ] **Step 3: Implement the hook**

Create `src/lib/voice/useSpeech.ts`:
```ts
"use client";
import { useRef, useState, useCallback } from "react";

export function isSpeechSupported(w: Window & typeof globalThis): boolean {
  return typeof (w as any).SpeechRecognition !== "undefined"
      || typeof (w as any).webkitSpeechRecognition !== "undefined";
}

export function useSpeech(onText: (text: string) => void) {
  const recRef = useRef<any>(null);
  const [listening, setListening] = useState(false);
  const [interim, setInterim] = useState("");

  const start = useCallback(() => {
    const w = window as any;
    const Ctor = w.SpeechRecognition || w.webkitSpeechRecognition;
    if (!Ctor) return;
    const rec = new Ctor();
    rec.lang = "uk-UA"; rec.continuous = true; rec.interimResults = true;
    rec.onresult = (e: any) => {
      let finalText = ""; let interimText = "";
      for (let i = e.resultIndex; i < e.results.length; i++) {
        const r = e.results[i];
        if (r.isFinal) finalText += r[0].transcript; else interimText += r[0].transcript;
      }
      if (finalText) onText(finalText);
      setInterim(interimText);
    };
    rec.onend = () => { setListening(false); setInterim(""); };
    rec.onerror = () => { setListening(false); setInterim(""); };
    recRef.current = rec; rec.start(); setListening(true);
  }, [onText]);

  const stop = useCallback(() => { recRef.current?.stop(); setListening(false); }, []);

  return { listening, interim, start, stop };
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/lib/voice/useSpeech.test.ts`
Expected: PASS (2 tests).

- [ ] **Step 5: MicButton component**

Create `src/components/MicButton.tsx`:
```tsx
"use client";
export function MicButton({ listening, onStart, onStop, supported }:
  { listening: boolean; onStart: () => void; onStop: () => void; supported: boolean }) {
  if (!supported) return null;
  return (
    <button aria-label={listening ? "Зупинити запис" : "Записати голосом"}
      onClick={listening ? onStop : onStart}
      className="w-[72px] h-[72px] rounded-full mx-auto flex items-center justify-center text-3xl text-white"
      style={{ background: listening ? "var(--danger)" : "var(--accent)" }}>
      {listening ? "■" : "🎤"}
    </button>
  );
}
```

- [ ] **Step 6: Wire mic into Capture**

In `src/app/(app)/capture/page.tsx`, add imports at top:
```tsx
import { useEffect } from "react";
import { useSpeech, isSpeechSupported } from "@/lib/voice/useSpeech";
import { MicButton } from "@/components/MicButton";
```
Inside the component, after the `useState` hooks, add:
```tsx
  const [supported, setSupported] = useState(false);
  useEffect(() => { setSupported(isSpeechSupported(window)); }, []);
  const { listening, interim, start, stop } = useSpeech((t) => setText((cur) => (cur ? cur + " " : "") + t));
```
Then, just above the "Розкласти на задачі" button, insert:
```tsx
      {interim && <p className="text-sm" style={{ color: "var(--text-tertiary)" }}>{interim}…</p>}
      <MicButton listening={listening} supported={supported}
        onStart={start} onStop={stop} />
```
And change the submit button's source to `"voice"` when text came from speech is out of scope — keep `submit("text")`; the brain-dump still works. (Voice path simply fills the textarea.)

- [ ] **Step 7: Manual verify (real device/Chrome)**

Run `npm run dev`, open `/capture` in Chrome, tap mic, grant permission, speak Ukrainian.
Expected: live interim text shows; on stop, recognized text lands in the textarea; submit works. In an unsupported browser the mic button is hidden.

- [ ] **Step 8: Commit**

```bash
git add src/lib/voice src/components/MicButton.tsx "src/app/(app)/capture/page.tsx"
git commit -m "feat: voice brain-dump via web speech api"
```

---

## Task 21: Onboarding (3 slides) + first-run gate

**Files:**
- Create: `src/components/Onboarding.tsx`
- Modify: `src/app/(app)/layout.tsx`

- [ ] **Step 1: Onboarding component**

Create `src/components/Onboarding.tsx`:
```tsx
"use client";
import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { track } from "@/lib/analytics";

const SLIDES = [
  { t: "Вивали все з голови", s: "Голосом або текстом — все, що крутиться в думках." },
  { t: "AI розкладе по полицях", s: "Пріоритет, оцінка часу і дата — автоматично." },
  { t: "Фокусуйся на головному", s: "Триаж в Inbox → обери 1–3 задачі дня у Focus." },
];

export function Onboarding({ onDone }: { onDone: () => void }) {
  const [i, setI] = useState(0);
  const finish = async (skipped: boolean) => {
    const sb = createClient();
    const { data: { user } } = await sb.auth.getUser();
    if (user) await sb.from("profiles").update({ onboarding_done: true }).eq("id", user.id);
    track(skipped ? "onboarding_skipped" : "onboarding_completed", {});
    onDone();
  };
  const last = i === SLIDES.length - 1;
  return (
    <div className="fixed inset-0 z-50 flex flex-col justify-between p-6" style={{ background: "var(--bg)" }}>
      <button onClick={() => finish(true)} className="self-end text-sm" style={{ color: "var(--text-secondary)" }}>Пропустити</button>
      <div className="flex-1 flex flex-col justify-center gap-3">
        <h1 className="text-3xl font-semibold">{SLIDES[i].t}</h1>
        <p className="text-base" style={{ color: "var(--text-secondary)" }}>{SLIDES[i].s}</p>
      </div>
      <button onClick={() => last ? finish(false) : setI(i + 1)}
        className="h-14 rounded-xl text-white text-base font-medium" style={{ background: "var(--accent)" }}>
        {last ? "Почати" : "Далі"}
      </button>
    </div>
  );
}
```

- [ ] **Step 2: Gate onboarding in the app layout**

Replace `src/app/(app)/layout.tsx` with a client wrapper that checks `onboarding_done`:
```tsx
"use client";
import { useEffect, useState } from "react";
import { BottomNav } from "@/components/BottomNav";
import { Onboarding } from "@/components/Onboarding";
import { createClient } from "@/lib/supabase/client";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const [showOnboarding, setShowOnboarding] = useState<boolean | null>(null);
  useEffect(() => {
    const sb = createClient();
    sb.auth.getUser().then(async ({ data: { user } }) => {
      if (!user) { setShowOnboarding(false); return; }
      const { data } = await sb.from("profiles").select("onboarding_done").eq("id", user.id).maybeSingle();
      setShowOnboarding(!(data?.onboarding_done));
    });
  }, []);
  return (
    <div className="min-h-screen pb-20">
      {showOnboarding && <Onboarding onDone={() => setShowOnboarding(false)} />}
      <div className="max-w-md mx-auto px-4">{children}</div>
      <BottomNav />
    </div>
  );
}
```

- [ ] **Step 3: Manual verify**

Log in as a brand-new user.
Expected: 3 onboarding slides show first; "Почати"/"Пропустити" sets `onboarding_done=true`; reload does not show onboarding again.

- [ ] **Step 4: Commit**

```bash
git add src/components/Onboarding.tsx "src/app/(app)/layout.tsx"
git commit -m "feat: first-run onboarding with three slides"
```

---

## Task 22: Root redirect + full test pass

**Files:**
- Modify: `src/app/page.tsx`

- [ ] **Step 1: Redirect root to /today**

Replace `src/app/page.tsx`:
```tsx
import { redirect } from "next/navigation";
export default function Home() { redirect("/today"); }
```

- [ ] **Step 2: Run the whole test suite**

Run: `npm test`
Expected: all unit tests pass (schema, extractJson, dates, parseTasks, prompt, PriorityDot, BottomNav, useSpeech).

- [ ] **Step 3: Production build**

Run: `npm run build`
Expected: build succeeds with no type errors.

- [ ] **Step 4: Commit**

```bash
git add src/app/page.tsx
git commit -m "chore: redirect root to today; green test + build"
```

---

## Task 23: Deploy to Vercel

**Files:** none (configuration)

- [ ] **Step 1: Push to GitHub**

```bash
git remote add origin <your-repo-url>
git push -u origin main
```

- [ ] **Step 2: Import to Vercel**

In Vercel: New Project → import the repo → framework auto-detected (Next.js).

- [ ] **Step 3: Set environment variables in Vercel**

Add (Production + Preview): `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `ANTHROPIC_API_KEY`.

- [ ] **Step 4: Update Supabase redirect URLs**

Add `https://<your-vercel-domain>/auth/callback` to Supabase Auth allowed redirect URLs and Site URL. In Google Cloud OAuth, add the same callback to authorized redirect URIs.

- [ ] **Step 5: Deploy + smoke test on phone**

Trigger deploy (push or "Deploy"). On a phone, open the Vercel URL: log in, run a real Ukrainian voice brain-dump, triage to Today, set Focus, complete a task.
Expected: full flow works on mobile at the public URL.

- [ ] **Step 6: Commit any config**

```bash
git add -A
git commit -m "chore: vercel deployment config" --allow-empty
git push
```

---

## Acceptance criteria (from spec §15)

- [ ] New user signs up, sees onboarding, data isolated via RLS.
- [ ] Voice and text brain-dump in Ukrainian → structured tasks (priority, duration, due date where mentioned).
- [ ] Inbox triage, Today/Upcoming views, Projects grouping, completion all work.
- [ ] Focus of the day: choose 1–3 tasks, limit of 3 enforced, completion state shown.
- [ ] No AI/network failure loses user input (raw-text fallback).
- [ ] Deployed to Vercel, reachable at a public URL from a phone.
