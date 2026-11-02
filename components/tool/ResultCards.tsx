"use client";

import { useState } from "react";
import type { ApiResult } from "./useAnalyze";

export default function ResultCards({ result }: { result: ApiResult }) {
  const [copied, setCopied] = useState(false);

  async function copyFixed() {
    if (!result.fixed_formula) return;
    await navigator.clipboard.writeText(result.fixed_formula);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="cards">
      {result.verdict === "broken" && (
        <>
          <div className="card broken">
            <h3>
              What&apos;s broken{" "}
              {result.error_type && <span className="badge">{result.error_type}</span>}
            </h3>
            <p>{result.whats_broken}</p>
          </div>
          <div className="card why">
            <h3>Why it happens</h3>
            <p>{result.why}</p>
          </div>
          {result.fixed_formula && (
            <div className="card fixed">
              <h3>Fixed formula</h3>
              <div className="codeblock">
                <span>{result.fixed_formula}</span>
                <button className="copy-btn" onClick={copyFixed}>
                  {copied ? "Copied" : "Copy"}
                </button>
              </div>
              {result.what_changed && <p className="what-changed">{result.what_changed}</p>}
            </div>
          )}
        </>
      )}
      {result.verdict === "ok" && (
        <div className="card fixed">
          <h3>Your formula looks fine</h3>
          <p>{result.why}</p>
          {result.if_ok_suggestion && (
            <p className="what-changed">Suggestion: {result.if_ok_suggestion}</p>
          )}
        </div>
      )}
      {result.verdict === "unparseable" && (
        <div className="card why">
          <h3>This doesn&apos;t look like a formula</h3>
          <p>{result.whats_broken}</p>
          <p className="what-changed">{result.why}</p>
        </div>
      )}
      {result.confidence < 0.5 && (
        <div className="low-confidence">
          Not sure? Add details about your data above and try again: context makes the diagnosis much more accurate.
        </div>
      )}
    </div>
  );
}
