import type { AnalyzeResult } from "../types";

/** Tolerant JSON extraction: strip code fences and extra text, keep the outer {...}. */
export function extractJson(text: string): AnalyzeResult {
  const cleaned = text.replace(/```json/gi, "").replace(/```/g, "");
  const start = cleaned.indexOf("{");
  const end = cleaned.lastIndexOf("}");
  if (start === -1 || end <= start) throw new Error("no JSON object in LLM response");
  return JSON.parse(cleaned.slice(start, end + 1)) as AnalyzeResult;
}
