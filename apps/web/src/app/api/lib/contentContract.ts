import { z } from 'zod';
import crypto from 'node:crypto';
import { timingSafeEqualStr } from './auth';
import { verifyReceiptSignature } from './sourceRetriever';

/**
 * SIMPLYYTR 2.0 — Canonical Content Package Contract (Phase 4B)
 * 
 * Strict runtime validation boundary for topic-grounded, segment-aligned YouTube Shorts.
 * Guarantees that topic, title, hook, narration, factual claims, visual sequence,
 * captions, and call to action all strictly refer to the exact same subject.
 */

export const EvidenceStatusEnum = z.enum([
  'unverified',        // Default: No external evidence verified
  'source_located',    // Source URL or citation exists but has not been retrieved or evaluated
  'source_retrieved',  // Source document retrieved, but specific supporting excerpt not matched
  'evidence_recorded', // Primary source excerpt recorded and directly supports claim
  'operator_reviewed'  // Human operator explicitly reviewed and approved claim for script
]);
export type EvidenceStatus = z.infer<typeof EvidenceStatusEnum>;

export const RetrievalStatusEnum = z.enum([
  'NOT_ATTEMPTED',
  'SUCCESS',
  'FAILED',
  'INACCESSIBLE',
  'CACHED_PRIMARY'
]);
export type RetrievalStatus = z.infer<typeof RetrievalStatusEnum>;

export const ExcerptTypeEnum = z.enum([
  'verbatim_quote',    // Direct textual excerpt copied verbatim from retrieved source content
  'authored_summary',  // Human or AI-authored synthesis/summary of source content
  'unmatched_excerpt'  // Excerpt provided but not matched or verified against retrieved source content
]);
export type ExcerptType = z.infer<typeof ExcerptTypeEnum>;

export const CacheProvenanceSchema = z.object({
  cacheKey: z.string().min(1, 'Cache key is required'),
  cachedAt: z.string().datetime({ message: 'cachedAt must be a valid ISO 8601 UTC timestamp' }),
  integrityHash: z.string().regex(/^[a-f0-9]{64}$/i, 'integrityHash must be a 64-character SHA-256 hex string'),
  originUri: z.string().url('originUri must be a valid URL')
});
export type CacheProvenance = z.infer<typeof CacheProvenanceSchema>;

export const RetrievalReceiptSchema = z.object({
  receiptId: z.string().min(1, 'receiptId is required'),
  url: z.string().url('url must be a valid URL'),
  retrievedAt: z.string().datetime({ message: 'retrievedAt must be a valid ISO 8601 UTC timestamp' }),
  httpStatus: z.number().int().min(100).max(599),
  contentType: z.string().min(1, 'contentType is required'),
  contentHash: z.string().regex(/^[a-f0-9]{64}$/i, 'contentHash must be a 64-character SHA-256 hex string'),
  claimId: z.string().min(1, 'claimId must be a non-empty string').optional(),
  receiptSignature: z.string().optional(),
  sourceId: z.string().optional(),
  errorDetails: z.string().optional(),
  cacheProvenance: CacheProvenanceSchema.optional()
});
export type RetrievalReceipt = z.infer<typeof RetrievalReceiptSchema>;

export const FactualClaimSchema = z.object({
  id: z.string().min(1, 'Claim id is required'),
  claimText: z.string().min(5, 'Claim text must be at least 5 characters'),
  sourceRef: z.string().min(3, 'Source reference is required (standard, manual, or study)'),
  sourceUrl: z.string().url().or(z.literal('')).optional(),
  verified: z.boolean().default(false),
  evidenceStatus: EvidenceStatusEnum.default('unverified'),
  supportingExcerpt: z.string().optional(),
  excerptType: ExcerptTypeEnum.default('unmatched_excerpt'),
  retrievalStatus: RetrievalStatusEnum.default('NOT_ATTEMPTED'),
  retrievalReceipt: RetrievalReceiptSchema.optional(),
  verificationNotes: z.string().optional()
});

export const VisualPlanSchema = z.object({
  sceneType: z.enum(['MOTION_GRAPHIC', 'STOCK_VIDEO', 'ORIGINAL_DIAGRAM', 'PRODUCT_DEMO']),
  description: z.string().min(3, 'Visual scene description is required'),
  primaryText: z.string().min(2, 'Primary visual text is required'),
  secondaryText: z.string().optional(),
  badgeText: z.string().optional(),
  assetSource: z.enum(['LOCAL_SCENE_GRAPHICS', 'PEXELS', 'ORIGINAL_DIAGRAM', 'USER_PROVIDED']),
  licenseMetadata: z.object({
    licenseName: z.string().min(2),
    provenance: z.string().min(2),
    verified: z.boolean()
  }).optional()
});

