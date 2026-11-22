import { NextRequest } from 'next/server';
import { verifyAuth, unauthorized, prisma } from '../../lib/utils';

export const maxDuration = 60;
export const dynamic = 'force-dynamic';

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

    // Validate artifact existence - prevent false READY states
    if (!videoUrl || typeof videoUrl !== 'string' || videoUrl.trim().length === 0) {
      await prisma.renderJob.update({
        where: { id: jobId },
        data: {
          status: 'FAILED',
          error: 'ARTIFACT_MISSING: Webhook received empty or missing videoUrl.',
          attempts: { increment: 1 },
        },
      });
      return Response.json({ error: 'videoUrl is required and cannot be empty' }, { status: 400 });
    }

    // If videoUrl represents a local file path or /api/media/ route, verify actual file on disk
    if (!videoUrl.startsWith('http://') && !videoUrl.startsWith('https://')) {
      const fs = await import('fs');
      const path = await import('path');
      let targetFile = videoUrl;
      if (videoUrl.startsWith('/api/media/')) {
        targetFile = path.join('storage/processed', videoUrl.replace('/api/media/', ''));
      }
      const candidatePaths = [
        path.isAbsolute(targetFile) ? targetFile : path.resolve(/*turbopackIgnore: true*/ process.cwd(), targetFile),
        path.resolve(/*turbopackIgnore: true*/ process.cwd(), '../../', targetFile),
        path.resolve(/*turbopackIgnore: true*/ process.cwd(), '../', targetFile),
      ];
      const resolvedPath = candidatePaths.find(p => fs.existsSync(p));
      if (!resolvedPath || fs.statSync(resolvedPath).size === 0) {
        const errorMsg = `ARTIFACT_NOT_FOUND: Rendered video file does not exist or is empty at ${videoUrl}`;
        await prisma.renderJob.update({
          where: { id: jobId },
          data: {
            status: 'FAILED',
            error: errorMsg,
            attempts: { increment: 1 },
          },
        });
        return Response.json({ error: errorMsg }, { status: 422 });
      }
    }

    // Fail closed: do not transition an invalid package to READY
    if (existingJob.contentPackage) {
      const { validateContentPackage, verifyPackageFingerprint } = await import('../../lib/contentContract');
      let parsedPkg: any;
      try {
        parsedPkg = typeof existingJob.contentPackage === 'string'
          ? JSON.parse(existingJob.contentPackage)
          : existingJob.contentPackage;
      } catch {
        parsedPkg = null;
      }
      const validation = validateContentPackage(parsedPkg);
      if (!validation.valid) {
        const errorMsg = `CONTENT_PACKAGE_INVALID_ON_COMPLETION: ${validation.errors.join('; ')}`;
        await prisma.renderJob.update({
          where: { id: jobId },
          data: {
            status: 'FAILED',
            error: errorMsg,
            attempts: { increment: 1 },
          },
        });
        return Response.json({ error: errorMsg }, { status: 422 });
      }

      if (parsedPkg?.packageFingerprint) {
        const fingerprintMatches = verifyPackageFingerprint(parsedPkg, parsedPkg.packageFingerprint);
        if (!fingerprintMatches) {
          const errorMsg = `CONTENT_PACKAGE_MUTATED_ON_COMPLETION: Package fingerprint does not match approved digest.`;
          await prisma.renderJob.update({
            where: { id: jobId },
            data: {
              status: 'FAILED',
              error: errorMsg,
              attempts: { increment: 1 },
            },
          });
          return Response.json({ error: errorMsg }, { status: 422 });
        }
      }
    }

    // Fetch system settings to check autonomy dial
    const settings = await prisma.systemSettings.findUnique({ where: { id: 1 } });
    
    // Rendering succeeded and package validated
    const updatedJob = await prisma.renderJob.update({
      where: { id: jobId },
      data: {
        status: 'READY',
        videoUrl: videoUrl,
        thumbnailUrl: thumbnailUrl || null,
        voiceoverUrl: voiceoverUrl || null,
        renderedAt: new Date(),
        error: null,
      },
    });

    const { logSystemEvent } = await import('../../lib/logStore');
    logSystemEvent({
      level: 'SUCCESS',
      stage: 'STORAGE',
      jobId,
      message: `Render Complete & Stored in R2: (Job ${jobId.slice(-8)}) -> Video: ${videoUrl || 'N/A'}`
    });

    // If Online Auto-Publish switch is enabled, publish immediately via YouTube Data API v3
    const shouldPublish = (settings?.autoPublishOnline ?? false) && videoUrl;
    if (shouldPublish) {
      try {
        const { publishToYouTubeDataApi } = await import('../../lib/youtubePublisher');
        const pubResult = await publishToYouTubeDataApi({
          videoUrl,
          thumbnailUrl: thumbnailUrl || undefined,
          title: existingJob.generatedTitle || `Viral: ${existingJob.topic} #shorts`,
          description: existingJob.generatedDescription || `Check out ${existingJob.topic}! #shorts`,
          tags: existingJob.generatedTags || ['shorts', 'viral'],
          pinnedCommentText: existingJob.pinnedCommentText || undefined,
          privacyStatus: 'public'
        });

        if (pubResult.success && pubResult.youtubeVideoId) {
          await prisma.renderJob.update({
            where: { id: jobId },
            data: {
              status: 'UPLOADED',
              publishedYoutubeId: pubResult.youtubeVideoId,
              uploadedAt: new Date(),
              error: null
            }
          });

          logSystemEvent({
            level: 'SUCCESS',
            stage: 'PUBLISHING',
            jobId,
            message: `YouTube Upload Success: (Job ${jobId.slice(-8)}) -> https://youtube.com/shorts/${pubResult.youtubeVideoId}`
          });

          return Response.json({ status: 'published', jobId, youtubeVideoId: pubResult.youtubeVideoId, message: 'Video rendered and published autonomously to YouTube!' });
        }
      } catch (pubErr) {
        console.warn('[Pipeline Webhook] Auto-publish non-fatal error:', pubErr);
        logSystemEvent({
          level: 'WARN',
          stage: 'PUBLISHING',
          jobId,
          message: `Auto-publish warning: ${String(pubErr)}`
        });
      }
    }

    return Response.json({
      status: 'ready',
      jobId,
      message: shouldPublish
        ? 'Video rendered and published.'
        : 'Video rendered successfully and stored in R2. Online auto-publishing is currently paused (ready for 1-click publishing).'
    });
  } catch (err) {
    console.error('[Pipeline Webhook] Error:', err);
    return Response.json({ error: String(err) }, { status: 500 });
  }
}
