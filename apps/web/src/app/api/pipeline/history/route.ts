import { NextResponse } from 'next/server';
import { prisma } from '../../lib/utils';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET(request: Request) {
  try {
    const authHeader = request.headers.get('Authorization');
    if (authHeader !== `Bearer ${process.env.PIPELINE_SECRET}`) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const trends = await prisma.trendSignal.findMany({
      select: { youtubeId: true },
    });

    const usedVideoIds = trends.map(t => t.youtubeId);
    return Response.json({ usedVideoIds });
  } catch (error: any) {
    console.error('History GET error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const authHeader = request.headers.get('Authorization');
    if (authHeader !== `Bearer ${process.env.PIPELINE_SECRET}`) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

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
