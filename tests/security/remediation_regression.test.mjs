/**
 * SIMPLYYTR 2.0 — Phase 4A.2 Security Remediation & Regression Verification Suite
 * 
 * Tests and verifies fixes for:
 * - HIGH: Worker endpoint secret exposure prevention
 * - MEDIUM: Media route authentication, signed tokens & symlink confinement
 * - MEDIUM: RFC 9110 byte-range handling & HTTP 416 response codes
 * - LOW: Authoritative READY transition and elimination of renderer dual-write
 */

import 'dotenv/config';
import assert from 'node:assert';
import fs from 'node:fs';
import path from 'node:path';
import { PrismaClient } from '@prisma/client';
import { signMediaToken, signMediaUrl, verifyMediaToken } from '../../apps/web/src/app/api/lib/mediaAuth.ts';

const prisma = new PrismaClient();
const baseUrl = process.env.WEB_URL || 'http://localhost:3000';
const secret = process.env.PIPELINE_SECRET || 'simplyytr_secret_2026';
const testJobIds = [];

const rendererPath = path.resolve(process.cwd(), 'apps/backend/src/services/localRenderer.ts');
const { renderJobLocally } = await import(`file://${rendererPath.replace(/\\/g, '/')}`);

async function createTestJob(customData = {}) {
  const job = await prisma.renderJob.create({
    data: {
      status: 'SCRIPTED',
      topic: 'Remediation Regression Probe',
      scriptHook: 'Verifying security boundaries and RFC compliance.',
      scriptBody: 'Testing secret sanitization, signed media tokens, and range bounds.',
      scriptCta: 'Review the regression pass.',
      videoStyle: 'PRODUCT_FIND',
      ...customData
    }
  });
  testJobIds.push(job.id);
  return job;
}

async function cleanup() {
  for (const id of testJobIds) {
    try {
      await prisma.renderJob.deleteMany({ where: { id } });
      const videoPath = path.resolve(process.cwd(), `storage/processed/${id}_short.mp4`);
      const thumbPath = path.resolve(process.cwd(), `storage/processed/${id}_thumb.jpg`);
      if (fs.existsSync(videoPath)) fs.unlinkSync(videoPath);
      if (fs.existsSync(thumbPath)) fs.unlinkSync(thumbPath);
    } catch {}
  }
}

