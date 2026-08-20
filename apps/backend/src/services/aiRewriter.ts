import { scanAndSanitizeScript, ComplianceScanResult } from './complianceProxy';
import { getRandomViralProduct, buildMultiAffiliateBundle, buildPinnedComment, buildMultiLinkDescription, ViralProduct } from './productRadar';

export interface ScriptGenerationResult {
    title: string;
    description: string;
    tags: string[];
    hook: string;
    body: string;
    cta: string;
    visualPrompts: string[];
    compliance: ComplianceScanResult;
    videoStyle?: string;
    productName?: string;
    affiliateLink?: string;
    pinnedCommentText?: string;
}

/**
 * Multi-Agent Script Generation & Optimization Engine (SIMPLYYTR SOTA 2026)
 * Orchestrates Analyst, Creator, Growth, and Multi-Link Monetization agents.
 */
export async function generateViralMetadata(originalTopic: string, settings?: any): Promise<{ title: string; description: string }> {
    const fullResult = await generateFullOrchestratedScript(originalTopic, settings);
    return {
        title: fullResult.title,
        description: fullResult.description
    };
}

export async function generateFullOrchestratedScript(
    originalTopic: string,
    settings?: any,
    rlyaRetentionInsights?: { dropOffTimestamp?: number; recommendedPacing?: string }
): Promise<ScriptGenerationResult> {
    const groqKey = process.env.GROQ_API_KEY || '';
    const tone = settings?.geminiTone || 'Clickbaity';
    const videoStyle = settings?.defaultVideoStyle || settings?.videoStyle || 'PRODUCT_FIND';
    const amazonTag = settings?.amazonAssociateTag || 'simplyytr-20';
    const customPrefix = settings?.customAffiliatePrefix || '';
    const pacingRule = rlyaRetentionInsights?.recommendedPacing || 'Ultra-high hook density, 3-second rapid scene changes';

    // If style is PRODUCT_FIND, select a viral problem-solving gadget and build multi-link bundle
    let matchedProduct: ViralProduct | null = null;
    let affiliateBundle: any = null;
    if (videoStyle === 'PRODUCT_FIND') {
        matchedProduct = getRandomViralProduct();
        affiliateBundle = buildMultiAffiliateBundle(matchedProduct, amazonTag, customPrefix);
    }

    const affiliateUrl = affiliateBundle ? affiliateBundle.amazonLink : '';
    const pinnedComment = matchedProduct && affiliateBundle ? buildPinnedComment(matchedProduct, affiliateBundle) : '';

    const fallbackResult: ScriptGenerationResult = {
        title: matchedProduct ? `This ${matchedProduct.pricePoint} Amazon Gadget Solves Everything! 🤯 #shorts` : `Viral: ${originalTopic.substring(0, 50)} #shorts`,
        description: matchedProduct && affiliateBundle
            ? buildMultiLinkDescription(matchedProduct, `Get it before it sells out! Link in pinned comment & description.`, affiliateBundle)
            : `Check out this clip about ${originalTopic}! Subscribe for more.`,
        tags: ['shorts', 'viral', 'amazonfinds', 'tiktokmademebuyit', 'gadgets'],
        hook: matchedProduct ? matchedProduct.hookAngle : `Wait until you see what happens with ${originalTopic.substring(0, 30)}...`,
        body: matchedProduct ? `Here is why this ${matchedProduct.name} is going viral everywhere. It solves ${matchedProduct.problemSolved} instantly. Features include ${matchedProduct.features.join(', ')}.` : `Here is the full breakdown of ${originalTopic}.`,
        cta: `Direct discount links are pinned in the comments below!`,
        visualPrompts: matchedProduct ? matchedProduct.visualSearchKeywords : ['satisfying gadget demonstration', 'close up product action', 'fast motion lifestyle transition'],
        compliance: scanAndSanitizeScript(matchedProduct ? matchedProduct.hookAngle : originalTopic),
        videoStyle,
        productName: matchedProduct ? matchedProduct.name : undefined,
        affiliateLink: affiliateUrl,
        pinnedCommentText: pinnedComment
    };

    if (!groqKey) {
        console.warn('[AI] No GROQ_API_KEY found, falling back to product template.');
        return fallbackResult;
    }

    try {
        let systemPrompt = '';
        if (videoStyle === 'PRODUCT_FIND' && matchedProduct) {
            systemPrompt = `
You are the world-class Top 1% YouTube Shorts Scriptwriter (MrBeast & Zack D. Films style).
Product: "${matchedProduct.name}" (${matchedProduct.pricePoint})
Annoying Problem: "${matchedProduct.problemSolved}"
Core Features: ${matchedProduct.features.join(' | ')}
Tone: "${tone}"

Write an addictive 30-35 second script engineered for 120%+ Average Percentage Viewed (APV):
1. PATTERN INTERRUPT HOOK (0-2s): Start mid-action with a visual paradox or relatable shock (e.g. "Your desk looks like a fire hazard until you see this $12 Amazon find...").
2. OPEN LOOP & RAPID PAYOFF (3-25s): Reveal how it solves the problem with satisfying visual cues. Deliver 1 key revelation every 3 seconds.
3. SEAMLESS LOOP CTA (26-30s): Tell viewers discount codes and multi-links are pinned in the top comment, and finish with a sentence that naturally bridges into the first word of the hook (so the short loops infinitely).
4. TITLE: Irresistible high-CTR title under 65 chars with #shorts #amazonfinds.
5. VISUAL PROMPTS: 4 distinct, hyper-descriptive cinematic B-roll search queries showing the problem, reaction, solution in action, and satisfying result.

Return a valid JSON object with EXACTLY this structure:
{
  "title": "String (viral title under 65 chars with #shorts #amazonfinds)",
  "description": "String (description directing to pinned comment)",
  "tags": ["shorts", "amazonfinds", "tiktokmademebuyit", "gadget", "viral"],
  "hook": "String (0-2s pattern interrupt hook)",
  "body": "String (20-25s rapid visual payoff narrative)",
  "cta": "String (call to action that seamlessly loops into the hook)",
  "visualPrompts": ["scene 1 problem demo", "scene 2 gadget action", "scene 3 satisfying payoff", "scene 4 close-up result"]
}
Do NOT include markdown wrapping. Output pure JSON only.
`;
        } else if (videoStyle === 'REMASTER_REACTION') {
            systemPrompt = `
You are the Top 1% Real-Time Viral Trend Specialist.
The user wants to capitalize on daily viral events (FIFA World Cup, Breaking News, Trending Sports, Viral Moments).
Topic/Subject: "${originalTopic}"
Tone: "${tone}"

Generate high-CTR title, trending hashtags, and engagement metadata for a viral short where original audio is preserved:
Return a valid JSON object with EXACTLY the following structure:
{
  "title": "String (high-CTR viral title under 65 chars with #shorts and trending hashtags)",
  "description": "String (curiosity-inducing description under 150 chars encouraging likes/comments)",
  "tags": ["Array", "of", "5", "trending", "tags"],
  "hook": "String (concise title summary)",
  "body": "String (context summary)",
  "cta": "String (like and subscribe prompt)",
  "visualPrompts": ["search query for the viral event short"]
}
Do NOT include markdown wrapping. Output pure JSON only.
`;
        } else {
            systemPrompt = `
You are the Top 1% YouTube Shorts Script Orchestrator (Zack D. Films / Sambucha retention formula).
Topic/Subject: "${originalTopic}"
Tone: "${tone}"
Enforce: ${pacingRule} (1 visual shift every 3 seconds, pattern interrupt hook, open loop).

Write a viral 35-45 second script engineered for maximum retention:
1. HOOK (0-2s): Start with a startling fact, myth-buster, or high-stakes paradox.
2. BODY (3-35s): High information velocity. Fast paced, intriguing storytelling.
3. SEAMLESS LOOP (36-40s): End on a sentence that seamlessly connects back to the opening hook word for infinite looping.
4. TITLE: High-CTR curiosity-driven title under 65 chars with #shorts.
5. VISUAL PROMPTS: 4 vivid cinematic scene descriptions for stock B-roll matching each sentence.

Return a valid JSON object with EXACTLY the following structure:
{
  "title": "String (viral title under 65 chars with #shorts)",
  "description": "String (engaging description under 150 chars)",
  "tags": ["Array", "of", "5", "tags"],
  "hook": "String (first 2 seconds high-retention hook)",
  "body": "String (core narrative, 25-35s spoken length)",
  "cta": "String (ending designed to seamlessly loop into hook)",
  "visualPrompts": ["scene 1 vivid stock query", "scene 2 query", "scene 3 query", "scene 4 query"]
}
Do NOT include markdown wrapping. Output pure JSON only.
`;
        }

        const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${groqKey}`
            },
            body: JSON.stringify({
                model: 'openai/gpt-oss-120b',
                messages: [
                    { role: 'system', content: 'You are an autonomous AI content orchestration engine. Output pure JSON only.' },
                    { role: 'user', content: systemPrompt }
                ],
                temperature: 0.75
            })
        });

        if (!response.ok) {
            throw new Error(`Groq API error: ${response.status} ${response.statusText}`);
        }

        const data = await response.json();
        let rawContent = data.choices?.[0]?.message?.content || '{}';
        rawContent = rawContent.replace(/^```json/i, '').replace(/^```/, '').replace(/```$/, '').trim();

        let parsed: any = {};
        try {
            parsed = JSON.parse(rawContent);
        } catch (e) {
            console.warn('[AI] JSON parse error on Groq output, using fallback.');
            parsed = fallbackResult;
        }

        const rawHook = parsed.hook || fallbackResult.hook;
        const rawBody = parsed.body || fallbackResult.body;
        const rawCta = parsed.cta || fallbackResult.cta;

        const complianceResult = scanAndSanitizeScript(`${rawHook} ${rawBody} ${rawCta}`);

        const finalDesc = matchedProduct && affiliateBundle
            ? buildMultiLinkDescription(matchedProduct, parsed.description || fallbackResult.description, affiliateBundle)
            : (parsed.description || fallbackResult.description);

        return {
            title: parsed.title || fallbackResult.title,
            description: finalDesc,
            tags: Array.isArray(parsed.tags) ? parsed.tags : fallbackResult.tags,
            hook: rawHook,
            body: rawBody,
            cta: rawCta,
            visualPrompts: Array.isArray(parsed.visualPrompts) && parsed.visualPrompts.length > 0 ? parsed.visualPrompts : fallbackResult.visualPrompts,
            compliance: complianceResult,
            videoStyle,
            productName: matchedProduct ? matchedProduct.name : undefined,
            affiliateLink: affiliateUrl,
            pinnedCommentText: pinnedComment
        };
    } catch (err: any) {
        console.error('[AI] Multi-Agent generation error:', err.message);
        return fallbackResult;
    }
}
