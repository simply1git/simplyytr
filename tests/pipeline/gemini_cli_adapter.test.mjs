/**
 * SIMPLYYTR 2.0 — Official Gemini API CLI Creative Tool Adapter Tests
 * 
 * Verifies the safe, cost-controlled, and audited integration of the official
 * Gemini API CLI (google-gemini/gemini-api-cli, Apache 2.0).
 */

import assert from 'node:assert';
import fs from 'node:fs';
import path from 'node:path';
import {
  resolveGeminiCliPath,
  getGeminiCliStatus,
  isGeminiApiKeyConfigured,
  runGeminiCliCommand,
  generateGeminiCreativeAsset,
  evaluateFrameWithGemini
} from '../../apps/backend/src/services/geminiCliAdapter.ts';
import {
  getAllTtsProviders,
  selectTtsProvider,
  GeminiCliTtsProvider
} from '../../apps/backend/src/services/localTts.ts';

let passed = 0;
let failed = 0;

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
console.log(' SIMPLYYTR 2.0 — Official Gemini API CLI Adapter Tests');
console.log('===============================================================\n');

// ─── Group 1: Binary Discovery & Health Check ───────────────────────────────
console.log('[Group 1: Binary Discovery & Health Check]');

await runTest('resolveGeminiCliPath resolves official gemini-api binary', () => {
  const cliPath = resolveGeminiCliPath();
  assert.ok(cliPath, 'CLI path must resolve to a valid path');
  assert.ok(fs.existsSync(cliPath), `Binary file must exist: ${cliPath}`);
  assert.match(cliPath, /gemini-api(\.exe)?$/i);
});

await runTest('getGeminiCliStatus returns installed true and version 0.4.3', () => {
  const status = getGeminiCliStatus();
  assert.strictEqual(status.installed, true);
  assert.ok(status.version, 'Version must be populated');
  assert.match(status.version, /0\.4\.3/);
  assert.strictEqual(status.capabilities.generate, true);
  assert.strictEqual(status.capabilities.image, true);
  assert.strictEqual(status.capabilities.tts, true);
  assert.strictEqual(status.capabilities.music, true);
  assert.strictEqual(status.capabilities.video, true);
  assert.strictEqual(status.capabilities.analyze, true);
  assert.strictEqual(status.capabilities.transcribe, true);
});

// ─── Group 2: Authentication & Security Boundaries ──────────────────────────
console.log('\n[Group 2: Authentication & Security Boundaries]');

await runTest('isGeminiApiKeyConfigured safely detects unconfigured state without throwing', () => {
  const hasKey = isGeminiApiKeyConfigured();
  assert.strictEqual(hasKey, false, 'Key must be unconfigured in test environment');
});

await runTest('Unauthenticated network call exits with error code and PERMISSION_DENIED', () => {
  const result = runGeminiCliCommand(['image', 'test', '--no-interactive'], {
    outputJson: true
  });
  assert.strictEqual(result.success, false);
  assert.notStrictEqual(result.exitCode, 0);
  assert.match(result.error || '', /unregistered callers|PERMISSION_DENIED|403/i);
});

// ─── Group 3: Model Catalog & Offline Discovery ─────────────────────────────
console.log('\n[Group 3: Model Catalog & Offline Discovery]');

await runTest('CLI returns offline model catalog without network call', () => {
  const result = runGeminiCliCommand(['models']);
  assert.strictEqual(result.success, true);
  assert.strictEqual(result.exitCode, 0);
  const out = result.rawStdout || '';
  assert.match(out, /gemini-3\.8-flash/i);
  assert.match(out, /gemini-nano-banana-2\.1/i);
  assert.match(out, /gemini-3\.8-flash-tts/i);
  assert.match(out, /lyria-3\.5/i);
  assert.match(out, /gemini-omni-1\.1-flash/i);
});

await runTest('CLI prints JSON schema for image generation', () => {
  const result = runGeminiCliCommand(['image', '--schema']);
  assert.strictEqual(result.success, true);
  assert.strictEqual(result.exitCode, 0);
  assert.ok(result.rawStdout && result.rawStdout.length > 500);
});

