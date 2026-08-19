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
    const groqKey = process.env.GROQ_API_KEY || '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';
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
You are the SIMPLYYTR Multi-Agent Product Conversion & Viral Scriptwriter.
Target Product: "${matchedProduct.name}" (Price: ${matchedProduct.pricePoint})
Problem it solves: "${matchedProduct.problemSolved}"
Key Features: ${matchedProduct.features.join(' | ')}
Tone: "${tone}" (High-energy, conversion-optimized, fast-paced)

Generate a high-retention 30-40 second spoken YouTube Shorts script:
1. HOOK (0-3s): Stop the scroll immediately by highlighting the annoying problem and how this $X gadget solves it.
2. BODY (4-25s): Rapid-fire demonstration breakdown of how it works and the visual satisfaction.
3. CTA (26-30s): Tell viewers the links with a 50% discount code are pinned in the top comment.
4. TITLE: Irresistible high-CTR title under 70 chars with #shorts #amazonfinds.
5. DESCRIPTION: 1-2 punchy sentences directing viewers to the pinned comment and multi-link bundle.
6. VISUAL PROMPTS: 3-4 descriptive stock video search keywords demonstrating this exact problem and product solution.

Return a valid JSON object with EXACTLY this structure:
{
  "title": "String (viral title under 70 chars with #shorts #amazonfinds)",
  "description": "String (description directing to pinned comment)",
  "tags": ["shorts", "amazonfinds", "tiktokmademebuyit", "gadget", "viral"],
  "hook": "String (first 3-5 seconds high-retention problem hook)",
  "body": "String (core product demonstration narrative, 25-35s spoken)",
  "cta": "String (directing to pinned comment for links and discount codes)",
  "visualPrompts": ["3-4 concrete descriptive search phrases for product demo B-roll"]
}
Do NOT include markdown wrapping. Output pure JSON only.
`;
        } else if (videoStyle === 'REMASTER_REACTION') {
            systemPrompt = `
You are the SIMPLYYTR Real-Time Viral Trend Specialist.
The user wants to capitalize on daily viral events (FIFA World Cup, Breaking News, Trending Sports, Viral Moments).
Topic/Subject: "${originalTopic}"
Tone: "${tone}"

Generate high-CTR title, trending hashtags, and engagement metadata for a viral short where original audio is preserved:
Return a valid JSON object with EXACTLY the following structure:
{
  "title": "String (high-CTR viral title under 70 chars with #shorts and trending hashtags)",
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
You are the SIMPLYYTR Multi-Agent Script Orchestration Core (v4.0.2-stable).
You simulate three specialized internal agents:
1. [ANALYST AGENT]: Analyzes retention telemetry. Enforces: ${pacingRule}.
2. [CREATOR AGENT]: Writes an ultra-viral, ${tone} YouTube Short script (Hook, Body, Call to Action) with 3-4 vivid B-roll scene prompts.
3. [GROWTH AGENT]: Generates an irresistible Title (under 70 chars with #shorts) and high-CTR Description with 5 trending tags.

Topic/Subject: "${originalTopic}"
Tone: "${tone}"

Return a valid JSON object with EXACTLY the following structure:
{
  "title": "String (viral title under 70 chars with #shorts)",
  "description": "String (engaging description under 150 chars)",
  "tags": ["Array", "of", "5", "tags"],
  "hook": "String (first 3-5 seconds high-retention hook sentence)",
  "body": "String (core narrative, 25-45 seconds spoken length)",
  "cta": "String (strong engagement closing sentence)",
  "visualPrompts": ["3-4 descriptive Pexels/B-roll search prompts for each scene"]
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
