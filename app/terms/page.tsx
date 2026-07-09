export const metadata = { title: "Terms of Service — FormulaFix" };

export default function Terms() {
  return (
    <main className="container prose" style={{ paddingBottom: 40 }}>
      <h1>Terms of Service</h1>
      <p>Last updated: 2026</p>
      <h2>The service</h2>
      <p>
        FormulaFix analyzes spreadsheet formulas and suggests fixes. Suggestions are generated
        automatically and provided &quot;as is&quot; — always verify results on your own data
        before relying on them.
      </p>
      <h2>Fair use</h2>
      <p>
        Free tier: 3 analyses per day. Automated scraping or bulk API access without a plan is not
        permitted.
      </p>
      <h2>Liability</h2>
      <p>
        We are not liable for decisions made based on generated suggestions, including data loss or
        calculation errors in your spreadsheets.
      </p>
      <h2>Contact</h2>
      <p>support@formulafix.example.com</p>
    </main>
  );
}
