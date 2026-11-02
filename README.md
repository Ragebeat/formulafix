# FormulaFix

**Paste a broken Excel / Google Sheets formula → get a plain-English diagnosis and a fixed formula.**

[日本語](README.ja.md) · Live demo: https://formulafix-sage.vercel.app

Built for non-technical office workers who inherited someone else's spreadsheet: `#REF!`, `#N/A`, `#VALUE!`, circular references, a `VLOOKUP` that silently returns the wrong row. The answer explains *why* in one or two sentences without jargon, then gives the corrected formula and what changed.

This is the original product (TypeScript / Next.js). The LLM evaluation work — golden dataset, model comparison, LLM-as-a-judge — lives in a separate Python repo: [formulafix-llm-eval](https://github.com/Ragebeat/formulafix-llm-eval).

## How a request flows

```
POST /api/analyze
  → validate input (3–2000 chars, dialect excel | sheets)
  → who is it? Supabase session → plan (free / pro), otherwise anonymous cookie + hashed IP
  → daily quota: atomic Postgres RPC, in-memory fallback without Supabase
  → LLM call with a strict JSON contract (Anthropic, Hugging Face router, or any OpenAI-compatible API)
  → tolerant JSON extraction (strips fences and chatter)
  → { verdict, error_type, whats_broken, why, fixed_formula, what_changed, confidence, _meta }
```

With no API keys at all, the app runs in **demo mode**: a rule-based analyzer covers the common cases (unbalanced parentheses, misspelled functions, `VLOOKUP` column index out of range, missing exact-match argument, division by zero), so it is fully usable offline.

## Stack

| Area | What |
|---|---|
| App | Next.js 14 (App Router), React 18, TypeScript (strict) |
| Auth | Supabase magic link (PKCE), session in cookies |
| Data | Supabase Postgres: `profiles`, `quotas`, `increment_quota` RPC (`security definer`, RLS on) |
| Payments | Stripe Checkout, Customer Portal, signed webhooks → `plan = 'pro'` |
| LLM | Anthropic Messages API · OpenAI-compatible (`/chat/completions`): HF router, Groq, OpenRouter… |
| SEO | 10 programmatic pages (`/fix/[slug]`), sitemap |
| Quality | Vitest unit tests, `tsc --noEmit`, GitHub Actions CI; API-level test set (`scripts/run-testset.mjs`, 20 cases) |

## Code map

| Path | What |
|---|---|
| `app/api/analyze/route.ts` | The request flow above |
| `lib/analyze.ts` | System prompt, provider selection, LLM clients, JSON extraction, demo analyzer |
| `lib/quota.ts` | Tiers (anon 3/day, free 5/day, pro unlimited), RPC + in-memory fallback |
| `lib/supabase.ts` | Server (user session) and admin clients; `null` when not configured |
| `app/api/stripe/*` | Checkout, portal, webhook (signature verified) |
| `supabase/migration.sql` | Tables, RLS, quota RPC |
| `components/Tool.tsx` | The analyzer UI |
| `tests/` | Unit tests for the demo analyzer, JSON extraction and quotas |

## Run locally

```bash
npm install
npm run dev          # http://localhost:3000 — demo mode, no keys needed
npm test             # unit tests
npm run typecheck
```

For real analysis, copy `.env.example` to `.env.local` and set one LLM provider (e.g. `ANTHROPIC_API_KEY`). Supabase and Stripe are optional: without them the app skips sign-in and payments.

Full test set against a running server:

```bash
# .env.local: TEST_MODE=1 (bypasses the quota)
node scripts/run-testset.mjs http://localhost:3000
```

## Design decisions

- **The LLM must return a fixed JSON shape**, so the UI never parses prose. The parser still tolerates fences and extra text, because models add them anyway.
- **Never "fix" a working formula.** The prompt forbids adding optional arguments or rewriting valid formulas, and treats non-Latin sheet names (Japanese, Cyrillic) as valid.
- **Every external dependency is optional.** No Supabase → in-memory quota; no Stripe → no paid plan; no LLM key → demo analyzer. The app always starts.
- **Quota is enforced in the database** with one atomic RPC, so two parallel requests can't both pass the last free slot.

## Status

Built and deployed as a solo product (auth, quotas and the Stripe test cycle verified). The business did not continue; the project now serves as a portfolio piece, and the evaluation work moved to [formulafix-llm-eval](https://github.com/Ragebeat/formulafix-llm-eval).
