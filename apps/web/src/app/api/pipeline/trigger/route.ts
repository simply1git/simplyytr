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
    const traces = [];

    for (let i = 0; i < count; i++) {
      const { executePeakAgenticRun } = await import('../../lib/agenticOrchestrator');
      const result = await executePeakAgenticRun({
        forceNiche: body.niche || (settings.targetNiche !== 'Motivation' && settings.targetNiche !== 'General / Multi-Niche' ? settings.targetNiche : undefined),
        targetChannels: settings.targetChannels,
        defaultStyle: (settings as any).defaultVideoStyle || 'PRODUCT_FIND',
        settings
      });

      if (result.success && result.trace.jobCreatedId) {
        const job = await prisma.renderJob.findUnique({ where: { id: result.trace.jobCreatedId } });
        if (job) jobs.push(job);
        traces.push(result.trace);
      }
    }

    const scriptedCount = jobs.filter(j => j.status === 'SCRIPTED').length;
    const reviewCount = jobs.filter(j => j.status === 'NEEDS_REVIEW').length;

    // Trigger GitHub Action to wake up Kaggle GPU only if there are SCRIPTED jobs
    if (scriptedCount > 0) {
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
          console.log('[Pipeline Trigger] Dispatched GPU worker for scripted jobs.');
        } else {
          console.warn('[Pipeline Trigger] No GITHUB_PAT found. Kaggle must be triggered manually or via cron.');
        }
      } catch (e) {
        console.error('[Pipeline Trigger] Failed to trigger GitHub Action:', e);
      }
    }

    return Response.json({
      status: 'success',
      message: `Generated ${jobs.length} package(s): ${scriptedCount} approved to render, ${reviewCount} held for review.`,
      count: jobs.length,
      scriptedCount,
      reviewCount,
      jobs: jobs.map(j => ({ id: j.id, topic: j.topic, status: j.status })),
      traces
    });
  } catch (error: any) {
    console.error('Trigger pipeline error:', error);
    return Response.json({ error: error.message || 'Pipeline trigger failed' }, { status: 500 });
  }
}
