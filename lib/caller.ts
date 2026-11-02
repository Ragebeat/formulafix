import { createHash, randomUUID } from "crypto";
import type { NextRequest } from "next/server";
import type { Tier } from "./quota";
import { getAdminSupabase, getServerSupabase } from "./supabase";

export const ANON_COOKIE = "ffid";

export interface Caller {
  tier: Tier;
  /** Key for the daily quota: "user:<id>" or "anon:<sha256>". */
  quotaKey: string;
  /** Set when an anonymous visitor has no cookie yet: the route must set it. */
  newAnonId?: string;
}

/** Quota key for an anonymous visitor: the cookie id plus the client IP, hashed,
 *  so neither is stored and clearing the cookie alone does not reset the quota. */
export function anonQuotaKey(anonId: string, ip: string): string {
  return "anon:" + createHash("sha256").update(anonId + "|" + ip).digest("hex");
}

export function clientIp(req: NextRequest): string {
  return req.headers.get("x-forwarded-for")?.split(",")[0].trim() || "local";
}

/** Who is calling: a signed-in user (plan read from profiles) or an anonymous visitor. */
export async function resolveCaller(req: NextRequest): Promise<Caller> {
  const supabase = getServerSupabase();
  const user = supabase ? (await supabase.auth.getUser()).data.user : null;

  if (user) {
    let plan = "free";
    const admin = getAdminSupabase();
    if (admin) {
      const { data: profile } = await admin.from("profiles").select("plan").eq("id", user.id).single();
      if (profile?.plan) plan = profile.plan;
    }
    return { tier: plan === "pro" ? "pro" : "free", quotaKey: "user:" + user.id };
  }

  const existing = req.cookies.get(ANON_COOKIE)?.value;
  const anonId = existing ?? randomUUID();
  return {
    tier: "anon",
    quotaKey: anonQuotaKey(anonId, clientIp(req)),
    newAnonId: existing ? undefined : anonId,
  };
}
