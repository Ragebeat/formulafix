import { describe, expect, it } from "vitest";
import { demoAnalyze } from "@/lib/demo-analyzer";

describe("demoAnalyze (offline demo analyzer)", () => {
  it("closes an unbalanced parenthesis", () => {
    const r = demoAnalyze("=SUM(A1:A10");
    expect(r.verdict).toBe("broken");
    expect(r.error_type).toBe("syntax");
    expect(r.fixed_formula).toBe("=SUM(A1:A10)");
  });

  it("does not invent a fix when there is an extra closing parenthesis", () => {
    const r = demoAnalyze("=SUM(A1:A10))");
    expect(r.error_type).toBe("syntax");
    expect(r.fixed_formula).toBeNull();
  });

  it("corrects a misspelled function name (#NAME?)", () => {
    const r = demoAnalyze("=VLOKUP(A2,B:C,2,FALSE)");
    expect(r.error_type).toBe("#NAME?");
    expect(r.fixed_formula).toBe("=VLOOKUP(A2,B:C,2,FALSE)");
  });

  it("detects a VLOOKUP column index outside the range (#REF!)", () => {
    const r = demoAnalyze("=VLOOKUP(A2,B:C,3,FALSE)");
    expect(r.error_type).toBe("#REF!");
    expect(r.fixed_formula).toBe("=VLOOKUP(A2,B:C,2,FALSE)");
  });

  it("supports ';' as the argument separator (European locales)", () => {
    const r = demoAnalyze("=VLOOKUP(A2;Sheet2!A1:B20;5;FALSE)");
    expect(r.error_type).toBe("#REF!");
  });

  it("adds FALSE when VLOOKUP has no exact-match argument", () => {
    const r = demoAnalyze("=VLOOKUP(A2,B:D,2)");
    expect(r.error_type).toBe("logic");
    expect(r.fixed_formula).toBe("=VLOOKUP(A2,B:D,2,FALSE)");
  });

  it("wraps a literal division by zero in IFERROR", () => {
    const r = demoAnalyze("=A1/0");
    expect(r.error_type).toBe("#DIV/0!");
    expect(r.fixed_formula).toBe("=IFERROR(A1/0,0)");
  });

  it("treats a cell-by-cell division as valid and points at the data", () => {
    const r = demoAnalyze("=B2/C2");
    expect(r.verdict).toBe("ok");
    expect(r.fixed_formula).toBeNull();
    expect(r.if_ok_suggestion).toContain("IFERROR");
  });

  it("accepts a formula without the leading '='", () => {
    expect(demoAnalyze("SUMM(A1:A3)").fixed_formula).toBe("=SUM(A1:A3)");
  });

  it("marks non-formula input as unparseable", () => {
    expect(demoAnalyze("???").verdict).toBe("unparseable");
  });
});
