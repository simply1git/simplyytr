import { NextRequest } from 'next/server';
import { verifyAuth, unauthorized, prisma } from '../../lib/utils';

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

    return Response.json({ status: 'success' });
  } catch (err) {
    console.error('[Worker Status] Error:', err);
    return Response.json({ error: String(err) }, { status: 500 });
  }
}
