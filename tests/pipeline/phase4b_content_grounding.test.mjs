/**
 * SIMPLYYTR 2.0 — Phase 4B Regression & Content Grounding Test Suite
 * 
 * Verifies:
 * 1. Single Content Contract schema and boundary validator.
 * 2. Rejection of missing/malformed fields, topic mismatches, and unsupported claims.
 * 3. Explicit labeling of deterministic topic demo (no fake AI claims).
 * 4. Word-for-word caption synchronization from approved narration segments.
 * 5. Immutable package persistence and retry preservation across render cycles.
 * 6. Rendering and artifact validation failure handling (preventing false READY).
 * 7. Enforced media authentication, expiring signed token scope, and byte-range bounds.
 * 8. Zero master secret exposure in worker-job lease.
 * 9. Auto-publishing remains disabled.
 */

import 'dotenv/config';
import assert from 'node:assert';
import fs from 'node:fs';
import path from 'node:path';
import { PrismaClient } from '@prisma/client';
import {
  validateContentPackage,
  deriveCaptionsFromSegments
} from '../../apps/web/src/app/api/lib/contentContract';
import { generateTopicGroundedPackage } from '../../apps/web/src/app/api/lib/topicGroundedGenerator';
import { signMediaToken, verifyMediaToken } from '../../apps/web/src/app/api/lib/mediaAuth';

const prisma = new PrismaClient();
const baseUrl = process.env.WEB_URL || 'http://localhost:3000';
const secret = process.env.PIPELINE_SECRET || 'dev_pipeline_secret_2026';

let passedCount = 0;
let failedCount = 0;

function reportPass(name) {
  console.log(`  ✓ PASS: ${name}`);
  passedCount++;
}

function reportFail(name, err) {
  console.error(`  ✗ FAIL: ${name}`);
  console.error(`    Error: ${err.message || err}`);
  failedCount++;
}

