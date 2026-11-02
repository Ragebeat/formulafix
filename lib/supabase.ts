import { createServerClient } from "@supabase/ssr";
import { createClient, SupabaseClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";

/**
 * Supabase client bound to the user's session (reads the request's auth cookies).
 * Returns null when Supabase is not configured, so the app keeps
 * working in demo mode without sign-in.
 */
export function getServerSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return null;

  const store = cookies();
  return createServerClient(url, key, {
    cookies: {
      getAll() {
        return store.getAll();
      },
      setAll(cookiesToSet: { name: string; value: string; options?: object }[]) {
        try {
          cookiesToSet.forEach(({ name, value, options }) =>
            store.set(name, value, options as Parameters<typeof store.set>[2])
          );
        } catch {
          // Called from a Server Component, which cannot set cookies: safe to ignore
        }
      },
    },
  });
}

/**
 * Admin client (service role), for server-side operations only.
 * Never use it in client code.
 */
let adminClient: SupabaseClient | null | undefined;
export function getAdminSupabase(): SupabaseClient | null {
  if (adminClient !== undefined) return adminClient;
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  adminClient = url && key
    ? createClient(url, key, { auth: { persistSession: false } })
    : null;
  return adminClient;
}