export const NarrationSegmentSchema = z.object({
  id: z.string().min(1, 'Segment id is required'),
  order: z.number().int().positive('Segment order must be a positive integer'),
  text: z.string().min(5, 'Segment narration text must be at least 5 characters'),
  durationSec: z.number().positive().optional(),
  visualPlan: VisualPlanSchema
});

export const CaptionEntrySchema = z.object({
  startSec: z.number().min(0),
  endSec: z.number().min(0),
  text: z.string().min(1),
  style: z.string().optional()
});

export const ProvenanceMetadataSchema = z.object({
  source: z.string().min(3, 'Provenance source description is required'),
  generatorMode: z.enum(['AI_DIRECT', 'DETERMINISTIC_TOPIC_DEMO', 'OPERATOR_OVERRIDE']),
  license: z.string().min(2, 'License designation is required'),
  verified: z.boolean()
});

export const ContentPackageSchema = z.object({
  version: z.string().regex(/^\d+\.\d+\.\d+$/, 'Version must be semantic versioning string (e.g. 1.0.0)'),
  topic: z.string().min(3, 'Topic must be at least 3 characters'),
  audience: z.string().min(5, 'Intended audience must be specified'),
  targetProblem: z.string().min(5, 'Target viewer problem or question must be specified'),
  proposedTitle: z.string().min(5, 'Proposed title must be at least 5 characters'),
  openingHook: z.string().min(5, 'Opening hook must be at least 5 characters'),
  segments: z.array(NarrationSegmentSchema).min(2, 'At least 2 ordered narration segments are required'),
  claims: z.array(FactualClaimSchema).min(1, 'At least 1 factual claim with evidence reference is required'),
  callToAction: z.string().min(5, 'Call to action must be at least 5 characters'),
  captions: z.array(CaptionEntrySchema).optional(),
  provenance: ProvenanceMetadataSchema,
  reviewStatus: z.enum(['APPROVED', 'NEEDS_REVIEW', 'REJECTED']),
  qualityProfile: z.enum(['STANDARD', 'CINEMATIC_PRO']).default('STANDARD').optional()
});

export type FactualClaim = z.infer<typeof FactualClaimSchema>;
export type VisualPlan = z.infer<typeof VisualPlanSchema>;
export type NarrationSegment = z.infer<typeof NarrationSegmentSchema>;
export type CaptionEntry = z.infer<typeof CaptionEntrySchema>;
export type ProvenanceMetadata = z.infer<typeof ProvenanceMetadataSchema>;
export type ContentPackage = z.infer<typeof ContentPackageSchema>;

export interface ValidationResult {
  valid: boolean;
  errors: string[];
  package?: ContentPackage;
}

/**
 * Validates a ContentPackage at the pipeline boundary.
 * Rejects missing or inconsistent required fields rather than silently inventing replacements.
 */
