import { NextResponse, type NextRequest } from "next/server";
import type { EmailOtpType } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/server";
import { safeNextPath } from "@/lib/auth/safe-next";

// Landing point for every Supabase email link (sign-up confirmation, password
// reset). Handles both the PKCE `code` link and the `token_hash` template link.
export async function GET(request: NextRequest) {
  const { searchParams, origin } = request.nextUrl;
  const safeNext = safeNextPath(searchParams.get("next"));

  const supabase = await createClient();
  const code = searchParams.get("code");
  const tokenHash = searchParams.get("token_hash");
  const type = searchParams.get("type") as EmailOtpType | null;

  const { error } = code
    ? await supabase.auth.exchangeCodeForSession(code)
    : tokenHash && type
      ? await supabase.auth.verifyOtp({ token_hash: tokenHash, type })
      : { error: new Error("missing code") };

  if (error) {
    const fail = safeNext.startsWith("/reset-password") ? "/forgot-password?error=link" : "/sign-in?error=link";
    return NextResponse.redirect(new URL(fail, origin));
  }
  return NextResponse.redirect(new URL(safeNext, origin));
}
