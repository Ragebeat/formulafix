import { afterEach, describe, expect, it, vi } from "vitest";

// Without Supabase env vars the quota falls back to the in-memory store.
delete process.env.NEXT_PUBLIC_SUPABASE_URL;
delete process.env.SUPABASE_SERVICE_ROLE_KEY;

const { checkAndIncrement } = await import("@/lib/quota");

afterEach(() => vi.useRealTimers());

describe("checkAndIncrement (in-memory fallback)", () => {
  it("allows 3 analyses per day for anonymous users, then blocks", async () => {
    const used = [];
    for (let i = 0; i < 4; i++) used.push(await checkAndIncrement("anon:ip-1", "anon"));
    expect(used.map((r) => r.allowed)).toEqual([true, true, true, false]);
    expect(used[3]).toEqual({ allowed: false, used: 3, limit: 3 });
  });

  it("gives signed-in free users a limit of 5", async () => {
    const r = await checkAndIncrement("user:free-1", "free");
    expect(r).toEqual({ allowed: true, used: 1, limit: 5 });
  });

  it("never limits pro users", async () => {
    for (let i = 0; i < 10; i++) {
      expect(await checkAndIncrement("user:pro-1", "pro")).toEqual({ allowed: true, used: 0, limit: null });
    }
  });

  it("resets the counter on a new day", async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-11-01T10:00:00Z"));
    for (let i = 0; i < 3; i++) await checkAndIncrement("anon:ip-2", "anon");
    expect((await checkAndIncrement("anon:ip-2", "anon")).allowed).toBe(false);

    vi.setSystemTime(new Date("2026-11-02T10:00:00Z"));
    expect(await checkAndIncrement("anon:ip-2", "anon")).toEqual({ allowed: true, used: 1, limit: 3 });
  });

  it("keeps separate counters per key", async () => {
    for (let i = 0; i < 3; i++) await checkAndIncrement("anon:ip-3", "anon");
    expect((await checkAndIncrement("anon:ip-4", "anon")).allowed).toBe(true);
  });
});
