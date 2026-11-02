/** HTTP clients for the LLM providers. Each returns the parsed result and the model id it used. */
import type { Dialect } from "../types";
import { extractJson } from "./parse";
import { SYSTEM_PROMPT, userMessage } from "./prompt";

// Anthropic Messages API
export async function callAnthropic(formula: string, context: string, dialect: Dialect) {
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
export async function callOpenAICompat(
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