export function validateContentPackage(data: unknown): ValidationResult {
  const errors: string[] = [];

  if (!data || typeof data !== 'object') {
    return { valid: false, errors: ['ContentPackage payload must be a non-null object.'] };
  }

  const parseResult = ContentPackageSchema.safeParse(data);
  if (!parseResult.success) {
    const issues = (parseResult.error as any).issues || (parseResult.error as any).errors || [];
    const formatted = issues.length > 0
      ? issues.map((e: any) => `${e.path?.join('.') || 'field'}: ${e.message}`)
      : [parseResult.error.message || 'Validation failed'];
    return { valid: false, errors: formatted };
  }

  const pkg = parseResult.data;

  // 1. Strict segment order check
  const orders = pkg.segments.map(s => s.order);
  for (let i = 0; i < orders.length; i++) {
    if (orders[i] !== i + 1) {
      errors.push(`Segments must be strictly ordered consecutive integers starting at 1. Found order ${orders[i]} at index ${i}.`);
    }
  }

  // 2. Narration and Hook coherence check
  const firstSegText = pkg.segments[0].text.toLowerCase().trim();
  const hookText = pkg.openingHook.toLowerCase().trim();
  if (!firstSegText.includes(hookText) && !hookText.includes(firstSegText)) {
    errors.push(`First narration segment text does not align with opening hook. Segment 1: "${pkg.segments[0].text.slice(0, 40)}...", Hook: "${pkg.openingHook.slice(0, 40)}...".`);
  }

  // 3. CTA alignment check
  const lastSegText = pkg.segments[pkg.segments.length - 1].text.toLowerCase().trim();
  const ctaText = pkg.callToAction.toLowerCase().trim();
  if (!lastSegText.includes(ctaText) && !ctaText.includes(lastSegText)) {
    // If last segment doesn't include CTA, at least check if callToAction is present in narration
    const fullNarration = pkg.segments.map(s => s.text).join(' ').toLowerCase();
    if (!fullNarration.includes(ctaText)) {
      errors.push(`Call to action is not present in narration script.`);
    }
  }

  // 4. Topic grounding check across segments
  const topicKeywords = pkg.topic.toLowerCase().split(/\s+/).filter(w => w.length > 3);
  const fullNarration = pkg.segments.map(s => s.text).join(' ').toLowerCase();
  const titleText = pkg.proposedTitle.toLowerCase();
  
  const topicMentionedInNarration = topicKeywords.some(kw => fullNarration.includes(kw));
  const topicMentionedInTitle = topicKeywords.some(kw => titleText.includes(kw));
  
  if (topicKeywords.length > 0 && (!topicMentionedInNarration || !topicMentionedInTitle)) {
    errors.push(`Both title and narration must contain keywords from requested topic "${pkg.topic}".`);
  }

  // 5. Factual claim evidence and source URL validation
  const STALE_CITATION_PATTERNS = [/ht204172/i, /dell specs/i, /sln153764/i, /000153764/i];
  const CATEGORICAL_EXAGGERATION_PATTERNS = [
    /permanently ruining/i,
    /strip anti-reflective/i,
    /strips all coatings/i,
    /permanent backlight spots/i,
    /certified safe/i,
    /guaranteed to ruin/i,
    /inevitably destroys/i
  ];

  for (const c of pkg.claims) {
    if (!c.sourceRef || c.sourceRef.trim().length < 3) {
      errors.push(`Claim "${c.id}" lacks required verifiable source reference.`);
    }

    // 5a. Retrieval Receipt & Provenance Verification
    if (c.retrievalStatus === 'SUCCESS') {
      if (!c.retrievalReceipt) {
        errors.push(`Claim "${c.id}" has retrievalStatus "SUCCESS" without a valid retrievalReceipt.`);
      } else {
        if (c.retrievalReceipt.httpStatus < 200 || c.retrievalReceipt.httpStatus >= 300) {
          errors.push(`Claim "${c.id}" has retrievalStatus "SUCCESS" but retrievalReceipt HTTP status is ${c.retrievalReceipt.httpStatus}.`);
        }
        if (!/^[a-f0-9]{64}$/i.test(c.retrievalReceipt.contentHash)) {
          errors.push(`Claim "${c.id}" retrievalReceipt contentHash is not a valid 64-character SHA-256 hex string.`);
        }
        if (c.sourceUrl && c.sourceUrl.trim().length > 0) {
          try {
            const parsedSource = new URL(c.sourceUrl);
            const parsedReceipt = new URL(c.retrievalReceipt.url);
            if (parsedSource.origin !== parsedReceipt.origin || parsedSource.pathname !== parsedReceipt.pathname) {
              errors.push(`Claim "${c.id}" sourceUrl "${c.sourceUrl}" does not match retrievalReceipt URL "${c.retrievalReceipt.url}".`);
            }
          } catch {
            // Malformed URL check handled below
          }
        }
        if (c.retrievalReceipt.claimId && c.retrievalReceipt.claimId !== c.id) {
          errors.push(`Claim "${c.id}" retrievalReceipt claimId "${c.retrievalReceipt.claimId}" does not match claim id.`);
        }
        if (c.retrievalReceipt.receiptSignature) {
          const validSig = verifyReceiptSignature({
            receiptId: c.retrievalReceipt.receiptId,
            claimId: c.retrievalReceipt.claimId || c.id,
            url: c.retrievalReceipt.url,
            contentHash: c.retrievalReceipt.contentHash,
            httpStatus: c.retrievalReceipt.httpStatus,
            receiptSignature: c.retrievalReceipt.receiptSignature
          });
          if (!validSig) {
            errors.push(`Claim "${c.id}" retrievalReceipt has an invalid or forged receiptSignature.`);
          }
        }
      }
    }

    if (c.retrievalStatus === 'CACHED_PRIMARY') {
      if (!c.retrievalReceipt) {
        errors.push(`Claim "${c.id}" has retrievalStatus "CACHED_PRIMARY" without a valid retrievalReceipt.`);
      } else if (!c.retrievalReceipt.cacheProvenance) {
        errors.push(`Claim "${c.id}" has retrievalStatus "CACHED_PRIMARY" but lacks required cacheProvenance in retrievalReceipt.`);
      } else {
        if (!/^[a-f0-9]{64}$/i.test(c.retrievalReceipt.cacheProvenance.integrityHash)) {
          errors.push(`Claim "${c.id}" cacheProvenance integrityHash is not a valid 64-character SHA-256 hex string.`);
        } else if (c.retrievalReceipt.cacheProvenance.integrityHash.toLowerCase() !== c.retrievalReceipt.contentHash.toLowerCase()) {
          errors.push(`Claim "${c.id}" cacheProvenance integrityHash does not match retrievalReceipt contentHash.`);
        }
        if (c.retrievalReceipt.claimId && c.retrievalReceipt.claimId !== c.id) {
          errors.push(`Claim "${c.id}" retrievalReceipt claimId "${c.retrievalReceipt.claimId}" does not match claim id.`);
        }
        if (c.retrievalReceipt.receiptSignature) {
          const validSig = verifyReceiptSignature({
            receiptId: c.retrievalReceipt.receiptId,
            claimId: c.retrievalReceipt.claimId || c.id,
            url: c.retrievalReceipt.url,
            contentHash: c.retrievalReceipt.contentHash,
            httpStatus: c.retrievalReceipt.httpStatus,
            receiptSignature: c.retrievalReceipt.receiptSignature
          });
          if (!validSig) {
            errors.push(`Claim "${c.id}" retrievalReceipt has an invalid or forged receiptSignature.`);
          }
        }
      }
    }

    // 5b. Retrieval status contradictory combinations
    if (c.retrievalStatus === 'NOT_ATTEMPTED') {
      if (c.verified) {
        errors.push(`Claim "${c.id}" is marked verified: true but retrievalStatus is "NOT_ATTEMPTED".`);
      }
      if (c.evidenceStatus === 'evidence_recorded' || c.evidenceStatus === 'source_retrieved') {
        errors.push(`Claim "${c.id}" has retrievalStatus "NOT_ATTEMPTED" and cannot have evidenceStatus "${c.evidenceStatus}".`);
      }
    }

    if (c.retrievalStatus === 'FAILED' || c.retrievalStatus === 'INACCESSIBLE') {
      if (c.verified) {
        errors.push(`Claim "${c.id}" with retrievalStatus "${c.retrievalStatus}" cannot be marked verified.`);
      }
      if (c.evidenceStatus === 'evidence_recorded' || c.evidenceStatus === 'source_retrieved') {
        errors.push(`Claim "${c.id}" with retrievalStatus "${c.retrievalStatus}" cannot have evidenceStatus "${c.evidenceStatus}".`);
      }
    }

    // 5c. Excerpt type bounds
    if (c.excerptType === 'authored_summary' || c.excerptType === 'unmatched_excerpt') {
      if (c.evidenceStatus === 'evidence_recorded') {
        errors.push(`Claim "${c.id}" has evidenceStatus "evidence_recorded" but excerptType is "${c.excerptType}". Only verbatim_quote can be recorded as source evidence.`);
      }
      if (c.verified) {
        errors.push(`Claim "${c.id}" has excerptType "${c.excerptType}" and cannot be marked verified: true.`);
      }
    }

    // 5d. Strict Evidence & Verification state consistency checks
    if (c.verified) {
      if (c.evidenceStatus !== 'evidence_recorded') {
        if (c.evidenceStatus === 'operator_reviewed') {
          errors.push(`Claim "${c.id}" is marked verified: true with evidenceStatus "operator_reviewed". Operator review is a workflow approval, not empirical factual verification.`);
        } else {
          errors.push(`Claim "${c.id}" is marked verified: true but evidenceStatus is "${c.evidenceStatus}". Only claims with "evidence_recorded" can be marked verified.`);
        }
      } else {
        // evidenceStatus === 'evidence_recorded'
        if (!c.supportingExcerpt || c.supportingExcerpt.trim().length < 15) {
          errors.push(`Claim "${c.id}" is marked evidence_recorded but lacks a substantive supportingExcerpt (minimum 15 characters).`);
        }
        if (!c.sourceUrl || c.sourceUrl.trim().length < 8) {
          errors.push(`Claim "${c.id}" is marked evidence_recorded but lacks a valid sourceUrl.`);
        }
        if (c.retrievalStatus !== 'SUCCESS' && c.retrievalStatus !== 'CACHED_PRIMARY') {
          errors.push(`Claim "${c.id}" is marked evidence_recorded but retrievalStatus is "${c.retrievalStatus}". It must be "SUCCESS" or "CACHED_PRIMARY".`);
        }
        if (!c.retrievalReceipt) {
          errors.push(`Claim "${c.id}" is marked verified: true but lacks required retrievalReceipt.`);
        }
        if (c.excerptType !== 'verbatim_quote') {
          errors.push(`Claim "${c.id}" is marked verified: true but excerptType is not "verbatim_quote".`);
        }
      }
    }

    // 5e. Evidence status restrictions on verified flag
    if (c.evidenceStatus === 'operator_reviewed' && c.verified) {
      errors.push(`Claim "${c.id}" has evidenceStatus "operator_reviewed" and cannot be marked verified.`);
    }
    if (c.evidenceStatus === 'source_located' && c.verified) {
      errors.push(`Claim "${c.id}" is merely source_located and cannot be marked verified without recorded evidence.`);
    }
    if (c.evidenceStatus === 'unverified' && c.verified) {
      errors.push(`Claim "${c.id}" is unverified and cannot be marked verified.`);
    }
    if (c.evidenceStatus === 'source_retrieved' && c.verified) {
      errors.push(`Claim "${c.id}" is source_retrieved without recorded evidence and cannot be marked verified.`);
    }

    // 5f. Review status bounds for unverified claims in APPROVED package
    if (!c.verified && pkg.reviewStatus === 'APPROVED' && c.evidenceStatus !== 'operator_reviewed' && c.evidenceStatus !== 'evidence_recorded') {
      errors.push(`Unverified claim "${c.id}" cannot be in APPROVED package without human verification and operator review (evidenceStatus must be "operator_reviewed").`);
    }

    // Validate sourceUrl if provided
    if (c.sourceUrl) {
      try {
        const parsed = new URL(c.sourceUrl);
        if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
          errors.push(`Claim "${c.id}" has invalid source URL protocol: ${parsed.protocol}`);
        }
      } catch {
        errors.push(`Claim "${c.id}" has malformed source URL: "${c.sourceUrl}".`);
      }
    }

    // Stale citation check in claims
    for (const pattern of STALE_CITATION_PATTERNS) {
      if (pattern.test(c.sourceRef) || (c.sourceUrl && pattern.test(c.sourceUrl))) {
        errors.push(`Claim "${c.id}" contains stale or unverified citation reference: "${c.sourceRef}". Use verified canonical documentation.`);
      }
    }

    // Categorical exaggeration check in claims
    for (const pattern of CATEGORICAL_EXAGGERATION_PATTERNS) {
      if (pattern.test(c.claimText)) {
        errors.push(`Claim "${c.id}" contains unsupported categorical claim: "${c.claimText}". Narrow to attributable manufacturer evidence.`);
      }
    }
  }

  // 6. Narration text boundaries (no stale citations or universal damage claims)
  const allNarrationText = pkg.segments.map(s => s.text).join(' ');
  for (const pattern of STALE_CITATION_PATTERNS) {
    if (pattern.test(allNarrationText) || pattern.test(pkg.proposedTitle) || pattern.test(pkg.openingHook)) {
      errors.push(`Content package contains stale citation reference in narration or title.`);
    }
  }
  for (const pattern of CATEGORICAL_EXAGGERATION_PATTERNS) {
    if (pattern.test(allNarrationText) || pattern.test(pkg.proposedTitle) || pattern.test(pkg.openingHook)) {
      errors.push(`Narration or title contains unsupported categorical damage claim.`);
    }
  }

  // 7. Model-specific guidance check for screen cleaning topics
  const isCleaningTopic = pkg.topic.toLowerCase().includes('clean') || pkg.topic.toLowerCase().includes('screen');
  if (isCleaningTopic) {
    const mentionsManualOrSpecific = /manual|specific|model|instructions/i.test(allNarrationText);
    if (!mentionsManualOrSpecific) {
      errors.push(`Screen cleaning guidance must remind viewers to check model-specific or device instructions rather than presenting a universal procedure.`);
    }
  }

  // 8. AI vs Demo honesty check
  if (pkg.provenance.generatorMode === 'DETERMINISTIC_TOPIC_DEMO') {
    if (pkg.provenance.source.toLowerCase().includes('groq') || pkg.provenance.source.toLowerCase().includes('gemini') || pkg.provenance.source.toLowerCase().includes('gpt')) {
      errors.push(`Deterministic topic demo cannot claim to be generated by live AI LLM.`);
    }
  }

  // 9. Captions synchronization check (if captions provided)
  if (pkg.captions && pkg.captions.length > 0) {
    for (let i = 0; i < pkg.captions.length; i++) {
      const cap = pkg.captions[i];
      if (cap.startSec >= cap.endSec) {
        errors.push(`Caption ${i} has invalid time interval: start ${cap.startSec}s >= end ${cap.endSec}s.`);
      }
    }
  }

  return {
    valid: errors.length === 0,
    errors,
    package: errors.length === 0 ? pkg : undefined
  };
}

