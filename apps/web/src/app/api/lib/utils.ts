// Shared utilities for all API routes
// Provides auth middleware, Supabase client setup, and Groq integration

export {
  verifyAuth,
  verifyWorkerAuth,
  verifyDashboardAuth,
  verifyCsrfProtection,
  unauthorized,
  timingSafeEqualStr,
  getCookieValue,
} from './auth';

// ─── Groq LLM Client ───────────────────────────────────
export async function callGroq(prompt: string, options?: { temperature?: number; maxTokens?: number }) {
  const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${process.env.GROQ_API_KEY}`,
    },
    body: JSON.stringify({
      model: 'openai/gpt-oss-120b',
      messages: [{ role: 'user', content: prompt }],
      temperature: options?.temperature ?? 0.8,
      max_tokens: options?.maxTokens ?? 2048,
    }),
  });

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`Groq API error ${response.status}: ${errText}`);
  }

  const data = await response.json();
  let text = data.choices[0].message.content;
  // Strip markdown code blocks if present
  text = text.replace(/^```json\s*/i, '').replace(/^```\s*/, '').replace(/\s*```$/, '').trim();
  return JSON.parse(text);
}

// ─── Prisma Client (Edge-compatible) ────────────────────
// For Vercel serverless, we use a singleton pattern
import { PrismaClient } from '@prisma/client';

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient };

export const prisma = globalForPrisma.prisma || new PrismaClient();

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;
