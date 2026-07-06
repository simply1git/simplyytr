import { NextRequest } from 'next/server';
import { verifyAuth, unauthorized, callGroq, prisma } from '../../lib/utils';

// POST /api/pipeline/auto-trigger
// Called by the Kaggle Python worker in a continuous loop.
// Generates a single script and returns the job data immediately for processing.
export async function POST(request: NextRequest) {
  if (!verifyAuth(request)) return unauthorized();

  try {
    const workerVersion = request.headers.get('x-worker-version');
    if (workerVersion !== '31') {
      return Response.json({ message: 'Old worker versions are disabled' }, { status: 404 });
    }

    // Fetch system settings
    const settings = await prisma.systemSettings.findUnique({ where: { id: 1 } });
    if (!settings) {
      return Response.json({ error: 'System settings not configured' }, { status: 500 });
    }

    // Fetch top performing videos for Self-Learning AI prompt engineering
    let selfLearningContext = "";
    if (settings.enableSelfLearningAI) {
      const topVideos = await prisma.renderJob.findMany({
        where: { views: { gt: 0 } },
        orderBy: { views: 'desc' },
        take: 5,
        select: { generatedTitle: true, scriptHook: true, views: true, topic: true }
      });

      if (topVideos.length > 0) {
        selfLearningContext = `
WINNING PERFORMANCE PATTERNS (Self-Learning AI Active):
Analyze these top-performing video titles and hooks from past uploads to model style and high-CTR patterns:
${topVideos.map(v => `- Title: "${v.generatedTitle}" | Hook: "${v.scriptHook}" | Views: ${v.views}`).join('\n')}

INSTRUCTION: Adapt your hook structure and title style to match the pacing and viral hook mechanics of these top-performing examples.
`;
      }
    }

    // Generate script via Groq
    const scriptPrompt = `
TARGET NICHE: "${settings.targetNiche}"
TARGET CHANNELS / INSPIRATION: "${settings.targetChannels || 'Alex Hormozi, Andrew Huberman, Motivation'}"
COPY-PASTE MODE: "${settings.copyPasteMode || 'clone_avatar'}"
TONE: "${settings.geminiTone}"
${selfLearningContext}
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
- Make the hook irresistible.
`;

    const script = await callGroq(scriptPrompt);

    // Create the render job in the database
    const job = await prisma.renderJob.create({
      data: {
        status: 'SCRIPTED', // Worker will immediately pick this up
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

    return Response.json({
      status: 'success',
      job: {
        id: job.id,
        topic: job.topic,
        scriptHook: job.scriptHook,
        scriptBody: job.scriptBody,
        scriptCta: job.scriptCta,
        visualPrompts: job.visualPrompts,
        voiceName: job.voiceName,
        generatedTitle: job.generatedTitle,
        jobType: 'clone' // Force clone pipeline for Phase 2 SOTA
      }
    });
  } catch (err) {
    console.error('[Pipeline Auto-Trigger] Error:', err);
    return Response.json({ error: String(err) }, { status: 500 });
  }
}
