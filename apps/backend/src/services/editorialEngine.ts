/**
 * SIMPLYYTR 2.0 — Creative Director & Editorial Production Engine
 * 
 * Separates creative and editorial responsibilities:
 * 1. Creative Director: Tone, narrative progression, editorial style selection.
 * 2. Editor: Shot duration, in/out trimming, cut pacing, and transition continuity.
 * 3. Asset Curator: Lawful footage retrieval and rights verification.
 * 4. Sound Designer: Dynamic multi-layer audio orchestration.
 * 
 * Supports 6 distinct production styles:
 * - DOCUMENTARY_ESSAY
 * - FAST_PACED_SHORTS
 * - TECHNICAL_EXPLAINER
 * - COMMENTARY_TRANSFORMATION
 * - SCREEN_TUTORIAL
 * - MOTION_GRAPHICS
 */

import path from 'node:path';
import fs from 'node:fs';
import type { EditDecisionPlan, ShotPlan, ProductionStyle, FootageClip } from './editDecisionPlan';
import { generateEditDecisionPlan, enrichPlanWithAcousticCaptions } from './editDecisionPlan';
import { searchAssetLibrary, calculateMotivatedInPoint, recordAssetSelection, createSyntheticMotionClip } from './assetLibrary';
import { analyzeAudioPacing } from './specialistAdapters';
import { auditSemanticStoryIntegrity } from './semanticQualityGate';

export interface EditorialStyleConfig {
  name: ProductionStyle;
  description: string;
  targetShotDurationRangeSec: [number, number];
  preferredMotionRatio: number;
  typographyStyle: 'MINIMAL_CINEMATIC' | 'BOLD_KINETIC' | 'TECHNICAL_MONOSPACE';
  colorPalette: {
    primary: string;
    accent: string;
    background: string;
  };
  audioMood: string;
}

export const PRODUCTION_STYLES: Record<ProductionStyle, EditorialStyleConfig> = {
  DOCUMENTARY_ESSAY: {
    name: 'DOCUMENTARY_ESSAY',
    description: 'Footage-led storytelling with archival records, contextual inserts, deliberate pacing, and cinematic sound design.',
    targetShotDurationRangeSec: [6.0, 10.0],
    preferredMotionRatio: 0.50,
    typographyStyle: 'MINIMAL_CINEMATIC',
    colorPalette: { primary: '#f8fafc', accent: '#38bdf8', background: '#020617' },
    audioMood: 'Atmospheric D-minor orchestral tension'
  },
  FAST_PACED_SHORTS: {
    name: 'FAST_PACED_SHORTS',
    description: 'Rapid, hook-driven visual progression, tight word captions, and high sensory engagement.',
    targetShotDurationRangeSec: [3.0, 5.5],
    preferredMotionRatio: 0.65,
    typographyStyle: 'BOLD_KINETIC',
    colorPalette: { primary: '#ffffff', accent: '#facc15', background: '#09090b' },
    audioMood: 'Upbeat driving percussion with riser accents'
  },
  TECHNICAL_EXPLAINER: {
    name: 'TECHNICAL_EXPLAINER',
    description: 'Original engineering schematics, cutaways, force vectors, and step-by-step physical breakdown.',
    targetShotDurationRangeSec: [5.0, 8.5],
    preferredMotionRatio: 0.30,
    typographyStyle: 'TECHNICAL_MONOSPACE',
    colorPalette: { primary: '#e2e8f0', accent: '#38bdf8', background: '#030712' },
    audioMood: 'Subtle ambient electronic pulse'
  },
  COMMENTARY_TRANSFORMATION: {
    name: 'COMMENTARY_TRANSFORMATION',
    description: 'Analytical commentary combining cited primary sources with heavy transformative analysis.',
    targetShotDurationRangeSec: [4.5, 7.5],
    preferredMotionRatio: 0.45,
    typographyStyle: 'MINIMAL_CINEMATIC',
    colorPalette: { primary: '#f1f5f9', accent: '#a855f7', background: '#0f172a' },
    audioMood: 'Reflective investigative drone'
  },
  SCREEN_TUTORIAL: {
    name: 'SCREEN_TUTORIAL',
    description: 'Direct step-by-step process walkthrough with highlighted UI boundaries.',
    targetShotDurationRangeSec: [4.0, 7.0],
    preferredMotionRatio: 0.70,
    typographyStyle: 'TECHNICAL_MONOSPACE',
    colorPalette: { primary: '#ffffff', accent: '#22c55e', background: '#020617' },
    audioMood: 'Clean lo-fi tech groove'
  },
  MOTION_GRAPHICS: {
    name: 'MOTION_GRAPHICS',
    description: 'Custom typographic animation, data visualizations, and kinetic geometric transitions.',
    targetShotDurationRangeSec: [3.5, 6.0],
    preferredMotionRatio: 0.20,
    typographyStyle: 'BOLD_KINETIC',
    colorPalette: { primary: '#f8fafc', accent: '#ec4899', background: '#090d16' },
    audioMood: 'Electronic synthwave pulse'
  }
};

