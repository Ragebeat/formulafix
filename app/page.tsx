import Tool from "@/components/Tool";
import Link from "next/link";
import { seoPages } from "@/lib/seo-pages";

export default function Home() {
  return (
    <main className="container">
      <section className="hero">
        <h1>Fix Your Broken Excel Formula in 10 Seconds</h1>
        <p>
          Paste your formula. We&apos;ll tell you what&apos;s wrong, why, and give you one that
          works. No signup, no jargon.
        </p>
      </section>

      <Tool />

      <section className="bullets">
        <div>Understands #N/A, #REF!, #VALUE!, circular references and 50+ other failure modes</div>
        <div>Explains the fix in plain English — learn while you fix</div>
        <div>Works with Excel and Google Sheets</div>
      </section>

      <section className="faq" id="pro">
        <h2>FAQ</h2>
        <details>
          <summary>Is it free?</summary>
          <p>3 fixes a day, free forever. Pro removes the limit for $9/mo.</p>
        </details>
        <details>
          <summary>Do you store my formulas?</summary>
          <p>
            For 30 days to improve quality, never shared with anyone. Don&apos;t paste sensitive
            data.
          </p>
        </details>
        <details>
          <summary>Which Excel versions are supported?</summary>
          <p>Excel 2016+ and Microsoft 365. We flag version-specific functions like XLOOKUP.</p>
        </details>
        <details>
          <summary>What if the fix doesn&apos;t work?</summary>
          <p>
            Add context about your data (what&apos;s in the cells, what error you see) and retry —
            it makes the diagnosis far more accurate.
          </p>
        </details>
        <details>
          <summary>Does it work with Google Sheets?</summary>
          <p>Yes — flip the Excel / Google Sheets toggle above the button.</p>
        </details>
      </section>

      <section className="related">
        <h2 style={{ fontSize: 22, marginBottom: 16 }}>Common formula errors</h2>
        {seoPages.map((p) => (
          <Link key={p.slug} href={`/fix/${p.slug}`}>
            {p.h1}
          </Link>
        ))}
      </section>
    </main>
  );
}
