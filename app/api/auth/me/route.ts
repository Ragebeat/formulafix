import { NextResponse } from "next/server";
import { getServerSupabase, getAdminSupabase } from "@/lib/supabase";

export async function GET() {
  const supabase = getServerSupabase();
  if (!supabase) return NextResponse.json({ anon: true, demo: true });

  const { data } = await supabase.auth.getUser();
  if (!data.user) return NextResponse.json({ anon: true });

  let plan = "free";
  const admin = getAdminSupabase();
  if (admin) {
    const { data: prof } = await admin
      .from("profiles")
      .select("plan")
      .eq("id", data.user.id)
      .single();
    if (prof?.plan) plan = prof.plan;
  }
  return NextResponse.json({ email: data.user.email, plan });
}
