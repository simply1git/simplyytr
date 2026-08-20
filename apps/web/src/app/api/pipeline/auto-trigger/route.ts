import { NextRequest } from 'next/server';
import { verifyAuth, unauthorized, callGroq, prisma } from '../../lib/utils';

export const maxDuration = 60;
export const dynamic = 'force-dynamic';

async function fetchTrendingTopics(): Promise<string[]> {
  try {
    const res = await fetch('https://trends.google.com/trending/rss?geo=US', {
      headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36' }
    });
    if (!res.ok) return [];
    const text = await res.text();
    const itemRegex = /<item>([\s\S]*?)<\/item>/g;
    const titles: string[] = [];
    let match;
    while ((match = itemRegex.exec(text)) !== null) {
      const itemContent = match[1];
      const titleMatch = itemContent.match(/<title>(.*?)<\/title>/);
      if (titleMatch && titleMatch[1]) {
        const title = titleMatch[1]
          .replace(/&amp;/g, '&')
          .replace(/&lt;/g, '<')
          .replace(/&gt;/g, '>')
          .replace(/&quot;/g, '"')
          .replace(/&#39;/g, "'");
        titles.push(title.trim());
      }
    }
    return titles.slice(0, 10);
  } catch (err) {
    console.error('Failed to fetch trending topics:', err);
    return [];
  }
}

// POST /api/pipeline/auto-trigger
// Called by the Kaggle Python worker in a continuous loop.
// Generates a single script and returns the job data immediately for processing.
export async function POST(request: NextRequest) {
  if (!verifyAuth(request)) return unauthorized();

  try {
    const workerVersion = request.headers.get('x-worker-version');
    if (workerVersion !== '36') {
      return Response.json({ message: 'Old worker versions are disabled' }, { status: 404 });
    }

    // Fetch system settings
    const settings = await prisma.systemSettings.findUnique({ where: { id: 1 } });
    if (!settings) {
      return Response.json({ error: 'System settings not configured' }, { status: 500 });
    }

    if (!settings.autoPilotEnabled) {
      return Response.json({ error: 'Auto-pilot is disabled' }, { status: 403 });
    }

    // Fetch live trends from Google Trends RSS
    const trendingTopics = await fetchTrendingTopics();
    const trendsContext = trendingTopics.length > 0
      ? `
CURRENT REAL-TIME DAILY TRENDS:
${trendingTopics.map((t, idx) => `- "${t}"`).join('\n')}

INSTRUCTION: You MUST select one of the daily trending topics/queries/celebrities above (e.g. FIFA World Cup, or a trending celebrity/event) to base the script on, making it highly versatile, relevant, and adaptive to what the world is searching for right now.
`
      : "";

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

    const { executePeakAgenticRun } = await import('../../lib/agenticOrchestrator');
    const result = await executePeakAgenticRun({
      forceNiche: settings.targetNiche !== 'Motivation' && settings.targetNiche !== 'General / Multi-Niche' ? settings.targetNiche : undefined,
      targetChannels: settings.targetChannels,
      defaultStyle: (settings as any).defaultVideoStyle || 'PRODUCT_FIND',
      settings
    });

    if (!result.success || !result.trace.jobCreatedId) {
      return Response.json({ error: result.error || 'Agentic generation failed' }, { status: 500 });
    }

    const job = await prisma.renderJob.findUnique({ where: { id: result.trace.jobCreatedId } });

    // Wake up worker if needed and if job passed all gates
    if (job?.status === 'SCRIPTED') {
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
          console.log('[Pipeline Auto-Trigger] Dispatched GPU worker for scripted job.');
        }
      } catch (e) {
        console.warn('GitHub Action trigger non-fatal error:', e);
      }
    }

    return Response.json({
      status: 'success',
      message: job?.status === 'SCRIPTED'
        ? `Peak agentic job generated and approved for render: "${job?.topic}"`
        : `Peak agentic job generated and held for review: "${job?.topic}"`,
      job: {
        id: job?.id,
        topic: job?.topic,
        scriptHook: job?.scriptHook,
        scriptBody: job?.scriptBody,
        scriptCta: job?.scriptCta,
        visualPrompts: job?.visualPrompts,
        voiceName: job?.voiceName,
        generatedTitle: job?.generatedTitle,
        videoStyle: job?.videoStyle,
        productName: job?.productName,
        affiliateLink: job?.affiliateLink,
        pinnedCommentText: job?.pinnedCommentText,
        jobType: settings.copyPasteMode === 'split_screen' ? 'aggregator' : (settings.copyPasteMode === 'renarration' ? 'generative' : 'clone')
      },
      trace: result.trace
    });
  } catch (err: any) {
    console.error('[Pipeline Auto-Trigger] Error:', err);
    return Response.json({ error: String(err.message || err) }, { status: 500 });
  }
}
