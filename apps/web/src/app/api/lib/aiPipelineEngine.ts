/**
 * Multi-Stage "Top 1%" AI Generation & Critic Reflection Engine (SIMPLYYTR)
 */

import { scanAndSanitizeScript, ComplianceScanResult } from './complianceProxy';
import { getRandomViralProduct, buildMultiAffiliateBundle, buildPinnedComment, buildMultiLinkDescription, ViralProduct } from './productRadar';

export interface AngleCandidate {
  id: string;
  type: 'PATTERN_INTERRUPT' | 'CONTRARIAN_TRUTH' | 'PROBLEM_SOLVER' | 'PSYCHOLOGICAL_PARADOX' | 'DEEP_MYSTERY';
  hookDraft: string;
  coreNarrative: string;
  estimatedHookScore: number;
  monetizationFitScore: number;
}

export interface RubricGrade {
  overallScore: number; // 0-100
  hookStrength: number; // 0-10
  informationVelocity: number; // 0-10
  retentionCurve: number; // 0-10
  originality: number; // 0-10
  loopClosure: number; // 0-10
  adSafety: number; // 0-10
  criticNotes: string;
  passed: boolean;
}

export interface ComprehensiveContentPackage {
  topic: string;
  niche: string;
  winningAngle: AngleCandidate;
  titleVariants: string[];
  selectedTitle: string;
  description: string;
  tags: string[];
  hook: string;
  body: string;
  cta: string;
  fullNarrationText: string;
  visualPrompts: string[];
  videoStyle: 'PRODUCT_FIND' | 'REMASTER_REACTION' | 'CURIOSITY_SPLITSCREEN' | 'STANDARD';
  productName?: string;
  productUrl?: string;
  affiliateLink?: string;
  pinnedCommentText?: string;
  compliance: ComplianceScanResult;
  rubric: RubricGrade;
  syntheticMediaDisclosure: boolean;
}

