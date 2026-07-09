import { getAdminSupabase } from "./supabase";

export type Tier = "anon" | "free" | "pro";

const LIMITS: Record<Exclude<Tier, "pro">, number> = {
  anon: 3, // без авторизации
  free: 5, // вошёл по magic link
};

export interface QuotaResult {
  allowed: boolean;
  used: number;
  limit: number | null; // null = безлимит (pro)
}

/**
 * Дневная квота. С Supabase — атомарный RPC increment_quota
 * (см. supabase/migration.sql). Без него — in-memory фолбэк (демо).
 */
export async function checkAndIncrement(key: string, tier: Tier): Promise<QuotaResult> {
  if (tier === "pro") return { allowed: true, used: 0, limit: null };
  const limit = LIMITS[tier];

  const admin = getAdminSupabase();
  if (admin) {
    const { data, error } = await admin.rpc("increment_quota", {
      p_key: key,
      p_limit: limit,
    });
    if (!error && typeof data === "number") {
      return data === -1
        ? { allowed: false, used: limit, limit }
        : { allowed: true, used: data, limit };
    }
    console.error("quota RPC failed, falling back to memory:", error);
  }
  return memoryQuota(key, limit);
}

// ── in-memory фолбэк ──────────────────────────────────────────
const store = new Map<string, { date: string; used: number }>();

function memoryQuota(key: string, limit: number): QuotaResult {
  const today = new Date().toISOString().slice(0, 10);
  const entry = store.get(key);
  if (!entry || entry.date !== today) {
    store.set(key, { date: today, used: 1 });
    return { allowed: true, used: 1, limit };
  }
  if (entry.used >= limit) return { allowed: false, used: entry.used, limit };
  entry.used += 1;
  return { allowed: true, used: entry.used, limit };
}
