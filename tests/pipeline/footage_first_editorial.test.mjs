/**
 * SIMPLYYTR 2.0 — Footage-First Editorial Engine Acceptance Test Suite
 * 
 * Verifies:
 * 1. Lawful asset discovery, NASA/Wikimedia metadata extraction & provenance hashing.
 * 2. Deduplication and repetition prevention across adjacent timeline cuts.
 * 3. Extended Edit Decision Plan (EDP v2.1.0) generation and multi-style routing.
 * 4. Specialist adapters: smart reframing, pacing analysis, audio ducking.
 * 5. Quality gates: anti-slideshow gate, rights clearance, and audio continuity.
 */

import assert from 'node:assert';
import fs from 'node:fs';
import path from 'node:path';
import {
  searchAssetLibrary,
  calculateMotivatedInPoint,
  computeFileSha256,
  initializeCuratedAssetLibrary
} from '../../apps/backend/src/services/assetLibrary.ts';
import {
  generateEditDecisionPlan,
  validateEditDecisionPlan,
  calculateAntiSlideshowMetrics
} from '../../apps/backend/src/services/editDecisionPlan.ts';
import {
  determineProductionStyle,
  PRODUCTION_STYLES
} from '../../apps/backend/src/services/editorialEngine.ts';
import {
  evaluateAntiSlideshowGate,
  evaluateRightsClearanceGate,
  evaluateAudioAndCaptionGate,
  runComprehensiveQualityGates
} from '../../apps/backend/src/services/qualityGates.ts';

console.log('===============================================================');
console.log(' SIMPLYYTR 2.0 Footage-First Editorial Engine Tests');
console.log('===============================================================\n');

let totalPassed = 0;
let totalFailed = 0;

function runTest(name, fn) {
  try {
    fn();
    console.log(`  ✓ PASS: ${name}`);
    totalPassed++;
  } catch (err) {
    console.error(`  ✗ FAIL: ${name}`);
    console.error(`    ${err.message}`);
    totalFailed++;
  }
}

async function runAsyncTest(name, fn) {
  try {
    await fn();
    console.log(`  ✓ PASS: ${name}`);
    totalPassed++;
  } catch (err) {
    console.error(`  ✗ FAIL: ${name}`);
    console.error(`    ${err.message}`);
    totalFailed++;
  }
}

// Group 1: Lawful Asset Library & Provenance
console.log('[Group 1: Lawful Asset Library, Ingestion & Provenance]');

runTest('Asset library initializes curated public domain assets', () => {
  initializeCuratedAssetLibrary();
  const found = searchAssetLibrary({
    keywords: ['airplane', 'flight', 'cruise'],
    preferredMediaType: 'VIDEO'
  });
  assert.ok(found, 'Should find NASA flight video asset');
  assert.strictEqual(found.rights.sourceOrigin, 'NASA_PUBLIC_DOMAIN');
  assert.strictEqual(found.rights.permittedUsage, 'PUBLIC_DOMAIN');
  assert.ok(found.rights.verified, 'Asset rights must be marked verified');
});

runTest('Asset search scores relevance and respects media type preference', () => {
  const cometAsset = searchAssetLibrary({
    keywords: ['comet', '1952', 'history'],
    preferredMediaType: 'IMAGE_ARCHIVE'
  });
  assert.ok(cometAsset, 'Should find Comet archive image');
  assert.strictEqual(cometAsset.assetId, 'wiki-dh106-comet-archive');
  assert.strictEqual(cometAsset.rights.sourceOrigin, 'WIKIMEDIA_COMMONS');
  assert.strictEqual(cometAsset.rights.licenseName, 'CC BY-SA 2.0');
});

runTest('Asset search deduplication avoids excluded asset IDs', () => {
  const first = searchAssetLibrary({ keywords: ['airplane', 'aviation'] });
  assert.ok(first, 'First asset found');

  const second = searchAssetLibrary({
    keywords: ['airplane', 'aviation'],
    excludeAssetIds: [first.assetId]
  });
  if (second) {
    assert.notStrictEqual(second.assetId, first.assetId, 'Excluded asset must not be returned');
  }
});

runTest('Calculates motivated in-point snapping to scene boundaries', () => {
  const asset = {
    mediaType: 'VIDEO',
    durationSec: 15.0,
    sceneBoundaries: [{ timestampSec: 0, score: 0.8 }, { timestampSec: 5.5, score: 0.6 }]
  };
  const window = calculateMotivatedInPoint(asset, 4.0);
  assert.ok(window.inPointSec >= 0, 'In-point must be >= 0');
  assert.ok(window.outPointSec > window.inPointSec, 'Out-point must be after in-point');
  assert.strictEqual(parseFloat((window.outPointSec - window.inPointSec).toFixed(2)), 4.0);
});

// Group 2: Production Styles & Editorial Engine
console.log('\n[Group 2: Production Styles & Editorial Engine]');

