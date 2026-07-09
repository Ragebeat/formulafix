import { NextRequest, NextResponse } from "next/server";
import { getServerSupabase } from "@/lib/supabase";
import { appendFile, mkdir } from "fs/promises";
import path from "path";

const BASE = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";

/**
 * Отправка magic link на email.
 * Без Supabase (демо-режим) — сохраняем email в лид-лист.
 */
export async function POST(req: NextRequest) {
  let body: { email?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }
  const email = (body.email || "").trim().toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return NextResponse.json({ error: "invalid_email" }, { status: 400 });
  }

  const supabase = getServerSupabase();
  if (!supabase) {
    try {
      const dir = path.join(process.cwd(), "data");
      await mkdir(dir, { recursive: true });
      await appendFile(
        path.join(dir, "emails.jsonl"),
        JSON.stringify({ email, at: new Date().toISOString() }) + "\n"
      );
    } catch (e) {
      console.error("demo lead save failed:", e);
      return NextResponse.json({ error: "save_failed" }, { status: 500 });
    }
    return NextResponse.json({ ok: true, demo: true });
  }

  const { error } = await supabase.auth.signInWithOtp({
    email,
    options: { emailRedirectTo: `${BASE}/auth/callback` },
  });
  if (error) {
    console.error("signInWithOtp failed:", error.message);
    return NextResponse.json(
      { error: "otp_failed", message: "Couldn't send the sign-in link. Try again in a minute." },
      { status: 502 }
    );
  }
  return NextResponse.json({ ok: true, demo: false });
}
