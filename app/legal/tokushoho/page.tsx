export const metadata = {
  title: "特定商取引法に基づく表記 — FormulaFix",
  robots: { index: false },
};

/**
 * Required by Stripe Japan (特定商取引法, Specified Commercial Transactions Act).
 * Before switching Stripe to live mode, fill in the real name for 販売業者/運営責任者.
 * A sole proprietor (個人事業主) may disclose address and phone on request (改正特商法).
 */
const rows: [string, string][] = [
  ["販売業者", "（氏名を記載）"],
  ["運営責任者", "（氏名を記載）"],
  [
    "所在地",
    "請求があったら遅滞なく開示します（メールにてご請求ください）",
  ],
  [
    "電話番号",
    "請求があったら遅滞なく開示します（メールにてご請求ください）",
  ],
  ["メールアドレス", "support@formulafix.app"],
  ["販売URL", "https://formulafix.app"],
  ["販売価格", "Proプラン：月額9米ドル（表示価格は税込）／無料プランあり"],
  [
    "商品代金以外の必要料金",
    "インターネット接続料金・通信料金はお客様のご負担となります",
  ],
  ["支払方法", "クレジットカード決済（Stripe）"],
  ["支払時期", "初回：お申込み時／以降：毎月の更新日に自動決済"],
  [
    "サービス提供時期",
    "決済完了後、直ちにご利用いただけます（デジタルサービス）",
  ],
  [
    "解約について",
    "アカウント画面の「Manage plan」からいつでも解約できます。解約後も当該請求期間の終了日まではProプランをご利用いただけます。",
  ],
  [
    "返品・キャンセル",
    "デジタルサービスの性質上、決済完了後の返金は原則お受けしておりません。サービスに重大な不具合がある場合は、サポートまでご連絡ください。",
  ],
  [
    "動作環境",
    "モダンブラウザ（Chrome、Safari、Edge、Firefox の最新版）",
  ],
];

export default function Tokushoho() {
  return (
    <main className="container prose" style={{ paddingBottom: 40 }}>
      <h1>特定商取引法に基づく表記</h1>
      <p style={{ fontSize: 13 }}>
        Notation based on the Act on Specified Commercial Transactions (Japan)
      </p>
      <table style={{ width: "100%", borderCollapse: "collapse", marginTop: 16 }}>
        <tbody>
          {rows.map(([k, v]) => (
            <tr key={k} style={{ borderBottom: "1px solid var(--border)" }}>
              <th
                style={{
                  textAlign: "left", padding: "12px 16px 12px 0",
                  verticalAlign: "top", whiteSpace: "nowrap",
                  color: "var(--text)", fontSize: 14, width: 180,
                }}
              >
                {k}
              </th>
              <td style={{ padding: "12px 0", fontSize: 14 }}>{v}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </main>
  );
}
