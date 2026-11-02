import { NextRequest, NextResponse } from "next/server";
import { analyze } from "@/lib/analyze";
import { ANON_COOKIE, resolveCaller } from "@/lib/caller";
import { checkAndIncrement } from "@/lib/quota";

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

  const { tier, quotaKey, newAnonId } = await resolveCaller(req);

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
    if (newAnonId) {
      res.cookies.set(ANON_COOKIE, newAnonId, {
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
