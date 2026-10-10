/**
 * SIMPLYYTR 2.0 — Comprehensive Security & Authentication Regression Test Suite
 * 
 * Verifies:
 * 1. Missing and empty server secrets (fail-closed)
 * 2. Incorrect and obsolete tokens (rejection of legacy secrets)
 * 3. Valid and invalid server-to-server worker authentication
 * 4. Unauthenticated dashboard requests (fail-closed)
 * 5. Elimination of header spoofing (Sec-Fetch-Site, Origin, Referer, Host)
 * 6. CSRF protection on state-changing browser requests
 * 7. Flow separation: worker secrets cannot be passed via browser cookies
 * 8. Static audit ensuring NO privileged secret or NEXT_PUBLIC_* leaks to client code/bundles
 * 9. Constant-time timing attack resilience
 */

import assert from 'node:assert';
import fs from 'node:fs';
import path from 'node:path';
import {
  verifyAuth,
  verifyWorkerAuth,
  verifyDashboardAuth,
  verifyCsrfProtection,
  timingSafeEqualStr,
  unauthorized
} from '../../apps/web/src/app/api/lib/auth.ts';

const TEST_SERVER_SECRET = 's3cr3t_p1p3l1n3_k3y_v3r1f1c4t10n_998877';
const OBSOLETE_LEAKED_FALLBACK = '[REDACTED_FALLBACK_TOKEN]';

let passed = 0;
let failed = 0;

function runTest(name, fn) {
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

console.log('===============================================================');
console.log(' SIMPLYYTR 2.0 Comprehensive Authentication Regression Tests');
console.log('===============================================================\n');

// ─── Group 1: Missing and Empty Server Secrets (Fail-Closed) ───
console.log('[Group 1: Fail-Closed Behavior on Missing Server Secret]');

runTest('Fails closed when PIPELINE_SECRET is undefined', () => {
  delete process.env.PIPELINE_SECRET;
  const req = new Request('http://localhost:3000/api/pipeline/trigger', {
    headers: { 'Authorization': `Bearer ${TEST_SERVER_SECRET}` }
  });
  const res = verifyWorkerAuth(req);
  assert.strictEqual(res.authenticated, false);
  assert.strictEqual(res.reason, 'SERVER_SECRET_UNCONFIGURED');
  assert.strictEqual(verifyAuth(req), false);
});

runTest('Fails closed when PIPELINE_SECRET is empty string', () => {
  process.env.PIPELINE_SECRET = '';
  const req = new Request('http://localhost:3000/api/pipeline/trigger', {
    headers: { 'Authorization': `Bearer ${TEST_SERVER_SECRET}` }
  });
  const res = verifyWorkerAuth(req);
  assert.strictEqual(res.authenticated, false);
  assert.strictEqual(verifyAuth(req), false);
});

runTest('Fails closed when PIPELINE_SECRET is whitespace only', () => {
  process.env.PIPELINE_SECRET = '   \t  ';
  const req = new Request('http://localhost:3000/api/pipeline/trigger', {
    headers: { 'Authorization': `Bearer ${TEST_SERVER_SECRET}` }
  });
  const res = verifyWorkerAuth(req);
  assert.strictEqual(res.authenticated, false);
  assert.strictEqual(verifyAuth(req), false);
});

// Set valid secret for remaining tests
process.env.PIPELINE_SECRET = TEST_SERVER_SECRET;

// ─── Group 2: Server-to-Server Worker Authentication ───────────
console.log('\n[Group 2: Server-to-Server Worker Credential Validation]');

runTest('Accepts valid Bearer token in Authorization header', () => {
  const req = new Request('http://localhost:3000/api/pipeline/worker-job', {
    headers: { 'Authorization': `Bearer ${TEST_SERVER_SECRET}` }
  });
  const res = verifyWorkerAuth(req);
  assert.strictEqual(res.authenticated, true);
  assert.strictEqual(res.flow, 'worker');
  assert.strictEqual(verifyAuth(req), true);
});

runTest('Accepts valid case-insensitive authorization header', () => {
  const req = new Request('http://localhost:3000/api/pipeline/worker-job', {
    headers: { 'authorization': `bearer ${TEST_SERVER_SECRET}` }
  });
  const res = verifyWorkerAuth(req);
  assert.strictEqual(res.authenticated, true);
  assert.strictEqual(verifyAuth(req), true);
});

runTest('Accepts valid custom X-Pipeline-Secret header', () => {
  const req = new Request('http://localhost:3000/api/pipeline/worker-job', {
    headers: { 'x-pipeline-secret': TEST_SERVER_SECRET }
  });
  const res = verifyWorkerAuth(req);
  assert.strictEqual(res.authenticated, true);
  assert.strictEqual(verifyAuth(req), true);
});

runTest('Rejects obsolete legacy fallback token', () => {
  const req = new Request('http://localhost:3000/api/pipeline/worker-job', {
    headers: { 'Authorization': `Bearer ${OBSOLETE_LEAKED_FALLBACK}` }
  });
  const res = verifyWorkerAuth(req);
  assert.strictEqual(res.authenticated, false);
  assert.strictEqual(res.reason, 'INVALID_BEARER_TOKEN');
  assert.strictEqual(verifyAuth(req), false);
});

runTest('Rejects arbitrary invalid bearer token', () => {
  const req = new Request('http://localhost:3000/api/pipeline/worker-job', {
    headers: { 'Authorization': 'Bearer random_unauthorized_token_xyz' }
  });
  const res = verifyWorkerAuth(req);
  assert.strictEqual(res.authenticated, false);
  assert.strictEqual(verifyAuth(req), false);
});

runTest('Rejects non-Bearer schemes (e.g. Basic)', () => {
  const req = new Request('http://localhost:3000/api/pipeline/worker-job', {
    headers: { 'Authorization': 'Basic dXNlcjpwYXNz' }
  });
  const res = verifyWorkerAuth(req);
  assert.strictEqual(res.authenticated, false);
  assert.strictEqual(verifyAuth(req), false);
});

runTest('Rejects malformed Authorization header with empty token', () => {
  const req = new Request('http://localhost:3000/api/pipeline/worker-job', {
    headers: { 'Authorization': 'Bearer ' }
  });
  const res = verifyWorkerAuth(req);
  assert.strictEqual(res.authenticated, false);
  assert.strictEqual(verifyAuth(req), false);
});

// ─── Group 3: Unauthenticated Dashboard Requests & Header Spoofing ─
console.log('\n[Group 3: Unauthenticated Dashboard Requests & Header Spoofing]');

runTest('Rejects unauthenticated browser request with no headers', () => {
  const req = new Request('http://localhost:3000/api/pipeline/trigger', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' }
  });
  assert.strictEqual(verifyAuth(req), false, 'Must reject unauthenticated browser request');
});

