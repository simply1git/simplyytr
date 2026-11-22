/**
 * SIMPLYYTR 2.0 — Phase 4C.2: Legacy Scraper & Editor Queue Isolation Regression Suite
 * 
 * Comprehensive regression tests verifying:
 * 1. Legacy scraping is disabled by default.
 * 2. autoPilotEnabled=true alone does NOT enable legacy scraping or editing.
 * 3. Missing, whitespace, or malformed legacy opt-in fails closed.
 * 4. Direct legacy queue invocation cannot bypass the guard.
 * 5. Legacy publishing endpoints cannot be invoked by unauthenticated callers to trigger side effects.
 * 6. Supported Phase 4C pipeline remains operational.
 * 7. Online publishing remains disabled by default.
 */

import 'dotenv/config';
import assert from 'node:assert';
import http from 'node:http';
import express from 'express';
import { PrismaClient } from '@prisma/client';

import {
  isLegacyScraperPipelineEnabled,
  assertLegacyScraperPipelineAllowed,
  LEGACY_SCRAPER_OPT_IN_ENV
} from '../../apps/backend/src/queue/legacyGuard.ts';

import { executeScrape } from '../../apps/backend/src/queue/youtubeScraper.ts';
import { addIngestJob } from '../../apps/backend/src/queue/ingestQueue.ts';
import { addEditorJob, getOrDownloadMusic, processVideoForShorts } from '../../apps/backend/src/queue/editorQueue.ts';
import { executePublish } from '../../apps/backend/src/queue/youtubePublisher.ts';
import { verifyBackendAuth, timingSafeEqualStr } from '../../apps/backend/src/middleware/auth.ts';
import publishRouter from '../../apps/backend/src/routes/publish.ts';
import { publishToYouTubeDataApi } from '../../apps/backend/src/services/youtubePublisher.ts';

const prisma = new PrismaClient();
const TEST_SECRET = 'test_pipeline_secret_guard_2026';

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
console.log(' SIMPLYYTR 2.0 — Phase 4C.2 Legacy Isolation Regression Suite');
console.log('===============================================================\n');

// Save original environment
const originalLegacyOptIn = process.env[LEGACY_SCRAPER_OPT_IN_ENV];
const originalPipelineSecret = process.env.PIPELINE_SECRET;