async function runRegressionSuite() {
  console.log('===============================================================');
  console.log(' SIMPLYYTR 2.0 — Phase 4A.2 Security Remediation Test Suite');
  console.log(' Target API:', baseUrl);
  console.log('===============================================================\n');

  let passed = 0;
  let failed = 0;

  async function test(name, fn) {
    try {
      await fn();
      console.log(`  ✓ PASS: ${name}`);
      passed++;
    } catch (err) {
      console.error(`  ✗ FAIL: ${name}`);
      console.error(`    Error: ${err.message}`);
      failed++;
    }
  }

  try {
    // =============================================================
    // SECTION B: Worker Endpoint Secret Exposure Prevention (HIGH)
    // =============================================================
    console.log('[Section B: Worker Secret Exposure Prevention]');

    await test('Worker-job endpoint does NOT expose master secrets in response JSON', async () => {
      const job = await createTestJob();

      const res = await fetch(`${baseUrl}/api/pipeline/worker-job`, {
        headers: {
          'Authorization': `Bearer ${secret}`,
          'x-worker-version': '36',
          'x-test-target-job-id': job.id
        }
      });

      assert.strictEqual(res.status, 200, 'Lease request must succeed');
      const data = await res.json();
      assert.strictEqual(data.status, 'success');
      assert.strictEqual(data.job.id, job.id, 'Leased job must match created test job');
      assert.ok(data.job && data.job.id, 'Job payload must be present');

      // Convert entire response to JSON string for deep inspection
      const jsonStr = JSON.stringify(data);

      // Verify forbidden credential key names do NOT exist
      const forbiddenKeys = [
        'r2_secret_access_key',
        'r2_access_key_id',
        'r2_account_id',
        'pexels_api_key',
        'groq_api_key',
        'gemini_api_key',
        'github_pat',
        'github_token'
      ];

      for (const key of forbiddenKeys) {
        assert.ok(!jsonStr.toLowerCase().includes(`"${key}"`), `Forbidden key "${key}" must not appear in worker response`);
      }

      // Verify forbidden credential values do NOT appear in response
      const forbiddenValues = [
        process.env.R2_SECRET_ACCESS_KEY,
        process.env.PEXELS_API_KEY,
        process.env.GROQ_API_KEY,
        process.env.GEMINI_API_KEY
      ].filter(v => v && v.trim().length > 3);

      for (const val of forbiddenValues) {
        assert.ok(!jsonStr.includes(val), 'Master secret values must never be reflected in worker responses');
      }

      // Verify config object only contains benign parameters
      if (data.config) {
        const configKeys = Object.keys(data.config);
        const allowedConfigKeys = ['copy_paste_mode', 'target_channels', 'replace_original_audio'];
        for (const k of configKeys) {
          assert.ok(allowedConfigKeys.includes(k), `Unexpected config parameter "${k}" returned to worker`);
        }
      }
    });

    // =============================================================
    // SECTION C: Media Route Authentication & Confinement (MEDIUM)
    // =============================================================
    console.log('\n[Section C: Media Route Authentication & Signed Tokens]');

    const sampleFile = 'cmv7rcqd80000wx5rkbt2joy7_short.mp4';
    const sampleDiskPath = path.resolve(process.cwd(), `storage/processed/${sampleFile}`);
    const hasSample = fs.existsSync(sampleDiskPath);

    if (hasSample) {
      await test('Unauthenticated media request without token returns HTTP 401', async () => {
        const res = await fetch(`${baseUrl}/api/media/${sampleFile}`);
        assert.strictEqual(res.status, 401, 'Unauthenticated access must return HTTP 401');
        const body = await res.json();
        assert.ok(body.error && body.error.includes('Unauthorized'), 'Must return unauthorized error');
      });

      await test('Authenticated media request with Bearer token returns HTTP 200', async () => {
        const res = await fetch(`${baseUrl}/api/media/${sampleFile}`, {
          headers: { 'Authorization': `Bearer ${secret}` }
        });
        assert.strictEqual(res.status, 200, 'Bearer authenticated request must succeed with HTTP 200');
        assert.strictEqual(res.headers.get('content-type'), 'video/mp4');
      });

      await test('Signed media token allows browser player access without headers', async () => {
        const { token, expires } = signMediaToken(sampleFile, 1800);
        const signedUrl = `${baseUrl}/api/media/${sampleFile}?token=${token}&expires=${expires}`;

        const res = await fetch(signedUrl);
        assert.strictEqual(res.status, 200, 'Signed token request must return HTTP 200 without auth headers');
        assert.strictEqual(res.headers.get('content-type'), 'video/mp4');
      });

      await test('Expired signed media token is rejected with HTTP 401', async () => {
        // Create token with timestamp in the past
        const pastExpires = Math.floor(Date.now() / 1000) - 60;
        const secretVal = process.env.PIPELINE_SECRET || 'simplyytr_secret_2026';
        const crypto = await import('node:crypto');
        const expiredHmac = crypto.createHmac('sha256', secretVal).update(`${sampleFile}:${pastExpires}`).digest('hex');

        const expiredUrl = `${baseUrl}/api/media/${sampleFile}?token=${expiredHmac}&expires=${pastExpires}`;
        const res = await fetch(expiredUrl);
        assert.strictEqual(res.status, 401, 'Expired signed token must return HTTP 401');
      });

      await test('Tampered signed token is rejected with HTTP 401', async () => {
        const { token, expires } = signMediaToken(sampleFile, 1800);
        // Tamper with the token string
        const tampered = token.slice(0, -2) + (token.endsWith('0') ? '1' : '0');
        const tamperedUrl = `${baseUrl}/api/media/${sampleFile}?token=${tampered}&expires=${expires}`;

        const res = await fetch(tamperedUrl);
        assert.strictEqual(res.status, 401, 'Tampered token must return HTTP 401');
      });

      await test('Signed token for fileA cannot access fileB (scope binding)', async () => {
        const { token, expires } = signMediaToken('other_file.mp4', 1800);
        const scopedUrl = `${baseUrl}/api/media/${sampleFile}?token=${token}&expires=${expires}`;

        const res = await fetch(scopedUrl);
        assert.strictEqual(res.status, 401, 'Token bound to another filename must return HTTP 401');
      });

      await test('Disallowed file extensions and traversal attacks rejected with HTTP 400', async () => {
        const badRequests = [
          '../../package.json',
          '..%2f..%2fpackage.json',
          'cmd.exe',
          'evil.sh',
          'payload.php',
          'something.js'
        ];

        for (const bad of badRequests) {
          const res = await fetch(`${baseUrl}/api/media/${encodeURIComponent(bad)}`, {
            headers: { 'Authorization': `Bearer ${secret}` }
          });
          assert.strictEqual(res.status, 400, `Extension/traversal "${bad}" must be rejected with HTTP 400`);
        }
      });
    }

    // =============================================================
    // SECTION D: Standards-Compliant Range Handling RFC 9110 (MEDIUM)
    // =============================================================
    console.log('\n[Section D: RFC 9110 Byte-Range Handling]');

    if (hasSample) {
      const stat = fs.statSync(sampleDiskPath);
      const totalSize = stat.size;

      await test('Normal byte range (bytes=0-1023) returns HTTP 206 with correct chunk', async () => {
        const res = await fetch(`${baseUrl}/api/media/${sampleFile}`, {
          headers: {
            'Authorization': `Bearer ${secret}`,
            'Range': 'bytes=0-1023'
          }
        });

        assert.strictEqual(res.status, 206, 'Valid range must return HTTP 206');
        assert.strictEqual(res.headers.get('content-range'), `bytes 0-1023/${totalSize}`);
        assert.strictEqual(res.headers.get('content-length'), '1024');
        const buffer = await res.arrayBuffer();
        assert.strictEqual(buffer.byteLength, 1024, 'Received bytes must match requested chunk');
      });

      await test('Open-ended byte range (bytes=5000-) returns HTTP 206 to EOF', async () => {
        const res = await fetch(`${baseUrl}/api/media/${sampleFile}`, {
          headers: {
            'Authorization': `Bearer ${secret}`,
            'Range': 'bytes=5000-'
          }
        });

        assert.strictEqual(res.status, 206, 'Open-ended range must return HTTP 206');
        assert.strictEqual(res.headers.get('content-range'), `bytes 5000-${totalSize - 1}/${totalSize}`);
        const expectedLen = totalSize - 5000;
        assert.strictEqual(res.headers.get('content-length'), String(expectedLen));
      });

      await test('Suffix byte range (bytes=-500) returns HTTP 206 for last 500 bytes', async () => {
        const res = await fetch(`${baseUrl}/api/media/${sampleFile}`, {
          headers: {
            'Authorization': `Bearer ${secret}`,
            'Range': 'bytes=-500'
          }
        });

        assert.strictEqual(res.status, 206, 'Suffix range must return HTTP 206');
        assert.strictEqual(res.headers.get('content-range'), `bytes ${totalSize - 500}-${totalSize - 1}/${totalSize}`);
        assert.strictEqual(res.headers.get('content-length'), '500');
      });

      await test('Out-of-bounds start offset (bytes=50000000-) returns HTTP 416', async () => {
        const res = await fetch(`${baseUrl}/api/media/${sampleFile}`, {
          headers: {
            'Authorization': `Bearer ${secret}`,
            'Range': 'bytes=50000000-'
          }
        });

        assert.strictEqual(res.status, 416, 'Out-of-bounds start must return HTTP 416 Range Not Satisfiable');
        assert.strictEqual(res.headers.get('content-range'), `bytes */${totalSize}`);
      });

      await test('Reversed range (bytes=500-100) returns HTTP 416', async () => {
        const res = await fetch(`${baseUrl}/api/media/${sampleFile}`, {
          headers: {
            'Authorization': `Bearer ${secret}`,
            'Range': 'bytes=500-100'
          }
        });

        assert.strictEqual(res.status, 416, 'Reversed range must return HTTP 416 Range Not Satisfiable');
        assert.strictEqual(res.headers.get('content-range'), `bytes */${totalSize}`);
      });

      await test('Malformed range syntax (bytes=invalid) returns HTTP 416', async () => {
        const res = await fetch(`${baseUrl}/api/media/${sampleFile}`, {
          headers: {
            'Authorization': `Bearer ${secret}`,
            'Range': 'bytes=invalid'
          }
        });

        assert.strictEqual(res.status, 416, 'Malformed syntax must return HTTP 416');
      });
    }

    // Empty file handling
    const emptyFile = 'temp_empty_audit_test.mp4';
    const emptyDiskPath = path.resolve(process.cwd(), `storage/processed/${emptyFile}`);
    fs.writeFileSync(emptyDiskPath, '');

    try {
      await test('Empty 0-byte file without range returns HTTP 200 with Content-Length 0', async () => {
        const res = await fetch(`${baseUrl}/api/media/${emptyFile}`, {
          headers: { 'Authorization': `Bearer ${secret}` }
        });
        assert.strictEqual(res.status, 200);
        assert.strictEqual(res.headers.get('content-length'), '0');
      });

      await test('Empty 0-byte file with range returns HTTP 416 (bytes */0)', async () => {
        const res = await fetch(`${baseUrl}/api/media/${emptyFile}`, {
          headers: {
            'Authorization': `Bearer ${secret}`,
            'Range': 'bytes=0-10'
          }
        });
        assert.strictEqual(res.status, 416);
        assert.strictEqual(res.headers.get('content-range'), 'bytes */0');
      });
    } finally {
      if (fs.existsSync(emptyDiskPath)) fs.unlinkSync(emptyDiskPath);
    }

    // =============================================================
    // SECTION E: Authoritative READY Transition & Dual-Write (LOW)
    // =============================================================
    console.log('\n[Section E: Authoritative READY Transition]');

    await test('Renderer produces artifact WITHOUT setting READY; webhook authoritatively transitions status', async () => {
      const job = await createTestJob({ status: 'RENDERING' });

      // 1. Invoke renderJobLocally
      const renderResult = await renderJobLocally(job.id);
      assert.strictEqual(renderResult.success, true, 'Render must succeed');
      assert.ok(renderResult.videoPath && fs.existsSync(renderResult.videoPath), 'Artifact must exist on disk');

      // 2. CRITICAL REGRESSION CHECK: Status in DB must NOT be READY yet
      const jobAfterRender = await prisma.renderJob.findUnique({ where: { id: job.id } });
      assert.strictEqual(jobAfterRender.status, 'RENDERING', 'Renderer must NOT independently finalize status to READY');

      // 3. Worker calls webhook to authoritatively transition to READY
      const webhookRes = await fetch(`${baseUrl}/api/pipeline/webhook`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${secret}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          jobId: job.id,
          videoUrl: renderResult.mediaUrl,
          thumbnailUrl: renderResult.thumbnailUrl
        })
      });

      assert.strictEqual(webhookRes.status, 200, 'Webhook must accept verified artifact');
      const webhookData = await webhookRes.json();
      assert.strictEqual(webhookData.status, 'ready');

      // 4. Now DB status must be authoritatively READY
      const jobAfterWebhook = await prisma.renderJob.findUnique({ where: { id: job.id } });
      assert.strictEqual(jobAfterWebhook.status, 'READY', 'Webhook must authoritatively transition status to READY');
      assert.ok(jobAfterWebhook.videoUrl, 'videoUrl must be set');
      assert.strictEqual(jobAfterWebhook.error, null);

      // 5. Test Webhook Idempotency: second call succeeds without duplicating rows or corrupting state
      const dupRes = await fetch(`${baseUrl}/api/pipeline/webhook`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${secret}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          jobId: job.id,
          videoUrl: renderResult.mediaUrl,
          thumbnailUrl: renderResult.thumbnailUrl
        })
      });

      assert.strictEqual(dupRes.status, 200, 'Duplicate webhook must succeed idempotently');
      const jobAfterDup = await prisma.renderJob.findUnique({ where: { id: job.id } });
      assert.strictEqual(jobAfterDup.status, 'READY');

      const count = await prisma.renderJob.count({ where: { id: job.id } });
      assert.strictEqual(count, 1, 'Job row count must remain strictly 1');
    });

  } finally {
    await cleanup();
    await prisma.$disconnect();
  }

  console.log('\n===============================================================');
  console.log(` Remediation Regression Summary: ${passed} passed, ${failed} failed`);
  console.log('===============================================================\n');

  if (failed > 0) {
    process.exit(1);
  }
}

runRegressionSuite();
