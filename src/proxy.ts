import { NextResponse, type NextRequest } from "next/server";

// DEMO MODE: auth is disabled — every route is open, no login required.
// To restore the real auth guard, bring back updateSession() from
// "@/lib/supabase/middleware" (see git history) and call it here.
export async function proxy(request: NextRequest) {
  return NextResponse.next({ request });
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)"],
};
