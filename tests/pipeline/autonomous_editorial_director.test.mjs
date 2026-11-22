/**
 * SIMPLYYTR 2.0 — Autonomous Editorial Director & Semantic Intelligence Tests
 * 
 * Verifies:
 * 1. Multi-domain topic classification (Aviation, Maritime, Computing, Civil, Physics, History).
 * 2. 8-beat dramatic documentary narrative progression across diverse topics.
 * 3. Semantic asset acquisition and procedural vector illustration generation.
 * 4. Semantic quality gate evaluation (narrative continuity, WPM pacing, anti-slideshow).
 * 5. Dynamic EDP generation for arbitrary non-airplane topics without fallback degradation.
 */

import assert from 'node:assert';
import fs from 'node:fs';
import path from 'node:path';
import {
  classifyTopicDomain,
  construct8BeatNarrative
} from '../../apps/backend/src/services/editorialDirector.ts';
import { acquireAssetForBeat } from '../../apps/backend/src/services/assetAcquisition.ts';
import { auditSemanticStoryIntegrity } from '../../apps/backend/src/services/semanticQualityGate.ts';
import { generateEditDecisionPlan, validateEditDecisionPlan } from '../../apps/backend/src/services/editDecisionPlan.ts';
import { evaluateAntiSlideshowGate, evaluateRightsClearanceGate } from '../../apps/backend/src/services/qualityGates.ts';

let passed = 0;
let failed = 0;

function runTest(name, fn) {
  try {
    fn();
    console.log(`  ✓ PASS: ${name}`);
    passed++;
  } catch (err) {
    console.error(`  ✗ FAIL: ${name}`);
    console.error(`    ${err.stack || err.message}`);
    failed++;
  }
}

async function runAsyncTest(name, fn) {
  try {
    await fn();
    console.log(`  ✓ PASS: ${name}`);
    passed++;
  } catch (err) {
    console.error(`  ✗ FAIL: ${name}`);
    console.error(`    ${err.stack || err.message}`);
    failed++;
  }
}

