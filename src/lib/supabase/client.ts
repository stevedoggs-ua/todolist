import { createBrowserClient } from "@supabase/ssr";

// Fallbacks keep the production build from crashing during static prerender
// when the env vars aren't present (demo mode doesn't use Supabase). Real
// values are used whenever they're configured.
export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || "https://placeholder.supabase.co",
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "placeholder-anon-key",
  );
}
