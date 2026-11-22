import 'dotenv/config';
import assert from 'node:assert';
import crypto from 'node:crypto';
import process from 'node:process';
import {
  validateUrlForSsrf,
  safeLookup,
  normalizeExtractedText,
  verifyQuoteInText,
  retrieveAndVerifySource,
  computeReceiptSignature,
  verifyReceiptSignature
} from '../../apps/web/src/app/api/lib/sourceRetriever';
import {
  validateContentPackage,
  computePackageFingerprint,
  verifyPackageFingerprint
} from '../../apps/web/src/app/api/lib/contentContract';
import {
  buildMultiAffiliateBundle,
  resolveAmazonDomainAndCurrency,
  verifyAffiliateDestinationUrl,
  VIRAL_PRODUCT_VAULT
} from '../../apps/web/src/app/api/lib/productRadar';

let passed = 0;
let failed = 0;

function reportPass(msg) {
  console.log(`  ✓ PASS: ${msg}`);
  passed++;
}

function reportFail(msg, err) {
  console.error(`  ✗ FAIL: ${msg}`);
  console.error(`    Error: ${err?.message || err}`);
  failed++;
}

async function runTests() {
  console.log('===============================================================');
  console.log(' SIMPLYYTR 2.0 — Provenance, Fingerprinting & Affiliate Suite');
  console.log('===============================================================\n');

  // ─── Group 1: SSRF Protection & URL Validation ─────────────────────────────
  console.log('[Group 1: SSRF Defense & Protocol Bounds]');
  try {
    assert.strictEqual(validateUrlForSsrf('http://localhost:3000').safe, false);
    assert.strictEqual(validateUrlForSsrf('http://127.0.0.1:5432').safe, false);
    assert.strictEqual(validateUrlForSsrf('http://[::1]/secret').safe, false);
    reportPass('Blocks localhost and IPv4/IPv6 loopback targets');
  } catch (e) { reportFail('Blocks localhost targets', e); }

  try {
    assert.strictEqual(validateUrlForSsrf('http://169.254.169.254/latest/meta-data/').safe, false);
    assert.strictEqual(validateUrlForSsrf('http://metadata.google.internal/computeMetadata/v1/').safe, false);
    reportPass('Blocks AWS and Google Cloud instance metadata endpoints');
  } catch (e) { reportFail('Blocks cloud metadata endpoints', e); }

  try {
    assert.strictEqual(validateUrlForSsrf('http://10.0.1.5:8080/admin').safe, false);
    assert.strictEqual(validateUrlForSsrf('http://172.20.0.1/').safe, false);
    assert.strictEqual(validateUrlForSsrf('http://192.168.1.1/router').safe, false);
    reportPass('Blocks RFC1918 private intranet IP literals');
  } catch (e) { reportFail('Blocks RFC1918 private IP literals', e); }

  try {
    assert.strictEqual(validateUrlForSsrf('http://[::ffff:127.0.0.1]/secret').safe, false);
    assert.strictEqual(validateUrlForSsrf('http://[::ffff:169.254.169.254]/meta').safe, false);
    assert.strictEqual(validateUrlForSsrf('http://[fe80::1]/link-local').safe, false);
    assert.strictEqual(validateUrlForSsrf('http://[fc00::1]/ula').safe, false);
    reportPass('Blocks IPv4-mapped IPv6, link-local, and ULA destinations');
  } catch (e) { reportFail('Blocks IPv4-mapped IPv6 & ULA', e); }

  try {
    assert.strictEqual(validateUrlForSsrf('http://user:password@example.com').safe, false);
    assert.strictEqual(validateUrlForSsrf('https://token@example.com/api').safe, false);
    reportPass('Rejects embedded credentials in URLs fail-closed');
  } catch (e) { reportFail('Rejects embedded credentials', e); }

  try {
    assert.strictEqual(validateUrlForSsrf('http://example.com:5432/').safe, false);
    assert.strictEqual(validateUrlForSsrf('https://example.com:22/').safe, false);
    assert.strictEqual(validateUrlForSsrf('https://example.com:443/').safe, true);
    assert.strictEqual(validateUrlForSsrf('http://example.com:80/').safe, true);
    reportPass('Enforces standard web ports (80, 443) and blocks non-standard port scans');
  } catch (e) { reportFail('Port bounds check', e); }

  try {
    assert.strictEqual(validateUrlForSsrf('ftp://example.com/file.txt').safe, false);
    assert.strictEqual(validateUrlForSsrf('file:///etc/passwd').safe, false);
    assert.strictEqual(validateUrlForSsrf('https://support.apple.com/en-us/103258').safe, true);
    reportPass('Rejects non-HTTP(S) schemes and permits authentic public HTTPS URLs');
  } catch (e) { reportFail('Protocol whitelist check', e); }

  try {
    await new Promise((resolve, reject) => {
      safeLookup('localhost', {}, (err, addr) => {
        if (err && err.message.includes('SSRF_BLOCKED')) {
          return resolve();
        }
        reject(new Error(`safeLookup should have blocked localhost, got err: ${err?.message}, addr: ${addr}`));
      });
    });
    reportPass('Socket-level safeLookup intercepts DNS resolution and rejects loopback targets');
  } catch (e) { reportFail('Socket-level safeLookup DNS check', e); }

  // ─── Group 2: Byte Hashing, Text Extraction & Quote Matching ───────────────
  console.log('\n[Group 2: Byte-Level Hashing & Quote Verification]');
  try {
    const rawHtml = `
      <!DOCTYPE html>
      <html>
        <head><title>Apple Support</title></head>
        <body>
          <h1>How to clean your Apple products</h1>
          <p>To clean your Apple display, lightly dampen the cloth with water only. Don't spray liquid directly onto the screen.</p>
        </body>
      </html>
    `;
    const expectedHash = crypto.createHash('sha256').update(rawHtml).digest('hex');

    const result = await retrieveAndVerifySource({
      url: 'https://support.apple.com/en-us/103258',
      claimId: 'claim-cleaner-1',
      expectedQuote: "Don't spray liquid directly onto the screen.",
      fixtureContent: rawHtml,
      fixtureStatus: 200
    });

    assert.strictEqual(result.success, true);
    assert.strictEqual(result.contentHash, expectedHash);
    assert.strictEqual(result.quoteMatched, true);
    assert.strictEqual(result.excerptType, 'verbatim_quote');
    assert.strictEqual(result.evidenceStatus, 'evidence_recorded');
    reportPass('Calculates exact byte SHA-256 and records evidence when quote is verbatim');
  } catch (e) { reportFail('Verbatim quote evidence recording', e); }

  try {
    const rawHtml = '<html><body><p>Apple displays should be cleaned with microfiber cloths.</p></body></html>';
    const result = await retrieveAndVerifySource({
      url: 'https://support.apple.com/en-us/103258',
      claimId: 'claim-cleaner-1',
      expectedQuote: 'Guaranteed to completely destroy backlight if sprayed',
      fixtureContent: rawHtml,
      fixtureStatus: 200
    });

    assert.strictEqual(result.success, true);
    assert.strictEqual(result.quoteMatched, false);
    assert.strictEqual(result.excerptType, 'unmatched_excerpt');
    assert.strictEqual(result.evidenceStatus, 'source_retrieved');
    reportPass('Distinguishes source_retrieved from evidence_recorded when quote is unverified');
  } catch (e) { reportFail('Unmatched quote boundary', e); }

  // ─── Group 3: Server HMAC Receipt Signing & Anti-Forgery ───────────────────
  console.log('\n[Group 3: Cryptographic HMAC Receipt Minting & Verification]');
  try {
    const receipt = {
      receiptId: 'rcpt_test_123',
      claimId: 'claim-cleaner-1',
      url: 'https://support.apple.com/en-us/103258',
      contentHash: 'a'.repeat(64),
      httpStatus: 200
    };

    const signature = computeReceiptSignature(receipt, 'test-secret-key-32b');
    assert.strictEqual(typeof signature, 'string');
    assert.strictEqual(signature.length, 64);

    const isValid = verifyReceiptSignature({ ...receipt, receiptSignature: signature }, 'test-secret-key-32b');
    assert.strictEqual(isValid, true);
    reportPass('Mints and verifies valid HMAC-SHA256 receipt signature');
  } catch (e) { reportFail('HMAC signature verification', e); }

  try {
    const receipt = {
      receiptId: 'rcpt_test_123',
      claimId: 'claim-cleaner-1',
      url: 'https://support.apple.com/en-us/103258',
      contentHash: 'a'.repeat(64),
      httpStatus: 200
    };
    const signature = computeReceiptSignature(receipt, 'test-secret-key-32b');

    // Tamper with claimId
    assert.strictEqual(verifyReceiptSignature({ ...receipt, claimId: 'claim-cleaner-2', receiptSignature: signature }, 'test-secret-key-32b'), false);
    // Tamper with contentHash
    assert.strictEqual(verifyReceiptSignature({ ...receipt, contentHash: 'b'.repeat(64), receiptSignature: signature }, 'test-secret-key-32b'), false);
    // Tamper with status
    assert.strictEqual(verifyReceiptSignature({ ...receipt, httpStatus: 404, receiptSignature: signature }, 'test-secret-key-32b'), false);
    reportPass('Constant-time signature verification rejects tampered fields');
  } catch (e) { reportFail('Tampered signature detection', e); }

  // ─── Group 4: Claim Binding in Content Package Contract ───────────────────
  console.log('\n[Group 4: Claim-to-Receipt Binding in Content Contract]');
  try {
    const basePkg = {
      version: '1.0.0',
      topic: 'Precision Screen Cleaner',
      audience: 'Tech enthusiasts and electronics owners',
      targetProblem: 'How to clean displays safely without damaging protective coatings',
      proposedTitle: 'Why You Must Never Spray Screens Directly',
      openingHook: 'Device manufacturers advise never spraying liquid cleaners directly onto screens.',
      segments: [
        {
          id: 'seg-1',
          order: 1,
          text: 'Device manufacturers advise never spraying liquid cleaners directly onto screens.',
          visualPlan: {
            sceneType: 'MOTION_GRAPHIC',
            description: 'Advisory card for display maintenance',
            primaryText: 'SCREEN ADVISORY',
            secondaryText: 'Never Spray Displays',
            assetSource: 'LOCAL_SCENE_GRAPHICS'
          }
        },
        {
          id: 'seg-2',
          order: 2,
          text: 'Always check the manual for your specific model before cleaning. Inspect the complete guide in the description below.',
          visualPlan: {
            sceneType: 'MOTION_GRAPHIC',
            description: 'Checklist and instructions reference',
            primaryText: 'CHECK MANUAL',
            secondaryText: 'Manufacturer Guidance',
            assetSource: 'LOCAL_SCENE_GRAPHICS'
          }
        }
      ],
      claims: [
        {
          id: 'claim-1',
          claimText: 'Device manufacturers advise against spraying liquid cleaners directly onto electronic screens.',
          sourceRef: 'Manufacturer Maintenance Guide',
          sourceUrl: 'https://support.apple.com/en-us/103258',
          verified: false,
          evidenceStatus: 'source_located',
          excerptType: 'authored_summary',
          retrievalStatus: 'NOT_ATTEMPTED'
        }
      ],
      callToAction: 'Inspect the complete guide in the description below.',
      provenance: {
        source: 'Manufacturer Documentation',
        generatorMode: 'DETERMINISTIC_TOPIC_DEMO',
        license: 'CC-BY-4.0',
        verified: false
      },
      reviewStatus: 'NEEDS_REVIEW'
    };

    // Attach receipt minted for a DIFFERENT claim ID
    const cloned = JSON.parse(JSON.stringify(basePkg));
    cloned.claims[0].retrievalStatus = 'SUCCESS';
    cloned.claims[0].retrievalReceipt = {
      receiptId: 'rcpt-cross-claim-1',
      claimId: 'claim-unrelated-99', // Mismatched!
      url: 'https://support.apple.com/en-us/103258',
      retrievedAt: new Date().toISOString(),
      httpStatus: 200,
      contentType: 'text/html',
      contentHash: 'f'.repeat(64)
    };

    const valResult = validateContentPackage(cloned);
    assert.strictEqual(valResult.valid, false);
    assert.ok(valResult.errors.some(e => e.includes('does not match claim id')));
    reportPass('Rejects cross-claim receipt substitution fail-closed');
  } catch (e) { reportFail('Cross-claim receipt substitution check', e); }

  try {
    const basePkg = {
      version: '1.0.0',
      topic: 'Precision Screen Cleaner',
      audience: 'Tech enthusiasts and electronics owners',
      targetProblem: 'How to clean displays safely without damaging protective coatings',
      proposedTitle: 'Why You Must Never Spray Screens Directly',
      openingHook: 'Device manufacturers advise never spraying liquid cleaners directly onto screens.',
      segments: [
        {
          id: 'seg-1',
          order: 1,
          text: 'Device manufacturers advise never spraying liquid cleaners directly onto screens.',
          visualPlan: {
            sceneType: 'MOTION_GRAPHIC',
            description: 'Advisory card for display maintenance',
            primaryText: 'SCREEN ADVISORY',
            secondaryText: 'Never Spray Displays',
            assetSource: 'LOCAL_SCENE_GRAPHICS'
          }
        },
        {
          id: 'seg-2',
          order: 2,
          text: 'Always check the manual for your specific model before cleaning. Inspect the complete guide in the description below.',
          visualPlan: {
            sceneType: 'MOTION_GRAPHIC',
            description: 'Checklist and instructions reference',
            primaryText: 'CHECK MANUAL',
            secondaryText: 'Manufacturer Guidance',
            assetSource: 'LOCAL_SCENE_GRAPHICS'
          }
        }
      ],
      claims: [
        {
          id: 'claim-1',
          claimText: 'Device manufacturers advise against spraying liquid cleaners directly onto electronic screens.',
          sourceRef: 'Manufacturer Maintenance Guide',
          sourceUrl: 'https://support.apple.com/en-us/103258',
          verified: false,
          evidenceStatus: 'source_located',
          excerptType: 'authored_summary',
          retrievalStatus: 'NOT_ATTEMPTED'
        }
      ],
      callToAction: 'Inspect the complete guide in the description below.',
      provenance: {
        source: 'Manufacturer Documentation',
        generatorMode: 'DETERMINISTIC_TOPIC_DEMO',
        license: 'CC-BY-4.0',
        verified: false
      },
      reviewStatus: 'NEEDS_REVIEW'
    };

    const cloned = JSON.parse(JSON.stringify(basePkg));
    cloned.claims[0].retrievalStatus = 'SUCCESS';
    cloned.claims[0].retrievalReceipt = {
      receiptId: 'rcpt-forged-sig',
      claimId: 'claim-1',
      url: 'https://support.apple.com/en-us/103258',
      retrievedAt: new Date().toISOString(),
      httpStatus: 200,
      contentType: 'text/html',
      contentHash: 'a'.repeat(64),
      receiptSignature: 'bad-forged-signature-00000000000000000000000000000000000000000000'
    };

    const valResult = validateContentPackage(cloned);
    assert.strictEqual(valResult.valid, false);
    assert.ok(valResult.errors.some(e => e.includes('invalid or forged receiptSignature')));
    reportPass('Rejects forged or invalid receiptSignature fail-closed');
  } catch (e) { reportFail('Forged receiptSignature rejection', e); }

  // ─── Group 5: Content Package Immutability & Fingerprinting ───────────────
  console.log('\n[Group 5: Cryptographic Package Fingerprinting & Immutability]');
  try {
    const pkg = {
      version: '1.0.0',
      topic: 'Precision Screen Cleaner',
      audience: 'Tech enthusiasts and electronics owners',
      targetProblem: 'How to clean displays safely without damaging protective coatings',
      proposedTitle: 'Why You Must Never Spray Screens Directly',
      openingHook: 'Device manufacturers advise never spraying liquid cleaners directly onto screens.',
      segments: [
        {
          id: 'seg-1',
          order: 1,
          text: 'Device manufacturers advise never spraying liquid cleaners directly onto screens.',
          visualPlan: {
            sceneType: 'MOTION_GRAPHIC',
            description: 'Advisory card for display maintenance',
            primaryText: 'SCREEN ADVISORY',
            secondaryText: 'Never Spray Displays',
            assetSource: 'LOCAL_SCENE_GRAPHICS'
          }
        },
        {
          id: 'seg-2',
          order: 2,
          text: 'Always check the manual for your specific model before cleaning. Inspect the complete guide in the description below.',
          visualPlan: {
            sceneType: 'MOTION_GRAPHIC',
            description: 'Checklist and instructions reference',
            primaryText: 'CHECK MANUAL',
            secondaryText: 'Manufacturer Guidance',
            assetSource: 'LOCAL_SCENE_GRAPHICS'
          }
        }
      ],
      claims: [
        {
          id: 'claim-1',
          claimText: 'Device manufacturers advise against spraying liquid cleaners directly onto electronic screens.',
          sourceRef: 'Manufacturer Maintenance Guide',
          sourceUrl: 'https://support.apple.com/en-us/103258',
          verified: false,
          evidenceStatus: 'source_located',
          excerptType: 'authored_summary',
          retrievalStatus: 'NOT_ATTEMPTED'
        }
      ],
      callToAction: 'Inspect the complete guide in the description below.',
      provenance: {
        source: 'Manufacturer Documentation',
        generatorMode: 'DETERMINISTIC_TOPIC_DEMO',
        license: 'CC-BY-4.0',
        verified: false
      },
      reviewStatus: 'APPROVED'
    };

    const fp1 = computePackageFingerprint(pkg);
    const fp2 = computePackageFingerprint(pkg);
    assert.strictEqual(fp1, fp2, 'Fingerprint must be deterministic');
    assert.strictEqual(verifyPackageFingerprint(pkg, fp1), true);

    // Tamper with segment text
    const tampered = JSON.parse(JSON.stringify(pkg));
    tampered.segments[0].text = 'Completely altered narration text here.';
    assert.strictEqual(verifyPackageFingerprint(tampered, fp1), false);
    reportPass('Package fingerprint detects post-approval script tampering');
  } catch (e) { reportFail('Package fingerprint tampering detection', e); }

  // ─── Group 6: Amazon Associates India & Multi-Affiliate Bundle ─────────────
  console.log('\n[Group 6: Amazon Associates India & Multi-Affiliate Intelligence]');
  try {
    const product = VIRAL_PRODUCT_VAULT[0];

    // US Storefront resolution
    const usBundle = buildMultiAffiliateBundle(product, 'simplyytr-20', undefined, 'US');
    assert.ok(usBundle.amazonLink.startsWith('https://www.amazon.com/s?k='));
    assert.ok(usBundle.amazonLink.includes('tag=simplyytr-20'));
    assert.strictEqual(usBundle.currency, 'USD');
    assert.strictEqual(usBundle.region, 'US');
    // Sample items must never be falsely marked as verified affiliate links
    assert.strictEqual(usBundle.isAffiliateLinkVerified, false);
    assert.strictEqual(verifyAffiliateDestinationUrl(usBundle.amazonLink).valid, true);

    // Provider-verified product test
    const verifiedProduct = { ...product, verificationStatus: 'PROVIDER_VERIFIED' };
    const verifiedBundle = buildMultiAffiliateBundle(verifiedProduct, 'simplyytr-20', undefined, 'US');
    assert.strictEqual(verifiedBundle.isAffiliateLinkVerified, true);

    reportPass('Generates Amazon US affiliate search links and validates verification status');
  } catch (e) { reportFail('Amazon US storefront generation', e); }

  try {
    const product = VIRAL_PRODUCT_VAULT[0];

    // India Storefront resolution via region parameter
    const inBundle = buildMultiAffiliateBundle(product, 'simplyytr-21', undefined, 'IN');
    assert.ok(inBundle.amazonLink.startsWith('https://www.amazon.in/s?k='));
    assert.ok(inBundle.amazonLink.includes('tag=simplyytr-21'));
    assert.strictEqual(inBundle.currency, 'INR');
    assert.strictEqual(inBundle.region, 'IN');
    assert.strictEqual(inBundle.isAffiliateLinkVerified, false);
    assert.strictEqual(verifyAffiliateDestinationUrl(inBundle.amazonLink).valid, true);

    // Provider-verified product test for India
    const verifiedProduct = { ...product, verificationStatus: 'PROVIDER_VERIFIED' };
    const verifiedBundle = buildMultiAffiliateBundle(verifiedProduct, 'simplyytr-21', undefined, 'IN');
    assert.strictEqual(verifiedBundle.isAffiliateLinkVerified, true);

    reportPass('Generates Amazon Associates India (amazon.in) links and validates verification status');
  } catch (e) { reportFail('Amazon India storefront generation', e); }

  try {
    const product = VIRAL_PRODUCT_VAULT[0];

    // Tag format auto-detection (-21 suffix defaults to Amazon India)
    const autoInBundle = buildMultiAffiliateBundle(product, 'mychannel-21');
    assert.strictEqual(autoInBundle.region, 'IN');
    assert.ok(autoInBundle.amazonLink.startsWith('https://www.amazon.in/s?k='));
    reportPass('Auto-detects Amazon India storefront from -21 associate tag suffix');
  } catch (e) { reportFail('Amazon India auto-detection from tag', e); }

  try {
    assert.strictEqual(verifyAffiliateDestinationUrl('https://www.amazon.in/s?k=cleaner&tag=simplyytr-21').valid, true);
    assert.strictEqual(verifyAffiliateDestinationUrl('https://www.amazon.com/s?k=cleaner&tag=simplyytr-20').valid, true);
    assert.strictEqual(verifyAffiliateDestinationUrl('https://malicious-phishing.com/s?tag=simplyytr-20').valid, false);
    assert.strictEqual(verifyAffiliateDestinationUrl('https://www.amazon.com/s?k=cleaner').valid, false); // No tag
    reportPass('verifyAffiliateDestinationUrl enforces permitted domains and tag presence');
  } catch (e) { reportFail('verifyAffiliateDestinationUrl boundaries', e); }

  console.log('\n===============================================================');
  console.log(` Summary: ${passed} passed, ${failed} failed`);
  console.log('===============================================================');

  if (failed > 0) {
    process.exit(1);
  }
}

runTests().catch(err => {
  console.error('Test execution error:', err);
  process.exit(1);
});