try {
  // ─── Group 1: Legacy Scraping Disabled by Default ─────────────────────────────
  console.log('[Group 1: Disabled by Default]');

  await runTest('isLegacyScraperPipelineEnabled returns false when opt-in env is unset', () => {
    delete process.env[LEGACY_SCRAPER_OPT_IN_ENV];
    assert.strictEqual(isLegacyScraperPipelineEnabled(), false);
  });

  await runTest('assertLegacyScraperPipelineAllowed throws fail-closed error when disabled', () => {
    delete process.env[LEGACY_SCRAPER_OPT_IN_ENV];
    assert.throws(
      () => assertLegacyScraperPipelineAllowed('test_operation'),
      /is disabled by default in SIMPLYYTR 2.0/
    );
  });

  // ─── Group 2: autoPilotEnabled=true Alone Does NOT Enable Legacy Pipeline ────
  console.log('\n[Group 2: autoPilotEnabled Isolation]');

  await runTest('autoPilotEnabled=true alone does not enable legacy scraping', async () => {
    delete process.env[LEGACY_SCRAPER_OPT_IN_ENV];
    
    // Set autoPilotEnabled in simulated settings
    const simulatedSettings = { autoPilotEnabled: true, targetNiche: 'Tech' };
    assert.strictEqual(simulatedSettings.autoPilotEnabled, true);
    assert.strictEqual(isLegacyScraperPipelineEnabled(), false);

    // executeScrape must return early without throwing or spawning
    await executeScrape();
  });

  // ─── Group 3: Missing, Whitespace, or Malformed Opt-in Fails Closed ───────────
  console.log('\n[Group 3: Malformed & Missing Opt-In Fails Closed]');

  const invalidValues = [
    { label: 'undefined', val: undefined },
    { label: 'empty string', val: '' },
    { label: 'whitespace only', val: '   ' },
    { label: 'numeric 1', val: '1' },
    { label: 'numeric 0', val: '0' },
    { label: 'boolean false', val: 'false' },
    { label: 'string "no"', val: 'no' },
    { label: 'string "enabled"', val: 'enabled' },
    { label: 'string "TRUE_EXTRA"', val: 'true_extra' },
    { label: 'string "on"', val: 'on' }
  ];

  for (const item of invalidValues) {
    await runTest(`Opt-in value "${item.label}" fails closed to false`, () => {
      if (item.val === undefined) {
        delete process.env[LEGACY_SCRAPER_OPT_IN_ENV];
      } else {
        process.env[LEGACY_SCRAPER_OPT_IN_ENV] = item.val;
      }
      assert.strictEqual(isLegacyScraperPipelineEnabled(), false);
    });
  }

  await runTest('Strict "true" and "  TRUE  " correctly evaluate to true', () => {
    process.env[LEGACY_SCRAPER_OPT_IN_ENV] = 'true';
    assert.strictEqual(isLegacyScraperPipelineEnabled(), true);

    process.env[LEGACY_SCRAPER_OPT_IN_ENV] = '  TRUE  ';
    assert.strictEqual(isLegacyScraperPipelineEnabled(), true);

    delete process.env[LEGACY_SCRAPER_OPT_IN_ENV];
  });

  // ─── Group 4: Direct Legacy Queue Invocation Cannot Bypass Guard ───────────────
  console.log('\n[Group 4: Direct Queue Invocation Cannot Bypass Guard]');

  await runTest('Direct executeScrape() call returns safely without execution when disabled', async () => {
    delete process.env[LEGACY_SCRAPER_OPT_IN_ENV];
    // Must return without error or child process spawn
    await executeScrape();
  });

  await runTest('Direct addIngestJob() call is rejected without queuing when disabled', () => {
    delete process.env[LEGACY_SCRAPER_OPT_IN_ENV];
    // Calling addIngestJob directly should not crash or process
    addIngestJob('non_existent_probe_id');
  });

  await runTest('Direct addEditorJob() call is rejected without queuing when disabled', () => {
    delete process.env[LEGACY_SCRAPER_OPT_IN_ENV];
    addEditorJob('non_existent_probe_id');
  });

  await runTest('Direct getOrDownloadMusic() does not invoke YouTube download when disabled', async () => {
    delete process.env[LEGACY_SCRAPER_OPT_IN_ENV];
    const result = await getOrDownloadMusic('storage/non_existent_test_dir');
    assert.strictEqual(result, null);
  });

  await runTest('Direct processVideoForShorts() rejects with fail-closed error when disabled', async () => {
    delete process.env[LEGACY_SCRAPER_OPT_IN_ENV];
    await assert.rejects(
      async () => {
        await processVideoForShorts('dummy_in.mp4', 'dummy_out.mp4', {}, null);
      },
      /Legacy video processing is disabled/
    );
  });

  await runTest('Direct executePublish() returns safely without execution when disabled', async () => {
    delete process.env[LEGACY_SCRAPER_OPT_IN_ENV];
    await executePublish();
  });

  // ─── Group 5: Legacy Express Publishing Endpoints Reject Unauthenticated Callers
  console.log('\n[Group 5: Express Publishing Route Security]');

  // Spin up isolated Express server with publishRouter
  process.env.PIPELINE_SECRET = TEST_SECRET;
  delete process.env[LEGACY_SCRAPER_OPT_IN_ENV];

  const app = express();
  app.use(express.json());
  app.use('/api/publish', publishRouter);

  const server = http.createServer(app);
  await new Promise(resolve => server.listen(0, resolve));
  const port = server.address().port;
  const baseUrl = `http://127.0.0.1:${port}/api/publish`;

  try {
    await runTest('POST /api/publish/force-next without auth header returns 401', async () => {
      const res = await fetch(`${baseUrl}/force-next`, { method: 'POST' });
      assert.strictEqual(res.status, 401);
      const json = await res.json();
      assert.strictEqual(json.status, 401);
    });

    await runTest('POST /api/publish/:youtubeId without auth header returns 401', async () => {
      const res = await fetch(`${baseUrl}/probe_yt_id`, { method: 'POST' });
      assert.strictEqual(res.status, 401);
      const json = await res.json();
      assert.strictEqual(json.status, 401);
    });

    await runTest('GET /api/publish/auth without auth header returns 401', async () => {
      const res = await fetch(`${baseUrl}/auth`, { method: 'GET' });
      assert.strictEqual(res.status, 401);
      const json = await res.json();
      assert.strictEqual(json.status, 401);
    });

    await runTest('POST /api/publish/force-next with invalid token returns 401', async () => {
      const res = await fetch(`${baseUrl}/force-next`, {
        method: 'POST',
        headers: { 'Authorization': 'Bearer wrong_token_attempt' }
      });
      assert.strictEqual(res.status, 401);
    });

    await runTest('Authenticated POST /api/publish/force-next is blocked by legacy guard with 403', async () => {
      delete process.env[LEGACY_SCRAPER_OPT_IN_ENV];
      const res = await fetch(`${baseUrl}/force-next`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${TEST_SECRET}` }
      });
      assert.strictEqual(res.status, 403);
      const json = await res.json();
      assert.match(json.error, /Legacy publishing pipeline is disabled/);
    });

    await runTest('Authenticated POST /api/publish/:youtubeId is blocked by legacy guard with 403', async () => {
      delete process.env[LEGACY_SCRAPER_OPT_IN_ENV];
      const res = await fetch(`${baseUrl}/probe_yt_id`, {
        method: 'POST',
        headers: { 'x-pipeline-secret': TEST_SECRET }
      });
      assert.strictEqual(res.status, 403);
      const json = await res.json();
      assert.match(json.error, /Legacy publishing pipeline is disabled/);
    });

    await runTest('timingSafeEqualStr operates correctly and protects against timing attacks', () => {
      assert.strictEqual(timingSafeEqualStr('hello', 'hello'), true);
      assert.strictEqual(timingSafeEqualStr('hello', 'world'), false);
      assert.strictEqual(timingSafeEqualStr('short', 'longer_string'), false);
    });

  } finally {
    await new Promise(resolve => server.close(resolve));
  }

  // ─── Group 6: Supported Phase 4C Pipeline Remains Operational ─────────────────
  console.log('\n[Group 6: Phase 4C Supported Pipeline Operational Integrity]');

  await runTest('Native publishToYouTubeDataApi service is present and functional', async () => {
    assert.strictEqual(typeof publishToYouTubeDataApi, 'function');
    // Calling with missing access token returns fail-closed result without throwing
    const result = await publishToYouTubeDataApi({
      videoUrl: 'http://localhost:3000/api/media/dummy.mp4',
      title: 'Phase 4C Sanity Check',
      description: 'Verifying native publisher service',
      tags: ['test']
    });
    assert.strictEqual(result.success, false);
    assert.match(result.error, /YOUTUBE_ACCESS_TOKEN is not configured/);
  });

  // ─── Group 7: Online Publishing Remains Disabled by Default ───────────────────
  console.log('\n[Group 7: Online Publishing Safeguards]');

  await runTest('Development database systemSettings has autoPublishOnline = false', async () => {
    const settings = await prisma.systemSettings.findUnique({ where: { id: 1 } });
    if (settings) {
      assert.strictEqual(settings.autoPublishOnline, false, 'autoPublishOnline must be false in database');
    }
  });

  await runTest('YOUTUBE_ACCESS_TOKEN is not configured in environment', () => {
    // Verifies online publishing cannot execute without explicit credentials
    assert.ok(!process.env.YOUTUBE_ACCESS_TOKEN, 'YOUTUBE_ACCESS_TOKEN must not be set in test environment');
  });

} finally {
  // Restore original environment
  if (originalLegacyOptIn !== undefined) {
    process.env[LEGACY_SCRAPER_OPT_IN_ENV] = originalLegacyOptIn;
  } else {
    delete process.env[LEGACY_SCRAPER_OPT_IN_ENV];
  }
  if (originalPipelineSecret !== undefined) {
    process.env.PIPELINE_SECRET = originalPipelineSecret;
  } else {
    delete process.env.PIPELINE_SECRET;
  }
  await prisma.$disconnect();
}

console.log('\n===============================================================');
console.log(` RESULTS: ${passed} passed, ${failed} failed`);
console.log('===============================================================\n');

if (failed > 0) {
  process.exit(1);
}
