import { scanAndSanitizeScript, ComplianceScanResult } from './complianceProxy';

export interface ScriptGenerationResult {
    title: string;
    description: string;
    tags: string[];
    hook: string;
    body: string;
    cta: string;
    visualPrompts: string[];
    compliance: ComplianceScanResult;
}

/**
 * Multi-Agent Script Generation & Optimization Engine (SIMPLYYTR SOTA 2026)
 * Orchestrates Analyst, Creator, and Compliance agent logic.
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
    const pacingRule = rlyaRetentionInsights?.recommendedPacing || 'Ultra-high hook density, 3-second rapid scene changes';

    const fallbackResult: ScriptGenerationResult = {
        title: `Viral: ${originalTopic.substring(0, 50)} #shorts`,
        description: `Check out this remarkable clip about ${originalTopic}! Make sure to subscribe for more.`,
        tags: ['shorts', 'viral', 'trending', 'youtube'],
        hook: `Wait until you see what happens with ${originalTopic.substring(0, 30)}...`,
        body: `Here is the full story behind ${originalTopic}. Everything changed when this happened.`,
        cta: `Subscribe now so you never miss another breakthrough!`,
        visualPrompts: ['dramatic cinematic camera pan', 'intense close up emotion', 'satisfying fast motion transition'],
        compliance: scanAndSanitizeScript(`Wait until you see what happens with ${originalTopic}`)
    };

    if (!groqKey) {
        console.warn('[AI] No GROQ_API_KEY found, falling back to basic template.');
        return fallbackResult;
    }

    try {
        const systemPrompt = `
You are the SIMPLYYTR Multi-Agent Script Orchestration Core (v4.0.2-stable).
You simulate three specialized internal agents:
1. [ANALYST AGENT]: Analyzes retention telemetry. Enforces: ${pacingRule}.
2. [CREATOR AGENT]: Writes an ultra-viral, ${tone} YouTube Short script (Hook, Body, Call to Action) with 3-4 vivid B-roll scene prompts.
3. [GROWTH AGENT]: Generates an irresistible Title (under 70 chars with #shorts) and high-CTR Description with 5 trending tags.

Topic/Subject: "${originalTopic}"

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
Do NOT include markdown wrapping or any other commentary.
`;

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
            console.warn('[AI] JSON parse failed, raw:', rawContent);
            parsed = {};
        }

        // Combine full script text for compliance audit
        const fullScriptText = `${parsed.hook || ''} ${parsed.body || ''} ${parsed.cta || ''}`.trim() || originalTopic;
        const complianceResult = scanAndSanitizeScript(fullScriptText, {
            autoCorrect: settings?.adSafeFilterEnabled !== false
        });

        return {
            title: (parsed.title || fallbackResult.title).replace(/^["']|["']$/g, ''),
            description: parsed.description || fallbackResult.description,
            tags: Array.isArray(parsed.tags) ? parsed.tags : fallbackResult.tags,
            hook: parsed.hook || fallbackResult.hook,
            body: parsed.body || fallbackResult.body,
            cta: parsed.cta || fallbackResult.cta,
            visualPrompts: Array.isArray(parsed.visualPrompts) && parsed.visualPrompts.length > 0 ? parsed.visualPrompts : fallbackResult.visualPrompts,
            compliance: complianceResult
        };

    } catch (err) {
        console.error('[AI] Multi-Agent generation error:', err);
        return fallbackResult;
    }
}