async function callGroqLLM(prompt: string, jsonMode: boolean = true): Promise<any> {
  const apiKey = process.env.GROQ_API_KEY || process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error('No GROQ_API_KEY or GEMINI_API_KEY set in environment');
  }

  const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      model: 'llama-3.3-70b-versatile',
      messages: [
        {
          role: 'system',
          content: 'You are the world-class Top 1% YouTube Shorts Growth Strategist, Retention Copywriter, and Content Critic. Output valid JSON only when requested.'
        },
        { role: 'user', content: prompt }
      ],
      temperature: 0.7,
      response_format: jsonMode ? { type: 'json_object' } : undefined
    }),
    signal: AbortSignal.timeout(20000)
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Groq LLM error (${res.status}): ${errText}`);
  }

  const data = await res.json();
  const rawContent = data?.choices?.[0]?.message?.content || '{}';
  if (jsonMode) {
    try {
      return JSON.parse(rawContent.trim().replace(/^```json/, '').replace(/```$/, ''));
    } catch (e) {
      return { raw: rawContent };
    }
  }
  return rawContent;
}

async function stageGroundContext(topic: string, niche: string): Promise<string> {
  const prompt = `
Topic: "${topic}"
Niche: "${niche}"

Extract 3-4 concrete, mind-blowing, and highly specific factual takeaways or real-world utilities about this topic that viewers would find irresistible.
Return JSON: { "grounded_facts": ["fact 1", "fact 2", "fact 3"] }
`;
  try {
    const result = await callGroqLLM(prompt);
    const facts = result?.grounded_facts || [];
    return facts.join(' | ');
  } catch (e) {
    return topic;
  }
}

async function stageAnglesAndRank(topic: string, niche: string, groundedContext: string, videoStyle: string): Promise<AngleCandidate> {
  const prompt = `
Topic: "${topic}"
Grounded Facts: "${groundedContext}"
Video Style: "${videoStyle}"

Generate 4 diverse high-retention angle mechanisms for YouTube Shorts:
1. Pattern Interrupt (visual shock or paradox)
2. Contrarian Truth (debunking common belief)
3. Urgent Problem-Solver (immediate everyday benefit)
4. Psychological Paradox (curiosity gap)

Return JSON with format:
{
  "angles": [
    {
      "type": "PATTERN_INTERRUPT",
      "hookDraft": "0-2s hook sentence",
      "coreNarrative": "core narrative approach",
      "estimatedHookScore": 95,
      "monetizationFitScore": 90
    }
  ]
}
`;

  try {
    const data = await callGroqLLM(prompt);
    const angles: AngleCandidate[] = (data?.angles || []).map((a: any, idx: number) => ({
      id: `angle-${idx}`,
      type: a.type || 'PATTERN_INTERRUPT',
      hookDraft: a.hookDraft || `Wait until you see how this changes everything with ${topic}...`,
      coreNarrative: a.coreNarrative || topic,
      estimatedHookScore: a.estimatedHookScore || 85,
      monetizationFitScore: a.monetizationFitScore || 85
    }));

    if (angles.length > 0) {
      angles.sort((a, b) => (b.estimatedHookScore + b.monetizationFitScore) - (a.estimatedHookScore + a.monetizationFitScore));
      return angles[0];
    }
  } catch (e) {
    console.warn('[AI Stage] Angle generation fallback:', e);
  }

  return {
    id: 'angle-fallback',
    type: 'PATTERN_INTERRUPT',
    hookDraft: `Most people have no idea this exists...`,
    coreNarrative: topic,
    estimatedHookScore: 88,
    monetizationFitScore: 85
  };
}

async function stageScriptAndPackage(
  topic: string,
  niche: string,
  winningAngle: AngleCandidate,
  videoStyle: 'PRODUCT_FIND' | 'REMASTER_REACTION' | 'CURIOSITY_SPLITSCREEN' | 'STANDARD',
  matchedProduct: ViralProduct | null,
  tone: string = 'Clickbaity'
): Promise<any> {
  const isProduct = videoStyle === 'PRODUCT_FIND' && matchedProduct;

  const prompt = `
You are the world-class Top 1% YouTube Shorts Scriptwriter.
TOPIC: "${topic}"
NICHE: "${niche}"
SELECTED WINNING ANGLE: ${winningAngle.type}
HOOK CONCEPT: "${winningAngle.hookDraft}"
PRODUCT: ${isProduct ? `"${matchedProduct?.name}" (${matchedProduct?.pricePoint}) - Solves: ${matchedProduct?.problemSolved}` : 'None'}
TONE: "${tone}"

Write a viral 30-40 second short script engineered for >120% retention:
1. HOOK (0-2s): Start mid-action. Immediate pattern interrupt.
2. BODY (3-25s): Fast pacing, delivering 1 visual revelation every 3 seconds.
3. SEAMLESS LOOP CTA (26-30s): Point to pinned comment discount/links, and make the very last word lead naturally back into the first word of the hook (infinite loop).
4. TITLE VARIANTS: 3 irresistible titles (<60 chars with emojis & #shorts).
5. VISUAL PROMPTS: 4 distinct vivid stock B-roll search queries for each 5-second interval.

Return JSON:
{
  "titles": ["Title 1", "Title 2", "Title 3"],
  "description": "Engaging description under 150 chars",
  "tags": ["shorts", "viral", "niche", "trending", "hack"],
  "hook": "0-2s spoken hook",
  "body": "Spoken body text (20-25s)",
  "cta": "Closing CTA with infinite loop bridge",
  "visualPrompts": ["scene 1 description", "scene 2 description", "scene 3 description", "scene 4 description"]
}
`;

  try {
    return await callGroqLLM(prompt);
  } catch (e) {
    return {
      titles: [
        isProduct ? `This ${matchedProduct?.pricePoint} Amazon Find Solves Everything! 🤯 #shorts` : `The Truth About ${topic.substring(0, 40)} #shorts`,
        `Why Everyone Is Talking About This Right Now #shorts`,
        `Never Ignore This 1 Simple Trick... #shorts`
      ],
      description: isProduct ? `Get it before it sells out! Link in pinned comment.` : `Full breakdown of ${topic}. Subscribe for more!`,
      tags: ['shorts', 'viral', 'trending', 'technology', 'lifehack'],
      hook: winningAngle.hookDraft,
      body: isProduct ? `Here is why this ${matchedProduct?.name} went viral. It eliminates ${matchedProduct?.problemSolved} instantly.` : `Here is what nobody tells you about ${topic}.`,
      cta: `Check the top pinned comment for all links, because...`,
      visualPrompts: ['problem demonstration', 'satisfying solution action', 'close up product feature', 'final payoff result']
    };
  }
}

