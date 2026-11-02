import { NextRequest, NextResponse } from "next/server";
import { analyze } from "@/lib/analyze";
import { checkAndIncrement, Tier } from "@/lib/quota";
import { getServerSupabase, getAdminSupabase } from "@/lib/supabase";
import { createHash, randomUUID } from "crypto";

export async function POST(req: NextRequest) {
  let body: { formula?: string; context?: string; dialect?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }

  const formula = (body.formula || "").trim();
  const context = (body.context || "").trim().slice(0, 2000);
  const dialect = body.dialect === "sheets" ? "sheets" : "excel";

  if (formula.length < 3 || formula.length > 2000) {
    return NextResponse.json(
      { error: "invalid_formula", message: "Formula must be 3-2000 characters." },
      { status: 400 }
    );
  }

  // Who is calling: pro / free (from the Supabase session) or anonymous
  let tier: Tier = "anon";
  let quotaKey: string;
  let ffid: string | undefined;
  let isNewAnon = false;

  const supabase = getServerSupabase();
  const user = supabase ? (await supabase.auth.getUser()).data.user : null;

  if (user) {
    let plan = "free";
    const admin = getAdminSupabase();
    if (admin) {
      const { data: prof } = await admin
        .from("profiles")
        .select("plan")
        .eq("id", user.id)
        .single();
      if (prof?.plan) plan = prof.plan;
    }
    tier = plan === "pro" ? "pro" : "free";
    quotaKey = "user:" + user.id;
  } else {
    ffid = req.cookies.get("ffid")?.value;
    isNewAnon = !ffid;
    if (!ffid) ffid = randomUUID();
    const ip = req.headers.get("x-forwarded-for")?.split(",")[0] || "local";
    quotaKey = "anon:" + createHash("sha256").update(ffid + "|" + ip).digest("hex");
  }

  const quota =
    process.env.TEST_MODE === "1"
      ? { allowed: true, used: 0, limit: null }
      : await checkAndIncrement(quotaKey, tier);
  if (!quota.allowed) {
    return NextResponse.json(
      {
        error: "quota_exceeded",
        tier,
        message:
          tier === "anon"
            ? "You've used your 3 free fixes today."
            : "You've used your 5 daily fixes. Go Pro for unlimited.",
        limit: quota.limit,
      },
      { status: 429 }
    );
  }

  const started = Date.now();
  try {
    const { result, model } = await analyze(formula, context, dialect);
    const res = NextResponse.json({
      ...result,
      _meta: {
        model,
        latency_ms: Date.now() - started,
        tier,
        used: quota.used,
        limit: quota.limit,
      },
    });
    if (isNewAnon && ffid) {
      res.cookies.set("ffid", ffid, {
        maxAge: 60 * 60 * 24 * 365,
        httpOnly: true,
        sameSite: "lax",
      });
    }
    return res;
  } catch (e) {
    console.error("analyze failed:", e);
    return NextResponse.json(
      { error: "analysis_failed", message: "Something went wrong. Please try again." },
      { status: 502 }
    );
  }
}
