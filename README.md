# FormulaFix

Веб-инструмент: вставь ломаную формулу Excel/Google Sheets → диагноз, объяснение простым языком, исправленная версия. Собран по `ideas/01-formula-error-explainer/TZ-BUILD.md`.

## Запуск

```bash
npm install
npm run dev        # http://localhost:3000
```

Без ключей работает в **демо-режиме**: встроенный rule-based разборщик покрывает частые ошибки (скобки, опечатки функций, VLOOKUP #REF!/exact match, #DIV/0!). Для полного анализа любой формулы:

```bash
# .env.local
ANTHROPIC_API_KEY=sk-ant-...
LLM_MODEL=claude-haiku-4-5-20251001   # опционально
NEXT_PUBLIC_BASE_URL=https://твой-домен.com
```

## Что внутри

| Путь | Что |
|------|-----|
| `app/page.tsx` | Главная = инструмент (hero, разбор, примеры, FAQ) |
| `app/fix/[slug]/page.tsx` | 10 программатик-SEO-страниц (volna 1 из ТЗ) |
| `lib/seo-pages.ts` | Контент SEO-страниц — данные, не код; добавляй страницы здесь |
| `app/api/analyze/route.ts` | Разбор: сессия → тариф → квота → LLM (или демо) → JSON |
| `lib/analyze.ts` | Промпт из ТЗ + демо-анализатор |
| `lib/supabase.ts` | Серверный и админ-клиенты Supabase (null в демо-режиме) |
| `lib/quota.ts` | Квоты: anon 3/день, free 5/день, pro безлимит; Supabase RPC или in-memory |
| `app/api/auth/*` | login (magic link), logout, me |
| `app/auth/callback/route.ts` | Приём magic link (PKCE + token_hash) |
| `supabase/migration.sql` | profiles + quotas + RPC — выполнить в SQL Editor |
| `app/sitemap.ts` | sitemap для SEO |

## Авторизация (Supabase, magic link)

Поток: аноним (3/день, cookie) → лимит → вводит email → письмо со ссылкой →
клик → `/auth/callback` → сессия в cookies → тариф free (5/день) → Pro (безлимит,
после Stripe). Пароли не используются.

Подключение: создать проект supabase.com → выполнить `supabase/migration.sql` →
добавить `/auth/callback` в Redirect URLs → 3 ключа в `.env.local` (см. `.env.example`).
Без ключей всё работает в демо-режиме: авторизации нет, email падает в `data/emails.jsonl`.

## Что осталось заглушено (доделать перед продом)

1. **Stripe нет** → Checkout + webhook (`plan='pro'` в profiles) по разделу 5.4 ТЗ.
2. **Аналитик