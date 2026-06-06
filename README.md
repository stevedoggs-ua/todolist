# AI Day Planner

Mobile-first планувальник дня. Користувач одним потоком (голос або текст) вивалює все з голови, а Claude перетворює це на структуровані задачі (пріоритет, оцінка часу, дата) і розкладає по Inbox / Today / Upcoming / Projects з «Фокусом дня» (1–3 головні задачі).

**Стек:** Next.js 16 (App Router, TypeScript) · Tailwind v4 · Supabase (Auth + Postgres + RLS) · Claude API · Web Speech API · Vitest. Деплой — Vercel.

Специфікація: [`specs/2026-06-06-ai-day-planner-design.md`](specs/2026-06-06-ai-day-planner-design.md) · План: [`plans/2026-06-06-ai-day-planner.md`](plans/2026-06-06-ai-day-planner.md).

---

## Локальний запуск

```bash
npm install
cp .env.local.example .env.local   # заповни реальними значеннями (див. нижче)
npm run dev                         # http://localhost:3000
npm test                            # юніт-тести (Vitest)
npm run build                       # production-білд
```

> Node.js встановлено локально в `~/.local/node-v22.22.3-darwin-arm64` і додано в `~/.zshrc`/`~/.zshenv`. У новій сесії термінала `node`/`npm` мають бути доступні; якщо ні — відкрий нове вікно термінала або виконай `export PATH="$HOME/.local/node-v22.22.3-darwin-arm64/bin:$PATH"`.

### Змінні середовища (`.env.local`)

| змінна | де взяти |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase → Project Settings → API → Project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | там само → anon public key |
| `SUPABASE_SERVICE_ROLE_KEY` | там само → service_role key (тільки сервер) |
| `ANTHROPIC_API_KEY` | console.anthropic.com → API Keys |

Зараз у `.env.local` лежать **placeholder-значення** — застосунок збирається й рендериться, але вхід та AI-парсинг не працюватимуть, доки не підставиш справжні ключі.

---

## Лишилось зробити вручну (потрібні твої акаунти)

1. **Supabase проєкт.** Створи проєкт на supabase.com.
2. **Міграція.** Застосуй [`supabase/migrations/0001_init.sql`](supabase/migrations/0001_init.sql) через SQL Editor (вставити та запустити) або `supabase db push`. Створює `profiles`/`projects`/`tasks`, RLS і тригер, що заводить дефолтний проєкт Inbox при реєстрації.
3. **Auth-провайдери.** У Supabase → Authentication: увімкни **Email** і **Google OAuth** (client id/secret з Google Cloud). У Redirect URLs додай:
   - `http://localhost:3000/auth/callback`
   - `https://<твій-vercel-домен>/auth/callback`
4. **Ключі.** Заповни `.env.local`.
5. **Деплой на Vercel.** Імпортуй репозиторій (фреймворк визначиться автоматично), додай ті самі 4 env-змінні (Production + Preview), додай Vercel-домен у Supabase Redirect URLs і в Google OAuth.

---

## Архітектура

- `src/lib/parse/*` — чисті, повністю покриті тестами функції (валідація схеми Zod, витяг JSON, нормалізація дат, оркестратор з фолбеком, системний промпт). Без мережі та БД.
- `src/app/api/parse/route.ts` — єдине місце, що кличе Claude (server-side). Авторизований, з одним авто-ретраєм і raw-text фолбеком (жоден інпут не губиться).
- `src/lib/supabase/*` — браузерний/серверний SSR-клієнти + middleware (оновлення сесії та auth-guard, лежить у `src/middleware.ts`).
- `src/lib/db/*` — типізовані обгортки над запитами Supabase.
- `src/app/(app)/*` — захищені екрани (Capture, Inbox, Today, Upcoming, Projects) під спільним shell з нижнім таб-баром.
- `src/components/*` — презентаційні компоненти (TaskCard, PriorityDot, Checkbox, MicButton, Toast, Onboarding…).
