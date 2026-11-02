"use client";

import ExampleChips from "./tool/ExampleChips";
import LimitPanel from "./tool/LimitPanel";
import ResultCards from "./tool/ResultCards";
import { useAnalyze } from "./tool/useAnalyze";

interface Props {
  initialFormula?: string;
  initialContext?: string;
}

export default function Tool({ initialFormula = "", initialContext = "" }: Props) {
  const t = useAnalyze(initialFormula, initialContext);

  return (
    <>
      <div className="tool">
        <label htmlFor="formula">Your formula</label>
        <textarea
          id="formula"
          className="formula"
          value={t.formula}
          onChange={(e) => t.setFormula(e.target.value)}
          placeholder="=VLOOKUP(A2,Sheet2!A:B,2)"
        />
        <label htmlFor="context">What&apos;s wrong? (optional)</label>
        <textarea
          id="context"
          value={t.context}
          onChange={(e) => t.setContext(e.target.value)}
          placeholder="Optional: what error do you see? What's in the cells?"
        />
        <div className="row">
          <div className="dialect" role="group" aria-label="Spreadsheet app">
            <button className={t.dialect === "excel" ? "active" : ""} aria-pressed={t.dialect === "excel"} onClick={() => t.setDialect("excel")}>
              Excel
            </button>
            <button className={t.dialect === "sheets" ? "active" : ""} aria-pressed={t.dialect === "sheets"} onClick={() => t.setDialect("sheets")}>
              Google Sheets
            </button>
          </div>
          <button className="btn-primary" onClick={t.submit} disabled={t.loading}>
            {t.loading ? "Analyzing…" : "Fix My Formula"}
          </button>
        </div>

        {t.error && <p className="error-msg">{t.error}</p>}
        {t.result && <ResultCards result={t.result} />}
      </div>

      <ExampleChips onPick={t.loadExample} />

      {t.limitTier && <LimitPanel tier={t.limitTier} onClose={t.closeLimit} />}
    </>
  );
}
