import { NextRequest } from 'next/server';
import { callGroq, prisma } from '../../lib/utils';

export const maxDuration = 60;
export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const targetTopic = body.topic || 'Why AI is Replacing Coding in 2026';
    const competitor = body.competitor || '@TechNodeVoid';
    const velocity = body.velocity || '12.4k/hr';

    // Fetch system settings
    const settings = await prisma.systemSettings.findUnique({ where: { id: 1 } });
    const voiceName = settings?.voiceName || 'en-US-GuyNeural';

    // Fast-acting Trend-Jacking Script Prompt
    const prompt = `
You are the SIMPLYYTR Rapid-Response Trend-Jacking Agent.
A rival channel (${competitor}) is gaining extreme velocity (${velocity}) on the topic: "${targetTopic}".

Write an emergency, high-retention counter-narrative YouTube Short that captures this exact viral wave with higher energy and a shocking perspective.

Return a JSON object with EXACTLY these keys:
{
  "topic": "${targetTopic.substring(0, 40)}",
  "hook": "Aggressive 3-second curiosity hook",
  "body": "Fast-paced 30-second breakdown with surprising facts",
  "cta": "Engaging question hook asking the audience to comment and subscribe",
  "visual_prompts": ["scene 1 description", "scene 2 description", "scene 3 description"],
  "title": "Viral YouTube title with #shorts",
  "description": "Engaging description under 150 chars",
  "tags": ["trendjacking", "viral", "shorts", "tech", "ai"]
}
`;

    const script = await callGroq(prompt);

    // Create SCRIPTED job
    const job = await prisma.renderJob.create({
      data: {
        status: 'SCRIPTED',
        topic: `[TREND-JACK] ${script.topic || targetTopic}`,
        scriptHook: script.hook || '',
        scriptBody: script.body || '',
        scriptCta: script.cta || '',
        visualPrompts: script.visual_prompts || [],
        voiceName,
        generatedTitle: script.title || `${targetTopic} #shorts`,
        generatedDescription: script.description || '',
        generatedTags: script.tags || [],
        contentIdRiskScore: 0.8,
        renderEngine: settings?.renderEngine || 'HYBRID',
        scriptedAt: new Date(),
      },
    });

    // Attempt to wake up Kaggle GPU / GitHub Actions runner
    try {
      const ghToken = process.env.GITHUB_PAT || process.env.GITHUB_TOKEN;
      if (ghToken) {
        await fetch('https://api.github.com/repos/simply1git/simplyytr/actions/workflows/trigger-kaggle.yml/dispatches', {
          method: 'POST',
          headers: {
            'Accept': 'application/vnd.github.v3+json',
            'Authorization': `Bearer ${ghToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ ref: 'main' })
        });
      }
    } catch (e) {
      console.warn('[Trend-Jack] Action dispatch notice:', e);
    }

    return Response.json({
      status: 'success',
      message: `Trend-Jacking initiated! Counter-video scripted for "${targetTopic}".`,
      job
    });

  } catch (err: any) {
    console.error('[Trend-Jack] Error:', err);
    return Response.json({ error: err.message || String(err) }, { status: 500 });
  }
}
