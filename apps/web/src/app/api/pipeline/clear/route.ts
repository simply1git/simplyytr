import { NextRequest } from 'next/server';
import { verifyAuth, unauthorized, prisma } from '../../lib/utils';

export const maxDuration = 60;
export const dynamic = 'force-dynamic';

// POST /api/pipeline/clear
// Clears render jobs from the database (all, failed, or pending)
export async function POST(request: NextRequest) {
  if (!verifyAuth(request)) return unauthorized();

  try {
    const body = await request.json().catch(() => ({}));
    const mode = body.mode || 'all';

    let deletedCount = 0;

    if (mode === 'failed') {
      const result = await prisma.renderJob.deleteMany({
        where: { status: 'FAILED' }
      });
      deletedCount = result.count;
    } else if (mode === 'pending') {
      const result = await prisma.renderJob.deleteMany({
        where: { status: { in: ['PENDING', 'SCRIPTED', 'RENDERING'] } }
      });
      deletedCount = result.count;
    } else {
      // Clear all jobs
      const result = await prisma.renderJob.deleteMany({});
      deletedCount = result.count;
    }

    return Response.json({
      status: 'success',
      mode,
      deletedCount,
      message: `Cleared ${deletedCount} render job(s) from the database.`
    });
  } catch (err) {
    console.error('[Pipeline Clear] Error:', err);
    return Response.json({ error: String(err) }, { status: 500 });
  }
}