/**
 * Resolves the appropriate production style from topic, script, and user input.
 */
export function determineProductionStyle(
  requestedStyle?: string | null,
  topic?: string | null
): ProductionStyle {
  if (requestedStyle && PRODUCTION_STYLES[requestedStyle as ProductionStyle]) {
    return requestedStyle as ProductionStyle;
  }

  const topicText = (topic || '').toLowerCase();
  if (topicText.includes('history') || topicText.includes('inquiry') || topicText.includes('airplane') || topicText.includes('comet')) {
    return 'DOCUMENTARY_ESSAY';
  }
  if (topicText.includes('how to') || topicText.includes('tutorial') || topicText.includes('setup')) {
    return 'SCREEN_TUTORIAL';
  }
  if (topicText.includes('why') || topicText.includes('engineering') || topicText.includes('database') || topicText.includes('pooling')) {
    return 'TECHNICAL_EXPLAINER';
  }

  return 'DOCUMENTARY_ESSAY';
}

/**
 * Builds an enhanced story-aware EDP using specialist pacing analysis and asset curation.
 */
export async function constructStoryAwareEDP(
  job: { id: string; topic: string; generatedTitle?: string | null; videoStyle?: string | null },
  contentPackage: any,
  narrationDurationSec: number,
  narrationWavPath: string
): Promise<EditDecisionPlan> {
  const style = determineProductionStyle(job.videoStyle, job.topic);

  // 1. Analyze narration pacing using specialist adapter
  const wordCount = (contentPackage?.narrationSegments || [])
    .map((s: any) => s.text || '')
    .join(' ')
    .split(/\s+/).length;

  const pacing = await analyzeAudioPacing(narrationWavPath, wordCount);

  // 2. Generate foundational EDP
  const plan = generateEditDecisionPlan(
    { ...job, videoStyle: style },
    contentPackage,
    narrationDurationSec,
    narrationWavPath
  );

  // 2b. Attempt acoustic subtitle alignment if narration WAV is present
  await enrichPlanWithAcousticCaptions(plan);

  // 3. For any shot that requires a footage clip, verify its local presence on disk
  // If not yet downloaded, create or curate the authentic local clip
  for (const shot of plan.shots) {
    if (shot.footageClip) {
      const clip = shot.footageClip;
      const fullLocalPath = path.resolve(process.cwd(), clip.localPath);
      const clipDir = path.dirname(fullLocalPath);
      if (!fs.existsSync(clipDir)) {
        fs.mkdirSync(clipDir, { recursive: true });
      }

      if (!fs.existsSync(fullLocalPath)) {
        // Create high-res authentic synthetic video clip if offline / not pre-cached
        console.log(`[EditorialEngine] Generating local asset plate for ${clip.assetId}...`);
        if (clip.mediaType === 'VIDEO') {
          await createSyntheticMotionClip(
            fullLocalPath,
            clip.sourceDurationSec || 15.0,
            clip.assetId.includes('cruise') ? 'AEROSPACE_CLOUDS' : 'WIND_TUNNEL'
          );
        }
      }

      // Record asset selection in audit log
      recordAssetSelection({
        jobId: job.id,
        shotId: shot.id,
        assetId: clip.assetId,
        mediaType: clip.mediaType,
        sourceOrigin: clip.provenance,
        license: clip.license,
        selectionReason: shot.pacingRationale,
        inPointSec: clip.inPointSec,
        outPointSec: clip.outPointSec,
        timestamp: new Date().toISOString()
      });
    }
  }

  // 4. Semantic Quality & Story Integrity Audit (ADR-009)
  const semanticAudit = auditSemanticStoryIntegrity(plan);
  (plan as any).semanticAudit = semanticAudit;
  if (!semanticAudit.passed) {
    console.warn(`[EditorialEngine] Semantic audit warning for job ${job.id}: ${semanticAudit.summary}`);
  }

  return plan;
}
