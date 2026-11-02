import { useState } from "react";
import type { AnalyzeResult, Dialect } from "@/lib/types";

export type ApiResult = AnalyzeResult & {
  _meta?: { model: string; tier: string; used: number; limit: number | null };
};

export type LimitTier = "anon" | "free";

/** Form state and the /api/analyze call. A 429 is not an error: it opens the limit panel. */
export function useAnalyze(initialFormula = "", initialContext = "") {
  const [formula, setFormula] = useState(initialFormula);
  const [context, setContext] = useState(initialContext);
  const [dialect, setDialect] = useState<Dialect>("excel");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ApiResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [limitTier, setLimitTier] = useState<LimitTier | null>(null);

  async function submit() {
    if (formula.trim().length < 3) {
      setError("Paste a formula first, e.g. =VLOOKUP(A2,B:C,2,FALSE)");
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
      const data = await res.json().catch(() => ({}));
      if (res.status === 429) {
        setLimitTier(data.tier === "free" ? "free" : "anon");
      } else if (!res.ok) {
        setError(data.message || "Something went wrong. Please try again.");
      } else {
        setResult(data as ApiResult);
      }
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  function loadExample(f: string, c: string) {
    setFormula(f);
    setContext(c);
    setResult(null);
    setError(null);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  return {
    formula, setFormula, context, setContext, dialect, setDialect,
    loading, result, error, submit, loadExample,
    limitTier, closeLimit: () => setLimitTier(null),
  };
}
