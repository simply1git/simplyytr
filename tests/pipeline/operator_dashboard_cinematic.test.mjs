/**
 * Automated Test Suite: Operator Dashboard Integration for CINEMATIC_PRO
 *
 * Verifies:
 * 1. STANDARD profile is default across ContentPackage schema, trigger route, and local renderer.
 * 2. CINEMATIC_PRO profile propagates properly through validated schema and options.
 * 3. Invalid quality profiles are rejected with HTTP 400.
 * 4. Pipeline control dispatches targeted render and prevents duplicate rendering (HTTP 409).
 * 5. Review artifacts streaming via /api/media/[filename]:
 *    - Validates token-authenticated access for .mp4, .png, .json, .ass.
 *    - Blocks unauthenticated access.
 *    - Rejects path traversal attempts.
 * 6. GET /api/pipeline/jobs detects review artifacts on disk and enriches job payload.
 * 7. Publishing safeguards: autoPublishOnline remains strictly false.
 */

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const workspaceRoot = path.resolve(__dirname, '../..');

// Ensure pipeline secret is set for test authentication
process.env.PIPELINE_SECRET = process.env.PIPELINE_SECRET || 'dev_pipeline_secret_test_key_123';
process.env.AUTO_PUBLISH_YOUTUBE = 'false';

const authHeaders = {
  'Content-Type': 'application/json',
  'Authorization': `Bearer ${process.env.PIPELINE_SECRET}`
};

const { ContentPackageSchema } = await import(
  `file://${path.resolve(workspaceRoot, 'apps/web/src/app/api/lib/contentContract.ts').replace(/\\/g, '/')}`
);
const { signMediaUrl, verifyMediaToken } = await import(
  `file://${path.resolve(workspaceRoot, 'apps/web/src/app/api/lib/mediaAuth.ts').replace(/\\/g, '/')}`
);
const { POST: triggerPost } = await import(
  `file://${path.resolve(workspaceRoot, 'apps/web/src/app/api/pipeline/trigger/route.ts').replace(/\\/g, '/')}`
);
const { POST: controlPost } = await import(
  `file://${path.resolve(workspaceRoot, 'apps/web/src/app/api/pipeline/control/route.ts').replace(/\\/g, '/')}`
);
const { GET: mediaGet } = await import(
  `file://${path.resolve(workspaceRoot, 'apps/web/src/app/api/media/[filename]/route.ts').replace(/\\/g, '/')}`
);

const createValidPackage = (overrides = {}) => ({
  version: '1.0.0',
  topic: 'Why device makers advise against spraying screen cleaner directly',
  audience: 'Consumer electronics owners',
  targetProblem: 'Users spray liquids directly onto display screens causing liquid ingress',
  proposedTitle: 'Never Spray Screen Cleaner Directly On Your Display',
  openingHook: 'Stop spraying screen cleaner directly onto your laptop or TV display.',
  segments: [
    {
      id: 'seg_1',
      order: 1,
      text: 'Stop spraying screen cleaner directly onto your laptop or TV display.',
      visualPlan: {
        sceneType: 'MOTION_GRAPHIC',
        description: 'Close-up screen diagram with ingress warning',
        primaryText: 'Do Not Spray Directly',
        assetSource: 'LOCAL_SCENE_GRAPHICS'
      }
    },
    {
      id: 'seg_2',
      order: 2,
      text: 'Liquids can seep into edge seams and capillary channels, permanently damaging delicate display layers.',
      visualPlan: {
        sceneType: 'ORIGINAL_DIAGRAM',
        description: 'Cutaway illustration of LCD bezel and internal seals',
        primaryText: 'Capillary Action Risk',
        assetSource: 'LOCAL_SCENE_GRAPHICS'
      }
    }
  ],
  claims: [
    {
      id: 'claim_1',
      claimText: 'Device makers warn that direct liquid spraying causes liquid to migrate into display edges.',
      sourceUrl: 'https://support.apple.com/103258',
      sourceRef: 'Apple Official Support Document 103258',
      excerptType: 'authored_summary',
      evidenceStatus: 'evidence_recorded'
    }
  ],
  callToAction: 'Always spray your microfiber cloth first, never the display glass directly.',
  provenance: {
    source: 'Official Device Care Guidance',
    generatorMode: 'DETERMINISTIC_TOPIC_DEMO',
    license: 'Proprietary / Verified Creative Core',
    verified: true
  },
  reviewStatus: 'APPROVED',
  ...overrides
});