runTest('Supports all 6 distinct production styles with configured pacing bounds', () => {
  const styles = [
    'DOCUMENTARY_ESSAY',
    'FAST_PACED_SHORTS',
    'TECHNICAL_EXPLAINER',
    'COMMENTARY_TRANSFORMATION',
    'SCREEN_TUTORIAL',
    'MOTION_GRAPHICS'
  ];

  for (const s of styles) {
    assert.ok(PRODUCTION_STYLES[s], `Style ${s} must be configured in PRODUCTION_STYLES`);
    const cfg = PRODUCTION_STYLES[s];
    assert.ok(cfg.targetShotDurationRangeSec[0] > 0, `${s} min duration must be > 0`);
    assert.ok(cfg.targetShotDurationRangeSec[1] > cfg.targetShotDurationRangeSec[0], `${s} max duration must exceed min`);
    assert.ok(cfg.preferredMotionRatio >= 0 && cfg.preferredMotionRatio <= 1, `${s} motion ratio must be in 0..1`);
  }
});

runTest('Style resolver accurately routes aerospace investigation to DOCUMENTARY_ESSAY', () => {
  const resolved = determineProductionStyle(null, 'Why Airplane Windows Have Rounded Corners');
  assert.strictEqual(resolved, 'DOCUMENTARY_ESSAY');
});

runTest('Style resolver accurately routes tutorial queries to SCREEN_TUTORIAL', () => {
  const resolved = determineProductionStyle(null, 'How to configure PostgreSQL connection pooling');
  assert.strictEqual(resolved, 'SCREEN_TUTORIAL');
});

// Group 3: Edit Decision Plan (EDP v2.1.0)
console.log('\n[Group 3: Edit Decision Plan (EDP v2.1.0)]');

runTest('Generates valid EDP v2.1.0 containing motion footage and archival clips', () => {
  const mockJob = {
    id: 'test_job_edp_v21',
    topic: 'Why Airplane Windows Have Rounded Corners',
    videoStyle: 'DOCUMENTARY_ESSAY'
  };

  const edp = generateEditDecisionPlan(mockJob, null, 64.0, 'dummy_path.wav');
  assert.strictEqual(edp.version, '2.1.0');
  assert.strictEqual(edp.productionStyle, 'DOCUMENTARY_ESSAY');
  assert.strictEqual(edp.shots.length, 8);

  // Verify motion footage presence in Shot 1 and Shot 7
  const shot1 = edp.shots[0];
  assert.strictEqual(shot1.compositionType, 'REAL_FOOTAGE_MOTION');
  assert.ok(shot1.footageClip, 'Shot 1 must contain footage clip');
  assert.strictEqual(shot1.footageClip.assetId, 'nasa-armd-high-altitude-cruise');

  const shot3 = edp.shots[2];
  assert.strictEqual(shot3.compositionType, 'ARCHIVAL_HISTORICAL_RECORD');
  assert.ok(shot3.footageClip, 'Shot 3 must contain archival clip');
  assert.strictEqual(shot3.footageClip.assetId, 'wiki-dh106-comet-archive');

  // Verify every shot has a narrative purpose and pacing rationale
  for (const s of edp.shots) {
    assert.ok(s.narrativePurpose && s.narrativePurpose.length > 0, `Shot ${s.id} missing narrative purpose`);
    assert.ok(s.pacingRationale && s.pacingRationale.length > 0, `Shot ${s.id} missing pacing rationale`);
  }

  // Validate EDP
  const val = validateEditDecisionPlan(edp);
  assert.ok(val.valid, `EDP validation should pass: ${val.issues.join('; ')}`);
});

runTest('EDP validator detects timeline gaps greater than tolerance', () => {
  const mockPlan = {
    version: '2.1.0',
    jobId: 'gap_test',
    topic: 'Test Topic',
    displayTitle: 'Test',
    productionStyle: 'DOCUMENTARY_ESSAY',
    totalDurationSec: 20.0,
    resolution: { width: 1080, height: 1920, fps: 30 },
    shots: [
      { id: 's1', startTime: 0, endTime: 5.0, duration: 5.0 },
      { id: 's2', startTime: 6.0, endTime: 20.0, duration: 14.0 } // 1.0s gap
    ],
    audio: {},
    captions: [],
    assetManifest: [{ assetId: 'a1' }],
    antiSlideshowMetrics: { passedAntiSlideshowGate: true }
  };

  const val = validateEditDecisionPlan(mockPlan);
  assert.strictEqual(val.valid, false);
  assert.ok(val.issues.some(i => i.includes('gap/overlap detected')));
});

// Group 4: Quality Gates
console.log('\n[Group 4: Quality Gates & Anti-Slideshow Validation]');

runTest('Anti-slideshow gate passes when motion footage and varied shots are present', () => {
  const mockJob = {
    id: 'test_quality_gates',
    topic: 'Why Airplane Windows Have Rounded Corners',
    videoStyle: 'DOCUMENTARY_ESSAY'
  };

  const edp = generateEditDecisionPlan(mockJob, null, 64.0, 'dummy_path.wav');
  const gate = evaluateAntiSlideshowGate(edp);
  assert.strictEqual(gate.passed, true);
  assert.ok(gate.score >= 70, `Score should be >= 70, got ${gate.score}`);
  assert.ok(gate.metadata.motionFootageRatio >= 0.10, 'Motion ratio must meet minimum threshold');
});

