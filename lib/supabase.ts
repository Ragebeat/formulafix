import { createServerClient } from "@supabase/ssr";
import { createClient, SupabaseClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";

/**
 * Supabase-клиент с сессией пользователя (читает auth-cookies запроса).
 * Возвращает null, если Supabase не сконфигурирован — приложение
 * продолжает работать в демо-режиме без авторизации.
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
          // вызов из Server Component без права писать cookies — игнорируем
        }
      },
    },
  });
}

/**
 * Админ-клиент (service role) — только для серверных операций.
 * НИКОГДА не использовать в клиентском коде.
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