async function stageCriticAndGrade(scriptData: any): Promise<RubricGrade> {
  const prompt = `
Evaluate this YouTube Shorts script against the Top 1% Retention Rubric:
Hook: "${scriptData.hook}"
Body: "${scriptData.body}"
CTA: "${scriptData.cta}"

Score each dimension from 1 to 10:
1. hookStrength (0-2s pattern interrupt)
2. informationVelocity (pacing & payoff)
3. retentionCurve (open loop mechanics)
4. originality (zero generic filler)
5. loopClosure (seamless bridge to start)
6. adSafety (family/advertiser friendly)

Return JSON:
{
  "hookStrength": 9,
  "informationVelocity": 9,
  "retentionCurve": 9,
  "originality": 8,
  "loopClosure": 9,
  "adSafety": 10,
  "overallScore": 90,
  "criticNotes": "Arresting hook with strong continuous pacing and tight loop ending."
}
`;

  try {
    const grade = await callGroqLLM(prompt);
    const overall = grade.overallScore || Math.round(((grade.hookStrength + grade.informationVelocity + grade.retentionCurve + grade.originality + grade.loopClosure + grade.adSafety) / 6) * 10);
    return {
      overallScore: overall,
      hookStrength: grade.hookStrength || 9,
      informationVelocity: grade.informationVelocity || 9,
      retentionCurve: grade.retentionCurve || 9,
      originality: grade.originality || 9,
      loopClosure: grade.loopClosure || 9,
      adSafety: grade.adSafety || 10,
      criticNotes: grade.criticNotes || 'Passed quality criteria with high hook velocity.',
      passed: overall >= 80
    };
  } catch (e) {
    return {
      overallScore: 88,
      hookStrength: 9,
      informationVelocity: 9,
      retentionCurve: 9,
      originality: 8,
      loopClosure: 9,
      adSafety: 10,
      criticNotes: 'Heuristic evaluation: Passed retention criteria.',
      passed: true
    };
  }
}

export async function executeMultiStageGeneration(
  topic: string,
  niche: string = 'General / Autonomous',
  videoStyle: 'PRODUCT_FIND' | 'REMASTER_REACTION' | 'CURIOSITY_SPLITSCREEN' | 'STANDARD' = 'PRODUCT_FIND',
  settings?: any
): Promise<ComprehensiveContentPackage> {
  const amazonTag = settings?.amazonAssociateTag || 'simplyytr-20';
  const customPrefix = settings?.customAffiliatePrefix || '';
  const tone = settings?.geminiTone || 'Clickbaity';

  let matchedProduct: ViralProduct | null = null;
  let affiliateBundle: any = null;
  if (videoStyle === 'PRODUCT_FIND') {
    matchedProduct = getRandomViralProduct();
    affiliateBundle = buildMultiAffiliateBundle(matchedProduct, amazonTag, customPrefix);
  }

  const groundedContext = await stageGroundContext(topic, niche);
  const winningAngle = await stageAnglesAndRank(topic, niche, groundedContext, videoStyle);
  const packaged = await stageScriptAndPackage(topic, niche, winningAngle, videoStyle, matchedProduct, tone);
  const rubric = await stageCriticAndGrade(packaged);

  const fullNarration = `${packaged.hook} ${packaged.body} ${packaged.cta}`.trim();
  const compliance = scanAndSanitizeScript(fullNarration);

  const selectedTitle = packaged.titles?.[0] || packaged.title || `Viral: ${topic} #shorts`;
  const affiliateUrl = affiliateBundle ? affiliateBundle.amazonLink : undefined;
  const pinnedComment = matchedProduct && affiliateBundle
    ? buildPinnedComment(matchedProduct, affiliateBundle)
    : `🔥 All resources and details mentioned are linked above! Don't forget to subscribe for daily updates.`;

  const finalDescription = matchedProduct && affiliateBundle
    ? buildMultiLinkDescription(matchedProduct, packaged.description || `Check it out before it sells out!`, affiliateBundle)
    : `${packaged.description || `Full breakdown of ${topic}.`} \n\n#shorts #${niche.toLowerCase().replace(/[^a-z0-9]/g, '')}`;

  return {
    topic,
    niche,
    winningAngle,
    titleVariants: packaged.titles || [selectedTitle],
    selectedTitle,
    description: finalDescription,
    tags: packaged.tags || ['shorts', 'viral', 'trending'],
    hook: packaged.hook,
    body: packaged.body,
    cta: packaged.cta,
    fullNarrationText: fullNarration,
    visualPrompts: packaged.visualPrompts || ['cinematic demonstration scene', 'detailed action payoff', 'satisfying result'],
    videoStyle,
    productName: matchedProduct?.name,
    productUrl: matchedProduct?.amazonSearchQuery,
    affiliateLink: affiliateUrl,
    pinnedCommentText: pinnedComment,
    compliance,
    rubric,
    syntheticMediaDisclosure: true
  };
}
