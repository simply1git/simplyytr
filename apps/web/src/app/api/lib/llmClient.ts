/**
 * Centralized High-Performance LLM Client (SIMPLYYTR SOTA 2026)
 * Features Model Routing, Exponential Backoff Retries, JSON Parsing, and Strict Failure Handling.
 */

export type ModelTier = 'FAST_EXTRACTION' | 'REASONING_AND_CRITIQUE';

const MODEL_ROUTING: Record<ModelTier, string> = {
  FAST_EXTRACTION: 'llama-3.3-70b-versatile',
  REASONING_AND_CRITIQUE: 'llama-3.3-70b-versatile'
};

export interface LLMRequestOptions {
  tier?: ModelTier;
  temperature?: number;
  maxTokens?: number;
  jsonMode?: boolean;
  systemPrompt?: string;
  maxRetries?: number;
  timeoutMs?: number;
}

/**
 * Unified LLM execution with exponential backoff and typed error boundaries.
 */
export async function executeLLM<T = any>(
  prompt: string,
  options: LLMRequestOptions = {}
): Promise<T> {
  const apiKey = process.env.GROQ_API_KEY || process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error('LLM Execution Aborted: Missing GROQ_API_KEY / GEMINI_API_KEY in environment.');
  }

  const tier = options.tier || 'REASONING_AND_CRITIQUE';
  const model = MODEL_ROUTING[tier];
  const maxRetries = options.maxRetries ?? 2;
  const timeoutMs = options.timeoutMs ?? 18000;
  const jsonMode = options.jsonMode ?? true;

  let lastError: Error | null = null;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), timeoutMs);

      const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model,
          messages: [
            {
              role: 'system',
              content: options.systemPrompt || 'You are the Top 1% YouTube Growth Scientist and Copywriting Critic. Output strict valid JSON.'
            },
            { role: 'user', content: prompt }
          ],
          temperature: options.temperature ?? 0.7,
          max_tokens: options.maxTokens ?? 2048,
          response_format: jsonMode ? { type: 'json_object' } : undefined
        }),
        signal: controller.signal
      });

      clearTimeout(timer);

      if (!res.ok) {
        const errText = await res.text();
        const isRateLimit = res.status === 429;
        const isTransient = res.status >= 500;

        if ((isRateLimit || isTransient) && attempt < maxRetries) {
          const delay = Math.pow(2, attempt) * 1000 + Math.random() * 500;
          console.warn(`[LLMClient] Attempt ${attempt + 1} failed (${res.status}). Retrying in ${Math.round(delay)}ms...`);
          await new Promise(r => setTimeout(r, delay));
          continue;
        }

        throw new Error(`Groq API Error (${res.status}): ${errText}`);
      }

      const data = await res.json();
      const rawContent = data?.choices?.[0]?.message?.content || '';

      if (!rawContent) {
        throw new Error('Groq returned an empty response.');
      }

      if (jsonMode) {
        const cleaned = rawContent.trim()
          .replace(/^```json\s*/i, '')
          .replace(/^```\s*/, '')
          .replace(/\s*```$/, '')
          .trim();
        return JSON.parse(cleaned) as T;
      }

      return rawContent as unknown as T;

    } catch (err: any) {
      lastError = err;
      if (attempt < maxRetries && err.name === 'AbortError') {
        console.warn(`[LLMClient] Attempt ${attempt + 1} timed out after ${timeoutMs}ms. Retrying...`);
        await new Promise(r => setTimeout(r, 1000));
        continue;
      }
      if (attempt === maxRetries) {
        break;
      }
    }
  }

  throw lastError || new Error('LLM execution failed after retries.');
}
