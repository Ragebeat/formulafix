"use client";

import { useState } from "react";
import type { AnalyzeResult, Dialect } from "@/lib/types";

interface Props {
  initialFormula?: string;
  initialContext?: string;
}

type ApiResult = AnalyzeResult & {
  _meta?: { model: string; tier: string; used: number; limit: number | null };
};

export default function Tool({ initialFormula = "", initialContext = "" }: Props) {
  const [formula, setFormula] = useState(initialFormula);
  const [context, setContext] = useState(initialContext);
  const [dialect, setDialect] = useState<Dialect>("excel");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ApiResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showLimit, setShowLimit] = useState(false);
  const [limitTier, setLimitTier] = useState<"anon" | "free">("anon");
  const [email, setEmail] = useState("");
  const [linkSent, setLinkSent] = useState<null | "demo" | "real">(null);
  const [copied, setCopied] = useState(false);

  async function submit() {
    if (formula.trim().length < 3) {
      setError("Paste a formula first — e.g. =VLOOKUP(A2,B:C,2,FALSE)");
      return;
    }
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const res = await fetch("/api/analyze", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ formula, context, dialect }),
      });
      if (res.status === 429) {
        const data = await res.json().catch(() => ({}));
        setLimitTier(data.tier === "free" ? "free" : "anon");
        setShowLimit(true);
        return;
      }
      const data = await res.json();
      if (!res.ok) {
        setError(data.message || "Something went wrong. Please try again.");
        return;
      }
      setResult(data as ApiResult);
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  async function copyFixed() {
    if (!result?.fixed_formula) return;
    await navigator.clipboard.writeText(result.fixed_formula);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  async function sendMagicLink() {
    const res = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ email }),
    });
    if (res.ok) {
      const data = await res.json();
      setLinkSent(data.demo ? "demo" : "real");
    }
  }

  function fillExample(f: string, c: string) {
    setFormula(f);
    setContext(c);
    setResult(null);
    setError(null);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  return (
    <>
      <div className="tool">
        <label htmlFor="formula">Your formula</label>
        <textarea
          id="formula"
          className="formula"
          value={formula}
          onChange={(e) => setFormula(e.target.value)}
          placeholder="=VLOOKUP(A2,Sheet2!A:B,2)"
        />
        <label htmlFor="context">What&apos;s wrong? (optional)</label>
        <textarea
          id="context"
          value={context}
          onChange={(e) => setContext(e.target.value)}
          placeholder="Optional: what error do you see? What's in the cells?"
        />
        <div className="row">
          <div className="dialect">
            <button className={dialect === "excel" ? "active" : ""} onClick={() => setDialect("excel")}>
              Excel
            </button>
            <button className={dialect === "sheets" ? "active" : ""} onClick={() => setDialect("sheets")}>
              Google Sheets
            </button>
          </div>
          <button className="btn-primary" onClick={submit} disabled={loading}>
            {loading ? "Analyzing…" : "Fix My Formula"}
          </button>
        </div>

        {error && <p className="error-msg">{error}</p>}

        {result && (
          <div className="cards">
            {result.verdict === "broken" && (
              <>
                <div className="card broken">
                  <h3>
                    ❌ What&apos;s broken{" "}
                    {result.error_type && <span className="badge">{result.error_type}</span>}
                  </h3>
                  <p>{result.whats_broken}</p>
                </div>
                <div className="card why">
                  <h3>💡 Why it happens</h3>
                  <p>{result.why}</p>
                </div>
                {result.fixed_formula && (
                  <div className="card fixed">
                    <h3>✅ Fixed formula</h3>
                    <div className="codeblock">
                      <span>{result.fixed_formula}</span>
                      <button className="copy-btn" onClick={copyFixed}>
                        {copied ? "Copied!" : "Copy"}
                      </button>
                    </div>
                    {result.what_changed && <p className="what-changed">{result.what_changed}</p>}
                  </div>
                )}
              </>
            )}
            {result.verdict === "ok" && (
              <div className="card fixed">
                <h3>✅ Your formula looks fine</h3>
                <p>{result.why}</p>
                {result.if_ok_suggestion && (
                  <p className="what-changed" style={{ marginTop: 8 }}>
                    Suggestion: {result.if_ok_suggestion}
                  </p>
                )}
              </div>
            )}
            {result.verdict === "unparseable" && (
              <div className="card why">
                <h3>🤔 Hmm</h3>
                <p>{result.whats_broken}</p>
                <p className="what-changed" style={{ marginTop: 8 }}>{result.why}</p>
              </div>
            )}
            {result.confidence < 0.5 && (
              <div className="low-confidence">
                Not sure? Add details about your data above and try again — context makes the diagnosis much more accurate.
              </div>
            )}
          </div>
        )}
      </div>

      <section className="examples">
        <h2>Try an example</h2>
        <div className="example-chips">
          <button
            className="chip"
            onClick={() => fillExample("=VLOOKUP(A2,B:C,3,FALSE)", "Getting #REF! error")}
          >
            =VLOOKUP(A2,B:C,3,FALSE) → #REF!
          </button>
          <button
            className="chip"
            onClick={() => fillExample("=SUM(A1:A10", "")}
          >
            =SUM(A1:A10 → missing paren
          </button>
          <button
            className="chip"
            onClick={() => fillExample("=VLOKUP(A2,B:C,2,FALSE)", "Shows #NAME?")}
          >
            =VLOKUP(…) → #NAME?
          </button>
        </div>
      </section>

      {showLimit && (
        <div className="modal-overlay" onClick={() => setShowLimit(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            {linkSent === "real" ? (
              <p className="success">✓ Check your email — we sent you a sign-in link.</p>
            ) : linkSent === "demo" ? (
              <p className="success">✓ You&apos;re on the list! (Auth is off in demo mode.)</p>
            ) : limitTier === "free" ? (
              <>
                <h3>You&apos;ve used your 5 daily fixes</h3>
                <p>Go unlimited with Pro — $9/mo, cancel anytime.</p>
                <button className="btn-primary" onClick={() => (location.href = "/#pro")}>
                  Go Pro — $9/mo
                </button>
              </>
            ) : (
              <>
                <h3>You&apos;ve used your 3 free fixes today</h3>
                <p>
                  Get 5 fixes per day free — enter your email and we&apos;ll send you a sign-in
                  link. No password needed.
                </p>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@work.com"
                />
                <button className="btn-primary" onClick={sendMagicLink}>
                  Send me a sign-in link
                </button>
              </>
            )}
            <button className="close" onClick={() => setShowLimit(false)}>
              Maybe later
            </button>
          </div>
        </div>
      )}
    </>
  );
}
