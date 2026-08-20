import { NextRequest } from 'next/server';
import { prisma } from '../../lib/utils';
import { publishToYouTubeDataApi } from '../../lib/youtubePublisher';

export const maxDuration = 60;
export const dynamic = 'force-dynamic';

// POST /api/pipeline/publish
// Manually triggers 1-click YouTube Data API v3 publication for a READY job
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { jobId } = body;

    if (!jobId) {
      return Response.json({ error: 'jobId is required' }, { status: 400 });
    }

    const job = await prisma.renderJob.findUnique({ where: { id: jobId } });
    if (!job) {
      return Response.json({ error: 'Job not found' }, { status: 404 });
    }

    if (!job.videoUrl) {
      return Response.json({ error: 'Job does not have a rendered videoUrl yet' }, { status: 400 });
    }

    const pubResult = await publishToYouTubeDataApi({
      videoUrl: job.videoUrl,
      thumbnailUrl: job.thumbnailUrl || undefined,
      title: job.generatedTitle || `Viral: ${job.topic} #shorts`,
      description: job.generatedDescription || `Check out ${job.topic}! #shorts`,
      tags: job.generatedTags || ['shorts', 'viral'],
      pinnedCommentText: job.pinnedCommentText || undefined,
      privacyStatus: 'public'
    });

    if (pubResult.success && pubResult.youtubeVideoId) {
      const updated = await prisma.renderJob.update({
        where: { id: jobId },
        data: {
          status: 'UPLOADED',
          publishedYoutubeId: pubResult.youtubeVideoId,
          uploadedAt: new Date(),
          error: null
        }
      });

      return Response.json({
        status: 'success',
        message: 'Published to YouTube successfully!',
        youtubeVideoId: pubResult.youtubeVideoId,
        youtubeUrl: pubResult.youtubeUrl,
        job: updated
      });
    }

    return Response.json({
      status: 'failed',
      error: pubResult.error || 'Failed to publish to YouTube'
    }, { status: 500 });

  } catch (err: any) {
    console.error('[Publish API] Error:', err);
    return Response.json({ error: String(err.message || err) }, { status: 500 });
  }
}