/**
 * Builds authoritative ASS subtitles and synchronized caption timings from approved narration segments.
 */
export function deriveCaptionsFromSegments(
  segments: NarrationSegment[],
  totalDurationSec: number
): CaptionEntry[] {
  const wordCounts = segments.map(s => s.text.split(/\s+/).length);
  const totalWords = Math.max(wordCounts.reduce((a, b) => a + b, 0), 1);

  const captions: CaptionEntry[] = [];
  let currentSec = 0;

  for (let i = 0; i < segments.length; i++) {
    const seg = segments[i];
    const segWords = wordCounts[i];
    const segDuration = i === segments.length - 1 
      ? Math.max(totalDurationSec - currentSec, 1.0)
      : Math.round(((segWords / totalWords) * totalDurationSec) * 100) / 100;

    captions.push({
      startSec: Math.round(currentSec * 100) / 100,
      endSec: Math.round((currentSec + segDuration) * 100) / 100,
      text: seg.text.trim(),
      style: i === 0 ? 'HookStyle' : i === segments.length - 1 ? 'CtaStyle' : 'BodyStyle'
    });

    currentSec += segDuration;
  }

  return captions;
}

/**
 * Computes a deterministic SHA-256 fingerprint of the canonical content package.
 * Guarantees immutability across state transitions (approval -> lease -> render -> ready).
 */
