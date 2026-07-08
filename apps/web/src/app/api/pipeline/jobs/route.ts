import { NextRequest } from 'next/server';
import { verifyAuth, unauthorized, prisma } from '../../lib/utils';

// GET /api/pipeline/jobs
// Returns all render jobs with their statuses for the dashboard.
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const limit = parseInt(searchParams.get('limit') || '50');

    const where = status ? { status } : {};
    const jobs = await prisma.renderJob.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: Math.min(limit, 100),
      select: {
        id: true,
        status: true,
        topic: true,
        generatedTitle: true,
        voiceName: true,
        views: true,
        ctr: true,
        statusMessage: true,
        error: true,
        createdAt: true,
        scriptedAt: true,
        renderedAt: true,
        uploadedAt: true,
        publishedYoutubeId: true,
        videoUrl: true,
        thumbnailUrl: true,
      },
    });

    // Get counts per status
    const counts = await prisma.renderJob.groupBy({
      by: ['status'],
      _count: { id: true },
    });

    const statusCounts = counts.reduce((acc, c) => {
      acc[c.status] = c._count.id;
      return acc;
    }, {} as Record<string, number>);

    return Response.json({ jobs, statusCounts, total: jobs.length });
  } catch (err) {
    console.error('[Pipeline Jobs] Error:', err);
    return Response.json({ error: String(err) }, { status: 500 });
  }
}
