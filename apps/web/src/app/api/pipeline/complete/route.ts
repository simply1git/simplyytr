import { NextRequest } from 'next/server';
import { verifyAuth, unauthorized, prisma } from '../../lib/utils';

// POST /api/pipeline/complete
// Called by the local uploader agent after successfully uploading a video to YouTube.
export async function POST(request: NextRequest) {
  if (!verifyAuth(request)) return unauthorized();

  try {
    const body = await request.json();
    const { jobId, publishedYoutubeId, error } = body;

    if (!jobId) {
      return Response.json({ error: 'jobId is required' }, { status: 400 });
    }

    const existingJob = await prisma.renderJob.findUnique({ where: { id: jobId } });
    if (!existingJob) {
      return Response.json({ error: 'Job not found' }, { status: 404 });
    }

    if (error) {
      // Upload failed
      await prisma.renderJob.update({
        where: { id: jobId },
        data: {
          status: existingJob.attempts >= 2 ? 'FAILED' : 'READY', // Retry up to 2 times
          error: String(error),
          attempts: { increment: 1 },
        },
      });
      return Response.json({ status: 'error_recorded', jobId });
    }

    // Upload succeeded
    await prisma.renderJob.update({
      where: { id: jobId },
      data: {
        status: 'UPLOADED',
        publishedYoutubeId: publishedYoutubeId || null,
        uploadedAt: new Date(),
        error: null,
      },
    });

    return Response.json({ status: 'success', jobId, message: 'Video marked as UPLOADED' });
  } catch (err) {
    console.error('[Pipeline Complete] Error:', err);
    return Response.json({ error: String(err) }, { status: 500 });
  }
}
