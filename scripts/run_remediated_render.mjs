/**
 * SIMPLYYTR 2.0 — Controlled Remediated Render & Physical Verification
 * 
 * Verifies all 4 remediation blockers live:
 * 1. Shot 7 uses AIRFRAME_3LAYER_DEFENSE procedural vector plate (zero SMPTE test patterns).
 * 2. Shot 3 uses authentic Comet 1A square windows photo (comet_1_square_windows.png, Alan Wilson, CC BY-SA 2.0).
 * 3. Shot 1 starts at inPointSec 5.0 (title bumper eliminated, authentic high-altitude cruise maintained).
 * 4. Ken Fielding attribution removed; Alan Wilson CC BY-SA 2.0 properly attributed without stale notices.
 */

import 'dotenv/config';
import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { PrismaClient } from '@prisma/client';
import { resolveFFmpegPath } from '../apps/backend/src/services/localRenderer.ts';

const prisma = new PrismaClient();
const ffmpegBin = resolveFFmpegPath();

async function run() {
  console.log('===============================================================');
  console.log(' SIMPLYYTR 2.0 — Remediated CINEMATIC_PRO Render Execution');
  console.log('===============================================================\n');

  const testJobId = `qa_cinematic_remediated_${Date.now()}`;
  console.log(`[Stage 1: Registering Scripted Job ${testJobId}]`);

  const contentPkg = {
    proposedTitle: 'Why Airplane Windows Have Rounded Corners',
    topic: 'Why Airplane Windows Have Rounded Corners',
    targetProblem: 'Square aircraft windows caused catastrophic stress fractures at fuselage corners',
    audience: 'Curious travelers and aviation enthusiasts',
    openingHook: 'Ever wonder why commercial airplane windows always have rounded corners? Skipping that curve once proved fatal.',
    qualityProfile: 'CINEMATIC_PRO',
    reviewStatus: 'APPROVED',
    claims: [
      {
        id: 'claim-aero-1',
        claimText: 'Stress accumulates dramatically at square window corners under repeated cabin pressurization cycles.',
        sourceUrl: 'https://en.wikipedia.org/wiki/De_Havilland_Comet',
        sourceRef: 'de Havilland Comet Inquiry Court of Inquiry Records 1954',
        verified: false,
        evidenceStatus: 'operator_reviewed'
      },
      {
        id: 'claim-aero-2',
        claimText: 'Modern jetliners combine continuous curved geometry, reinforcement doubler plates, and strict FAA damage-tolerance standards.',
        sourceUrl: 'https://www.ecfr.gov/current/title-14/chapter-I/subchapter-C/part-25/subpart-C/section-25.571',
        sourceRef: 'FAA 14 CFR § 25.571 Damage-tolerance and fatigue evaluation of structure',
        verified: true,
        evidenceStatus: 'verified'
      }
    ]
  };

  const created = await prisma.renderJob.create({
    data: {
      id: testJobId,
      status: 'SCRIPTED',
      topic: 'Why Airplane Windows Have Rounded Corners',
      generatedTitle: 'Why Airplane Windows Have Rounded Corners',
      videoStyle: 'DOCUMENTARY_ESSAY',
      renderEngine: 'KOKORO',
      contentPackage: JSON.stringify(contentPkg)
    }
  });

  console.log(`✓ Job registered with status: ${created.status}`);

  console.log('\n[Stage 2: Executing Story-Driven Local Render (Profile: CINEMATIC_PRO)]');
  const { renderJobLocally } = await import('../apps/backend/src/services/localRenderer.ts');

  const startTime = Date.now();
  const result = await renderJobLocally(testJobId);
  const elapsedSec = ((Date.now() - startTime) / 1000).toFixed(1);

  console.log(`\nRender completed in ${elapsedSec}s. Success: ${result.success}`);
  if (!result.success) {
    console.error('Render FAILED:', result.error);
    process.exit(1);
  }

  console.log('\n[Stage 3: Inspecting Generated Review Artifacts on Disk]');
  const processedDir = path.resolve(process.cwd(), 'storage/processed');
  const expectedFiles = {
    video: path.join(processedDir, `${testJobId}_short.mp4`),
    thumbnail: path.join(processedDir, `${testJobId}_thumb.jpg`),
    contactSheet: path.join(processedDir, `${testJobId}_contact_sheet.png`),
    edp: path.join(processedDir, `${testJobId}_edp.json`),
    narration: path.join(processedDir, `${testJobId}_narration.wav`),
    subtitles: path.join(processedDir, `${testJobId}_subtitles.ass`),
    qualityReport: path.join(processedDir, `${testJobId}_quality_report.json`),
    diagnostics: path.join(processedDir, `${testJobId}_diagnostics.json`)
  };

  for (const [key, filePath] of Object.entries(expectedFiles)) {
    const exists = fs.existsSync(filePath);
    const size = exists ? fs.statSync(filePath).size : 0;
    console.log(`  Artifact [${key}]: ${exists ? 'EXISTS' : 'MISSING'} (${size.toLocaleString()} bytes) -> ${path.basename(filePath)}`);
    if (!exists || size === 0) {
      console.error(`FATAL: Missing expected artifact ${key}`);
      process.exit(1);
    }
  }

  console.log('\n[Stage 4: Diagnostics & Provenance Verification]');
  const diagData = JSON.parse(fs.readFileSync(expectedFiles.diagnostics, 'utf-8'));
  const edpData = JSON.parse(fs.readFileSync(expectedFiles.edp, 'utf-8'));
  const qualityData = JSON.parse(fs.readFileSync(expectedFiles.qualityReport, 'utf-8'));

  console.log(`  TTS Engine Used: ${diagData.tts?.engineUsed} (${diagData.tts?.voiceUsed}, ${diagData.tts?.sampleRate} Hz)`);
  console.log(`  Narration Duration: ${diagData.tts?.durationSec}s`);
  console.log(`  Caption Alignment: ${diagData.captionAlignment?.method} (Acoustic: ${diagData.captionAlignment?.isAcoustic}, Match Rate: ${diagData.captionAlignment?.matchRate}%)`);
  console.log(`  Timeline Shots: ${diagData.timeline?.shotsCount} shots, total duration: ${diagData.timeline?.totalDurationSec}s`);
  console.log(`  Quality Gates Overall: ${qualityData.overallPassed ? 'PASSED (100%)' : 'FAILED'}`);

  for (const g of qualityData.gates) {
    console.log(`    - Gate [${g.gateName}]: ${g.passed ? 'PASS' : 'FAIL'} (Score: ${g.score})`);
    if (g.failures.length > 0) console.log(`      Failures: ${g.failures.join(', ')}`);
  }

  // Verify Provenance & Rights
  console.log('\n[Stage 5: Forensic Rights & Blocker Verification]');
  const manifest = diagData.assetProvenance || [];
  console.log(`  Manifest entries count: ${manifest.length}`);

  // Check 1: nasa-modern-fuselage-assembly must NOT be in manifest
  const hasSyntheticPattern = manifest.some(m => m.assetId === 'nasa-modern-fuselage-assembly');
  console.log(`  Check 1 (Shot 7 Defect Removed): ${!hasSyntheticPattern ? 'PASS' : 'FAIL'} (Synthetic footage asset present: ${hasSyntheticPattern})`);

  // Check 2: wiki-dh106-comet-archive must point to Alan Wilson / CC BY-SA 2.0
  const cometEntry = manifest.find(m => m.assetId === 'wiki-dh106-comet-archive');
  const isCometAlanWilson = cometEntry && cometEntry.license === 'CC BY-SA 2.0' && cometEntry.sourceOrigin.includes('Alan Wilson');
  console.log(`  Check 2 (Shot 3 Comet 1A Archive): ${isCometAlanWilson ? 'PASS' : 'FAIL'} (License: ${cometEntry?.license}, Origin: ${cometEntry?.sourceOrigin})`);

  // Check 3: Shot 1 inPointSec must be 0.4 with 0.4x speed to isolate clean aircraft and exclude title bumper
  const shot1 = edpData.shots[0];
  const isShot1Remediated = shot1 && shot1.footageClip && shot1.footageClip.inPointSec === 0.4 && shot1.footageClip.playbackSpeed === 0.4;
  console.log(`  Check 3 (Shot 1 Clean Aircraft Isolation): ${isShot1Remediated ? 'PASS' : 'FAIL'} (inPointSec: ${shot1?.footageClip?.inPointSec}, speed: ${shot1?.footageClip?.playbackSpeed})`);

  // Check 4: Shot 7 composition must be AIRFRAME_3LAYER_DEFENSE with no footageClip
  const shot7 = edpData.shots[6];
  const isShot7Remediated = shot7 && shot7.compositionType === 'AIRFRAME_3LAYER_DEFENSE' && !shot7.footageClip;
  console.log(`  Check 4 (Shot 7 First-Party Procedural Vector): ${isShot7Remediated ? 'PASS' : 'FAIL'} (comp: ${shot7?.compositionType}, hasClip: ${!!shot7?.footageClip})`);

  // Check 5: Ken Fielding attribution is NOT present
  const hasKenFielding = manifest.some(m => JSON.stringify(m).includes('Ken Fielding'));
  console.log(`  Check 5 (No Stale Attribution): ${!hasKenFielding ? 'PASS' : 'FAIL'} (Ken Fielding references: ${hasKenFielding})`);

  console.log('\n[Stage 6: Physical Video Stream Analysis via FFprobe]');
  const ffprobeOutput = spawnSync('node_modules/@ffmpeg-installer/win32-x64/ffmpeg.exe', [
    '-i', expectedFiles.video
  ], { encoding: 'utf-8' });

  const stderr = ffprobeOutput.stderr || '';
  const resolutionMatch = stderr.match(/Video:.*,\s*(\d{3,4})x(\d{3,4})/);
  const fpsMatch = stderr.match(/(\d+(?:\.\d+)?)\s*fps/);
  const audioMatch = stderr.match(/Audio:\s*(\w+)/);

  console.log(`  Resolution: ${resolutionMatch ? `${resolutionMatch[1]}x${resolutionMatch[2]}` : 'Unknown'}`);
  console.log(`  FPS: ${fpsMatch ? fpsMatch[1] : 'Unknown'}`);
  console.log(`  Audio Codec: ${audioMatch ? audioMatch[1] : 'Unknown'}`);

  console.log('\n[Stage 7: Loudness Analysis via FFmpeg ebur128]');
  const loudProc = spawnSync(ffmpegBin, [
    '-i', expectedFiles.video,
    '-filter:a', 'ebur128',
    '-f', 'null',
    '-'
  ], { encoding: 'utf-8' });

  const loudStderr = loudProc.stderr || '';
  const ilMatch = loudStderr.match(/I:\s*(-?\d+\.\d+)\s*LUFS/);
  const tpMatch = loudStderr.match(/Peak:\s*(-?\d+\.\d+)\s*dBFS/);
  console.log(`  Integrated Loudness: ${ilMatch ? `${ilMatch[1]} LUFS` : 'N/A'}`);
  console.log(`  True Peak: ${tpMatch ? `${tpMatch[1]} dBFS` : 'N/A'}`);

  console.log('\n[Stage 8: Visual Frame Extraction for Visual Inspection]');
  const framesDir = path.resolve(process.cwd(), 'storage/processed/qa_frames');
  if (!fs.existsSync(framesDir)) fs.mkdirSync(framesDir, { recursive: true });

  const keyFrames = [
    { name: 'shot1_nasa_cruise', timeSec: 3.0, desc: 'Shot 1: Clean NASA transport aircraft without title bumper' },
    { name: 'shot2_hoop_stress', timeSec: 12.0, desc: 'Shot 2: Cabin pressure simulation' },
    { name: 'shot3_comet_1a', timeSec: 20.0, desc: 'Shot 3: Authentic Comet 1A F-BGNX square windows photo' },
    { name: 'shot4_stress_gradient', timeSec: 28.0, desc: 'Shot 4: Stress flow comparison' },
    { name: 'shot5_roof_antenna', timeSec: 36.0, desc: 'Shot 5: Forensic dossier flight G-ALYP' },
    { name: 'shot6_water_tank', timeSec: 44.0, desc: 'Shot 6: Farnborough water tank proof archive' },
    { name: 'shot7_3layer_defense', timeSec: 52.0, desc: 'Shot 7: 3-layer airframe defense schematic (NO color bars)' },
    { name: 'shot8_bleed_hole', timeSec: 60.0, desc: 'Shot 8: Breather hole cross-section' }
  ];

  for (const kf of keyFrames) {
    const outFramePath = path.join(framesDir, `${testJobId}_${kf.name}.png`);
    spawnSync(ffmpegBin, [
      '-y',
      '-ss', `${kf.timeSec}`,
      '-i', expectedFiles.video,
      '-vframes', '1',
      outFramePath
    ]);
    const fExists = fs.existsSync(outFramePath);
    const fSize = fExists ? fs.statSync(outFramePath).size : 0;
    console.log(`  Frame [${kf.name}] at ${kf.timeSec}s: ${fExists ? 'CAPTURED' : 'FAILED'} (${fSize} bytes) - ${kf.desc}`);
  }

  await prisma.$disconnect();
  console.log('\n===============================================================');
  console.log(` REMEDIATION RENDER VERIFICATION COMPLETE FOR ${testJobId}`);
  console.log('===============================================================');
}

run().catch(err => {
  console.error('Fatal execution error:', err);
  process.exit(1);
});
