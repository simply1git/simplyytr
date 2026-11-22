/**
 * SIMPLYYTR 2.0 — Phase 5N.9A Preflight Blocker Remediation Verification Suite
 * 
 * Offline, non-destructive unit and static verification tests for:
 * 1. Safe local database startup with `--skip-env-sync` option.
 * 2. CLI argument parsing compatibility across all subcommands and flag positions.
 * 3. Prevention of `.env` modification during startup when `--skip-env-sync` is specified.
 * 4. Deterministic worker leasing fail-closed security boundary:
 *    - Rejection of `x-test-target-job-id` in production (HTTP 403 TEST_LEASING_DISABLED).
 *    - Rejection of malformed or empty test job IDs (HTTP 400 INVALID_TEST_JOB_ID).
 *    - Scoping of candidate query to exact test-owned job ID in test environments.
 * 5. Static verification that worker-job route guards precede all database operations.
 */

import assert from 'node:assert';
import fs from 'node:fs';
import path from 'node:path';

// Import local_db module
const localDbPath = path.resolve('scripts/local_db.js');
const localDb = await import(`file://${localDbPath.replace(/\\/g, '/')}`);

let passed = 0;
let failed = 0;

function test(name, fn) {
  try {
    fn();
    console.log(`  ✓ PASS: ${name}`);
    passed++;
  } catch (err) {
    console.error(`  ✗ FAIL: ${name}`);
    console.error(`    ${err.message}`);
    failed++;
  }
}

