import { NextRequest } from 'next/server';
import { verifyAuth, unauthorized, prisma } from '../../lib/utils';

export const maxDuration = 60;
export const dynamic = 'force-dynamic';

// POST /api/pipeline/control
// Handles global pipeline action controls: START, STOP, and CLEAR
export async function POST(request: NextRequest) {
  if (!verifyAuth(request)) return unauthorized();

  try {
    const body = await request.json();
    const { action, mode } = body;

    if (!action || !['start', 'stop', 'clear'].includes(action)) {
      return Response.json({ error: 'Action must be one of: start, stop, clear' }, { status: 400 });
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