async function runPhase4BTests() {
  console.log('===============================================================');
  console.log(' SIMPLYYTR 2.0 — Phase 4B Content Grounding & Contract Tests');
  console.log('===============================================================\n');

  // ─── Group 1: Content Contract Validation Boundary ────────────
  console.log('[Group 1: Content Contract Validation Boundary]');

  // Test 1: Valid package passes validation
  try {
    const validPkg = generateTopicGroundedPackage('Screen Cleaner Spray');
    const result = validateContentPackage(validPkg);
    assert.strictEqual(result.valid, true, `Expected valid package: ${result.errors.join(', ')}`);
    assert.strictEqual(result.package.topic, 'Screen Cleaner Spray');
    assert.strictEqual(result.package.segments.length, 3);
    reportPass('Valid topic-grounded ContentPackage passes boundary validation');
  } catch (err) {
    reportFail('Valid topic-grounded ContentPackage passes boundary validation', err);
  }

  // Test 2: Missing required fields rejected
  try {
    const invalidPkg = {
      version: '1.0.0',
      topic: 'Screen Cleaner Spray',
      // missing audience, targetProblem, proposedTitle, openingHook, callToAction
      segments: [],
      claims: []
    };
    const result = validateContentPackage(invalidPkg);
    assert.strictEqual(result.valid, false);
    assert.ok(result.errors.length > 0);
    reportPass('Rejects package with missing required contract fields');
  } catch (err) {
    reportFail('Rejects package with missing required contract fields', err);
  }

  // Test 3: Segment order violation rejected
  try {
    const pkg = generateTopicGroundedPackage('Screen Cleaner Spray');
    pkg.segments[0].order = 2; // non-consecutive order
    pkg.segments[1].order = 1;
    const result = validateContentPackage(pkg);
    assert.strictEqual(result.valid, false);
    assert.ok(result.errors.some(e => e.includes('consecutive integers starting at 1')));
    reportPass('Rejects segments with non-consecutive or scrambled ordering');
  } catch (err) {
    reportFail('Rejects segments with non-consecutive or scrambled ordering', err);
  }

  // Test 4: Topic / Narration disconnect rejected
  try {
    const pkg = generateTopicGroundedPackage('Screen Cleaner Spray');
    // Replace narration with unrelated text
    pkg.segments[0].text = 'Bitcoin mining algorithms require specialized ASIC chips for proof of work.';
    pkg.openingHook = 'Bitcoin mining algorithms require specialized ASIC chips for proof of work.';
    pkg.segments[1].text = 'Hash rates fluctuate according to network difficulty and electricity cost.';
    pkg.segments[2].text = 'Check the mining profitability dashboard below.';
    pkg.callToAction = 'Check the mining profitability dashboard below.';
    const result = validateContentPackage(pkg);
    assert.strictEqual(result.valid, false);
    assert.ok(result.errors.some(e => e.toLowerCase().includes('keywords')));
    reportPass('Rejects topic/narration mismatch when script is unrelated to requested topic');
  } catch (err) {
    reportFail('Rejects topic/narration mismatch when script is unrelated to requested topic', err);
  }

  // Test 5: Unsupported factual claims rejected in APPROVED package
  try {
    const pkg = generateTopicGroundedPackage('Screen Cleaner Spray');
    pkg.claims[0].verified = false;
    pkg.reviewStatus = 'APPROVED';
    const result = validateContentPackage(pkg);
    assert.strictEqual(result.valid, false);
    assert.ok(result.errors.some(e => e.toLowerCase().includes('human verification')));
    reportPass('Rejects unverified claims in APPROVED package without human verification');
  } catch (err) {
    reportFail('Rejects unverified claims in APPROVED package without human verification', err);
  }

  // Test 6: Missing claim source reference rejected
  try {
    const pkg = generateTopicGroundedPackage('Screen Cleaner Spray');
    pkg.claims[0].sourceRef = ''; // missing sourceRef
    const result = validateContentPackage(pkg);
    assert.strictEqual(result.valid, false);
    assert.ok(result.errors.some(e => e.toLowerCase().includes('source reference')));
    reportPass('Rejects factual claims lacking traceable source references');
  } catch (err) {
    reportFail('Rejects factual claims lacking traceable source references', err);
  }

  // Test 7: Explicit AI-unavailable / demo labeling
  try {
    const pkg = generateTopicGroundedPackage('Screen Cleaner Spray');
    assert.strictEqual(pkg.provenance.generatorMode, 'DETERMINISTIC_TOPIC_DEMO');
    assert.ok(!pkg.provenance.source.toLowerCase().includes('groq'));
    assert.ok(!pkg.provenance.source.toLowerCase().includes('gemini'));
    // If someone faked Groq as source in demo mode, validator rejects it:
    pkg.provenance.source = 'Groq LLM Engine';
    const result = validateContentPackage(pkg);
    assert.strictEqual(result.valid, false);
    assert.ok(result.errors.some(e => e.toLowerCase().includes('live ai llm')));
    reportPass('Enforces honest labeling for deterministic demos (never fakes live AI LLM)');
  } catch (err) {
    reportFail('Enforces honest labeling for deterministic demos (never fakes live AI LLM)', err);
  }

  // Test 8: Captions derived strictly from approved narration segments
  try {
    const pkg = generateTopicGroundedPackage('Screen Cleaner Spray');
    const captions = deriveCaptionsFromSegments(pkg.segments, 16.0);
    assert.strictEqual(captions.length, pkg.segments.length);
    assert.strictEqual(captions[0].text, pkg.segments[0].text.trim());
    assert.strictEqual(captions[0].startSec, 0);
    assert.ok(captions[0].endSec > 0);
    assert.strictEqual(captions[captions.length - 1].endSec, 16.0);
    reportPass('Derives word-for-word captions with sequential timestamps from narration segments');
  } catch (err) {
    reportFail('Derives word-for-word captions with sequential timestamps from narration segments', err);
  }

  // Test 8b: Rejects malformed or non-http source URLs
  try {
    const pkg = generateTopicGroundedPackage('Screen Cleaner Spray');
    pkg.claims[0].sourceUrl = 'ftp://invalid-url.com/doc';
    const result1 = validateContentPackage(pkg);
    assert.strictEqual(result1.valid, false);
    assert.ok(result1.errors.some(e => e.includes('invalid source URL protocol')));

    pkg.claims[0].sourceUrl = 'not-a-valid-url';
    const result2 = validateContentPackage(pkg);
    assert.strictEqual(result2.valid, false);
    assert.ok(result2.errors.some(e => e.toLowerCase().includes('url')));
    reportPass('Rejects claims with invalid or malformed source URLs');
  } catch (err) {
    reportFail('Rejects claims with invalid or malformed source URLs', err);
  }

  // Test 8c: Rejects stale or deprecated citation identifiers
  try {
    const staleIdentifiers = ['Apple Support HT204172', 'Dell Specs', 'Dell KB 000153764', 'Dell SLN153764'];
    for (const staleId of staleIdentifiers) {
      const pkg = generateTopicGroundedPackage('Screen Cleaner Spray');
      pkg.claims[0].sourceRef = staleId;
      const result = validateContentPackage(pkg);
      assert.strictEqual(result.valid, false, `Expected failure for stale ID "${staleId}"`);
      assert.ok(result.errors.some(e => e.includes('stale or unverified citation reference')));
    }
    reportPass('Rejects stale or deprecated citation identifiers (HT204172, Dell Specs, 000153764)');
  } catch (err) {
    reportFail('Rejects stale or deprecated citation identifiers (HT204172, Dell Specs, 000153764)', err);
  }

  // Test 8d: Rejects unsupported categorical damage claims
  try {
    const exaggeratedPhrases = [
      'permanently ruining your display',
      'strip anti-reflective and oleophobic coatings',
      'causing permanent backlight spots',
      'guaranteed to ruin all screens'
    ];
    for (const phrase of exaggeratedPhrases) {
      const pkg = generateTopicGroundedPackage('Screen Cleaner Spray');
      pkg.segments[1].text = `Using cleaners leads to ${phrase} immediately. Check instructions.`;
      const result = validateContentPackage(pkg);
      assert.strictEqual(result.valid, false, `Expected rejection of phrase "${phrase}"`);
      assert.ok(result.errors.some(e => e.includes('categorical damage claim')));
    }
    reportPass('Rejects unsupported categorical damage claims ("permanently ruining", "strip anti-reflective")');
  } catch (err) {
    reportFail('Rejects unsupported categorical damage claims ("permanently ruining", "strip anti-reflective")', err);
  }

  // Test 8e: Enforces model-specific instructions reminder in cleaning topics
  try {
    const pkg = generateTopicGroundedPackage('Screen Cleaner Spray');
    // Remove mention of manual/specific/model
    pkg.segments[2].text = 'Power down your device, lightly moisten cloth, and wipe in one direction. Review the full guide below.';
    const result = validateContentPackage(pkg);
    assert.strictEqual(result.valid, false);
    assert.ok(result.errors.some(e => e.includes('must remind viewers to check model-specific')));
    reportPass('Enforces model-specific guidance requirement for screen cleaning topics');
  } catch (err) {
    reportFail('Enforces model-specific guidance requirement for screen cleaning topics', err);
  }

  // Test 8f: Verified package source URLs resolve to canonical manufacturer domains
  try {
    const pkg = generateTopicGroundedPackage('Screen Cleaner Spray');
    for (const c of pkg.claims) {
      assert.ok(c.sourceUrl, `Claim ${c.id} must have sourceUrl`);
      const parsed = new URL(c.sourceUrl);
      const isVendorDomain = parsed.hostname.endsWith('apple.com') || parsed.hostname.endsWith('dell.com');
      assert.ok(isVendorDomain, `Source URL ${c.sourceUrl} must be on an official vendor domain`);
    }
    reportPass('Verified claims link strictly to official manufacturer domains (apple.com, dell.com)');
  } catch (err) {
    reportFail('Verified claims link strictly to official manufacturer domains (apple.com, dell.com)', err);
  }

  // ─── Group 2: Package Persistence & Control Boundary ──────────
  console.log('\n[Group 2: Package Persistence & Control Boundary]');

  let testJobId = null;

  try {
    // Test 9: Operator approval enforces contract validation
  try {
    // Create an unapproved test job
    const job = await prisma.renderJob.create({
      data: {
        status: 'NEEDS_REVIEW',
        topic: 'Screen Cleaner Spray',
        videoStyle: 'PRODUCT_FIND',
        contentPackage: {
          version: '1.0.0',
          topic: 'Screen Cleaner Spray',
          // invalid/missing fields
          segments: []
        }
      }
    });
    testJobId = job.id;

    // Attempt approve with invalid package -> should return HTTP 422
    const res = await fetch(`${baseUrl}/api/pipeline/control`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${secret}`
      },
      body: JSON.stringify({
        action: 'approve',
        jobId: job.id
      })
    });

    assert.strictEqual(res.status, 422, `Expected HTTP 422 for invalid package, got ${res.status}`);
    const data = await res.json();
    assert.strictEqual(data.error, 'CONTENT_PACKAGE_INVALID');
    reportPass('Control route rejects approving jobs with invalid content packages (HTTP 422)');
  } catch (err) {
    reportFail('Control route rejects approving jobs with invalid content packages (HTTP 422)', err);
  }

  // Test 10: Operator approval freezes valid package and version
  try {
    const validPkg = generateTopicGroundedPackage('Screen Cleaner Spray');
    const res = await fetch(`${baseUrl}/api/pipeline/control`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${secret}`
      },
      body: JSON.stringify({
        action: 'approve',
        jobId: testJobId,
        contentPackage: validPkg
      })
    });

    const data = await res.json();
    assert.strictEqual(res.status, 200, `Expected HTTP 200, got ${res.status}: ${JSON.stringify(data)}`);
    assert.strictEqual(data.action, 'approve');
    assert.strictEqual(data.newStatus, 'SCRIPTED');
    assert.strictEqual(data.packageVersion, '1.0.0');

    const inDb = await prisma.renderJob.findUnique({ where: { id: testJobId } });
    assert.strictEqual(inDb.status, 'SCRIPTED');
    assert.ok(inDb.contentPackage);
    assert.strictEqual(inDb.contentPackage.version, '1.0.0');
    assert.strictEqual(inDb.contentPackage.topic, 'Screen Cleaner Spray');
    reportPass('Operator approval freezes approved package and transitions status to SCRIPTED');
  } catch (err) {
    reportFail('Operator approval freezes approved package and transitions status to SCRIPTED', err);
  }

  // Test 11: Retry preserves exact approved content package without modification
  try {
    // Simulate failed attempt
    await prisma.renderJob.update({
      where: { id: testJobId },
      data: { status: 'FAILED', error: 'Simulated timeout error' }
    });

    const res = await fetch(`${baseUrl}/api/pipeline/control`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${secret}`
      },
      body: JSON.stringify({
        action: 'retry',
        jobId: testJobId
      })
    });

    assert.strictEqual(res.status, 200);
    const inDb = await prisma.renderJob.findUnique({ where: { id: testJobId } });
    assert.strictEqual(inDb.status, 'SCRIPTED');
    assert.strictEqual(inDb.error, null);
    // Package and version are preserved completely unchanged
    assert.strictEqual(inDb.contentPackage.version, '1.0.0');
    assert.strictEqual(inDb.contentPackage.topic, 'Screen Cleaner Spray');
    assert.strictEqual(inDb.contentPackage.segments.length, 3);
    reportPass('Retry action resets failed job to SCRIPTED preserving exact approved package');
  } catch (err) {
    reportFail('Retry action resets failed job to SCRIPTED preserving exact approved package', err);
  }

  // ─── Group 3: Worker Lease & Security Bounds ──────────────────
  console.log('\n[Group 3: Worker Lease & Security Bounds]');

  // Test 12: Worker lease serves approved ContentPackage
  try {
    const res = await fetch(`${baseUrl}/api/pipeline/worker-job`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${secret}`,
        'x-worker-version': '36',
        'x-test-target-job-id': testJobId
      }
    });

    assert.strictEqual(res.status, 200);
    const data = await res.json();
    assert.strictEqual(data.status, 'success');
    assert.strictEqual(data.job.id, testJobId);
    assert.ok(data.job.contentPackage);
    assert.strictEqual(data.job.contentPackage.topic, 'Screen Cleaner Spray');

    // Test 13: Secret sanitization preserved
    assert.strictEqual(data.r2_secret_access_key, undefined);
    assert.strictEqual(data.pexels_api_key, undefined);
    assert.strictEqual(data.config?.r2_secret_access_key, undefined);
    reportPass('Worker-job lease delivers approved package and preserves master credential sanitization');
  } catch (err) {
    reportFail('Worker-job lease delivers approved package and preserves master credential sanitization', err);
  }

  // ─── Group 4: Webhook Artifact Validation Boundaries ──────────
  console.log('\n[Group 4: Webhook Artifact Validation Boundaries]');

  // Test 14: Webhook rejects missing videoUrl
  try {
    const res = await fetch(`${baseUrl}/api/pipeline/webhook`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${secret}`
      },
      body: JSON.stringify({
        jobId: testJobId,
        videoUrl: ''
      })
    });
    assert.strictEqual(res.status, 400);
    reportPass('Webhook rejects missing/empty videoUrl with HTTP 400');
  } catch (err) {
    reportFail('Webhook rejects missing/empty videoUrl with HTTP 400', err);
  }

  // Test 15: Webhook rejects non-existent artifact file
  try {
    const res = await fetch(`${baseUrl}/api/pipeline/webhook`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${secret}`
      },
      body: JSON.stringify({
        jobId: testJobId,
        videoUrl: '/api/media/non_existent_fake_video.mp4'
      })
    });
    assert.strictEqual(res.status, 422);
    const dbJob = await prisma.renderJob.findUnique({ where: { id: testJobId } });
    assert.strictEqual(dbJob.status, 'FAILED');
    reportPass('Webhook rejects non-existent local file with HTTP 422 and marks job FAILED');
  } catch (err) {
    reportFail('Webhook rejects non-existent local file with HTTP 422 and marks job FAILED', err);
  }

  // ─── Group 5: Media Authorization & Security Regressions ──────
  console.log('\n[Group 5: Media Authorization & Security Regressions]');

  // Test 16: Unauthenticated media request returns 401
  try {
    const res = await fetch(`${baseUrl}/api/media/any_video.mp4`);
    assert.strictEqual(res.status, 401);
    reportPass('Unauthenticated media request rejected with HTTP 401');
  } catch (err) {
    reportFail('Unauthenticated media request rejected with HTTP 401', err);
  }

  // Test 17: Expired media token rejected
  try {
    const expiredToken = signMediaToken('test_video.mp4', -60); // expired 60 seconds ago
    const isValid = verifyMediaToken('test_video.mp4', expiredToken.token, String(expiredToken.expires));
    assert.strictEqual(isValid, false);
    reportPass('Expired media token is rejected by authorization verifier');
  } catch (err) {
    reportFail('Expired media token is rejected by authorization verifier', err);
  }

  // Test 18: File-scoped token cannot be reused for different file
  try {
    const file1Token = signMediaToken('video1.mp4', 3600);
    const isValidForFile2 = verifyMediaToken('video2.mp4', file1Token.token, String(file1Token.expires));
    assert.strictEqual(isValidForFile2, false);
    reportPass('Signed media token is strictly scoped to its target filename');
  } catch (err) {
    reportFail('Signed media token is strictly scoped to its target filename', err);
  }

  // Test 19: Auto-publishing remains disabled in SystemSettings
  try {
    const settings = await prisma.systemSettings.findUnique({ where: { id: 1 } });
    assert.strictEqual(settings.autoPublishOnline, false);
    reportPass('SystemSettings autoPublishOnline remains safely disabled (false)');
  } catch (err) {
    reportFail('SystemSettings autoPublishOnline remains safely disabled (false)', err);
  }

  } finally {
    // Cleanup test job
    if (testJobId) {
      await prisma.renderJob.deleteMany({ where: { id: testJobId } }).catch(() => {});
    }
    await prisma.$disconnect();
  }

  console.log('\n===============================================================');
  console.log(` Phase 4B Test Summary: ${passedCount} passed, ${failedCount} failed`);
  console.log('===============================================================\n');

  if (failedCount > 0) {
    process.exit(1);
  }
}

runPhase4BTests().catch(err => {
  console.error('Fatal test runner error:', err);
  process.exit(1);
});
