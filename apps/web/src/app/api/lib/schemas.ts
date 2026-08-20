import { z } from 'zod';

/**
 * Zod Schemas for SIMPLYYTR Peak System Architecture
 * Guarantees 100% typed runtime validation across all AI boundaries, tool outputs, and API routes.
 */

export const ClaimItemSchema = z.object({
  id: z.string(),
  claimText: z.string().min(5),
  sourceUrl: z.string().url().or(z.literal('')).optional(),
  sourceTitle: z.string().optional(),
  publishedAt: z.string().optional(),
  exactQuote: z.string().optional(),
  confidence: z.number().min(0).max(1),
  verified: z.boolean().default(true)
});

export const ClaimSetSchema = z.object({
  topic: z.string(),
  niche: z.string(),
  claims: z.array(ClaimItemSchema).min(1),
  primarySourceUrl: z.string().optional(),
  summary: z.string(),
  degraded: z.boolean().default(false),
  error: z.string().optional()
});

export const AngleCandidateSchema = z.object({
  id: z.string(),
  type: z.enum(['PATTERN_INTERRUPT', 'CONTRARIAN_TRUTH', 'PROBLEM_SOLVER', 'PSYCHOLOGICAL_PARADOX', 'DEEP_MYSTERY']),
  hookDraft: z.string().min(10),
  coreNarrative: z.string().min(20),
  targetDopamineTrigger: z.string().optional(),
  estimatedHookScore: z.number().min(0).max(100),
  monetizationFitScore: z.number().min(0).max(100)
});

export const ShotDirectionSchema = z.object({
  secondStart: z.number(),
  secondEnd: z.number(),
  shotType: z.enum(['MACRO_CLOSEUP', 'FAST_MOTION', 'REACTION_EXPRESSION', 'SATISFYING_PAYOFF', 'SPLIT_COMPARISON']),
  visualQuery: z.string(),
  visualTextOverlay: z.string().optional()
});

export const RetentionPointSchema = z.object({
  second: z.number(),
  predictedRetentionPct: z.number().min(0).max(200),
  dropOffRisk: z.enum(['LOW', 'MEDIUM', 'HIGH']),
  pacingNote: z.string()
});

export const RetentionSimulationSchema = z.object({
  averagePercentageViewed: z.string(), // e.g. "128%"
  curve: z.array(RetentionPointSchema),
  lowestRetentionSecond: z.number(),
  lowestRetentionScore: z.number(),
  passedGate: z.boolean(),
  degraded: z.boolean().default(false),
  rejectionReason: z.string().optional()
});

export const AdversaryCritiqueSchema = z.object({
  redTeamScore: z.number().min(0).max(100),
  hookVelocityGrade: z.enum(['A+', 'A', 'B', 'C', 'F']),
  objections: z.array(z.string()),
  clickbaitAccuracyRatio: z.number().min(0).max(1),
  requiredRefinements: z.array(z.string()),
  passedAdversaryGate: z.boolean(),
  degraded: z.boolean().default(false),
  blockReason: z.string().optional()
});

export const RubricGradeSchema = z.object({
  overallScore: z.number().min(0).max(100),
  hookStrength: z.number().min(0).max(10),
  informationVelocity: z.number().min(0).max(10),
  retentionCurve: z.number().min(0).max(10),
  originality: z.number().min(0).max(10),
  loopClosure: z.number().min(0).max(10),
  adSafety: z.number().min(0).max(10),
  criticNotes: z.string(),
  passed: z.boolean(),
  degraded: z.boolean().default(false)
});

export const ScriptPackageSchema = z.object({
  topic: z.string(),
  niche: z.string(),
  titles: z.array(z.string()).min(1),
  selectedTitle: z.string(),
  description: z.string(),
  tags: z.array(z.string()),
  hook: z.string().min(5),
  body: z.string().min(20),
  cta: z.string().min(5),
  fullNarrationText: z.string(),
  shotDirections: z.array(ShotDirectionSchema).default([]),
  visualPrompts: z.array(z.string()),
  videoStyle: z.enum(['PRODUCT_FIND', 'REMASTER_REACTION', 'CURIOSITY_SPLITSCREEN', 'STANDARD']),
  productName: z.string().optional(),
  productUrl: z.string().optional(),
  affiliateLink: z.string().optional(),
  pinnedCommentText: z.string().optional(),
  claimIdsMapped: z.array(z.string()).default([]),
  rubric: RubricGradeSchema,
  adversary: AdversaryCritiqueSchema.optional(),
  retentionSim: RetentionSimulationSchema.optional(),
  syntheticMediaDisclosure: z.boolean().default(true),
  degraded: z.boolean().default(false),
  blockReason: z.string().optional()
});

export type ClaimItem = z.infer<typeof ClaimItemSchema>;
export type ClaimSet = z.infer<typeof ClaimSetSchema>;
export type AngleCandidate = z.infer<typeof AngleCandidateSchema>;
export type ShotDirection = z.infer<typeof ShotDirectionSchema>;
export type RetentionSimulation = z.infer<typeof RetentionSimulationSchema>;
export type AdversaryCritique = z.infer<typeof AdversaryCritiqueSchema>;
export type RubricGrade = z.infer<typeof RubricGradeSchema>;
export type ScriptPackage = z.infer<typeof ScriptPackageSchema>;
