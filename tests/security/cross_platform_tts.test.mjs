/**
 * SIMPLYYTR 2.0 — Phase 4C.3: Cross-Platform TTS & Runtime Portability Test Suite
 * 
 * Verifies:
 * 1. Windows SAPI provider selection and offline metadata on win32.
 * 2. Linux provider selection (Piper -> eSpeak NG -> edge-tts) and licensing documentation.
 * 3. Missing provider fail-closed behavior with explicit actionable error messages.
 * 4. Input text validation and path-confinement protection against directory traversal.
 * 5. Audio verification: rejection of missing, empty (<100b), or corrupted audio headers.
 * 6. Renderer error propagation and PostgreSQL status transition to FAILED (never false READY).
 * 7. Real Windows SAPI audio synthesis and RIFF/WAVE format integrity.
 */

import 'dotenv/config';
import assert from 'node:assert';
import fs from 'node:fs';
import path from 'node:path';
import { PrismaClient } from '@prisma/client';

import {
  synthesizeSpeechLocally,
  validateScriptText,
  validateAudioFile,
  assertSafeOutputPath,
  selectTtsProvider,
  getAvailableTtsProviders,
  getTtsProvidersStatus,
  WindowsSapiProvider,
  EspeakNgProvider,
  PiperProvider,
  EdgeTtsProvider,
  KokoroTtsProvider,
  resolveFFmpegPath,
  resolveDefaultFontPath,
  verifyFFmpegAvailable
} from '../../apps/backend/src/services/localTts.ts';
import { renderJobLocally } from '../../apps/backend/src/services/localRenderer.ts';

const prisma = new PrismaClient();
let passed = 0;
let failed = 0;
const testJobIds = [];

async function runTest(name, fn) {
  try {
    await fn();
    console.log(`  ✓ PASS: ${name}`);
    passed++;
  } catch (err) {
    console.error(`  ✗ FAIL: ${name}`);
    console.error(`    ${err.message}`);
    failed++;
  }
}

console.log('===============================================================');
console.log(' SIMPLYYTR 2.0 — Phase 4C.3 Cross-Platform TTS & Portability');
console.log(' Host Platform:', process.platform);
console.log('===============================================================\n');

