# FormulaFix

**壊れた Excel / Google スプレッドシートの数式を貼り付けると、原因をわかりやすい言葉で説明し、修正した数式を返します。**

[English](README.md) · デモ: https://formulafix-sage.vercel.app

他人が作ったスプレッドシートを引き継いだ、ITに詳しくない事務職の方向けのツールです。`#REF!`、`#N/A`、`#VALUE!`、循環参照、間違った行を黙って返す `VLOOKUP` などを対象に、「なぜ壊れているか」を専門用語なしで1〜2文で説明し、修正後の数式と変更点を示します。

このリポジトリはプロダクト本体（TypeScript / Next.js）です。LLMの評価（ゴールデンデータセット、モデル比較、LLM-as-a-judge）は別のPythonリポジトリ [formulafix-llm-eval](https://github.com/Ragebeat/formulafix-llm-eval) にあります。

## リクエストの流れ

```
POST /api/analyze
  → 入力チェック（3〜2000文字、dialect は excel | sheets）
  → ユーザー判定：Supabaseのセッション → プラン（free / pro）、未ログインならCookie＋IPのハッシュ
  → 1日の利用回数：PostgresのRPCでアトミックに加算（Supabaseなしではメモリで代替）
  → JSON形式を固定したLLM呼び出し（Anthropic、Hugging Face、OpenAI互換API）
  → JSONの抽出（コードフェンスや余計な文章を除去）
  → { verdict, error_type, whats_broken, why, fixed_formula, what_changed, confidence, _meta }
```

APIキーがなくても **デモモード** で動きます。ルールベースの解析で、よくあるエラー（括弧の不一致、関数名のスペルミス、`VLOOKUP` の列番号の範囲外、完全一致指定の漏れ、0除算）に対応しています。

## 技術スタック

| 分野 | 内容 |
|---|---|
| アプリ | Next.js 14（App Router）、React 18、TypeScript（strict） |
| 認証 | Supabase マジックリンク（PKCE）、セッションはCookie |
| データ | Supabase Postgres：`profiles`、`quotas`、`increment_quota` RPC（`security definer`、RLS有効） |
| 決済 | Stripe Checkout、カスタマーポータル、署名検証付きWebhook → `plan = 'pro'` |
| LLM | Anthropic Messages API／OpenAI互換API（HF router、Groq、OpenRouterなど） |
| SEO | プログラマティックSEOページ10件（`/fix/[slug]`）、サイトマップ |
| 品質 | Vitestの単体テスト、`tsc --noEmit`、GitHub Actions CI、APIレベルのテストセット（20件） |

## ローカルでの実行

```bash
npm install
npm run dev          # http://localhost:3000（デモモード、キー不要）
npm test             # 単体テスト
npm run typecheck
```

実際の解析には `.env.example` を `.env.local` にコピーし、LLMプロバイダーを1つ設定してください（例：`ANTHROPIC_API_KEY`）。Supabase と Stripe は任意です。

## 設計で決めたこと

- **LLMの出力はJSONの形を固定**し、UIが文章を解析しなくて済むようにしました。それでもモデルはコードフェンスや説明文を付けることがあるため、抽出側で吸収しています。
- **正しい数式は「修正」しない。** 任意の引数の追加や書き換えを禁止し、日本語やキリル文字のシート名も正しいものとして扱います。
- **外部サービスはすべて任意。** Supabaseなし → メモリで回数管理、Stripeなし → 有料プランなし、LLMキーなし → デモ解析。どの構成でも起動します。
- **利用回数はDBで1回のアトミックなRPCで管理**し、同時リクエストで上限を超えないようにしています。

## ステータス

個人でプロダクトとして開発・デプロイしました（認証、利用回数制限、Stripeのテスト決済まで確認済み）。事業としては継続せず、現在はポートフォリオとして公開しています。評価まわりは [formulafix-llm-eval](https://github.com/Ragebeat/formulafix-llm-eval) に移しました。
