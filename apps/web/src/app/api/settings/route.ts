import { NextRequest } from 'next/server';
import { prisma } from '../lib/utils';

// GET /api/settings
export async function GET() {
  try {
    let settings = await prisma.systemSettings.findUnique({ where: { id: 1 } });
    if (!settings) {
      settings = await prisma.systemSettings.create({ data: {} });
    }
    return Response.json({ settings });
  } catch (err) {
    return Response.json({ error: String(err) }, { status: 500 });
  }
}

// POST /api/settings
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Clean up body so we don't pass id or updatedAt to update
    const { id, updatedAt, createdAt, ...updateData } = body;

    const settings = await prisma.systemSettings.update({
      where: { id: 1 },
      data: updateData,
    });
    
    return Response.json({ status: 'success', settings });
  } catch (err) {
    console.error('[Settings] Error:', err);
    return Response.json({ error: String(err) }, { status: 500 });
  }
}
