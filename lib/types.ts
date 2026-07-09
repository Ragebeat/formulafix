export type Dialect = "excel" | "sheets";

export interface AnalyzeResult {
  verdict: "broken" | "ok" | "unparseable";
  error_type:
    | "#N/A" | "#REF!" | "#VALUE!" | "#NAME?" | "#DIV/0!" | "#SPILL!"
    | "circular" | "syntax" | "logic" | null;
  whats_broken: string;
  why: string;
  fixed_formula: string | null;
  what_changed: string | null;
  if_ok_suggestion: string | null;
  confidence: number;
}
