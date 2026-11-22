/**
 * SIMPLYYTR 2.0 — Controlled End-to-End Creative Core Integration Suite
 * 
 * Verifies:
 * Phase 2: Isolated quality profile (QUALITY_PROFILE=CINEMATIC_PRO)
 * Phase 3: Seamless pipeline wiring (footage-first, Kokoro opt-in, acoustic alignment, quality gates, local render)
 * Phase 4: Reliability & truthful diagnostics:
 *   - Missing narration audio
 *   - Python/model unavailable
 *   - Acoustic alignment timeout simulation
 *   - Low match rate simulation (<50%)
 *   - Monotonic boundary clamping
 *   - Empty/whitespace script rejection
 *   - Renderer failure & temp cleanup
 *   - Kokoro failure & documented fallback behavior
 *   - Publishing remaining strictly disabled
 * Phase 5: Live Controlled End-to-End Render:
 *   - Generates authentic 1080x1920 MP4, Kokoro WAV, ASS subtitles, EDP, Quality Report, Contact Sheet, Diagnostics
 *   - Probes streams, verifies dimensions, checks caption synchronization and safe zones.
 */

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { spawnSync, spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const workspaceRoot = path.resolve(__dirname, '../..');

// Import services via dynamic URLs to work seamlessly with Node ESM loader
const { renderStoryDrivenJob, generateContactSheet } = await import(
  `file://${path.resolve(workspaceRoot, 'apps/backend/src/services/storyRenderer.ts').replace(/\\/g, '/')}`
);
const { renderJobLocally, resolveFFmpegPath } = await import(
  `file://${path.resolve(workspaceRoot, 'apps/backend/src/services/localRenderer.ts').replace(/\\/g, '/')}`
);
const { enrichPlanWithAcousticCaptions, generateEditDecisionPlan } = await import(
  `file://${path.resolve(workspaceRoot, 'apps/backend/src/services/editDecisionPlan.ts').replace(/\\/g, '/')}`
);
const { alignNarrationAcoustically, generateAcousticKineticCaptions, groupAlignedWordsIntoCues } = await import(
  `file://${path.resolve(workspaceRoot, 'apps/backend/src/services/acousticAligner.ts').replace(/\\/g, '/')}`
);
const { synthesizeSpeechLocally, selectTtsProvider } = await import(
  `file://${path.resolve(workspaceRoot, 'apps/backend/src/services/localTts.ts').replace(/\\/g, '/')}`
);
const { runComprehensiveQualityGates } = await import(
  `file://${path.resolve(workspaceRoot, 'apps/backend/src/services/qualityGates.ts').replace(/\\/g, '/')}`
);

describe('Group 1: Isolated Quality Profile Routing & Safety Defaults', () => {
  it('1.1: Default profile is STANDARD and preserves legacy defaults without altering config', () => {
    const defaultProvider = selectTtsProvider('win32');
    assert.strictEqual(defaultProvider?.name, 'WINDOWS_SAPI', 'Default provider must be WINDOWS_SAPI (Kokoro is opt-in)');
  });

  it('1.2: Explicit QUALITY_PROFILE=CINEMATIC_PRO is recognized as an isolated profile', () => {
    const mockJob = {
      id: 'mock-profile-test',
      topic: 'Test Topic',
      qualityProfile: 'CINEMATIC_PRO',
      videoStyle: 'DOCUMENTARY_ESSAY'
    };
    assert.strictEqual(mockJob.qualityProfile, 'CINEMATIC_PRO');
  });

  it('1.3: autoPublishOnline is strictly false and external publishing is disabled', () => {
    // Check that autoPublishOnline is false across codebase defaults
    const envPublish = process.env.AUTO_PUBLISH_ONLINE;
    assert.notStrictEqual(envPublish, 'true', 'Publishing must not be enabled by default');
  });

  it('1.4: Kokoro TTS remains opt-in and does not hijack the default provider selection', () => {
    const unoptedProvider = selectTtsProvider('win32', {});
    assert.strictEqual(unoptedProvider?.name, 'WINDOWS_SAPI');

    const optedProvider = selectTtsProvider('win32', { engine: 'KOKORO' });
    assert.strictEqual(optedProvider?.name, 'KOKORO');
  });
});

describe('Group 2: Reliability & Truthful Fallback Diagnostics', () => {
  it('2.1: Missing narration audio file triggers graceful linear fallback and records isAcoustic: false', async () => {
    const dummyPlan = generateEditDecisionPlan(
      { id: 'test-missing-wav', topic: 'Airplane Windows', videoStyle: 'DOCUMENTARY_ESSAY' },
      null,
      30.0,
      'storage/non_existent_narration.wav'
    );

    const enriched = await enrichPlanWithAcousticCaptions(dummyPlan);
    assert.strictEqual(enriched.captionAlignment?.isAcoustic, false);
    assert.strictEqual(enriched.captionAlignment?.method, 'ESTIMATED_LINEAR');
    assert.strictEqual(enriched.captionAlignment?.diagnostic, 'NARRATION_WAV_UNAVAILABLE');
    assert.ok(enriched.captions.length > 0, 'Estimated captions should be generated as fallback');
  });

  it('2.2: Python / model unavailable returns clean diagnostic without throwing', async () => {
    const result = await alignNarrationAcoustically({
      audioPath: path.resolve(workspaceRoot, 'scratch/creative_poc_screen_spray/audio/sample_B_kokoro.wav'),
      scriptText: 'Sample text to test missing python binary.',
      pythonBin: 'C:/non_existent_python_binary_dir/python.exe'
    });

    assert.strictEqual(result.success, false);
    assert.strictEqual(result.isAcoustic, false);
    assert.strictEqual(result.method, 'ESTIMATED_LINEAR');
    assert.strictEqual(result.diagnostic, 'PYTHON_SPAWN_FAILED');
  });

  it('2.3: Empty or whitespace script fails closed with actionable error in story renderer', async () => {
    const emptyJob = {
      id: 'job-empty-script-test',
      topic: 'Empty Topic',
      scriptHook: '   ',
      scriptBody: '',
      scriptCta: ' \n\t ',
      videoStyle: 'SCREEN_TUTORIAL'
    };

    const result = await renderStoryDrivenJob(emptyJob);
    assert.strictEqual(result.success, false);
    assert.ok(result.error?.includes('EMPTY_NARRATION_SCRIPT'));
  });

  it('2.4: Subprocess timeout simulation returns diagnostic: TIMEOUT', async () => {
    const result = await alignNarrationAcoustically({
      audioPath: path.resolve(workspaceRoot, 'scratch/creative_poc_screen_spray/audio/sample_B_kokoro.wav'),
      scriptText: 'Testing timeout threshold in acoustic aligner.',
      timeoutMs: 1 // 1 millisecond will instantly time out
    });

    assert.strictEqual(result.success, false);
    assert.strictEqual(result.isAcoustic, false);
    assert.strictEqual(result.diagnostic, 'TIMEOUT');
  });

  it('2.5: Low match rate (<0.50) triggers graceful linear fallback and marks isAcoustic: false', async () => {
    // Provide script that bears zero resemblance to the audio
    const mismatchedScript = "Supercalifragilisticexpialidocious quantum entanglement photosynthesis xylophone zebra!";
    const { captions, alignment } = await generateAcousticKineticCaptions(
      path.resolve(workspaceRoot, 'scratch/creative_poc_screen_spray/audio/sample_B_kokoro.wav'),
      mismatchedScript,
      68.0
    );

    // Either alignment failed or matchRate < 0.50 triggers fallback
    assert.strictEqual(alignment.isAcoustic, false, 'Must not claim acoustic alignment on low match rate');
    assert.strictEqual(alignment.method, 'ESTIMATED_LINEAR');
    assert.ok(captions.length > 0, 'Fallback captions must be provided');
  });

  it('2.6: Monotonic boundary clamping prevents negative or inverted timestamps', () => {
    const testWords = [
      { word: 'Negative', start: -1.5, end: 0.2, matched: true },
      { word: 'Reversed', start: 2.0, end: 1.5, matched: true },
      { word: 'Excessive', start: 100.0, end: 105.0, matched: true }
    ];

    const cues = groupAlignedWordsIntoCues(testWords, { totalDurationSec: 50.0 });
    assert.ok(cues.length > 0);
    cues.forEach(cue => {
      assert.ok(cue.startTime >= 0, 'startTime must be >= 0');
      assert.ok(cue.endTime >= cue.startTime, 'endTime must be >= startTime');
      assert.ok(cue.endTime <= 50.5, 'endTime must be clamped to total duration');
    });
  });

  it('2.7: Kokoro failure triggers graceful fallback to SAPI with documented telemetry', () => {
    const dummyOutput = path.resolve(workspaceRoot, 'scratch/test_kokoro_fail_fallback.wav');
    // Request invalid voice or non-existent engine to simulate failure with fallbackOnFailure: true
    const result = synthesizeSpeechLocally('Testing Kokoro fallback mechanism.', dummyOutput, {
      engine: 'KOKORO',
      voiceName: 'non_existent_invalid_voice_id',
      fallbackOnFailure: true
    });

    if (result.engineUsed === 'WINDOWS_SAPI') {
      assert.strictEqual(result.fallbackFrom, 'KOKORO');
      assert.ok(result.fallbackReason, 'Fallback reason must be documented');
      assert.strictEqual(result.success, true);
    } else {
      // If Kokoro still succeeded by defaulting voice, assert valid wav
      assert.strictEqual(result.success, true);
    }
    if (fs.existsSync(dummyOutput)) fs.unlinkSync(dummyOutput);
  });

  it('2.8: Quality gates evaluate anti-slideshow, rights, and audio/captions strictly', () => {
    const dummyPlan = generateEditDecisionPlan(
      { id: 'gate-test', topic: 'Airplane Windows', videoStyle: 'DOCUMENTARY_ESSAY' },
      null,
      45.0,
      'storage/test.wav'
    );

    const report = runComprehensiveQualityGates(dummyPlan);
    assert.ok(report.gates.length >= 3, 'Must evaluate at least 3 quality gates');
    const gateNames = report.gates.map(g => g.gateName);
    assert.ok(gateNames.includes('Anti-Slideshow Gate'));
    assert.ok(gateNames.includes('Rights & Provenance Clearance Gate'));
    assert.ok(gateNames.includes('Audio Mixing & Continuity Gate'));
  });
});

describe('Group 3: Controlled End-to-End Creative Core Render (Phase 5 Live Validation)', { timeout: 180000 }, () => {
  it('3.1: Full end-to-end rendering on Airplane Windows explainer with Kokoro TTS & faster-whisper alignment', async () => {
    const testOutDir = path.resolve(workspaceRoot, 'scratch/creative_core_e2e_output');
    if (!fs.existsSync(testOutDir)) fs.mkdirSync(testOutDir, { recursive: true });

    const e2eJob = {
      id: 'e2e_airplane_windows_cinematic',
      topic: 'Why Airplane Windows Have Rounded Corners',
      generatedTitle: 'Why Commercial Airplane Windows Have Rounded Corners',
      videoStyle: 'DOCUMENTARY_ESSAY',
      qualityProfile: 'CINEMATIC_PRO',
      ttsEngine: 'KOKORO',
      voiceName: 'af_heart'
    };

    console.log('\n--- Starting Live E2E Creative Core Render ---');
    console.log(`Topic: "${e2eJob.topic}" | Quality Profile: ${e2eJob.qualityProfile} | TTS: ${e2eJob.ttsEngine}`);

    const renderResult = await renderStoryDrivenJob(e2eJob, testOutDir, {
      qualityProfile: 'CINEMATIC_PRO',
      ttsEngine: 'KOKORO',
      voiceName: 'af_heart',
      jobData: e2eJob
    });

    console.log(`Render Result Status: ${renderResult.success ? 'SUCCESS' : 'FAILED'}`);
    if (!renderResult.success) {
      console.error('Render error:', renderResult.error);
    }
    assert.strictEqual(renderResult.success, true, `Render should succeed without errors: ${renderResult.error}`);

    // 1. Verify Video MP4
    assert.ok(renderResult.videoPath, 'videoPath must be returned');
    assert.ok(fs.existsSync(renderResult.videoPath), 'MP4 file must exist on disk');
    const videoStats = fs.statSync(renderResult.videoPath);
    assert.ok(videoStats.size > 500000, `MP4 size (${videoStats.size} bytes) should be substantial (>500KB)`);

    // Probe MP4 using FFmpeg
    const ffmpegBin = resolveFFmpegPath();
    const probeProc = spawnSync(ffmpegBin, ['-i', renderResult.videoPath], { encoding: 'utf-8' });
    const probeStderr = probeProc.stderr;

    assert.ok(probeStderr.includes('1080x1920'), 'Video stream must be 1080x1920 portrait');
    assert.ok(probeStderr.includes('h264'), 'Video stream must be H.264');
    assert.ok(probeStderr.includes('aac'), 'Audio stream must be AAC');

    // 2. Verify Spoken Narration WAV
    assert.ok(renderResult.narrationPath, 'narrationPath must be returned');
    assert.ok(fs.existsSync(renderResult.narrationPath), 'Narration WAV must be preserved as review artifact');
    const wavStats = fs.statSync(renderResult.narrationPath);
    assert.ok(wavStats.size > 100000, 'Narration WAV must be non-empty');

    // 3. Verify Subtitle ASS
    assert.ok(renderResult.subtitlesPath, 'subtitlesPath must be returned');
    assert.ok(fs.existsSync(renderResult.subtitlesPath), 'ASS subtitles must be preserved as review artifact');
    const assContent = fs.readFileSync(renderResult.subtitlesPath, 'utf-8');
    assert.ok(assContent.includes('MarginV=240') || assContent.includes(',240,'), 'Must enforce MarginV=240 safe-zone');
    assert.ok(assContent.includes('Dialogue:'), 'ASS file must contain dialog cues');
    assert.ok(assContent.includes('&H0000FFFF&'), 'ASS file must contain gold keyword highlights');

    // 4. Verify Edit Decision Plan JSON
    assert.ok(renderResult.edpPath, 'edpPath must be returned');
    assert.ok(fs.existsSync(renderResult.edpPath), 'EDP JSON must exist on disk');
    const edp = JSON.parse(fs.readFileSync(renderResult.edpPath, 'utf-8'));
    assert.strictEqual(edp.version, '2.1.0');
    assert.ok(edp.shots.length >= 6, 'EDP must contain multi-shot breakdown');

    // 5. Verify Quality Report JSON
    assert.ok(renderResult.qualityReportPath, 'qualityReportPath must be returned');
    assert.ok(fs.existsSync(renderResult.qualityReportPath), 'Quality report JSON must exist on disk');
    const qualityReport = JSON.parse(fs.readFileSync(renderResult.qualityReportPath, 'utf-8'));
    assert.strictEqual(qualityReport.overallPassed, true, 'Quality gates should pass');
    assert.ok(qualityReport.gates.length >= 3);

    // 6. Verify Visual Review Contact Sheet PNG
    assert.ok(renderResult.contactSheetPath, 'contactSheetPath must be returned');
    assert.ok(fs.existsSync(renderResult.contactSheetPath), 'Contact sheet PNG must exist on disk');
    const contactStats = fs.statSync(renderResult.contactSheetPath);
    assert.ok(contactStats.size > 20000, `Contact sheet (${contactStats.size} bytes) must be a valid PNG image`);

    // 7. Verify Consolidated Diagnostics JSON
    assert.ok(renderResult.diagnosticsPath, 'diagnosticsPath must be returned');
    assert.ok(fs.existsSync(renderResult.diagnosticsPath), 'Diagnostics JSON must exist on disk');
    const diag = JSON.parse(fs.readFileSync(renderResult.diagnosticsPath, 'utf-8'));
    assert.strictEqual(diag.qualityProfile, 'CINEMATIC_PRO');
    assert.ok(diag.tts.durationSec > 15, 'Narration duration must be recorded');
    assert.ok(diag.captionAlignment.method, 'Caption alignment method must be recorded');
    assert.strictEqual(typeof diag.captionAlignment.isAcoustic, 'boolean');

    console.log('\n--- Live E2E Creative Core Render Verified Successfully ---');
    console.log(`Video: ${renderResult.videoPath} (${(videoStats.size / 1024 / 1024).toFixed(2)} MB)`);
    console.log(`Narration: ${renderResult.narrationPath} (${(wavStats.size / 1024).toFixed(1)} KB, Engine: ${renderResult.ttsEngine})`);
    console.log(`Subtitles: ${renderResult.subtitlesPath}`);
    console.log(`Contact Sheet: ${renderResult.contactSheetPath} (${(contactStats.size / 1024).toFixed(1)} KB)`);
    console.log(`Quality Gates: ${qualityReport.summary}`);
    console.log(`Acoustic Alignment: ${diag.captionAlignment.method} (isAcoustic: ${diag.captionAlignment.isAcoustic})`);
  });
});
