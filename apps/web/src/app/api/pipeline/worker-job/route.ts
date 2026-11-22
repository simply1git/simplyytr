import { NextRequest } from 'next/server';
import { verifyAuth, unauthorized, prisma } from '../../lib/utils';
import { validateContentPackage, verifyPackageFingerprint } from '../../lib/contentContract';

export const maxDuration = 60;
export const dynamic = 'force-dynamic';

// GET /api/pipeline/worker-job
// Called by the Kaggle GPU worker to get the next SCRIPTED job
export async function GET(request: NextRequest) {
  if (!verifyAuth(request)) return unauthorized();

  try {
    const workerVersion = request.headers.get('x-worker-version');
    if (workerVersion !== '36') {
      return Response.json({ error: 'Outdated Kaggle Worker. Update to version 36' }, { status: 404 });
    }

    // Update worker active status on any poll
    await prisma.systemSettings.update({
      where: { id: 1 },
      data: { workerLastActiveAt: new Date() }
    }).catch(err => console.error("Failed to update worker activity status:", err));

    // Targeted test-leasing isolation check:
    // Allows integration tests to lease their own created job without queue collisions.
    const testTargetJobId = request.headers.get('x-test-target-job-id');
    const isProduction = process.env.NODE_ENV === 'production';
    const isTestLeasingAllowed = (process.env.ALLOW_TEST_JOB_LEASING === 'true' || process.env.ALLOW_TEST_JOB_LEASING === '"true"') || process.env.NODE_ENV === 'test';

    // Fail closed: test-only targeted leasing header is strictly forbidden in production environments
    if (testTargetJobId && !isTestLeasingAllowed) {
      return Response.json({
        error: 'TEST_LEASING_DISABLED',
        message: 'Targeted test job leasing is disabled in production environments. Set ALLOW_TEST_JOB_LEASING=true or NODE_ENV=test.'
      }, { status: 403 });
    }

    if (testTargetJobId && (typeof testTargetJobId !== 'string' || testTargetJobId.trim().length === 0 || testTargetJobId.length > 128)) {
      return Response.json({
        error: 'INVALID_TEST_JOB_ID',
        message: 'x-test-target-job-id header must be a valid non-empty string.'
      }, { status: 400 });
    }

    // Stale lease timeout: 30 minutes
    const staleLeaseThreshold = new Date(Date.now() - 30 * 60 * 1000);

    // If targeted test leasing is enabled and requested, restrict candidate query strictly to the test-owned job
    const whereClause: any = (testTargetJobId && isTestLeasingAllowed)
      ? {
          id: testTargetJobId.trim(),
          OR: [
            { status: 'SCRIPTED' },
            { status: 'RENDERING', renderedAt: { lt: staleLeaseThreshold } }
          ]
        }
      : {
          OR: [
            { status: 'SCRIPTED' },
            { status: 'RENDERING', renderedAt: { lt: staleLeaseThreshold } }
          ]
        };

    // Find candidate job
    const candidate = await prisma.renderJob.findFirst({
      where: whereClause,
      orderBy: { createdAt: 'asc' },
    });

    if (!candidate) {
      return Response.json({ message: 'No pending jobs found' }, { status: 404 });
    }

    // Atomically transition status with condition on candidate's current status
    const updateResult = await prisma.renderJob.updateMany({
      where: {
        id: candidate.id,
        status: candidate.status,
      },
      data: {
        status: 'RENDERING',
        renderedAt: new Date(),
      },
    });

    if (updateResult.count === 0) {
      // Concurrently leased by another worker
      return Response.json({ message: 'Job leased concurrently, please retry' }, { status: 409 });
    }

    const updatedJob = await prisma.renderJob.findUnique({ where: { id: candidate.id } });
    if (!updatedJob) {
      return Response.json({ message: 'Job no longer available' }, { status: 404 });
    }

    // Revalidate package at worker leasing boundary: fail closed on malformed or contradictory package
    if (updatedJob.contentPackage) {
      let parsedPkg: any;
      try {
        parsedPkg = typeof updatedJob.contentPackage === 'string'
          ? JSON.parse(updatedJob.contentPackage)
          : updatedJob.contentPackage;
      } catch {
        parsedPkg = null;
      }
      const validation = validateContentPackage(parsedPkg);
      if (!validation.valid) {
        const errorMsg = `CONTENT_PACKAGE_INVALID_ON_LEASE: ${validation.errors.join('; ')}`;
        await prisma.renderJob.update({
          where: { id: updatedJob.id },
          data: {
            status: 'FAILED',
            error: errorMsg,
          },
        });
        return Response.json({
          error: 'CONTENT_PACKAGE_INVALID',
          message: 'Job contains invalid contentPackage and cannot be dispatched to worker',
          details: validation.errors
        }, { status: 422 });
      }

      if (parsedPkg.packageFingerprint) {
        const fingerprintMatches = verifyPackageFingerprint(parsedPkg, parsedPkg.packageFingerprint);
        if (!fingerprintMatches) {
          const errorMsg = `CONTENT_PACKAGE_MUTATED_ON_LEASE: Package fingerprint does not match approved digest.`;
          await prisma.renderJob.update({
            where: { id: updatedJob.id },
            data: {
              status: 'FAILED',
              error: errorMsg,
            },
          });
          return Response.json({
            error: 'PACKAGE_FINGERPRINT_MISMATCH',
            message: 'Job package was modified after approval. Leased worker dispatch rejected.',
          }, { status: 422 });
        }
      }
    }

    // Fetch system settings for pipeline parameters
    const settings = await prisma.systemSettings.findUnique({ where: { id: 1 } });
    const copyPasteMode = settings?.copyPasteMode || 'clone_avatar';
    const targetChannels = settings?.targetChannels || 'Alex Hormozi, Andrew Huberman, Motivation';

    // Accurately map jobType from job.videoStyle or settings.copyPasteMode
    let jobType = 'clone';
    if (updatedJob.videoStyle === 'REMASTER_REACTION') {
      jobType = 'clone';
    } else if (updatedJob.videoStyle === 'CURIOSITY_SPLITSCREEN') {
      jobType = 'aggregator';
    } else if (updatedJob.videoStyle === 'STANDARD' || updatedJob.videoStyle === 'PRODUCT_FIND') {
      jobType = 'generative';
    } else {
      jobType = copyPasteMode === 'split_screen' ? 'aggregator' : (copyPasteMode === 'renarration' || copyPasteMode === 'generative' ? 'generative' : 'clone');
    }

    return Response.json({ 
      status: 'success', 
      job: {
        ...updatedJob,
        jobType
      },
      config: {
        copy_paste_mode: copyPasteMode,
        target_channels: targetChannels,
        replace_original_audio: settings?.replaceOriginalAudio ?? false
      }
    });
  } catch (err) {
    console.error('[Worker Job] Error:', err);
    return Response.json({ error: String(err) }, { status: 500 });
  }
}