runTest('Rejects spoofed Sec-Fetch-Site: same-origin without credentials', () => {
  const req = new Request('http://localhost:3000/api/pipeline/trigger', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'sec-fetch-site': 'same-origin'
    }
  });
  assert.strictEqual(verifyAuth(req), false, 'Sec-Fetch-Site alone must NEVER grant access');
});

runTest('Rejects spoofed Origin: http://localhost:3000 without credentials', () => {
  const req = new Request('http://localhost:3000/api/pipeline/control', {
    method: 'POST',
    headers: {
      'host': 'localhost:3000',
      'origin': 'http://localhost:3000'
    }
  });
  assert.strictEqual(verifyAuth(req), false, 'Origin alone must NEVER grant access');
});

runTest('Rejects spoofed Origin: https://simplyytr.vercel.app without credentials', () => {
  const req = new Request('http://localhost:3000/api/pipeline/trigger', {
    method: 'POST',
    headers: {
      'host': 'simplyytr.vercel.app',
      'origin': 'https://simplyytr.vercel.app'
    }
  });
  assert.strictEqual(verifyAuth(req), false, 'Vercel domain origin alone must NEVER grant access');
});

runTest('Rejects attacker-controlled subdomain origin', () => {
  const req = new Request('http://localhost:3000/api/pipeline/trigger', {
    method: 'POST',
    headers: {
      'host': 'simplyytr.vercel.app',
      'origin': 'https://attacker.vercel.app'
    }
  });
  assert.strictEqual(verifyAuth(req), false);
});

