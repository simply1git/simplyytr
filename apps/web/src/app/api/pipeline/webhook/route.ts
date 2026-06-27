import { NextRequest } from 'next/server';
import { verifyAuth, unauthorized, prisma } from '../../lib/utils';

// POST /api/pipeline/webhook
// Called by the Kaggle worker when video rendering is complete.
// Updates the render job status to READY with the R2 asset URLs.
export async function POST(request: NextRequest) {
  if (!verifyAuth(request)) return unauthorized();

  try {
    const body = await request.json();
    const { jobId, videoUrl, thumbnailUrl, voiceoverUrl, error } = body;

    if (!jobId) {
      return Response.json({ error: 'jobId is required' }, { status: 400 });
    }

    // Check if job exists
    const existingJob = await prisma.renderJob.findUnique({ where: { id: jobId } });
    if (!existingJob) {
      return Response.json({ error: 'Job not found' }, { status: 404 });
    }

    if (error) {
      // Rendering failed
      await prisma.renderJob.update({
        where: { id: jobId },
        data: {
          status: 'FAILED',
          error: String(error),
          attempts: { increment: 1 },
        },
      });
      return Response.json({ status: 'error_recorded', jobId });
    }

    // Rendering succeeded
    await prisma.renderJob.update({
      where: { id: jobId },
      data: {
        status: 'READY',
        videoUrl: videoUrl || null,
        thumbnailUrl: thumbnailUrl || null,
        voiceoverUrl: voiceoverUrl || null,
        renderedAt: new Date(),
      },
    });

    return Response.json({ status: 'success', jobId, message: 'Job marked as READY for upload' });
  } catch (err) {
    console.error('[Pipeline Webhook] Error:', err);
    return Response.json({ error: String(err) }, { status: 500 });
  }
}
