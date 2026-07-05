import { NextRequest } from 'next/server';
import { verifyAuth, unauthorized, prisma } from '../../lib/utils';

// Helper function to scrape view count from public YouTube Short page
async function fetchYoutubeViews(youtubeId: string): Promise<number> {
  try {
    const url = `https://www.youtube.com/shorts/${youtubeId}`;
    const res = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept-Language': 'en-US,en;q=0.9'
      }
    });

    if (!res.ok) return 0;
    const html = await res.text();

    // Match view count patterns in YouTube HTML metadata
    const viewMatch = html.match(/"viewCount":"(\d+)"/) || html.match(/(\d[\d,]*)\s+views/i);
    if (viewMatch && viewMatch[1]) {
      const views = parseInt(viewMatch[1].replace(/,/g, ''), 10);
      return isNaN(views) ? 0 : views;
    }
  } catch (err) {
    console.error(`Failed to fetch views for YouTube ID ${youtubeId}:`, err);
  }
  return 0;
}

// GET /api/cron/analytics
// Daily background job to sync video performance & train the Self-Learning AI
export async function GET(request: NextRequest) {
  if (!verifyAuth(request)) return unauthorized();

  try {
    // Find all published videos that have a YouTube ID
    const uploadedJobs = await prisma.renderJob.findMany({
      where: {
        status: 'UPLOADED',
        publishedYoutubeId: { not: null }
      },
      select: {
        id: true,
        publishedYoutubeId: true,
        views: true,
        topic: true,
        generatedTitle: true
      }
    });

    let updatedCount = 0;
    const statsSummary = [];

    for (const job of uploadedJobs) {
      if (!job.publishedYoutubeId) continue;

      const currentViews = await fetchYoutubeViews(job.publishedYoutubeId);
      if (currentViews > 0 || currentViews !== job.views) {
        // Calculate dynamic retention score based on view volume
        const retentionScore = Math.min(100, Math.round((currentViews / 1000) * 10 * 10) / 10);

        await prisma.renderJob.update({
          where: { id: job.id },
          data: {
            views: currentViews,
            retentionScore: retentionScore,
            analyticsSyncedAt: new Date()
          }
        });

        statsSummary.push({
          id: job.id,
          title: job.generatedTitle,
          views: currentViews
        });
        updatedCount++;
      }
    }

    return Response.json({
      status: 'success',
      syncedJobsCount: updatedCount,
      totalUploadedJobs: uploadedJobs.length,
      summary: statsSummary
    });
  } catch (err) {
    console.error('[Cron Analytics] Error:', err);
    return Response.json({ error: String(err) }, { status: 500 });
  }
}
