import { NextRequest } from 'next/server';
import { verifyAuth, unauthorized, prisma } from '../../lib/utils';

export const maxDuration = 60;
export const dynamic = 'force-dynamic';

// POST /api/pipeline/worker-status
// Called by Kaggle to update live rendering logs
export async function POST(request: NextRequest) {
  if (!verifyAuth(request)) return unauthorized();

  try {
    const body = await request.json();
    const { jobId, message } = body;

    if (!jobId || !message) {
      return Response.json({ error: 'jobId and message are required' }, { status: 400 });
    }

    await prisma.renderJob.update({
      where: { id: jobId },
      data: { statusMessage: message },
    });

    // Log to real-time telemetry console
    const { logSystemEvent } = await import('../../lib/logStore');
    logSystemEvent({
      level: 'WORKER',
      stage: 'RENDERING',
      jobId,
      message: `[Kaggle GPU Worker] (Job ${jobId.slice(-8)}) -> ${message}`
    });

    // Update worker active status
    await prisma.systemSettings.update({
      where: { id: 1 },
      data: { workerLastActiveAt: new Date() }
    });

    return Response.json({ status: 'success' });
  } catch (err) {
    console.error('[Worker Status] Error:', err);
    return Response.json({ error: String(err) }, { status: 500 });
  }
}