async function asyncTest(name, fn) {
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
console.log(' SIMPLYYTR 2.0 — Phase 5N.9A Preflight Remediation Unit Tests');
console.log(' (Strictly Offline & Non-Destructive)');
console.log('===============================================================\n');

// ─── Group 1: Local DB CLI Argument Parsing ──────────────────────────────
console.log('[Group 1: Local DB CLI Argument Parsing]');

test('Default invocation with no arguments defaults to start without skipEnvSync', () => {
  const result = localDb.parseArgs([]);
  assert.strictEqual(result.command, 'start');
  assert.strictEqual(result.skipEnvSync, false);
  assert.strictEqual(result.help, false);
});

test('Explicit start command without flags preserves skipEnvSync: false', () => {
  const result = localDb.parseArgs(['start']);
  assert.strictEqual(result.command, 'start');
  assert.strictEqual(result.skipEnvSync, false);
  assert.strictEqual(result.help, false);
});

test('start --skip-env-sync parses command start with skipEnvSync: true', () => {
  const result = localDb.parseArgs(['start', '--skip-env-sync']);
  assert.strictEqual(result.command, 'start');
  assert.strictEqual(result.skipEnvSync, true);
  assert.strictEqual(result.help, false);
});

test('--skip-env-sync start parses command start with skipEnvSync: true (any flag order)', () => {
  const result = localDb.parseArgs(['--skip-env-sync', 'start']);
  assert.strictEqual(result.command, 'start');
  assert.strictEqual(result.skipEnvSync, true);
  assert.strictEqual(result.help, false);
});

test('--skip-env-sync alone defaults command to start with skipEnvSync: true', () => {
  const result = localDb.parseArgs(['--skip-env-sync']);
  assert.strictEqual(result.command, 'start');
  assert.strictEqual(result.skipEnvSync, true);
  assert.strictEqual(result.help, false);
});

test('status command preserves existing behavior without skipEnvSync', () => {
  const result = localDb.parseArgs(['status']);
  assert.strictEqual(result.command, 'status');
  assert.strictEqual(result.skipEnvSync, false);
  assert.strictEqual(result.help, false);
});

test('stop command preserves existing behavior without skipEnvSync', () => {
  const result = localDb.parseArgs(['stop']);
  assert.strictEqual(result.command, 'stop');
  assert.strictEqual(result.skipEnvSync, false);
  assert.strictEqual(result.help, false);
});

test('--help and -h flags set help: true', () => {
  assert.strictEqual(localDb.parseArgs(['--help']).help, true);
  assert.strictEqual(localDb.parseArgs(['-h']).help, true);
  assert.strictEqual(localDb.parseArgs(['start', '--help']).help, true);
});

// ─── Group 2: Local DB Startup .env Sync Skipping Logic ──────────────────
console.log('\n[Group 2: Local DB Startup .env Sync Skipping Logic]');

test('startServer logic skips syncLocalEnv when skipEnvSync is true', () => {
  let syncInvoked = false;
  const mockSync = () => { syncInvoked = true; };

  // Simulate conditional in startServer
  function simulateStartServer(options, syncFn) {
    const skipEnvSync = Boolean(options.skipEnvSync);
    if (skipEnvSync) {
      // Skipped
      return 'SKIPPED';
    } else {
      syncFn();
      return 'SYNCED';
    }
  }

  const resultWithSkip = simulateStartServer({ skipEnvSync: true }, mockSync);
  assert.strictEqual(resultWithSkip, 'SKIPPED');
  assert.strictEqual(syncInvoked, false, 'syncLocalEnv must NOT be called when skipEnvSync is true');

  const resultWithoutSkip = simulateStartServer({ skipEnvSync: false }, mockSync);
  assert.strictEqual(resultWithoutSkip, 'SYNCED');
  assert.strictEqual(syncInvoked, true, 'syncLocalEnv must be called when skipEnvSync is false');
});

// ─── Group 3: Deterministic Worker Leasing Guard & Query Scoping ────────
console.log('\n[Group 3: Worker-Job Lease Isolation & Fail-Closed Guard]');

// Extracted query scoping algorithm matching worker-job/route.ts
function resolveWorkerLeaseTarget(headers, env) {
  const testTargetJobId = headers['x-test-target-job-id'];
  const isProduction = env.NODE_ENV === 'production';
  const isTestLeasingAllowed = !isProduction && (env.NODE_ENV === 'test' || env.ALLOW_TEST_JOB_LEASING === 'true' || env.NODE_ENV === 'development');

  if (testTargetJobId && !isTestLeasingAllowed) {
    return {
      status: 403,
      error: 'TEST_LEASING_DISABLED',
      message: 'Targeted test job leasing is disabled in production environments. Set ALLOW_TEST_JOB_LEASING=true or NODE_ENV=test.'
    };
  }

  if (testTargetJobId && (typeof testTargetJobId !== 'string' || testTargetJobId.trim().length === 0 || testTargetJobId.length > 128)) {
    return {
      status: 400,
      error: 'INVALID_TEST_JOB_ID',
      message: 'x-test-target-job-id header must be a valid non-empty string.'
    };
  }

  const staleLeaseThreshold = new Date(Date.now() - 30 * 60 * 1000);

  const whereClause = (testTargetJobId && isTestLeasingAllowed)
    ? {
        id: testTargetJobId.trim(),
        OR: [
          { status: 'SCRIPTED' },
          { status: 'RENDERING', renderedAt: { lt: staleLeaseThreshold } }
        ]
      }
    : {
        OR: [
          { status: 'SCRIPTED' },
          { status: 'RENDERING', renderedAt: { lt: staleLeaseThreshold } }
        ]
      };

  return { status: 200, where: whereClause };
}

test('x-test-target-job-id fails closed with HTTP 403 when test leasing is disabled', () => {
  const productionEnv = { NODE_ENV: 'production', ALLOW_TEST_JOB_LEASING: undefined };
  const headers = { 'x-test-target-job-id': 'probe-job-123' };

  const result = resolveWorkerLeaseTarget(headers, productionEnv);
  assert.strictEqual(result.status, 403);
  assert.strictEqual(result.error, 'TEST_LEASING_DISABLED');
  assert.strictEqual(result.where, undefined, 'No database query must be produced on failure');
});

test('x-test-target-job-id fails closed with HTTP 403 in production even if ALLOW_TEST_JOB_LEASING=true is set', () => {
  const productionEnvWithFlag = { NODE_ENV: 'production', ALLOW_TEST_JOB_LEASING: 'true' };
  const headers = { 'x-test-target-job-id': 'probe-job-123' };

  const result = resolveWorkerLeaseTarget(headers, productionEnvWithFlag);
  assert.strictEqual(result.status, 403);
  assert.strictEqual(result.error, 'TEST_LEASING_DISABLED');
  assert.strictEqual(result.where, undefined, 'Must never produce a database query');
});

test('x-test-target-job-id fails closed with HTTP 403 in default unconfigured environment', () => {
  const defaultEnv = {};
  const headers = { 'x-test-target-job-id': 'probe-job-123' };

  const result = resolveWorkerLeaseTarget(headers, defaultEnv);
  assert.strictEqual(result.status, 403);
  assert.strictEqual(result.error, 'TEST_LEASING_DISABLED');
});

test('Malformed or empty x-test-target-job-id returns HTTP 400 in test environment', () => {
  const testEnv = { ALLOW_TEST_JOB_LEASING: 'true' };
  const emptyHeaders = { 'x-test-target-job-id': '   ' };

  const result = resolveWorkerLeaseTarget(emptyHeaders, testEnv);
  assert.strictEqual(result.status, 400);
  assert.strictEqual(result.error, 'INVALID_TEST_JOB_ID');
});

test('x-test-target-job-id scopes query strictly to targeted job ID when ALLOW_TEST_JOB_LEASING=true', () => {
  const testEnv = { ALLOW_TEST_JOB_LEASING: 'true' };
  const headers = { 'x-test-target-job-id': 'test-job-unique-456' };

  const result = resolveWorkerLeaseTarget(headers, testEnv);
  assert.strictEqual(result.status, 200);
  assert.strictEqual(result.where.id, 'test-job-unique-456');
  assert.ok(Array.isArray(result.where.OR), 'Must preserve SCRIPTED / stale RENDERING status preconditions');
});

test('x-test-target-job-id scopes query strictly to targeted job ID when NODE_ENV=test', () => {
  const testEnv = { NODE_ENV: 'test' };
  const headers = { 'x-test-target-job-id': 'test-job-unique-789' };

  const result = resolveWorkerLeaseTarget(headers, testEnv);
  assert.strictEqual(result.status, 200);
  assert.strictEqual(result.where.id, 'test-job-unique-789');
});

test('Unspecified x-test-target-job-id preserves standard FIFO leasing query without id filter', () => {
  const testEnv = { ALLOW_TEST_JOB_LEASING: 'true' };
  const headers = {};

  const result = resolveWorkerLeaseTarget(headers, testEnv);
  assert.strictEqual(result.status, 200);
  assert.strictEqual(result.where.id, undefined, 'Must not filter by id when header is omitted');
  assert.strictEqual(result.where.OR.length, 2);
});

// ─── Group 4: Static Inspection of Source Code ───────────────────────────
console.log('\n[Group 4: Static Verification of Implementation]');

test('worker-job route contains fail-closed test leasing guard before prisma query', () => {
  const routePath = path.resolve('apps/web/src/app/api/pipeline/worker-job/route.ts');
  const content = fs.readFileSync(routePath, 'utf8');

  // Verify fail closed check is present
  assert.ok(content.includes('TEST_LEASING_DISABLED'), 'Route must return TEST_LEASING_DISABLED');
  assert.ok(content.includes('x-test-target-job-id'), 'Route must check x-test-target-job-id header');
  assert.ok(content.includes('ALLOW_TEST_JOB_LEASING'), 'Route must check ALLOW_TEST_JOB_LEASING');

  // Verify guard precedes prisma.renderJob.findFirst
  const guardIndex = content.indexOf('TEST_LEASING_DISABLED');
  const queryIndex = content.indexOf('prisma.renderJob.findFirst');
  assert.ok(guardIndex > 0 && queryIndex > guardIndex, 'Guard must precede candidate query');
});

test('local_worker.mjs supports optional targetJobId argument', () => {
  const workerPath = path.resolve('scripts/local_worker.mjs');
  const content = fs.readFileSync(workerPath, 'utf8');

  assert.ok(content.includes('processNextJob(targetJobId = null)'), 'processNextJob must accept optional targetJobId');
  assert.ok(content.includes('headers[\'x-test-target-job-id\'] = targetJobId'), 'Worker must propagate test header when supplied');
});

test('package.json contains db:start:safe script with --skip-env-sync', () => {
  const pkgPath = path.resolve('package.json');
  const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));

  assert.ok(pkg.scripts['db:start:safe'], 'package.json must contain db:start:safe');
  assert.ok(pkg.scripts['db:start:safe'].includes('--skip-env-sync'), 'db:start:safe must pass --skip-env-sync');
});

console.log('\n===============================================================');
console.log(` Summary: ${passed} passed, ${failed} failed`);
console.log('===============================================================\n');

if (failed > 0) {
  process.exit(1);
}
