import { AnalyzeResult, Dialect } from "./types";

const SYSTEM_PROMPT = (dialect: Dialect) => `You are an expert in ${
  dialect === "excel" ? "Microsoft Excel" : "Google Sheets"
} formulas with 20 years of experience explaining spreadsheets to non-technical office workers.

Analyze the user's formula. Return ONLY valid JSON with this exact shape:
{
 "verdict": "broken" | "ok" | "unparseable",
 "error_type": "#N/A" | "#REF!" | "#VALUE!" | "#NAME?" | "#DIV/0!" | "#SPILL!" | "circular" | "syntax" | "logic" | null,
 "whats_broken": "one sentence, plain English",
 "why": "2-3 sentences a non-technical person understands; no jargon without explaining it",
 "fixed_formula": "the corrected formula, or null if verdict=ok",
 "what_changed": "one sentence, or null",
 "if_ok_suggestion": "improvement suggestion or null",
 "confidence": 0.0-1.0
}
Rules:
- If the error depends on the data (e.g. lookup value truly missing), say so in "why" and give the most likely fix.
- Prefer modern functions where the dialect supports them (XLOOKUP over VLOOKUP in Excel; note version caveats in what_changed).
- Support both "," and ";" as argument separators (European locales use ";").
- Never invent cell contents. If context is insufficient, give the single most probable cause and mention one alternative.
- If a formula uses a valid function with correct required arguments,
  the verdict is "ok". Never add optional arguments or rewrite a working
  formula. When unsure whether a function exists in this dialect, assume
  it does and say so in "why" - do not "fix" what may not be broken.
- Sheet names and text in any language/script (Cyrillic, Japanese, etc.)
  are perfectly valid - never treat non-Latin characters as an error.
- "unparseable" is ONLY for input that is not a formula at all (plain text,
  a question, random characters). If you can identify the intended formula and
  suggest a fix - even for syntax errors - the verdict is "broken", never "unparseable".
- Return ONLY the JSON object, no markdown fences, no commentary.`;

type Provider = "anthropic" | "hf" | "compat" | "demo";

/**
 * Provider selection:
 *  LLM_PROVIDER=anthropic | hf | compat | demo forces a provider;
 *  otherwise: ANTHROPIC_API_KEY → anthropic, LLM_BASE_URL + LLM_API_KEY → compat, HF_TOKEN → hf, else demo.
 */
function pickProvider(): Provider {
  const forced = process.env.LLM_PROVIDER;
  if (forced === "anthropic" || forced === "hf" || forced === "compat" || forced === "demo") {
    return forced;
  }
  if (process.env.ANTHROPIC_API_KEY) return "anthropic";
  if (process.env.LLM_BASE_URL && process.env.LLM_API_KEY) return "compat";
  if (process.env.HF_TOKEN) return "hf";
  return "demo";
}

export async function analyze(
  formula: string,
  context: string,
  dialect: Dialect
): Promise<{ result: AnalyzeResult; model: string }> {
  const provider = pickProvider();
  if (provider === "anthropic" && process.env.ANTHROPIC_API_KEY) {
    return callAnthropic(formula, context, dialect);
  }
  if (provider === "compat" && process.env.LLM_BASE_URL && process.env.LLM_API_KEY) {
    return callOpenAICompat(
      process.env.LLM_BASE_URL,
      process.env.LLM_API_KEY,
      process.env.LLM_COMPAT_MODEL || "llama-3.3-70b-versatile",
      formula, context, dialect
    );
  }
  if (provider === "hf" && process.env.HF_TOKEN) {
    return callOpenAICompat(
      "https://router.huggingface.co/v1",
      process.env.HF_TOKEN,
      process.env.HF_MODEL || "Qwen/Qwen2.5-Coder-32B-Instruct",
      formula, context, dialect, "hf:"
    );
  }
  return { result: mockAnalyze(formula), model: "demo" };
}

// Anthropic Messages API
async function callAnthropic(formula: string, context: string, dialect: Dialect) {
  const model = process.env.LLM_MODEL || "claude-haiku-4-5-20251001";
  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-api-key": process.env.ANTHROPIC_API_KEY as string,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model,
      max_tokens: 1024,
      system: SYSTEM_PROMPT(dialect),
      messages: [
        { role: "user", content: userMessage(formula, context) },
      ],
    }),
    signal: AbortSignal.timeout(30000),
  });
  if (!res.ok) throw new Error(`Anthropic API error: ${res.status}`);
  const data = await res.json();
  const text: string = data.content?.[0]?.text ?? "";
  return { result: extractJson(text), model };
}

// Any OpenAI-compatible API
// (Hugging Face router, Groq, Gemini's OpenAI endpoint, OpenRouter, ...)
async function callOpenAICompat(
  baseUrl: string,
  apiKey: string,
  model: string,
  formula: string,
  context: string,
  dialect: Dialect,
  tag: string = ""
) {
  const res = await fetch(`${baseUrl.replace(/\/$/, "")}/chat/completions`, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model,
      max_tokens: 1024,
      temperature: 0.2,
      messages: [
        { role: "system", content: SYSTEM_PROMPT(dialect) },
        { role: "user", content: userMessage(formula, context) },
      ],
    }),
    signal: AbortSignal.timeout(30000),
  });
  if (!res.ok) {
    const errBody = await res.text().catch(() => "");
    throw new Error(`LLM API error (${baseUrl}): ${res.status} ${errBody.slice(0, 200)}`);
  }
  const data = await res.json();
  const text: string = data.choices?.[0]?.message?.content ?? "";
  return { result: extractJson(text), model: tag + model };
}

function userMessage(formula: string, context: string) {
  return `User formula: ${formula}\nUser context: ${context || "none"}`;
}

/** Tolerant JSON extraction: strip code fences and extra text, keep the outer {...}. */
export function extractJson(text: string): AnalyzeResult {
  const cleaned = text.replace(/```json/gi, "").replace(/```/g, "");
  const start = cleaned.indexOf("{");
  const end = cleaned.lastIndexOf("}");
  if (start === -1 || end <= start) throw new Error("no JSON object in LLM response");
  return JSON.parse(cleaned.slice(start, end + 1)) as AnalyzeResult;
}

/**
 * DEMO MODE: rule-based analyzer used when no LLM key is set.
 * Covers the most common failure modes so the app is fully demoable offline.
 */
export function mockAnalyze(raw: string): AnalyzeResult {
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
