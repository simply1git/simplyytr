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

    // Delete files from R2 after successful upload to save storage space/cost
    try {
      const { S3Client, DeleteObjectCommand } = require('@aws-sdk/client-s3');
      const s3 = new S3Client({
        region: 'auto',
        endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
        credentials: {
          accessKeyId: process.env.R2_ACCESS_KEY_ID || '',
          secretAccessKey: process.env.R2_SECRET_ACCESS_KEY || '',
        },
      });

      const bucket = process.env.R2_BUCKET_NAME || '';
      const deletePromises = [];

      if (existingJob.videoUrl) {
        const videoKey = existingJob.videoUrl.split('/').pop();
        if (videoKey) {
          deletePromises.push(
            s3.send(new DeleteObjectCommand({ Bucket: bucket, Key: videoKey }))
              .then(() => console.log(`[R2 Cleanup] Deleted video: ${videoKey}`))
              .catch((e: any) => console.error(`[R2 Cleanup] Failed to delete video ${videoKey}:`, e))
          );
        }
      }

      if (existingJob.thumbnailUrl) {
        const thumbKey = existingJob.thumbnailUrl.split('/').pop();
        if (thumbKey) {
          deletePromises.push(
            s3.send(new DeleteObjectCommand({ Bucket: bucket, Key: thumbKey }))
              .then(() => console.log(`[R2 Cleanup] Deleted thumbnail: ${thumbKey}`))
              .catch((e: any) => console.error(`[R2 Cleanup] Failed to delete thumbnail ${thumbKey}:`, e))
          );
        }
      }

      // Cleanup any voiceover file key (if generated)
      const voiceKey = `${jobId}_voice.mp3`;
      deletePromises.push(
        s3.send(new DeleteObjectCommand({ Bucket: bucket, Key: voiceKey }))
          .then(() => console.log(`[R2 Cleanup] Deleted voiceover: ${voiceKey}`))
          .catch((e: any) => {})
      );

      await Promise.all(deletePromises);
    } catch (r2Err) {
      console.error('[R2 Cleanup] Failed to delete objects:', r2Err);
    }

    return Response.json({ status: 'success', jobId, message: 'Video marked as UPLOADED and cleaned up from R2' });
  } catch (err) {
    console.error('[Pipeline Complete] Error:', err);
    return Response.json({ error: String(err) }, { status: 500 });
  }
}