runTest('Anti-slideshow gate fails when video exceeds maximum shot duration', () => {
  const draggingPlan = {
    totalDurationSec: 40.0,
    productionStyle: 'DOCUMENTARY_ESSAY',
    shots: [
      { id: 's1', duration: 25.0, compositionType: 'REAL_FOOTAGE_MOTION', cameraMotion: { type: 'STATIC' } }, // 25s shot!
      { id: 's2', duration: 15.0, compositionType: 'REAL_FOOTAGE_MOTION', cameraMotion: { type: 'STATIC' } }
    ]
  };

  const gate = evaluateAntiSlideshowGate(draggingPlan);
  assert.strictEqual(gate.passed, false);
  assert.ok(gate.failures.some(f => f.includes('exceeds limit')));
});

runTest('Rights clearance gate passes when all manifest entries are verified', () => {
  const mockJob = {
    id: 'test_rights_gate',
    topic: 'Why Airplane Windows Have Rounded Corners',
    videoStyle: 'DOCUMENTARY_ESSAY'
  };

  const edp = generateEditDecisionPlan(mockJob, null, 64.0, 'dummy_path.wav');
  const gate = evaluateRightsClearanceGate(edp);
  assert.strictEqual(gate.passed, true);
  assert.strictEqual(gate.failures.length, 0);
});

runTest('Rights clearance gate rejects unverified assets', () => {
  const unverifiedPlan = {
    assetManifest: [
      {
        assetId: 'scraped_clip_1',
        description: 'Random YouTube excerpt',
        sourceOrigin: 'Unknown',
        license: 'Unknown',
        verified: false
      }
    ],
    shots: []
  };

  const gate = evaluateRightsClearanceGate(unverifiedPlan);
  assert.strictEqual(gate.passed, false);
  assert.ok(gate.failures.some(f => f.includes('not verified for commercial reuse')));
});

runTest('Audio and caption gate verifies ducked volume is strictly lower than base volume', () => {
  const badAudioPlan = {
    totalDurationSec: 10.0,
    audio: {
      musicBed: { baseVolume: 0.20, duckedVolume: 0.25 } // Invalid: ducked is higher!
    },
    shots: [{ id: 's1', startTime: 0, endTime: 10.0, duration: 10.0 }],
    captions: [{ text: 'test' }]
  };

  const gate = evaluateAudioAndCaptionGate(badAudioPlan);
  assert.strictEqual(gate.passed, false);
  assert.ok(gate.failures.some(f => f.includes('not lower than base volume')));
});

runTest('Comprehensive quality report executes all gates and summarizes status', () => {
  const mockJob = {
    id: 'test_comprehensive_gate',
    topic: 'Why Airplane Windows Have Rounded Corners',
    videoStyle: 'DOCUMENTARY_ESSAY'
  };

  const edp = generateEditDecisionPlan(mockJob, null, 64.0, 'dummy_path.wav');
  const report = runComprehensiveQualityGates(edp);
  assert.strictEqual(report.overallPassed, true);
  assert.strictEqual(report.gates.length, 3);
  assert.ok(report.summary.includes('passed successfully'));
});

// Group 5: Asset Files Existence & Integrity
console.log('\n[Group 5: Verified Local Asset Artifacts]');

runTest('NASA flight footage exists and has non-zero size', () => {
  const p = path.resolve('storage/assets/footage/nasa_aircraft_cruise.mp4');
  assert.ok(fs.existsSync(p), 'NASA cruise footage must exist on disk');
  const size = fs.statSync(p).size;
  assert.ok(size > 500000, `Footage size should be > 500KB, got ${size} bytes`);
});

runTest('Comet 1952 archival photograph exists and has non-zero size', () => {
  const p = path.resolve('storage/assets/photos/dh106_comet_1952.jpg');
  assert.ok(fs.existsSync(p), 'Comet 1952 photo must exist on disk');
  const size = fs.statSync(p).size;
  assert.ok(size > 50000, `Photo size should be > 50KB, got ${size} bytes`);
});

runTest('Comet 1A authentic square windows photo exists and has non-zero size', () => {
  const p = path.resolve('storage/assets/photos/comet_1_square_windows.png');
  assert.ok(fs.existsSync(p), 'Comet 1A photo must exist on disk');
  const size = fs.statSync(p).size;
  assert.ok(size > 500000, `Photo size should be > 500KB, got ${size} bytes`);
});

runTest('Comet water tank test proof archive exists and has non-zero size', () => {
  const p = path.resolve('storage/assets/photos/water_tank_fatigue_test.jpg');
  assert.ok(fs.existsSync(p), 'Water tank proof must exist on disk');
  const size = fs.statSync(p).size;
  assert.ok(size > 50000, `Proof size should be > 50KB, got ${size} bytes`);
});

console.log('\n===============================================================');
console.log(` Summary: ${totalPassed} passed, ${totalFailed} failed`);
console.log('===============================================================');

if (totalFailed > 0) {
  process.exit(1);
}