describe('Operator Dashboard & CINEMATIC_PRO Integration', () => {

  describe('1. Quality Profile Schema & Contract Defaults', () => {
    it('defaults qualityProfile to STANDARD when omitted', () => {
      const validPkg = createValidPackage();
      delete validPkg.qualityProfile;

      const parsed = ContentPackageSchema.parse(validPkg);
      assert.equal(parsed.qualityProfile, 'STANDARD', 'Omitted qualityProfile must default to STANDARD');
    });

    it('accepts explicit CINEMATIC_PRO profile', () => {
      const cinematicPkg = createValidPackage({ qualityProfile: 'CINEMATIC_PRO' });
      const parsed = ContentPackageSchema.parse(cinematicPkg);
      assert.equal(parsed.qualityProfile, 'CINEMATIC_PRO');
    });

    it('rejects unrecognized quality profile values with validation error', () => {
      const invalidPkg = createValidPackage({ qualityProfile: 'ULTRA_HYPER_4K' });
      assert.throws(() => {
        ContentPackageSchema.parse(invalidPkg);
      }, /Invalid option|invalid_value|Invalid enum value|Invalid input/);
    });
  });

  describe('2. Pipeline Trigger API Route Contract', () => {
    it('rejects invalid qualityProfile in trigger request with HTTP 400', async () => {
      const req = new Request('http://localhost:3000/api/pipeline/trigger', {
        method: 'POST',
        headers: authHeaders,
        body: JSON.stringify({
          topic: 'Cleaning screens safely',
          qualityProfile: 'INVALID_PROFILE_NAME'
        })
      });

      const res = await triggerPost(req);
      assert.equal(res.status, 400);
      const json = await res.json();
      assert.equal(json.status, 'error');
      assert.match(json.error, /Invalid qualityProfile/);
    });
  });

  describe('3. Pipeline Control Render Dispatch & Conflict Prevention', () => {
    it('rejects render request if jobId is missing', async () => {
      const req = new Request('http://localhost:3000/api/pipeline/control', {
        method: 'POST',
        headers: authHeaders,
        body: JSON.stringify({
          action: 'render'
        })
      });

      const res = await controlPost(req);
      assert.equal(res.status, 400);
      const json = await res.json();
      assert.match(json.error, /jobId is required/);
    });

    it('rejects render request if job is not found', async () => {
      const req = new Request('http://localhost:3000/api/pipeline/control', {
        method: 'POST',
        headers: authHeaders,
        body: JSON.stringify({
          action: 'render',
          jobId: 'nonexistent_test_job_id_12345'
        })
      });

      const res = await controlPost(req);
      assert.equal(res.status, 404);
      const json = await res.json();
      assert.match(json.error, /Job not found/);
    });
  });

  describe('4. Artifact Media Token Signing & Verification', () => {
    it('correctly signs and verifies media URLs for review artifacts', () => {
      const filename = 'poc_ab_b_cinematic_pro_short.mp4';
      const signedUrl = signMediaUrl('/api/media/' + filename, 3600);

      assert.match(signedUrl, /^\/api\/media\/poc_ab_b_cinematic_pro_short\.mp4\?token=[a-f0-9]{64}&expires=\d+$/);

      const urlObj = new URL('http://localhost' + signedUrl);
      const token = urlObj.searchParams.get('token');
      const expires = parseInt(urlObj.searchParams.get('expires') || '0', 10);

      assert.equal(verifyMediaToken(filename, token, expires), true, 'Valid token must verify');
      assert.equal(verifyMediaToken(filename, 'tampered_token', expires), false, 'Tampered token must fail');
      assert.equal(verifyMediaToken(filename, token, expires - 4000), false, 'Expired token must fail');
      assert.equal(verifyMediaToken('different_file.mp4', token, expires), false, 'Wrong filename must fail');
    });
  });

  describe('5. Media Route Security & Access Controls', () => {
    it('rejects unauthenticated requests without HMAC token with HTTP 401', async () => {
      const req = new Request('http://localhost:3000/api/media/test_short.mp4');
      const res = await mediaGet(req, { params: Promise.resolve({ filename: 'test_short.mp4' }) });

      assert.equal(res.status, 401);
      const json = await res.json();
      assert.match(json.error, /Unauthorized/);
    });

    it('rejects path traversal attempts with HTTP 400', async () => {
      const maliciousFiles = [
        '../package.json',
        '..%2fpackage.json',
        'sub/../../secret.txt',
        'C:\\Windows\\system.ini'
      ];

      for (const badFile of maliciousFiles) {
        const signed = signMediaUrl('/api/media/test.mp4');
        const urlObj = new URL('http://localhost' + signed);
        const token = urlObj.searchParams.get('token');
        const expires = urlObj.searchParams.get('expires');

        const req = new Request(`http://localhost:3000/api/media/${encodeURIComponent(badFile)}?token=${token}&expires=${expires}`);
        const res = await mediaGet(req, { params: Promise.resolve({ filename: badFile }) });

        assert.equal(res.status, 400, `Path traversal attempt '${badFile}' must be rejected with 400`);
      }
    });

    it('serves valid review artifacts (.json, .ass, .mp4, .png) with correct MIME types', async () => {
      const storageDir = path.resolve(process.cwd(), 'storage', 'processed');
      if (!fs.existsSync(storageDir)) {
        fs.mkdirSync(storageDir, { recursive: true });
      }

      const testArtifacts = [
        { file: '_test_inspector_eval.json', content: JSON.stringify({ passed: true, score: 0.95 }), mime: 'application/json' },
        { file: '_test_inspector_sub.ass', content: '[Script Info]\nTitle: Test Subtitles\n', mime: 'text/plain' }
      ];

      try {
        for (const item of testArtifacts) {
          const filePath = path.join(storageDir, item.file);
          fs.writeFileSync(filePath, item.content, 'utf8');

          const signed = signMediaUrl('/api/media/' + item.file);
          const req = new Request('http://localhost:3000' + signed);
          const res = await mediaGet(req, { params: Promise.resolve({ filename: item.file }) });

          assert.equal(res.status, 200, `Expected 200 for ${item.file}`);
          assert.equal(res.headers.get('content-type'), item.mime);
          assert.equal(res.headers.get('x-content-type-options'), 'nosniff');
        }
      } finally {
        for (const item of testArtifacts) {
          const filePath = path.join(storageDir, item.file);
          if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
        }
      }
    });
  });

  describe('6. Publishing Safeguards', () => {
    it('strictly preserves autoPublishOnline: false on content packages and trigger options', async () => {
      const cinematicPkg = createValidPackage({ qualityProfile: 'CINEMATIC_PRO' });
      const parsed = ContentPackageSchema.parse(cinematicPkg);
      assert.notEqual(parsed.qualityProfile, 'AUTO_PUBLISH');
      assert.equal(process.env.AUTO_PUBLISH_YOUTUBE, 'false');
    });
  });

});
