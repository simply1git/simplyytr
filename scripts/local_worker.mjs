/**
 * SIMPLYYTR 2.0 — Canonical Local Worker Service
 * 
 * Safely claims SCRIPTED jobs via GET /api/pipeline/worker-job,
 * invokes renderJobLocally() with authentic spoken TTS and subtitles,
 * verifies the real output artifact on disk, and posts completion to POST /api/pipeline/webhook.
 * 
 * Usage:
 *   node scripts/local_worker.mjs          # Continuous polling loop
 *   node scripts/local_worker.mjs --once   # One-shot iteration (test / cron mode)
 */

import 'dotenv/config';
import fs from 'node:fs';
import path from 'node:path';

// Load localRenderer using dynamic import
const rendererPath = path.resolve(process.cwd(), 'apps/backend/src/services/localRenderer.ts');
const { renderJobLocally } = await import(`file://${rendererPath.replace(/\\/g, '/')}`);

const envUrl = process.env.WORKER_API_URL || process.env.WEB_URL;
const vercelUrl = process.env.VERCEL_API_URL;
const baseUrl = envUrl || (vercelUrl && !vercelUrl.includes('your-app') ? vercelUrl : 'http://localhost:3000');
const secret = process.env.PIPELINE_SECRET;
const isOnce = process.argv.includes('--once');
const pollIntervalMs = parseInt(process.env.WORKER_POLL_INTERVAL || '3000', 10);

if (!secret) {
  console.error('[Local Worker] ERROR: PIPELINE_SECRET is not configured in environment.');
  process.exit(1);
}

console.log('===============================================================');
console.log(' SIMPLYYTR 2.0 Local Media Worker Daemon');
console.log(` Target API: ${baseUrl}`);
console.log(` Mode: ${isOnce ? 'ONE-SHOT (--once)' : 'CONTINUOUS POLLING'}`);
console.log('===============================================================\n');

let isProcessing = false;

export async function processNextJob(targetJobId = null) {
  if (isProcessing) return null;
  isProcessing = true;

  try {
    const headers = {
      'Authorization': `Bearer ${secret}`,
      'x-worker-version': '36',
      'User-Agent': 'SIMPLYYTR-LocalWorker/2.0'
    };
    if (targetJobId) {
      headers['x-test-target-job-id'] = targetJobId;
    }

    // 1. Lease next SCRIPTED job from the API
    const leaseRes = await fetch(`${baseUrl}/api/pipeline/worker-job`, {
      method: 'GET',
      headers
    });

    if (leaseRes.status === 404) {
      // No jobs available
      return { status: 'idle', message: 'No pending jobs found' };
    }

    if (leaseRes.status === 409) {
      console.warn('[Local Worker] Concurrently claimed by another worker. Retrying.');
      return { status: 'conflict', message: 'Concurrent claim collision' };
    }

    if (!leaseRes.ok) {
      const errText = await leaseRes.text();
      console.error(`[Local Worker] Worker-job lease HTTP error ${leaseRes.status}:`, errText);
      return { status: 'error', error: `HTTP ${leaseRes.status}: ${errText}` };
    }

    const leaseData = await leaseRes.json();
    const job = leaseData.job;
    if (!job || !job.id) {
      return { status: 'idle', message: 'No job payload in response' };
    }

    console.log(`[Local Worker] Claimed Job ${job.id} | Topic: "${job.topic}" | Style: ${job.videoStyle}`);

    // 2. Execute local media rendering (TTS + kinetic captions + graphics)
    console.log(`[Local Worker] Beginning local render for Job ${job.id}...`);
    const renderResult = await renderJobLocally(job.id);

    // 3. Verify the generated artifact on disk
    if (renderResult.success && renderResult.videoPath) {
      const videoExists = fs.existsSync(renderResult.videoPath);
      const videoSize = videoExists ? fs.statSync(renderResult.videoPath).size : 0;

      if (!videoExists || videoSize < 5000) {
        console.error(`[Local Worker] Render claimed success but artifact missing or too small (${videoSize} bytes)`);
        await postWebhook(job.id, {
          error: `ARTIFACT_CORRUPT: Video file is missing or only ${videoSize} bytes.`
        });
        return { status: 'failed', jobId: job.id, error: 'Artifact missing/corrupted' };
      }

      console.log(`[Local Worker] Render successful (${videoSize} bytes, ${renderResult.durationSec}s, Engine: ${renderResult.ttsEngine || 'SAPI'})`);

      // 4. Report verified completion to Webhook
      const safeMediaUrl = renderResult.mediaUrl || `/api/media/${path.basename(renderResult.videoPath)}`;
      const safeThumbUrl = renderResult.thumbnailUrl || (renderResult.thumbnailPath ? `/api/media/${path.basename(renderResult.thumbnailPath)}` : null);

      await postWebhook(job.id, {
        videoUrl: safeMediaUrl,
        thumbnailUrl: safeThumbUrl
      });

      console.log(`[Local Worker] Job ${job.id} verified and updated to READY!`);
      return { status: 'ready', jobId: job.id, renderResult };
    } else {
      console.error(`[Local Worker] Rendering failed for Job ${job.id}:`, renderResult.error);
      await postWebhook(job.id, {
        error: renderResult.error || 'Unknown local rendering failure.'
      });
      return { status: 'failed', jobId: job.id, error: renderResult.error };
    }
  } catch (err) {
    console.error('[Local Worker] Uncaught cycle error:', err);
    return { status: 'error', error: err.message };
  } finally {
    isProcessing = false;
  }
}

async function postWebhook(jobId, payload) {
  try {
    const res = await fetch(`${baseUrl}/api/pipeline/webhook`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${secret}`,
        'User-Agent': 'SIMPLYYTR-LocalWorker/2.0'
      },
      body: JSON.stringify({
        jobId,
        ...payload
      })
    });

    if (!res.ok) {
      console.error(`[Local Worker] Webhook returned HTTP ${res.status}:`, await res.text());
    }
  } catch (e) {
    console.error('[Local Worker] Failed to dispatch webhook callback:', e.message);
  }
}

// Execution runner - only run if executed directly as main script
const isMain = process.argv[1] && (
  process.argv[1].endsWith('local_worker.mjs') ||
  process.argv[1].endsWith('local_worker.js')
);

const targetJobArg = process.argv.find(a => a.startsWith('--job-id='))?.split('=')[1] || process.env.TARGET_JOB_ID || null;

if (isMain) {
  if (isOnce) {
    const result = await processNextJob(targetJobArg);
    console.log('[Local Worker] One-shot completed:', result);
    setTimeout(() => process.exit(0), 50);
  } else {
    console.log(`[Local Worker] Polling every ${pollIntervalMs}ms... (Press Ctrl+C to stop)`);
    setInterval(async () => {
      await processNextJob();
    }, pollIntervalMs);
  }
}
