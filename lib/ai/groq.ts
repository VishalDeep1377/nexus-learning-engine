/**
 * lib/ai/groq.ts
 *
 * Server-side only Groq AI provider wrapper.
 * Uses native fetch to avoid requiring the groq-sdk package.
 * GROQ_API_KEY is strictly never exposed to client bundles.
 */

const GROQ_BASE_URL = "https://api.groq.com/openai/v1/chat/completions";

function getGroqConfig() {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) {
    throw new Error(
      "[Groq] GROQ_API_KEY is not set. Add it to your .env.local file."
    );
  }
  const model =
    process.env.GROQ_MODEL || "openai/gpt-oss-20b";
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
 * Throws if the API key is missing or the response is not valid JSON.
 */
export async function generateStructured<T>(
  options: GenerateStructuredOptions
): Promise<T> {
  const { apiKey, model } = getGroqConfig();

  const messages: GroqMessage[] = [
    { role: "system", content: options.systemPrompt },
    { role: "user", content: options.userPrompt },
  ];

  const body = {
    model,
    messages,
    temperature: options.temperature ?? 0.4,
    max_tokens: options.maxTokens ?? 4096,
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

    if (response?.status === 429) {
      throw new Error("[Groq] Rate limit exceeded cleanly after retries. Please try again later.");
    }
    if (response?.status === 401) {
      throw new Error("[Groq] Invalid API key. Check your GROQ_API_KEY.");
    }
    throw new Error(`[Groq] API error ${response?.status || 'unknown'}: ${errorText}`);
  }

  const json = await response.json();
  const rawContent: string | undefined = json?.choices?.[0]?.message?.content;

  if (!rawContent) {
    throw new Error("[Groq] Empty response from API.");
  }

  // Attempt JSON parse with recovery
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