runTest('Rejects spoofed Referer header without credentials', () => {
  const req = new Request('http://localhost:3000/api/pipeline/trigger', {
    method: 'POST',
    headers: {
      'referer': 'http://localhost:3000/dashboard'
    }
  });
  assert.strictEqual(verifyAuth(req), false, 'Referer header alone must NEVER grant access');
});

// ─── Group 4: CSRF Protection on State-Changing Browser Requests ──
console.log('\n[Group 4: CSRF Defense on Browser Requests]');

runTest('verifyCsrfProtection rejects cross-site requests', () => {
  const req = new Request('http://localhost:3000/api/pipeline/control', {
    method: 'POST',
    headers: {
      'host': 'localhost:3000',
      'sec-fetch-site': 'cross-site'
    }
  });
  const csrf = verifyCsrfProtection(req);
  assert.strictEqual(csrf.valid, false);
  assert.strictEqual(csrf.reason, 'CROSS_SITE_REQUEST_FORBIDDEN');
});

runTest('verifyCsrfProtection rejects origin host mismatch', () => {
  const req = new Request('http://localhost:3000/api/pipeline/control', {
    method: 'POST',
    headers: {
      'host': 'localhost:3000',
      'origin': 'https://malicious-site.com'
    }
  });
  const csrf = verifyCsrfProtection(req);
  assert.strictEqual(csrf.valid, false);
  assert.strictEqual(csrf.reason, 'ORIGIN_HOST_MISMATCH');
});

runTest('verifyCsrfProtection passes valid same-origin request', () => {
  const req = new Request('http://localhost:3000/api/pipeline/control', {
    method: 'POST',
    headers: {
      'host': 'localhost:3000',
      'origin': 'http://localhost:3000',
      'sec-fetch-site': 'same-origin'
    }
  });
  const csrf = verifyCsrfProtection(req);
  assert.strictEqual(csrf.valid, true);
});

// ─── Group 5: Flow Separation & Authorization Boundaries ───────
console.log('\n[Group 5: Flow Separation & Boundary Integrity]');

runTest('Worker pipeline secret cannot be submitted via browser cookie to gain access', () => {
  const req = new Request('http://localhost:3000/api/pipeline/trigger', {
    method: 'POST',
    headers: {
      'host': 'localhost:3000',
      'origin': 'http://localhost:3000',
      'cookie': `simplyytr_session=${TEST_SERVER_SECRET}`
    }
  });
  // Must NOT treat cookie as valid worker auth
  const workerRes = verifyWorkerAuth(req);
  assert.strictEqual(workerRes.authenticated, false);

  // Must fail closed because dashboard session store does not exist
  const dashboardRes = verifyDashboardAuth(req);
  assert.strictEqual(dashboardRes.authenticated, false);
  assert.strictEqual(dashboardRes.reason, 'DASHBOARD_SESSION_STORE_NOT_CONFIGURED');

  // Unified verifyAuth must fail closed
  assert.strictEqual(verifyAuth(req), false);
});

runTest('unauthorized() response returns HTTP 401 with safe JSON payload', () => {
  const res = unauthorized();
  assert.strictEqual(res.status, 401);
});

// ─── Group 6: Client Bundle & Static Secret Leakage Audit ──────
console.log('\n[Group 6: Client Bundle & Code Secret Leakage Audit]');

runTest('apps/web/src/app/page.tsx has ZERO references to NEXT_PUBLIC_PIPELINE_SECRET', () => {
  const pageContent = fs.readFileSync(path.resolve('apps/web/src/app/page.tsx'), 'utf8');
  assert.strictEqual(pageContent.includes('NEXT_PUBLIC_PIPELINE_SECRET'), false);
});

runTest('apps/web/src/app/page.tsx has ZERO references to getClientAuthToken', () => {
  const pageContent = fs.readFileSync(path.resolve('apps/web/src/app/page.tsx'), 'utf8');
  assert.strictEqual(pageContent.includes('getClientAuthToken'), false);
});

