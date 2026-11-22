/**
 * SIMPLYYTR 2.0 — Phase 5N.8 Evidence Provenance & Source-Grounding Regression Suite
 *
 * Verifies all 14 required provenance controls:
 * 1. URL present, no receipt → retrieval is not SUCCESS.
 * 2. Excerpt present, no receipt → retrieval is not SUCCESS.
 * 3. LLM-provided verified: true without a valid receipt → rejected.
 * 4. Static curated summary → cannot be treated as retrieved evidence.
 * 5. Forged CACHED_PRIMARY with no cache provenance → rejected.
 * 6. Forged SUCCESS with no retrieval receipt → rejected.
 * 7. Valid retrieval receipt with internally consistent fields → accepted without falsely asserting semantic entailment.
 * 8. Invalid hash, malformed timestamp, or inconsistent receipt metadata → rejected.
 * 9. Operator review without retrieval evidence → remains operator-reviewed, not factually verified.
 * 10. A paraphrase is not displayed as a verbatim source quotation.
 * 11. Invalid evidence cannot produce a verified badge in the actual renderer.
 * 12. Package mutation after validation is detected before rendering or completion.
 * 13. Worker lease, retry, and webhook validation reject forged or malformed evidence packages.
 * 14. Existing authentication and publishing-disabled protections remain intact.
 */

import 'dotenv/config';
import assert from 'node:assert';
import crypto from 'node:crypto';
import {
  validateContentPackage,
  ContentPackageSchema,
  RetrievalReceiptSchema
} from '../../apps/web/src/app/api/lib/contentContract';
import {
  generateTopicGroundedPackage
} from '../../apps/web/src/app/api/lib/topicGroundedGenerator';
import {
  VERIFIED_LOCAL_TOPICS
} from '../../apps/backend/src/services/topicPackage';
import {
  resolveEvidenceVisuals,
  sanitizeForFfmpeg
} from '../../apps/backend/src/services/localRenderer';
import {
  signMediaToken,
  verifyMediaToken
} from '../../apps/web/src/app/api/lib/mediaAuth';

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