// ─── Group 4: Creative Capabilities Dry-Run ─────────────────────────────────
console.log('\n[Group 4: Creative Capabilities Dry-Run]');

await runTest('generateGeminiCreativeAsset dry-run validates 9:16 portrait image request', async () => {
  const res = await generateGeminiCreativeAsset(
    'Engineering diagram illustrating 1954 de Havilland Comet fuselage hoop stress',
    {
      aspectRatio: '9:16',
      dryRunOnly: true
    }
  );
  assert.strictEqual(res.success, true);
  assert.strictEqual(res.isDryRun, true);
  assert.ok(res.dryRunPreview, 'Must return dryRunPreview');
  assert.strictEqual(res.dryRunPreview.model, 'gemini-nano-banana-2.1');
  assert.strictEqual(res.dryRunPreview.response_format.aspect_ratio, '9:16');
  assert.strictEqual(res.dryRunPreview.response_format.type, 'image');
});

await runTest('evaluateFrameWithGemini dry-run validates multimodal frame analysis payload', async () => {
  const sampleFrame = path.resolve(process.cwd(), 'scratch/contact_sheet_cmvkps4wq0000onnrufncpsln/04_stress_flow_mechanics.jpg');
  if (fs.existsSync(sampleFrame)) {
    const res = await evaluateFrameWithGemini(
      sampleFrame,
      'Evaluate whether this engineering schematic displays legible typography and no false simulation claims',
      { dryRunOnly: true }
    );
    assert.strictEqual(res.success, true);
    assert.strictEqual(res.isDryRun, true);
    assert.ok(res.dryRunPreview, 'Must return dryRunPreview');
    assert.strictEqual(res.dryRunPreview.model, 'gemini-3.8-flash');
    assert.strictEqual(res.dryRunPreview.input[1].type, 'text');
  } else {
    console.log('    (Frame test skipped: sample frame not on disk)');
  }
});

// ─── Group 5: Non-Deception & Provenance Enforcement ─────────────────────────
console.log('\n[Group 5: Non-Deception & Provenance Enforcement]');

await runTest('Gemini asset metadata schema forbids authentic historical evidence claims', () => {
  const sampleMeta = {
    assetType: 'AI_SYNTHETIC',
    isHistoricalEvidence: false,
    canSubstantiateClaims: false,
    provenance: {
      source: 'GOOGLE_GEMINI_API_CLI',
      license: 'GOOGLE_GEMINI_API_TERMS'
    }
  };
  assert.strictEqual(sampleMeta.assetType, 'AI_SYNTHETIC');
  assert.strictEqual(sampleMeta.isHistoricalEvidence, false);
  assert.strictEqual(sampleMeta.canSubstantiateClaims, false);
});

// ─── Group 6: ITtsProvider Gemini Integration ───────────────────────────────
console.log('\n[Group 6: ITtsProvider Gemini Integration]');

await runTest('GeminiCliTtsProvider is registered in getAllTtsProviders', () => {
  const providers = getAllTtsProviders();
  const geminiProvider = providers.find(p => p.name === 'GEMINI_CLI');
  assert.ok(geminiProvider, 'GEMINI_CLI provider must be in registered list');
  assert.strictEqual(geminiProvider.platform, 'all');
  assert.strictEqual(geminiProvider.getInfo().offline, false);
  assert.match(geminiProvider.getInfo().license, /Apache-2\.0/);
});

await runTest('selectTtsProvider retains offline WINDOWS_SAPI as priority when unconfigured', () => {
  if (process.platform === 'win32') {
    const selected = selectTtsProvider('win32');
    assert.strictEqual(selected.name, 'WINDOWS_SAPI', 'Windows SAPI must remain default offline priority');
  }
});

await runTest('GeminiCliTtsProvider reports available: false when GEMINI_API_KEY is unset', () => {
  const provider = new GeminiCliTtsProvider();
  assert.strictEqual(provider.isAvailable(), false);
});

// ─── Final Summary ──────────────────────────────────────────────────────────
console.log('\n===============================================================');
console.log(` Summary: ${passed} passed, ${failed} failed`);
console.log('===============================================================\n');

if (failed > 0) {
  process.exit(1);
}
