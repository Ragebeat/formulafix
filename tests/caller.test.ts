import { NextRequest } from "next/server";
import { describe, expect, it } from "vitest";

// Without Supabase env vars every caller is anonymous.
delete process.env.NEXT_PUBLIC_SUPABASE_URL;
delete process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const { ANON_COOKIE, anonQuotaKey, resolveCaller } = await import("@/lib/caller");

function request(headers: Record<string, string> = {}) {
  return new NextRequest("http://localhost/api/analyze", { method: "POST", headers });
}

describe("resolveCaller (anonymous visitors)", () => {
  it("issues a new id when there is no cookie, keyed by the first forwarded IP", async () => {
    const c = await resolveCaller(request({ "x-forwarded-for": "203.0.113.7, 10.0.0.1" }));
    expect(c.tier).toBe("anon");
    expect(c.newAnonId).toBeTruthy();
    expect(c.quotaKey).toBe(anonQuotaKey(c.newAnonId!, "203.0.113.7"));
  });

  it("reuses the cookie id and does not issue a new one", async () => {
    const c = await resolveCaller(request({ cookie: `${ANON_COOKIE}=abc`, "x-forwarded-for": "203.0.113.7" }));
    expect(c.newAnonId).toBeUndefined();
    expect(c.quotaKey).toBe(anonQuotaKey("abc", "203.0.113.7"));
  });

  it("gives a different quota key on a different IP with the same cookie", async () => {
    const a = await resolveCaller(request({ cookie: `${ANON_COOKIE}=abc`, "x-forwarded-for": "203.0.113.7" }));
    const b = await resolveCaller(request({ cookie: `${ANON_COOKIE}=abc`, "x-forwarded-for": "198.51.100.2" }));
    expect(a.quotaKey).not.toBe(b.quotaKey);
  });

  it("never stores the raw IP or cookie in the key", async () => {
    const c = await resolveCaller(request({ cookie: `${ANON_COOKIE}=abc`, "x-forwarded-for": "203.0.113.7" }));
    expect(c.quotaKey).not.toContain("203.0.113.7");
    expect(c.quotaKey).not.toContain("abc");
  });
});