async function runAllTests() {
  console.log('===============================================================');
  console.log(' SIMPLYYTR 2.0 Autonomous Editorial & Story Intelligence Tests');
  console.log('===============================================================\n');

  console.log('[Group 1: Multi-Domain Topic Classification]');
  runTest('Classifies aerospace and aircraft topics accurately', () => {
    assert.strictEqual(classifyTopicDomain('Why Airplane Windows Have Rounded Corners'), 'AVIATION_AEROSPACE');
    assert.strictEqual(classifyTopicDomain('Supersonic X-59 QueSST Research Flight'), 'AVIATION_AEROSPACE');
  });

  runTest('Classifies deep sea maritime and submarine topics accurately', () => {
    assert.strictEqual(classifyTopicDomain('Why Submarine Hulls Use Cylinders Instead of Boxes'), 'MARITIME_OCEAN');
    assert.strictEqual(classifyTopicDomain('How Deep Sea Submersibles Survive Mariana Trench Pressure'), 'MARITIME_OCEAN');
  });

  runTest('Classifies computing, database, and concurrency topics accurately', () => {
    assert.strictEqual(classifyTopicDomain('Why High Concurrency Crashes PostgreSQL Without Pooling'), 'COMPUTING_SYSTEMS');
    assert.strictEqual(classifyTopicDomain('How Linux Kernel Thread Scheduling Prevents CPU Thrashing'), 'COMPUTING_SYSTEMS');
  });

  runTest('Classifies civil architecture and ancient engineering topics accurately', () => {
    assert.strictEqual(classifyTopicDomain('Why Roman Aqueducts Never Collapse'), 'CIVIL_ARCHITECTURE');
    assert.strictEqual(classifyTopicDomain('The Secret Chemistry of Ancient Self-Healing Concrete'), 'CIVIL_ARCHITECTURE');
  });

  runTest('Classifies astrophysics and relativity topics accurately', () => {
    assert.strictEqual(classifyTopicDomain('What Happens at the Event Horizon of a Black Hole'), 'ASTRONOMY_PHYSICS');
  });

  runTest('Classifies historical civilization and economics topics accurately', () => {
    assert.strictEqual(classifyTopicDomain('Why the Roman Empire Collapsed From Within'), 'HISTORY_CIVILIZATION');
  });

  console.log('\n[Group 2: Structured 8-Beat Documentary Narrative Synthesis]');
  runTest('Synthesizes complete 8-beat narrative for maritime submarine topic', () => {
    const plan = construct8BeatNarrative('Why Submarines Use Cylindrical Hulls', 'DOCUMENTARY_ESSAY', 65.0);
    assert.strictEqual(plan.domain, 'MARITIME_OCEAN');
    assert.strictEqual(plan.beats.length, 8);
    assert.strictEqual(plan.narrationSegments.length, 8);
    assert.strictEqual(plan.beats[0].beatType, 'CINEMATIC_HOOK');
    assert.strictEqual(plan.beats[7].beatType, 'TAKEAWAY_LOOP_CTA');

    // Confirm all 8 beats have non-empty headlines and callouts
    for (const beat of plan.beats) {
      assert.ok(beat.headline.length > 5, `Beat ${beat.order} missing headline`);
      assert.ok(beat.calloutLabels.length >= 2, `Beat ${beat.order} missing callout labels`);
      assert.ok(beat.narrationText.length > 20, `Beat ${beat.order} narration too short`);
    }
  });

  runTest('Synthesizes complete 8-beat narrative for database concurrency topic', () => {
    const plan = construct8BeatNarrative('Why High Concurrency Crashes PostgreSQL', 'TECHNICAL_EXPLAINER', 65.0);
    assert.strictEqual(plan.domain, 'COMPUTING_SYSTEMS');
    assert.strictEqual(plan.beats.length, 8);
    assert.ok(plan.beats[3].headline.includes("LITTLE'S LAW") || plan.beats[3].subheadline.includes('throughput'));
    assert.ok(plan.beats[6].headline.includes('DATABASE DEFENSE') || plan.beats[6].calloutLabels.includes('1. TRANSACTION POOLING'));
  });

  console.log('\n[Group 3: Semantic Asset Acquisition & Procedural Plate Synthesis]');
  await runAsyncTest('Acquires authentic local footage for canonical aviation hook', async () => {
    const aviationPlan = construct8BeatNarrative('Why Airplane Windows Have Rounded Corners', 'DOCUMENTARY_ESSAY', 65.0);
    const asset = await acquireAssetForBeat(aviationPlan.beats[0], aviationPlan.proposedTitle, 8.125);
    assert.strictEqual(asset.hasFootageClip, true);
    assert.strictEqual(asset.manifestEntry.assetId, 'nasa-armd-high-altitude-cruise');
    assert.strictEqual(asset.manifestEntry.verified, true);
  });

  await runAsyncTest('Generates high-resolution procedural vector plate for submarine beat', async () => {
    const maritimePlan = construct8BeatNarrative('Why Submarines Use Cylindrical Hulls', 'DOCUMENTARY_ESSAY', 65.0);
    const asset = await acquireAssetForBeat(maritimePlan.beats[1], maritimePlan.proposedTitle, 8.125, 'scratch/test_generated_assets');
    assert.strictEqual(asset.hasFootageClip, false);
    assert.ok(asset.proceduralPlatePath, 'Must provide procedural plate path');
    assert.ok(fs.existsSync(asset.proceduralPlatePath), 'Procedural plate must exist physically on disk');
    assert.ok(fs.statSync(asset.proceduralPlatePath).size > 10000, 'Plate must be a valid non-empty PNG');
    assert.strictEqual(asset.manifestEntry.assetType, 'VECTOR_DIAGRAM');
    assert.strictEqual(asset.manifestEntry.verified, true);
  });

  console.log('\n[Group 4: Semantic Quality & Pre-Render Verification Gate]');
  runTest('Passes valid 8-beat documentary narrative with score >= 85', () => {
    const mockJob = { id: 'test_marine_job', topic: 'Why Submarines Use Cylindrical Hulls' };
    const edp = generateEditDecisionPlan(mockJob, null, 65.0, 'dummy.wav');
    const narrativePlan = construct8BeatNarrative(mockJob.topic, edp.productionStyle, 65.0);
    const audit = auditSemanticStoryIntegrity(edp, narrativePlan);
    assert.strictEqual(audit.passed, true);
    assert.ok(audit.score >= 85, `Score should be >= 85, got ${audit.score}`);
    assert.strictEqual(audit.failures.length, 0);
  });

  runTest('Rejects plan with fewer than 6 shots', () => {
    const degradedEdp = {
      shots: [
        { id: 'shot-1', duration: 8.0, compositionType: 'REAL_FOOTAGE_MOTION' },
        { id: 'shot-2', duration: 8.0, compositionType: 'VECTOR_DIAGRAM' }
      ],
      totalDurationSec: 16.0,
      assetManifest: [{ assetId: 'test-1', verified: true }]
    };
    const audit = auditSemanticStoryIntegrity(degradedEdp);
    assert.strictEqual(audit.passed, false);
    assert.ok(audit.failures.some(f => f.includes('minimum 6 shots required')));
  });

  runTest('Rejects plan with synthetic SMPTE color test pattern asset', () => {
    const defectiveEdp = {
      shots: Array(8).fill(null).map((_, i) => ({ id: `shot-${i+1}`, duration: 8.0, compositionType: 'VECTOR_DIAGRAM' })),
      totalDurationSec: 64.0,
      assetManifest: [
        { assetId: 'nasa-modern-fuselage-assembly', verified: true } // Defective test pattern
      ]
    };
    const audit = auditSemanticStoryIntegrity(defectiveEdp);
    assert.strictEqual(audit.passed, false);
    assert.ok(audit.failures.some(f => f.includes('prohibited synthetic SMPTE color test patterns')));
  });

  console.log('\n[Group 5: Dynamic End-to-End EDP Generation on Non-Aviation Topics]');
  runTest('Generates valid 8-shot EDP v2.1.0 for Ancient Rome Concrete topic', () => {
    const mockJob = {
      id: 'job_roman_concrete',
      topic: 'The Secret Chemistry of Ancient Self-Healing Concrete'
    };
    const edp = generateEditDecisionPlan(mockJob, null, 65.0, 'dummy.wav');

    assert.strictEqual(edp.version, '2.1.0');
    assert.strictEqual(edp.shots.length, 8);
    assert.ok(edp.displayTitle.includes('Concrete') || edp.displayTitle.includes('Ancient'));
    assert.ok(edp.captions.length >= 8, 'Captions must be generated for all segments');

    // Verify timeline continuity
    const validation = validateEditDecisionPlan(edp);
    assert.strictEqual(validation.valid, true, `Validation failed: ${validation.issues.join('; ')}`);

    // Verify anti-slideshow gate passes
    const antiSlideshow = evaluateAntiSlideshowGate(edp);
    assert.strictEqual(antiSlideshow.passed, true);
    assert.strictEqual(antiSlideshow.failures.length, 0);

    // Verify rights clearance gate passes
    const rights = evaluateRightsClearanceGate(edp);
    assert.strictEqual(rights.passed, true);
    assert.strictEqual(rights.failures.length, 0);
  });

  console.log('\n===============================================================');
  console.log(` Summary: ${passed} passed, ${failed} failed`);
  console.log('===============================================================');

  if (failed > 0) {
    process.exit(1);
  }
}

runAllTests().catch((e) => {
  console.error('Test execution failed:', e);
  process.exit(1);
});
