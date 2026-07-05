import { NextRequest } from 'next/server';
import { verifyAuth, unauthorized, prisma } from '../../lib/utils';

// GET /api/pipeline/ready-jobs
// Called by the local uploader agent to fetch videos that are ready for upload.
export async function GET(request: NextRequest) {
  if (!verifyAuth(request)) return unauthorized();

  try {
    const readyJobs = await prisma.renderJob.findMany({
      where: { status: 'READY' },
      orderBy: { createdAt: 'asc' },
      take: 5,
      select: {
        id: true,
        topic: true,
        generatedTitle: true,
        generatedDescription: true,
        generatedTags: true,
        videoUrl: true,
        thumbnailUrl: true,
        voiceName: true,
        niche: true,
        createdAt: true,
      },
    });

    return Response.json({
      count: readyJobs.length,
      jobs: readyJobs,
    });
  } catch (err) {
    console.error('[Ready Jobs] Error:', err);
    return Response.json({ error: String(err) }, { status: 500 });
  }
}
