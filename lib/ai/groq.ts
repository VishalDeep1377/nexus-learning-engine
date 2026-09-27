/**
 * lib/ai/groq.ts
 *
 * Server-side only Groq AI provider wrapper.
 * Uses native fetch to avoid requiring the groq-sdk package.
 * GROQ_API_KEY is strictly never exposed to client bundles.
 */

const GROQ_BASE_URL = "https://api.groq.com/openai/v1/chat/completions";

const DEFAULT_MODELS = [
  "openai/gpt-oss-120b",
  "openai/gpt-oss-20b",
  "qwen/qwen3.8-27b",
];

function getGroqConfig() {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) {
    throw new Error(
      "[Groq] GROQ_API_KEY is not set. Add it to your .env.local file."
    );
  }
  const model = process.env.GROQ_MODEL || DEFAULT_MODELS[0];
  return { apiKey, model };
}

export interface GroqMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

export interface GenerateStructuredOptions {
  systemPrompt: string;
  userPrompt: string;
  temperature?: number;
  maxTokens?: number;
}

/**
 * Generates a response from Groq and attempts to parse it as JSON.
 * Includes automatic model fallback for 429 rate limits & invalid model names.
 */
export async function generateStructured<T>(
  options: GenerateStructuredOptions
): Promise<T> {
  const { apiKey, model: configuredModel } = getGroqConfig();

  const candidateModels = [configuredModel, ...DEFAULT_MODELS.filter(m => m !== configuredModel)];

  const messages: GroqMessage[] = [
    { role: "system", content: options.systemPrompt },
    { role: "user", content: options.userPrompt },
  ];

  let lastError: any = null;

  for (const currentModel of candidateModels) {
    const body = {
      model: currentModel,
      messages,
      temperature: options.temperature ?? 0.4,
      max_tokens: options.maxTokens ?? 4096,
    };

    let response;
    let attempt = 0;
    const maxAttempts = 2;

    while (attempt < maxAttempts) {
      try {
        response = await fetch(GROQ_BASE_URL, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${apiKey}`,
          },
          body: JSON.stringify(body),
          signal: AbortSignal.timeout(30_000),
        });

        if (response.status === 429) {
          attempt++;
          if (attempt >= maxAttempts) break;
          await new Promise((res) => setTimeout(res, 2000 * attempt));
          continue;
        }
        break;
      } catch (err: any) {
        lastError = err;
        attempt++;
        await new Promise((res) => setTimeout(res, 1000));
      }
    }

    if (response && response.ok) {
      const json = await response.json();
      const rawContent: string | undefined = json?.choices?.[0]?.message?.content;
      if (rawContent) {
        return parseGroqJson<T>(rawContent);
      }
    }

    if (response?.status === 401) {
      throw new Error("[Groq] Invalid API key. Check your GROQ_API_KEY.");
    }

    const errText = await response?.text().catch(() => "") || "";
    console.warn(`[Groq] Model ${currentModel} returned status ${response?.status || 'error'}: ${errText.slice(0, 150)}. Trying fallback model...`);
    lastError = new Error(`[Groq] API error ${response?.status || 'unknown'}: ${errText}`);
  }

  throw lastError || new Error("[Groq] All model attempts failed or hit rate limits.");
}

function parseGroqJson<T>(rawContent: string): T {
  try {
    return JSON.parse(rawContent) as T;
  } catch {
    // 1. Try stripping markdown fences
    let clean = rawContent.trim();
    if (clean.startsWith('```')) {
      clean = clean.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '');
      try {
        return JSON.parse(clean) as T;
      } catch {
        // Fall through
      }
    }

    // 2. Extract from first { or [ to last } or ]
    const firstBrace = rawContent.indexOf('{');
    const lastBrace = rawContent.lastIndexOf('}');
    const firstBracket = rawContent.indexOf('[');
    const lastBracket = rawContent.lastIndexOf(']');

    const first = (firstBrace !== -1 && (firstBracket === -1 || firstBrace < firstBracket)) ? firstBrace : firstBracket;
    const last = (lastBrace !== -1 && (lastBracket === -1 || lastBrace > lastBracket)) ? lastBrace : lastBracket;

    if (first !== -1 && last !== -1) {
      try {
        return JSON.parse(rawContent.substring(first, last + 1)) as T;
      } catch (err) {
        // Fall through
      }
    }

    throw new Error(
      `[Groq] Response is not valid JSON. Raw: ${rawContent.slice(0, 200)}...`
    );
  }
}

/**
 * Simple text generation (no JSON constraint).
 */
export async function generateText(
  options: GenerateStructuredOptions
): Promise<string> {
  const { apiKey, model } = getGroqConfig();

  const messages: GroqMessage[] = [
    { role: "system", content: options.systemPrompt },
    { role: "user", content: options.userPrompt },
  ];

  const body = {
    model,
    messages,
    temperature: options.temperature ?? 0.6,
    max_tokens: options.maxTokens ?? 2048,
  };

  let response;
  let attempt = 0;
  const maxAttempts = 3;

  while (attempt < maxAttempts) {
    response = await fetch(GROQ_BASE_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(60_000),
    });

    if (response.status === 429) {
      attempt++;
      if (attempt >= maxAttempts) break;
      await new Promise((res) => setTimeout(res, 3000 * attempt));
      continue;
    }
    break;
  }

  if (!response || !response.ok) {
    const errorText = await (response?.text().catch(() => "Unknown error") || "No response");
    throw new Error(`[Groq] API error ${response?.status || 'unknown'}: ${errorText}`);
  }

  const json = await response.json();
  return json?.choices?.[0]?.message?.content || "";
}