export function computePackageFingerprint(pkg: ContentPackage): string {
  const canonical = {
    version: pkg.version,
    topic: pkg.topic.trim(),
    audience: pkg.audience.trim(),
    targetProblem: pkg.targetProblem.trim(),
    proposedTitle: pkg.proposedTitle.trim(),
    openingHook: pkg.openingHook.trim(),
    segments: pkg.segments.map(s => ({
      id: s.id,
      order: s.order,
      text: s.text.trim(),
      visualPlan: {
        sceneType: s.visualPlan.sceneType,
        description: s.visualPlan.description.trim(),
        primaryText: s.visualPlan.primaryText.trim(),
        secondaryText: s.visualPlan.secondaryText?.trim(),
        badgeText: s.visualPlan.badgeText?.trim(),
        assetSource: s.visualPlan.assetSource
      }
    })),
    claims: pkg.claims.map(c => ({
      id: c.id,
      claimText: c.claimText.trim(),
      sourceRef: c.sourceRef.trim(),
      sourceUrl: c.sourceUrl?.trim() || '',
      verified: c.verified,
      evidenceStatus: c.evidenceStatus,
      supportingExcerpt: c.supportingExcerpt?.trim() || '',
      excerptType: c.excerptType,
      retrievalStatus: c.retrievalStatus,
      receiptHash: c.retrievalReceipt?.contentHash || '',
      receiptSignature: c.retrievalReceipt?.receiptSignature || ''
    })),
    callToAction: pkg.callToAction.trim(),
    reviewStatus: pkg.reviewStatus
  };

  const serialized = JSON.stringify(canonical);
  return crypto.createHash('sha256').update(serialized).digest('hex');
}

/**
 * Validates whether a candidate ContentPackage matches an expected fingerprint.
 */
export function verifyPackageFingerprint(pkg: ContentPackage, expectedFingerprint: string): boolean {
  if (!expectedFingerprint || typeof expectedFingerprint !== 'string') return false;
  const actual = computePackageFingerprint(pkg);
  return timingSafeEqualStr(actual, expectedFingerprint);
}

