import { NextRequest } from 'next/server';
import { verifyAuth, unauthorized, prisma } from '../../lib/utils';

// GET /api/pipeline/worker-job
// Called by the Kaggle GPU worker to get the next SCRIPTED job
export async function GET(request: NextRequest) {
  if (!verifyAuth(request)) return unauthorized();

  try {
    const workerVersion = request.headers.get('x-worker-version');
    if (workerVersion !== '31') {
      return Response.json({ error: 'Outdated Kaggle Worker. Update to version 31' }, { status: 404 });
    }

    // Find the oldest SCRIPTED job
    const job = await prisma.renderJob.findFirst({
      where: { status: 'SCRIPTED' },
      orderBy: { createdAt: 'asc' },
    });

    if (!job) {
      return Response.json({ message: 'No pending jobs found' }, { status: 404 });
    }

    // Mark as RENDERING
    const updatedJob = await prisma.renderJob.update({
      where: { id: job.id },
      data: { status: 'RENDERING', renderedAt: new Date() },
    });

    // Fetch system settings for pipeline parameters
    const settings = await prisma.systemSettings.findUnique({ where: { id: 1 } });
    const copyPasteMode = settings?.copyPasteMode || 'clone_avatar';
    const targetChannels = settings?.targetChannels || 'Alex Hormozi, Andrew Huberman, Motivation';

    return Response.json({ 
      status: 'success', 
      job: {
        ...updatedJob,
        jobType: copyPasteMode === 'split_screen' ? 'aggregator' : (copyPasteMode === 'renarration' ? 'generative' : 'clone')
      },
      config: {
        r2_account_id: process.env.R2_ACCOUNT_ID,
        r2_access_key_id: process.env.R2_ACCESS_KEY_ID,
        r2_secret_access_key: process.env.R2_SECRET_ACCESS_KEY,
        r2_bucket_name: process.env.R2_BUCKET_NAME,
        r2_public_url: process.env.R2_PUBLIC_URL,
        webhook_url: `${process.env.VERCEL_API_URL || 'https://simplyytr.vercel.app'}/api/pipeline/webhook`,
        pexels_api_key: process.env.PEXELS_API_KEY,
        copy_paste_mode: copyPasteMode,
        target_channels: targetChannels
      }
    });
  } catch (err) {
    console.error('[Worker Job] Error:', err);
    return Response.json({ error: String(err) }, { status: 500 });
  }
}
