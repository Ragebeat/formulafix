import { NextResponse } from "next/server";
import { getServerSupabase } from "@/lib/supabase";

export async function POST() {
  const supabase = getServerSupabase();
  if (supabase) await supabase.auth.signOut();
  return NextResponse.json({ ok: true });
}
