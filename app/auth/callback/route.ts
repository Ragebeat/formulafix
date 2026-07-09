import { NextRequest, NextResponse } from "next/server";
import { getServerSupabase } from "@/lib/supabase";
import type { EmailOtpType } from "@supabase/supabase-js";

/**
 * Callback после клика по magic link.
 *  - PKCE:       ?code=...                     (тот же браузер)
 *  - token_hash: ?token_hash=...&type=email    (любой браузер; шаблон
 *    письма Supabase должен использовать TokenHash)
 */
export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const code = url.searchParams.get("code");
  const tokenHash = url.searchParams.get("token_hash");
  const type = (url.searchParams.get("type") || "email") as EmailOtpType;
  const redirectTo = new URL("/", url.origin);

  const supabase = getServerSupabase();
  if (!supabase) return NextResponse.redirect(redirectTo);

  let ok = false;
  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    ok = !error;
    if (error) console.error("exchangeCodeForSession:", error.message);
  } else if (tokenHash) {
    const { error } = await supabase.auth.verifyOtp({ token_hash: tokenHash, type });
    ok = !error;
    if (error) console.error("verifyOtp:", error.message);
  }

  if (!ok) redirectTo.searchParams.set("auth", "error");
  return NextResponse.redirect(redirectTo);
}
