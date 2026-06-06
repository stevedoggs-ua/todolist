import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const errorDescription = searchParams.get("error_description");

  // Supabase bounced back with an error (e.g. expired/used magic link).
  if (errorDescription) {
    return NextResponse.redirect(`${origin}/login?auth_error=1`);
  }

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (error) {
      return NextResponse.redirect(`${origin}/login?auth_error=1`);
    }
    return NextResponse.redirect(`${origin}/today`);
  }

  // No code and no error — nothing to exchange.
  return NextResponse.redirect(`${origin}/login?auth_error=1`);
}
