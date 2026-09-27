/**
 * lib/ai/openrouter.ts
 *
 * OpenRouter AI provider wrapper.
 * Provides high-speed access to free AI models with automatic model fallback.
 */

const OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions";

const DEFAULT_OPENROUTER_MODELS = [
  "google/gemma-4-26b-a4b-it:free",
  "google/gemma-4-31b-it:free",
  "nvidia/nemotron-3.5-lightning:free",
  "qwen/qwen3.8-27b:free",
];

export interface OpenRouterOptions {
  systemPrompt: string;
  userPrompt: string;
  temperature?: number;
  maxTokens?: number;
}

export async function generateStructured<T>(
  options: OpenRouterOptions
): Promise<T> {
  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) {
    throw new Error("[OpenRouter] OPENROUTER_API_KEY is not set.");
  }

  const configuredModel = process.env.OPENROUTER_MODEL || DEFAULT_OPENROUTER_MODELS[0];
  const candidateModels = [configuredModel, ...DEFAULT_OPENROUTER_MODELS.filter(m => m !== configuredModel)];

  let lastErr: any = null;

  for (const model of candidateModels) {
    try {
      const body = {
        model,
        messages: [
          { role: "system", content: options.systemPrompt },
          { role: "user", content: options.userPrompt },
        ],
        temperature: options.temperature ?? 0.4,
        max_tokens: options.maxTokens ?? 2048,
      };

      const response = await fetch(OPENROUTER_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
          "HTTP-Referer": "https://code-to-career.vercel.app",
          "X-Title": "Code-To-Career",
        },
        body: JSON.stringify(body),
        signal: AbortSignal.timeout(15_000),
      });

      if (response.ok) {
        const json = await response.json();
        const rawContent: string | undefined = json?.choices?.[0]?.message?.content;
        if (rawContent) {
          const clean = rawContent.trim().replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/, "");
          return JSON.parse(clean) as T;
        }
      }

      if (response.status === 429) {
        console.warn(`[OpenRouter] Model ${model} hit 429 Rate Limit. Trying next free model...`);
      }
    } catch (err: any) {
      lastErr = err;
      console.warn(`[OpenRouter] Error on model ${model}:`, err?.message || err);
    }
  }

  throw lastErr || new Error("[OpenRouter] All model attempts failed or hit rate limits.");
}

export async function generateText(
  options: OpenRouterOptions
): Promise<string> {
  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) {
    throw new Error("[OpenRouter] OPENROUTER_API_KEY is not set.");
  }

  const configuredModel = process.env.OPENROUTER_MODEL || DEFAULT_OPENROUTER_MODELS[0];
  const candidateModels = [configuredModel, ...DEFAULT_OPENROUTER_MODELS.filter(m => m !== configuredModel)];

  for (const model of candidateModels) {
    try {
      const response = await fetch(OPENROUTER_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
          "HTTP-Referer": "https://code-to-career.vercel.app",
          "X-Title": "Code-To-Career",
        },
        body: JSON.stringify({
          model,
          messages: [
            { role: "system", content: options.systemPrompt },
            { role: "user", content: options.userPrompt },
          ],
          temperature: options.temperature ?? 0.6,
          max_tokens: options.maxTokens ?? 2048,
        }),
        signal: AbortSignal.timeout(15_000),
      });

      if (response.ok) {
        const json = await response.json();
        const content = json?.choices?.[0]?.message?.content;
        if (content) return content;
      }
    } catch (err: any) {
      console.warn(`[OpenRouter Text] Error on model ${model}:`, err?.message || err);
    }
  }

  throw new Error("[OpenRouter Text] All model attempts failed.");
}
