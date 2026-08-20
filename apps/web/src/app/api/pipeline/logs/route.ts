import { NextRequest } from 'next/server';
import { prisma } from '../../lib/utils';
import { getSystemLogs, clearSystemLogs, logSystemEvent } from '../../lib/logStore';
import { getCircuitStatus } from '../../lib/circuitBreaker';

export const maxDuration = 60;
export const dynamic = 'force-dynamic';

// GET /api/pipeline/logs
// Returns live telemetry logs, active rendering jobs, and cluster health
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const level = searchParams.get('level') || 'ALL';
    const stage = searchParams.get('stage') || 'ALL';
    const limit = parseInt(searchParams.get('limit') || '100');

    // 1. Fetch in-memory ring-buffer logs
    const logs = getSystemLogs({ level, stage, limit });

    // 2. Fetch current active rendering / scripted job
    const activeJob = await prisma.renderJob.findFirst({
      where: { status: { in: ['RENDERING', 'SCRIPTED'] } },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        status: true,
        topic: true,
        generatedTitle: true,
        statusMessage: true,
        videoStyle: true,
        renderEngine: true,
        createdAt: true,
        scriptedAt: true,
        renderedAt: true,
        error: true,
      }
    });

    // 3. System settings & worker heartbeat
    const settings = await prisma.systemSettings.findUnique({ where: { id: 1 } });
    const isWorkerOnline = settings?.workerLastActiveAt 
      ? (Date.now() - new Date(settings.workerLastActiveAt).getTime()) < 120000 
      : false;

    // 4. Circuit Breaker status
    const circuit = await getCircuitStatus();

    return Response.json({
      status: 'success',
      timestamp: new Date().toISOString(),
      activeJob: activeJob || null,
      workerStatus: {
        isOnline: isWorkerOnline,
        lastHeartbeat: settings?.workerLastActiveAt || null,
        renderEngine: settings?.renderEngine || 'HYBRID',
        autoPilotEnabled: settings?.autoPilotEnabled || false,
        autoPublishOnline: settings?.autoPublishOnline || false
      },
      circuitStatus: circuit,
      logsCount: logs.length,
      logs
    });
  } catch (err: any) {
    console.error('[Logs API] Error:', err);
    return Response.json({
      status: 'error',
      error: String(err.message || err),
      logs: getSystemLogs({ limit: 50 })
    }, { status: 200 });
  }
}

// POST /api/pipeline/logs
// Clears logs or logs a manual debug test message
export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const { action, message, level } = body;

    if (action === 'clear') {
      clearSystemLogs();
      return Response.json({ status: 'success', message: 'Telemetry log buffer cleared.' });
    }

    if (action === 'test') {
      const entry = logSystemEvent({
        level: level || 'INFO',
        stage: 'SYSTEM',
        message: message || 'Manual Diagnostic Ping from Dashboard',
        details: { triggeredBy: 'Admin Debug Console', timestamp: new Date().toISOString() }
      });
      return Response.json({ status: 'success', entry });
    }

    return Response.json({ error: 'Unsupported action' }, { status: 400 });
  } catch (err: any) {
    return Response.json({ error: String(err) }, { status: 500 });
  }
}
