import type { AnalyzeResult } from "./types";

/**
 * DEMO MODE: rule-based analyzer used when no LLM key is set.
 * Covers the most common failure modes so the app is fully demoable offline.
 */
export function demoAnalyze(raw: string): AnalyzeResult {
  const formula = raw.trim().startsWith("=") ? raw.trim() : "=" + raw.trim();
  const body = formula.slice(1);

  if (!/[A-Za-zА-Яа-я]/.test(body) && !/[0-9]/.test(body)) {
    return un("This doesn't look like a formula.", "Paste a formula starting with =, e.g. =VLOOKUP(A2,B:C,2,FALSE).");
  }

  // Unbalanced parentheses
  const open = (body.match(/\(/g) || []).length;
  const close = (body.match(/\)/g) || []).length;
  if (open !== close) {
    const fixed = open > close ? formula + ")".repeat(open - close) : null;
    return {
      verdict: "broken",
      error_type: "syntax",
      whats_broken: `The formula has ${open} opening parenthes${open === 1 ? "is" : "es"} but ${close} closing.`,
      why: "Excel can't finish reading the formula because a parenthesis is never closed. Every ( needs a matching ).",
      fixed_formula: fixed,
      what_changed: fixed ? "Added the missing closing parenthesis." : "Remove the extra closing parenthesis.",
      if_ok_suggestion: null,
      confidence: 0.95,
    };
  }

  // Misspelled function names (common typos)
  const typos: Record<string, string> = {
    VLOKUP: "VLOOKUP", VLOOKUPP: "VLOOKUP", SUMM: "SUM",
    COUNTIIF: "COUNTIF", IFERR: "IFERROR", XLOKUP: "XLOOKUP",
  };
  for (const [typo, correct] of Object.entries(typos)) {
    if (new RegExp(`\\b${typo}\\s*\\(`, "i").test(body)) {
      return {
        verdict: "broken",
        error_type: "#NAME?",
        whats_broken: `"${typo}" is not a real function — you meant ${correct}.`,
        why: `Excel shows #NAME? when it doesn't recognize a function name. "${typo}" is a typo of ${correct}.`,
        fixed_formula: formula.replace(new RegExp(typo, "i"), correct),
        what_changed: `Corrected ${typo} to ${correct}.`,
        if_ok_suggestion: null,
        confidence: 0.98,
      };
    }
  }

  // VLOOKUP checks
  const vl = body.match(/VLOOKUP\s*\(([^()]*(?:\([^()]*\)[^()]*)*)\)/i);
  if (vl) {
    const args = splitArgs(vl[1]);
    const rangeArg = args[1] || "";
    const colIndex = parseInt((args[2] || "").trim(), 10);
    const cols = rangeWidth(rangeArg);
    if (cols !== null && !isNaN(colIndex) && colIndex > cols) {
      return {
        verdict: "broken",
        error_type: "#REF!",
        whats_broken: `Column index ${colIndex} is bigger than your lookup range (${cols} column${cols === 1 ? "" : "s"} wide).`,
        why: `VLOOKUP counts columns inside the range you gave it. The range ${rangeArg.trim()} only has ${cols} columns, so asking for column ${colIndex} points outside it — that's what #REF! means.`,
        fixed_formula: formula.replace(vl[0], vl[0].replace(args[2], String(cols))),
        what_changed: `Changed the column index from ${colIndex} to ${cols} (or widen the range instead).`,
        if_ok_suggestion: null,
        confidence: 0.9,
      };
    }
    if (args.length === 3) {
      return {
        verdict: "broken",
        error_type: "logic",
        whats_broken: "The 4th argument (exact match) is missing — VLOOKUP defaults to approximate match.",
        why: "Without FALSE as the 4th argument, VLOOKUP assumes your data is sorted and may return a wrong 'close enough' value silently. This is the #1 source of wrong VLOOKUP results.",
        fixed_formula: formula.replace(vl[0], vl[0].replace(/\)\s*$/, ",FALSE)")),
        what_changed: "Added FALSE to force an exact match.",
        if_ok_suggestion: null,
        confidence: 0.85,
      };
    }
  }

  // Division by zero pattern
  if (/\/\s*0(?![.\d])/.test(body)) {
    return {
      verdict: "broken",
      error_type: "#DIV/0!",
      whats_broken: "The formula divides by zero.",
      why: "Dividing by 0 (or by an empty cell) always produces #DIV/0!. Wrap the division in IFERROR to show a fallback value instead.",
      fixed_formula: `=IFERROR(${body},0)`,
      what_changed: "Wrapped the formula in IFERROR with 0 as the fallback.",
      if_ok_suggestion: null,
      confidence: 0.9,
    };
  }
  if (/^\s*[A-Z]+\d+\s*\/\s*[A-Z]+\d+\s*$/i.test(body)) {
    return {
      verdict: "ok",
      error_type: null,
      whats_broken: "The formula itself is valid.",
      why: "If you see #DIV/0!, the divisor cell is 0 or empty. The formula syntax is fine — the issue is in the data.",
      fixed_formula: null,
      what_changed: null,
      if_ok_suggestion: `Guard against empty cells: =IFERROR(${body},0)`,
      confidence: 0.8,
    };
  }

  return {
    verdict: "ok",
    error_type: null,
    whats_broken: "No obvious problem found in the formula itself.",
    why: "The syntax looks valid. If you're seeing an error, it most likely comes from the data (text stored as numbers, stray spaces in lookup values, or references to deleted cells). Add details about the error you see and what's in the cells, then try again.",
    fixed_formula: null,
    what_changed: null,
    if_ok_suggestion: "Demo mode note: connect an LLM API key (Anthropic or Hugging Face) for full analysis of any formula.",
    confidence: 0.5,
  };
}

function un(broken: string, why: string): AnalyzeResult {
  return {
    verdict: "unparseable", error_type: null, whats_broken: broken, why,
    fixed_formula: null, what_changed: null, if_ok_suggestion: null, confidence: 0.9,
  };
}

/** Split top-level args, supporting both , and ; separators */
function splitArgs(s: string): string[] {
  const args: string[] = [];
  let depth = 0, cur = "";
  for (const ch of s) {
    if (ch === "(") depth++;
    if (ch === ")") depth--;
    if ((ch === "," || ch === ";") && depth === 0) { args.push(cur); cur = ""; }
    else cur += ch;
  }
  if (cur.trim()) args.push(cur);
  return args;
}

/** Width in columns of a range like B:C, A1:D20, Sheet2!A:B */
function rangeWidth(range: string): number | null {
  const m = range.trim().match(/(?:.*!)?\$?([A-Z]{1,3})\$?\d*\s*:\s*\$?([A-Z]{1,3})\$?\d*/i);
  if (!m) return null;
  return colNum(m[2].toUpperCase()) - colNum(m[1].toUpperCase()) + 1;
}
function colNum(col: string): number {
  return col.split("").reduce((acc, c) => acc * 26 + (c.charCodeAt(0) - 64), 0);
}