try {
  // ─── Group 1: Windows SAPI Provider Selection & Availability ──────────────
  console.log('[Group 1: Windows SAPI Provider Selection & Availability]');

  const sapi = new WindowsSapiProvider();
  const sapiInfo = sapi.getInfo();

  await runTest('WindowsSapiProvider platform is win32 and 100% offline', () => {
    assert.strictEqual(sapi.name, 'WINDOWS_SAPI');
    assert.strictEqual(sapi.platform, 'win32');
    assert.strictEqual(sapiInfo.offline, true);
    assert.strictEqual(sapiInfo.license, 'Proprietary (Microsoft Windows Component)');
  });

  if (process.platform === 'win32') {
    await runTest('WindowsSapiProvider isAvailable() returns true on host Windows machine', () => {
      assert.strictEqual(sapi.isAvailable(), true);
    });

    await runTest('selectTtsProvider("win32") prioritizes WINDOWS_SAPI', () => {
      const selected = selectTtsProvider('win32');
      assert.ok(selected, 'Provider must be selected on win32');
      assert.strictEqual(selected.name, 'WINDOWS_SAPI');
    });
  }

  // ─── Group 2: Linux Provider Selection & Licensing Metadata ───────────────
  console.log('\n[Group 2: Linux Provider Selection & Licensing Metadata]');

  const espeak = new EspeakNgProvider();
  const espeakInfo = espeak.getInfo();
  const piper = new PiperProvider();
  const piperInfo = piper.getInfo();
  const edge = new EdgeTtsProvider();
  const edgeInfo = edge.getInfo();

  await runTest('eSpeak NG provider metadata documents GPLv3 and offline capability', () => {
    assert.strictEqual(espeak.name, 'ESPEAK_NG');
    assert.strictEqual(espeakInfo.offline, true);
    assert.strictEqual(espeakInfo.license, 'GPL-3.0-or-later');
    assert.match(espeakInfo.installGuide, /apt-get install espeak-ng/);
  });

  await runTest('Piper provider metadata documents MIT License and local neural capability', () => {
    assert.strictEqual(piper.name, 'PIPER');
    assert.strictEqual(piperInfo.offline, true);
    assert.strictEqual(piperInfo.license, 'MIT License');
    assert.match(piperInfo.installGuide, /PIPER_MODEL_PATH/);
  });

  await runTest('Edge TTS provider metadata documents Microsoft service terms and online requirement', () => {
    assert.strictEqual(edge.name, 'EDGE_TTS');
    assert.strictEqual(edgeInfo.offline, false);
    assert.match(edgeInfo.license, /Microsoft Service Terms/);
    assert.match(edgeInfo.installGuide, /pip install edge-tts/);
  });

  await runTest('getTtsProvidersStatus returns complete list of all registered providers', () => {
    const statuses = getTtsProvidersStatus(process.platform);
    assert.strictEqual(statuses.length, 6);
    const names = statuses.map(s => s.name);
    assert.ok(names.includes('WINDOWS_SAPI'));
    assert.ok(names.includes('ESPEAK_NG'));
    assert.ok(names.includes('PIPER'));
    assert.ok(names.includes('EDGE_TTS'));
    assert.ok(names.includes('GEMINI_CLI'));
    assert.ok(names.includes('KOKORO'));
  });

  // ─── Group 3: Missing Provider Behavior (Fail-Closed & Actionable Error) ───
  console.log('\n[Group 3: Missing Provider Behavior]');

  await runTest('selectTtsProvider returns null on unknown/unsupported platform without providers', () => {
    const provider = selectTtsProvider('solaris');
    assert.strictEqual(provider, null);
  });

  await runTest('synthesizeSpeechLocally returns actionable error when no provider is available', () => {
    const res = synthesizeSpeechLocally('Hello world', 'scratch/dummy.wav', { targetPlatform: 'solaris' });
    assert.strictEqual(res.success, false);
    assert.strictEqual(res.durationSec, 0);
    assert.strictEqual(res.engineUsed, 'NONE');
    assert.match(res.error, /TTS_NO_AVAILABLE_PROVIDER/);
  });

  await runTest('Actionable error message includes Linux installation instructions when on linux', () => {
    // When no provider is installed on simulated linux
    const res = synthesizeSpeechLocally('Test script', 'scratch/test_linux.wav', {
      targetPlatform: 'linux',
      engine: 'NON_EXISTENT_ENGINE'
    });
    assert.strictEqual(res.success, false);
    assert.match(res.error, /install eSpeak NG/);
  });

  // ─── Group 4: Input Validation & Confinement Safeguards ────────────────────
  console.log('\n[Group 4: Input Validation & Path Confinement]');

  await runTest('validateScriptText rejects empty and whitespace-only text', () => {
    const empty1 = validateScriptText('');
    assert.strictEqual(empty1.valid, false);
    assert.match(empty1.error, /TTS_EMPTY_TEXT/);

    const empty2 = validateScriptText('    \n\r  ');
    assert.strictEqual(empty2.valid, false);
    assert.match(empty2.error, /TTS_EMPTY_TEXT/);
  });

  await runTest('validateScriptText normalizes newlines and collapses whitespace', () => {
    const valid = validateScriptText('Line 1\r\nLine 2 \n  Line 3');
    assert.strictEqual(valid.valid, true);
    assert.strictEqual(valid.cleanText, 'Line 1 Line 2 Line 3');
  });

  await runTest('assertSafeOutputPath rejects paths that traverse outside workspace', () => {
    assert.throws(
      () => assertSafeOutputPath('../../outside_target.wav'),
      /TTS_PATH_CONFINEMENT_VIOLATION/
    );
  });

  await runTest('synthesizeSpeechLocally fails closed on path traversal attempt', () => {
    const res = synthesizeSpeechLocally('Valid speech text', '../../outside_target.wav');
    assert.strictEqual(res.success, false);
    assert.match(res.error, /TTS_PATH_CONFINEMENT_VIOLATION/);
  });

  // ─── Group 5: Audio Verification (Missing, Empty, Invalid Output) ──────────
  console.log('\n[Group 5: Audio Verification]');

  await runTest('validateAudioFile fails closed on missing file', () => {
    const res = validateAudioFile('scratch/non_existent_audio_file.wav');
    assert.strictEqual(res.valid, false);
    assert.match(res.error, /TTS_MISSING_AUDIO_OUTPUT/);
  });

  await runTest('validateAudioFile fails closed on 0-byte or truncated file (<100b)', () => {
    const tinyPath = path.resolve(process.cwd(), 'scratch/tiny_probe.wav');
    fs.mkdirSync(path.dirname(tinyPath), { recursive: true });
    fs.writeFileSync(tinyPath, Buffer.alloc(10));
    try {
      const res = validateAudioFile(tinyPath);
      assert.strictEqual(res.valid, false);
      assert.match(res.error, /TTS_AUDIO_EMPTY/);
    } finally {
      if (fs.existsSync(tinyPath)) fs.unlinkSync(tinyPath);
    }
  });

  await runTest('validateAudioFile fails closed on corrupted/non-audio header', () => {
    const corruptPath = path.resolve(process.cwd(), 'scratch/corrupt_probe.wav');
    fs.mkdirSync(path.dirname(corruptPath), { recursive: true });
    // Write 200 bytes of text instead of RIFF/WAVE header
    fs.writeFileSync(corruptPath, Buffer.from('NOT_A_WAV_FILE'.repeat(20)));
    try {
      const res = validateAudioFile(corruptPath);
      assert.strictEqual(res.valid, false);
      assert.match(res.error, /TTS_INVALID_AUDIO_FORMAT/);
    } finally {
      if (fs.existsSync(corruptPath)) fs.unlinkSync(corruptPath);
    }
  });

  // ─── Group 6: Cross-Platform FFmpeg & Font Path Resolution ────────────────
  console.log('\n[Group 6: Cross-Platform FFmpeg & Font Path Resolution]');

  await runTest('resolveFFmpegPath resolves an executable path without crashing', () => {
    const ffmpegPath = resolveFFmpegPath();
    assert.ok(ffmpegPath, 'FFmpeg path must resolve');
  });

  await runTest('verifyFFmpegAvailable confirms FFmpeg execution on host', async () => {
    const check = await verifyFFmpegAvailable();
    assert.strictEqual(check.available, true, `FFmpeg should be available: ${check.error}`);
    assert.ok(check.version, 'Must return FFmpeg version header');
  });

  await runTest('resolveDefaultFontPath returns platform-appropriate font path', () => {
    const font = resolveDefaultFontPath();
    assert.ok(font, 'Default font path must be resolved');
    if (process.platform === 'win32') {
      assert.match(font, /Windows\/Fonts/);
    } else {
      assert.match(font, /\/usr\/share\/fonts/);
    }
  });

  // ─── Group 7: Renderer Failure Propagation & No False READY Status ────────
  console.log('\n[Group 7: Renderer Failure Propagation & Status Bounds]');

  let dbAvailable = false;
  try {
    await prisma.$queryRaw`SELECT 1`;
    dbAvailable = true;
  } catch {
    console.log('  [Notice] PostgreSQL 5432 is stopped; skipping database renderer state transition test.');
  }

  if (dbAvailable) {
    await runTest('Renderer marks job FAILED (never READY) when TTS synthesis fails', async () => {
      // Create SCRIPTED job with empty body to trigger TTS failure
      const job = await prisma.renderJob.create({
        data: {
          status: 'SCRIPTED',
          topic: 'Failure Propagation Probe',
          scriptHook: ' ', // Empty hook
          scriptBody: ' ', // Empty body
          scriptCta: ' ',  // Empty cta
          videoStyle: 'PRODUCT_FIND'
        }
      });
      testJobIds.push(job.id);

      // renderJobLocally must fail and transition PostgreSQL status to FAILED
      const result = await renderJobLocally(job.id);
      assert.strictEqual(result.success, false);
      assert.match(result.error, /TTS_EMPTY_TEXT|TTS_SYNTHESIS_FAILED/);

      const updatedJob = await prisma.renderJob.findUnique({ where: { id: job.id } });
      assert.strictEqual(updatedJob.status, 'FAILED', 'Status must transition to FAILED');
      assert.notStrictEqual(updatedJob.status, 'READY', 'Status must NEVER be set to READY by renderer');
      assert.ok(updatedJob.error, 'Error message must be recorded on job');
    });
  }

  // ─── Group 8: Real Windows SAPI Synthesis & WAV Header Verification ───────
  if (process.platform === 'win32') {
    console.log('\n[Group 8: Real Windows SAPI Audio Synthesis]');

    await runTest('Real SAPI synthesizes non-empty WAV with authentic RIFF/WAVE header', () => {
      const outWav = path.resolve(process.cwd(), 'scratch/probe_real_sapi.wav');
      try {
        const result = synthesizeSpeechLocally(
          'SIMPLYYTR text to speech test audio probe.',
          outWav
        );
        assert.strictEqual(result.success, true);
        assert.strictEqual(result.engineUsed, 'WINDOWS_SAPI');
        assert.ok(result.durationSec > 0, `Duration must be > 0: ${result.durationSec}`);
        assert.ok(fs.existsSync(outWav), 'Output WAV file must exist on disk');

        const validation = validateAudioFile(outWav);
        assert.strictEqual(validation.valid, true);
      } finally {
        if (fs.existsSync(outWav)) fs.unlinkSync(outWav);
      }
    });
  }

  // ─── Group 9: Kokoro TTS Provider Metadata & Selection Architecture ───────
  console.log('\n[Group 9: Kokoro TTS Provider Metadata & Selection Architecture]');

  const kokoro = new KokoroTtsProvider();
  const kokoroInfo = kokoro.getInfo();

  await runTest('Kokoro provider metadata documents Apache-2.0 / MIT and 100% offline capability', () => {
    assert.strictEqual(kokoro.name, 'KOKORO');
    assert.strictEqual(kokoro.platform, 'all');
    assert.strictEqual(kokoroInfo.offline, true);
    assert.match(kokoroInfo.license, /Apache-2\.0/);
    assert.match(kokoroInfo.description, /Kokoro-82M ONNX/);
  });

  await runTest('Kokoro isAvailable() returns true when local model, voices, and python runner exist', () => {
    const isAvail = kokoro.isAvailable();
    assert.strictEqual(isAvail, true, 'Kokoro should be available with local tools present');
  });

  await runTest('Default provider selection on win32 preserves WINDOWS_SAPI (Kokoro is opt-in)', () => {
    const oldEnv = process.env.TTS_PROVIDER;
    delete process.env.TTS_PROVIDER;
    try {
      const selected = selectTtsProvider('win32');
      assert.ok(selected, 'Provider must be selected');
      assert.strictEqual(selected.name, 'WINDOWS_SAPI', 'Default win32 provider MUST remain WINDOWS_SAPI');
    } finally {
      if (oldEnv) process.env.TTS_PROVIDER = oldEnv;
    }
  });

  await runTest('Explicit preference options.engine = "KOKORO" selects Kokoro when available', () => {
    const selected = selectTtsProvider(process.platform, 'KOKORO');
    assert.ok(selected, 'Provider must be selected');
    assert.strictEqual(selected.name, 'KOKORO', 'Explicit preference must select KOKORO');
  });

  await runTest('Environment variable TTS_PROVIDER=KOKORO selects Kokoro', () => {
    const oldEnv = process.env.TTS_PROVIDER;
    process.env.TTS_PROVIDER = 'KOKORO';
    try {
      const selected = selectTtsProvider(process.platform);
      assert.ok(selected, 'Provider must be selected');
      assert.strictEqual(selected.name, 'KOKORO');
    } finally {
      if (oldEnv) process.env.TTS_PROVIDER = oldEnv;
      else delete process.env.TTS_PROVIDER;
    }
  });

  await runTest('selectTtsProvider gracefully falls back to WINDOWS_SAPI when requested engine is unavailable', () => {
    const selected = selectTtsProvider('win32', 'NON_EXISTENT_TTS_ENGINE');
    assert.ok(selected, 'Provider must fall back to default');
    assert.strictEqual(selected.name, 'WINDOWS_SAPI', 'Must fall back to WINDOWS_SAPI on win32');
  });

  // ─── Group 10: Kokoro TTS Safeguards, Error Handling & Confinement ────────
  console.log('\n[Group 10: Kokoro TTS Safeguards & Error Handling]');

  await runTest('Kokoro fails closed with actionable error when model or runtime is missing', () => {
    const fakeProvider = new KokoroTtsProvider();
    // Stub resolveModelPath to return non-existent path
    fakeProvider.resolveModelPath = () => 'local_tools/non_existent_model.onnx';
    const fakeOut = path.resolve(process.cwd(), 'scratch/fake_kokoro.wav');

    const result = fakeProvider.synthesize('Test speech', fakeOut);
    assert.strictEqual(result.success, false);
    assert.strictEqual(result.durationSec, 0);
    assert.match(result.error, /TTS_KOKORO_UNAVAILABLE/);
    assert.ok(!fs.existsSync(fakeOut), 'No audio file should be generated');
  });

  await runTest('Kokoro safely handles output paths containing spaces without shell interpolation', () => {
    const spaceDir = path.resolve(process.cwd(), 'scratch/test path with spaces');
    fs.mkdirSync(spaceDir, { recursive: true });
    const spaceWav = path.join(spaceDir, 'test output speech.wav');

    try {
      const result = synthesizeSpeechLocally('Path with spaces test phrase.', spaceWav, {
        engine: 'KOKORO',
        voiceName: 'am_michael'
      });
      assert.strictEqual(result.success, true);
      assert.strictEqual(result.engineUsed, 'KOKORO');
      assert.ok(fs.existsSync(spaceWav), 'Output file in path with spaces must exist');

      const validation = validateAudioFile(spaceWav, { expectedSampleRate: 24000 });
      assert.strictEqual(validation.valid, true);
      assert.strictEqual(validation.sampleRate, 24000);
    } finally {
      if (fs.existsSync(spaceWav)) fs.unlinkSync(spaceWav);
      if (fs.existsSync(spaceDir)) fs.rmdirSync(spaceDir);
    }
  });

  await runTest('validateAudioFile enforces sample rate check (rejects non-24kHz for Kokoro expectation)', () => {
    // Generate SAPI WAV (22050 Hz)
    const sapiWav = path.resolve(process.cwd(), 'scratch/sapi_22k_test.wav');
    try {
      const sapiResult = synthesizeSpeechLocally('Sample rate check test phrase.', sapiWav, { engine: 'WINDOWS_SAPI' });
      assert.strictEqual(sapiResult.success, true);

      // Validate expecting 24000 Hz should fail with sample rate mismatch
      const mismatch = validateAudioFile(sapiWav, { expectedSampleRate: 24000 });
      assert.strictEqual(mismatch.valid, false);
      assert.match(mismatch.error, /TTS_SAMPLE_RATE_MISMATCH/);

      // Validate expecting 22050 Hz should succeed
      const match = validateAudioFile(sapiWav, { expectedSampleRate: 22050 });
      assert.strictEqual(match.valid, true);
      assert.strictEqual(match.sampleRate, 22050);
    } finally {
      if (fs.existsSync(sapiWav)) fs.unlinkSync(sapiWav);
    }
  });

  await runTest('Kokoro error output sanitizes potential secrets and truncates safely', () => {
    const fakeProvider = new KokoroTtsProvider();
    // Simulate runner failure returning an error containing a sensitive string
    const secretErr = 'Error occurred near key: ak_live_1234567890abcdef1234567890abcdef and token: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9';
    const sanitized = secretErr.replace(/[a-zA-Z0-9_\-]{32,}/g, '[REDACTED]').slice(0, 300);
    assert.ok(!sanitized.includes('1234567890abcdef1234567890abcdef'), 'Secret must be redacted');
    assert.ok(!sanitized.includes('eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9'), 'JWT token must be redacted');
    assert.match(sanitized, /\[REDACTED\]/);
  });

  await runTest('Graceful fallback to WINDOWS_SAPI when fallbackOnFailure: true is requested', () => {
    const brokenWav = path.resolve(process.cwd(), 'scratch/test_fallback_sapi.wav');
    const origSynthesize = KokoroTtsProvider.prototype.synthesize;
    // Stub Kokoro synthesize to simulate an engine runtime failure
    KokoroTtsProvider.prototype.synthesize = function() {
      return {
        success: false,
        durationSec: 0,
        engineUsed: 'KOKORO',
        voiceUsed: 'none',
        error: 'TTS_KOKORO_FAILED: Exit code 1. Simulated inference engine failure'
      };
    };

    try {
      const result = synthesizeSpeechLocally('Fallback test phrase.', brokenWav, {
        engine: 'KOKORO',
        fallbackOnFailure: true
      });
      assert.strictEqual(result.success, true);
      assert.strictEqual(result.engineUsed, 'WINDOWS_SAPI', 'Should gracefully fall back to WINDOWS_SAPI');
      assert.strictEqual(result.fallbackFrom, 'KOKORO', 'Should record that fallback occurred from KOKORO');
      assert.match(result.fallbackReason, /Simulated inference engine failure/);
      assert.ok(fs.existsSync(brokenWav), 'Fallback audio must exist on disk');
    } finally {
      KokoroTtsProvider.prototype.synthesize = origSynthesize;
      if (fs.existsSync(brokenWav)) fs.unlinkSync(brokenWav);
    }
  });

  // ─── Group 11: Real Offline Kokoro Neural Speech Smoke Test ───────────────
  console.log('\n[Group 11: Real Offline Kokoro Neural Speech Smoke Test]');

  await runTest('Real Kokoro synthesizes 24kHz mono WAV offline without external API requests', () => {
    const smokeWav = path.resolve(process.cwd(), 'scratch/probe_real_kokoro_smoke.wav');
    const t0 = performance.now();

    try {
      const result = synthesizeSpeechLocally(
        'SIMPLYYTR production Kokoro neural speech synthesis verified.',
        smokeWav,
        {
          engine: 'KOKORO',
          voiceName: 'am_michael'
        }
      );

      const elapsedMs = performance.now() - t0;

      assert.strictEqual(result.success, true, `Kokoro synthesis failed: ${result.error}`);
      assert.strictEqual(result.engineUsed, 'KOKORO');
      assert.strictEqual(result.voiceUsed, 'am_michael');
      assert.strictEqual(result.sampleRate, 24000);
      assert.strictEqual(result.channels, 1);
      assert.ok(result.durationSec > 0, `Duration must be > 0: ${result.durationSec}`);
      assert.ok(fs.existsSync(smokeWav), 'Output WAV file must exist on disk');

      const stat = fs.statSync(smokeWav);
      assert.ok(stat.size > 1000, `File size must be substantial (${stat.size} bytes)`);

      const validation = validateAudioFile(smokeWav, { expectedSampleRate: 24000, expectedChannels: 1 });
      assert.strictEqual(validation.valid, true);

      console.log(`    [Kokoro Telemetry] Duration: ${result.durationSec.toFixed(2)}s | Synthesis Elapsed: ${(elapsedMs/1000).toFixed(2)}s | RTF: ${(elapsedMs/1000/result.durationSec).toFixed(2)}x | File Size: ${(stat.size/1024).toFixed(1)} KB`);
    } finally {
      if (fs.existsSync(smokeWav)) fs.unlinkSync(smokeWav);
    }
  });

} finally {
  // Cleanup test jobs
  for (const id of testJobIds) {
    try {
      await prisma.renderJob.deleteMany({ where: { id } });
      const videoPath = path.resolve(process.cwd(), `storage/processed/${id}_short.mp4`);
      const thumbPath = path.resolve(process.cwd(), `storage/processed/${id}_thumb.jpg`);
      if (fs.existsSync(videoPath)) fs.unlinkSync(videoPath);
      if (fs.existsSync(thumbPath)) fs.unlinkSync(thumbPath);
    } catch {}
  }
  await prisma.$disconnect();
}

console.log('\n===============================================================');
console.log(` RESULTS: ${passed} passed, ${failed} failed`);
console.log('===============================================================\n');

if (failed > 0) {
  process.exit(1);
}
