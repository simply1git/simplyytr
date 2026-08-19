import { verifyAuth, unauthorized, prisma } from '../../lib/utils';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET(request: Request) {
  try {
    if (!verifyAuth(request)) return unauthorized();

    const trends = await prisma.trendSignal.findMany({
      select: { youtubeId: true },
    });

    const jobs = await prisma.renderJob.findMany({
      select: { topic: true, generatedTitle: true },
      take: 500,
    });

    const usedVideoIds = Array.from(new Set([
      ...trends.map(t => t.youtubeId).filter(Boolean),
      ...jobs.map(j => j.topic).filter(Boolean),
      ...jobs.map(j => j.generatedTitle).filter(Boolean),
    ]));

    return Response.json({ usedVideoIds });
  } catch (error: any) {
    console.error('History GET error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    if (!verifyAuth(request)) return unauthorized();

    const { youtubeId, topic = "used" } = await request.json();

    if (!youtubeId) {
      return Response.json({ error: 'Missing youtubeId' }, { status: 400 });
    }

    const trend = await prisma.trendSignal.upsert({
      where: { youtubeId },
      create: { 
        youtubeId, 
        topic,
        downloadStatus: "PROCESSED"
      },
      update: {
        downloadStatus: "PROCESSED"
      }
    });

    return Response.json({ success: true, trend });
  } catch (error: any) {
    console.error('History POST error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
}