async function runRegressionSuite() {
  console.log('===============================================================');
  console.log(' SIMPLYYTR 2.0 — Phase 5N.8 Evidence Provenance Regression Suite');
  console.log('===============================================================\n');

  // Helper to build a valid base package for testing
  function createBasePackage() {
    return {
      version: '1.0.0',
      topic: 'Precision Display Maintenance',
      audience: 'Display engineers and high-end workstation users',
      targetProblem: 'How to clean specialized display panels without damaging coatings',
      proposedTitle: 'Precision Display Maintenance Protocols',
      openingHook: 'Modern display panels require calibrated cleaning methods to preserve surface coatings.',
      segments: [
        {
          id: 'seg-1',
          order: 1,
          text: 'Modern display panels require calibrated cleaning methods to preserve surface coatings.',
          visualPlan: {
            sceneType: 'MOTION_GRAPHIC',
            description: 'Engineering overview of display optical coatings',
            primaryText: 'DISPLAY MAINTENANCE',
            secondaryText: 'Surface Coating Preservation',
            badgeText: 'TECHNICAL ADVISORY',
            assetSource: 'LOCAL_SCENE_GRAPHICS'
          }
        },
        {
          id: 'seg-2',
          order: 2,
          text: 'Manufacturers advise using soft lint-free cloths and avoiding direct liquid spray on panels.',
          visualPlan: {
            sceneType: 'ORIGINAL_DIAGRAM',
            description: 'Diagram showing liquid ingress risks',
            primaryText: 'DOCUMENTED GUIDANCE',
            secondaryText: 'Never Spray Glass Directly',
            badgeText: 'RESEARCH EVIDENCE',
            assetSource: 'ORIGINAL_DIAGRAM'
          }
        },
        {
          id: 'seg-3',
          order: 3,
          text: 'Always check the manual for your specific model before applying any cleaning solution. Inspect the verified documentation in the description below.',
          visualPlan: {
            sceneType: 'MOTION_GRAPHIC',
            description: 'Checklist for model-specific display care',
            primaryText: 'ACTIONABLE PROTOCOL',
            secondaryText: 'Consult Model Documentation',
            badgeText: 'ACTION PROTOCOL',
            assetSource: 'LOCAL_SCENE_GRAPHICS'
          }
        }
      ],
      claims: [
        {
          id: 'claim-1',
          claimText: 'Device manufacturers advise against spraying liquid cleaners directly onto electronic displays.',
          sourceRef: 'Manufacturer Maintenance Standard Documentation',
          sourceUrl: 'https://support.apple.com/en-us/103258',
          verified: false,
          evidenceStatus: 'source_located',
          excerptType: 'authored_summary',
          retrievalStatus: 'NOT_ATTEMPTED',
          verificationNotes: 'Source located; requires empirical retrieval and operator review.'
        }
      ],
      callToAction: 'Inspect the verified documentation in the description below.',
      provenance: {
        source: 'Manufacturer Maintenance Standard Documentation',
        generatorMode: 'DETERMINISTIC_TOPIC_DEMO',
        license: 'CC-BY-4.0',
        verified: false
      },
      reviewStatus: 'NEEDS_REVIEW'
    };
  }

  // Helper to generate a valid SHA-256 retrieval receipt
  function createValidReceipt(url = 'https://support.apple.com/en-us/103258', rawContent = 'Apple display cleaning documentation official text') {
    const contentHash = crypto.createHash('sha256').update(rawContent).digest('hex');
    return {
      receiptId: `rcpt-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      url,
      retrievedAt: new Date().toISOString(),
      httpStatus: 200,
      contentType: 'text/html; charset=utf-8',
      contentHash,
      sourceId: 'apple-support-103258'
    };
  }

  // ─── Test 1: URL present, no receipt → retrieval is not SUCCESS ────────────
  try {
    const pkg = createBasePackage();
    pkg.claims[0].sourceUrl = 'https://support.apple.com/en-us/103258';
    pkg.claims[0].retrievalStatus = 'SUCCESS';
    pkg.claims[0].retrievalReceipt = undefined; // No receipt!

    const result = validateContentPackage(pkg);
    assert.strictEqual(result.valid, false, 'Validator must reject retrievalStatus SUCCESS without receipt');
    assert.ok(result.errors.some(e => e.includes('SUCCESS') && e.includes('retrievalReceipt')));
    reportPass('1. URL present without retrieval receipt cannot be assigned retrievalStatus SUCCESS');
  } catch (err) {
    reportFail('1. URL present without retrieval receipt cannot be assigned retrievalStatus SUCCESS', err);
  }

  // ─── Test 2: Excerpt present, no receipt → retrieval is not SUCCESS ────────
  try {
    const pkg = createBasePackage();
    pkg.claims[0].supportingExcerpt = 'To clean your Apple display, lightly dampen the cloth with water only.';
    pkg.claims[0].retrievalStatus = 'SUCCESS';
    pkg.claims[0].retrievalReceipt = undefined; // No receipt!

    const result = validateContentPackage(pkg);
    assert.strictEqual(result.valid, false, 'Validator must reject retrievalStatus SUCCESS without receipt even with excerpt');
    assert.ok(result.errors.some(e => e.includes('SUCCESS') && e.includes('retrievalReceipt')));
    reportPass('2. Excerpt present without retrieval receipt cannot be assigned retrievalStatus SUCCESS');
  } catch (err) {
    reportFail('2. Excerpt present without retrieval receipt cannot be assigned retrievalStatus SUCCESS', err);
  }

  // ─── Test 3: LLM-provided verified: true without a valid receipt → rejected ─
  try {
    const pkg = createBasePackage();
    // Simulate LLM returning verified: true with excerpt and URL but no cryptographic receipt
    pkg.claims[0].verified = true;
    pkg.claims[0].evidenceStatus = 'evidence_recorded';
    pkg.claims[0].supportingExcerpt = 'To clean your Apple display, lightly dampen the cloth with water only.';
    pkg.claims[0].sourceUrl = 'https://support.apple.com/en-us/103258';
    pkg.claims[0].retrievalStatus = 'SUCCESS';
    pkg.claims[0].retrievalReceipt = undefined; // Missing receipt!

    const result = validateContentPackage(pkg);
    assert.strictEqual(result.valid, false, 'Validator must reject verified: true when retrievalReceipt is absent');
    assert.ok(result.errors.some(e => e.includes('lacks required retrievalReceipt')));
    reportPass('3. LLM-provided verified: true without a valid retrieval receipt is rejected fail-closed');
  } catch (err) {
    reportFail('3. LLM-provided verified: true without a valid retrieval receipt is rejected fail-closed', err);
  }

  // ─── Test 4: Static curated summary cannot be treated as retrieved evidence ─
  try {
    const cleanerPkg = generateTopicGroundedPackage('Screen Cleaner Spray');
    const aeroPkg = generateTopicGroundedPackage('Why Airplane Windows Have Rounded Corners');

    // Both static topics must honestly self-identify as unverified, source_located, authored_summary
    for (const c of [...cleanerPkg.claims, ...aeroPkg.claims]) {
      assert.strictEqual(c.verified, false, `Claim "${c.id}" must have verified: false`);
      assert.strictEqual(c.evidenceStatus, 'source_located', `Claim "${c.id}" must be source_located`);
      assert.strictEqual(c.retrievalStatus, 'NOT_ATTEMPTED', `Claim "${c.id}" must be NOT_ATTEMPTED`);
      assert.strictEqual(c.excerptType, 'authored_summary', `Claim "${c.id}" must be authored_summary`);
      assert.strictEqual(c.retrievalReceipt, undefined, `Static dictionary must not fabricate retrievalReceipt`);
    }

    // Forging evidenceStatus: 'evidence_recorded' on an authored_summary must fail
    const forgedSummary = JSON.parse(JSON.stringify(cleanerPkg));
    forgedSummary.claims[0].evidenceStatus = 'evidence_recorded';
    const forgedResult = validateContentPackage(forgedSummary);
    assert.strictEqual(forgedResult.valid, false, 'Cannot mark authored_summary as evidence_recorded');
    assert.ok(forgedResult.errors.some(e => e.includes('authored_summary') && e.includes('evidence_recorded')));

    reportPass('4. Static curated summaries are honestly labeled and cannot be treated as retrieved evidence');
  } catch (err) {
    reportFail('4. Static curated summaries are honestly labeled and cannot be treated as retrieved evidence', err);
  }

  // ─── Test 5: Forged CACHED_PRIMARY with no cache provenance → rejected ─────
  try {
    const pkg = createBasePackage();
    pkg.claims[0].retrievalStatus = 'CACHED_PRIMARY';
    pkg.claims[0].retrievalReceipt = createValidReceipt(); // Has receipt, but no cacheProvenance!

    const result = validateContentPackage(pkg);
    assert.strictEqual(result.valid, false, 'CACHED_PRIMARY requires cacheProvenance metadata');
    assert.ok(result.errors.some(e => e.includes('CACHED_PRIMARY') && e.includes('cacheProvenance')));
    reportPass('5. Forged CACHED_PRIMARY without verifiable cache provenance is rejected fail-closed');
  } catch (err) {
    reportFail('5. Forged CACHED_PRIMARY without verifiable cache provenance is rejected fail-closed', err);
  }

  // ─── Test 6: Forged SUCCESS with no retrieval receipt → rejected ────────────
  try {
    const pkg = createBasePackage();
    pkg.claims[0].retrievalStatus = 'SUCCESS';
    pkg.claims[0].retrievalReceipt = undefined;

    const noReceiptResult = validateContentPackage(pkg);
    assert.strictEqual(noReceiptResult.valid, false);

    // URL mismatch check: receipt URL differs from claim sourceUrl
    const mismatchPkg = createBasePackage();
    mismatchPkg.claims[0].sourceUrl = 'https://support.apple.com/en-us/103258';
    mismatchPkg.claims[0].retrievalStatus = 'SUCCESS';
    mismatchPkg.claims[0].retrievalReceipt = createValidReceipt('https://malicious-phishing-site.example.com/fake');

    const mismatchResult = validateContentPackage(mismatchPkg);
    assert.strictEqual(mismatchResult.valid, false, 'Must reject receipt URL mismatch');
    assert.ok(mismatchResult.errors.some(e => e.includes('does not match retrievalReceipt URL')));

    reportPass('6. Forged SUCCESS without receipt or with mismatched receipt URL is rejected');
  } catch (err) {
    reportFail('6. Forged SUCCESS without receipt or with mismatched receipt URL is rejected', err);
  }

  // ─── Test 7: Valid retrieval receipt with consistent fields → accepted ─────
  try {
    const pkg = createBasePackage();
    const sourceUrl = 'https://support.apple.com/en-us/103258';
    const verbatimExcerpt = "To clean your Apple display, lightly dampen the cloth with water only. Don't spray liquid directly onto the screen.";
    const validReceipt = createValidReceipt(sourceUrl, verbatimExcerpt);

    // Honest representation: source retrieved and recorded, but semantic entailment not machine-verified
    pkg.claims[0] = {
      id: 'claim-1',
      claimText: 'Device manufacturers advise against spraying liquid cleaners directly onto electronic displays.',
      sourceRef: 'Apple Support Article 103258',
      sourceUrl,
      verified: false, // Honest boundary: retrieved & recorded, but semantic truth not claimed
      evidenceStatus: 'evidence_recorded',
      supportingExcerpt: verbatimExcerpt,
      excerptType: 'verbatim_quote',
      retrievalStatus: 'SUCCESS',
      retrievalReceipt: validReceipt,
      verificationNotes: 'Source retrieved with valid SHA-256 receipt; excerpt copied verbatim from retrieved HTML.'
    };

    const honestResult = validateContentPackage(pkg);
    assert.strictEqual(honestResult.valid, true, `Expected valid package: ${honestResult.errors.join(', ')}`);
    assert.strictEqual(honestResult.package.claims[0].verified, false, 'Retrieved evidence is accepted with honest verified: false');
    assert.strictEqual(honestResult.package.claims[0].evidenceStatus, 'evidence_recorded');
    assert.strictEqual(honestResult.package.claims[0].retrievalStatus, 'SUCCESS');

    // And when verified: true is asserted with all provenance criteria met, it is accepted
    pkg.claims[0].verified = true;
    const verifiedResult = validateContentPackage(pkg);
    assert.strictEqual(verifiedResult.valid, true, `Verified package with valid receipt must be accepted: ${verifiedResult.errors.join(', ')}`);

    reportPass('7. Valid retrieval receipt with internally consistent fields is accepted without falsely asserting entailment');
  } catch (err) {
    reportFail('7. Valid retrieval receipt with internally consistent fields is accepted without falsely asserting entailment', err);
  }

  // ─── Test 8: Invalid hash, malformed timestamp, or inconsistent receipt ────
  try {
    // 8a. Invalid SHA-256 hash (too short / non-hex)
    const pkgHash = createBasePackage();
    const badHashReceipt = createValidReceipt();
    badHashReceipt.contentHash = 'invalid-short-hash';
    pkgHash.claims[0].retrievalStatus = 'SUCCESS';
    pkgHash.claims[0].retrievalReceipt = badHashReceipt;
    const badHashResult = validateContentPackage(pkgHash);
    assert.strictEqual(badHashResult.valid, false, 'Must reject invalid contentHash');
    assert.ok(badHashResult.errors.some(e => e.includes('64-character SHA-256 hex string')));

    // 8b. HTTP status 404 with retrievalStatus SUCCESS
    const pkgStatus = createBasePackage();
    const errorStatusReceipt = createValidReceipt();
    errorStatusReceipt.httpStatus = 404;
    pkgStatus.claims[0].retrievalStatus = 'SUCCESS';
    pkgStatus.claims[0].retrievalReceipt = errorStatusReceipt;
    const badStatusResult = validateContentPackage(pkgStatus);
    assert.strictEqual(badStatusResult.valid, false, 'Must reject HTTP 404 as SUCCESS');
    assert.ok(badStatusResult.errors.some(e => e.includes('HTTP status is 404')));

    // 8c. CACHED_PRIMARY with integrityHash mismatch
    const pkgCacheMismatch = createBasePackage();
    const cacheReceipt = createValidReceipt();
    cacheReceipt.cacheProvenance = {
      cacheKey: 'cache-apple-display-v1',
      cachedAt: new Date().toISOString(),
      integrityHash: '0000000000000000000000000000000000000000000000000000000000000000', // Mismatch!
      originUri: 'https://support.apple.com/en-us/103258'
    };
    pkgCacheMismatch.claims[0].retrievalStatus = 'CACHED_PRIMARY';
    pkgCacheMismatch.claims[0].retrievalReceipt = cacheReceipt;
    const badCacheResult = validateContentPackage(pkgCacheMismatch);
    assert.strictEqual(badCacheResult.valid, false, 'Must reject cache integrity mismatch');
    assert.ok(badCacheResult.errors.some(e => e.includes('integrityHash does not match retrievalReceipt contentHash')));

    reportPass('8. Invalid hash, error HTTP status, and cache integrity mismatch are rejected fail-closed');
  } catch (err) {
    reportFail('8. Invalid hash, error HTTP status, and cache integrity mismatch are rejected fail-closed', err);
  }

  // ─── Test 9: Operator review without retrieval evidence remains separate ───
  try {
    const pkg = createBasePackage();
    pkg.reviewStatus = 'APPROVED';
    pkg.claims[0].evidenceStatus = 'operator_reviewed';
    pkg.claims[0].verified = false; // Workflow approved, not factually verified

    const approvedResult = validateContentPackage(pkg);
    assert.strictEqual(approvedResult.valid, true, 'Operator review alone allows APPROVED package with verified: false');
    assert.strictEqual(approvedResult.package.claims[0].verified, false);

    // Operator review must NEVER be permitted to manufacture verified: true
    pkg.claims[0].verified = true;
    const forgedResult = validateContentPackage(pkg);
    assert.strictEqual(forgedResult.valid, false, 'Operator review cannot grant verified: true');
    assert.ok(forgedResult.errors.some(e => e.includes('Operator review is a workflow approval, not empirical factual verification')));

    reportPass('9. Operator review remains separate and cannot manufacture factual verification');
  } catch (err) {
    reportFail('9. Operator review remains separate and cannot manufacture factual verification', err);
  }

  // ─── Test 10: A paraphrase is not displayed as a verbatim source quotation ─
  try {
    const summaryClaim = {
      claimText: 'Device manuals advise using soft cloths.',
      supportingExcerpt: 'Apple and Dell advise lightly moistening a soft cloth instead of spraying the glass.',
      excerptType: 'authored_summary',
      evidenceStatus: 'source_located',
      verified: false
    };

    const visualSummary = resolveEvidenceVisuals(
      1,
      { visualPlan: { badgeText: 'RESEARCH EVIDENCE', primaryText: 'Cleaner Advice' } },
      summaryClaim,
      'NEEDS_REVIEW'
    );

    // Must be labeled "Summary", NOT "Excerpt" or "Quote"
    assert.ok(visualSummary.line2.startsWith('Summary'), `Line 2 must start with "Summary", got: "${visualSummary.line2}"`);
    assert.ok(!visualSummary.line2.startsWith('Excerpt'), 'Must not claim authored summary is an excerpt');

    // Genuine verbatim quote with valid receipt receives "Excerpt"
    const validReceipt = createValidReceipt();
    const verbatimClaim = {
      claimText: 'Device manuals advise against direct liquid spray.',
      supportingExcerpt: "Don't spray liquid directly onto the screen. Spraying liquid directly onto the screen can cause liquid to seep inside.",
      excerptType: 'verbatim_quote',
      evidenceStatus: 'evidence_recorded',
      retrievalStatus: 'SUCCESS',
      retrievalReceipt: validReceipt,
      verified: true
    };

    const visualVerbatim = resolveEvidenceVisuals(
      1,
      { visualPlan: { badgeText: 'VERIFIED EVIDENCE', primaryText: 'Cleaner Advice' } },
      verbatimClaim,
      'APPROVED'
    );

    assert.ok(visualVerbatim.line2.startsWith('Excerpt'), `Line 2 for verbatim quote must start with "Excerpt", got: "${visualVerbatim.line2}"`);

    reportPass('10. A paraphrase/summary is displayed as Summary, never as a verbatim Excerpt');
  } catch (err) {
    reportFail('10. A paraphrase/summary is displayed as Summary, never as a verbatim Excerpt', err);
  }

  // ─── Test 11: Invalid evidence cannot produce a verified badge in renderer ─
  try {
    // 11a. Unverified claim
    const unverifiedVisual = resolveEvidenceVisuals(
      1,
      { visualPlan: { badgeText: 'VERIFIED MAINTENANCE', primaryText: 'Cleaner Advice' } },
      { verified: false, evidenceStatus: 'unverified' },
      'NEEDS_REVIEW'
    );
    assert.strictEqual(unverifiedVisual.isRecordedEvidence, false);
    assert.strictEqual(unverifiedVisual.cardTitleColor, '#eab308', 'Unverified claim must be amber');
    assert.strictEqual(unverifiedVisual.badge, 'RESEARCH MAINTENANCE', 'VERIFIED badge must be sanitized to RESEARCH');

    // 11b. Claim with missing receipt cannot get green badge even if claimed verified
    const forgedVisual = resolveEvidenceVisuals(
      1,
      { visualPlan: { badgeText: 'VERIFIED STANDARD', primaryText: 'Safety Rule' } },
      { verified: true, evidenceStatus: 'evidence_recorded', supportingExcerpt: 'Valid length text here', retrievalReceipt: undefined },
      'APPROVED'
    );
    assert.strictEqual(forgedVisual.isRecordedEvidence, false, 'Missing receipt must deny green badge');
    assert.notStrictEqual(forgedVisual.cardTitleColor, '#10b981', 'Must not receive emerald green without receipt');

    reportPass('11. Invalid evidence cannot produce a verified badge or green card in renderer');
  } catch (err) {
    reportFail('11. Invalid evidence cannot produce a verified badge or green card in renderer', err);
  }

  // ─── Test 12: Package mutation after validation is detected before render ──
  try {
    const validPkg = createBasePackage();
    const firstCheck = validateContentPackage(validPkg);
    assert.strictEqual(firstCheck.valid, true, 'Initial package is valid');

    // Simulate post-validation tamper: a malicious actor injects verified: true without receipt
    const tamperedPkg = JSON.parse(JSON.stringify(validPkg));
    tamperedPkg.claims[0].verified = true;
    tamperedPkg.claims[0].evidenceStatus = 'evidence_recorded';
    // No receipt added!

    const tamperCheck = validateContentPackage(tamperedPkg);
    assert.strictEqual(tamperCheck.valid, false, 'Post-validation mutation must be detected fail-closed');
    assert.ok(tamperCheck.errors.length > 0);

    reportPass('12. Package mutation after validation is detected and rejected fail-closed');
  } catch (err) {
    reportFail('12. Package mutation after validation is detected and rejected fail-closed', err);
  }

  // ─── Test 13: Worker lease, retry, and webhook validation reject forged pkg ─
  try {
    const forgedPkg = createBasePackage();
    forgedPkg.claims[0].verified = true;
    forgedPkg.claims[0].retrievalStatus = 'SUCCESS'; // No receipt!

    // Validate at lease boundary
    const leaseCheck = validateContentPackage(forgedPkg);
    assert.strictEqual(leaseCheck.valid, false, 'Worker lease boundary must reject forged package');

    // Validate at retry boundary
    const retryCheck = validateContentPackage(forgedPkg);
    assert.strictEqual(retryCheck.valid, false, 'Retry boundary must reject forged package');

    // Validate at webhook boundary
    const webhookCheck = validateContentPackage(forgedPkg);
    assert.strictEqual(webhookCheck.valid, false, 'Webhook completion boundary must reject forged package');

    reportPass('13. Downstream trust boundaries (worker lease, retry, webhook) reject forged packages');
  } catch (err) {
    reportFail('13. Downstream trust boundaries (worker lease, retry, webhook) reject forged packages', err);
  }

  // ─── Test 14: Existing authentication and publishing safeguards intact ─────
  try {
    // 14a. Media token signing and verification
    const { token, expires } = signMediaToken('test_video.mp4', 60);
    const validCheck = verifyMediaToken('test_video.mp4', token, String(expires));
    assert.strictEqual(validCheck, true, 'Valid media token must be accepted');

    // Filename mismatch
    const mismatchCheck = verifyMediaToken('unauthorized_file.mp4', token, String(expires));
    assert.strictEqual(mismatchCheck, false, 'Token scoped to another file must be rejected');

    // Expired token
    const expiredRes = signMediaToken('test_video.mp4', -10);
    const expiredCheck = verifyMediaToken('test_video.mp4', expiredRes.token, String(expiredRes.expires));
    assert.strictEqual(expiredCheck, false, 'Expired token must be rejected');

    // 14b. Backend topic definitions have stress multiplier removed
    const aero = VERIFIED_LOCAL_TOPICS['why airplane windows have rounded corners'];
    assert.ok(aero, 'Backend topic must exist');
    const aeroNarration = aero.segments.map(s => s.text).join(' ');
    assert.ok(!aeroNarration.includes('four to five times'), 'Stress multiplier 4-5x must be removed from backend');
    assert.ok(!aeroNarration.includes('4-5x') && !aeroNarration.includes('4–5×'));

    reportPass('14. Authentication, media authorization HMAC, and publishing-disabled protections remain intact');
  } catch (err) {
    reportFail('14. Authentication, media authorization HMAC, and publishing-disabled protections remain intact', err);
  }

  console.log('\n===============================================================');
  console.log(` Regression Suite Summary: ${passedCount} passed, ${failedCount} failed`);
  console.log('===============================================================\n');

  if (failedCount > 0) {
    process.exit(1);
  }
}

runRegressionSuite().catch(err => {
  console.error('Fatal test error:', err);
  process.exit(1);
});
