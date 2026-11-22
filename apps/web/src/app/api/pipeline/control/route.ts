import { NextRequest } from 'next/server';
import { verifyAuth, unauthorized, prisma } from '../../lib/utils';
import { validateContentPackage, computePackageFingerprint, type ContentPackage } from '../../lib/contentContract';
import { generateTopicGroundedPackage } from '../../lib/topicGroundedGenerator';

export const maxDuration = 60;
export const dynamic = 'force-dynamic';

// POST /api/pipeline/control
// Handles global pipeline action controls: START, STOP, CLEAR, APPROVE, RETRY
export async function POST(request: NextRequest) {
  if (!verifyAuth(request)) return unauthorized();

  try {
    const body = await request.json().catch(() => ({}));
    const { action, mode, jobId, contentPackage: inputPackage, qualityProfile: requestedProfile } = body;

    if (!action || !['start', 'stop', 'clear', 'approve', 'retry', 'render', 'render_local'].includes(action)) {
      return Response.json({ error: 'Action must be one of: start, stop, clear, approve, retry, render, render_local' }, { status: 400 });
    }

    if (action === 'render' || action === 'render_local') {
      if (!jobId) {
        return Response.json({ error: 'jobId is required for render action' }, { status: 400 });
      }
      const existing = await prisma.renderJob.findUnique({ where: { id: jobId } });
      if (!existing) {
        return Response.json({ error: 'Job not found' }, { status: 404 });
      }

      // Prevent accidental duplicate submissions
      if (existing.status === 'RENDERING') {
        return Response.json({
          error: 'JOB_ALREADY_RENDERING',
          message: `Job ${jobId} is currently rendering. Duplicate render rejected.`
        }, { status: 409 });
      }

      // Validate optional qualityProfile override
      if (requestedProfile && requestedProfile !== 'STANDARD' && requestedProfile !== 'CINEMATIC_PRO') {
        return Response.json({ error: 'qualityProfile must be "STANDARD" or "CINEMATIC_PRO"' }, { status: 400 });
      }

      let currentPkg: any = null;
      if (existing.contentPackage) {
        try {
          currentPkg = typeof existing.contentPackage === 'string'
            ? JSON.parse(existing.contentPackage)
            : existing.contentPackage;
        } catch {}
      }

      const profileToUse = requestedProfile || currentPkg?.qualityProfile || 'STANDARD';
      if (currentPkg) {
        currentPkg.qualityProfile = profileToUse;
      }

      // Set to SCRIPTED first if needed so worker lease succeeds, then spawn worker
      await prisma.renderJob.update({
        where: { id: jobId },
        data: {
          status: 'SCRIPTED',
          error: null,
          contentPackage: currentPkg as any,
          statusMessage: `Queued for local render (Profile: ${profileToUse})`
        }
      });

      const { spawn } = await import('child_process');
      const path = await import('path');
      const isWebSubdir = process.cwd().endsWith('apps\\web') || process.cwd().endsWith('apps/web');
      const workspaceRoot = path.resolve(process.cwd(), isWebSubdir ? '../..' : '.');
      const hookPath = path.resolve(workspaceRoot, 'scripts/register_hook.mjs');
      const workerPath = path.resolve(workspaceRoot, 'scripts/local_worker.mjs');

      const workerProcess = spawn(process.execPath, [
        '--import', `file:///${hookPath.replace(/\\/g, '/')}`,
        workerPath,
        '--once',
        `--job-id=${jobId}`
      ], {
        cwd: workspaceRoot,
        env: {
          ...process.env,
          TARGET_JOB_ID: jobId,
          ALLOW_TEST_JOB_LEASING: 'true',
          QUALITY_PROFILE: profileToUse
        },
        detached: true,
        stdio: 'ignore'
      });
      workerProcess.unref();

      return Response.json({
        status: 'success',
        action: 'render',
        jobId: existing.id,
        qualityProfile: profileToUse,
        message: `Local render dispatched for Job ${jobId} using profile ${profileToUse}. Status will update upon completion.`
      });
    }

    if (action === 'approve') {
      if (!jobId) {
        return Response.json({ error: 'jobId is required for approve action' }, { status: 400 });
      }
      const existing = await prisma.renderJob.findUnique({ where: { id: jobId } });
      if (!existing) {
        return Response.json({ error: 'Job not found' }, { status: 404 });
      }

      // Resolve candidate ContentPackage
      let candidatePackage: ContentPackage | null = null;
      if (inputPackage) {
        candidatePackage = inputPackage;
      } else if (existing.contentPackage) {
        candidatePackage = typeof existing.contentPackage === 'string'
          ? JSON.parse(existing.contentPackage)
          : (existing.contentPackage as unknown as ContentPackage);
      } else {
        // Generate topic-grounded package if none exists
        candidatePackage = generateTopicGroundedPackage(existing.topic, {
          style: existing.videoStyle,
          version: '1.0.0'
        });
      }

      // Mark candidate as APPROVED for validation check
      if (candidatePackage) {
        candidatePackage.reviewStatus = 'APPROVED';
        // Operator review explicit evidence transition:
        // Do NOT silently convert unverified claims into externally verified claims (verified remains false).
        // Set evidenceStatus to 'operator_reviewed' for human-approved claims without recorded external evidence.
        if (Array.isArray(candidatePackage.claims)) {
          for (const c of candidatePackage.claims) {
            if (!c.verified && (c.evidenceStatus === 'unverified' || c.evidenceStatus === 'source_located' || !c.evidenceStatus)) {
              c.evidenceStatus = 'operator_reviewed';
            }
          }
        }
      }

      // Validate contract at pipeline boundary - reject invalid or inconsistent fields
      const validation = validateContentPackage(candidatePackage);
      if (!validation.valid || !validation.package) {
        return Response.json({
          error: 'CONTENT_PACKAGE_INVALID',
          message: 'Approved content package failed strict validation boundary',
          details: validation.errors
        }, { status: 422 });
      }

      const approvedPackage = validation.package;
      const packageFingerprint = computePackageFingerprint(approvedPackage);
      (approvedPackage as any).packageFingerprint = packageFingerprint;

      const updated = await prisma.renderJob.update({
        where: { id: jobId },
        data: {
          status: 'SCRIPTED',
          contentPackage: approvedPackage as any,
          scriptHook: approvedPackage.segments[0].text,
          scriptBody: approvedPackage.segments.slice(1, -1).map(s => s.text).join(' ') || approvedPackage.segments[1].text,
          scriptCta: approvedPackage.segments[approvedPackage.segments.length - 1].text,
          generatedTitle: approvedPackage.proposedTitle,
          visualPrompts: approvedPackage.segments.map(s => s.visualPlan.description),
          error: null,
          statusMessage: `Approved by operator with ContentPackage v${approvedPackage.version} [fp:${packageFingerprint.slice(0, 16)}]`,
        },
      });

      return Response.json({
        status: 'success',
        action: 'approve',
        jobId: updated.id,
        newStatus: updated.status,
        packageVersion: approvedPackage.version,
        packageFingerprint,
        message: `Job ${jobId} approved with ContentPackage v${approvedPackage.version} [fp:${packageFingerprint.slice(0, 16)}] and released to SCRIPTED queue.`
      });
    }

    if (action === 'retry') {
      if (!jobId) {
        return Response.json({ error: 'jobId is required for retry action' }, { status: 400 });
      }
      const existing = await prisma.renderJob.findUnique({ where: { id: jobId } });
      if (!existing) {
        return Response.json({ error: 'Job not found' }, { status: 404 });
      }

      // Revalidate package at retry boundary: ensure retry does not bypass validation
      if (existing.contentPackage) {
        let parsedPkg: any;
        try {
          parsedPkg = typeof existing.contentPackage === 'string'
            ? JSON.parse(existing.contentPackage)
            : existing.contentPackage;
        } catch {
          parsedPkg = null;
        }
        const validation = validateContentPackage(parsedPkg);
        if (!validation.valid) {
          return Response.json({
            error: 'CONTENT_PACKAGE_INVALID',
            message: 'Cannot retry job: existing content package fails strict contract validation',
            details: validation.errors
          }, { status: 422 });
        }
      }

      // Retrying MUST NOT silently replace the approved script, claims, or visual plan.
      // It preserves the exact approved contentPackage.
      const updated = await prisma.renderJob.update({
        where: { id: jobId },
        data: {
          status: 'SCRIPTED',
          error: null,
          renderedAt: null,
          statusMessage: 'Retried by operator preserving approved content package',
        },
      });
      return Response.json({
        status: 'success',
        action: 'retry',
        jobId: updated.id,
        newStatus: updated.status,
        message: `Job ${jobId} reset to SCRIPTED queue for retry preserving approved package version.`
      });
    }

    if (action === 'start') {
      // Enable autopilot in system settings
      await prisma.systemSettings.update({
        where: { id: 1 },
        data: { autoPilotEnabled: true }
      });

      // Wake up Kaggle via GitHub Actions API if PAT is configured
      const ghToken = process.env.GITHUB_PAT || process.env.GITHUB_TOKEN;
      if (ghToken) {
        try {
          await fetch('https://api.github.com/repos/simply1git/simplyytr/actions/workflows/trigger-kaggle.yml/dispatches', {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${ghToken}`,
              'Accept': 'application/vnd.github.v3+json',
              'User-Agent': 'Vercel-Pipeline-Control'
            },
            body: JSON.stringify({ ref: 'main' })
          });
        } catch (e) {
          console.warn('GitHub Action trigger warning:', e);
        }
      }

      return Response.json({
        status: 'success',
        action: 'start',
        message: 'Pipeline STARTED! Auto-Pilot enabled and Kaggle GPU worker triggered.'
      });
    }

    if (action === 'stop') {
      // Disable autopilot in system settings
      await prisma.systemSettings.update({
        where: { id: 1 },
        data: { autoPilotEnabled: false }
      });

      return Response.json({
        status: 'success',
        action: 'stop',
        message: 'Pipeline STOPPED! Auto-Pilot disabled.'
      });
    }

    if (action === 'clear') {
      let result;
      if (mode === 'failed') {
        result = await prisma.renderJob.deleteMany({ where: { status: 'FAILED' } });
      } else if (mode === 'pending') {
        result = await prisma.renderJob.deleteMany({ where: { status: { in: ['PENDING', 'SCRIPTED', 'RENDERING'] } } });
      } else {
        result = await prisma.renderJob.deleteMany({});
      }

      return Response.json({
        status: 'success',
        action: 'clear',
        deletedCount: result.count,
        message: `Cleared ${result.count} render job(s) from the database.`
      });
    }
  } catch (err) {
    console.error('[Pipeline Control] Error:', err);
    return Response.json({ error: String(err) }, { status: 500 });
  }
}
