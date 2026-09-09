/**
 * lib/ai/gemini.ts
 *
 * Server-side only Gemini AI provider wrapper.
 * Uses native fetch to avoid requiring additional SDKs.
 */

export interface GeminiMessage {
  role: "system" | "user" | "model";
  content: string;
}

export interface GenerateStructuredOptions {
  systemPrompt: string;
  userPrompt: string;
  temperature?: number;
  maxTokens?: number;
}

function getGeminiConfig() {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("[Gemini] GEMINI_API_KEY is not set. Add it to your .env.local file.");
  }
  // Using Flash as it's the fastest and best cost/performance ratio for these tasks
  return { apiKey, model: "gemini-flash-lite-latest" };
}

/**
 * Generates a response from Gemini and attempts to parse it as JSON.
 */
export async function generateStructured<T>(
  options: GenerateStructuredOptions
): Promise<T> {
  const { apiKey, model } = getGeminiConfig();
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;

  const body = {
    systemInstruction: {
      parts: [{ text: options.systemPrompt }]
    },
    contents: [
      {
        role: "user",
        parts: [{ text: options.userPrompt }]
      }
    ],
    generationConfig: {
      temperature: options.temperature ?? 0.4,
      maxOutputTokens: options.maxTokens ?? 4096,
      responseMimeType: "application/json",
    }
  };

  let response;
  let attempt = 0;
  const maxAttempts = 3;

  while (attempt < maxAttempts) {
    response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(60_000),
    });

    if (response.status === 429) {
      attempt++;
      if (attempt >= maxAttempts) break;
      await new Promise((res) => setTimeout(res, 2000 * attempt));
      continue;
    }
    break;
  }

  if (!response || !response.ok) {
    const errorText = await (response?.text().catch(() => "Unknown error") || "No response");
    if (response?.status === 429) {
      throw new Error("[Gemini] Rate limit exceeded cleanly after retries. Please try again later.");
    }
    throw new Error(`[Gemini] API error ${response?.status || 'unknown'}: ${errorText}`);
  }

  const json = await response.json();
  const rawContent = json?.candidates?.[0]?.content?.parts?.[0]?.text;

  if (!rawContent) {
    throw new Error("[Gemini] Empty response from API.");
  }

  const cleanContent = rawContent.trim();
  try {
    return JSON.parse(cleanContent) as T;
  } catch (err1) {
    try {
      // Fallback 1: Extract from markdown fences if model ignored mime type
      const jsonMatch = cleanContent.match(/```(?:json)?\s*([\s\S]*?)```/);
      if (jsonMatch?.[1]) {
        return JSON.parse(jsonMatch[1].trim()) as T;
      }

      // Fallback 2: Escape unescaped control characters (common in model json)
      const sanitized = cleanContent.replace(/[\u0000-\u001F]+/g, (match: string) => {
        return match === '\n' ? '\\n' : match === '\r' ? '\\r' : match === '\t' ? '\\t' : '';
      });
      return JSON.parse(sanitized) as T;
    } catch (err2) {
      console.error("[Gemini JSON Parse Error]:", cleanContent);
      throw new Error(`[Gemini] Response is not valid JSON. See server logs for full output. Raw prefix: ${cleanContent.slice(0, 200)}...`);
    }
  }
}

/**
 * Simple text generation (no JSON constraint).
 */
export async function generateText(
  options: GenerateStructuredOptions
): Promise<string> {
  const { apiKey, model } = getGeminiConfig();
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;

  const body = {
    systemInstruction: {
      parts: [{ text: options.systemPrompt }]
    },
    contents: [
      {
        role: "user",
        parts: [{ text: options.userPrompt }]
      }
    ],
    generationConfig: {
      temperature: options.temperature ?? 0.6,
      maxOutputTokens: options.maxTokens ?? 2048,
    }
  };

  let response;
  let attempt = 0;
  const maxAttempts = 3;

  while (attempt < maxAttempts) {
    response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(60_000),
    });

    if (response.status === 429) {
      attempt++;
      if (attempt >= maxAttempts) break;
      await new Promise((res) => setTimeout(res, 2000 * attempt));
      continue;
    }
    break;
  }

  if (!response || !response.ok) {
    const errorText = await (response?.text().catch(() => "Unknown error") || "No response");
    throw new Error(`[Gemini] API error ${response?.status || 'unknown'}: ${errorText}`);
  }

  const json = await response.json();
  return json?.candidates?.[0]?.content?.parts?.[0]?.text || "";
}