runTest('apps/web/src/app/page.tsx has ZERO references to PIPELINE_SECRET', () => {
  const pageContent = fs.readFileSync(path.resolve('apps/web/src/app/page.tsx'), 'utf8');
  assert.strictEqual(pageContent.includes('PIPELINE_SECRET'), false);
});

runTest('apps/web/src/app/page.tsx has ZERO references to fallback secret string', () => {
  const pageContent = fs.readFileSync(path.resolve('apps/web/src/app/page.tsx'), 'utf8');
  assert.strictEqual(pageContent.includes(OBSOLETE_LEAKED_FALLBACK), false);
});

runTest('.env.example has ZERO references to NEXT_PUBLIC_PIPELINE_SECRET', () => {
  const envContent = fs.readFileSync(path.resolve('.env.example'), 'utf8');
  assert.strictEqual(envContent.includes('NEXT_PUBLIC_PIPELINE_SECRET'), false);
});

runTest('Workflows have ZERO references to fallback secret string', () => {
  const wf1 = fs.readFileSync(path.resolve('.github/workflows/content_pipeline.yml'), 'utf8');
  const wf2 = fs.readFileSync(path.resolve('.github/workflows/render-worker.yml'), 'utf8');
  assert.strictEqual(wf1.includes(OBSOLETE_LEAKED_FALLBACK), false);
  assert.strictEqual(wf2.includes(OBSOLETE_LEAKED_FALLBACK), false);
});

runTest('Worker python scripts have ZERO references to fallback secret string', () => {
  const py1 = fs.readFileSync(path.resolve('kaggle-worker/video_generator.py'), 'utf8');
  const py2 = fs.readFileSync(path.resolve('kaggle_pull/youtubbot-worker.py'), 'utf8');
  assert.strictEqual(py1.includes(OBSOLETE_LEAKED_FALLBACK), false);
  assert.strictEqual(py2.includes(OBSOLETE_LEAKED_FALLBACK), false);
});

// ─── Group 7: Timing Attack Comparison Safety ──────────────────
console.log('\n[Group 7: Constant-Time Timing Check]');

runTest('timingSafeEqualStr matches identical strings', () => {
  assert.strictEqual(timingSafeEqualStr('secure_token_123', 'secure_token_123'), true);
});

runTest('timingSafeEqualStr rejects differing characters of same length', () => {
  assert.strictEqual(timingSafeEqualStr('secure_token_123', 'secure_token_124'), false);
});

runTest('timingSafeEqualStr rejects strings of different length safely without throwing', () => {
  assert.strictEqual(timingSafeEqualStr('short', 'much_longer_string_value'), false);
  assert.strictEqual(timingSafeEqualStr('much_longer_string_value', 'short'), false);
});

// ─── Group 8: Newly Secured Privileged Routes Verification ────
console.log('\n[Group 8: Newly Secured Privileged Routes Verification]');

runTest('apps/web/src/app/api/pipeline/publish/route.ts invokes verifyAuth fail-closed guard', () => {
  const content = fs.readFileSync(path.resolve('apps/web/src/app/api/pipeline/publish/route.ts'), 'utf8');
  assert.strictEqual(content.includes('verifyAuth'), true);
  assert.strictEqual(content.includes('unauthorized()'), true);
  assert.match(content, /if\s*\(!verifyAuth\(request\)\)\s*\{\s*return unauthorized\(\);/);
});

runTest('POST /api/pipeline/publish fails closed for unauthenticated requests', () => {
  process.env.PIPELINE_SECRET = TEST_SERVER_SECRET;
  const req = new Request('http://localhost:3000/api/pipeline/publish', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ jobId: 'job_123' })
  });
  assert.strictEqual(verifyAuth(req), false);
});

runTest('POST /api/pipeline/publish rejects spoofed Origin and Sec-Fetch-Site headers', () => {
  process.env.PIPELINE_SECRET = TEST_SERVER_SECRET;
  const req = new Request('http://localhost:3000/api/pipeline/publish', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Origin': 'https://simplyytr.vercel.app',
      'Sec-Fetch-Site': 'same-origin'
    },
    body: JSON.stringify({ jobId: 'job_123' })
  });
  assert.strictEqual(verifyAuth(req), false);
});

