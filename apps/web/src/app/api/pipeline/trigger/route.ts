import { NextRequest } from 'next/server';
import { verifyAuth, unauthorized, callGroq, prisma } from '../../lib/utils';

// POST /api/pipeline/trigger
// Called by GitHub Actions cron or manually from the dashboard.
// Generates a script using Groq and creates a render job in the database.
export async function POST(request: NextRequest) {
  // Verify authorization
  if (!verifyAuth(request)) return unauthorized();

  try {
    const body = await request.json().catch(() => ({}));
    const count = Math.min(body.count || 1, 4); // Max 4 videos per trigger

    // Fetch system settings
    const settings = await prisma.systemSettings.findUnique({ where: { id: 1 } });
    if (!settings) {
      return Response.json({ error: 'System settings not configured' }, { status: 500 });
    }

    if (!settings.autoPilotEnabled && !body.force) {
      return Response.json({ message: 'Auto-pilot is disabled. Use force=true to override.' }, { status: 200 });
    }

    // Fetch top performing topics for self-learning context
    let performanceContext = '';
    if (settings.enableSelfLearningAI) {
      const topPerformers = await prisma.renderJob.findMany({
        where: { status: 'UPLOADED', views: { gt: 0 } },
        orderBy: { views: 'desc' },
        take: 5,
        select: { topic: true, generatedTitle: true, views: true, ctr: true },
      });
      const bottomPerformers = await prisma.renderJob.findMany({
        where: { status: 'UPLOADED', views: { gt: 0 } },
        orderBy: { views: 'asc' },
        take: 5,
        select: { topic: true, generatedTitle: true, views: true, ctr: true },
      });
      if (topPerformers.length > 0) {
        performanceContext = `
PERFORMANCE DATA (use this to improve):
Top performing videos: ${JSON.stringify(topPerformers)}
Worst performing videos: ${JSON.stringify(bottomPerformers)}
Generate content that follows patterns from top performers and avoids patterns from worst performers.
`;
      }
    }

    const jobs = [];
    for (let i = 0; i < count; i++) {
      // Generate script via Groq
      const scriptPrompt = `
You are an expert YouTube Shorts scriptwriter and growth strategist.

TARGET NICHE: "${settings.targetNiche}"
TONE: "${settings.geminiTone}"
${performanceContext}

Generate a unique, highly engaging YouTube Shorts video script (under 60 seconds when spoken aloud).

Return a JSON object with EXACTLY these keys:
{
  "topic": "A concise topic summary (3-6 words)",
  "hook": "Opening hook line (first 3 seconds, must grab attention immediately)",
  "body": "Main content body (40-50 seconds of spoken content, informative and engaging)",
  "cta": "Call to action (last 5 seconds, encourage like/subscribe/comment)",
  "visual_prompts": ["scene 1 description for stock video search", "scene 2 description", "scene 3 description", "scene 4 description", "scene 5 description"],
  "title": "Viral YouTube Shorts title under 70 chars with 1-2 hashtags",
  "description": "Engaging description under 200 chars",
  "tags": ["tag1", "tag2", "tag3", "tag4", "tag5"]
}

Rules:
- The script must be ORIGINAL content, not copied from any existing video.
- visual_prompts should be concrete, searchable terms (e.g., "person typing on laptop", "sunset over mountains").
- Make the hook irresistible — use curiosity gaps, surprising facts, or bold statements.
- Each visual_prompt should describe a different scene for variety.
`;

      const script = await callGroq(scriptPrompt);

      // Create the render job in the database
      const job = await prisma.renderJob.create({
        data: {
          status: 'SCRIPTED',
          topic: script.topic || `${settings.targetNiche} Short`,
          scriptHook: script.hook || '',
          scriptBody: script.body || '',
          scriptCta: script.cta || '',
          visualPrompts: script.visual_prompts || [],
          voiceName: settings.voiceName,
          generatedTitle: script.title || '',
          generatedDescription: script.description || '',
          generatedTags: script.tags || [],
          scriptedAt: new Date(),
        },
      });

      jobs.push(job);
    }

    return Response.json({
      status: 'success',
      message: `Created ${jobs.length} render job(s)`,
      jobs: jobs.map(j => ({ id: j.id, topic: j.topic, status: j.status })),
    });
  } catch (err) {
    console.error('[Pipeline Trigger] Error:', err);
    return Response.json({ error: String(err) }, { status: 500 });
  }
}
