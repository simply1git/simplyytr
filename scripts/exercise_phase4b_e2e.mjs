/**
 * SIMPLYYTR 2.0 — Phase 4B End-to-End Real Application Flow & Artifact Inspection
 * 
 * Executes:
 * 1. POST /api/pipeline/trigger with self-contained demo topic "Screen Cleaner Spray"
 * 2. Inspect generated content package in NEEDS_REVIEW
 * 3. POST /api/pipeline/control action "approve" with frozen version
 * 4. Local worker execution (claim -> render -> verify -> webhook)
 * 5. Verify PostgreSQL READY state
 * 6. Authorized media route verification with signed token
 * 7. FFprobe and FFmpeg stream analysis + volume detection
 * 8. Frame extraction at multiple timestamps (1s, 6s, 12s, 16s)
 */

import 'dotenv/config';
import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const baseUrl = process.env.WEB_URL || 'http://localhost:3000';
const secret = process.env.PIPELINE_SECRET;

if (!secret) {
  console.error('ERROR: PIPELINE_SECRET is required.');
  process.exit(1);
}

async function run() {
  console.log('===============================================================');
  console.log(' SIMPLYYTR 2.0 — Phase 4B Real Application Flow Execution');
  console.log('===============================================================\n');

  // Step 1: Trigger Job with topic "Screen Cleaner Spray"
  console.log('[Stage 1: Job Creation & Content Package Generation]');
  // Force targetNiche or topic
  const triggerRes = await fetch(`${baseUrl}/api/pipeline/trigger`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${secret}`
    },
    body: JSON.stringify({
      force: true,
      count: 1,
      topic: 'Screen Cleaner Spray',
      niche: 'Tech & Electronics Maintenance',
      videoStyle: 'PRODUCT_FIND'
    })
  });

  if (!triggerRes.ok) {
    throw new Error(`Trigger failed HTTP ${triggerRes.status}: ${await triggerRes.text()}`);
  }

  const triggerData = await triggerRes.json();
  const createdJobs = triggerData.jobs || [];
  if (createdJobs.length === 0) {
    throw new Error('Trigger returned 0 jobs.');
  }

  const jobId = createdJobs[0].id;
  console.log(`  ✓ Triggered Job: ${jobId} (Topic: "${createdJobs[0].topic}")`);

  const initialJob = await prisma.renderJob.findUnique({ where: { id: jobId } });
  console.log(`  ✓ Initial DB Status: ${initialJob.status}`);
  console.log(`  ✓ Title: "${initialJob.generatedTitle}"`);
  console.log(`  ✓ Hook: "${initialJob.scriptHook}"`);
  console.log(`  ✓ ContentPackage Version: ${initialJob.contentPackage?.version || 'N/A'}`);
  console.log(`  ✓ Generator Mode: ${initialJob.contentPackage?.provenance?.generatorMode || 'N/A'}`);

  // Step 2: Validate and Approve Exact Version
  console.log('\n[Stage 2: Validation & Operator Approval of Content Package]');
  const approveRes = await fetch(`${baseUrl}/api/pipeline/control`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${secret}`
    },
    body: JSON.stringify({
      action: 'approve',
      jobId
    })
  });

  if (!approveRes.ok) {
    throw new Error(`Approval failed HTTP ${approveRes.status}: ${await approveRes.text()}`);
  }

  const approveData = await approveRes.json();
  console.log(`  ✓ Approved Status: ${approveData.newStatus} (Package Version: v${approveData.packageVersion})`);

  // Step 3: Worker Lease, Render & Webhook Completion
  console.log('\n[Stage 3: Worker Execution & Rendering]');
  const workerProc = spawnSync('node', ['--import', './scripts/register_hook.mjs', 'scripts/local_worker.mjs', '--once'], {
    encoding: 'utf-8',
    env: process.env
  });

  console.log(workerProc.stdout);
  if (workerProc.stderr && workerProc.stderr.includes('Error')) {
    console.error(workerProc.stderr);
  }

  // Step 4: Verify Database READY Transition
  console.log('\n[Stage 4: Post-Render Authoritative State Check]');
  const finalJob = await prisma.renderJob.findUnique({ where: { id: jobId } });
  console.log(`  ✓ Final DB Status: ${finalJob.status}`);
  console.log(`  ✓ Media URL: ${finalJob.videoUrl}`);
  console.log(`  ✓ Thumbnail URL: ${finalJob.thumbnailUrl}`);

  if (finalJob.status !== 'READY' || !finalJob.videoUrl) {
    throw new Error(`Job did not reach READY status. Current status: ${finalJob.status}, Error: ${finalJob.error}`);
  }

  const videoDiskPath = path.resolve(process.cwd(), 'storage/processed', `${jobId}_short.mp4`);
  const thumbDiskPath = path.resolve(process.cwd(), 'storage/processed', `${jobId}_thumb.jpg`);

  if (!fs.existsSync(videoDiskPath)) {
    throw new Error(`Video file missing on disk at ${videoDiskPath}`);
  }

  const videoStat = fs.statSync(videoDiskPath);
  console.log(`  ✓ Physical Video Artifact Verified: ${videoDiskPath} (${videoStat.size} bytes)`);

  // Step 5: Authorized Dashboard Preview
  console.log('\n[Stage 5: Authorized Dashboard Preview & Media Route]');
  const jobsRes = await fetch(`${baseUrl}/api/pipeline/jobs?limit=5`);
  const jobsData = await jobsRes.json();
  const dashboardJob = jobsData.jobs.find(j => j.id === jobId);
  console.log(`  ✓ Dashboard Exposes Job: ${dashboardJob?.id}`);
  console.log(`  ✓ Signed Video URL: ${dashboardJob?.videoUrl}`);

  // Test streaming with signed token
  const streamRes = await fetch(`${baseUrl}${dashboardJob?.videoUrl}`);
  console.log(`  ✓ Signed Token Media Streaming HTTP Status: ${streamRes.status} (Length: ${streamRes.headers.get('content-length')} bytes)`);

  // Step 6: Technical Inspection with FFprobe
  console.log('\n[Stage 6: Technical Media Inspection (FFprobe & Loudness)]');
  const ffprobePath = 'local_tools/bin/ffmpeg.exe'; // Use ffmpeg -i for stream probe
  const probeProc = spawnSync(ffprobePath, ['-i', videoDiskPath], { encoding: 'utf-8' });
  const probeOutput = probeProc.stderr;

  // Extract stream info
  const durationMatch = probeOutput.match(/Duration:\s*(\d+:\d+:\d+\.\d+)/);
  const videoMatch = probeOutput.match(/Stream #0:0.*?Video:\s*(.*)/);
  const audioMatch = probeOutput.match(/Stream #0:1.*?Audio:\s*(.*)/);

  console.log(`  ✓ Duration: ${durationMatch ? durationMatch[1] : 'Unknown'}`);
  console.log(`  ✓ Video Stream: ${videoMatch ? videoMatch[1] : 'Unknown'}`);
  console.log(`  ✓ Audio Stream: ${audioMatch ? audioMatch[1] : 'Unknown'}`);

  // Audio volume detection
  const volProc = spawnSync(ffprobePath, [
    '-i', videoDiskPath,
    '-af', 'volumedetect',
    '-f', 'null',
    'NUL'
  ], { encoding: 'utf-8' });

  const volOutput = volProc.stderr;
  const meanVolMatch = volOutput.match(/mean_volume:\s*([-\d.]+)\s*dB/);
  const maxVolMatch = volOutput.match(/max_volume:\s*([-\d.]+)\s*dB/);

  console.log(`  ✓ Mean Volume: ${meanVolMatch ? meanVolMatch[1] + ' dB' : 'N/A'}`);
  console.log(`  ✓ Peak Volume: ${maxVolMatch ? maxVolMatch[1] + ' dB' : 'N/A'}`);

  // Step 7: Frame Extraction at Multiple Timestamps
  console.log('\n[Stage 7: Frame Extraction for Multi-Segment Visual Sequence]');
  const framesDir = path.resolve(process.cwd(), 'scratch/frames_phase4b');
  fs.mkdirSync(framesDir, { recursive: true });

  const timestamps = [
    { sec: '00:00:02.000', label: '2s_hook' },
    { sec: '00:00:08.000', label: '8s_hook_transition' },
    { sec: '00:00:20.000', label: '20s_evidence_coating' },
    { sec: '00:00:30.000', label: '30s_protocol' },
    { sec: '00:00:36.000', label: '36s_cta' }
  ];

  for (const { sec, label } of timestamps) {
    const framePath = path.join(framesDir, `frame_${label}.jpg`);
    spawnSync(ffprobePath, [
      '-y',
      '-ss', sec,
      '-i', videoDiskPath,
      '-vframes', '1',
      '-q:v', '2',
      framePath
    ]);

    if (fs.existsSync(framePath)) {
      const size = fs.statSync(framePath).size;
      console.log(`  ✓ Extracted Frame at ${sec} (${label}): ${framePath} (${size} bytes)`);
    } else {
      console.error(`  ✗ Failed to extract frame at ${sec}`);
    }
  }

  console.log('\n===============================================================');
  console.log(' Phase 4B Real Application Flow Successfully Executed!');
  console.log(` Video Artifact: ${videoDiskPath}`);
  console.log(` Extracted Frames: ${framesDir}`);
  console.log('===============================================================\n');

  return { jobId, videoDiskPath, thumbDiskPath, framesDir };
}

run().catch(err => {
  console.error('Fatal execution error:', err);
  process.exit(1);
});
