import { describe, expect, it } from "vitest";
import { extractJson } from "@/lib/analyze";

const result = {
  verdict: "broken", error_type: "#N/A", whats_broken: "x", why: "y",
  fixed_formula: "=A1", what_changed: "z", if_ok_suggestion: null, confidence: 0.9,
};

describe("extractJson (parsing LLM output)", () => {
  it("parses a bare JSON object", () => {
    expect(extractJson(JSON.stringify(result))).toEqual(result);
  });

  it("strips markdown fences", () => {
    expect(extractJson("```json\n" + JSON.stringify(result) + "\n```")).toEqual(result);
  });

  it("ignores chatter before and after the object", () => {
    expect(extractJson(`Sure! Here is the analysis:\n${JSON.stringify(result)}\nHope it helps.`)).toEqual(result);
  });

  it("throws when there is no JSON object", () => {
    expect(() => extractJson("I cannot help with that.")).toThrow(/no JSON/);
  });
});
