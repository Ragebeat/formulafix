import { demoAnalyze } from "./demo-analyzer";
import { callAnthropic, callOpenAICompat } from "./llm/providers";
import type { AnalyzeResult, Dialect } from "./types";

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
  return { result: demoAnalyze(formula), model: "demo" };
}
