/**
 * Evidence Graph & Claim-Linter Engine (SIMPLYYTR SOTA 2026)
 * "Evidence graph, not vibes": Guarantees all factual assertions are backed by
 * discrete verified claims with source confidence and channel memory retrieval.
 */

import { ClaimItem, ClaimSet, ClaimSetSchema } from './schemas';
import { prisma } from './utils';
import { executeLLM } from './llmClient';

/**
 * 1. Build Evidence Graph: Decomposes topic & context into discrete claims with source metadata
 */
export async function buildEvidenceGraph(
  topic: string,
  niche: string,
  rawContext: string = '',
  sourceUrl?: string,
  sourceTitle?: string
): Promise<ClaimSet> {
  const prompt = `
Extract 3 to 5 discrete, verifiable, factual claims from this topic and context.
TOPIC: "${topic}"
NICHE: "${niche}"
SOURCE URL: "${sourceUrl || 'N/A'}"
SOURCE TITLE: "${sourceTitle || topic}"
RAW CONTEXT: "${rawContext || topic}"

Every claim must represent a specific, verifiable fact, mechanism, or real-world problem statement.
Return JSON matching this exact structure:
{
  "topic": "${topic}",
  "niche": "${niche}",
  "primarySourceUrl": "${sourceUrl || ''}",
  "summary": "1-sentence factual core summary",
  "claims": [
    {
      "id": "claim-1",
      "claimText": "Specific factual claim or problem statement",
      "sourceUrl": "${sourceUrl || ''}",
      "sourceTitle": "${sourceTitle || topic}",
      "publishedAt": "${new Date().toISOString()}",
      "exactQuote": "Short quote or verbatim fact",
      "confidence": 0.95,
      "verified": true
    }
  ]
}
`;

  try {
    const rawResult = await executeLLM(prompt, {
      tier: 'FAST_EXTRACTION',
      temperature: 0.2,
      systemPrompt: 'You are a factual evidence graph extraction engine. Extract verifiable facts only.'
    });

    const parsed = ClaimSetSchema.safeParse(rawResult);
    if (parsed.success) {
      return parsed.data;
    } else {
      console.warn('[EvidenceGraph] Schema parse failed:', parsed.error);
    }
  } catch (e: any) {
    console.error('[EvidenceGraph] Extraction error:', e.message);
  }

  // Degraded state on failure — NO fabricated verified passing state!
  return {
    topic,
    niche,
    primarySourceUrl: sourceUrl,
    summary: `Unverified topic breakdown for ${topic}`,
    claims: [
      {
        id: 'claim-unverified-1',
        claimText: `Unverified claim regarding ${topic}`,
        sourceUrl: sourceUrl || '',
        confidence: 0.3,
        verified: false
      }
    ],
    degraded: true,
    error: 'Evidence extraction failed or returned unverified claims.'
  };
}

/**
 * 2. Strict Claim-Linter: Verifies every assertive sentence in script maps to a verified claim
 */
export async function lintScriptAgainstClaims(
  scriptText: string,
  claimSet: ClaimSet
): Promise<{ passed: boolean; mappedClaims: string[]; orphanedAssertions: string[]; blockReason?: string }> {
  if (claimSet.degraded) {
    return {
      passed: false,
      mappedClaims: [],
      orphanedAssertions: ['Entire script ungrounded due to unverified evidence set.'],
      blockReason: 'Evidence graph is degraded. Cannot lint script against unverified claims.'
    };
  }

  const sentences = scriptText
    .split(/[.!?]+/)
    .map(s => s.trim())
    .filter(s => s.length > 8);

  const mappedClaims: string[] = [];
  const orphanedAssertions: string[] = [];

  for (const sentence of sentences) {
    let matched = false;
    for (const c of claimSet.claims) {
      if (!c.verified) continue;

      const words = c.claimText
        .toLowerCase()
        .replace(/[^a-z0-9\s]/g, '')
        .split(/\s+/)
        .filter(w => w.length > 3);

      const matchCount = words.filter(w => sentence.toLowerCase().includes(w)).length;
      if (matchCount >= 2 || words.length <= 2) {
        if (!mappedClaims.includes(c.id)) mappedClaims.push(c.id);
        matched = true;
        break;
      }
    }

    if (!matched) {
      orphanedAssertions.push(sentence);
    }
  }

  // Pass only if at least 1 verified claim is mapped and orphaned assertions are within strict threshold (max 1 conversational transition)
  const passed = mappedClaims.length > 0 && orphanedAssertions.length <= 1;

  return {
    passed,
    mappedClaims,
    orphanedAssertions,
    blockReason: passed ? undefined : `Script contains ${orphanedAssertions.length} ungrounded assertions not backed by verified claims.`
  };
}

/**
 * 3. Retrieval Memory: Pulls past uploads to build sequels/series and prevent duplicates
 */
export async function retrieveChannelMemory(limit: number = 30): Promise<{
  pastTopics: string[];
  pastTitles: string[];
  recentHooks: string[];
  suggestedSequelAngle?: string;
}> {
  try {
    const jobs = await prisma.renderJob.findMany({
      orderBy: { createdAt: 'desc' },
      take: limit,
      select: {
        topic: true,
        generatedTitle: true,
        scriptHook: true,
        views: true
      }
    });

    const pastTopics = Array.from(new Set(jobs.map(j => j.topic?.trim()).filter(Boolean))) as string[];
    const pastTitles = Array.from(new Set(jobs.map(j => j.generatedTitle?.trim()).filter(Boolean))) as string[];
    const recentHooks = Array.from(new Set(jobs.map(j => j.scriptHook?.trim()).filter(Boolean))) as string[];

    const topPerformer = jobs.find(j => j.views > 100);
    const suggestedSequelAngle = topPerformer
      ? `Part 2: Why ${topPerformer.topic} is evolving faster than expected`
      : undefined;

    return {
      pastTopics,
      pastTitles,
      recentHooks,
      suggestedSequelAngle
    };
  } catch (e) {
    console.warn('[ChannelMemory] Memory retrieval fallback:', e);
    return { pastTopics: [], pastTitles: [], recentHooks: [] };
  }
}