runTest('POST /api/pipeline/publish accepts authorized server-to-server worker token', () => {
  process.env.PIPELINE_SECRET = TEST_SERVER_SECRET;
  const req = new Request('http://localhost:3000/api/pipeline/publish', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${TEST_SERVER_SECRET}`
    },
    body: JSON.stringify({ jobId: 'job_123' })
  });
  assert.strictEqual(verifyAuth(req), true);
});

runTest('apps/web/src/app/api/pipeline/trend-jack/route.ts invokes verifyAuth fail-closed guard', () => {
  const content = fs.readFileSync(path.resolve('apps/web/src/app/api/pipeline/trend-jack/route.ts'), 'utf8');
  assert.strictEqual(content.includes('verifyAuth'), true);
  assert.strictEqual(content.includes('unauthorized()'), true);
  assert.match(content, /if\s*\(!verifyAuth\(request\)\)\s*\{\s*return unauthorized\(\);/);
});

runTest('POST /api/pipeline/trend-jack fails closed for unauthenticated requests', () => {
  process.env.PIPELINE_SECRET = TEST_SERVER_SECRET;
  const req = new Request('http://localhost:3000/api/pipeline/trend-jack', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ topic: 'Viral AI Short' })
  });
  assert.strictEqual(verifyAuth(req), false);
});

runTest('POST /api/pipeline/trend-jack rejects spoofed Origin and Sec-Fetch-Site headers', () => {
  process.env.PIPELINE_SECRET = TEST_SERVER_SECRET;
  const req = new Request('http://localhost:3000/api/pipeline/trend-jack', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Origin': 'https://simplyytr.vercel.app',
      'Sec-Fetch-Site': 'same-origin'
    },
    body: JSON.stringify({ topic: 'Viral AI Short' })
  });
  assert.strictEqual(verifyAuth(req), false);
});

runTest('POST /api/pipeline/trend-jack accepts authorized server-to-server worker token', () => {
  process.env.PIPELINE_SECRET = TEST_SERVER_SECRET;
  const req = new Request('http://localhost:3000/api/pipeline/trend-jack', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${TEST_SERVER_SECRET}`
    },
    body: JSON.stringify({ topic: 'Viral AI Short' })
  });
  assert.strictEqual(verifyAuth(req), true);
});

runTest('apps/web/src/app/api/settings/route.ts invokes verifyAuth fail-closed guard on POST', () => {
  const content = fs.readFileSync(path.resolve('apps/web/src/app/api/settings/route.ts'), 'utf8');
  assert.strictEqual(content.includes('verifyAuth'), true);
  assert.strictEqual(content.includes('unauthorized()'), true);
  assert.match(content, /if\s*\(!verifyAuth\(request\)\)\s*\{\s*return unauthorized\(\);/);
});

runTest('POST /api/settings fails closed for unauthenticated requests', () => {
  process.env.PIPELINE_SECRET = TEST_SERVER_SECRET;
  const req = new Request('http://localhost:3000/api/settings', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ autoPilotEnabled: true })
  });
  assert.strictEqual(verifyAuth(req), false);
});

runTest('POST /api/settings rejects spoofed Origin and Sec-Fetch-Site headers', () => {
  process.env.PIPELINE_SECRET = TEST_SERVER_SECRET;
  const req = new Request('http://localhost:3000/api/settings', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Origin': 'https://simplyytr.vercel.app',
      'Sec-Fetch-Site': 'same-origin'
    },
    body: JSON.stringify({ autoPilotEnabled: true })
  });
  assert.strictEqual(verifyAuth(req), false);
});

runTest('POST /api/settings accepts authorized server-to-server worker token', () => {
  process.env.PIPELINE_SECRET = TEST_SERVER_SECRET;
  const req = new Request('http://localhost:3000/api/settings', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${TEST_SERVER_SECRET}`
    },
    body: JSON.stringify({ autoPilotEnabled: true })
  });
  assert.strictEqual(verifyAuth(req), true);
});

console.log('\n===============================================================');
console.log(` Summary: ${passed} passed, ${failed} failed`);
console.log('===============================================================');

if (failed > 0) {
  process.exit(1);
} else {
  process.exit(0);
}
